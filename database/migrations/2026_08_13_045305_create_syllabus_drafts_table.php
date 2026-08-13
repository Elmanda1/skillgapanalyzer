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
        Schema::create('syllabus_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gap_analysis_id')->constrained()->cascadeOnDelete();
            $table->text('konten_draft');
            $table->string('status')->default('draft');
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('syllabus_drafts');
    }
};
