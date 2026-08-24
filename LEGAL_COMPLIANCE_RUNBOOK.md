# Legal Compliance & Operational Runbook

## Skill Gap Analyzer — Data Pipeline

**Version:** 1.0  
**Date:** 2026-08-24  
**Classification:** Internal — Confidential

---

## 1. Legal Compliance Framework

### 1.1 Applicable Regulations

| Regulation | Scope | Compliance Status |
|------------|-------|-------------------|
| **UU PDP (UU 27/2022)** | Personal Data Protection | ✅ Compliant — PII filtering implemented |
| **UU ITE (UU 11/2008)** | Electronic Information & Transactions | ✅ Compliant — robots.txt compliance, rate limiting |
| **UU Hak Cipta (UU 28/2014)** | Copyright & Database Rights | ✅ Compliant — Transformative use, no republication |
| **GDPR (Reference)** | EU Data Protection Standard | ✅ Best Practice Applied |

### 1.2 Data Processing Principles

| Principle | Implementation |
|-----------|----------------|
| **Lawfulness** | Public data only (no login/paywall bypass) |
| **Fairness** | Transparent bot identification via User-Agent |
| **Transparency** | Open source code, documented pipeline |
| **Purpose Limitation** | Curriculum intelligence only |
| **Data Minimization** | PII stripped at ingestion |
| **Accuracy** | Cross-validation with rendered text |
| **Storage Limitation** | No PII retained, logs auto-expire |
| **Integrity** | Idempotent imports, referential integrity |
| **Accountability** | Structured logging, audit trail |

---

## 2. Scraping Policy Configuration

### 2.1 Policy Registry

Configured in `scraping_policies` table:

```php
// Example: loker.id policy
[
    'domain' => 'loker.id',
    'rate_limit_per_minute' => 30,
    'rate_limit_per_hour' => 1000,
    'crawl_delay_seconds' => 2.0,
    'allowed_paths' => ['/cari-lowongan-kerja*', '/lowongan/*'],
    'disallowed_paths' => ['/admin*', '/api/*', '/account*', '/login*'],
    'user_agent' => 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot)',
    'pii_fields_to_strip' => ['email', 'phone', 'recruiter_name', ...],
    'custom_headers' => ['Accept-Language' => 'id-ID,id;q=0.9,en;q=0.8'],
    'is_active' => true,
]
```

### 2.2 Robots.txt Compliance

- **Check**: Every request validates against `robots.txt` via `urllib.robotparser`
- **Fail-Open**: If `robots.txt` unreachable or HTML challenge → allow (fail-open)
- **Crawl Delay**: Respected from `robots.txt` or policy config (whichever higher)
- **User-Agent**: `SkillGapBot/1.0` with contact URL

### 2.3 PII Filtering (UU PDP Compliance)

**Fields Stripped at Ingestion:**

| Category | Fields |
|----------|--------|
| Contact | `email`, `phone`, `phone_number`, `mobile`, `whatsapp` |
| Recruiter | `recruiter_name`, `recruiter_email`, `recruiter_phone`, `hr_email`, `hr_phone` |
| Contact Person | `contact_person`, `contact_person_email`, `contact_person_phone` |
| Identity | `ktp`, `npwp`, `alamat_lengkap` |
| Financial | `bank_account`, `bank_account_number`, `bank_name` |
| Emergency | `emergency_contact`, `emergency_phone` |

**Implementation**: Recursive stripping from job JSON at detail scraping phase.

---

## 3. Operational Runbook

### 3.1 Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Scheduler  │───▶│  Python     │───▶│   Laravel   │───▶│  Analysis   │
│  (Cron/Queue)│    │  Scraper    │    │  Import     │    │  Engine     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                 │                 │
       ▼                  ▼                 ▼                 ▼
  Schedule/Queue    robots.txt/PII      Import/Validate   Analyze/Report
```

### 3.2 Scheduled Operations

| Job | Frequency | Command | Queue |
|-----|-----------|---------|-------|
| Full Pipeline | Daily 02:00 | `jobs:fetch-scheduled --policy=loker.id --phase=all` | job_fetching |
| Enumeration Only | Hourly | `jobs:fetch-scheduled --policy=loker.id --phase=enumerate --max-pages=10` | job_fetching |
| Detail Refresh | 6-hourly | `jobs:fetch-scheduled --policy=loker.id --phase=detail --max-jobs=100` | job_fetching |
| Analysis Refresh | Daily 04:00 | `analysis:run` | default |

### 3.3 Manual Commands

```bash
# Full pipeline (sync)
php artisan jobs:fetch-scheduled --policy=loker.id --phase=all --max-pages=50 --max-jobs=500 --workers=4

# Async via queue
php artisan jobs:fetch-scheduled --policy=loker.id --phase=all --queue

# Dry run (preview)
php artisan jobs:fetch-scheduled --policy=loker.id --phase=enumerate --max-pages=2 --dry-run

# Force run (bypass lock)
php artisan jobs:fetch-scheduled --policy=loker.id --phase=all --force

# Import only (with memory limit)
php -d memory_limit=512M artisan jobs:import --file=database/datajson/lowongan_loker_id.json --source=loker.id

# Health check
curl https://skillgapanalyzer.test/api/health
```

### 3.4 Queue Management

```bash
# Start worker
php artisan queue:work job_fetching --timeout=3600 --tries=3 --sleep=3

# Monitor
php artisan queue:monitor job_fetching

# Retry failed
php artisan queue:retry all

