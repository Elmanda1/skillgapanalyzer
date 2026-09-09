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


async def run_pipeline(domain_url: str, max_pages: int = 15, max_jobs: int = 10, output_file: str = "universal_master_jobs.json"):
    """Runs the 3-phase universal scraping & deduplication pipeline."""
    print(f"\n=======================================================")
    print(f" UNIVERSAL AI JOB SCRAPER & AGGREGATOR ENGINE          ")
    print(f" Target Domain: {domain_url}                           ")
    print(f" Timestamp:     {get_formatted_now()}                  ")
    print(f"=======================================================\n")

    # -----------------------------------------------------------------
    # PIPELINE 1: Heuristic Crawler Engine
    # -----------------------------------------------------------------
    logger.info(">>> PHASE 1: Starting Heuristic Crawler Engine...")
    crawler = HeuristicCrawler(max_pages=max_pages, concurrency=4, delay=0.3)
    crawl_result = await crawler.crawl(domain_url)

    job_urls = crawl_result.get("job_urls", [])
    logger.info(f"Phase 1 Complete: Discovered {len(job_urls)} job detail URLs from {crawl_result.get('total_visited')} visited pages.")

    if not job_urls:
        logger.warning("No job detail URLs discovered. Using fallback seed URL for extraction test.")
        job_urls = [domain_url]

    job_urls = job_urls[:max_jobs]

    # -----------------------------------------------------------------
    # PIPELINE 2: LLM Extraction Engine
    # -----------------------------------------------------------------
    logger.info(f">>> PHASE 2: Starting LLM Extraction Engine on {len(job_urls)} job URLs...")
    extractor = LLMExtractor()
    extracted_jobs = []

    for idx, url in enumerate(job_urls, 1):
        logger.info(f"Extracting [{idx}/{len(job_urls)}]: {url}")
        html = await crawler.fetch_page(None, url)
        if not html:
            continue

        extracted_schema = extractor.extract_from_html(html, url)
        extracted_jobs.append(extracted_schema)
        logger.info(f"Extracted: '{extracted_schema.title}' at '{extracted_schema.company_name}' (Skills: {len(extracted_schema.skills)})")

    # -----------------------------------------------------------------
    # PIPELINE 3: Master Aggregation & Deduplication Engine
    # -----------------------------------------------------------------
    logger.info(f">>> PHASE 3: Starting Master Aggregation & Cross-Domain Deduplication Engine...")
    aggregator = MasterAggregator(match_threshold=85)

    for job in extracted_jobs:
        aggregator.add_or_merge(job)

    out_path = BASE_DIR.parent / "database" / "datajson" / output_file
    total_master = aggregator.export_json(out_path)

    print(f"\n=======================================================")
    print(f" PIPELINE EXECUTION COMPLETE                           ")
    print(f" Total Discovered URLs: {len(job_urls)}                ")
    print(f" Total Extracted:       {len(extracted_jobs)}           ")
    print(f" Total Master Records:  {total_master}                 ")
    print(f" Output Export Path:    {out_path}                     ")
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
