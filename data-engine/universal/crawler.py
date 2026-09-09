# -*- coding: utf-8 -*-
"""
Pipeline 1: Heuristic Crawler Engine (Async I/O).

Automatically discovers job listing and detail URLs from seed domain root URLs
using regex patterns, path depth heuristics, and pagination structures.
Does NOT rely on site-specific CSS/XPath rules.
"""
import asyncio
import re
import logging
from urllib.parse import urljoin, urlparse
from typing import Set, List, Dict, Any, Optional
from bs4 import BeautifulSoup

try:
    import httpx
except ImportError:
    httpx = None

logger = logging.getLogger("UniversalCrawler")

# Common patterns for job detail URLs across Indonesian & global portals
JOB_URL_PATTERNS = [
    r'/lowongan(?:-[^/]+)*/[a-zA-Z0-9_-]+',
    r'/job/[a-zA-Z0-9_-]+',
    r'/jobs/[a-zA-Z0-9_-]+',
    r'/career/[a-zA-Z0-9_-]+',
    r'/careers/[a-zA-Z0-9_-]+',
    r'/vacancies/[a-zA-Z0-9_-]+',
    r'/karir/[a-zA-Z0-9_-]+',
    r'/id-id/job/[a-zA-Z0-9_-]+',
    r'/detail/[a-zA-Z0-9_-]+',
]

# Patterns for pagination and category listing URLs
LISTING_URL_PATTERNS = [
    r'/cari-lowongan-kerja',
    r'/jobs',
    r'/lowongan',
    r'/careers',
    r'/karir',
    r'[?&](page|p)=\d+',
    r'/page/\d+',
]

# URL paths to skip
SKIP_URL_PATTERNS = [
    r'/(login|register|signup|account|profile|cart|checkout|admin|auth)',
    r'\.(png|jpg|jpeg|gif|css|js|svg|ico|pdf|zip)$',
    r'/(privacy|terms|about|contact|help|faq)',
]


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SkillGapBot/1.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
}


class HeuristicCrawler:
    """
    Async Heuristic Crawler Engine for domain-agnostic job URL discovery.
    """

    def __init__(
        self,
        user_agent: Optional[str] = None,
        max_depth: int = 2,
        max_pages: int = 20,
        concurrency: int = 4,
        delay: float = 0.5,
    ):
        self.headers = dict(DEFAULT_HEADERS)
        if user_agent:
            self.headers["User-Agent"] = user_agent
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.concurrency = concurrency
        self.delay = delay
        self.visited_urls: Set[str] = set()
        self.discovered_job_urls: Set[str] = set()
        self.discovered_listing_urls: Set[str] = set()

    def is_valid_domain(self, url: str, base_domain: str) -> bool:
        """Check if URL belongs to the same root domain."""
        parsed = urlparse(url)
        return parsed.netloc == base_domain or parsed.netloc.endswith("." + base_domain)

    def is_skip_url(self, url: str) -> bool:
        """Check if URL matches excluded non-job routes."""
        for pattern in SKIP_URL_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                return True
        return False

    def is_job_detail_url(self, url: str) -> bool:
        """Check if URL matches a job detail pattern using regex heuristics."""
        if self.is_skip_url(url):
            return False

        parsed = urlparse(url)
        path = parsed.path

        for pattern in JOB_URL_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return True

        # Fallback heuristic: depth >= 2 with numeric or slug ID
        segments = [s for s in path.split('/') if s]
        if len(segments) >= 2 and any(char.isdigit() for char in segments[-1]):
            return True

        return False

    def is_listing_url(self, url: str) -> bool:
        """Check if URL matches a job listing or pagination page."""
        if self.is_skip_url(url):
            return False

        for pattern in LISTING_URL_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                return True
        return False

    def extract_links(self, base_url: str, html: str) -> List[str]:
        """Parse raw HTML and resolve relative hrefs into absolute URLs."""
        soup = BeautifulSoup(html, "html.parser")
        links = []
        base_domain = urlparse(base_url).netloc

        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if not href or href.startswith("#") or href.startswith("javascript:"):
                continue

            abs_url = urljoin(base_url, href)
            # Remove fragment
            parsed = urlparse(abs_url)
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            if parsed.query:
                clean_url += f"?{parsed.query}"

            if self.is_valid_domain(clean_url, base_domain) and not self.is_skip_url(clean_url):
                links.append(clean_url)

        return list(set(links))

    async def fetch_page(self, client: Any, url: str) -> Optional[str]:
        """Fetch page content asynchronously with politeness delay."""
        if url in self.visited_urls:
            return None

        self.visited_urls.add(url)
        await asyncio.sleep(self.delay)

        try:
            if httpx is not None:
                if isinstance(client, httpx.AsyncClient):
                    response = await client.get(url, headers=self.headers, timeout=10.0, follow_redirects=True)
                    if response.status_code == 200:
                        return response.text
                else:
                    async with httpx.AsyncClient(headers=self.headers, follow_redirects=True) as local_client:
                        response = await local_client.get(url, timeout=10.0)
                        if response.status_code == 200:
                            return response.text
            else:
                import urllib.request
                req = urllib.request.Request(url, headers=self.headers)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return resp.read().decode('utf-8', errors='ignore')
        except Exception as e:
            logger.warning(f"Failed to fetch {url}: {e}")
            return None

        return None

    async def crawl(self, seed_url: str) -> Dict[str, List[str]]:
        """
        Main async crawl execution loop.
        Returns dict containing discovered `job_urls` and `listing_urls`.
        """
        base_domain = urlparse(seed_url).netloc
        queue = [(seed_url, 0)]
        self.visited_urls.clear()
        self.discovered_job_urls.clear()
        self.discovered_listing_urls.clear()

        async with httpx.AsyncClient(headers=self.headers, follow_redirects=True) if httpx else DummyAsyncClient() as client:
            pages_crawled = 0

            while queue and pages_crawled < self.max_pages:
                current_url, depth = queue.pop(0)

                if current_url in self.visited_urls:
                    continue

                logger.info(f"Crawling [Depth {depth}]: {current_url}")
                html = await self.fetch_page(client, current_url)
                pages_crawled += 1

                if not html:
                    continue

                links = self.extract_links(current_url, html)

                for link in links:
                    if self.is_job_detail_url(link):
                        self.discovered_job_urls.add(link)
                    elif self.is_listing_url(link):
                        self.discovered_listing_urls.add(link)
                        if depth + 1 <= self.max_depth and link not in self.visited_urls:
                            queue.append((link, depth + 1))
                    elif depth + 1 <= self.max_depth and link not in self.visited_urls:
                        queue.append((link, depth + 1))

        return {
            "job_urls": list(self.discovered_job_urls),
            "listing_urls": list(self.discovered_listing_urls),
            "total_visited": len(self.visited_urls),
        }


class DummyAsyncClient:
    """Fallback async context manager when httpx is not installed."""
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
