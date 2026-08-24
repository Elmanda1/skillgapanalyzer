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
        Schema::create('scraping_policies', function (Blueprint $table) {
            $table->id();
            $table->string('domain')->unique();
            $table->string('name');
            $table->string('base_url');
            $table->string('robots_txt_url')->nullable();
            $table->unsignedInteger('rate_limit_per_minute')->default(60);
            $table->unsignedInteger('rate_limit_per_hour')->default(1000);
            $table->float('crawl_delay_seconds')->default(1.0);
            $table->json('allowed_paths')->nullable();
            $table->json('disallowed_paths')->nullable();
            $table->string('user_agent')->default('SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot)');
            $table->boolean('requires_auth')->default(false);
            $table->json('auth_config')->nullable();
            $table->json('pii_fields_to_strip')->nullable();
            $table->json('custom_headers')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_robots_check_at')->nullable();
            $table->string('robots_check_status')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['domain', 'is_active']);
        });

        Schema::create('scraping_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scraping_policy_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->string('method')->default('GET');
            $table->unsignedSmallInteger('status_code')->nullable();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->json('request_headers')->nullable();
            $table->json('response_headers')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('items_found')->default(0);
            $table->unsignedInteger('items_imported')->default(0);
            $table->unsignedInteger('pii_stripped_count')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->default('pending'); // pending, running, success, failed, rate_limited
            $table->unsignedSmallInteger('retry_count')->default(0);
            $table->timestamps();

            $table->index(['scraping_policy_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scraping_logs');
        Schema::dropIfExists('scraping_policies');
    }
};