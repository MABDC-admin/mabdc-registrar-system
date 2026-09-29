<?php

namespace Tests\Feature\Registrar;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrarAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_registrar_routes_require_registrar_or_admin_role(): void
    {
        [$learner] = $this->seedRecord();
        $plainUser = User::factory()->create(['role' => 'user']);
        $registrar = User::factory()->create(['role' => 'registrar']);
        $admin = User::factory()->create(['role' => 'admin']);

        foreach ([
            '/dashboard',
            '/student-management',
            '/enrollments',
            '/academic-records',
            "/academic-records/{$learner->id}",
            '/reports',
            '/learners',
            '/imports',
            '/exports/learners',
            '/exports/missing-documents',
        ] as $uri) {
            $this->actingAs($plainUser)->get($uri)->assertForbidden();
            $this->actingAs($registrar)->get($uri)->assertSuccessful();
            $this->actingAs($admin)->get($uri)->assertSuccessful();
        }
    }

    public function test_document_updates_require_registrar_or_admin_role(): void
    {
        [$learner, $documentRequirement] = $this->seedRecord();
        $plainUser = User::factory()->create(['role' => 'user']);
        $registrar = User::factory()->create(['role' => 'registrar']);

        $this->actingAs($plainUser)
            ->patch("/learners/{$learner->id}/documents/{$documentRequirement->id}", [
                'status' => DocumentStatus::Missing->value,
            ])
            ->assertForbidden();

        $this->actingAs($registrar)
            ->patch("/learners/{$learner->id}/documents/{$documentRequirement->id}", [
                'status' => DocumentStatus::Missing->value,
            ])
            ->assertRedirect("/learners/{$learner->id}");
    }

    /**
     * @return array{Learner, DocumentRequirement}
     */
    private function seedRecord(): array
    {
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
            'level' => 'L1',
            'status' => 'active',
        ]);
        $documentRequirement = DocumentRequirement::query()->create([
            'enrollment_id' => $enrollment->id,
            'document_type' => DocumentType::Passport->value,
            'status' => DocumentStatus::Ok->value,
        ]);

        return [$learner, $documentRequirement];
    }
}
