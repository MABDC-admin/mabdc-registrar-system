<?php

namespace App\Http\Controllers;

use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class TeacherProfileController extends Controller
{
    public function index(): Response
    {
        $teachers = TeacherProfile::with('user')->get();
        $sections = Section::all(['id', 'name', 'level']);
        $usersWithoutProfile = User::where('role', 'teacher')
            ->whereDoesntHave('teacherProfile')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Registrar/Teachers', [
            'teachers' => $teachers,
            'sections' => $sections,
            'usersWithoutProfile' => $usersWithoutProfile,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'employee_id' => 'nullable|string|unique:teacher_profiles,employee_id',
            'name' => 'required_without:user_id|string|max:255',
            'email' => 'required_without:user_id|email|unique:users,email',
            'user_id' => 'nullable|exists:users,id',
            'department' => 'required|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'advisory_grade_level' => 'nullable|string|max:255',
            'advisory_section' => 'nullable|string|max:255',
            'status' => 'required|string|in:Active,On Leave,Inactive',
        ]);

        if ($request->filled('user_id')) {
            $userId = $request->user_id;
        } else {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make('MABDC-teacher2026'),
                'role' => 'teacher',
            ]);
            $userId = $user->id;
        }

        TeacherProfile::create([
            'user_id' => $userId,
            'employee_id' => $request->employee_id,
            'department' => $request->department,
            'specialization' => $request->specialization,
            'phone' => $request->phone,
            'advisory_grade_level' => $request->advisory_grade_level,
            'advisory_section' => $request->advisory_section,
            'status' => $request->status,
        ]);

        return redirect()->route('teachers.index')->with('status', 'Teacher faculty added successfully.');
    }

    public function update(Request $request, TeacherProfile $teacher): RedirectResponse
    {
        $request->validate([
            'employee_id' => 'nullable|string|unique:teacher_profiles,employee_id,' . $teacher->id,
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $teacher->user_id,
            'department' => 'required|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'advisory_grade_level' => 'nullable|string|max:255',
            'advisory_section' => 'nullable|string|max:255',
            'status' => 'required|string|in:Active,On Leave,Inactive',
        ]);

        $teacher->user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        $teacher->update([
            'employee_id' => $request->employee_id,
            'department' => $request->department,
            'specialization' => $request->specialization,
            'phone' => $request->phone,
            'advisory_grade_level' => $request->advisory_grade_level,
            'advisory_section' => $request->advisory_section,
            'status' => $request->status,
        ]);

        return redirect()->route('teachers.index')->with('status', 'Teacher faculty updated successfully.');
    }

    public function destroy(TeacherProfile $teacher): RedirectResponse
    {
        $teacher->delete();
        return redirect()->route('teachers.index')->with('status', 'Teacher profile removed successfully.');
    }
}
