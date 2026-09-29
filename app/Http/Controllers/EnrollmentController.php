<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\Section;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function __invoke(): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name', 'starts_on', 'ends_on']);

        $enrollments = Enrollment::activeYear()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id));

        $enrollmentSubquery = (clone $enrollments)->select('id');

        return Inertia::render('Enrollments/Index', [
            'activeYear' => $activeYear ? [
                'id' => $activeYear->id,
                'name' => $activeYear->name,
                'starts_on' => $activeYear->starts_on?->toDateString(),
                'ends_on' => $activeYear->ends_on?->toDateString(),
            ] : null,
            'totals' => [
                'enrollments' => (clone $enrollments)->count(),
                'active' => (clone $enrollments)->where('status', 'active')->count(),
                'levels' => (clone $enrollments)->distinct('level')->count('level'),
                'sections' => Section::query()
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->count(),
            ],
            'byLevel' => (clone $enrollments)
                ->selectRaw('level, COUNT(*) as total')
                ->groupBy('level')
                ->orderBy('level')
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'level' => $enrollment->level,
                    'total' => (int) $enrollment->total,
                ]),
            'sections' => Section::query()
                ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                ->withCount('enrollments')
                ->orderBy('level')
                ->orderBy('name')
                ->get(['id', 'level', 'name', 'session', 'teacher_name'])
                ->map(fn (Section $section) => [
                    'id' => $section->id,
                    'level' => $section->level,
                    'name' => $section->name,
                    'session' => $section->session,
                    'teacher_name' => $section->teacher_name,
                    'learners' => $section->enrollments_count,
                ]),
            'documentTotals' => $this->documentTotals($enrollmentSubquery),
            'recentEnrollments' => Enrollment::activeYear()
                ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                ->with(['learner:id,full_name,lrn', 'section:id,name,session', 'academicYear:id,name'])
                ->latest('id')
                ->limit(12)
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->id,
                    'learner_id' => $enrollment->learner_id,
                    'learner_name' => $enrollment->learner?->full_name,
                    'lrn' => $enrollment->learner?->lrn,
                    'level' => $enrollment->level,
                    'section' => $enrollment->section?->name,
                    'session' => $enrollment->section?->session ?? $enrollment->session,
                    'status' => $enrollment->status,
                    'enrolled_on' => $enrollment->enrolled_on?->toDateString(),
                    'academic_year' => $enrollment->academicYear?->name,
                ]),
        ]);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder  $enrollmentSubquery
     * @return array<string, int>
     */
    private function documentTotals($enrollmentSubquery): array
    {
        $counts = DocumentRequirement::query()
            ->selectRaw('status, COUNT(*) as total')
            ->whereIn('enrollment_id', $enrollmentSubquery)
            ->groupBy('status')
            ->pluck('total', 'status');

        return [
            'ok' => (int) ($counts[DocumentStatus::Ok->value] ?? 0),
            'missing' => (int) ($counts[DocumentStatus::Missing->value] ?? 0),
            'expired' => (int) ($counts[DocumentStatus::Expired->value] ?? 0),
            'pending_review' => (int) ($counts[DocumentStatus::PendingReview->value] ?? 0),
        ];
    }
}
