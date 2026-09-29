<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditTrailController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $eventType = $request->query('event_type');
        $date = $request->query('date');

        $query = AuditEvent::with('actor:id,name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('event_type', 'like', "%{$search}%")
                  ->orWhere('metadata->message', 'like', "%{$search}%")
                  ->orWhereHas('actor', function ($actorQuery) use ($search) {
                      $actorQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($eventType) {
            $query->where('event_type', $eventType);
        }

        if ($date) {
            $query->whereDate('created_at', $date);
        }

        $events = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($e) => [
                'id' => $e->id,
                'event_type' => $e->event_type,
                'actor_name' => optional($e->actor)->name ?? 'System',
                'subject_type' => $e->subject_type ? class_basename($e->subject_type) : null,
                'subject_id' => $e->subject_id,
                'created_at' => $e->created_at->format('M d, Y h:i A'),
                'created_at_human' => $e->created_at->diffForHumans(),
                'message' => $e->metadata['message'] ?? $e->event_type,
                'after' => $e->after,
                'before' => $e->before,
                'metadata' => $e->metadata,
            ]);

        // Get unique event types for filtering dropdown
        $eventTypes = AuditEvent::select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type');

        return Inertia::render('AuditTrail/Index', [
            'events' => $events,
            'filters' => [
                'search' => $search,
                'event_type' => $eventType,
                'date' => $date,
            ],
            'eventTypes' => $eventTypes,
        ]);
    }
}
