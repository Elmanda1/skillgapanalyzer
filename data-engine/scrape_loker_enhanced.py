# -*- coding: utf-8 -*-
"""
Scraper loker.id (Enhanced) - Legal Compliant Version.

Menghasilkan data yang langsung bisa di-import oleh pipeline Laravel:
  - database/datajson/{id}.json               arsip mentah per lowongan
  - database/datajson/lowongan_loker_id.json  agregat flat yang dibaca
                                              `php artisan jobs:import`
  - database/datajson/_index.json             daftar id + slug + job_skills
  - database/datajson/_listing/page_{n}.json  arsip halaman listing

Features:
- robots.txt compliance checking
- PII filtering for legal compliance (UU PDP, UU ITE, UU Hak Cipta)
- Structured JSON logging for observability
- Rate limiting per policy from database
- Resumable, retry, backoff, rate-limiting, politeness
- Legal compliance: UU PDP (27/2022), UU ITE (11/2008), UU Hak Cipta (28/2014)

Inspirasi: scrape_loker_v2.py
"""
import argparse
import json
import logging
import os
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from threading import Lock
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, Any, List, Set

import requests

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from scraper_compliance import (
    BASE_URL, LIST_URL, LISTING_ROUTE, DETAIL_ROUTE,
    OUT_DIR, INDEX_PATH, AGGREGATE_PATH, LIST_RAW_DIR, LOGS_DIR, WORK_DIR,
    DEFAULT_HEADERS, PII_FIELD_NAMES,
    get_session, fetch_with_compliance, setup_logging,
    strip_pii_from_job_record, is_path_allowed_by_robots,
    now_iso, RATE_LIMITER, SESSION, SESSION_LOCK,
    extract_remix, loader_data, listing_from_ctx,
    parse_listing_loader, parse_detail_loader,
    name_of, record_from_detail,
)

# ========================================================================
# PATHS & GLOBALS
# ========================================================================

INDEX_PATH = OUT_DIR / "_index.json"
AGGREGATE_PATH = OUT_DIR / "lowongan_loker_id.json"
LIST_RAW_DIR = OUT_DIR / "_listing"
LOGS_DIR = OUT_DIR / "_logs"
MIN_INTERVAL = 2.0

# ========================================================================
# POLICY LOADING
# ========================================================================

def load_policy_from_env() -> Dict[str, Any]:
    """Load scraping policy from environment or use defaults for loker.id."""
    # In production, this would load from database via API
    # For now, use the loker.id policy from seeder
    return {
        'domain': 'loker.id',
        'name': 'loker.id - Indonesian Job Portal',
        'base_url': BASE_URL,
        'robots_txt_url': f'{BASE_URL}/robots.txt',
        'rate_limit_per_minute': 30,
        'rate_limit_per_hour': 1000,
        'crawl_delay_seconds': 2.0,
        'allowed_paths': [
            '/cari-lowongan-kerja*',
            '/lowongan/*',
            '/perusahaan/*',
        ],
        'disallowed_paths': [
            '/admin*', '/api/*', '/account*', '/login*', '/register*',
            '/search*', '*/edit*', '*/delete*',
        ],
        'user_agent': 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
        'requires_auth': False,
        'pii_fields_to_strip': list(PII_FIELD_NAMES),
        'custom_headers': {
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Cache-Control': 'no-cache',
        },
        'is_active': True,
    }


# ========================================================================
# PARSING FUNCTIONS (re-exported from compliance module)
# ========================================================================

# Re-export from compliance module
# extract_remix, loader_data, listing_from_ctx, parse_listing_loader,
# parse_detail_loader, name_of, record_from_detail are imported above


# ========================================================================
# PHASE 1: ENUMERASI HALAMAN LISTING (Enhanced with Compliance)
# ========================================================================

