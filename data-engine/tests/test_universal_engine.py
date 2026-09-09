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


def test_dedup_false_positive_prevention_on_generic_placeholders():
    """Verify that two unrelated jobs with fallback generic titles/companies are NOT merged."""
    aggregator = MasterAggregator(match_threshold=85)

    job1 = JobExtractionSchema(
        title="Lowongan Pekerjaan",
        company_name="Perusahaan",
        location="Indonesia",
        source_url="https://site-a.com/job/1"
    )
    job2 = JobExtractionSchema(
        title="Lowongan Pekerjaan",
        company_name="Perusahaan",
        location="Indonesia",
        source_url="https://site-b.com/job/2"
    )

    aggregator.add_or_merge(job1)
    aggregator.add_or_merge(job2)

    # Must produce 2 separate master records, NOT false-positive merge into 1 record!
    assert len(aggregator.master_records) == 2
    assert aggregator.master_records[0]["source_urls"] == ["https://site-a.com/job/1"]
    assert aggregator.master_records[1]["source_urls"] == ["https://site-b.com/job/2"]


def test_llm_provider_auto_inference(monkeypatch):
    """Verify provider auto-inference when only OPENAI_API_KEY is present."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-fake-openai-key")

    extractor = LLMExtractor()
    assert extractor.provider == "openai"
    assert extractor.api_key == "sk-fake-openai-key"


def test_json_markdown_cleaning():
    """Verify clean_json_str strips markdown code block wrappers."""
    from universal.extractor import clean_json_str
    raw_response = "```json\n{\"title\": \"Software Engineer\"}\n```"
    cleaned = clean_json_str(raw_response)
    assert cleaned == '{"title": "Software Engineer"}'


def test_fetch_page_ignore_visited():
    """Verify ignore_visited parameter allows re-fetching seed URL."""
    import asyncio
    async def _test():
        crawler = HeuristicCrawler()
        url = "https://example.com/seed"
        crawler.visited_urls.add(url)

        # Without ignore_visited -> returns None
        result = await crawler.fetch_page(None, url, ignore_visited=False)
        assert result is None

        # With ignore_visited=True -> allows fetch attempt
        await crawler.fetch_page(None, url, ignore_visited=True)
        assert url in crawler.visited_urls

    asyncio.run(_test())


def test_fallback_extractor_fields_and_description_truncation():
    """Verify fallback extractor parses experience, job type, sector, requirements, and truncates description properly."""
    extractor = LLMExtractor()
    html = """
    <html>
        <body>
            <h1>Fullstack Developer</h1>
            <div class="company">PT Maju Bersama</div>
            <p>Pengalaman minimal 2-4 tahun. Syarat: Magang / Contract</p>
            <h3>Persyaratan:</h3>
            <ul>
                <li>Menguasai Laravel & React</li>
                <li>Pengalaman dengan Docker & CI/CD</li>
            </ul>
            <p>Gaji Rp 12.000.000 - 18.000.000</p>
        </body>
    </html>
    """
    extracted = extractor.extract_from_html(html, "https://example.com/job/dev")
    assert extracted.title == "Fullstack Developer"
    assert extracted.company_name == "PT Maju Bersama"
    assert extracted.salary_min == 12_000_000
    assert extracted.salary_max == 18_000_000
    assert extracted.job_experience == "2-4 tahun"
    assert extracted.sektor == "Teknologi & TI"
    assert len(extracted.requirements) > 0
    # Description short -> does not end with "..."
    assert not extracted.description.endswith("...")

