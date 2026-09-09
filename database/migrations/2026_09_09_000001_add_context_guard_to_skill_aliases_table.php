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
        Schema::table('skill_aliases', function (Blueprint $table) {
            $table->boolean('min_context_required')->default(false)->after('alias_name');
            $table->json('context_keywords')->nullable()->after('min_context_required');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('skill_aliases', function (Blueprint $table) {
            $table->dropColumn(['min_context_required', 'context_keywords']);
        });
    }
};
