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
        // 1. Indikator override kaprodi pada mata kuliah
        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('is_overridden')->default(false)->after('status_verifikasi_ekstraksi');
            $table->text('override_notes')->nullable()->after('is_overridden');
            $table->foreignId('overridden_by')->nullable()->after('override_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('overridden_at')->nullable()->after('overridden_by');
        });

        // 2. Indikator override kaprodi pada pivot pemetaan skill (course_skill)
        Schema::table('course_skill', function (Blueprint $table) {
            $table->boolean('is_overridden')->default(false);
            $table->text('override_notes')->nullable();
            $table->foreignId('overridden_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('overridden_at')->nullable();
        });

        // 3. Indikator override kaprodi pada CPMK / Capaian Pembelajaran (learning_outcomes)
        Schema::table('learning_outcomes', function (Blueprint $table) {
            $table->boolean('is_overridden')->default(false)->after('source_doc');
            $table->text('override_notes')->nullable()->after('is_overridden');
            $table->foreignId('overridden_by')->nullable()->after('override_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('overridden_at')->nullable()->after('overridden_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('learning_outcomes', function (Blueprint $table) {
            $table->dropForeign(['overridden_by']);
            $table->dropColumn(['is_overridden', 'override_notes', 'overridden_by', 'overridden_at']);
        });

        Schema::table('course_skill', function (Blueprint $table) {
            $table->dropForeign(['overridden_by']);
            $table->dropColumn(['is_overridden', 'override_notes', 'overridden_by', 'overridden_at']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['overridden_by']);
            $table->dropColumn(['is_overridden', 'override_notes', 'overridden_by', 'overridden_at']);
        });
    }
};
