# -*- coding: utf-8 -*-
"""
Unit tests for Universal AI-Driven Job Scraper & Aggregator Engine.
Tests:
- Heuristic Crawler URL heuristics
- LLM Extractor HTML trimming & Pydantic validation
- Master Aggregator fuzzy deduplication & source_urls array merge
"""
import pytest
import sys
from pathlib import Path

# Add data-engine directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from universal.crawler import HeuristicCrawler
from universal.extractor import LLMExtractor, trim_html_for_llm, JobExtractionSchema
from universal.aggregator import MasterAggregator, normalize_str, get_formatted_now


def test_heuristic_crawler_url_matching():
    crawler = HeuristicCrawler()

    # Job detail URLs matching patterns
    assert crawler.is_job_detail_url("https://www.loker.id/lowongan/backend-developer") is True
    assert crawler.is_job_detail_url("https://example.com/job/senior-dev-1234") is True
    assert crawler.is_job_detail_url("https://example.com/career/software-engineer") is True

    # Excluded URLs (login, static assets, etc.)
    assert crawler.is_job_detail_url("https://example.com/login") is False
    assert crawler.is_job_detail_url("https://example.com/assets/logo.png") is False


def test_html_trimmer():
    raw_html = """
    <html>
        <head><title>Test</title><script>var x = 1;</script></head>
        <body>
            <nav>Nav content</nav>
            <h1>Backend Engineer</h1>
            <p>PT Tech Indonesia</p>
            <footer>Footer content</footer>
        </body>
    </html>
    """
    trimmed = trim_html_for_llm(raw_html)
    assert "Backend Engineer" in trimmed
    assert "PT Tech Indonesia" in trimmed
    assert "<script>" not in trimmed
    assert "Footer content" not in trimmed


def test_llm_extractor_fallback():
    extractor = LLMExtractor() # No API key -> fallback parser
    html = """
    <html>
        <body>
            <h1>Senior DevOps Specialist</h1>
            <div class="company">PT Awesomeness Tbk</div>
            <div class="location">Jakarta Selatan</div>
            <p>Gaji: Rp 15.000.000 - Rp 25.000.000</p>
            <p>Keahlian: Python, Docker, Kubernetes, AWS</p>
        </body>
    </html>
    """
    extracted = extractor.extract_from_html(html, "https://example.com/job/1")
    assert isinstance(extracted, JobExtractionSchema)
    assert extracted.title == "Senior DevOps Specialist"
    assert extracted.company_name == "PT Awesomeness Tbk"
    assert "Python" in extracted.skills
    assert "Docker" in extracted.skills
    assert extracted.source_url == "https://example.com/job/1"


def test_master_aggregator_deduplication():
    aggregator = MasterAggregator(match_threshold=85)

    job1 = JobExtractionSchema(
        title="Backend Developer",
        company_name="PT Teknologi Nusantara",
        location="Jakarta",
        skills=["Python", "PostgreSQL"],
        source_url="https://domain-a.com/job/backend-dev"
    )

    # Identical job posting from a different domain
    job2 = JobExtractionSchema(
        title="Backend Dev",
        company_name="PT Teknologi Nusantara",
        location="Jakarta",
        skills=["Python", "Docker"],
        source_url="https://domain-b.com/careers/backend-dev"
    )

    master1 = aggregator.add_or_merge(job1)
    assert len(aggregator.master_records) == 1
    assert master1["source_urls"] == ["https://domain-a.com/job/backend-dev"]

    # Process duplicate posting
    master2 = aggregator.add_or_merge(job2)
    assert len(aggregator.master_records) == 1  # No duplicate created!
    assert "https://domain-a.com/job/backend-dev" in master2["source_urls"]
    assert "https://domain-b.com/careers/backend-dev" in master2["source_urls"]
    assert set(master2["skills"]) == {"Python", "PostgreSQL", "Docker"}