def enumerate_pages(policy: Dict[str, Any], logger, max_pages: int = None) -> List[Dict[str, Any]]:
    """Enumerasi halaman listing dengan compliance checking."""
    correlation_id = str(uuid.uuid4())[:8]
    logger = logging.LoggerAdapter(logger, {'correlation_id': correlation_id, 'policy_domain': policy['domain']})
    
    LAST = None
    page = 1
    index = []
    total = 0
    last_saved = 0
    fails = 0
    LIST_RAW_DIR.mkdir(parents=True, exist_ok=True)

    logger.info(f"Starting enumeration (max_pages={max_pages})")

    while True:
        if max_pages and page > max_pages:
            logger.info(f"Reached max_pages limit ({max_pages})")
            break

        saved = LIST_RAW_DIR / f"page_{page}.json"
        if saved.exists():
            with open(saved, encoding="utf-8") as f:
                ctx = json.load(f)
            jobs, meta = listing_from_ctx(ctx)
            if meta:
                LAST = meta.get("last_page")
                total = meta.get("total")
            if jobs:
                for j in jobs:
                    index.append({
                        "id": j.get("id"),
                        "slug": j.get("slug"),
                        "job_skills": j.get("job_skills") or [],
                    })
                last_saved = page
                logger.info(f"Page {page}: SKIP (cached, {len(jobs)} jobs)")
                if LAST and page >= LAST:
                    break
                page += 1
                continue

        url = LIST_URL if page == 1 else f"{LIST_URL}/page/{page}"
        
        # Check robots.txt
        if not is_path_allowed_by_robots(BASE_URL, urlparse(url).path, policy.get('user_agent', '*')):
            logger.warning(f"Page {page} disallowed by robots.txt: {url}")
            break

        html = fetch_with_compliance(url, policy, logger, correlation_id=correlation_id)
        if not html:
            fails += 1
            logger.warning(f"Page {page}: FAIL ({fails}/5)")
            if fails >= 5:
                logger.error(f"Too many consecutive failures, stopping. last_saved={last_saved}")
                break
            time.sleep(15)
            continue
        
        fails = 0
        ctx = extract_remix(html)
        saved.parent.mkdir(parents=True, exist_ok=True)
        with open(saved, "w", encoding="utf-8") as f:
            json.dump(ctx, f, ensure_ascii=False)
        
        jobs, meta = parse_listing_loader(html)
        if meta:
            LAST = meta.get("last_page")
            total = meta.get("total")
        if not jobs:
            logger.info(f"Page {page}: no jobs, stop.")
            break
        
        for j in jobs:
            index.append({
                "id": j.get("id"),
                "slug": j.get("slug"),
                "job_skills": j.get("job_skills") or [],
            })
        
        last_saved = page
        logger.info(f"Page {page}: {len(jobs)} jobs (total {len(index)})")
        
        if LAST and page >= LAST:
            break
        page += 1
        time.sleep(policy.get('crawl_delay_seconds', 2.0))

    # dedupe by id
    seen = set()
    uniq = []
    for rec in index:
        if rec["id"] not in seen:
            seen.add(rec["id"])
            uniq.append(rec)
    
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump({"last_page": LAST, "total_reported": total, "jobs": uniq}, f, ensure_ascii=False)
    
    logger.info(f"Enumeration done. last_page={LAST}, unique ids: {len(uniq)} (reported total {total})")
    return uniq


def load_index() -> Optional[Dict]:
    if not INDEX_PATH.exists():
        return None
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ========================================================================
# PHASE 2: DETAIL PER JOB (Enhanced with PII Filtering)
# ========================================================================

def detail_pending() -> tuple:
    idx = load_index()
    if not idx:
        idx = {"jobs": []}
    done = {p.stem for p in OUT_DIR.glob("*.json")
            if p.name not in ("lowongan_loker_id.json", "_index.json")}
    pending = [j for j in idx.get("jobs", []) if str(j["id"]) not in done]
    return idx, pending


