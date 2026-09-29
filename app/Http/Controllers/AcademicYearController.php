<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('AcademicYears/Index', [
            'academicYears' => AcademicYear::query()->orderByDesc('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:academic_years,name', 'regex:/^\d{4}-\d{4}$/'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ], [
            'name.regex' => 'The academic year name must be in the format YYYY-YYYY (e.g. 2026-2027).',
        ]);

        AcademicYear::query()->create($validated);

        return redirect()->route('users.index')->with('status', 'Academic year created successfully.');
    }

    public function update(Request $request, AcademicYear $academicYear): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/', 'unique:academic_years,name,'.$academicYear->id],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ], [
            'name.regex' => 'The academic year name must be in the format YYYY-YYYY (e.g. 2026-2027).',
        ]);

        $academicYear->update($validated);

        return redirect()->route('users.index')->with('status', 'Academic year updated successfully.');
    }

    public function activate(AcademicYear $academicYear): RedirectResponse
    {
        DB::transaction(function () use ($academicYear) {
            AcademicYear::query()->update(['is_active' => false]);
            $academicYear->update(['is_active' => true]);
        });

        return redirect()->route('users.index')->with('status', 'Academic year activated successfully.');
    }

    public function destroy(AcademicYear $academicYear): RedirectResponse
    {
        if ($academicYear->is_active) {
            abort(422, 'Cannot delete the active academic year.');
        }

        $academicYear->delete();

        return redirect()->route('users.index')->with('status', 'Academic year deleted successfully.');
    }
}
