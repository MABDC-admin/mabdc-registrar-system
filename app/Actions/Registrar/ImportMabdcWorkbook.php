<?php

namespace App\Actions\Registrar;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\DocumentRequirement;
use App\Models\ImportBatch;
use App\Models\Learner;
use App\Models\User;
use Illuminate\Support\Arr;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportMabdcWorkbook
{
    public function __construct(
        private readonly NormalizeStudentRow $normalizeStudentRow,
    ) {}

    public function handle(
        string $path,
        AcademicYear $academicYear,
        ?User $user = null,
        string $sheetName = 'MABDC 2026-2027',
    ): ImportBatch {
        $batch = ImportBatch::query()->create([
            'academic_year_id' => $academicYear->id,
            'user_id' => $user?->id,
            'original_filename' => basename($path),
            'file_checksum' => hash_file('sha256', $path),
            'source_sheet' => $sheetName,
            'status' => 'running',
            'started_at' => now(),
            'warnings' => [],
        ]);

        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getSheetByName($sheetName);

        if ($sheet === null) {
            return $this->finishBatch($batch, 0, 0, [[
                'row' => null,
                'code' => 'missing_sheet',
                'message' => "Sheet [{$sheetName}] was not found.",
            ]], 'failed');
        }

        $rows = $sheet->toArray(null, true, true, false);
        $headers = array_map(
            fn (mixed $header): string => trim((string) $header),
            array_shift($rows) ?? [],
        );

        // Preload memory lookups to eliminate N+1 database queries
        $existingLearners = Learner::query()->get();
        $learnersByLrn = $existingLearners->whereNotNull('lrn')->groupBy('lrn');
        $learnersByNameAndBirth = $existingLearners->groupBy(function (Learner $learner) {
            return $learner->normalized_name . '_' . ($learner->birth_date?->toDateString() ?? '');
        });

        $existingEnrollments = Enrollment::query()
            ->where('academic_year_id', $academicYear->id)
            ->get()
            ->keyBy('learner_id');

        $existingDocuments = DocumentRequirement::query()
            ->whereIn('enrollment_id', $existingEnrollments->pluck('id'))
            ->get()
            ->groupBy('enrollment_id');

        $previousLevel = null;
        $importedRows = 0;
        $skippedRows = 0;
        $warnings = [];
        $totalRows = 0;

        // Wrap import inside a database transaction to speed up writes
        \Illuminate\Support\Facades\DB::transaction(function () use (
            $rows,
            $headers,
            $academicYear,
            &$learnersByLrn,
            &$learnersByNameAndBirth,
            $existingEnrollments,
            $existingDocuments,
            &$previousLevel,
            &$importedRows,
            &$skippedRows,
            &$warnings,
            &$totalRows
        ) {
            foreach ($rows as $offset => $values) {
                $excelRow = $offset + 2;

                if ($this->isBlankRow($values)) {
                    continue;
                }

                $totalRows++;
                $rawRow = $this->combineRow($headers, $values);
                $normalized = $this->normalizeStudentRow->handle($rawRow, $previousLevel);
                $previousLevel = $normalized['level'];

                if ($normalized['full_name'] === null) {
                    $skippedRows++;
                    $warnings[] = [
                        'row' => $excelRow,
                        'code' => 'blank_student_name',
                        'message' => 'Row skipped because Student Name is blank.',
                    ];

                    continue;
                }

                foreach ($normalized['warnings'] as $warning) {
                    $warnings[] = [
                        'row' => $excelRow,
                        'code' => $warning,
                        'message' => $this->warningMessage($warning),
                    ];
                }

                $hasLrnConflict = $this->hasLrnConflict($normalized, $learnersByLrn);

                if ($hasLrnConflict) {
                    $warnings[] = [
                        'row' => $excelRow,
                        'code' => 'duplicate_lrn_conflict',
                        'message' => 'LRN already exists for a different learner identity.',
                    ];
                }

                $learner = $this->upsertLearner($normalized, $hasLrnConflict, $learnersByLrn, $learnersByNameAndBirth);
                
                $enrollment = $existingEnrollments->get($learner->id);
                $enrollmentData = [
                    'level' => $normalized['level'],
                    'status' => 'active',
                    'metadata' => [
                        'source' => 'mabdc_workbook',
                        'source_row' => $excelRow,
                    ],
                ];

                if (!$enrollment) {
                    $enrollment = Enrollment::query()->create(array_merge([
                        'learner_id' => $learner->id,
                        'academic_year_id' => $academicYear->id,
                    ], $enrollmentData));
                    $existingEnrollments->put($learner->id, $enrollment);
                } else {
                    $enrollment->update($enrollmentData);
                }

                if (!$existingDocuments->has($enrollment->id)) {
                    $existingDocuments->put($enrollment->id, collect());
                }
                $enrollmentDocs = $existingDocuments->get($enrollment->id);

                foreach ($normalized['documents'] as $documentType => $status) {
                    $doc = $enrollmentDocs->firstWhere('document_type', $documentType);
                    if (!$doc) {
                        $doc = $enrollment->documentRequirements()->create([
                            'document_type' => $documentType,
                            'status' => $status,
                        ]);
                        $enrollmentDocs->push($doc);
                    } else {
                        if ($doc->status->value !== $status) {
                            $doc->update(['status' => $status]);
                        }
                    }
                }

                $importedRows++;
            }
        });

        return $this->finishBatch($batch, $importedRows, $skippedRows, $warnings, 'finished', $totalRows);
    }

    /**
     * @param  list<mixed>  $values
     */
    private function isBlankRow(array $values): bool
    {
        return collect($values)->every(fn (mixed $value): bool => trim((string) $value) === '');
    }

    /**
     * @param  list<string>  $headers
     * @param  list<mixed>  $values
     * @return array<string, mixed>
     */
    private function combineRow(array $headers, array $values): array
    {
        $row = [];

        foreach ($headers as $index => $header) {
            if ($header === '') {
                continue;
            }

            $row[$header] = $values[$index] ?? null;
        }

        return $row;
    }

    /**
     * @param  array<string, mixed>  $normalized
     * @param  \Illuminate\Support\Collection  $learnersByLrn
     * @param  \Illuminate\Support\Collection  $learnersByNameAndBirth
     */
    private function upsertLearner(
        array $normalized,
        bool $hasLrnConflict,
        &$learnersByLrn,
        &$learnersByNameAndBirth
    ): Learner {
        $attributes = $hasLrnConflict ? [] : array_filter([
            'lrn' => $normalized['lrn'],
        ]);

        $match = null;
        $nameBirthKey = $normalized['normalized_name'] . '_' . ($normalized['birth_date'] ?? '');
        
        // Always try to match by name and birthdate first to avoid duplicate student records
        if (isset($normalized['normalized_name'])) {
            $match = $learnersByNameAndBirth->get($nameBirthKey)?->first();
        }
        
        if (!$match && $normalized['lrn'] !== null && !$hasLrnConflict) {
            $match = $learnersByLrn->get($normalized['lrn'])?->first();
        }

        $data = [
            'metadata' => Arr::whereNotNull([
                'source' => 'mabdc_workbook',
            ]),
        ];

        // Safely map fields to protect existing database values from being overwritten by blank/null Excel cells
        foreach ([
            'lrn',
            'full_name',
            'normalized_name',
            'gender',
            'mother_contact_number',
            'mother_maiden_name',
            'father_contact_number',
            'father_name',
            'philippine_address',
            'uae_address',
            'previous_school',
        ] as $field) {
            $sheetVal = $normalized[$field] ?? null;
            if ($sheetVal !== null) {
                $data[$field] = $sheetVal;
            }
        }

        // Validate birth date format & reasonable year range to prevent corrupt inputs
        if ($normalized['birth_date'] !== null) {
            $year = (int) substr($normalized['birth_date'], 0, 4);
            if ($year >= 1900 && $year <= 2100) {
                $data['birth_date'] = $normalized['birth_date'];
            }
        }

        if (!$match) {
            $match = Learner::query()->create(array_merge($attributes, $data));
            
            // Push to both memory collections to guarantee next rows (or duplicate run rows) match this new record
            if ($match->lrn !== null) {
                if (!$learnersByLrn->has($match->lrn)) {
                    $learnersByLrn->put($match->lrn, collect());
                }
                $learnersByLrn->get($match->lrn)->push($match);
            }
            
            $key = $match->normalized_name . '_' . ($match->birth_date?->toDateString() ?? '');
            if (!$learnersByNameAndBirth->has($key)) {
                $learnersByNameAndBirth->put($key, collect());
            }
            $learnersByNameAndBirth->get($key)->push($match);
        } else {
            $match->update($data);
            
            // Re-cache/update the references in the lookups
            if ($match->lrn !== null) {
                if (!$learnersByLrn->has($match->lrn)) {
                    $learnersByLrn->put($match->lrn, collect());
                }
                $existing = $learnersByLrn->get($match->lrn);
                if (!$existing->contains('id', $match->id)) {
                    $existing->push($match);
                }
            }
            
            $key = $match->normalized_name . '_' . ($match->birth_date?->toDateString() ?? '');
            if (!$learnersByNameAndBirth->has($key)) {
                $learnersByNameAndBirth->put($key, collect());
            }
            $existing = $learnersByNameAndBirth->get($key);
            if (!$existing->contains('id', $match->id)) {
                $existing->push($match);
            }
        }

        return $match;
    }

    /**
     * @param  array<string, mixed>  $normalized
     * @param  \Illuminate\Support\Collection  $learnersByLrn
     */
    private function hasLrnConflict(array $normalized, $learnersByLrn): bool
    {
        if ($normalized['lrn'] === null) {
            return false;
        }

        $matches = $learnersByLrn->get($normalized['lrn']);
        if (!$matches) {
            return false;
        }

        return $matches->contains(function (Learner $learner) use ($normalized): bool {
            return $learner->normalized_name !== $normalized['normalized_name']
                && $learner->birth_date?->toDateString() !== $normalized['birth_date'];
        });
    }

    /**
     * @param  list<array{row: int|null, code: string, message: string}>  $warnings
     */
    private function finishBatch(
        ImportBatch $batch,
        int $importedRows,
        int $skippedRows,
        array $warnings,
        string $status,
        int $totalRows = 0,
    ): ImportBatch {
        $batch->update([
            'total_rows' => $totalRows,
            'imported_rows' => $importedRows,
            'skipped_rows' => $skippedRows,
            'warning_count' => count($warnings),
            'warnings' => $warnings,
            'status' => $status,
            'finished_at' => now(),
        ]);

        return $batch->refresh();
    }

    private function warningMessage(string $warning): string
    {
        return match ($warning) {
            'blank_lrn' => 'LRN is blank.',
            'blank_mother_contact' => 'Mother contact number is blank.',
            'blank_father_contact' => 'Father contact number is blank.',
            'blank_uae_address' => 'UAE address is blank.',
            'malformed_gender' => 'Gender is not M/F/Male/Female.',
            'duplicate_lrn_conflict' => 'LRN already exists for a different learner identity.',
            default => $warning,
        };
    }
}
