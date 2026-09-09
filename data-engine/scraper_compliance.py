# -*- coding: utf-8 -*-
"""
Scraper loker.id (versi kompatibel Laravel) - Enhanced with Legal Compliance.

Menghasilkan data yang langsung bisa di-import oleh pipeline Laravel:
  - database/datajson/{id}.json               arsip mentah per lowongan
  - database/datajson/lowongan_loker_id.json  agregat flat yang dibaca
                                              `php artisan jobs:import`
  - database/datajson/_index.json             daftar id + slug + job_skills
  - database/datajson/_listing/page_{n}.json  arsip halaman listing

Features:
- robots.txt compliance checking
- PII filtering for legal compliance (UU PDP, UU ITE)
- Structured JSON logging for observability
- Rate limiting per policy
- Resumable, retry, backoff, rate-limiting, politeness
- Structured JSON logging for observability

Inspirasi: scrape_loker_v2.py
Legal Compliance: UU PDP (UU 27/2022), UU ITE (UU 11/2008), UU Hak Cipta (UU 28/2014)
"""
import argparse
import json
import logging
import re
import sys
import time
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, Dict, Any, List, Set
from urllib.parse import urljoin, urlparse
import hashlib

import requests

# ========================================================================
# CONFIGURATION & CONSTANTS
# ========================================================================

BASE_URL = "https://www.loker.id"
LIST_URL = BASE_URL + "/cari-lowongan-kerja"
WORK_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = Path(__file__).resolve().parent.parent / "database" / "datajson"
INDEX_PATH = OUT_DIR / "_index.json"
AGGREGATE_PATH = OUT_DIR / "lowongan_loker_id.json"
LIST_RAW_DIR = OUT_DIR / "_listing"
LOGS_DIR = OUT_DIR / "_logs"

# Nama route Remix tempat data dimuat
LISTING_ROUTE = "routes/_lowongan.cari-lowongan-kerja.(page).($number_page)"
DETAIL_ROUTE = "routes/$parent_category.($child_category).$jobslug[.]html"

# Default headers - identified as a bot
DEFAULT_HEADERS = {
    "User-Agent": "SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Cache-Control": "no-cache",
}

# Robots.txt parser cache
ROBOTS_PARSER_CACHE: Dict[str, urllib.robotparser.RobotFileParser] = {}
ROBOTS_CACHE_LOCK = Lock()

# Rate limiting
SESSION = None
SESSION_LOCK = Lock()
RATE_LOCK = Lock()
_last_req = [0.0]
MIN_INTERVAL = 2.0  # Default, will be overridden by policy

# PII Patterns for filtering (UU PDP compliance)
PII_PATTERNS = [
    # Email patterns
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), '[EMAIL_REDACTED]'),
    # Indonesian phone numbers
    (re.compile(r'(\+62|62|0)8[1-9][0-9]{7,10}\b'), '[PHONE_REDACTED]'),
    (re.compile(r'(\+62|62|0)[2-9][0-9]{7,10}\b'), '[PHONE_REDACTED]'),
    # WhatsApp links
    (re.compile(r'wa\.me/\d+'), '[WHATSAPP_REDACTED]'),
    (re.compile(r'whatsapp\.com/\d+'), '[WHATSAPP_REDACTED]'),
    # Indonesian ID numbers (KTP, NPWP)
    (re.compile(r'\b\d{16}\b'), '[KTP_REDACTED]'),
    (re.compile(r'\b\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}\b'), '[NPWP_REDACTED]'),
    # Bank account
    (re.compile(r'\b\d{10,16}\b'), '[ACCOUNT_REDACTED]'),
]

# PII field names to strip from JSON objects
PII_FIELD_NAMES = {
    'email', 'phone', 'phone_number', 'mobile', 'whatsapp', 'contact_person',
    'recruiter_name', 'recruiter_email', 'recruiter_phone', 'hr_email', 'hr_phone',
    'contact_person_name', 'contact_person_email', 'contact_person_phone',
    'alamat_lengkap', 'ktp', 'npwp', 'bank_account', 'bank_name', 'bank_account_number',
    'emergency_contact', 'emergency_phone',
}

# Regex for extracting Remix context from HTML
RE_REMIX = re.compile(
    r"window\.__remixContext\s*=\s*(\{.*?\})\s*;\s*</script>", re.S
)

