<?php

namespace App\Providers;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Mail\Transport\MabdcApiTransport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register the custom MABDC HTTP Mail API transport
        Mail::extend('mabdc-api', function (array $config) {
            return new MabdcApiTransport(
                apiKey:      $config['api_key']      ?? config('mail.mailers.mabdc-api.api_key'),
                apiUrl:      $config['api_url']      ?? 'https://api-mail.mabdc.com/v1/emails',
                fromAddress: $config['from_address'] ?? 'noreply@mabdc.org',
                fromName:    $config['from_name']    ?? config('app.name', 'MABDC School'),
            );
        });
    }
}
