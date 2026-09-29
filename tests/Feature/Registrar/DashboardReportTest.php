<?php

namespace Tests\Feature\Registrar;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\ImportBatch;
use App\Models\Learner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_registrar_dashboard_shows_active_year_reporting(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $this->createLearnerWithDocuments($year, 'L1', DocumentStatus::Missing);
        $this->createLearnerWithDocuments($year, 'L1', DocumentStatus::Ok);
        $this->createLearnerWithDocuments($year, 'L2', DocumentStatus::Ok);
        $this->createLearnerWithDocuments($year, 'G1', DocumentStatus::PendingReview);
        $this->createLearnerWithDocuments($year, 'G12', DocumentStatus::Ok);
        $this->createLearnerWithDocuments($year, 'G2', DocumentStatus::Ok);
        ImportBatch::query()->create([
            'academic_year_id' => $year->id,
            'user_id' => $user->id,
            'original_filename' => 'MABDC 2026-2027.xlsx',
            'file_checksum' => str_repeat('a', 64),
            'imported_rows' => 396,
            'skipped_rows' => 0,
            'warning_count' => 117,
            'warnings' => [
                ['row' => 60, 'code' => 'duplicate_lrn_conflict', 'message' => 'LRN 411103250026 conflicts with another learner.'],
                ['row' => 68, 'code' => 'blank_mother_contact', 'message' => 'Mother contact is blank.'],
            ],
            'status' => 'finished',
        ]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('activeYear.name', '2026-2027')
                ->where('totals.learners', 6)
                ->where('totals.enrollments', 6)
                ->where('totals.document_requirements', 30)
                ->where('documentTotals.ok', 28)
                ->where('documentTotals.missing', 1)
                ->where('documentTotals.pending_review', 1)
                ->where('byLevel.0.level', 'L1')
                ->where('byLevel.0.learners', 2)
                ->where('byLevel.1.level', 'L2')
                ->where('byLevel.2.level', 'G1')
                ->where('byLevel.3.level', 'G2')
                ->where('byLevel.4.level', 'G12')
                ->where('byLevel.1.learners', 1)
                ->where('latestImport.imported_rows', 396)
                ->has('duplicateLrnWarnings', 1)
                ->where('duplicateLrnWarnings.0.row', 60)
            );
    }

    private function createLearnerWithDocuments(
        AcademicYear $year,
        string $level,
        DocumentStatus $notOkStatus,
    ): void {
        $learner = Learner::query()->create([
            'lrn' => fake()->numerify('############'),
            'full_name' => fake()->name(),
            'normalized_name' => strtoupper(fake()->name()),
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => $level,
            'status' => 'active',
        ]);

        foreach (DocumentType::cases() as $index => $documentType) {
            DocumentRequirement::query()->create([
                'enrollment_id' => $enrollment->id,
                'document_type' => $documentType->value,
                'status' => $index === 0 ? $notOkStatus->value : DocumentStatus::Ok->value,
            ]);
        }
    }
}
