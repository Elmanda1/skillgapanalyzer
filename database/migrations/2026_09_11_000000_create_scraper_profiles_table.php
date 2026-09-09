<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scraper_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scraping_policy_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('domain')->unique();
            $table->string('strategy')->default('html_selectors'); // api | html_selectors | hybrid
            
            // API config
            $table->json('api_endpoints')->nullable();      
            $table->json('api_headers')->nullable();
            $table->json('json_field_mapping')->nullable();
            $table->string('job_id_extractor')->nullable();
            
            // HTML selector config
            $table->json('list_selectors')->nullable();     
            $table->json('detail_selectors')->nullable();   
            $table->json('pagination')->nullable();         
            
            // Performance overrides
            $table->float('crawl_delay_seconds')->nullable();
            $table->integer('concurrency')->default(4);
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['domain', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scraper_profiles');
    }
};