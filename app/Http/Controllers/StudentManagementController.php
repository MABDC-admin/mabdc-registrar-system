<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\DocumentRequirement;
use App\Models\Enrollment;
use App\Models\Learner;
use App\Models\Section;
use Inertia\Inertia;
use Inertia\Response;

class StudentManagementController extends Controller
{
    public function __invoke(): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);
        $enrollments = Enrollment::query()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id));
        $enrollmentIds = (clone $enrollments)->pluck('id');

        return Inertia::render('StudentManagement/Index', [
            'activeYear' => $activeYear,
            'today' => now()->format('M j, Y | l'),
            'summary' => [
                'students' => Learner::query()->count(),
                'enrollments' => (clone $enrollments)->count(),
                'sections' => Section::query()
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->count(),
                'documents' => DocumentRequirement::query()
                    ->whereIn('enrollment_id', $enrollmentIds)
                    ->count(),
            ],
        ]);
    }
}
