<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->boolean('registration_settled')->default(false)->after('financial_status');
            $table->timestamp('registration_settled_at')->nullable()->after('registration_settled');
            $table->foreignId('registration_settled_by')->nullable()->after('registration_settled_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['registration_settled_by']);
            $table->dropColumn(['registration_settled', 'registration_settled_at', 'registration_settled_by']);
        });
    }
};
