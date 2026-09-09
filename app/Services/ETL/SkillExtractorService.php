<?php

namespace App\Services\ETL;

use App\Models\Skill;
use App\Models\SkillAlias;

class SkillExtractorService
{
    /**
     * @var array<string, array{id: int, name: string, category: string, dimension: string, is_hard: bool, is_alias: bool, raw_term: string}>
     */
    private array $lookupMap = [];

    private int $maxNgram = 4;

    private bool $loaded = false;

    public function __construct()
    {
        $this->loadIndex();
    }

    public function loadIndex(bool $forceReload = false): void
    {
        if ($this->loaded && ! $forceReload) {
            return;
        }

        $this->lookupMap = [];

        // Load skills and their aliases
        $skills = Skill::with('aliases')->get(['id', 'nama', 'kategori', 'dimension', 'is_hard_skill']);

        foreach ($skills as $skill) {
            $meta = [
                'id' => $skill->id,
                'name' => $skill->nama,
                'category' => $skill->kategori ?? 'Umum',
                'dimension' => $skill->dimension ?? 'hard_technical',
                'is_hard' => (bool) ($skill->is_hard_skill ?? true),
                'is_alias' => false,
                'min_context_required' => false,
                'context_keywords' => [],
                'raw_term' => $skill->nama,
            ];

            $canonicalKey = $this->normalizeKey($skill->nama);
            if ($canonicalKey !== '') {
                $this->lookupMap[$canonicalKey] = $meta;
            }

            foreach ($skill->aliases as $alias) {
                $aliasKey = $this->normalizeKey($alias->alias_name);
                if ($aliasKey !== '') {
                    $aliasMeta = $meta;
                    $aliasMeta['is_alias'] = true;
                    $aliasMeta['min_context_required'] = (bool) $alias->min_context_required;
                    $rawKeywords = $alias->context_keywords ?? [];
                    if (is_string($rawKeywords)) {
                        $rawKeywords = json_decode($rawKeywords, true) ?? [];
                    }
                    $aliasMeta['context_keywords'] = array_map(fn ($k) => $this->normalizeKey((string) $k), (array) $rawKeywords);
                    $aliasMeta['raw_term'] = $alias->alias_name;
                    $this->lookupMap[$aliasKey] = $aliasMeta;
                }
            }
        }

        $this->loaded = true;
    }

    /**
     * Clean raw HTML / markdown text.
     */
    public function cleanText(?string $text): string
    {
        if (empty($text)) {
            return '';
        }

        $clean = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $clean = strip_tags($clean);
        $clean = preg_replace('/[\r\n\t]+/', ' ', $clean);
        $clean = preg_replace('/\s{2,}/', ' ', $clean);

        return trim($clean);
    }

    /**
     * Normalize string key for fast dictionary lookup.
     */
    public function normalizeKey(string $term): string
    {
        $term = mb_strtolower(trim($term), 'UTF-8');
        $term = preg_replace('/\s*\/\s*/', '/', $term);

        return $term;
    }

    /**
     * Tokenize text into lowercased words preserving technical symbols (+, #, ., /, -).
     *
     * @return array<string>
     */
    public function tokenize(string $text): array
    {
        if ($text === '') {
            return [];
        }

        $clean = mb_strtolower($text, 'UTF-8');
        // Extract technical tokens
        preg_match_all('/[a-z0-9+#.\/-]+/u', $clean, $matches);

        $tokens = [];
        foreach ($matches[0] ?? [] as $t) {
            $trimmed = trim($t, '.-');
            if ($trimmed !== '') {
                $tokens[] = $trimmed;
            }
        }

        return $tokens;
    }

    /**
     * Extract skills from unstructured text using Hybrid Layer 1 (Exact) and Layer 2 (Alias + Guard).
     *
     * @return array<int, array{id: int, name: string, category: string, dimension: string, matched_term: string, occurrences: int, confidence: float}>
     */
    public function extract(string $rawText, float $minConfidence = 0.5): array
    {
        $cleaned = $this->cleanText($rawText);
        if ($cleaned === '') {
            return [];
        }

        $tokens = $this->tokenize($cleaned);
        $tokenCount = count($tokens);
        if ($tokenCount === 0) {
            return [];
        }

        $matchedSkills = []; // skill_id => data

        // Generate 1-gram to 4-grams and match in O(1) time
        for ($n = 1; $n <= min($this->maxNgram, $tokenCount); $n++) {
            for ($i = 0; $i <= $tokenCount - $n; $i++) {
                $slice = array_slice($tokens, $i, $n);
                $phrase = implode(' ', $slice);
                $key = $this->normalizeKey($phrase);

                if (isset($this->lookupMap[$key])) {
                    $item = $this->lookupMap[$key];
                    $skillId = $item['id'];

                    // Layer 2 Proximity Guard check for ambiguous short aliases
                    if ($item['is_alias'] && $item['min_context_required']) {
                        $winStart = max(0, $i - 5);
                        $winEnd = min($tokenCount - 1, $i + $n - 1 + 5);

                        $contextFound = false;
                        $keywords = $item['context_keywords'] ?? [];

                        for ($k = $winStart; $k <= $winEnd; $k++) {
                            // Skip the matched token slice itself
                            if ($k >= $i && $k < $i + $n) {
                                continue;
                            }

                            if (in_array($tokens[$k], $keywords, true)) {
                                $contextFound = true;
                                break;
                            }
                        }

                        if (! $contextFound) {
                            // Discard false-positive alias match
                            continue;
                        }
                    }

                    $isCanonical = ! $item['is_alias'];

                    if (! isset($matchedSkills[$skillId])) {
                        $matchedSkills[$skillId] = [
                            'id' => $skillId,
                            'name' => $item['name'],
                            'category' => $item['category'],
                            'dimension' => $item['dimension'],
                            'matched_term' => $item['raw_term'],
                            'has_canonical_match' => $isCanonical,
                            'occurrences' => 1,
                            'confidence' => $isCanonical ? 1.0 : 0.90,
                        ];
                    } else {
                        $matchedSkills[$skillId]['occurrences']++;
                        if ($isCanonical) {
                            $matchedSkills[$skillId]['has_canonical_match'] = true;
                            $matchedSkills[$skillId]['matched_term'] = $item['raw_term'];
                            $matchedSkills[$skillId]['confidence'] = 1.0;
                        } elseif ($matchedSkills[$skillId]['occurrences'] >= 2) {
                            $matchedSkills[$skillId]['confidence'] = 1.0;
                        }
                    }
                }
            }
        }

        // Clean up internal flags
        foreach ($matchedSkills as &$m) {
            unset($m['has_canonical_match']);
        }

        $results = array_filter($matchedSkills, fn ($m) => $m['confidence'] >= $minConfidence);

        return array_values($results);
    }

    /**
     * Extract array of canonical skill IDs from text.
     *
     * @return array<int>
     */
    public function extractSkillIds(string $text): array
    {
        $extracted = $this->extract($text);

        return array_column($extracted, 'id');
    }
}

