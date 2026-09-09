<?php

namespace App\Console\Commands;

use App\Models\JobVacancy;
use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * High-Performance Multi-Source Job Importer with Text Evidence Cross-Validation.
 *
 * 5-Pillar Architecture:
 * 1. Unified Data Contract — source-agnostic field mapping
 * 2. Text Evidence Cross-Validation — skills must appear in rendered text
 * 3. O(1) N-gram NLP Discovery — fast keyword discovery without slow regex loops
 * 4. Noise Filtering — discard tag-only skills not backed by text
 * 5. Idempotency & Deduplication — safe to re-run via slug upsert
 */
class ImportJobs extends Command
{
    protected $signature = 'jobs:import
                            {--file= : Path to JSON dump (defaults to database/datajson/lowongan_loker_id.json)}
                            {--limit= : Stop after N records (useful for smoke tests)}
                            {--source=loker.id : Source identifier for multi-source support}
                            {--no-filter : Disable text evidence filtering (import all raw tags)}
                            {--clean : Wipe existing pivot data before import for a fresh start}';

    protected $description = 'Stream-import job vacancies with text-evidence skill validation (idempotent via slug)';

    /** @var array<string, int> skill name (lowered) => skill.id */
    private array $skillByKey = [];

    /** @var array<string, int> alias name (lowered) => skill.id */
    private array $aliasByKey = [];

    /** @var array<int, list<string>> skill.id => [canonical_name, ...aliases] */
    private array $skillTermsById = [];

    /** @var array<string, int> Curated / Canonical taxonomy terms for safe NLP discovery */
    private array $discoveryTerms = [];

    private int $created = 0;
    private int $updated = 0;
    private int $createdSkills = 0;
    private int $attachedSkills = 0;
    private int $filteredNoiseSkills = 0;
    private int $discoveredFromText = 0;
    private int $softExpired = 0;
    private array $importedSlugs = [];

    public function handle(): int
    {
        $path = $this->option('file') ?: database_path('datajson/lowongan_loker_id.json');

        if (! is_file($path)) {
            $this->error("File tidak ditemukan: {$path}");
            return self::FAILURE;
        }

        // Clean slate if requested
        if ($this->option('clean')) {
            $this->warn('Membersihkan data pivot job_vacancy_skill...');
            DB::table('job_vacancy_skill')->truncate();
            $this->info('Pivot table dikosongkan.');
        }

        $this->loadSkillIndex();
        $source = (string) ($this->option('source') ?? 'loker.id');
        $filterEnabled = ! $this->option('no-filter');

        $this->info("Streaming import dari: {$path}");
        $this->info("Source: {$source} | Text filter: " . ($filterEnabled ? 'AKTIF' : 'NONAKTIF'));

        $started = microtime(true);
        $processed = $this->streamObjects($path, fn (array $obj) => $this->processObject($obj, $source, $filterEnabled));

        // Perform Soft-Expiration for DB vacancies missing from active aggregate
        if (! empty($this->importedSlugs)) {
            $this->softExpired = JobVacancy::where('sumber', $source)
                ->where('status', 'active')
                ->whereNotIn('slug', array_keys($this->importedSlugs))
                ->update(['status' => 'expired']);
        }

        $elapsed = round(microtime(true) - $started, 2);
        $this->newLine();
        $this->info("Selesai dalam {$elapsed}s — {$processed} lowongan diproses.");
        $this->info("  • Dibuat: {$this->created} | Diupdate: {$this->updated}");
        $this->info("  • Skill baru: {$this->createdSkills} | Attach pivot: {$this->attachedSkills}");
        $this->info("  • Noise difilter: {$this->filteredNoiseSkills} | Ditemukan dari teks: {$this->discoveredFromText}");
        $this->info("  • Soft-expired: {$this->softExpired} lowongan");

        return self::SUCCESS;
    }

