<?php

namespace App\Http\Controllers;

use App\Models\FeeStructure;
use App\Models\AcademicYear;
use App\Models\Enrollment;
use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeStructureController extends Controller
{
    public function index()
    {
        $fees = FeeStructure::activeYear()->with('academicYear')->get();
        return Inertia::render('Finance/Fees/Index', [
            'fees' => $fees
        ]);
    }

    public function create()
    {
        $academicYears = AcademicYear::orderBy('name', 'desc')->get();
        return Inertia::render('Finance/Fees/Create', [
            'academicYears' => $academicYears
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'level' => 'nullable|string|max:50',
            'is_optional' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Fallback to default values for checkboxes if not present in request
        $validated['is_optional'] = $request->has('is_optional') ? $request->is_optional : false;
        $validated['is_active'] = $request->has('is_active') ? $request->is_active : false;

        FeeStructure::create($validated);

        return redirect()->route('finance.fees.index')->with('success', 'Fee structure created successfully.');
    }

    public function edit(FeeStructure $fee)
    {
        $academicYears = AcademicYear::orderBy('name', 'desc')->get();
        return Inertia::render('Finance/Fees/Edit', [
            'fee' => $fee,
            'academicYears' => $academicYears
        ]);
    }

    public function update(Request $request, FeeStructure $fee)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'level' => 'nullable|string|max:50',
            'is_optional' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['is_optional'] = $request->has('is_optional') ? $request->is_optional : false;
        $validated['is_active'] = $request->has('is_active') ? $request->is_active : false;

        $fee->update($validated);

        return redirect()->route('finance.fees.index')->with('success', 'Fee structure updated successfully.');
    }

    public function destroy(FeeStructure $fee)
    {
        $fee->delete();
        return redirect()->route('finance.fees.index')->with('success', 'Fee structure deleted successfully.');
    }

    public function assign(Request $request, FeeStructure $fee)
    {
        $request->validate([
            'enrollment_ids' => 'required|array',
            'enrollment_ids.*' => 'exists:enrollments,id',
        ]);

        $enrollments = Enrollment::whereIn('id', $request->enrollment_ids)->get();
        $count = 0;

        foreach ($enrollments as $enrollment) {
            // Check if already assigned
            $exists = $enrollment->financeLedgers()
                ->where('type', 'charge')
                ->where('description', $fee->name)
                ->exists();

            if (!$exists) {
                // Charge
                $enrollment->financeLedgers()->create([
                    'type' => 'charge',
                    'description' => $fee->name,
                    'amount' => $fee->amount,
                    'transaction_date' => now(),
                ]);

                // Tax (VAT 5%)
                $taxAmount = $fee->amount * 0.05;
                $enrollment->financeLedgers()->create([
                    'type' => 'tax',
                    'description' => 'UAE VAT (5%) on ' . $fee->name,
                    'amount' => $taxAmount,
                    'transaction_date' => now(),
                ]);

                // Log Audit Event
                AuditEvent::query()->create([
                    'actor_id' => auth()->id(),
                    'event_type' => 'charge_applied',
                    'subject_type' => Enrollment::class,
                    'subject_id' => $enrollment->id,
                    'before' => null,
                    'after' => [
                        'type' => 'charge',
                        'description' => $fee->name,
                        'amount' => $fee->amount,
                        'tax_amount' => $taxAmount,
                        'transaction_date' => now()->format('Y-m-d'),
                    ],
                    'metadata' => [
                        'learner_name' => optional($enrollment->learner)->full_name,
                        'message' => "Fee structure '{$fee->name}' (AED " . number_format($fee->amount, 2) . ") assigned to student",
                    ],
                ]);

                // Update financial status to Unpaid if it was No Assessment
                if ($enrollment->financial_status === 'No Assessment') {
                    $enrollment->update(['financial_status' => 'Unpaid']);
                }

                $count++;
            }
        }

        return redirect()->back()->with('success', "Successfully assigned '{$fee->name}' to {$count} selected learners.");
    }

    public function getLearners(FeeStructure $fee)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return response()->json([]);
        }

        $query = \App\Models\Enrollment::with('learner')
            ->where('academic_year_id', $activeYear->id);

        if ($fee->level) {
            $query->where('level', $fee->level);
        }

        $enrollments = $query->get()->map(function ($enrollment) {
            return [
                'id' => $enrollment->id,
                'name' => optional($enrollment->learner)->full_name,
                'lrn' => optional($enrollment->learner)->lrn,
            ];
        });

        return response()->json($enrollments);
    }
}
