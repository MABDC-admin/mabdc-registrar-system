<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE finance_ledgers DROP CONSTRAINT IF EXISTS finance_ledgers_type_check");
            DB::statement("ALTER TABLE finance_ledgers ADD CONSTRAINT finance_ledgers_type_check CHECK (type::text = ANY (ARRAY['charge'::text, 'payment'::text, 'discount'::text, 'tax'::text, 'refund'::text]))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE finance_ledgers DROP CONSTRAINT IF EXISTS finance_ledgers_type_check");
            DB::statement("ALTER TABLE finance_ledgers ADD CONSTRAINT finance_ledgers_type_check CHECK (type::text = ANY (ARRAY['charge'::text, 'payment'::text, 'discount'::text, 'tax'::text]))");
        }
    }
};