def fetch_and_save_detail(job_id: int, policy: Dict[str, Any], logger, correlation_id: str = None) -> tuple:
    """Fetch detail with PII filtering."""
    url = f"{LIST_URL}?jobid={job_id}"
    
    # Check robots.txt
    if not is_path_allowed_by_robots(BASE_URL, urlparse(url).path, policy.get('user_agent', '*')):
        logger.warning(f"Detail URL disallowed by robots.txt: {url}")
        return job_id, None
    
    html = fetch_with_compliance(url, policy, logger, correlation_id=correlation_id)
    if not html:
        return job_id, None
    
    job, company, pathname, similar = parse_detail_loader(html)
    if job is None:
        return job_id, None
    
    listing_url = f"{BASE_URL}{pathname}" if pathname else url
    
    # Build payload
    payload = {
        "id": job_id,
        "listing_url": listing_url,
        "job": job,
        "company": company,
        "job_similar": similar or [],
    }
    
    # Apply PII filtering before saving
    pii_fields = set(PII_FIELD_NAMES)
    payload, pii_stripped = strip_pii_from_job_record(payload, pii_fields)
    
    if pii_stripped > 0:
        logger.info(f"PII stripped from job {job_id}: {pii_stripped} fields")
    
    with open(OUT_DIR / f"{job_id}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    
    return job_id, payload


def scrape_details(
    policy: Dict[str, Any],
    logger,
    workers: int = 4,
    max_jobs: int = None,
    sample: int = None
) -> tuple:
    idx, pending = detail_pending()
    logger.info(f"Pending {len(pending)} jobs for detail scraping.")
    
    if max_jobs:
        pending = pending[:max_jobs]
    if sample:
        import random
        pending = random.sample(pending, min(sample, len(pending)))
    
    skills_by_id = {str(j["id"]): j.get("job_skills") or []
                    for j in (idx.get("jobs") or [])}
    
    done = 0
    failed = []
    
    with ThreadPoolExecutor(max_workers=workers) as ex:
        fut2id = {ex.submit(fetch_and_save_detail, j["id"], policy, logger): j["id"] for j in pending}
        for fut in as_completed(fut2id):
            jid = fut2id[fut]
            try:
                _jid, payload = fut.result()
            except Exception as e:
                failed.append((jid, repr(e)))
                logger.error(f"Job {jid} failed: {e}", extra={'job_id': jid})
                continue
            if payload is None:
                failed.append((jid, "no-data"))
                continue
            done += 1
            if done % 50 == 0:
                logger.info(f"Processed {done} jobs ({len(failed)} failed)")
    
    logger.info(f"Detail scraping done: {done} success, {len(failed)} failed")
    return done, failed


# ========================================================================
# PHASE 3: BUILD AGGREGATE
# ========================================================================

def build_aggregate() -> List[Dict]:
    """Baca semua per-job {id}.json -> array flat yang dibaca ImportJobs."""
    skills_by_id = {}
    if INDEX_PATH.exists():
        with open(INDEX_PATH, encoding="utf-8") as f:
            idx = json.load(f)
        skills_by_id = {str(j["id"]): j.get("job_skills") or []
                        for j in (idx.get("jobs") or [])}

    records = []
    skipped = 0
    for p in sorted(OUT_DIR.glob("*.json"), key=lambda p: int(p.stem)
                    if p.stem.isdigit() else -1):
        if p.name in ("lowongan_loker_id.json", "_index.json"):
            continue
        try:
            with open(p, encoding="utf-8") as f:
                rec = json.load(f)
        except (json.JSONDecodeError, OSError):
            skipped += 1
            continue
        
        job = rec.get("job") or {}
        row = record_from_detail(
            job,
            rec.get("company"),
            (rec.get("listing_url") or "").replace(BASE_URL, "") or None,
            rec.get("listing_url"),
            skills_by_id.get(str(rec.get("id"))),
        )
        if not row.get("id") and row.get("detail_url"):
            row["id"] = rec.get("id")
        records.append(row)

    records.sort(key=lambda r: int(r.get("id") or 0))
    
    # --------------------------------------------------------------------
    # 1. Snapshot generation before overwrite
    # --------------------------------------------------------------------
    snapshots_dir = OUT_DIR / "snapshots"
    snapshots_dir.mkdir(parents=True, exist_ok=True)
    
    old_records = []
    if AGGREGATE_PATH.exists():
        try:
            with open(AGGREGATE_PATH, encoding="utf-8") as f:
                old_records = json.load(f)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            snapshot_path = snapshots_dir / f"lowongan_{timestamp}.json"
            with open(snapshot_path, "w", encoding="utf-8") as sf:
                json.dump(old_records, sf, ensure_ascii=False)
            logging.getLogger("scraper").info(f"[SNAPSHOT] Salinan agregat lama disimpan ke {snapshot_path}")
        except Exception as e:
            logging.getLogger("scraper").warning(f"[SNAPSHOT] Gagal membuat snapshot: {e}")

    # --------------------------------------------------------------------
    # 2. Guard Rail Sanity Check (Prevent False Expiration on >50% drop)
    # --------------------------------------------------------------------
    n_old = len(old_records)
    n_new = len(records)
    
    if n_old > 0 and n_new < (n_old * 0.50):
        logging.getLogger("scraper").warning(
            f"[WARNING] Guard Rail Triggered: Jumlah lowongan baru ({n_new}) turun drastis "
            f"dibandingkan run sebelumnya ({n_old}). Menutup overwrite penuh untuk mencegah false expiration!"
        )
        # Merge new records into old records to protect active data
        merged_dict = {str(r.get("id")): r for r in old_records if r.get("id")}
        for r in records:
            if r.get("id"):
                merged_dict[str(r.get("id"))] = r
        records = sorted(merged_dict.values(), key=lambda r: int(r.get("id") or 0))
        logging.getLogger("scraper").info(f"[GUARD_RAIL] Data berhasil digabungkan (Total aman: {len(records)} records).")

    with open(AGGREGATE_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)
    
    logging.getLogger("scraper").info(f"[AGG] {len(records)} records -> {AGGREGATE_PATH} (skipped {skipped})")
    return records


# ========================================================================
# MAIN CLI
# ========================================================================

def main():
    ap = argparse.ArgumentParser(description="Scraper loker.id - Legal Compliant")
    ap.add_argument("--phase", choices=["enumerate", "detail", "aggregate", "all"],
                    default="all")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--max-jobs", type=int, default=None)
    ap.add_argument("--max-pages", type=int, default=None)
    ap.add_argument("--sample", type=int, default=None)
    ap.add_argument("--interval", type=float, default=2.0,
                    help="minimum interval antar request (detik)")
    ap.add_argument("--out", default=None,
                    help="folder output (default database/datajson)")
    ap.add_argument("--correlation-id", default=None,
                    help="Correlation ID for tracing (auto-generated if not provided)")
    args = ap.parse_args()

    global OUT_DIR, INDEX_PATH, AGGREGATE_PATH, LIST_RAW_DIR, LOGS_DIR, MIN_INTERVAL
    OUT_DIR = Path(args.out) if args.out else OUT_DIR
    INDEX_PATH = OUT_DIR / "_index.json"
    AGGREGATE_PATH = OUT_DIR / "lowongan_loker_id.json"
    LIST_RAW_DIR = OUT_DIR / "_listing"
    LOGS_DIR = OUT_DIR / "_logs"
    MIN_INTERVAL = args.interval
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Setup structured logging
    correlation_id = args.correlation_id or str(uuid.uuid4())[:8]
    logger = setup_logging(LOGS_DIR, correlation_id)
    logger = logging.LoggerAdapter(logger, {'correlation_id': correlation_id})

    # Load policy
    policy = load_policy_from_env()
    RATE_LIMITER.set_interval(policy.get('crawl_delay_seconds', 2.0))

    logger.info(f"Starting scraper for {policy['name']} (domain: {policy['domain']})")
    logger.info(f"Rate limit: {policy['rate_limit_per_minute']}/min, crawl delay: {policy['crawl_delay_seconds']}s")

    try:
        if args.phase in ("enumerate", "all"):
            enumerate_pages(policy, logger, max_pages=args.max_pages)
            if args.phase == "enumerate":
                return

        if args.phase in ("detail", "all"):
            if not INDEX_PATH.exists():
                logger.warning("Index empty -> running enumeration first.")
                enumerate_pages(policy, logger)
            scrape_details(policy, logger, workers=args.workers,
                          max_jobs=args.max_jobs, sample=args.sample)

        if args.phase in ("aggregate", "all"):
            build_aggregate()

        logger.info("All phases completed successfully")

    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()