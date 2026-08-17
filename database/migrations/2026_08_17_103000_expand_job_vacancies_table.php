<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expand job_vacancies to hold full loker.id crawl payloads.
     */
    public function up(): void
    {
        Schema::table('job_vacancies', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('id');
            $table->string('title')->nullable()->after('slug');
            $table->string('company_name')->nullable()->after('title');
            $table->text('company_logo')->nullable()->after('company_name');
            $table->string('source_url')->nullable()->unique()->after('company_logo');
            $table->integer('salary_min')->nullable()->after('source_url');
            $table->integer('salary_max')->nullable()->after('salary_min');
            $table->string('job_type')->nullable()->after('salary_max');
            $table->string('job_experience')->nullable()->after('job_type');
            $table->boolean('is_remote')->default(false)->after('job_experience');
            $table->timestamp('published_at')->nullable()->after('is_remote');
            $table->timestamp('closed_at')->nullable()->after('published_at');

            $table->index('sektor');
            $table->index('lokasi');
        });

        Schema::table('job_vacancy_skill', function (Blueprint $table) {
            $table->unique(['job_vacancy_id', 'skill_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_vacancies', function (Blueprint $table) {
            $table->dropUnique(['source_url']);
            $table->dropIndex(['sektor']);
            $table->dropIndex(['lokasi']);
            $table->dropColumn([
                'slug',
                'title',
                'company_name',
                'company_logo',
                'source_url',
                'salary_min',
                'salary_max',
                'job_type',
                'job_experience',
                'is_remote',
                'published_at',
                'closed_at',
            ]);
        });

        Schema::table('job_vacancy_skill', function (Blueprint $table) {
            $table->dropUnique(['job_vacancy_id', 'skill_id']);
        });
    }
};