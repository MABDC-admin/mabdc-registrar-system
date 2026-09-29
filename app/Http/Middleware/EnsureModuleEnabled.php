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
    public function handle(Request $request, Closure $next, string $moduleKey): Response
    {
        $user = $request->user();

        abort_unless(
            $user && RegistrarModules::isEnabledForRole($user->role, $moduleKey),
            403,
        );

        return $next($request);
    }
}
