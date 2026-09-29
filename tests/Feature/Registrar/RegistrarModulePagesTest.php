<?php

namespace Tests\Feature\Registrar;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrarModulePagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrollment_academic_records_and_reports_pages_render(): void
    {
        $user = User::factory()->create(['role' => 'registrar']);
        [$learner] = $this->seedRegistrarRecord();

        $this->actingAs($user)
            ->get('/student-management')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('StudentManagement/Index')
                ->where('activeYear.name', '2026-2027')
                ->where('summary.students', 1)
            );

        $this->actingAs($user)
            ->get('/enrollments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Enrollments/Index')
                ->where('activeYear.name', '2026-2027')
                ->where('totals.enrollments', 1)
                ->where('byLevel.0.level', 'L1')
            );

        $this->actingAs($user)
            ->get('/academic-records')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('AcademicRecords/Index')
                ->where('activeYear.name', '2026-2027')
                ->where('learners.data.0.full_name', 'STA. CRUZ, DAHLIA THERESE S.')
            );

        $this->actingAs($user)
            ->get("/academic-records/{$learner->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('AcademicRecords/Show')
                ->where('learner.full_name', 'STA. CRUZ, DAHLIA THERESE S.')
                ->where('learner.enrollments.0.level', 'L1')
            );

        $this->actingAs($user)
            ->get('/reports')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports/Index')
                ->where('summary.learners', 1)
                ->where('documentTotals.ok', 1)
            );
    }

    public function test_newly_enabled_registrar_module_pages_render(): void
    {
        $user = User::factory()->create(['role' => 'registrar']);
        [$learner, $enrollment] = $this->seedRegistrarRecord();
        $section = Section::first();

        // 1. Admissions page
        $this->actingAs($user)
            ->get('/admissions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admissions/Index'));

        // 2. Class & Section Management index page
        $this->actingAs($user)
            ->get('/classes')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Classes/Index'));

        // 3. Class & Section Management show page
        $this->actingAs($user)
            ->get("/classes/{$section->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Classes/Show'));

        // 4. Attendance page
        $this->actingAs($user)
            ->get('/attendance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Attendance/Index'));

        // 5. Transfer & Withdrawal page
        $this->actingAs($user)
            ->get('/transfers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Transfers/Index'));

        // 6. Certificates page
        $this->actingAs($user)
            ->get('/certificates')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Certificates/Index'));
    }

    /**
     * @return array{Learner, Enrollment}
     */
    private function seedRegistrarRecord(): array
    {
        $year = AcademicYear::query()->create([
            'name' => '2026-2027',
            'is_active' => true,
        ]);
        $section = Section::query()->create([
            'academic_year_id' => $year->id,
            'level' => 'L1',
            'name' => 'L1-A',
            'session' => 'AM',
            'teacher_name' => 'Teacher One',
        ]);
        $learner = Learner::query()->create([
            'lrn' => '109806170058',
            'full_name' => 'STA. CRUZ, DAHLIA THERESE S.',
            'normalized_name' => 'STA CRUZ DAHLIA THERESE S',
        ]);
        $enrollment = Enrollment::query()->create([
            'academic_year_id' => $year->id,
            'learner_id' => $learner->id,
            'section_id' => $section->id,
            'level' => 'L1',
            'status' => 'active',
            'session' => 'AM',
        ]);
        DocumentRequirement::query()->create([
            'enrollment_id' => $enrollment->id,
            'document_type' => DocumentType::Passport->value,
            'status' => DocumentStatus::Ok->value,
        ]);

        return [$learner, $enrollment];
    }
}
