<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $sections = Section::withCount('enrollments')
            ->when($activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id))
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        $enrollments = [];
        if ($activeYear) {
            $enrollments = Enrollment::activeYear()->with('learner:id,full_name,normalized_name,gender')
                ->where('academic_year_id', $activeYear->id)
                ->whereIn('status', ['enrolled', 'active'])
                ->get();
        }

        return Inertia::render('Classes/Index', [
            'activeYear' => $activeYear,
            'sections' => $sections,
            'enrollments' => $enrollments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'level' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'session' => ['required', 'string', 'in:morning,afternoon,full_day'],
            'teacher_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        Section::create($validated);

        return redirect()->back()->with('success', 'Section created successfully.');
    }

    public function update(Request $request, Section $section): JsonResponse
    {
        $validated = $request->validate([
            'teacher_name' => ['nullable', 'string', 'max:255'],
        ]);

        $section->update($validated);

        return response()->json(['success' => true, 'teacher_name' => $section->teacher_name]);
    }

    public function show(Section $section): Response
    {
        // Load the enrolled students assigned to this section
        $section->load(['enrollments.learner:id,full_name,normalized_name,gender']);

        // Load the enrolled students in the same academic year and level who DO NOT have a section
        $unassigned = Enrollment::activeYear()->with('learner:id,full_name,normalized_name,gender')
            ->where('academic_year_id', $section->academic_year_id)
            ->where('level', $section->level)
            ->whereNull('section_id')
            ->where('status', 'enrolled')
            ->get();

        return Inertia::render('Classes/Show', [
            'section' => $section,
            'unassigned' => $unassigned,
        ]);
    }

    public function assign(Request $request, Section $section): RedirectResponse
    {
        $validated = $request->validate([
            'enrollment_id' => ['required', 'exists:enrollments,id'],
        ]);

        $enrollment = Enrollment::findOrFail($validated['enrollment_id']);
        
        // Basic safety checks
        if ($enrollment->academic_year_id !== $section->academic_year_id) {
            return redirect()->back()->with('error', 'Academic year mismatch.');
        }
        if ($enrollment->level !== $section->level) {
            return redirect()->back()->with('error', 'Grade level mismatch.');
        }

        $enrollment->update(['section_id' => $section->id]);

        return redirect()->back();
    }

    public function unassign(Request $request, Section $section): RedirectResponse
    {
        $validated = $request->validate([
            'enrollment_id' => ['required', 'exists:enrollments,id'],
        ]);

        $enrollment = Enrollment::where('id', $validated['enrollment_id'])
            ->where('section_id', $section->id)
            ->firstOrFail();

        $enrollment->update(['section_id' => null]);

        return redirect()->back();
    }
}