    /**
     * Preload skill + alias lookup maps and reverse lookup tables.
     */
    private function loadSkillIndex(): void
    {
        foreach (Skill::query()->get(['id', 'nama', 'kategori']) as $skill) {
            $key = $this->key($skill->nama);
            $this->skillByKey[$key] = $skill->id;
            $this->skillTermsById[$skill->id][] = $key;

            // ONLY Curated taxonomy skills (TaxonomySeeder: kategori != 'Industri') are eligible for automatic NLP discovery!
            if ($skill->kategori !== 'Industri' && mb_strlen($key) >= 2) {
                $this->discoveryTerms[$key] = $skill->id;
                $noSpace = str_replace(' ', '', $key);
                if ($noSpace !== $key && mb_strlen($noSpace) >= 2) {
                    $this->discoveryTerms[$noSpace] = $skill->id;
                }
            }
        }

        foreach (SkillAlias::query()->with('skill')->get() as $alias) {
            $key = $this->key($alias->alias_name);
            $this->aliasByKey[$key] = $alias->skill_id;
            $this->skillTermsById[$alias->skill_id][] = $key;

            if ($alias->skill && $alias->skill->kategori !== 'Industri' && mb_strlen($key) >= 2) {
                $this->discoveryTerms[$key] = $alias->skill_id;
                $noSpace = str_replace(' ', '', $key);
                if ($noSpace !== $key && mb_strlen($noSpace) >= 2) {
                    $this->discoveryTerms[$noSpace] = $alias->skill_id;
                }
            }
        }

        $this->info('Index skill dimuat: ' . count($this->skillByKey) . ' nama + ' . count($this->aliasByKey) . ' alias.');
    }

    // ─── Pillar 1: Unified Data Contract ────────────────────────────

    /**
     * Build rendered full-text from visible page fields.
     */
    private function buildRenderedText(array $obj): string
    {
        $parts = array_filter([
            $this->value($obj, 'title'),
            $this->stripHtml($this->value($obj, 'content')),
            $this->stripHtml($this->value($obj, 'job_description')),
            $this->stripHtml($this->value($obj, 'qualifications')),
            $this->stripHtml($this->value($obj, 'responsibilities')),
        ]);

        return mb_strtolower(implode(' ', $parts));
    }

    private function stripHtml(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }
        return html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    // ─── Pillar 2, 3, 4: Text Evidence + N-gram NLP Discovery ──────

