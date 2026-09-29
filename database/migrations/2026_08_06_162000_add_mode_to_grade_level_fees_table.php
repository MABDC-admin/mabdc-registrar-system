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
        Schema::table('grade_level_fees', function (Blueprint $table) {
            // Drop unique index on grade_level
            $table->dropUnique('grade_level_fees_grade_level_unique');
            
            // Add mode column
            $table->string('mode')->default('face_to_face');
            
            // Add unique index on grade_level and mode
            $table->unique(['grade_level', 'mode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_level_fees', function (Blueprint $table) {
            $table->dropUnique(['grade_level', 'mode']);
            $table->dropColumn('mode');
            $table->unique('grade_level');
        });
    }
};
