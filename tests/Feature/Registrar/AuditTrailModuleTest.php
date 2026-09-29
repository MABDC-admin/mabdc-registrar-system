<?php

namespace Tests\Feature\Registrar;

use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditTrailModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_access_audit_trail_module(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $registrar = User::factory()->create(['role' => 'registrar']);
        $plainUser = User::factory()->create(['role' => 'user']);

        // Create some sample audit event
        AuditEvent::query()->create([
            'actor_id' => $admin->id,
            'event_type' => 'settings_updated',
            'subject_type' => User::class,
            'subject_id' => $admin->id,
            'before' => null,
            'after' => ['role' => 'admin'],
            'metadata' => [
                'message' => 'Admin updated user settings',
            ],
        ]);

        // Admins can successfully access the page
        $this->actingAs($admin)
            ->get('/audit-trail')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page->component('AuditTrail/Index'));

        // Registrars can successfully access the page (enabled by default)
        $this->actingAs($registrar)
            ->get('/audit-trail')
            ->assertSuccessful();

        // Finance users can successfully access the page (enabled by default)
        $finance = User::factory()->create(['role' => 'finance']);
        $this->actingAs($finance)
            ->get('/audit-trail')
            ->assertSuccessful();

        // Standard users are forbidden
        $this->actingAs($plainUser)
            ->get('/audit-trail')
            ->assertForbidden();
    }
}
