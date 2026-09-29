<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\ImportBatch;
use App\Models\AuditEvent;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);
            
        $enrollmentSubquery = Enrollment::activeYear()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
            ->select('id');
            
        $latestImport = ImportBatch::query()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
            ->latest()
            ->first([
                'id',
                'original_filename',
                'imported_rows',
                'skipped_rows',
                'warning_count',
                'warnings',
                'status',
                'created_at',
            ]);

        $recentActivities = AuditEvent::with('actor:id,name')
            ->latest()
            ->take(8)
            ->get(['id', 'actor_id', 'event_type', 'subject_type', 'created_at'])
            ->map(fn ($event) => [
                'id' => $event->id,
                'actor' => $event->actor ? $event->actor->name : 'System',
                'event_type' => $event->event_type,
                'subject_type' => class_basename($event->subject_type),
                'created_at' => $event->created_at->diffForHumans(),
            ]);

        return Inertia::render('Dashboard', [
            'activeYear' => $activeYear,
            'totals' => [
                'learners' => Enrollment::activeYear()
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->whereNotIn('status', ['withdrawn', 'transferred'])
                    ->distinct('learner_id')
                    ->count('learner_id'),
                'enrollments' => Enrollment::activeYear()
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->whereNotIn('status', ['withdrawn', 'transferred'])
                    ->count(),
                'withdrawn_transferred' => Enrollment::activeYear()
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->whereIn('status', ['withdrawn', 'transferred'])
                    ->count(),
                'new_applications' => 0, // Mocked for Admissions Module
                'for_assessment' => 0, // Mocked for Admissions Module
                'document_requirements' => DocumentRequirement::query()
                    ->whereIn('enrollment_id', $enrollmentSubquery)
                    ->count(),
            ],
            'documentTotals' => $this->documentTotals($enrollmentSubquery),
            'byLevel' => Enrollment::activeYear()
                ->selectRaw('level, COUNT(*) as learners')
                ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                ->groupBy('level')
                ->get()
                ->map(fn (Enrollment $enrollment) => [
                    'level' => $enrollment->level,
                    'learners' => (int) $enrollment->learners,
                ])
                ->sortBy(fn (array $level) => $this->levelSortKey($level['level']))
                ->values(),
            'recentActivities' => $recentActivities,
            'latestImport' => $latestImport,
            'duplicateLrnWarnings' => collect($latestImport?->warnings ?? [])
                ->where('code', 'duplicate_lrn_conflict')
                ->values(),
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
            'verified' => $verified,
            'missing' => (int) ($counts[DocumentStatus::Missing->value] ?? 0),
            'pending_verification' => $pendingVerification,
            'submitted' => $submitted,
            'not_applicable' => (int) ($counts[DocumentStatus::NotApplicable->value] ?? 0),
            'ok' => $verified + $ok,
            'pending_review' => $pendingVerification + $pendingReview + $submitted,
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