    /**
     * Generate 1-gram to 4-gram lookup set from text tokens in O(N).
     *
     * @return array<string, bool>
     */
    private function extractNgramMap(string $text): array
    {
        // Tokenize preserving tech symbols (+, #, ., /)
        $rawTokens = preg_split('/[^a-z0-9+#.\/]+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
        if (empty($rawTokens)) {
            return [];
        }

        $ngrams = [];
        $count = count($rawTokens);

        for ($n = 1; $n <= 4; $n++) {
            for ($i = 0; $i + $n <= $count; $i++) {
                $slice = array_slice($rawTokens, $i, $n);
                $joined = implode(' ', $slice);
                $ngrams[$joined] = true;

                // Also index without spaces (e.g. "coreldraw")
                if ($n > 1) {
                    $ngrams[implode('', $slice)] = true;
                }
            }
        }

        return $ngrams;
    }

    /**
     * Resolve and validate skills using N-gram hash lookups.
     */
    private function resolveSkillIds(array $obj, bool $filterEnabled): array
    {
        $fullText = $this->buildRenderedText($obj);
        $ngramMap = $filterEnabled && $fullText !== '' ? $this->extractNgramMap($fullText) : [];
        $matchedSkillIds = [];

        // 1. Process explicit tags from employer / portal
        foreach ((array) ($obj['job_skills'] ?? []) as $entry) {
            $name = is_array($entry) ? ($entry['name'] ?? null) : $entry;
            if (! is_string($name) || trim($name) === '') {
                continue;
            }

            $skillId = $this->resolveSkill($name);

            if (! $filterEnabled) {
                $matchedSkillIds[$skillId] = true;
                continue;
            }

            // Cross-validate against rendered text
            $isValid = false;
            $terms = $this->skillTermsById[$skillId] ?? [$this->key($name)];

            foreach ($terms as $term) {
                if (isset($ngramMap[$term]) || mb_strpos($fullText, $term) !== false) {
                    $isValid = true;
                    break;
                }
            }

            if ($isValid) {
                $matchedSkillIds[$skillId] = true;
            } else {
                $this->filteredNoiseSkills++;
            }
        }

        // 2. NLP Discovery: Scan N-grams against curated taxonomy dictionary
        if ($filterEnabled && ! empty($ngramMap)) {
            foreach ($ngramMap as $ngram => $_) {
                if (isset($this->discoveryTerms[$ngram])) {
                    $skillId = $this->discoveryTerms[$ngram];
                    if (! isset($matchedSkillIds[$skillId])) {
                        $matchedSkillIds[$skillId] = true;
                        $this->discoveredFromText++;
                    }
                }
            }
        }

        return array_keys($matchedSkillIds);
    }

    // ─── Pillar 5: Idempotency & Database Storage ───────────────────

    private function processObject(array $obj, string $source, bool $filterEnabled): void
    {
        $slug = $this->value($obj, 'slug') ?? (string) $this->value($obj, 'id');
        $sourceUrl = $this->value($obj, 'detail_url')
            ?? $this->value($obj, 'listing_url')
            ?? $this->value($obj, 'source_url')
            ?? 'https://www.loker.id/lowongan/' . $slug;

        $this->importedSlugs[$slug] = true;

        $data = [
            'sumber' => $source,
            'tanggal_crawl' => $this->crawlDate($obj),
            'sektor' => $this->value($obj, 'industry') ?? $this->firstOf($obj, 'industries', 'name') ?? 'Umum',
            'lokasi' => $this->value($obj, 'location') ?? $this->firstOf($obj, 'locations', 'name') ?? '',
            'slug' => $slug,
            'status' => 'active',
            'title' => $this->value($obj, 'title'),
            'company_name' => $this->value($obj, 'company_name'),
            'company_logo' => $this->value($obj, 'company_logo') ?? $this->value($obj, 'company_image'),
            'source_url' => $sourceUrl,
            'salary_min' => $this->intOrNull($this->value($obj, 'salary_min')),
            'salary_max' => $this->intOrNull($this->value($obj, 'salary_max')),
            'job_type' => $this->value($obj, 'job_type'),
            'job_experience' => $this->value($obj, 'job_experience'),
            'is_remote' => (bool) ($this->value($obj, 'is_remote') ?? false),
            'published_at' => $this->datetimeOrNull($this->value($obj, 'published_at') ?? $this->value($obj, 'post_date') ?? $this->value($obj, 'display_date') ?? $this->value($obj, 'post_modified')),
            'closed_at' => $this->datetimeOrNull($this->value($obj, 'closed_at')),
        ];

        // Retry up to 3 times for transient SQLite locks
        $maxAttempts = 3;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                DB::transaction(function () use ($data, $obj, $filterEnabled) {
                    $job = JobVacancy::updateOrCreate(
                        ['slug' => $data['slug']],
                        $data
                    );

                    $job->wasRecentlyCreated ? $this->created++ : $this->updated++;

                    $skillIds = $this->resolveSkillIds($obj, $filterEnabled);

                    if (! empty($skillIds)) {
                        $job->skills()->sync($skillIds);
                        $this->attachedSkills += count($skillIds);
                    } else {
                        $job->skills()->detach();
                    }
                });
                break;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($attempt >= $maxAttempts || ! str_contains($e->getMessage(), 'database is locked')) {
                    throw $e;
                }
                usleep(300_000 * $attempt);
            }
        }
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
        $this->skillTermsById[$skill->id][] = $key;
        $this->createdSkills++;

        return $skill->id;
    }

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
