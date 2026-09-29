<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\AuditEvent;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Section;
use App\Models\User;
use App\Mail\ParentStatementMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ParentStatementEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['registrar.admin_email' => 'admin@mabdc.com']);
    }

    public function test_can_email_student_statement_of_account_to_parents()
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
            'mother_email' => 'mother@example.com',
            'father_email' => 'father@example.com',
        ]);
        $section = Section::query()->create([
            'academic_year_id' => $year->id,
            'name' => 'Section A',
            'level' => 'Grade 1',
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'section_id' => $section->id,
            'level' => 'Grade 1',
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($admin)
            ->post(route('learner-accounts.email-statement', $enrollment->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Mail::assertSent(ParentStatementMail::class, function ($mail) {
            return $mail->hasTo('mother@example.com') && $mail->hasTo('father@example.com');
        });

        $this->assertDatabaseHas('audit_events', [
            'event_type' => 'email_statement_sent',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
        ]);
    }

    public function test_cannot_email_statement_if_no_parent_emails_configured()
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
            'mother_email' => null,
            'father_email' => null,
        ]);
        $section = Section::query()->create([
            'academic_year_id' => $year->id,
            'name' => 'Section A',
            'level' => 'Grade 1',
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'section_id' => $section->id,
            'level' => 'Grade 1',
            'status' => 'enrolled',
        ]);

        $response = $this->actingAs($admin)
            ->post(route('learner-accounts.email-statement', $enrollment->id));

        $response->assertRedirect();
        $response->assertSessionHasErrors('email');

        Mail::assertNothingSent();
    }
}
