<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('skill_aliases', function (Blueprint $table) {
            $table->index('skill_id');
        });

        Schema::table('skills', function (Blueprint $table) {
            $table->index(['kategori', 'dimension']);
        });
    }

    public function down(): void
    {
        Schema::table('skill_aliases', function (Blueprint $table) {
            $table->dropIndex(['skill_id']);
        });

        Schema::table('skills', function (Blueprint $table) {
            $table->dropIndex(['kategori', 'dimension']);
        });
    }
};