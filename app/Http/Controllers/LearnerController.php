<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Models\AcademicYear;
use App\Models\AuditEvent;
use App\Models\Enrollment;
use App\Models\Learner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearnerController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'level' => trim((string) $request->query('level', '')),
            'status' => trim((string) $request->query('status', '')),
        ];

        $learners = Learner::query()
            ->with(['enrollments' => function ($query) use ($activeYear) {
                $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->with(['academicYear:id,name', 'documentRequirements']);
            }])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $search = $filters['search'];
                $normalizedSearch = preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($search));

                $query->where(function (Builder $query) use ($search, $normalizedSearch) {
                    $query
                        ->where('lrn', 'like', "%{$search}%")
                        ->orWhere('full_name', 'like', "%{$search}%")
                        ->orWhere('normalized_name', 'like', "%{$normalizedSearch}%");
                });
            })
            ->when($filters['level'] !== '', function (Builder $query) use ($activeYear, $filters) {
                $query->whereHas('enrollments', fn (Builder $query) => $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->where('level', $filters['level']));
            })
            ->when($filters['status'] !== '', function (Builder $query) use ($activeYear, $filters) {
                $query->whereHas('enrollments', fn (Builder $query) => $query
                    ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                    ->where('status', $filters['status']));
            })
            ->orderBy('full_name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Learner $learner) => $this->learnerPayload($learner));

        return Inertia::render('Learners/Index', [
            'activeYear' => $activeYear,
            'filters' => $filters,
            'learners' => $learners,
            'levels' => $this->levelOptions($activeYear),
            'statuses' => $this->statusOptions($activeYear),
        ]);
    }

    public function show(Learner $learner): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);

        $learner->load(['enrollments' => function ($query) use ($activeYear) {
            $query
                ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                ->with(['academicYear:id,name', 'documentRequirements']);
        }]);

        return Inertia::render('Learners/Show', [
            'activeYear' => $activeYear,
            'learner' => $this->learnerPayload($learner, true),
        ]);
    }

    public function edit(Learner $learner): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);

        $learner->load(['enrollments' => function ($query) use ($activeYear) {
            $query
                ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
                ->with(['academicYear:id,name', 'documentRequirements']);
        }]);

        return Inertia::render('Learners/Edit', [
            'activeYear' => $activeYear,
            'learner' => $this->learnerPayload($learner, true),
        ]);
    }

    public function update(Request $request, Learner $learner): RedirectResponse
    {
        $validated = $request->validate([
            'lrn' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string',
            'mother_maiden_name' => 'nullable|string|max:255',
            'mother_contact_number' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'father_contact_number' => 'nullable|string|max:255',
            'philippine_address' => 'nullable|string|max:500',
            'uae_address' => 'nullable|string|max:500',
            'previous_school' => 'nullable|string|max:255',
        ]);

        $normalizedName = preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($validated['full_name']));
        $validated['normalized_name'] = trim((string) $normalizedName);

        $before = $learner->toArray();
        $learner->update($validated);

        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'learner.updated',
            'subject_type' => Learner::class,
            'subject_id' => $learner->id,
            'before' => $before,
            'after' => $learner->refresh()->toArray(),
        ]);

        return redirect()->route('learners.show', $learner->id);
    }

    public function disable(Learner $learner): RedirectResponse
    {
        $activeYear = AcademicYear::query()->where('is_active', true)->first();
        $enrollment = $learner->enrollments()
            ->when($activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id))
            ->firstOrFail();

        $metadata = $enrollment->metadata ?? [];
        $metadata['disabled_by'] = auth()->id();

        $enrollment->update([
            'status' => 'disabled',
            'metadata' => $metadata,
        ]);

        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'learner.disabled',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
        ]);

        return redirect()->route('learners.index');
    }

    public function destroy(Learner $learner): RedirectResponse
    {
        $learnerId = $learner->id;
        $learner->delete();

        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'learner.deleted',
            'subject_type' => Learner::class,
            'subject_id' => $learnerId,
        ]);

        return redirect()->route('learners.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function learnerPayload(Learner $learner, bool $includeProfile = false): array
    {
        $enrollment = $learner->enrollments->first();
        $documentRequirements = $enrollment?->documentRequirements ?? collect();
        $summary = [
            'ok' => $documentRequirements->where('status', DocumentStatus::Ok)->count(),
            'missing' => $documentRequirements->where('status', DocumentStatus::Missing)->count(),
            'expired' => $documentRequirements->where('status', DocumentStatus::Expired)->count(),
            'pending_review' => $documentRequirements->where('status', DocumentStatus::PendingReview)->count(),
            'total' => $documentRequirements->count(),
        ];

        $payload = [
            'id' => $learner->id,
            'lrn' => $learner->lrn,
            'full_name' => $learner->full_name,
            'birth_date' => $learner->birth_date?->toDateString(),
            'gender' => $learner->gender,
            'mother_contact_number' => $learner->mother_contact_number,
            'father_contact_number' => $learner->father_contact_number,
            'uae_address' => $learner->uae_address,
            'current_enrollment' => $enrollment ? [
                'id' => $enrollment->id,
                'level' => $enrollment->level,
                'status' => $enrollment->status,
                'academic_year' => $enrollment->academicYear?->name,
            ] : null,
            'document_summary' => $summary,
        ];

        if (! $includeProfile) {
            return $payload;
        }

        return array_merge($payload, [
            'mother_maiden_name' => $learner->mother_maiden_name,
            'father_name' => $learner->father_name,
            'philippine_address' => $learner->philippine_address,
            'previous_school' => $learner->previous_school,
            'document_requirements' => $documentRequirements
                ->sortBy(fn ($requirement) => array_search($requirement->document_type, DocumentType::cases(), true))
                ->values()
                ->map(fn ($requirement) => [
                    'id' => $requirement->id,
                    'document_type' => $requirement->document_type->value,
                    'label' => $requirement->document_type->label(),
                    'status' => $requirement->status->value,
                    'verified_at' => $requirement->verified_at?->toDateTimeString(),
                    'expires_on' => $requirement->expires_on?->toDateString(),
                    'notes' => $requirement->notes,
                ]),
        ]);
    }

    /**
     * @return list<string>
     */
    private function levelOptions(?AcademicYear $activeYear): array
    {
        return Enrollment::query()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
            ->whereNotNull('level')
            ->distinct()
            ->orderBy('level')
            ->pluck('level')
            ->all();
    }

    /**
     * @return list<string>
     */
    private function statusOptions(?AcademicYear $activeYear): array
    {
        return Enrollment::query()
            ->when($activeYear, fn ($query) => $query->where('academic_year_id', $activeYear->id))
            ->whereNotNull('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->all();
    }
}
