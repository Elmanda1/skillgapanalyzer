<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class DataDump extends Command
{
    protected $signature = 'data:dump
                            {--path= : Output .sql.gz path (defaults to database/dumps/skillgap-bootstrap.sql.gz)}';

    protected $description = 'Export job-domain tables into an idempotent compressed SQL dump';

    /**
     * Tables belonging to the crawler job domain, in dependency order.
     */
    private const TABLES = ['skills', 'skill_aliases', 'job_vacancies', 'job_vacancy_skill'];

    public function handle(): int
    {
        $path = $this->option('path')
            ?: database_path('dumps/skillgap-bootstrap.sql.gz');

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }

        $pdo = DB::connection()->getPdo();

        $gz = gzopen($path, 'wb');
        if ($gz === false) {
            $this->error("Tidak dapat membuka {$path} untuk ditulis.");

            return self::FAILURE;
        }

        fwrite($gz, "BEGIN TRANSACTION;\n");

        foreach (self::TABLES as $table) {
            $columns = array_column($pdo->query("PRAGMA table_info('{$table}')")->fetchAll(), 'name');
            $colSql = '"' . implode('", "', $columns) . '"';

            $stmt = $pdo->query('SELECT * FROM "' . $table . '"');
            $stmt->setFetchMode(PDO::FETCH_ASSOC);

            $count = 0;
            foreach ($stmt as $row) {
                $row = array_values($row);
                $values = array_map(function ($v) use ($pdo) {
                    return $v === null ? 'NULL' : $pdo->quote((string) $v);
                }, $row);

                fwrite($gz, "INSERT OR REPLACE INTO \"{$table}\" ({$colSql}) VALUES (" . implode(',', $values) . ");\n");
                $count++;
            }

            $this->info("  {$table}: {$count} baris");
        }

        fwrite($gz, "COMMIT;\n");
        gzclose($gz);

        $size = round(filesize($path) / 1048576, 2);
        $this->info("Dump selesai: {$path} ({$size} MB).");

        return self::SUCCESS;
    }
}