<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);
        $enrollments = Enrollment::query()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id));
        $enrollmentSubquery = (clone $enrollments)->select('id');

        return Inertia::render('Reports/Index', [
            'activeYear' => $activeYear,
            'summary' => [
                'learners' => (clone $enrollments)->distinct('learner_id')->count('learner_id'),
                'enrollments' => (clone $enrollments)->count(),
                'levels' => (clone $enrollments)->distinct('level')->count('level'),
                'documents' => DocumentRequirement::query()->whereIn('enrollment_id', $enrollmentSubquery)->count(),
            ],
            'byLevel' => (clone $enrollments)
                ->selectRaw('level, COUNT(*) as learners')
                ->groupBy('level')
                ->orderBy('level')
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'level' => $enrollment->level,
                    'learners' => (int) $enrollment->learners,
                ]),
            'byStatus' => (clone $enrollments)
                ->selectRaw('status, COUNT(*) as learners')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'status' => $enrollment->status,
                    'learners' => (int) $enrollment->learners,
                ]),
            'documentTotals' => $this->documentTotals($enrollmentSubquery),
            'exports' => [
                [
                    'title' => 'Learner Directory CSV',
                    'description' => 'Full learner list with LRN, contacts, level, and document counts.',
                    'href' => route('exports.learners'),
                ],
                [
                    'title' => 'Missing Documents CSV',
                    'description' => 'Learners with missing, expired, or pending document requirements.',
                    'href' => route('exports.missing-documents'),
                ],
            ],
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

        $verified = (int) ($counts[DocumentStatus::Verified->value] ?? 0);
        $ok = (int) ($counts[DocumentStatus::Ok->value] ?? 0);
        $pendingVerification = (int) ($counts[DocumentStatus::PendingVerification->value] ?? 0);
        $pendingReview = (int) ($counts[DocumentStatus::PendingReview->value] ?? 0);
        $submitted = (int) ($counts[DocumentStatus::Submitted->value] ?? 0);

        return [
            'ok' => $verified + $ok,
            'missing' => (int) ($counts[DocumentStatus::Missing->value] ?? 0),
            'expired' => (int) ($counts[DocumentStatus::Expired->value] ?? 0),
            'pending_review' => $pendingVerification + $pendingReview + $submitted,
        ];
    }
}
