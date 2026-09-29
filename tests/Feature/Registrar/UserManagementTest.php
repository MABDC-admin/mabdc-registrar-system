<?php

namespace Tests\Feature\Registrar;

use App\Models\User;
use Database\Seeders\InitialAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_admin_seeder_creates_admin_from_configuration(): void
    {
        config([
            'registrar.initial_admin.name' => 'MABDC Admin',
            'registrar.initial_admin.email' => 'admin@mabdc.test',
            'registrar.initial_admin.password' => 'secret-password',
        ]);

        $this->seed(InitialAdminSeeder::class);

        $admin = User::query()->where('email', 'admin@mabdc.test')->firstOrFail();
        $this->assertSame('MABDC Admin', $admin->name);
        $this->assertSame('admin', $admin->role);
        $this->assertTrue(Hash::check('secret-password', $admin->password));
    }

    public function test_admin_can_view_users_and_update_roles(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($admin)
            ->get('/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Users/Index')
                ->where('users.0.id', $admin->id)
                ->where('users.1.id', $user->id)
                ->where('roles.0', 'user')
                ->where('roles.1', 'registrar')
                ->where('roles.2', 'admin')
                ->where('modules.0.key', 'dashboard')
                ->where('modulePermissions.registrar.reports', true)
            );

        $this->actingAs($admin)
            ->patch("/users/{$user->id}/role", ['role' => 'registrar'])
            ->assertRedirect('/users');

        $this->assertSame('registrar', $user->refresh()->role);
    }

    public function test_admin_can_enable_and_disable_modules_for_each_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $registrar = User::factory()->create(['role' => 'registrar']);

        $this->actingAs($admin)
            ->patch('/roles/registrar/modules/reports', ['enabled' => false])
            ->assertRedirect('/users');

        $this->actingAs($registrar)
            ->get('/reports')
            ->assertForbidden();

        $this->actingAs($admin)
            ->get('/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('modulePermissions.registrar.reports', false)
            );

        $this->actingAs($admin)
            ->patch('/roles/registrar/modules/reports', ['enabled' => true])
            ->assertRedirect('/users');

        $this->actingAs($registrar)
            ->get('/reports')
            ->assertOk();
    }

    public function test_only_admin_can_manage_user_roles(): void
    {
        $registrar = User::factory()->create(['role' => 'registrar']);
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($registrar)->get('/users')->assertForbidden();
        $this->actingAs($registrar)
            ->patch("/users/{$user->id}/role", ['role' => 'admin'])
            ->assertForbidden();
    }
}
