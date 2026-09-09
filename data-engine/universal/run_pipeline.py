# -*- coding: utf-8 -*-
"""
Main CLI Orchestrator: Universal AI-Driven Job Scraper & Aggregator.

Executes 3 Main Pipelines:
1. Heuristic Crawler Engine: Discovers job URLs from seed domain.
2. LLM Extraction Engine: Cleans HTML and extracts structured Pydantic schema.
3. Master Aggregation & Deduplication Engine: Cross-domain fuzzy deduplication & merging.
"""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

# Add data-engine directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from universal.crawler import HeuristicCrawler
from universal.extractor import LLMExtractor
from universal.aggregator import MasterAggregator, get_formatted_now

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%d/%m/%Y %H:%M:%S"
)
logger = logging.getLogger("UniversalPipeline")


try:
    import httpx
except ImportError:
    httpx = None


class DummyClient:
    async def __aenter__(self):
        return None
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


async def run_pipeline(domain_url: str, max_pages: int = 15, max_jobs: int = 10, output_file: str = "universal_master_jobs.json"):
    """Runs the 3-phase universal scraping & deduplication pipeline with full reliability & metrics tracking."""
    print(f"\n=======================================================")
    print(f" UNIVERSAL AI JOB SCRAPER & AGGREGATOR ENGINE          ")
    print(f" Target Domain: {domain_url}                           ")
    print(f" Timestamp:     {get_formatted_now()}                  ")
    print(f"=======================================================\n")

    out_path = BASE_DIR.parent / "database" / "datajson" / output_file
    aggregator = MasterAggregator(match_threshold=85)
    already_processed_urls = set()

    # RELIABILITY FIX 4: Load existing master records on startup for idempotent resume capability
    if out_path.exists():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                if isinstance(existing_data, list):
                    aggregator.master_records = existing_data
                    for rec in existing_data:
                        for s_url in rec.get("source_urls", []):
                            already_processed_urls.add(s_url)
            logger.info(f"Loaded existing checkpoint from {out_path}: {len(aggregator.master_records)} records, {len(already_processed_urls)} processed URLs.")
        except Exception as e:
            logger.warning(f"Could not load existing checkpoint from {out_path}: {e}")

    # -----------------------------------------------------------------
    # PIPELINE 1: Heuristic Crawler Engine
    # -----------------------------------------------------------------
    logger.info(">>> PHASE 1: Starting Heuristic Crawler Engine...")
    crawler = HeuristicCrawler(max_pages=max_pages, concurrency=4, delay=0.3)
    crawl_result = await crawler.crawl(domain_url)

    job_urls = crawl_result.get("job_urls", [])
    logger.info(f"Phase 1 Complete: Discovered {len(job_urls)} job detail URLs from {crawl_result.get('total_visited')} visited pages.")

    is_fallback = False
    if not job_urls:
        logger.warning("No job detail URLs discovered. Using fallback seed URL for extraction test.")
        job_urls = [domain_url]
        is_fallback = True

    job_urls = job_urls[:max_jobs]

    # Filter out already processed URLs for resume support
    pending_urls = [u for u in job_urls if u not in already_processed_urls]
    if len(pending_urls) < len(job_urls):
        logger.info(f"Skipping {len(job_urls) - len(pending_urls)} previously processed URLs. Remaining pending: {len(pending_urls)}")

    # -----------------------------------------------------------------
    # PIPELINE 2 & 3: LLM Extraction & Progressive Aggregation
    # -----------------------------------------------------------------
    logger.info(f">>> PHASE 2 & 3: Starting Extraction & Master Aggregation on {len(pending_urls)} job URLs...")
    extractor = LLMExtractor()

    # RELIABILITY FIX 9: Comprehensive metrics tracking
    metrics = {
        "discovered": len(job_urls),
        "skipped_resume": len(job_urls) - len(pending_urls),
        "pending": len(pending_urls),
        "fetch_failed": 0,
        "llm_extracted": 0,
        "fallback_extracted": 0,
        "extraction_errors": 0,
    }

    # RELIABILITY FIX 6: Re-use HTTP AsyncClient session across extractions
    async with (httpx.AsyncClient(headers=crawler.headers, follow_redirects=True) if httpx else DummyClient()) as client:
        for idx, url in enumerate(pending_urls, 1):
            logger.info(f"Extracting [{idx}/{len(pending_urls)}]: {url}")
            html = await crawler.fetch_page(client, url, ignore_visited=is_fallback)
            if not html:
                metrics["fetch_failed"] += 1
                logger.warning(f"Fetch failed for {url}")
                continue

            try:
                was_llm = bool(extractor.api_key)
                extracted_schema = extractor.extract_from_html(html, url)
                if was_llm:
                    metrics["llm_extracted"] += 1
                else:
                    metrics["fallback_extracted"] += 1

                logger.info(f"Extracted ({'LLM' if was_llm else 'Fallback'}): '{extracted_schema.title}' at '{extracted_schema.company_name}' (Skills: {len(extracted_schema.skills)})")

                # Progressive checkpointing - merge and export to disk
                aggregator.add_or_merge(extracted_schema)
                aggregator.export_json(out_path)
            except Exception as e:
                metrics["extraction_errors"] += 1
                logger.error(f"Failed extraction on {url}: {e}")

    total_master = len(aggregator.master_records)

    # RELIABILITY FIX 9: Detailed Observability Metrics Summary Dashboard
    print(f"\n=======================================================")
    print(f" PIPELINE EXECUTION COMPLETE (RELIABILITY METRICS)     ")
    print(f" Total Discovered URLs: {metrics['discovered']}          ")
    print(f" Skipped (Already Done):{metrics['skipped_resume']}     ")
    print(f" Processed This Run:   {metrics['pending']}            ")
    print(f" Fetch Failures:        {metrics['fetch_failed']}        ")
    print(f" LLM Extractions:       {metrics['llm_extracted']}       ")
    print(f" Fallback Extractions:  {metrics['fallback_extracted']}  ")
    print(f" Extraction Errors:     {metrics['extraction_errors']}   ")
    print(f" Total Master Records:  {total_master}                  ")
    print(f" Output Export Path:    {out_path}                      ")
    print(f"=======================================================\n")


def main():
    parser = argparse.ArgumentParser(description="Universal AI-Driven Job Scraper & Aggregator Orchestrator")
    parser.add_argument("--domain", type=str, default="https://www.loker.id", help="Seed domain URL to crawl")
    parser.add_argument("--max-pages", type=int, default=9999, help="Max crawler pages limit")
    parser.add_argument("--max-jobs", type=int, default=999999, help="Max job extractions limit")
    parser.add_argument("--output", type=str, default="universal_master_jobs.json", help="Output JSON filename")

    args = parser.parse_args()

    asyncio.run(run_pipeline(
        domain_url=args.domain,
        max_pages=args.max_pages,
        max_jobs=args.max_jobs,
        output_file=args.output,
    ))


if __name__ == "__main__":
    main()
