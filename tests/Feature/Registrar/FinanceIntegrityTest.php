<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\AuditEvent;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function enrollmentWithCharge(float $amount = 1000): Enrollment
    {
        $year = AcademicYear::query()->create(['name' => '2026-2027', 'is_active' => true]);
        $learner = Learner::query()->create([
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA CRUZ DAHLIA THERESE S',
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'level' => 'G1',
            'status' => 'active',
            'financial_status' => 'Unpaid',
        ]);
        $enrollment->financeLedgers()->create([
            'type' => 'charge',
            'description' => 'Tuition Fee',
            'amount' => $amount,
            'transaction_date' => now(),
        ]);

        return $enrollment;
    }

    private function pay(User $user, Enrollment $enrollment, float $amount, string $receipt)
    {
        return $this->actingAs($user)->post("/finance/{$enrollment->id}/payment", [
            'amount' => $amount,
            'method' => 'Cash',
            'receipt_number' => $receipt,
            'transaction_date' => now()->format('Y-m-d'),
        ]);
    }

    public function test_payment_cannot_exceed_balance(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $enrollment = $this->enrollmentWithCharge(1000);

        $this->pay($admin, $enrollment, 1500, 'REC-1')->assertSessionHasErrors('amount');

        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseCount('receipts', 0);
    }

    public function test_refund_cannot_exceed_amount_paid(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $enrollment = $this->enrollmentWithCharge(1000);
        $this->pay($admin, $enrollment, 400, 'REC-1');

        $refund = fn (float $amount) => $this->actingAs($admin)->post("/finance/{$enrollment->id}/refund", [
            'amount' => $amount,
            'reason' => 'Withdrawal',
            'transaction_date' => now()->format('Y-m-d'),
        ]);

        $refund(500)->assertSessionHasErrors('amount');
        $refund(300)->assertSessionHasNoErrors();
        $refund(200)->assertSessionHasErrors('amount');

        $this->assertEquals(300, (float) $enrollment->financeLedgers()->where('type', 'refund')->sum('amount'));
    }

    public function test_discount_cannot_exceed_balance(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $enrollment = $this->enrollmentWithCharge(1000);

        $this->actingAs($admin)->post("/finance/{$enrollment->id}/discount", [
            'type' => 'Sibling',
            'discount_mode' => 'fixed',
            'amount' => 1500,
            'transaction_date' => now()->format('Y-m-d'),
        ])->assertSessionHasErrors('amount');

        $this->assertDatabaseMissing('finance_ledgers', ['type' => 'discount']);
    }

    public function test_payment_ledger_entries_cannot_be_edited_or_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $enrollment = $this->enrollmentWithCharge(1000);
        $this->pay($admin, $enrollment, 400, 'REC-1');
        $ledger = $enrollment->financeLedgers()->where('type', 'payment')->first();

        $this->actingAs($admin)
            ->put("/learner-accounts/{$enrollment->id}/ledgers/{$ledger->id}", [
                'transaction_date' => now()->format('Y-m-d'),
                'description' => 'changed',
                'amount' => 1,
            ])->assertSessionHasErrors('amount');
        $this->actingAs($admin)
            ->delete("/learner-accounts/{$enrollment->id}/ledgers/{$ledger->id}")
            ->assertSessionHasErrors('amount');

        $this->assertEquals(-400, (float) $ledger->fresh()->amount);
    }

    public function test_ledger_edit_and_delete_are_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $enrollment = $this->enrollmentWithCharge(1000);
        $ledger = $enrollment->financeLedgers()->first();

        $this->actingAs($admin)
            ->put("/learner-accounts/{$enrollment->id}/ledgers/{$ledger->id}", [
                'transaction_date' => now()->format('Y-m-d'),
                'description' => 'Tuition Fee (corrected)',
                'amount' => 900,
            ])->assertRedirect();
        $this->assertDatabaseHas('audit_events', ['event_type' => 'ledger_updated', 'subject_id' => $ledger->id]);

        $this->actingAs($admin)
            ->delete("/learner-accounts/{$enrollment->id}/ledgers/{$ledger->id}")
            ->assertRedirect();
        $this->assertDatabaseHas('audit_events', ['event_type' => 'ledger_deleted', 'subject_id' => $ledger->id]);
        $this->assertSame(2, AuditEvent::query()->count());
    }

    public function test_finance_role_cannot_change_admission_status_or_delete_learners(): void
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $enrollment = $this->enrollmentWithCharge();
        $application = AdmissionApplication::query()->create([
            'academic_year_id' => $enrollment->academic_year_id,
            'first_name' => 'JUAN',
            'last_name' => 'DELA CRUZ',
            'status' => 'inquiry',
        ]);

        $this->actingAs($finance)
            ->delete("/learners/{$enrollment->learner_id}")
            ->assertForbidden();
        $this->assertDatabaseHas('learners', ['id' => $enrollment->learner_id]);

        $this->actingAs($finance)
            ->patch("/admissions/{$application->id}/status", ['status' => 'registration_settled'])
            ->assertForbidden();
    }

    public function test_admission_status_must_be_a_known_value(): void
    {
        $registrar = User::factory()->create(['role' => 'registrar']);
        $enrollment = $this->enrollmentWithCharge();
        $application = AdmissionApplication::query()->create([
            'academic_year_id' => $enrollment->academic_year_id,
            'first_name' => 'JUAN',
            'last_name' => 'DELA CRUZ',
            'level_applied_for' => 'G1',
            'status' => 'inquiry',
        ]);

        $this->actingAs($registrar)
            ->patch("/admissions/{$application->id}/status", ['status' => 'anything'])
            ->assertSessionHasErrors('status');
    }
}
