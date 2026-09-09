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
        Schema::table('scraping_agents', function (Blueprint $table) {
            if (! Schema::hasColumn('scraping_agents', 'agent_code')) {
                $table->string('agent_code')->nullable()->after('id');
            }
            if (! Schema::hasColumn('scraping_agents', 'domain_url')) {
                $table->string('domain_url')->nullable()->after('agent_code');
            }
            if (! Schema::hasColumn('scraping_agents', 'sumber')) {
                $table->string('sumber')->nullable()->after('domain_url');
            }
            if (! Schema::hasColumn('scraping_agents', 'max_pages')) {
                $table->integer('max_pages')->default(10)->after('volume_data');
            }
            if (! Schema::hasColumn('scraping_agents', 'max_jobs')) {
                $table->integer('max_jobs')->default(15)->after('max_pages');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scraping_agents', function (Blueprint $table) {
            $table->dropColumn(['agent_code', 'domain_url', 'sumber', 'max_pages', 'max_jobs']);
        });
    }
};
