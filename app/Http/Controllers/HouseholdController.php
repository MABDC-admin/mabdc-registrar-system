<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\Learner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HouseholdController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $households = Household::query()
            ->with(['learners:id,household_id,full_name,lrn,gender,birth_date'])
            ->when($search, function ($query, $search) {
                $query->where('family_name', 'ilike', "%{$search}%")
                    ->orWhere('household_code', 'ilike', "%{$search}%")
                    ->orWhere('primary_contact_name', 'ilike', "%{$search}%")
                    ->orWhere('primary_email', 'ilike', "%{$search}%");
            })
            ->latest('id')
            ->paginate(15)
            ->through(fn ($household) => [
                'id' => $household->id,
                'household_code' => $household->household_code,
                'family_name' => $household->family_name,
                'primary_contact_name' => $household->primary_contact_name,
                'primary_email' => $household->primary_email,
                'primary_phone' => $household->primary_phone,
                'learners_count' => $household->learners->count(),
                'learners' => $household->learners->map(fn ($l) => [
                    'id' => $l->id,
                    'full_name' => $l->full_name,
                    'lrn' => $l->lrn,
                ]),
            ]);

        return Inertia::render('Households/Index', [
            'households' => $households,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'family_name' => ['required', 'string', 'max:255'],
            'primary_contact_name' => ['nullable', 'string', 'max:255'],
            'primary_email' => ['nullable', 'email', 'max:255'],
            'primary_phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
        ]);

        $code = 'HH-' . strtoupper(substr(uniqid(), -6));
        $validated['household_code'] = $code;

        $household = Household::create($validated);

        return redirect()->back()->with('success', "Household {$household->household_code} created successfully.");
    }

    public function linkLearner(Request $request, Household $household)
    {
        $validated = $request->validate([
            'learner_id' => ['required', 'exists:learners,id'],
        ]);

        $learner = Learner::findOrFail($validated['learner_id']);
        $learner->update(['household_id' => $household->id]);

        return redirect()->back()->with('success', "Learner {$learner->full_name} linked to Household {$household->family_name}.");
    }

    public function unlinkLearner(Household $household, Learner $learner)
    {
        if ($learner->household_id === $household->id) {
            $learner->update(['household_id' => null]);
        }

        return redirect()->back()->with('success', "Learner {$learner->full_name} unlinked from household.");
    }
}
