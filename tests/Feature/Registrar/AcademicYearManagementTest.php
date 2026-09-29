<?php

namespace Tests\Feature\Registrar;

use App\Models\AcademicYear;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicYearManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_academic_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/academic-years', [
                'name' => '2027-2028',
                'starts_on' => '2027-08-01',
                'ends_on' => '2028-07-31',
            ])
            ->assertRedirect('/users');

        $year = AcademicYear::query()->where('name', '2027-2028')->firstOrFail();
        $this->assertSame('2027-08-01', $year->starts_on->toDateString());
        $this->assertSame('2028-07-31', $year->ends_on->toDateString());
        $this->assertFalse($year->is_active);
    }

    public function test_admin_can_update_academic_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create([
            'name' => '2027-2028',
            'starts_on' => '2027-08-01',
            'ends_on' => '2028-07-31',
        ]);

        $this->actingAs($admin)
            ->patch("/academic-years/{$year->id}", [
                'name' => '2027-2029',
                'starts_on' => '2027-08-01',
                'ends_on' => '2029-07-31',
            ])
            ->assertRedirect('/users');

        $this->assertSame('2027-2029', $year->refresh()->name);
    }

    public function test_admin_can_activate_academic_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year1 = AcademicYear::query()->create(['name' => '2027-2028', 'is_active' => true]);
        $year2 = AcademicYear::query()->create(['name' => '2028-2029', 'is_active' => false]);

        $this->actingAs($admin)
            ->post("/academic-years/{$year2->id}/activate")
            ->assertRedirect('/users');

        $this->assertFalse($year1->refresh()->is_active);
        $this->assertTrue($year2->refresh()->is_active);
    }

    public function test_admin_cannot_delete_active_academic_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $year = AcademicYear::query()->create(['name' => '2027-2028', 'is_active' => true]);

        $this->actingAs($admin)
            ->delete("/academic-years/{$year->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('academic_years', ['id' => $year->id]);
    }

    public function test_non_admin_cannot_manage_academic_years(): void
    {
        $registrar = User::factory()->create(['role' => 'registrar']);
        $year = AcademicYear::query()->create(['name' => '2027-2028', 'is_active' => false]);

        $this->actingAs($registrar)
            ->post('/academic-years', ['name' => '2028-2029'])
            ->assertForbidden();

        $this->actingAs($registrar)
            ->delete("/academic-years/{$year->id}")
            ->assertForbidden();
    }
}
