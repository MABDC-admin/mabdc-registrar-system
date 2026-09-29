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
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('academic_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('learner_id')->nullable()->constrained()->nullOnDelete(); // Populated when officially enrolled
            
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            
            $table->date('date_of_birth')->nullable();
            $table->string('email')->nullable();
            $table->string('contact_number')->nullable();
            
            $table->string('level_applied_for')->nullable();
            $table->string('classification')->default('new'); // new, returning, transferee
            $table->string('status')->default('inquiry'); // inquiry, for_assessment, approved_for_enrollment, etc.
            
            $table->json('metadata')->nullable(); // Everything else (parents, schedule)
            
            $table->timestamps();
            
            $table->index(['status', 'academic_year_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admission_applications');
    }
};
