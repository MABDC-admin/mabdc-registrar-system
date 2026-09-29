<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('other'); // tuition, registration, misc, books, uniform, etc.
            $table->decimal('amount', 10, 2);
            $table->foreignId('academic_year_id')->nullable()->constrained()->nullOnDelete();
            $table->string('level')->nullable(); // e.g. L1, L2. If null, applies to all
            $table->boolean('is_optional')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_structures');
    }
};
