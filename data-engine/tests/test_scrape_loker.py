# -*- coding: utf-8 -*-
"""Test untuk scrape_loker.py (mapping, remix parsing, agregat)."""
import json
import sys
import importlib.util
from pathlib import Path

import pytest

SCRAPER = Path(__file__).resolve().parent.parent / "scrape_loker.py"
spec = importlib.util.spec_from_file_location("scrape_loker", SCRAPER)
module = importlib.util.module_from_spec(spec)
sys.modules["scrape_loker"] = module
spec.loader.exec_module(module)


@pytest.fixture()
def sample_job():
    json_path = Path(__file__).resolve().parent.parent.parent / "database" / "datajson" / "15892033.json"
    if json_path.exists():
        with open(json_path, encoding="utf-8") as f:
            return json.load(f)
    return {
        "job": {
            "id": 15892033,
            "slug": "teknisi-maintenance",
            "title": "Teknisi Maintenance",
            "salary_min": 5000000,
            "salary_max": 7000000,
            "locations": [{"name": "Bekasi"}],
            "types": [{"name": "Full Time"}],
            "experiences": [{"name": "1-2 Tahun"}],
        },
        "company": {"name": "PT Maju Terus"},
    }


def test_extract_remix():
    html = '<script>window.__remixContext = {"state": {"loaderData": {}}};</script>'
    ctx = module.extract_remix(html)
    assert ctx == {"state": {"loaderData": {}}}


def test_extract_remix_missing():
    assert module.extract_remix("<html><body>no data</body></html>") is None


def test_listing_from_ctx():
    ctx = {"state": {"loaderData": {
        module.LISTING_ROUTE: {
            "jobs": [{"id": 1, "slug": "a", "job_skills": [{"name": "Python"}]}],
            "meta": {"last_page": 3, "total": 60},
        }
    }}}
    jobs, meta = module.listing_from_ctx(ctx)
    assert meta["last_page"] == 3
    assert jobs[0]["job_skills"] == [{"name": "Python"}]


def test_parse_detail_loader_extracts_similar():
    ctx = {"state": {"loaderData": {
        module.DETAIL_ROUTE: {
            "job": {"id": 1, "title": "X", "job_similar": [{"title": "Y"}]},
            "company": {"name": "C"},
            "pathname": "/p/x.html",
        }
    }}}
    html = '<script>window.__remixContext = %s;</script>' % json.dumps(ctx)
    job, company, pathname, similar = module.parse_detail_loader(html)
    assert job["id"] == 1
    assert company == {"name": "C"}
    assert pathname == "/p/x.html"
    assert similar == [{"title": "Y"}]


def test_record_from_detail_maps_core_fields(sample_job):
    job = sample_job["job"]
    row = module.record_from_detail(
        job, sample_job["company"], "/pekerjaan-umum/teknisi/x.html",
        "https://www.loker.id/pekerjaan-umum/teknisi/x.html",
        [{"name": "Maintenance"}],
    )
    assert row["id"] == job["id"]
    assert row["slug"] == job["slug"]
    assert row["title"] == job["title"]
    assert row["location"] == "Bekasi"
    assert row["job_type"] == "Full Time"
    assert row["job_experience"] == "1-2 Tahun"
    assert row["detail_url"].startswith("https://www.loker.id/")
    assert row["detail_url"].endswith(".html")
    assert row["job_skills"] == [{"name": "Maintenance"}]
    assert row["salary_min"] == job["salary_min"]
    assert row["company_name"] == sample_job["company"]["name"]


def test_record_from_detail_hides_salary_placeholder():
    job = {
        "id": 9, "slug": "s", "title": "T",
        "is_hide_salary": True,
        "salary_min": 10, "salary_max": 11,
        "locations": [{"name": "Jakarta", "parent": {"name": "DKI"}}],
        "types": [{"name": "Full Time"}],
    }
    row = module.record_from_detail(job, {}, "/x/y.html", "https://x")
    assert row["salary_min"] == 10
    assert row["salary_max"] == 11
