<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\AuditEvent;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Section;
use App\Models\User;
use App\Models\Receipt;
use App\Models\FinanceLedger;
use App\Mail\ParentReceiptMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ParentReceiptEmailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['registrar.admin_email' => 'admin@mabdc.com']);
    }

    public function test_can_email_payment_receipt_to_parents()
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

        // Create payment record
        $payment = \App\Models\Payment::query()->create([
            'enrollment_id' => $enrollment->id,
            'amount' => 1500,
            'payment_method' => 'Cash',
            'transaction_date' => now(),
            'status' => 'completed',
        ]);

        // Create receipt mapped to the payment
        $receipt = Receipt::query()->create([
            'payment_id' => $payment->id,
            'receipt_number' => 'OR-100200',
            'issued_date' => now(),
            'notes' => 'Tuition payment receipt',
        ]);

        // Create payment ledger entry
        $ledger = FinanceLedger::query()->create([
            'enrollment_id' => $enrollment->id,
            'type' => 'payment',
            'description' => 'Payment via Cash (Receipt: OR-100200)',
            'amount' => -1500,
            'transaction_date' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('finance.receipt.email', $receipt->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Mail::assertSent(ParentReceiptMail::class, function ($mail) use ($receipt) {
            return $mail->hasTo('mother@example.com') 
                && $mail->hasTo('father@example.com')
                && $mail->receipt->id === $receipt->id;
        });

        $this->assertDatabaseHas('audit_events', [
            'event_type' => 'receipt_email_sent',
            'subject_type' => Receipt::class,
            'subject_id' => $receipt->id,
        ]);
    }

    public function test_cannot_email_receipt_if_no_parent_emails_configured()
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

        $payment = \App\Models\Payment::query()->create([
            'enrollment_id' => $enrollment->id,
            'amount' => 1500,
            'payment_method' => 'Cash',
            'transaction_date' => now(),
            'status' => 'completed',
        ]);

        $receipt = Receipt::query()->create([
            'payment_id' => $payment->id,
            'receipt_number' => 'OR-100201',
            'issued_date' => now(),
        ]);

        $ledger = FinanceLedger::query()->create([
            'enrollment_id' => $enrollment->id,
            'type' => 'payment',
            'description' => 'Payment via Cash (Receipt: OR-100201)',
            'amount' => -1500,
            'transaction_date' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('finance.receipt.email', $receipt->id));

        $response->assertRedirect();
        $response->assertSessionHasErrors('email');

        Mail::assertNothingSent();
    }
}
