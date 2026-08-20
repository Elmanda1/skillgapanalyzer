# -*- coding: utf-8 -*-
"""
Scraper loker.id (versi kompatibel Laravel).

Menghasilkan data yang langsung bisa di-import oleh pipeline Laravel:
  - database/datajson/{id}.json               arsip mentah per lowongan
  - database/datajson/lowongan_loker_id.json  agregat flat yang dibaca
                                              `php artisan jobs:import`
  - database/datajson/_index.json             daftar id + slug + job_skills
  - database/datajson/_listing/page_{n}.json  arsip halaman listing

Support resumable, retry, backoff, rate-limiting, dan politeness.
Inspirasi: scrape_loker_v2.py
"""
import argparse
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

BASE_URL = "https://www.loker.id"
LIST_URL = BASE_URL + "/cari-lowongan-kerja"
WORK_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = Path(__file__).resolve().parent.parent / "database" / "datajson"
INDEX_PATH = OUT_DIR / "_index.json"
AGGREGATE_PATH = OUT_DIR / "lowongan_loker_id.json"
LIST_RAW_DIR = OUT_DIR / "_listing"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Nama route Remix tempat data dimuat (sama dengan scrape_loker_v2.py)
LISTING_ROUTE = "routes/_lowongan.cari-lowongan-kerja.(page).($number_page)"
DETAIL_ROUTE = "routes/$parent_category.($child_category).$jobslug[.]html"

SESSION = None
SESSION_LOCK = Lock()
RATE_LOCK = Lock()
_last_req = [0.0]
MIN_INTERVAL = 0.70


def now_iso():
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def get_session():
    global SESSION
    with SESSION_LOCK:
        if SESSION is None:
            s = requests.Session()
            s.headers.update(HEADERS)
            SESSION = s
        return SESSION


def fetch(url, retries=4, timeout=40):
    """GET dengan retry + backoff + rate limit politeness."""
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


# ----------------------------------------------------------------------
# Parsing data dari Remix context
# ----------------------------------------------------------------------
RE_REMIX = re.compile(
    r"window\.__remixContext\s*=\s*(\{.*?\})\s*;\s*</script>", re.S
)


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


# ----------------------------------------------------------------------
# Flatten ke format agregat yang dibaca ImportJobs (Laravel)
# ----------------------------------------------------------------------
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


# ----------------------------------------------------------------------
# Phase 1: enumerasi halaman listing
# ----------------------------------------------------------------------
def enumerate_pages():
    LAST = None
    page = 1
    index = []
    total = 0
    last_saved = 0
    fails = 0
    LIST_RAW_DIR.mkdir(parents=True, exist_ok=True)

    while True:
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
                print(f"[ENUM] page {page}: SKIP (cached, {len(jobs)} jobs)", flush=True)
                if LAST and page >= LAST:
                    break
                page += 1
                continue

        url = LIST_URL if page == 1 else f"{LIST_URL}/page/{page}"
        html = fetch(url)
        if not html:
            fails += 1
            print(f"[ENUM] page {page}: FAIL ({fails}/5), sleep 15s", flush=True)
            if fails >= 5:
                print(f"[ENUM] too many consecutive failures, stopping. last_saved={last_saved}", flush=True)
                break
            time.sleep(15)
            continue
        fails = 0
        ctx = extract_remix(html)
        with open(saved, "w", encoding="utf-8") as f:
            json.dump(ctx, f, ensure_ascii=False)
        jobs, meta = parse_listing_loader(html)
        if meta:
            LAST = meta.get("last_page")
            total = meta.get("total")
        if not jobs:
            print(f"[ENUM] page {page}: no jobs, stop.", flush=True)
            break
        for j in jobs:
            index.append({
                "id": j.get("id"),
                "slug": j.get("slug"),
                "job_skills": j.get("job_skills") or [],
            })
        last_saved = page
        print(f"[ENUM] page {page}: {len(jobs)} jobs (total {len(index)}).", flush=True)
        if LAST and page >= LAST:
            break
        page += 1
        time.sleep(0.4)

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
    print(f"[ENUM] done. last_saved_page={last_saved} last_page={LAST}, unique ids: {len(uniq)} (reported total {total}).", flush=True)
    return uniq


