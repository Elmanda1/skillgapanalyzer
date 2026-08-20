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
        Schema::table('gap_analyses', function (Blueprint $table) {
            $table->unique(['study_program_id', 'skill_id', 'periode_data'], 'gap_analyses_program_skill_period_unique');
            $table->index(['study_program_id', 'periode_data'], 'gap_analyses_program_period_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gap_analyses', function (Blueprint $table) {
            $table->dropUnique('gap_analyses_program_skill_period_unique');
            $table->dropIndex('gap_analyses_program_period_index');
        });
    }
};
