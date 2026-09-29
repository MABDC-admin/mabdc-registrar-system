<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\AuditEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function index(): Response
    {
        $usersCount = User::count();
        
        $usersBreakdown = User::query()
            ->selectRaw('role, count(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();
            
        // Ensure standard keys exist
        $usersBreakdown = array_merge([
            'admin' => 0,
            'registrar' => 0,
            'user' => 0,
        ], $usersBreakdown);

        $auditEventsCount = AuditEvent::count();
        
        $recentAuditEvents = AuditEvent::with('actor:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'event_type' => $e->event_type,
                'actor_name' => optional($e->actor)->name ?? 'System',
                'subject_type' => $e->subject_type ? class_basename($e->subject_type) : null,
                'created_at' => $e->created_at->format('M d, Y h:i A'),
                'created_at_human' => $e->created_at->diffForHumans(),
                'message' => $e->metadata['message'] ?? $e->event_type,
            ]);

        $activeYear = AcademicYear::where('is_active', true)->first();
        $totalAcademicYears = AcademicYear::count();

        // System Diagnostics
        $diagnostics = [
            'cpu_load' => '0.08',
            'memory_used' => '35%',
            'disk_free' => '84 GB',
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_os' => PHP_OS,
        ];

        // Try to get CPU Load dynamically on Linux systems
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            if ($load !== false) {
                $diagnostics['cpu_load'] = round($load[0], 2);
            }
        }

        // Try to parse MemInfo dynamically on Linux systems
        if (file_exists('/proc/meminfo')) {
            $meminfo = @file_get_contents('/proc/meminfo');
            if ($meminfo) {
                preg_match('/MemTotal:\s+(\d+)/', $meminfo, $totalMatches);
                preg_match('/MemFree:\s+(\d+)/', $meminfo, $freeMatches);
                preg_match('/Cached:\s+(\d+)/', $meminfo, $cachedMatches);
                preg_match('/Buffers:\s+(\d+)/', $meminfo, $buffersMatches);

                if (isset($totalMatches[1]) && isset($freeMatches[1])) {
                    $totalMem = (int) $totalMatches[1];
                    $freeMem = (int) $freeMatches[1];
                    $cachedMem = isset($cachedMatches[1]) ? (int) $cachedMatches[1] : 0;
                    $buffersMem = isset($buffersMatches[1]) ? (int) $buffersMatches[1] : 0;

                    $usedMem = $totalMem - ($freeMem + $cachedMem + $buffersMem);
                    $pct = round(($usedMem / $totalMem) * 100);
                    $diagnostics['memory_used'] = $pct . '%';
                }
            }
        }

        // Disk diagnostics
        if (function_exists('disk_free_space') && function_exists('disk_total_space')) {
            $freeSpace = @disk_free_space('/');
            $totalSpace = @disk_total_space('/');
            if ($freeSpace !== false && $totalSpace !== false) {
                $diagnostics['disk_free'] = round($freeSpace / (1024 * 1024 * 1024), 1) . ' GB / ' . round($totalSpace / (1024 * 1024 * 1024), 1) . ' GB';
            }
        }

        return Inertia::render('Admin/Index', [
            'usersCount' => $usersCount,
            'usersBreakdown' => $usersBreakdown,
            'auditEventsCount' => $auditEventsCount,
            'recentAuditEvents' => $recentAuditEvents,
            'activeYearName' => $activeYear ? $activeYear->name : 'None',
            'totalAcademicYears' => $totalAcademicYears,
            'diagnostics' => $diagnostics,
        ]);
    }
}
