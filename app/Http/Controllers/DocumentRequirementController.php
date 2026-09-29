<?php

namespace App\Http\Controllers;

use App\Enums\DocumentStatus;
use App\Models\AuditEvent;
use App\Models\DocumentRequirement;
use App\Models\Learner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

use App\Services\OpenRouterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class DocumentRequirementController extends Controller
{
    protected OpenRouterService $openRouter;

    public function __construct(OpenRouterService $openRouter)
    {
        $this->openRouter = $openRouter;
    }
    public function update(Request $request, Learner $learner, DocumentRequirement $documentRequirement): RedirectResponse
    {
        abort_unless($documentRequirement->enrollment()->where('learner_id', $learner->id)->exists(), 404);

        $validated = $request->validate([
            'status' => ['required', Rule::enum(DocumentStatus::class)],
            'expires_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $before = $this->snapshot($documentRequirement);

        $documentRequirement->update([
            'status' => $validated['status'],
            'expires_on' => $validated['expires_on'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);
        $documentRequirement->refresh();

        AuditEvent::query()->create([
            'actor_id' => $request->user()?->id,
            'event_type' => 'document_requirement.updated',
            'subject_type' => DocumentRequirement::class,
            'subject_id' => $documentRequirement->id,
            'before' => $before,
            'after' => $this->snapshot($documentRequirement),
            'metadata' => [
                'learner_id' => $learner->id,
                'enrollment_id' => $documentRequirement->enrollment_id,
            ],
        ]);

        return redirect()->route('learners.show', $learner);
    }

    public function analyze(Request $request, Learner $learner, DocumentRequirement $documentRequirement): JsonResponse
    {
        abort_unless($documentRequirement->enrollment()->where('learner_id', $learner->id)->exists(), 404);

        $request->validate([
            'file' => ['required', 'file', 'image', 'max:10240'], // Max 10MB images
        ]);

        $file = $request->file('file');
        $base64 = base64_encode(file_get_contents($file->getRealPath()));
        $mime = $file->getMimeType();

        $result = $this->openRouter->analyzeDocument(
            $base64,
            $mime,
            $learner->full_name,
            $documentRequirement->document_type->label()
        );

        if (!$result) {
            return response()->json(['error' => 'Failed to parse document details.'], 500);
        }

        return response()->json($result);
    }

    public function upload(Request $request, Learner $learner, DocumentRequirement $documentRequirement): RedirectResponse
    {
        abort_unless($documentRequirement->enrollment()->where('learner_id', $learner->id)->exists(), 404);

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'status' => ['required', Rule::enum(DocumentStatus::class)],
            'expires_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $file = $request->file('file');
        $path = $file->store("enrollment_documents/{$documentRequirement->enrollment_id}", 'public');

        $before = $this->snapshot($documentRequirement);

        // Save metadata like filepath
        $metadata = $documentRequirement->metadata ?? [];
        $metadata['file_path'] = $path;
        $metadata['file_name'] = $file->getClientOriginalName();
        $metadata['mime_type'] = $file->getMimeType();

        $documentRequirement->update([
            'status' => $request->status,
            'expires_on' => $request->expires_on ?? null,
            'notes' => $request->notes ?? null,
            'metadata' => $metadata,
            'verified_at' => $request->status === DocumentStatus::Verified->value ? now() : null,
        ]);

        $documentRequirement->refresh();

        AuditEvent::query()->create([
            'actor_id' => $request->user()?->id,
            'event_type' => 'document_requirement.uploaded',
            'subject_type' => DocumentRequirement::class,
            'subject_id' => $documentRequirement->id,
            'before' => $before,
            'after' => $this->snapshot($documentRequirement),
            'metadata' => [
                'learner_id' => $learner->id,
                'enrollment_id' => $documentRequirement->enrollment_id,
                'file_path' => $path,
            ],
        ]);

        return redirect()->back()->with('success', 'Document uploaded and updated successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshot(DocumentRequirement $documentRequirement): array
    {
        return [
            'document_type' => $documentRequirement->document_type->value,
            'status' => $documentRequirement->status->value,
            'expires_on' => $documentRequirement->expires_on?->toDateString(),
            'notes' => $documentRequirement->notes,
        ];
    }
}
