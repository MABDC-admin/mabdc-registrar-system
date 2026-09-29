<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Learner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function learners(Request $request): StreamedResponse
    {
        $activeYear = $this->activeYear();
        $learners = $this->filteredLearners($request, $activeYear)
            ->with(['enrollments' => function ($query) use ($activeYear) {
                $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->with('documentRequirements');
            }])
            ->orderBy('full_name')
            ->get();

        return $this->csv('learner-directory.csv', function ($handle) use ($learners) {
            fputcsv($handle, [
                'Level',
                'LRN',
                'Student Name',
                'Birth Date',
                'Gender',
                'Mother Contact',
                'Father Contact',
                'UAE Address',
                'Documents OK',
                'Documents Missing',
            ]);

            foreach ($learners as $learner) {
                $enrollment = $learner->enrollments->first();
                $documents = $enrollment?->documentRequirements ?? collect();

                fputcsv($handle, [
                    $enrollment?->level,
                    $learner->lrn,
                    $learner->full_name,
                    $learner->birth_date?->toDateString(),
                    $learner->gender,
                    $learner->mother_contact_number,
                    $learner->father_contact_number,
                    $learner->uae_address,
                    $documents->where('status', DocumentStatus::Ok)->count(),
                    $documents->where('status', DocumentStatus::Missing)->count(),
                ]);
            }
        });
    }

    public function missingDocuments(Request $request): StreamedResponse
    {
        $activeYear = $this->activeYear();
        $level = trim((string) $request->query('level', ''));
        $requirements = DocumentRequirement::query()
            ->where('document_requirements.status', '!=', DocumentStatus::Ok->value)
            ->whereHas('enrollment', function (Builder $query) use ($activeYear, $level) {
                $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->when($level !== '', fn ($query) => $query->where('level', $level));
            })
            ->with(['enrollment.learner'])
            ->join('enrollments', 'document_requirements.enrollment_id', '=', 'enrollments.id')
            ->join('learners', 'enrollments.learner_id', '=', 'learners.id')
            ->orderBy('enrollments.level')
            ->orderBy('learners.full_name')
            ->select('document_requirements.*')
            ->get();

        return $this->csv('missing-documents.csv', function ($handle) use ($requirements) {
            fputcsv($handle, [
                'Level',
                'LRN',
                'Student Name',
                'Document',
                'Status',
                'Mother Contact',
                'Father Contact',
                'Notes',
            ]);

            foreach ($requirements as $requirement) {
                $enrollment = $requirement->enrollment;
                $learner = $enrollment->learner;

                fputcsv($handle, [
                    $enrollment->level,
                    $learner->lrn,
                    $learner->full_name,
                    $requirement->document_type->label(),
                    $requirement->status->value,
                    $learner->mother_contact_number,
                    $learner->father_contact_number,
                    $requirement->notes,
                ]);
            }
        });
    }

    private function activeYear(): ?AcademicYear
    {
        return AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);
    }

    private function filteredLearners(Request $request, ?AcademicYear $activeYear): Builder
    {
        $search = trim((string) $request->query('search', ''));
        $level = trim((string) $request->query('level', ''));
        $status = trim((string) $request->query('status', ''));

        return Learner::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $normalizedSearch = preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($search));

                $query->where(function (Builder $query) use ($search, $normalizedSearch) {
                    if (is_numeric(str_replace([' ', '-'], '', $search))) {
                        $query->where('lrn', 'like', "{$search}%");
                    } else {
                        $query->where('normalized_name', 'like', "{$normalizedSearch}%")
                            ->orWhere('full_name', 'like', "%{$search}%")
                            ->orWhere('normalized_name', 'like', "%{$normalizedSearch}%");
                    }
                });
            })
            ->when($level !== '', function (Builder $query) use ($activeYear, $level) {
                $query->whereHas('enrollments', fn (Builder $query) => $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->where('level', $level));
            })
            ->when($status !== '', function (Builder $query) use ($activeYear, $status) {
                $query->whereHas('enrollments', fn (Builder $query) => $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->where('status', $status));
            });
    }

    private function csv(string $filename, callable $writeRows): StreamedResponse
    {
        return response()->streamDownload(function () use ($writeRows) {
            $handle = fopen('php://output', 'w');
            $writeRows($handle);
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
