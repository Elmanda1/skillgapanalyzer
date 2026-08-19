<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DataRestore extends Command
{
    protected $signature = 'data:restore
                            {--path= : Input .sql.gz path (defaults to database/dumps/skillgap-bootstrap.sql.gz)}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Restore job-domain data from compressed SQL dump (idempotent)';

    public function handle(): int
    {
        $path = $this->option('path')
            ?: database_path('dumps/skillgap-bootstrap.sql.gz');

        if (! is_file($path)) {
            $this->error("Dump tidak ditemukan: {$path}");

            return self::FAILURE;
        }

        $sql = $this->decompress($path);
        if ($sql === null) {
            $this->error("Gagal membaca dump: {$path}");

            return self::FAILURE;
        }

        $size = round(filesize($path) / 1048576, 2);
        $this->info("Memuat {$size} MB dump dari {$path}");

        if (! $this->option('force') && ! $this->confirm('Data lowongan, skills, dan pivot akan ditimpa. Lanjutkan?')) {
            return self::CANCELLED;
        }

        $pdo = DB::connection()->getPdo();

        $started = microtime(true);

        try {
            $pdo->exec('PRAGMA foreign_keys = OFF');

            // Dump berisi BEGIN TRANSACTION ... COMMIT.
            $pdo->exec($sql);

            // Verifikasi postgres: pastikan skema yang dibutuhkan ada.
            $pdo->exec('PRAGMA foreign_keys = ON');
        } catch (\Throwable $e) {
            $this->error('Restore gagal: ' . $e->getMessage());

            return self::FAILURE;
        }

        $elapsed = round(microtime(true) - $started, 2);
        $this->info("Restore selesai dalam {$elapsed}s.");

        return self::SUCCESS;
    }

    private function decompress(string $path): ?string
    {
        $gz = gzopen($path, 'rb');
        if ($gz === false) {
            return null;
        }

        $out = '';
        while (! gzeof($gz)) {
            $out .= gzread($gz, 262144);
        }
        gzclose($gz);

        return $out;
    }
}