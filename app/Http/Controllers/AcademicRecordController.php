<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Grade;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicRecordController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = $this->activeYear();
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'level' => trim((string) $request->query('level', '')),
        ];

        $learners = Learner::query()
            ->with(['enrollments' => function ($query) use ($activeYear) {
                $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->with(['academicYear:id,name', 'section:id,name,session', 'documentRequirements']);
            }])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $search = $filters['search'];
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
            ->when($filters['level'] !== '', function (Builder $query) use ($activeYear, $filters) {
                $query->whereHas('enrollments', fn (Builder $query) => $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->where('level', $filters['level']));
            })
            ->orderBy('full_name')
            ->paginate(18)
            ->withQueryString()
            ->through(fn (Learner $learner) => $this->recordSummary($learner));

        return Inertia::render('AcademicRecords/Index', [
            'activeYear' => $activeYear,
            'filters' => $filters,
            'learners' => $learners,
            'levels' => Enrollment::query()
                ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                ->whereNotNull('level')
                ->distinct()
                ->pluck('level')
                ->filter()
                ->values()
                ->sortBy(fn ($level) => $this->levelSortKey($level))
                ->values()
                ->toArray(),
        ]);
    }

    public function show(Learner $learner): Response
    {
        $activeYear = $this->activeYear();
        $learner->load(['enrollments' => function ($query) {
            $query
                ->with(['academicYear:id,name', 'section:id,name,session', 'documentRequirements', 'grades'])
                ->latest('id');
        }]);

        return Inertia::render('AcademicRecords/Show', [
            'activeYear' => $activeYear,
            'learner' => [
                'id' => $learner->id,
                'lrn' => $learner->lrn,
                'full_name' => $learner->full_name,
                'birth_date' => $learner->birth_date?->toDateString(),
                'gender' => $learner->gender,
                'previous_school' => $learner->previous_school,
                'profile_url' => route('learners.show', $learner),
                'enrollments' => $learner->enrollments->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->id,
                    'level' => $enrollment->level,
                    'section' => $enrollment->section?->name,
                    'session' => $enrollment->section?->session ?? $enrollment->session,
                    'status' => $enrollment->status,
                    'academic_year' => $enrollment->academicYear?->name,
                    'enrolled_on' => $enrollment->enrolled_on?->toDateString(),
                    'documents' => $this->documentSummary($enrollment),
                    'grades' => $enrollment->grades->map(fn (Grade $grade) => [
                        'id' => $grade->id,
                        'subject' => $grade->subject,
                        'q1' => $grade->q1,
                        'q2' => $grade->q2,
                        'q3' => $grade->q3,
                        'q4' => $grade->q4,
                        'final_grade' => $grade->final_grade,
                        'remarks' => $grade->remarks,
                    ]),
                ]),
            ],
        ]);
    }

    public function store(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'grades' => ['required', 'array'],
            'grades.*.subject' => ['required', 'string', 'max:255'],
            'grades.*.q1' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.q2' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.q3' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.q4' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.final_grade' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.remarks' => ['nullable', 'string', 'max:255'],
        ]);

        // Clear existing grades for this enrollment to handle deletions
        $enrollment->grades()->delete();

        foreach ($validated['grades'] as $gradeData) {
            $enrollment->grades()->create($gradeData);
        }

        return redirect()->back()->with('success', 'Academic records updated successfully.');
    }

    private function activeYear(): ?AcademicYear
    {
        return AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);
    }

    private function recordSummary(Learner $learner): array
    {
        $enrollment = $learner->enrollments->first();

        return [
            'id' => $learner->id,
            'lrn' => $learner->lrn,
            'full_name' => $learner->full_name,
            'birth_date' => $learner->birth_date?->toDateString(),
            'gender' => $learner->gender,
            'current_level' => $enrollment?->level,
            'section' => $enrollment?->section?->name,
            'session' => $enrollment?->section?->session ?? $enrollment?->session,
            'status' => $enrollment?->status,
            'academic_year' => $enrollment?->academicYear?->name,
            'documents' => $enrollment ? $this->documentSummary($enrollment) : [
                'ok' => 0,
                'missing' => 0,
                'pending_review' => 0,
                'total' => 0,
            ],
            'has_grades' => $enrollment ? $enrollment->grades()->exists() : false,
        ];
    }

    private function documentSummary(Enrollment $enrollment): array
    {
        $documents = $enrollment->documentRequirements;

        return [
            'ok' => $documents->whereIn('status', [DocumentStatus::Verified, DocumentStatus::Ok])->count(),
            'missing' => $documents->where('status', DocumentStatus::Missing)->count(),
            'pending_review' => $documents->whereIn('status', [DocumentStatus::PendingVerification, DocumentStatus::PendingReview, DocumentStatus::Submitted])->count(),
            'total' => $documents->where('status', '!=', DocumentStatus::NotApplicable)->count(),
        ];
    }

    private function levelSortKey(?string $level): string
    {
        $normalized = strtoupper(trim((string) $level));
        $compact = preg_replace('/[^A-Z0-9]+/', '', $normalized) ?? '';

        if (preg_match('/^(?:L|LEVEL)0*([0-9]+)/', $compact, $matches) === 1) {
            return sprintf('001-%02d-%s', (int) $matches[1], $compact);
        }

        if (preg_match('/^(?:G|GR|GRP|GROUP|GRADE)0*([0-9]+)/', $compact, $matches) === 1) {
            return sprintf('002-%02d-%s', (int) $matches[1], $compact);
        }

        if (preg_match('/^0*([0-9]+)/', $compact, $matches) === 1) {
            return sprintf('003-%02d-%s', (int) $matches[1], $compact);
        }

        return '999-'.$compact;
    }
}
