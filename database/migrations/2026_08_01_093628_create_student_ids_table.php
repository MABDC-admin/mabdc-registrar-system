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
        Schema::create('student_ids', function (Blueprint $table) {
            $table->id();
            $table->foreignId("learner_id")->constrained()->cascadeOnDelete();
            $table->string("qr_code")->unique();
            $table->date("issued_date");
            $table->date("expiry_date");
            $table->enum("status", ["active", "revoked"])->default("active");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_ids');
    }
};
