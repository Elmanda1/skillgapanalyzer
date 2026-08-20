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
        Schema::create('demand_trends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->string('period'); // e.g. "2026-08" or "2026-Q3"
            $table->unsignedInteger('frequency')->default(0);
            $table->decimal('percentage', 5, 2)->default(0.00); // 0.00% to 100.00%
            $table->string('source')->default('loker.id');
            $table->decimal('growth_rate', 6, 2)->nullable(); // e.g. +12.50% or -5.20%
            $table->timestamps();

            $table->unique(['skill_id', 'period', 'source']);
            $table->index(['period', 'source']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('demand_trends');
    }
};