# Clear failed
php artisan queue:flush job_fetching
```

---

## 4. Monitoring & Alerting

### 4.1 Health Check Endpoint

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2026-08-24T18:06:33+00:00",
  "checks": {
    "database": {"status": "healthy", "message": "Connected"},
    "queue": {"status": "healthy", "pending_jobs": 0},
    "scraping_pipeline": {"status": "healthy", "last_run": "2026-08-24T17:57:46Z"},
    "data_freshness": {"status": "healthy", "latest_crawl": "2026-08-24"},
    "redis": {"status": "degraded", "message": "Redis not available"},
    "storage": {"status": "healthy", "free_percent": 44.3},
    "active_policies": {"status": "healthy", "count": 1}
  }
}
```

**HTTP Status**: 200 (healthy/degraded), 503 (unhealthy)

### 4.2 Key Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Pipeline last run | > 60 min | Warning |
| Pipeline last run | > 24 hrs | Critical |
| Data freshness | > 1 day | Warning |
| Data freshness | > 7 days | Critical |
| Queue pending | > 100 | Warning |
| Queue pending | > 500 | Critical |
| Disk free | < 10% | Warning |
| Disk free | < 5% | Critical |
| Failed jobs (1h) | > 5 | Warning |
| Failed jobs (1h) | > 20 | Critical |

### 4.3 Log Locations

| Log | Location | Format |
|-----|----------|--------|
| Scraper | `database/datajson/_logs/scraper_YYYYMMDD.log` | JSON |
| Laravel | `storage/logs/laravel.log` | Single-line |
| Queue | `storage/logs/laravel.log` | Single-line |
| Import | `storage/logs/laravel.log` | Single-line |

---

## 5. Incident Response

### 5.1 Common Issues

| Symptom | Diagnosis | Resolution |
|---------|-----------|------------|
| Scraper 403/429 | Rate limit / Cloudflare | Increase `crawl_delay_seconds`, reduce workers |
| Robots.txt block | Path disallowed | Check `disallowed_paths` in policy |
| PII leak | Fields not stripped | Verify `pii_fields_to_strip` config |
| Import OOM | Memory limit | Increase `--memory_limit=512M` |
| Queue stuck | Worker dead | Restart `queue:work`, check failed jobs |
| Lock stuck | Previous crash | `cache:forget job_fetch_loker.id_phase` |

### 5.2 Escalation Matrix

| Severity | Response Time | Owner |
|----------|---------------|-------|
| Critical (data loss, pipeline down) | 15 min | Platform Engineer |
| High (pipeline degraded) | 1 hour | Platform Engineer |
| Medium (data stale) | 4 hours | Data Engineer |
| Low (minor issue) | 24 hours | Data Engineer |

---

## 6. Data Retention & Backup

### 6.1 Retention Policy

| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| Raw job JSON | 90 days | Auto-cleanup |
| Scraping logs | 30 days | Auto-cleanup |
| Import logs | 90 days | Auto-cleanup |
| Analysis results | Indefinite | Manual |
| PII-stripped data | Indefinite | Manual |

### 6.2 Backup Schedule

| Data | Frequency | Destination |
|------|-----------|-------------|
| Database (SQLite dump) | Daily 03:00 | S3/MinIO |
| Job JSON files | Weekly | S3/MinIO |
| Scraping logs | Daily | S3/MinIO |
| Configuration | On change | Git |

---

## 7. Deployment Checklist

### 7.1 Pre-deployment

- [ ] `php artisan migrate --force`
- [ ] `php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] `php artisan view:cache`
- [ ] `npm run build`
- [ ] Verify `APP_KEY` set
- [ ] Verify `DB_CONNECTION=sqlite` or PostgreSQL
- [ ] Verify `QUEUE_CONNECTION=database`
- [ ] Verify `ScrapingPolicy` seeded

### 7.2 Post-deployment Verification

- [ ] `curl /api/health` → `{"status":"healthy"}`
- [ ] `php artisan jobs:fetch-scheduled --dry-run --policy=loker.id`
- [ ] `php artisan jobs:fetch-scheduled --policy=loker.id --phase=enumerate --max-pages=1`
- [ ] `php artisan jobs:import --file=database/datajson/lowongan_loker_id.json`
- [ ] `php artisan analysis:run`
- [ ] Check `/api/v1/dashboard/summary` returns data

---

## 8. Appendix

### 8.1 Key Files

| File | Purpose |
|------|---------|
| `data-engine/scrape_loker_enhanced.py` | Main scraper |
| `data-engine/scraper_compliance.py` | Compliance utilities |
| `app/Console/Commands/JobFetchScheduler.php` | Scheduler command |
| `app/Jobs/FetchJobsJob.php` | Queue job |
| `app/Models/ScrapingPolicy.php` | Policy model |
| `app/Models/ScrapingLog.php` | Audit log model |
| `app/Http/Controllers/HealthCheckController.php` | Health endpoint |
| `config/queue.php` | Queue config |
| `database/seeders/ScrapingPolicySeeder.php` | Policy seeder |

### 8.2 Environment Variables

```env
# Database
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Queue
QUEUE_CONNECTION=database
DB_QUEUE_TABLE=jobs
DB_QUEUE_RETRY_AFTER=3600

# Scraping
SCRAPER_CRAWL_DELAY=2.0
SCRAPER_RATE_LIMIT=30

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=info
```

---

*End of Document*  
*Reviewed by: Platform Engineering Team*  
*Next Review: 2026-11-24*