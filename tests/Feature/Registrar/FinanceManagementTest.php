<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\User;
use App\Models\FeeStructure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_fee_structure_to_level_learners(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);

        $learner1 = Learner::query()->create([
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA CRUZ DAHLIA THERESE S',
        ]);
        $enrollment1 = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner1->id,
            'level' => 'G1',
            'status' => 'active',
            'financial_status' => 'No Assessment',
        ]);

        $learner2 = Learner::query()->create([
            'lrn' => '109806170059',
            'full_name' => 'DELA CRUZ, JUAN S.',
            'normalized_name' => 'DELA CRUZ JUAN S',
        ]);
        $enrollment2 = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner2->id,
            'level' => 'G2',
            'status' => 'active',
            'financial_status' => 'No Assessment',
        ]);

        $fee = FeeStructure::query()->create([
            'name' => 'Lab Fee',
            'type' => 'misc',
            'amount' => 200,
            'level' => 'G1',
            'is_active' => true,
            'is_optional' => false,
        ]);

        $response = $this->actingAs($admin)
            ->post("/finance/fees/{$fee->id}/assign", [
                'enrollment_ids' => [$enrollment1->id]
            ]);

        $response->assertRedirect();
        
        // G1 student gets charged
        $this->assertDatabaseHas('finance_ledgers', [
            'enrollment_id' => $enrollment1->id,
            'type' => 'charge',
            'description' => 'Lab Fee',
            'amount' => 200,
        ]);
        
        $this->assertDatabaseHas('finance_ledgers', [
            'enrollment_id' => $enrollment1->id,
            'type' => 'tax',
            'description' => 'UAE VAT (5%) on Lab Fee',
            'amount' => 10,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'event_type' => 'charge_applied',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment1->id,
        ]);

        $this->assertEquals('Unpaid', $enrollment1->refresh()->financial_status);

        // G2 student is NOT charged
        $this->assertDatabaseMissing('finance_ledgers', [
            'enrollment_id' => $enrollment2->id,
            'description' => 'Lab Fee',
        ]);
    }

    public function test_admin_can_apply_percentage_and_fixed_discount_to_ledger(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);

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

        // Add some base charge and tax
        $enrollment->financeLedgers()->create([
            'type' => 'charge',
            'description' => 'Tuition Fee',
            'amount' => 1000,
            'transaction_date' => now(),
        ]);
        $enrollment->financeLedgers()->create([
            'type' => 'tax',
            'description' => 'VAT',
            'amount' => 50,
            'transaction_date' => now(),
        ]);

        // 1. Percentage discount (e.g. 10% of 1050 = 105)
        $response = $this->actingAs($admin)
            ->post("/learner-accounts/{$enrollment->id}/discount", [
                'type' => 'Sibling Discount',
                'discount_mode' => 'percent',
                'percent' => 10,
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $this->assertDatabaseHas('finance_ledgers', [
            'enrollment_id' => $enrollment->id,
            'type' => 'discount',
            'description' => 'Discount: Sibling Discount (10%)',
            'amount' => -105,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'event_type' => 'discount_applied',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
        ]);

        // 2. Fixed discount (e.g. 50 AED)
        $response = $this->actingAs($admin)
            ->post("/learner-accounts/{$enrollment->id}/discount", [
                'type' => 'Scholarship',
                'discount_mode' => 'fixed',
                'amount' => 50,
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('finance_ledgers', [
            'enrollment_id' => $enrollment->id,
            'type' => 'discount',
            'description' => 'Discount: Scholarship',
            'amount' => -50,
        ]);
    }

    public function test_admin_can_view_finance_reports(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)
            ->get('/finance/reports');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Finance/Reports')
            );
            
        // Test PDF exports
        $responseOutstanding = $this->actingAs($admin)
            ->get('/finance/reports/export-outstanding');
        $responseOutstanding->assertOk();
        
        $responseCollections = $this->actingAs($admin)
            ->get('/finance/reports/export-collections');
        $responseCollections->assertOk();
    }

    public function test_admin_can_record_payment_with_optional_reference_number(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);

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
            'amount' => 5000,
            'transaction_date' => now(),
        ]);

        // Record a Cash payment (no reference number)
        $response = $this->actingAs($admin)
            ->post("/learner-accounts/{$enrollment->id}/payment", [
                'amount' => 500,
                'method' => 'Cash',
                'receipt_number' => 'REC-1111',
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payments', [
            'enrollment_id' => $enrollment->id,
            'payment_method' => 'Cash',
            'amount' => 500,
            'reference_number' => null,
        ]);
        $this->assertDatabaseHas('finance_ledgers', [
            'enrollment_id' => $enrollment->id,
            'type' => 'payment',
            'description' => 'Payment via Cash (Receipt: REC-1111)',
            'amount' => -500,
        ]);

        // Record a Bank Transfer payment (with reference number)
        $response = $this->actingAs($admin)
            ->post("/learner-accounts/{$enrollment->id}/payment", [
                'amount' => 1200,
                'method' => 'Bank Transfer',
                'receipt_number' => 'REC-2222',
                'reference_number' => 'TXN-BANK-998877',
                'transaction_date' => now()->format('Y-m-d'),
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('payments', [
            'enrollment_id' => $enrollment->id,
            'payment_method' => 'Bank Transfer',
            'amount' => 1200,
            'reference_number' => 'TXN-BANK-998877',
        ]);
        $this->assertDatabaseHas('finance_ledgers', [
            'enrollment_id' => $enrollment->id,
            'type' => 'payment',
            'description' => 'Payment via Bank Transfer (Receipt: REC-2222 | Ref: TXN-BANK-998877)',
            'amount' => -1200,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'event_type' => 'payment_recorded',
            'subject_type' => \App\Models\Payment::class,
        ]);
    }
}
