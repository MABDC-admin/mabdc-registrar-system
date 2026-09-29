<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\Enrollment;
use App\Models\FinanceLedger;
use App\Models\GradeLevelFee;
use App\Models\Learner;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceLedgerIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function makeEnrollment(AcademicYear $year, ?Learner $learner = null, string $level = 'G1'): Enrollment
    {
        $learner ??= Learner::query()->create([
            'lrn' => (string) random_int(100000000000, 999999999999),
            'full_name' => 'DELA CRUZ, JUAN S.',
            'normalized_name' => 'DELA CRUZ JUAN S',
        ]);

        return Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => $level,
            'mode' => 'face_to_face',
            'status' => 'active',
            'financial_status' => 'No Assessment',
        ]);
    }

    private function balance(Enrollment $enrollment): float
    {
        return round((float) FinanceLedger::query()->where('enrollment_id', $enrollment->id)->sum('amount'), 2);
    }

    public function test_refund_increases_the_balance_owed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create(['name' => '2026-2027', 'is_active' => true]);
        $enrollment = $this->makeEnrollment($year);

        $enrollment->financeLedgers()->create(['type' => 'charge', 'description' => 'Tuition Fee', 'amount' => 1000, 'transaction_date' => now()]);
        $enrollment->financeLedgers()->create(['type' => 'payment', 'description' => 'Payment via Cash', 'amount' => -1000, 'transaction_date' => now()]);

        $this->actingAs($admin)->post("/finance/{$enrollment->id}/refund", [
            'amount' => 200,
            'reason' => 'Overcharge correction',
            'transaction_date' => now()->toDateString(),
        ])->assertSessionHasNoErrors();

        // Paid 1000 on a 1000 bill, 200 handed back: the learner now owes 200, not a 200 credit.
        $this->assertSame(200.0, $this->balance($enrollment));
        $this->assertSame('Partially Paid', $enrollment->fresh()->financial_status);

        // A second refund may only return what is still held (800).
        $this->actingAs($admin)->post("/finance/{$enrollment->id}/refund", [
            'amount' => 900,
            'reason' => 'Too much',
            'transaction_date' => now()->toDateString(),
        ])->assertSessionHasErrors('amount');
    }

    public function test_batch_assessment_does_not_record_unreceipted_payments(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create(['name' => '2026-2027', 'is_active' => true]);
        $enrollment = $this->makeEnrollment($year);

        GradeLevelFee::query()->create(['grade_level' => 'G1', 'mode' => 'face_to_face', 'base_tuition' => 10500]);

        $this->actingAs($admin)->post('/finance-settings/batch-assess', [
            'grade_level' => 'G1',
            'mode' => 'face_to_face',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('finance_ledgers', ['enrollment_id' => $enrollment->id, 'type' => 'charge', 'description' => 'Tuition Fee']);
        $this->assertDatabaseMissing('finance_ledgers', ['enrollment_id' => $enrollment->id, 'type' => 'payment']);
        $this->assertSame(10500.0, $this->balance($enrollment));
    }

    public function test_carry_forward_is_not_counted_as_billing_or_collections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $oldYear = AcademicYear::query()->create(['name' => '2025-2026', 'is_active' => false]);
        $year = AcademicYear::query()->create(['name' => '2026-2027', 'is_active' => true]);

        $old = $this->makeEnrollment($oldYear);
        $old->financeLedgers()->create(['type' => 'charge', 'description' => 'Tuition Fee', 'amount' => 1000, 'transaction_date' => now()->subYear()]);
        $old->financeLedgers()->create(['type' => 'payment', 'description' => 'Payment via Cash', 'amount' => -700, 'transaction_date' => now()->subYear()]);

        $new = $this->makeEnrollment($year, $old->learner);
        GradeLevelFee::query()->create(['grade_level' => 'G1', 'mode' => 'face_to_face', 'base_tuition' => 2100]);

        $this->actingAs($admin)->post('/finance-settings/batch-assess', [
            'grade_level' => 'G1',
            'mode' => 'face_to_face',
        ])->assertSessionHasNoErrors();

        // Arrears move across, balances stay correct...
        $this->assertSame(0.0, $this->balance($old));
        $this->assertSame(2400.0, $this->balance($new));

        // ...but no cash was collected and nothing new was billed for the arrears.
        $this->assertSame(-700.0, (float) FinanceLedger::query()->where('type', 'payment')->sum('amount'));
        $this->assertSame(3100.0, (float) FinanceLedger::query()->whereIn('type', ['charge', 'tax'])->sum('amount'));
    }

    public function test_settling_an_application_twice_records_one_payment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create(['name' => '2026-2027', 'is_active' => true]);

        $application = AdmissionApplication::query()->create([
            'academic_year_id' => $year->id,
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'level_applied_for' => 'G1',
            'status' => 'awaiting_downpayment',
            'classification' => 'new',
            'metadata' => ['mode' => 'face_to_face'],
        ]);

        $this->actingAs($admin)->post("/learner-accounts/applications/{$application->id}/settle", ['receipt_no' => 'OR-1001'])
            ->assertSessionHasNoErrors();
        $this->actingAs($admin)->post("/learner-accounts/applications/{$application->id}/settle", ['receipt_no' => 'OR-1002']);

        $this->assertSame(1, Payment::query()->count());
        $this->assertSame(1, FinanceLedger::query()->where('type', 'payment')->count());
        $this->assertDatabaseMissing('receipts', ['receipt_number' => 'OR-1002']);
    }
}
