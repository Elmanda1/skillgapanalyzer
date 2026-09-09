<?php

namespace App\Services\Scraping;

use App\Models\ScrapingPolicy;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Psr\Http\Message\ResponseInterface;

class ScrapingHttpClient
{
    public function __construct(
        private ScrapingPolicy $policy
    ) {}

    public function get(string $url, array $extraHeaders = []): ?string
    {
        $this->checkRobotsTxt($url);

        $headers = array_merge($this->policy->custom_headers ?? [], $extraHeaders);
        $headers['User-Agent'] = $headers['User-Agent'] ?? $this->policy->user_agent ?? 'SkillGapBot/1.0';

        $delay = $this->policy->getEffectiveCrawlDelay();
        usleep((int) ($delay * 1_000_000));

        $maxRetries = 4;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;

            try {
                $response = Http::retry(0)
                    ->timeout(30)
                    ->withHeaders($headers)
                    ->get($url);

                $this->logRequest($url, $response);

                if ($response->successful()) {
                    return $response->body();
                }

                if ($response->status() === 404) {
                    Log::info("Scraping: 404 Not Found", ['url' => $url]);
                    return null;
                }

                if (in_array($response->status(), [403, 429, 503])) {
                    $retryAfter = $response->header('Retry-After');
                    $waitTime = $retryAfter ? (int) $retryAfter : (10 * $attempt + 5);

                    Log::warning("Scraping: Rate limited ({$response->status()}), waiting {$waitTime}s", [
                        'url' => $url,
                        'attempt' => $attempt,
                    ]);

                    sleep(min($waitTime, 300));
                    continue;
                }

                Log::warning("Scraping: HTTP {$response->status()}", ['url' => $url]);
                sleep(3 * $attempt);

            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                Log::warning("Scraping: Connection failed (attempt {$attempt}/{$maxRetries})", [
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
                sleep(2 * $attempt);
            } catch (\Throwable $e) {
                Log::error("Scraping: Unexpected error", [
                    'url' => $url,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return null;
            }
        }

        Log::error("Scraping: Max retries exhausted", ['url' => $url]);
        return null;
    }

    public function post(string $url, array $data, array $extraHeaders = []): ?string
    {
        $headers = array_merge($this->policy->custom_headers ?? [], $extraHeaders);
        $headers['User-Agent'] = $headers['User-Agent'] ?? $this->policy->user_agent ?? 'SkillGapBot/1.0';

        $delay = $this->policy->getEffectiveCrawlDelay();
        usleep((int) ($delay * 1_000_000));

        try {
            $response = Http::retry(3, 1000)
                ->timeout(30)
                ->withHeaders($headers)
                ->post($url, $data);

            $this->logRequest($url, $response);

            return $response->successful() ? $response->body() : null;

        } catch (\Throwable $e) {
            Log::error("Scraping POST failed", ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }

    private function checkRobotsTxt(string $url): void
    {
        if (!$this->policy->isPathAllowed($url)) {
            Log::warning("Scraping: Path disallowed by policy", ['url' => $url, 'policy' => $this->policy->domain]);
        }
    }

    private function logRequest(string $url, $response): void
    {
        Log::debug("Scraping request", [
            'url' => $url,
            'status' => $response->status(),
            'duration_ms' => $response->transferStats?->getTransferTime() ?? 0,
            'policy' => $this->policy->domain,
        ]);
    }

    public function stripPii(string $text): string
    {
        $piiFields = $this->policy->pii_fields_to_strip ?? [];
        
        foreach ($piiFields as $field) {
            $pattern = '/\b' . preg_quote($field, '/') . '\b/i';
            $text = preg_replace($pattern, '[REDACTED]', $text);
        }

        return $text;
    }
}