def load_index():
    if not INDEX_PATH.exists():
        return None
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


# ----------------------------------------------------------------------
# Phase 2: detail per job
# ----------------------------------------------------------------------
def detail_pending():
    idx = load_index()
    if not idx:
        idx = {"jobs": enumerate_pages()}
    done = {p.stem for p in OUT_DIR.glob("*.json")
            if p.name not in ("lowongan_loker_id.json", "_index.json")}
    pending = [j for j in idx["jobs"] if str(j["id"]) not in done]
    return idx, pending


def fetch_and_save_detail(job_id):
    url = f"{LIST_URL}?jobid={job_id}"
    html = fetch(url)
    if not html:
        return job_id, None
    job, company, pathname, similar = parse_detail_loader(html)
    if job is None:
        return job_id, None
    listing_url = f"{BASE_URL}{pathname}" if pathname else url
    payload = {
        "id": job_id,
        "listing_url": listing_url,
        "job": job,
        "company": company,
        "job_similar": similar or [],
    }
    with open(OUT_DIR / f"{job_id}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    return job_id, payload


def scrape_details(workers=4, max_jobs=None, sample=None):
    idx, pending = detail_pending()
    print(f"[DETAIL] pending {len(pending)} jobs.", flush=True)
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
        fut2id = {ex.submit(fetch_and_save_detail, j["id"]): j["id"] for j in pending}
        for fut in as_completed(fut2id):
            jid = fut2id[fut]
            try:
                _jid, payload = fut.result()
            except Exception as e:
                failed.append((jid, repr(e)))
                continue
            if payload is None:
                failed.append((jid, "no-data"))
                continue
            done += 1
            if done % 100 == 0:
                print(f"[DETAIL] processed {done} (+ {len(failed)} fail) ...", flush=True)
    return done, failed


# ----------------------------------------------------------------------
# Phase 3: bangun agregat lowongan_loker_id.json
# ----------------------------------------------------------------------
def build_aggregate():
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
    with open(AGGREGATE_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)
    print(f"[AGG] {len(records)} records -> {AGGREGATE_PATH} (skipped {skipped}).", flush=True)
    return records


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Scraper loker.id kompatibel Laravel")
    ap.add_argument("--phase", choices=["enumerate", "detail", "aggregate", "all"],
                    default="all")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--max-jobs", type=int, default=None)
    ap.add_argument("--sample", type=int, default=None)
    ap.add_argument("--interval", type=float, default=0.70,
                    help="interval minimum antar request (detik)")
    ap.add_argument("--out", default=None,
                    help="folder output (default database/datajson)")
    args = ap.parse_args()

    global OUT_DIR, INDEX_PATH, AGGREGATE_PATH, LIST_RAW_DIR, MIN_INTERVAL
    OUT_DIR = Path(args.out) if args.out else OUT_DIR
    INDEX_PATH = OUT_DIR / "_index.json"
    AGGREGATE_PATH = OUT_DIR / "lowongan_loker_id.json"
    LIST_RAW_DIR = OUT_DIR / "_listing"
    MIN_INTERVAL = args.interval
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.phase in ("enumerate", "all"):
        enumerate_pages()
        if args.phase == "enumerate":
            return

    if args.phase in ("detail", "all"):
        if not INDEX_PATH.exists():
            print("[DETAIL] index kosong -> enumerasi dulu.", flush=True)
            enumerate_pages()
        done, failed = scrape_details(workers=args.workers,
                                      max_jobs=args.max_jobs,
                                      sample=args.sample)
        print(f"[DETAIL] done={done} failed={len(failed)}", flush=True)
        if failed:
            print("[DETAIL] sample fails:", failed[:10], flush=True)

    if args.phase in ("aggregate", "all"):
        build_aggregate()


if __name__ == "__main__":
    main()
