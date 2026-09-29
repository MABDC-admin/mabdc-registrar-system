<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\AuditEvent;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Section;
use App\Models\User;
use App\Models\InstallmentPlan;
use App\Mail\ParentInstallmentPlanMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ParentInstallmentPlanEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['registrar.admin_email' => 'admin@mabdc.com']);
    }

    public function test_can_print_installment_plan()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = Learner::query()->create([
            'full_name' => 'John Doe',
            'normalized_name' => 'JOHN DOE',
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => 'Grade 1',
            'status' => 'enrolled',
        ]);
        $plan = InstallmentPlan::query()->create([
            'enrollment_id' => $enrollment->id,
            'total_months' => 9,
            'monthly_amount' => 500,
            'start_date' => '2026-08-01',
        ]);

        $response = $this->actingAs($admin)
            ->get(route('learner-accounts.installment.show', $plan->id));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Finance/InstallmentPlan'));
    }

    public function test_can_email_installment_plan_to_parents()
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = Learner::query()->create([
            'full_name' => 'John Doe',
            'normalized_name' => 'JOHN DOE',
            'receipt_email' => 'parent@example.com',
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => 'Grade 1',
            'status' => 'enrolled',
        ]);
        $plan = InstallmentPlan::query()->create([
            'enrollment_id' => $enrollment->id,
            'total_months' => 9,
            'monthly_amount' => 500,
            'start_date' => '2026-08-01',
        ]);

        $response = $this->actingAs($admin)
            ->post(route('learner-accounts.installment.email', $plan->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Mail::assertSent(ParentInstallmentPlanMail::class, function ($mail) {
            return $mail->hasTo('parent@example.com');
        });

        $this->assertDatabaseHas('audit_events', [
            'event_type' => 'installment_plan_email_sent',
            'subject_type' => InstallmentPlan::class,
            'subject_id' => $plan->id,
        ]);
    }

    public function test_cannot_email_installment_plan_if_no_parent_emails_configured()
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $learner = Learner::query()->create([
            'full_name' => 'Jane Doe',
            'normalized_name' => 'JANE DOE',
            'receipt_email' => null,
            'mother_email' => null,
            'father_email' => null,
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => 'Grade 1',
            'status' => 'enrolled',
        ]);
        $plan = InstallmentPlan::query()->create([
            'enrollment_id' => $enrollment->id,
            'total_months' => 9,
            'monthly_amount' => 500,
            'start_date' => '2026-08-01',
        ]);

        $response = $this->actingAs($admin)
            ->post(route('learner-accounts.installment.email', $plan->id));

        $response->assertRedirect();
        $response->assertSessionHas('error');

        Mail::assertNothingSent();
    }
}
