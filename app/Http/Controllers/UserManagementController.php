<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    private const ROLES = ['user', 'registrar', 'admin'];

    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->orderBy('id')
                ->get(['id', 'name', 'email', 'role', 'created_at']),
            'roles' => self::ROLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Password::defaults()],
            'role' => ['required', Rule::in(self::ROLES)],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()->route('users.index');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'password' => ['nullable', Password::defaults()],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['message' => 'You cannot delete yourself.']);
        }

        if ($user->role === 'admin') {
            abort_if(User::query()->where('role', 'admin')->count() <= 1, 422, 'Cannot delete the last remaining admin account.');
        }

        $user->delete();

        return redirect()->route('users.index');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(self::ROLES)],
        ]);

        if ($user->role === 'admin' && $validated['role'] !== 'admin') {
            abort_if(User::query()->where('role', 'admin')->count() <= 1, 422, 'At least one admin account is required.');
        }

        $user->update(['role' => $validated['role']]);

        return redirect()->route('users.index');
    }

    public function updateModulePermission(Request $request, string $role, string $module): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        \App\Support\RegistrarModules::setPermission($role, $module, $validated['enabled']);

        return redirect()->route('users.index');
    }
}
