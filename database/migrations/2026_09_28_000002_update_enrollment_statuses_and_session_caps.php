<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->boolean('session_slot_reserved')->default(false)->after('session');
            $table->timestamp('downpayment_verified_at')->nullable()->after('session_slot_reserved');
            $table->string('downpayment_receipt_no')->nullable()->after('downpayment_verified_at');
            $table->boolean('capacity_waitlisted')->default(false)->after('downpayment_receipt_no');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn([
                'session_slot_reserved',
                'downpayment_verified_at',
                'downpayment_receipt_no',
                'capacity_waitlisted',
            ]);
        });
    }
};
