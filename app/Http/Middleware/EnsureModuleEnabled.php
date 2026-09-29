<?php

namespace App\Http\Middleware;

use App\Support\RegistrarModules;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleEnabled
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$moduleKeys): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403);
        }

        $allowed = false;
        foreach ($moduleKeys as $keyGroup) {
            $keys = explode(',', $keyGroup);
            foreach ($keys as $key) {
                if (RegistrarModules::isEnabledForRole($user->role, trim($key))) {
                    $allowed = true;
                    break 2;
                }
            }
        }

        abort_unless($allowed, 403);

        return $next($request);
    }
}
