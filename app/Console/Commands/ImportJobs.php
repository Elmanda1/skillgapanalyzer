<?php

namespace App\Console\Commands;

use App\Models\JobVacancy;
use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportJobs extends Command
{
    protected $signature = 'jobs:import
                            {--file= : Path to loker.id JSON dump (defaults to database/datajson/lowongan_loker_id.json)}
                            {--limit= : Stop after N records (useful for smoke tests)}';

    protected $description = 'Stream-import loker.id job vacancies (idempotent via slug)';

    private array $skillByKey = [];

    private array $aliasByKey = [];

    private int $created = 0;

    private int $updated = 0;

    private int $createdSkills = 0;

    private int $attachedSkills = 0;

    public function handle(): int
    {
        $path = $this->option('file') ?: database_path('datajson/lowongan_loker_id.json');

        if (! is_file($path)) {
            $this->error("File tidak ditemukan: {$path}");

            return self::FAILURE;
        }

        $this->loadSkillIndex();
        $this->info("Streaming import dari: {$path}");

        $started = microtime(true);
        $processed = $this->streamObjects($path, fn (array $obj) => $this->processObject($obj));

        $elapsed = round(microtime(true) - $started, 2);
        $this->newLine();
        $this->info("Selesai dalam {$elapsed}s — {$processed} lowongan diproses.");
        $this->info("  • Dibuat: {$this->created} | Diupdate: {$this->updated}");
        $this->info("  • Skill baru: {$this->createdSkills} | Attach pivot: {$this->attachedSkills}");

        return self::SUCCESS;
    }

    /**
     * Preload case-insensitive skill + alias lookup maps (small: ~73 skills).
     */
    private function loadSkillIndex(): void
    {
        foreach (Skill::query()->get(['id', 'nama']) as $skill) {
            $this->skillByKey[$this->key($skill->nama)] = $skill->id;
        }

        foreach (SkillAlias::query()->get(['skill_id', 'alias_name']) as $alias) {
            $this->aliasByKey[$this->key($alias->alias_name)] = $alias->skill_id;
        }

        $this->info('Index skill dimuat: ' . count($this->skillByKey) . ' nama + ' . count($this->aliasByKey) . ' alias.');
    }

    /**
     * Stream a pretty-printed JSON array of objects without loading it whole.
     * Yields each top-level object via callback. String-aware brace counting.
     *
     * @return int number of objects yielded
     */
    private function streamObjects(string $path, callable $cb): int
    {
        $handle = fopen($path, 'rb');
        $depth = 0;
        $inString = false;
        $escaped = false;
        $started = false;
        $buffer = '';
        $processed = 0;
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        while (($line = fgets($handle)) !== false) {
            $len = strlen($line);

            for ($i = 0; $i < $len; $i++) {
                $c = $line[$i];

                if ($inString) {
                    if ($escaped) {
                        $escaped = false;
                    } elseif ($c === '\\') {
                        $escaped = true;
                    } elseif ($c === '"') {
                        $inString = false;
                    }
                    $buffer .= $c;

                    continue;
                }

                if ($c === '"') {
                    $inString = true;
                    $buffer .= $c;
                } elseif ($c === '{') {
                    $depth++;
                    if ($depth === 1) {
                        $started = true;
                    }
                    if ($started) {
                        $buffer .= $c;
                    }
                } elseif ($c === '}') {
                    if ($started) {
                        $buffer .= $c;
                    }
                    $depth--;
                    if ($started && $depth === 0) {
                        $obj = json_decode($buffer, true);
                        $buffer = '';
                        $started = false;

                        if (is_array($obj)) {
                            $cb($obj);
                            $processed++;
                        }

                        if ($limit !== null && $processed >= $limit) {
                            fclose($handle);

                            return $processed;
                        }
                    }
                } elseif ($started) {
                    $buffer .= $c;
                }
            }
        }

        fclose($handle);

        return $processed;
    }

    private function processObject(array $obj): void
    {
        $slug = $this->value($obj, 'slug') ?? (string) $this->value($obj, 'id');
        $sourceUrl = $this->value($obj, 'detail_url')
            ?? $this->value($obj, 'listing_url')
            ?? $this->value($obj, 'source_url')
            ?? 'https://www.loker.id/lowongan/' . $slug;

        $data = [
            'sumber' => 'loker.id',
            'tanggal_crawl' => $this->crawlDate($obj),
            'sektor' => $this->value($obj, 'industry') ?? $this->firstOf($obj, 'industries', 'name') ?? 'Umum',
            'lokasi' => $this->value($obj, 'location') ?? $this->firstOf($obj, 'locations', 'name') ?? '',
            'slug' => $slug,
            'title' => $this->value($obj, 'title'),
            'company_name' => $this->value($obj, 'company_name'),
            'company_logo' => $this->value($obj, 'company_logo') ?? $this->value($obj, 'company_image'),
            'source_url' => $sourceUrl,
            'salary_min' => $this->intOrNull($this->value($obj, 'salary_min')),
            'salary_max' => $this->intOrNull($this->value($obj, 'salary_max')),
            'job_type' => $this->value($obj, 'job_type'),
            'job_experience' => $this->value($obj, 'job_experience'),
            'is_remote' => (bool) ($this->value($obj, 'is_remote') ?? false),
            'published_at' => $this->datetimeOrNull($this->value($obj, 'published_at') ?? $this->value($obj, 'post_date')),
            'closed_at' => $this->datetimeOrNull($this->value($obj, 'closed_at')),
        ];

        DB::transaction(function () use ($data, $obj) {
            $job = JobVacancy::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );

            $wasRecentlyCreated = $job->wasRecentlyCreated;
            $wasRecentlyCreated ? $this->created++ : $this->updated++;

            $skillIds = $this->resolveSkillIds($obj);

            if (! empty($skillIds)) {
                $job->skills()->syncWithoutDetaching($skillIds);
                $this->attachedSkills += count($skillIds);
            }
        });
    }

    /**
     * Resolve job_skills[] into skill ids, creating missing skills.
     */
    private function resolveSkillIds(array $obj): array
    {
        $ids = [];

        foreach ((array) ($obj['job_skills'] ?? []) as $entry) {
            $name = is_array($entry) ? ($entry['name'] ?? null) : $entry;
            if (! is_string($name) || trim($name) === '') {
                continue;
            }
            $ids[] = $this->resolveSkill($name);
        }

        return array_values(array_unique($ids));
    }

    private function resolveSkill(string $name): int
    {
        $key = $this->key($name);

        if (isset($this->skillByKey[$key])) {
            return $this->skillByKey[$key];
        }

        if (isset($this->aliasByKey[$key])) {
            return $this->aliasByKey[$key];
        }

        $skill = Skill::query()->create([
            'nama' => trim($name),
            'kategori' => 'Industri',
            'sektor_industri_terkait' => 'Umum',
            'dimension' => 'hard_technical',
            'is_hard_skill' => true,
        ]);

        $this->skillByKey[$key] = $skill->id;
        $this->createdSkills++;

        return $skill->id;
    }

    private function key(?string $value): string
    {
        return mb_strtolower(trim((string) $value));
    }

    private function value(array $obj, string $key)
    {
        return $obj[$key] ?? null;
    }

    private function firstOf(array $obj, string $arrKey, string $field)
    {
        foreach ((array) ($obj[$arrKey] ?? []) as $item) {
            if (is_array($item) && ! empty($item[$field])) {
                return $item[$field];
            }
        }

        return null;
    }

    private function intOrNull($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function datetimeOrNull($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    private function crawlDate(array $obj): string
    {
        $ts = $this->value($obj, 'published_at') ?? $this->value($obj, 'post_date') ?? now();

        try {
            return date('Y-m-d', strtotime((string) $ts));
        } catch (\Throwable) {
            return now()->toDateString();
        }
    }
}
