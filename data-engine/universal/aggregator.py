# -*- coding: utf-8 -*-
"""
Pipeline 3: Master Aggregation & Cross-Domain Deduplication Engine.

Merges data from all scraped domains into one unified dataset.
Implements cross-domain fuzzy matching deduplication logic on
[Company Name + Job Title + Location].
Appends duplicate source URLs to `source_urls` array field.
"""
import re
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    from thefuzz import fuzz
except ImportError:
    try:
        from rapidfuzz import fuzz
    except ImportError:
        fuzz = None

from .extractor import JobExtractionSchema

logger = logging.getLogger("MasterAggregator")


def get_formatted_now() -> str:
    """Returns current local date and time formatted as DD/MM/YYYY HH:MM:SS."""
    return datetime.now().strftime("%d/%m/%Y %H:%M:%S")


def normalize_str(text: Optional[str]) -> str:
    """Normalize string for fuzzy comparison (lowercase, strip extra spaces)."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return re.sub(r'\s+', ' ', text)


GENERIC_TITLES = {"lowongan pekerjaan", "job", "job vacancy", "unknown", "na", "n/a", ""}
GENERIC_COMPANIES = {"perusahaan", "company", "unknown", "na", "n/a", ""}


def is_generic_placeholder(title: Optional[str], company: Optional[str]) -> bool:
    """Check if title or company name is a generic fallback placeholder."""
    norm_title = normalize_str(title)
    norm_comp = normalize_str(company)
    return norm_title in GENERIC_TITLES or norm_comp in GENERIC_COMPANIES


class MasterAggregator:
    """
    Master Aggregation & Deduplication Engine.
    """

    def __init__(self, match_threshold: int = 85):
        self.match_threshold = match_threshold
        self.master_records: List[Dict[str, Any]] = []

    def _compute_similarity(self, record1: Dict[str, Any], record2: Dict[str, Any]) -> float:
        """
        Compute weighted fuzzy matching score across:
        - Company Name (40%)
        - Job Title (40%)
        - Location (20%)
        """
        comp1 = normalize_str(record1.get("company_name"))
        comp2 = normalize_str(record2.get("company_name"))

        title1 = normalize_str(record1.get("title"))
        title2 = normalize_str(record2.get("title"))

        loc1 = normalize_str(record1.get("location"))
        loc2 = normalize_str(record2.get("location"))

        if fuzz is not None:
            comp_score = fuzz.token_set_ratio(comp1, comp2)
            title_score = fuzz.token_set_ratio(title1, title2)
            loc_score = fuzz.ratio(loc1, loc2) if loc1 and loc2 else 100
        else:
            # Fallback string ratio matcher if thefuzz is not installed
            from difflib import SequenceMatcher
            comp_score = SequenceMatcher(None, comp1, comp2).ratio() * 100
            title_score = SequenceMatcher(None, title1, title2).ratio() * 100
            loc_score = SequenceMatcher(None, loc1, loc2).ratio() * 100 if loc1 and loc2 else 100

        weighted_score = (comp_score * 0.40) + (title_score * 0.40) + (loc_score * 0.20)
        return weighted_score

    def find_duplicate_index(self, new_record: Dict[str, Any]) -> Optional[int]:
        """Check if incoming job record matches an existing master record."""
        # BUGFIX: Prevent false-positive deduplication on records with generic fallback placeholders
        if is_generic_placeholder(new_record.get("title"), new_record.get("company_name")):
            return None

        for idx, existing in enumerate(self.master_records):
            if is_generic_placeholder(existing.get("title"), existing.get("company_name")):
                continue

            score = self._compute_similarity(existing, new_record)
            if score >= self.match_threshold:
                logger.info(
                    f"Duplicate identified ({score:.1f}% match): "
                    f"'{new_record.get('title')}' at '{new_record.get('company_name')}' "
                    f"matches existing '{existing.get('title')}'"
                )
                return idx
        return None

    def add_or_merge(self, job_data: JobExtractionSchema) -> Dict[str, Any]:
        """
        Processes a single extracted job posting.
        Merges duplicate entries into existing master record by appending source_url.
        """
        record = job_data.model_dump()
        source_url = record.get("source_url")
        source_urls = [source_url] if source_url else []

        dup_idx = self.find_duplicate_index(record)

        if dup_idx is not None:
            # Merge into existing master record
            existing = self.master_records[dup_idx]

            # 1. Append new source_url if not already present
            if source_url and source_url not in existing["source_urls"]:
                existing["source_urls"].append(source_url)

            # 2. Merge salary bounds
            if record.get("salary_min"):
                existing["salary_min"] = min(
                    filter(None, [existing.get("salary_min"), record.get("salary_min")])
                )
            if record.get("salary_max"):
                existing["salary_max"] = max(
                    filter(None, [existing.get("salary_max"), record.get("salary_max")])
                )

            # 3. Combine skills & requirements
            existing_skills = set(existing.get("skills", []))
            existing_skills.update(record.get("skills", []))
            existing["skills"] = list(existing_skills)

            existing_reqs = set(existing.get("requirements", []))
            existing_reqs.update(record.get("requirements", []))
            existing["requirements"] = list(existing_reqs)

            # 4. Update last_scraped_at timestamp
            existing["last_scraped_at"] = get_formatted_now()

            return existing

        # Novel posting: create master record
        record["source_urls"] = source_urls
        record["last_scraped_at"] = get_formatted_now()

        # Generate slug if missing
        clean_title = normalize_str(record.get("title", "job"))
        clean_comp = normalize_str(record.get("company_name", "company"))
        record["slug"] = f"{clean_comp}-{clean_title}".replace(" ", "-")

        self.master_records.append(record)
        return record

    def export_json(self, output_path: Path) -> int:
        """Export final merged master dataset to JSON file."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.master_records, f, ensure_ascii=False, indent=2)

        logger.info(f"Master Aggregator exported {len(self.master_records)} deduplicated jobs to {output_path}")
        return len(self.master_records)
