<?php

namespace App\Http\Middleware;

use App\Support\RegistrarModules;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'modulePermissions' => fn () => $request->user()
                    ? RegistrarModules::permissionsForRole($request->user()->role)
                    : [],
            ],
            'modules' => RegistrarModules::modules(),
            'modulePermissions' => RegistrarModules::permissionsByRole(),
            'recentNotifications' => fn () => $request->user()
                ? \App\Models\AuditEvent::with('actor:id,name')
                    ->latest()
                    ->take(5)
                    ->get(['id', 'actor_id', 'event_type', 'subject_type', 'created_at'])
                    ->map(fn ($event) => [
                        'id' => $event->id,
                        'actor' => $event->actor ? $event->actor->name : 'System',
                        'event_type' => $event->event_type,
                        'subject_type' => class_basename($event->subject_type),
                        'created_at' => $event->created_at->diffForHumans(),
                    ])
                : [],
            'pendingRegistrationCount' => fn () => $request->user()
                ? \App\Models\AdmissionApplication::query()
                    ->whereNull('learner_id')
                    ->where(function ($q) {
                        $q->where('status', \App\Enums\ApplicationStatus::AwaitingDownpayment->value)
                          ->orWhere('status', 'awaiting_downpayment')
                          ->orWhereNull('status')
                          ->orWhere('status', 'pending');
                    })
                    ->count()
                : 0,
            'recentPendingRegistrations' => fn () => $request->user()
                ? \App\Models\AdmissionApplication::query()
                    ->whereNull('learner_id')
                    ->where(function ($q) {
                        $q->where('status', \App\Enums\ApplicationStatus::AwaitingDownpayment->value)
                          ->orWhere('status', 'awaiting_downpayment')
                          ->orWhereNull('status')
                          ->orWhere('status', 'pending');
                    })
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get(['id', 'first_name', 'middle_name', 'last_name', 'level_applied_for', 'created_at'])
                    ->map(fn ($app) => [
                        'id' => $app->id,
                        'full_name' => $app->full_name,
                        'level_applied_for' => $app->level_applied_for,
                        'created_at' => $app->created_at?->diffForHumans() ?? 'Just now',
                    ])
                    ->values()
                : [],
        ];
    }
}
