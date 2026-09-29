<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Enrollment;
use Illuminate\Validation\Rule;

class TransferWithdrawalController extends Controller
{
    public function index()
    {
        $enrollments = Enrollment::with(['learner', 'academicYear', 'section'])
            ->whereIn('status', ['transferred', 'withdrawn'])
            ->orderByDesc('updated_at')
            ->get();
            
        $activeEnrollments = Enrollment::with(['learner', 'academicYear', 'section'])
            ->whereIn('status', ['enrolled', 'active'])
            ->get();

        return Inertia::render('Transfers/Index', [
            'enrollments' => $enrollments,
            'activeEnrollments' => $activeEnrollments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'enrollment_id' => ['required', 'exists:enrollments,id'],
            'type' => ['required', Rule::in(['transferred', 'withdrawn'])],
            'date' => ['required', 'date'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $enrollment = Enrollment::findOrFail($validated['enrollment_id']);
        
        $metadata = $enrollment->metadata ?? [];
        $metadata['transfer_date'] = $validated['date'];
        $metadata['transfer_reason'] = $validated['reason'];
        
        $enrollment->status = $validated['type'];
        $enrollment->metadata = $metadata;
        $enrollment->save();

        return redirect()->back()->with('success', 'Student ' . $validated['type'] . ' successfully.');
    }
}
