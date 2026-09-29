<?php

namespace App\Services;

use App\Models\Enrollment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    /**
     * Send learner enrollment notification to Telegram Bot Channel.
     */
    public static function sendEnrollmentNotification(Enrollment $enrollment): bool
    {
        $botToken = config('services.telegram.bot_token', env('TELEGRAM_BOT_TOKEN'));
        $chatId = config('services.telegram.chat_id', env('TELEGRAM_CHAT_ID'));

        if (!$botToken || !$chatId) {
            Log::info('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
            return false;
        }

        $learnerName = $enrollment->learner?->full_name ?? 'N/A';
        $lrn = $enrollment->learner?->lrn ?? 'Pending';
        $level = $enrollment->level;
        $session = $enrollment->session ?? 'Morning';
        $academicYear = $enrollment->academicYear?->name ?? 'Current SY';

        // Count total active enrolled learners across school
        $totalLearners = Enrollment::where('status', 'enrolled')->count();

        $message = "🎓 *NEW LEARNER ADMITTED & ENROLLED*\n\n"
            . "👤 *Name:* {$learnerName}\n"
            . "🆔 *LRN:* `{$lrn}`\n"
            . "📚 *Grade Level:* {$level}\n"
            . "⏰ *Session:* {$session}\n"
            . "🗓️ *Academic Year:* {$academicYear}\n"
            . "✅ *Registration:* Settled & Approved\n\n"
            . "📊 *Total Active Learners:* *{$totalLearners}*\n"
            . "🏫 *MABDC Registrar System*";

        try {
            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
            $response = Http::post($url, [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            if ($response->successful()) {
                Log::info("Telegram enrollment notification sent for Learner #{$enrollment->learner_id}");
                return true;
            } else {
                Log::warning("Telegram API error: " . $response->body());
                return false;
            }
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram notification: " . $e->getMessage());
            return false;
        }
    }
}