# ========================================================================
# STRUCTURED JSON LOGGING
# ========================================================================

class JsonFormatter(logging.Formatter):
    """JSON log formatter with correlation ID support."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, 'correlation_id'):
            log_data['correlation_id'] = record.correlation_id
        if hasattr(record, 'url'):
            log_data['url'] = record.url
        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code
        if hasattr(record, 'duration_ms'):
            log_data['duration_ms'] = record.duration_ms
        if hasattr(record, 'items_count'):
            log_data['items_count'] = record.items_count
        if hasattr(record, 'pii_stripped'):
            log_data['pii_stripped'] = record.pii_stripped
        if hasattr(record, 'policy_domain'):
            log_data['policy_domain'] = record.policy_domain
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(log_dir: Path, correlation_id: str = None) -> logging.Logger:
    """Setup structured JSON logging to file and console."""
    log_dir.mkdir(parents=True, exist_ok=True)
    
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(line_buffering=True)
        except Exception:
            pass

    logger = logging.getLogger("scraper")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()
    
    # File handler - JSON format
    log_file = log_dir / f"scraper_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(JsonFormatter())
    file_handler.setLevel(logging.DEBUG)
    
    # Console handler - human readable
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%H:%M:%S'
    ))
    console_handler.setLevel(logging.INFO)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Add correlation ID filter if provided
    if correlation_id:
        class CorrelationFilter(logging.Filter):
            def filter(self, record):
                record.correlation_id = correlation_id
                return True
        logger.addFilter(CorrelationFilter())
    
    return logger


# ========================================================================
# ROBOTS.TXT COMPLIANCE
# ========================================================================

def get_robots_parser(base_url: str) -> Optional[urllib.robotparser.RobotFileParser]:
    """Get cached robots.txt parser for domain."""
    parsed = urlparse(base_url)
    domain_key = f"{parsed.scheme}://{parsed.netloc}"
    
    with ROBOTS_CACHE_LOCK:
        if domain_key in ROBOTS_PARSER_CACHE:
            return ROBOTS_PARSER_CACHE[domain_key]
        
        rp = urllib.robotparser.RobotFileParser()
        robots_url = urljoin(base_url, '/robots.txt')
        try:
            # Use requests to fetch with proper headers to bypass basic checks
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'SkillGapBot/1.0 (+https://skillgapanalyzer.test/bot; bot@skillgapanalyzer.test)',
                'Accept': 'text/plain,text/html,*/*',
            })
            resp = session.get(robots_url, timeout=10)
            
            # Check if we got a valid robots.txt (not HTML challenge page)
            content_type = resp.headers.get('Content-Type', '')
            if 'text/html' in content_type.lower():
                # Got HTML challenge page (Cloudflare, etc.) - fail open
                return None
            
            if resp.status_code != 200:
                return None
            
            # Parse the robots.txt content
            rp.parse(resp.text.splitlines())
            ROBOTS_PARSER_CACHE[domain_key] = rp
            return rp
        except Exception:
            # If robots.txt can't be read, allow all (fail-open for compatibility)
            return None


def is_path_allowed_by_robots(base_url: str, path: str, user_agent: str = '*') -> bool:
    """Check if path is allowed by robots.txt."""
    rp = get_robots_parser(base_url)
    if rp is None:
        return True  # Fail-open
    return rp.can_fetch(user_agent, urljoin(base_url, path))


def get_crawl_delay(base_url: str, user_agent: str = '*') -> float:
    """Get crawl delay from robots.txt."""
    rp = get_robots_parser(base_url)
    if rp is None:
        return 2.0
    delay = rp.crawl_delay(user_agent)
    return float(delay) if delay else 2.0


# ========================================================================
# PII FILTERING (UU PDP Compliance)
# ========================================================================

def strip_pii_from_text(text: str) -> tuple[str, int]:
    """Strip PII from text using regex patterns. Returns (cleaned_text, count_stripped)."""
    if not text:
        return text, 0
    
    count = 0
    cleaned = text
    for pattern, replacement in PII_PATTERNS:
        matches = pattern.findall(cleaned)
        count += len(matches)
        cleaned = pattern.sub(replacement, cleaned)
    return cleaned, count


def strip_pii_from_dict(obj: Any, pii_fields: Set[str] = None) -> tuple[Any, int]:
    """Recursively strip PII fields from dict/list. Returns (cleaned_obj, count_stripped)."""
    if pii_fields is None:
        pii_fields = PII_FIELD_NAMES
    
    count = 0
    
    if isinstance(obj, dict):
        cleaned = {}
        for key, value in obj.items():
            if key.lower() in pii_fields:
                cleaned[key] = '[REDACTED]'
                count += 1
            else:
                cleaned_value, sub_count = strip_pii_from_dict(value, pii_fields)
                cleaned[key] = cleaned_value
                count += sub_count
        return cleaned, count
    
    elif isinstance(obj, list):
        cleaned = []
        for item in obj:
            cleaned_item, sub_count = strip_pii_from_dict(item, pii_fields)
            cleaned.append(cleaned_item)
            count += sub_count
        return cleaned, count
    
    elif isinstance(obj, str):
        cleaned, sub_count = strip_pii_from_text(obj)
        return cleaned, count + sub_count
    
    return obj, count


def strip_pii_from_job_record(record: Dict[str, Any], pii_fields: Set[str] = None) -> tuple[Dict[str, Any], int]:
    """Strip PII from a job record. Returns (cleaned_record, count_stripped)."""
    total_stripped = 0
    
    # Strip from text fields
    text_fields = ['content', 'job_description', 'qualifications', 'responsibilities', 
                   'screening_questions', 'company_detail', 'description']
    for field in text_fields:
        if field in record and record[field]:
            cleaned, count = strip_pii_from_text(record[field])
            record[field] = cleaned
            total_stripped += count
    
    # Strip from company object
    if 'company' in record and isinstance(record['company'], dict):
        record['company'], count = strip_pii_from_dict(record['company'])
        total_stripped += count
    
    # Strip from job object
    if 'job' in record and isinstance(record['job'], dict):
        record['job'], count = strip_pii_from_dict(record['job'])
        total_stripped += count
    
    # Strip from known PII field names at root level
    for field in list(record.keys()):
        if field.lower() in PII_FIELD_NAMES:
            record[field] = '[REDACTED]'
            total_stripped += 1
    
    return record, total_stripped


# ========================================================================
# RATE LIMITING & POLITENESS
# ========================================================================

class RateLimiter:
    """Thread-safe rate limiter with configurable interval."""
    
    def __init__(self, min_interval: float = 2.0):
        self.min_interval = min_interval
        self._last_req = 0.0
        self._lock = Lock()
    
    def set_interval(self, interval: float):
        self.min_interval = interval
    
    def wait(self):
        sleep_time = 0.0
        with self._lock:
            now = time.time()
            wait = self.min_interval - (now - self._last_req)
            if wait > 0:
                sleep_time = wait
                self._last_req = now + wait
            else:
                self._last_req = now
        if sleep_time > 0:
            time.sleep(sleep_time)


RATE_LIMITER = RateLimiter(MIN_INTERVAL)


# ========================================================================
# SESSION MANAGEMENT
# ========================================================================

SESSION = None
SESSION_LOCK = Lock()

def get_session(headers: Dict[str, str] = None) -> requests.Session:
    global SESSION
    with SESSION_LOCK:
        if SESSION is None:
            s = requests.Session()
            s.headers.update(DEFAULT_HEADERS)
            if headers:
                s.headers.update(headers)
            SESSION = s
        elif headers:
            SESSION.headers.update(headers)
        return SESSION


# ========================================================================
# FETCH WITH COMPLIANCE
# ========================================================================

def fetch_with_compliance(
    url: str,
    policy: Dict[str, Any],
    logger: logging.Logger,
    retries: int = 4,
    timeout: int = 40,
    correlation_id: str = None
) -> Optional[str]:
    """
    Fetch URL with full compliance: robots.txt, rate limiting, retries, PII logging.
    """
    # Check robots.txt
    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    path = parsed.path
    
    if not is_path_allowed_by_robots(base_url, path, policy.get('user_agent', '*')):
        logger.warning(
            f"Path disallowed by robots.txt",
            extra={'url': url, 'policy_domain': policy.get('domain'), 'correlation_id': correlation_id}
        )
        return None
    
    # Rate limiting
    crawl_delay = policy.get('crawl_delay_seconds', 2.0)
    RATE_LIMITER.set_interval(crawl_delay)
    RATE_LIMITER.wait()
    
    headers = policy.get('custom_headers', {}).copy()
    headers.setdefault('User-Agent', policy.get('user_agent', DEFAULT_HEADERS['User-Agent']))
    
    for attempt in range(1, retries + 1):
        start_time = time.time()
        try:
            session = get_session(policy.get('custom_headers'))
            r = session.get(url, timeout=timeout)
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log request
            logger.info(
                f"HTTP {r.status_code} GET {url}",
                extra={
                    'url': url,
                    'status_code': r.status_code,
                    'duration_ms': duration_ms,
                    'policy_domain': policy.get('domain'),
                    'correlation_id': correlation_id,
                }
            )
            
            # Check for blocking
            blocked = (
                r.status_code in (403, 429, 503)
                or "cf-browser-verification" in r.text
                or "Just a moment" in r.text[:2000]
            )
            
            if r.status_code == 200 and not blocked:
                return r.text
            
            if blocked:
                logger.warning(
                    f"Blocked by anti-bot: {r.status_code}",
                    extra={'url': url, 'status_code': r.status_code, 'correlation_id': correlation_id}
                )
                time.sleep(15 * attempt + 10)
                continue
            
            if r.status_code == 404:
                logger.info(f"404 Not Found: {url}", extra={'url': url, 'correlation_id': correlation_id})
                return None
            
            time.sleep(3 * attempt + (attempt * attempt))
            
        except requests.RequestException as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.warning(
                f"Request failed (attempt {attempt}/{retries}): {e}",
                extra={'url': url, 'duration_ms': duration_ms, 'correlation_id': correlation_id}
            )
            time.sleep(2 * attempt + 2)
    
    logger.error(f"All retries exhausted for {url}", extra={'url': url, 'correlation_id': correlation_id})
    return None


# ========================================================================
# ROBOTS.TXT COMPLIANCE (using urllib.robotparser)
# ========================================================================

# Re-export functions
__all__ = [
    'get_robots_parser', 'is_path_allowed_by_robots', 'get_crawl_delay',
    'strip_pii_from_text', 'strip_pii_from_dict', 'strip_pii_from_job_record',
    'fetch_with_compliance', 'get_session', 'setup_logging',
    'RATE_LIMITER', 'SESSION', 'DEFAULT_HEADERS', 'BASE_URL', 'LIST_URL',
    'LISTING_ROUTE', 'DETAIL_ROUTE', 'OUT_DIR', 'INDEX_PATH', 'AGGREGATE_PATH',
    'LIST_RAW_DIR', 'LOGS_DIR', 'WORK_DIR',
    'extract_remix', 'loader_data', 'listing_from_ctx',
    'parse_listing_loader', 'parse_detail_loader',
    'name_of', 'record_from_detail',
]

# ========================================================================
# Original scraper functions (kept for compatibility)
# ========================================================================

def now_iso():
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def get_session(custom_headers: Dict[str, str] = None) -> requests.Session:
    global SESSION
    with SESSION_LOCK:
        if SESSION is None:
            s = requests.Session()
            s.headers.update(DEFAULT_HEADERS)
            SESSION = s
        if custom_headers:
            SESSION.headers.update(custom_headers)
        return SESSION


def fetch(url, retries=4, timeout=40):
    """Legacy fetch - kept for compatibility. Use fetch_with_compliance for new code."""
    # This is kept for backward compatibility with existing code
    for attempt in range(1, retries + 1):
        with RATE_LOCK:
            wait = MIN_INTERVAL - (time.time() - _last_req[0])
            if wait > 0:
                time.sleep(wait)
            _last_req[0] = time.time()
        try:
            r = get_session().get(url, timeout=timeout)
            blocked = (
                r.status_code in (403, 429, 503)
                or "cf-browser-verification" in r.text
                or "Just a moment" in r.text[:2000]
            )
            if r.status_code == 200 and not blocked:
                return r.text
            if blocked:
                time.sleep(15 * attempt + 10)
                continue
            if r.status_code == 404:
                return None
            time.sleep(3 * attempt + (attempt * attempt))
        except requests.RequestException:
            time.sleep(2 * attempt + 2)
    return None


# ========================================================================
# Original scraper functions (kept for compatibility)
# ========================================================================

def extract_remix(html):
    m = RE_REMIX.search(html)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def loader_data(ctx):
    if not ctx:
        return {}
    return (ctx.get("state") or {}).get("loaderData") or {}


def listing_from_ctx(ctx):
    data = loader_data(ctx).get(LISTING_ROUTE) or {}
    return data.get("jobs"), data.get("meta")


def parse_listing_loader(page_html):
    ctx = extract_remix(page_html)
    if not ctx:
        return None, None
    return listing_from_ctx(ctx)


def parse_detail_loader(page_html):
    """Kembalikan {job, company, pathname, job_similar} dari halaman detail."""
    ctx = extract_remix(page_html)
    if not ctx:
        return None, None, None, None
    data = loader_data(ctx).get(DETAIL_ROUTE) or {}
    job = data.get("job")
    if not job:
        return None, None, None, None
    return (
        job,
        data.get("company"),
        data.get("pathname"),
        job.get("job_similar"),
    )


def name_of(value):
    if isinstance(value, dict):
        return value.get("name")
    return value


def record_from_detail(job, company, pathname, url_scraped, listing_skills=None):
    """Bentuk record flat = gabungan field job + company + detail_url + job_skills."""
    j = job or {}
    c = company or {}

    rec = {}
    scalar_keys = [
        "id", "slug", "title", "category", "status", "status_description",
        "location", "job_type", "education", "level", "gender", "is_remote",
        "job_experience", "is_hide_salary", "need_urgent", "is_premium",
        "isPremium", "is_from_register", "salary", "salary_min", "salary_max",
        "job_salary", "incentive_compensation", "job_benefits",
        "job_vacancy_type", "job_location_type", "job_location_type_id",
        "post_date", "post_modified", "published_at", "display_date",
        "closed_at", "views_count",
    ]
    for k in scalar_keys:
        rec[k] = j.get(k)

    # lokasi & tipe kerja & pengalaman & pendidikan: ambil dari array/ld_json
    ld = j.get("ld_json") or {}
    locs = j.get("locations") or []
    rec["location"] = rec["location"] or (name_of(locs[0]) if locs else None)
    types = j.get("types") or []
    rec["job_type"] = rec["job_type"] or (name_of(types[0]) if types else None) or ld.get("employmentType")
    rec["job_experience"] = rec["job_experience"] or ld.get("experienceRequirements")
    exps = j.get("experiences") or []
    if not rec["job_experience"] and exps:
        rec["job_experience"] = name_of(exps[0])
    rec["education"] = rec["education"] or ld.get("educationRequirements")
    edus = j.get("educations") or []
    if not rec["education"] and edus:
        rec["education"] = name_of(edus[0])

    # array
    for k in ("categories", "locations", "educations", "experiences",
              "industries", "types", "meta_themes"):
        rec[k] = j.get(k) or []

    # company (prefiks company_*)
    rec["company_id"] = rec.get("company_id") or c.get("id")
    rec["company_name"] = c.get("name") or j.get("company_name") or ""
    rec["company_logo"] = c.get("logo") or j.get("company_logo") or j.get("company_image") or ""
    rec["company_image"] = j.get("company_image") or c.get("logo") or ""
    rec["company_slug"] = c.get("slug") or j.get("company_slug") or ""
    rec["company_profile_url"] = (
        f"{BASE_URL}/profile/{c['slug']}" if c.get("slug")
        else (f"{BASE_URL}/profile/{j.get('company_slug')}" if j.get("company_slug") else "")
    )
    rec["company_detail"] = c.get("description")
    rec["industry"] = name_of(c.get("industry")) or rec.get("industry") or ""
    if not rec.get("industries") and rec.get("industry"):
        rec["industries"] = [{"name": rec["industry"]}]
    if not rec.get("industries") and c.get("industry"):
        rec["industries"] = [c.get("industry")]

    # konten & ld_json
    rec["ld_json"] = j.get("ld_json")
    for k in ("content", "job_description", "qualifications",
              "responsibilities", "screening_questions"):
        rec[k] = j.get(k)

    # skills & similar
    rec["job_skills"] = j.get("job_skills") or listing_skills or []
    rec["job_similar"] = job.get("job_similar") if job else (j.get("job_similar") or [])

    # status flags
    for k in ("applied", "bookmarked", "offered", "not_interested",
              "is_not_interested_enabled"):
        rec[k] = j.get(k, False)
    rec["statistic"] = j.get("statistic")

    # URL resmi ke loker.id
    url = f"{BASE_URL}{pathname}" if pathname else (url_scraped or "")
    rec["detail_url"] = url
    rec["listing_url"] = url

    return rec