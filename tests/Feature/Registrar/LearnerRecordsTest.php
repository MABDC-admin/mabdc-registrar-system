<?php

namespace Tests\Feature\Registrar;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Models\AcademicYear;
use App\Models\AuditEvent;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearnerRecordsTest extends TestCase
{
    use RefreshDatabase;

    public function test_registrar_can_search_and_filter_learner_records(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $match = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
            'gender' => 'F',
            'mother_contact_number' => '052 564 1750',
            'father_contact_number' => '056 205 1322',
            'uae_address' => 'Abu Dhabi',
        ], 'L1');
        $this->createLearnerWithEnrollment($year, [
            'lrn' => '411103250026',
            'full_name' => 'JEYASEELAN, SAMUEL ZANE D.',
            'normalized_name' => 'JEYASEELAN SAMUEL ZANE D',
            'gender' => 'M',
        ], 'G1');

        $this->actingAs($user)
            ->get('/learners?search=dahlia&level=L1&status=active')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Learners/Index')
                ->where('filters.search', 'dahlia')
                ->where('filters.level', 'L1')
                ->where('filters.status', 'active')
                ->where('learners.total', 1)
                ->where('learners.data.0.id', $match->id)
                ->where('learners.data.0.full_name', 'STA. CRUZ, DAHLIA THERESE S.')
                ->where('learners.data.0.current_enrollment.level', 'L1')
                ->where('learners.data.0.document_summary.ok', 5)
                ->where('learners.data.0.document_summary.missing', 0)
                ->has('levels', 2)
            );
    }

    public function test_registrar_can_open_learner_profile_with_documents(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
            'birth_date' => '2020-11-15',
            'gender' => 'F',
            'mother_maiden_name' => 'Geralyn Soriano',
            'mother_contact_number' => '052 564 1750',
            'father_name' => 'Julius Sta. Cruz',
            'father_contact_number' => '056 205 1322',
            'philippine_address' => 'Pangasinan',
            'uae_address' => 'Abu Dhabi',
            'previous_school' => 'Previous Academy',
        ], 'L1');
        DocumentRequirement::query()
            ->whereHas('enrollment', fn ($query) => $query->where('learner_id', $learner->id))
            ->where('document_type', DocumentType::Passport->value)
            ->update(['status' => DocumentStatus::Missing->value]);

        $this->actingAs($user)
            ->get("/learners/{$learner->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Learners/Show')
                ->where('learner.full_name', 'STA. CRUZ, DAHLIA THERESE S.')
                ->where('learner.current_enrollment.level', 'L1')
                ->where('learner.document_summary.ok', 4)
                ->where('learner.document_summary.missing', 1)
                ->has('learner.document_requirements', 5)
                ->where('learner.document_requirements.2.document_type', DocumentType::Passport->value)
                ->where('learner.document_requirements.2.status', DocumentStatus::Missing->value)
            );
    }

    public function test_registrar_can_open_learner_edit_form(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
            'birth_date' => '2020-11-15',
            'gender' => 'F',
        ], 'L1');

        $this->actingAs($user)
            ->get("/learners/{$learner->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Learners/Edit')
                ->where('learner.id', $learner->id)
                ->where('learner.full_name', 'STA. CRUZ, DAHLIA THERESE S.')
                ->where('learner.current_enrollment.level', 'L1')
            );
    }

    public function test_registrar_can_update_learner_profile_with_audit_event(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
            'gender' => 'F',
        ], 'L1');

        $this->actingAs($user)
            ->patch("/learners/{$learner->id}", [
                'lrn' => '109806170099',
                'full_name' => 'STA. CRUZ, DAHLIA T.',
                'birth_date' => '2020-11-16',
                'gender' => 'Female',
                'mother_maiden_name' => 'Geralyn Soriano',
                'mother_contact_number' => '052 564 1750',
                'father_name' => 'Julius Sta. Cruz',
                'father_contact_number' => '056 205 1322',
                'philippine_address' => 'Pangasinan',
                'uae_address' => 'Abu Dhabi',
                'previous_school' => 'Previous Academy',
            ])
            ->assertRedirect("/learners/{$learner->id}");

        $learner->refresh();
        $this->assertSame('109806170099', $learner->lrn);
        $this->assertSame('STA. CRUZ, DAHLIA T.', $learner->full_name);
        $this->assertSame('STA CRUZ DAHLIA T', $learner->normalized_name);
        $this->assertSame('2020-11-16', $learner->birth_date?->toDateString());
        $this->assertDatabaseHas('audit_events', [
            'actor_id' => $user->id,
            'event_type' => 'learner.updated',
            'subject_type' => Learner::class,
            'subject_id' => $learner->id,
        ]);
    }

    public function test_registrar_can_disable_current_learner_enrollment_with_audit_event(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
        ], 'L1');

        $this->actingAs($user)
            ->patch("/learners/{$learner->id}/disable")
            ->assertRedirect('/learners');

        $enrollment = $learner->enrollments()->firstOrFail();
        $this->assertSame('disabled', $enrollment->status);
        $this->assertSame($user->id, $enrollment->metadata['disabled_by']);
        $this->assertDatabaseHas('audit_events', [
            'actor_id' => $user->id,
            'event_type' => 'learner.disabled',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
        ]);
    }

    public function test_registrar_can_delete_learner_record_with_audit_event(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
        ], 'L1');

        $this->actingAs($user)
            ->delete("/learners/{$learner->id}")
            ->assertRedirect('/learners');

        $this->assertDatabaseMissing('learners', [
            'id' => $learner->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'actor_id' => $user->id,
            'event_type' => 'learner.deleted',
            'subject_type' => Learner::class,
            'subject_id' => $learner->id,
        ]);
    }

    public function test_registrar_can_update_document_requirement_with_audit_event(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
        ], 'L1');
        $documentRequirement = DocumentRequirement::query()
            ->whereHas('enrollment', fn ($query) => $query->where('learner_id', $learner->id))
            ->where('document_type', DocumentType::Passport->value)
            ->firstOrFail();

        $this->actingAs($user)
            ->patch("/learners/{$learner->id}/documents/{$documentRequirement->id}", [
                'status' => DocumentStatus::Ok->value,
                'expires_on' => '2031-08-01',
                'notes' => 'Verified original passport copy.',
            ])
            ->assertRedirect("/learners/{$learner->id}");

        $documentRequirement->refresh();
        $this->assertSame(DocumentStatus::Ok, $documentRequirement->status);
        $this->assertSame('2031-08-01', $documentRequirement->expires_on?->toDateString());
        $this->assertSame('Verified original passport copy.', $documentRequirement->notes);
        $this->assertDatabaseHas('audit_events', [
            'actor_id' => $user->id,
            'event_type' => 'document_requirement.updated',
            'subject_type' => DocumentRequirement::class,
            'subject_id' => $documentRequirement->id,
        ]);

        $auditEvent = AuditEvent::query()->firstOrFail();
        $this->assertSame(DocumentStatus::Ok->value, $auditEvent->after['status']);
        $this->assertSame('2031-08-01', $auditEvent->after['expires_on']);
        $this->assertSame($learner->id, $auditEvent->metadata['learner_id']);
    }

    public function test_document_update_must_belong_to_learner(): void
    {
        $user = User::factory()->create();
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA. CRUZ DAHLIA THERESE S',
        ], 'L1');
        $otherLearner = $this->createLearnerWithEnrollment($year, [
            'lrn' => '411103250026',
            'full_name' => 'JEYASEELAN, SAMUEL ZANE D.',
            'normalized_name' => 'JEYASEELAN SAMUEL ZANE D',
        ], 'G1');
        $otherDocument = DocumentRequirement::query()
            ->whereHas('enrollment', fn ($query) => $query->where('learner_id', $otherLearner->id))
            ->firstOrFail();

        $this->actingAs($user)
            ->patch("/learners/{$learner->id}/documents/{$otherDocument->id}", [
                'status' => DocumentStatus::Ok->value,
            ])
            ->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $learnerAttributes
     */
    private function createLearnerWithEnrollment(AcademicYear $year, array $learnerAttributes, string $level): Learner
    {
        $learner = Learner::query()->create($learnerAttributes);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => $level,
            'status' => 'active',
        ]);

        foreach (DocumentType::cases() as $documentType) {
            DocumentRequirement::query()->create([
                'enrollment_id' => $enrollment->id,
                'document_type' => $documentType->value,
                'status' => DocumentStatus::Ok->value,
            ]);
        }

        return $learner;
    }
}
