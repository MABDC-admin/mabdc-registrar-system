<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 'transfer' carries a balance between a learner's academic years. It replaces the
 * 'payment'/'charge'/'discount' entries previously used for carry-forward, which
 * inflated collections and billing totals.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE finance_ledgers DROP CONSTRAINT IF EXISTS finance_ledgers_type_check");
            DB::statement("ALTER TABLE finance_ledgers ADD CONSTRAINT finance_ledgers_type_check CHECK (type::text = ANY (ARRAY['charge'::text, 'payment'::text, 'discount'::text, 'tax'::text, 'refund'::text, 'transfer'::text]))");
        } else {
            Schema::table('finance_ledgers', function (Blueprint $table) {
                $table->enum('type', ['charge', 'payment', 'discount', 'tax', 'refund', 'transfer'])->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE finance_ledgers DROP CONSTRAINT IF EXISTS finance_ledgers_type_check");
            DB::statement("ALTER TABLE finance_ledgers ADD CONSTRAINT finance_ledgers_type_check CHECK (type::text = ANY (ARRAY['charge'::text, 'payment'::text, 'discount'::text, 'tax'::text, 'refund'::text]))");
        } else {
            Schema::table('finance_ledgers', function (Blueprint $table) {
                $table->enum('type', ['charge', 'payment', 'discount', 'tax', 'refund'])->change();
            });
        }
    }
};
