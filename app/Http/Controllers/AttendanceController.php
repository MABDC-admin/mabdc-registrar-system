<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        
        $sections = Section::when($activeYear, fn($q) => $q->where('academic_year_id', $activeYear->id))
            ->orderBy('level')
            ->orderBy('name')
            ->get(['id', 'level', 'name', 'session', 'teacher_name']);

        $selectedDate = $request->query('date', Carbon::today()->toDateString());
        $sectionId = $request->query('section_id');
        
        $selectedSection = null;
        $roster = [];
        
        if ($sectionId) {
            $selectedSection = Section::with(['enrollments.learner:id,full_name,normalized_name'])
                ->find($sectionId);
                
            if ($selectedSection) {
                // Fetch existing attendance for this date
                $existingAttendance = Attendance::where('section_id', $sectionId)
                    ->where('date', $selectedDate)
                    ->get()
                    ->keyBy('learner_id');
                    
                $roster = $selectedSection->enrollments->map(function ($enrollment) use ($existingAttendance) {
                    $attendance = $existingAttendance->get($enrollment->learner_id);
                    return [
                        'learner_id' => $enrollment->learner_id,
                        'full_name' => $enrollment->learner->full_name,
                        'status' => $attendance ? $attendance->status->value : 'present', // Default to present
                        'remarks' => $attendance ? $attendance->remarks : '',
                    ];
                });
            }
        }

        return Inertia::render('Attendance/Index', [
            'activeYear' => $activeYear,
            'sections' => $sections,
            'filters' => [
                'date' => $selectedDate,
                'section_id' => $sectionId,
            ],
            'selectedSection' => $selectedSection,
            'roster' => $roster,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'section_id' => ['required', 'exists:sections,id'],
            'date' => ['required', 'date'],
            'attendances' => ['required', 'array'],
            'attendances.*.learner_id' => ['required', 'exists:learners,id'],
            'attendances.*.status' => ['required', 'string', 'in:present,absent,late,excused'],
            'attendances.*.remarks' => ['nullable', 'string'],
        ]);

        $section = Section::findOrFail($validated['section_id']);
        
        foreach ($validated['attendances'] as $record) {
            Attendance::updateOrCreate(
                [
                    'learner_id' => $record['learner_id'],
                    'date' => $validated['date'],
                ],
                [
                    'academic_year_id' => $section->academic_year_id,
                    'section_id' => $section->id,
                    'status' => $record['status'],
                    'remarks' => $record['remarks'],
                ]
            );
        }

        return redirect()->back()->with('success', 'Attendance saved successfully.');
    }
}
