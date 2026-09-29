<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->string('household_code')->unique()->nullable();
            $table->string('family_name');
            $table->string('primary_contact_name')->nullable();
            $table->string('primary_email')->nullable()->index();
            $table->string('primary_phone')->nullable();
            $table->text('address')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::table('learners', function (Blueprint $table) {
            $table->foreignId('household_id')->nullable()->after('id')->constrained('households')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('learners', function (Blueprint $table) {
            $table->dropForeign(['household_id']);
            $table->dropColumn('household_id');
        });

        Schema::dropIfExists('households');
    }
};
