<?php

namespace App\Support;

use App\Models\RoleModulePermission;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class RegistrarModules
{
    public const ROLES = ['user', 'finance', 'registrar', 'admin'];

    /**
     * @return list<array{key: string, label: string, route: string|null, implemented: bool, admin_only?: bool}>
     */
    public static function modules(): array
    {
        return [
            ['key' => 'dashboard', 'label' => 'Dashboard', 'route' => 'dashboard', 'implemented' => true],
            ['key' => 'student_management', 'label' => 'Student Management', 'route' => 'student-management.index', 'implemented' => true],
            ['key' => 'admission', 'label' => 'Admission', 'route' => 'admissions.index', 'implemented' => true],
            ['key' => 'enrollment', 'label' => 'Enrollment', 'route' => 'enrollments.index', 'implemented' => true],
            ['key' => 'class_section', 'label' => 'Class & Section', 'route' => 'classes.index', 'implemented' => true],
            ['key' => 'academic_records', 'label' => 'Academic Records', 'route' => 'academic-records.index', 'implemented' => true],
            ['key' => 'attendance', 'label' => 'Attendance', 'route' => 'attendance.index', 'implemented' => true],
            ['key' => 'transfer_withdrawal', 'label' => 'Transfer & Withdrawal', 'route' => 'transfers.index', 'implemented' => true],
            ['key' => 'certificates', 'label' => 'Certificates', 'route' => 'certificates.index', 'implemented' => true],
            ['key' => 'staff_management', 'label' => 'Staff Management', 'route' => 'users.index', 'implemented' => true, 'admin_only' => true],
            ['key' => 'academic_years', 'label' => 'Academic Years', 'route' => 'academic-years.index', 'implemented' => true],
            ['key' => 'finance', 'label' => 'Finance Dashboard', 'route' => 'finance.index', 'implemented' => true],
            ['key' => 'learner_accounts', 'label' => 'Learner Accounts', 'route' => 'learner-accounts.index', 'implemented' => true],
            ['key' => 'reports', 'label' => 'Reports', 'route' => 'reports.index', 'implemented' => true],
            ['key' => 'document_center', 'label' => 'Document Center', 'route' => 'imports.index', 'implemented' => true],
            ['key' => 'settings', 'label' => 'Settings', 'route' => 'profile.edit', 'implemented' => true],
            ['key' => 'audit_trail', 'label' => 'Audit Trail', 'route' => 'audit-trail.index', 'implemented' => true],
        ];
    }

    /**
     * @return array<string, array<string, bool>>
     */
    public static function permissionsByRole(): array
    {
        return collect(self::ROLES)
            ->mapWithKeys(fn (string $role) => [$role => self::permissionsForRole($role)])
            ->all();
    }

    /**
     * @return array<string, bool>
     */
    public static function permissionsForRole(string $role): array
    {
        self::validateRole($role);

        $permissions = collect(self::modules())
            ->mapWithKeys(fn (array $module) => [
                $module['key'] => self::defaultEnabled($role, $module['key']),
            ])
            ->all();

        try {
            RoleModulePermission::query()
                ->where('role', $role)
                ->get(['module_key', 'enabled'])
                ->each(function (RoleModulePermission $permission) use (&$permissions): void {
                    if (array_key_exists($permission->module_key, $permissions)) {
                        $permissions[$permission->module_key] = $permission->enabled;
                    }
                });
        } catch (\Illuminate\Database\QueryException $e) {
            // Table might not exist yet during setup or migrations
        }

        return $permissions;
    }

    public static function isEnabledForRole(string $role, string $moduleKey): bool
    {
        self::validateModule($moduleKey);

        return self::permissionsForRole($role)[$moduleKey] ?? false;
    }

    public static function landingRouteForRole(string $role): string
    {
        $permissions = self::permissionsForRole($role);

        foreach (self::modules() as $module) {
            if (($module['admin_only'] ?? false) && $role !== 'admin') {
                continue;
            }

            if ($module['implemented'] && $module['route'] && ($permissions[$module['key']] ?? false)) {
                return $module['route'];
            }
        }

        return 'profile.edit';
    }

    public static function setPermission(string $role, string $moduleKey, bool $enabled): void
    {
        self::validateRole($role);
        self::validateModule($moduleKey);

        RoleModulePermission::query()->updateOrCreate(
            [
                'role' => $role,
                'module_key' => $moduleKey,
            ],
            [
                'enabled' => $enabled,
            ],
        );
    }

    private static function defaultEnabled(string $role, string $moduleKey): bool
    {
        if ($role === 'admin') {
            return true;
        }

        if ($role === 'registrar') {
            return $moduleKey !== 'staff_management' && $moduleKey !== 'finance';
        }

        if ($role === 'finance') {
            return in_array($moduleKey, ['finance', 'learner_accounts', 'settings', 'audit_trail', 'academic_years'], true);
        }

        return in_array($moduleKey, ['settings'], true);
    }

    private static function validateRole(string $role): void
    {
        if (! in_array($role, self::ROLES, true)) {
            throw ValidationException::withMessages([
                'role' => 'Invalid role.',
            ]);
        }
    }

    private static function validateModule(string $moduleKey): void
    {
        $keys = collect(self::modules())->pluck('key')->all();

        if (! in_array($moduleKey, $keys, true)) {
            throw ValidationException::withMessages([
                'module' => 'Invalid module.',
            ]);
        }
    }
}
