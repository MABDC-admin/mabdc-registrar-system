<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Promotion;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PromotionController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        $academicYears = AcademicYear::all(['id', 'name', 'is_active']);

        $level = $request->query('level', '');
        
        $enrollments = [];
        if ($activeYear) {
            $query = Enrollment::with(['learner', 'section', 'grades'])
                ->where('academic_year_id', $activeYear->id);
                
            if ($level) {
                $query->where('level', $level);
            }
            
            $enrollmentsList = $query->get();
            
            foreach ($enrollmentsList as $en) {
                // Calculate GPA
                $grades = $en->grades;
                $gpa = null;
                if ($grades->count() > 0) {
                    $finalGrades = $grades->pluck('final_grade')->filter();
                    if ($finalGrades->count() > 0) {
                        $gpa = round($finalGrades->average(), 2);
                    }
                }
                
                // Determine honors
                $honors = 'None';
                if ($gpa !== null) {
                    if ($gpa >= 98.0) {
                        $honors = 'With Highest Honors';
                    } elseif ($gpa >= 95.0) {
                        $honors = 'With High Honors';
                    } elseif ($gpa >= 90.0) {
                        $honors = 'With Honors';
                    }
                }
                
                $enrollments[] = [
                    'id' => $en->id,
                    'learner_id' => $en->learner_id,
                    'lrn' => $en->learner->lrn,
                    'name' => $en->learner->full_name,
                    'gender' => $en->learner->gender,
                    'level' => $en->level,
                    'section' => $en->section?->name ?? 'Unassigned',
                    'gpa' => $gpa,
                    'honors' => $honors,
                    'status' => $en->status,
                ];
            }
        }

        // Get distinct levels for filter tabs
        $levels = Enrollment::where('academic_year_id', $activeYear?->id)
            ->whereNotNull('level')
            ->distinct()
            ->pluck('level')
            ->toArray();

        // Get sections for target mapping
        $allSections = Section::all(['id', 'name', 'level']);

        return Inertia::render('Promotion/Index', [
            'activeYear' => $activeYear,
            'academicYears' => $academicYears,
            'enrollments' => $enrollments,
            'levels' => $levels,
            'allSections' => $allSections,
            'selectedLevel' => $level,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'target_academic_year_id' => 'required|exists:academic_years,id',
            'promotions' => 'required|array',
            'promotions.*.learner_id' => 'required|exists:learners,id',
            'promotions.*.enrollment_id' => 'required|exists:enrollments,id',
            'promotions.*.current_level' => 'required|string',
            'promotions.*.target_level' => 'required|string',
            'promotions.*.target_section_id' => 'nullable|exists:sections,id',
            'promotions.*.status' => 'required|string|in:promoted,retained,transferred',
            'promotions.*.remarks' => 'nullable|string|max:500',
        ]);

        $targetYear = AcademicYear::findOrFail($request->target_academic_year_id);

        DB::transaction(function () use ($request, $targetYear) {
            foreach ($request->promotions as $promo) {
                // Update current enrollment status
                $currentEnrollment = Enrollment::findOrFail($promo['enrollment_id']);
                
                // Create next year enrollment if promoted or retained
                if (in_array($promo['status'], ['promoted', 'retained'])) {
                    Enrollment::updateOrCreate(
                        [
                            'learner_id' => $promo['learner_id'],
                            'academic_year_id' => $targetYear->id,
                        ],
                        [
                            'level' => $promo['target_level'],
                            'section_id' => $promo['target_section_id'] ?: null,
                            'status' => 'active',
                        ]
                    );
                }

                // Log promotion history
                Promotion::create([
                    'learner_id' => $promo['learner_id'],
                    'from_grade' => $promo['current_level'],
                    'to_grade' => $promo['target_level'],
                    'academic_year' => $targetYear->name,
                    'status' => $promo['status'],
                    'remarks' => $promo['remarks'],
                ]);
            }
        });

        return redirect()->route('promotions.index')->with('status', 'Batch promotion executed successfully.');
    }
}
