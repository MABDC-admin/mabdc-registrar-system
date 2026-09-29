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
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId("learner_id")->nullable()->constrained()->cascadeOnDelete();
            $table->string("type");
            $table->string("subject");
            $table->text("message");
            $table->enum("status", ["draft", "sent", "failed"])->default("draft");
            $table->timestamp("sent_at")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
