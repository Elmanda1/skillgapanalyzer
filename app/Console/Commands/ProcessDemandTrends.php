<?php

namespace App\Console\Commands;

use App\Services\ETL\DemandTrendAggregatorService;
use Illuminate\Console\Command;

class ProcessDemandTrends extends Command
{
    protected $signature = 'etl:process-trends
                            {--source=loker.id : Source name to tag the aggregated trends}';

    protected $description = 'Aggregate job vacancy demand into historical period snapshots (demand_trends table)';

    public function handle(DemandTrendAggregatorService $aggregator): int
    {
        $source = (string) $this->option('source');
        $this->info("Memulai agregasi demand trends dari source: [{$source}]...");

        $start = microtime(true);
        $result = $aggregator->aggregate($source);
        $elapsed = round(microtime(true) - $start, 2);

        $this->newLine();
        $this->info("Agregasi demand trends selesai dalam {$elapsed}s:");
        $this->info("  • Total periode diproses: {$result['periods']}");
        $this->info("  • Total record demand_trends diupdate/dibuat: {$result['records_updated']}");

        return self::SUCCESS;
    }
}
