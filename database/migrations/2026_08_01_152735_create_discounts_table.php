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
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g. Sibling Discount
            $table->string('type')->default('scholarship'); // sibling, employee, academic, financial, promo, special
            $table->string('amount_type')->default('fixed'); // fixed, percentage
            $table->decimal('value', 10, 2);
            $table->string('status')->default('Requested'); // Requested, Under Review, Approved, Rejected
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
