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
        // 1. Snapshot dosen awal pada mata kuliah jika di-override Kaprodi
        Schema::table('courses', function (Blueprint $table) {
            $table->json('original_dosen_snapshot')->nullable()->after('override_notes');
        });

        // 2. Snapshot dosen awal pada learning_outcomes (CPMK) jika di-override Kaprodi
        Schema::table('learning_outcomes', function (Blueprint $table) {
            $table->text('original_dosen_text')->nullable()->after('override_notes');
        });

        // 3. Snapshot dosen awal pada pemetaan skill (course_skill) jika di-override Kaprodi
        Schema::table('course_skill', function (Blueprint $table) {
            $table->json('original_dosen_skills_snapshot')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_skill', function (Blueprint $table) {
            $table->dropColumn('original_dosen_skills_snapshot');
        });

        Schema::table('learning_outcomes', function (Blueprint $table) {
            $table->dropColumn('original_dosen_text');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('original_dosen_snapshot');
        });
    }
};
