# -*- coding: utf-8 -*-
"""
Pipeline 2: LLM Extraction Engine with Pydantic Schema.

Trims raw HTML to cost-efficient plain text/DOM structure and feeds it to LLMs
(Gemini / OpenAI) or rule-based fallback parser to extract structured JSON data.
"""
import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger("LLMExtractor")


# ─── Pydantic Schema ─────────────────────────────────────────────────────────────

class JobExtractionSchema(BaseModel):
    """Strict schema for structured job postings."""
    title: str = Field(..., description="Job title, e.g. Backend Developer")
    company_name: str = Field(..., description="Employer or hiring company name")
    location: str = Field(default="Indonesia", description="Job location or city")
    salary_min: Optional[int] = Field(default=None, description="Minimum monthly salary in IDR")
    salary_max: Optional[int] = Field(default=None, description="Maximum monthly salary in IDR")
    job_type: Optional[str] = Field(default="Full-time", description="Employment type (Full-time, Contract, Internship, Part-time)")
    job_experience: Optional[str] = Field(default=None, description="Experience requirement, e.g. 1-3 Tahun")
    is_remote: bool = Field(default=False, description="True if remote work is allowed")
    sektor: str = Field(default="Umum", description="Industry sector, e.g. Teknologi & TI, Keuangan")
    description: str = Field(default="", description="Full job description summary")
    requirements: List[str] = Field(default_factory=list, description="List of explicit job requirements/qualifications")
    skills: List[str] = Field(default_factory=list, description="List of required technical and soft skills")
    source_url: Optional[str] = Field(default=None, description="Original source detail URL")


# ─── HTML Trimmer for Cost Efficiency ───────────────────────────────────────────

def trim_html_for_llm(raw_html: str, max_chars: int = 12000) -> str:
    """
    Strips noise elements (script, style, nav, footer, SVG, comments) and extracts
    structured text to reduce LLM prompt token consumption by 80-90%.
    """
    soup = BeautifulSoup(raw_html, "html.parser")

    # Remove script, style, header, footer, SVG, and iframe tags
    for tag in soup(["script", "style", "nav", "footer", "header", "svg", "iframe", "form"]):
        tag.decompose()

    # Extract text with space separators
    text = soup.get_text(separator="\n", strip=True)

    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Truncate if content exceeds max_chars
    if len(text) > max_chars:
        text = text[:max_chars] + "\n...[Content Truncated]..."

    return text


# ─── Extraction Engine Class ──────────────────────────────────────────────────

def clean_json_str(text: str) -> str:
    """Clean markdown code block wrappers from JSON string."""
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()


class LLMExtractor:
    """
    LLM-powered Extraction Engine with Pydantic validation & fallback parser.
    """

    def __init__(self, api_key: Optional[str] = None, provider: Optional[str] = None):
        # BUGFIX: Infer provider automatically from available API keys if provider is not explicitly supplied
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if api_key:
            self.api_key = api_key
            self.provider = provider or "gemini"
        elif gemini_key:
            self.api_key = gemini_key
            self.provider = provider or "gemini"
        elif openai_key:
            self.api_key = openai_key
            self.provider = provider or "openai"
        else:
            self.api_key = None
            self.provider = provider or "gemini"

    def extract_from_html(self, raw_html: str, url: str) -> JobExtractionSchema:
        """
        Main extraction interface. Uses LLM if API key is present,
        otherwise falls back to rule-based HTML parsing.
        """
        trimmed_text = trim_html_for_llm(raw_html)

        if self.api_key:
            try:
                if self.provider == "gemini":
                    return self._extract_with_gemini(trimmed_text, url)
                elif self.provider == "openai":
                    return self._extract_with_openai(trimmed_text, url)
            except Exception as e:
                logger.warning(f"LLM extraction failed for {url}: {e}. Falling back to heuristic parser.")

        return self._extract_fallback(raw_html, trimmed_text, url)

    def _extract_with_gemini(self, trimmed_text: str, url: str) -> JobExtractionSchema:
        """Extract structured JSON using Google Gemini API."""
        import google.generativeai as genai

        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
Extract structured job vacancy details from the following web page content into a JSON object matching this schema:
{{
    "title": "Job Title",
    "company_name": "Company Name",
    "location": "City or Location",
    "salary_min": null or integer (in IDR),
    "salary_max": null or integer (in IDR),
    "job_type": "Full-time / Contract / Internship",
    "job_experience": "e.g. 1-3 Tahun",
    "is_remote": false or true,
    "sektor": "Teknologi & TI / Keuangan / Umum",
    "description": "Short summary",
    "requirements": ["req1", "req2"],
    "skills": ["Python", "Docker"]
}}

Page Content:
{trimmed_text}
"""
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        cleaned_json = clean_json_str(response.text)
        data = json.loads(cleaned_json)
        data["source_url"] = url
        return JobExtractionSchema(**data)

    def _extract_with_openai(self, trimmed_text: str, url: str) -> JobExtractionSchema:
        """Extract structured JSON using OpenAI API."""
        import openai

        client = openai.OpenAI(api_key=self.api_key)
        prompt = f"Extract structured job data into JSON matching schema.\nContent:\n{trimmed_text}"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a professional job posting data extractor."},
                {"role": "user", "content": prompt}
            ]
        )
        cleaned_json = clean_json_str(response.choices[0].message.content)
        data = json.loads(cleaned_json)
        data["source_url"] = url
        return JobExtractionSchema(**data)

    def _extract_fallback(self, raw_html: str, trimmed_text: str, url: str) -> JobExtractionSchema:
        """
        Rule-based heuristic fallback extractor when LLM API key is not available.
        Extracts title, company, location, salary, experience, requirements & skills using BeautifulSoup & regex.
        Safely catches unexpected parsing exceptions to prevent pipeline crash.
        """
        try:
            soup = BeautifulSoup(raw_html or "", "html.parser")

            # 1. Title Extraction
            title = "Lowongan Pekerjaan"
            title_tag = soup.find("h1") or soup.find("meta", property="og:title")
            if title_tag:
                title = title_tag.get("content") if title_tag.name == "meta" else title_tag.get_text(strip=True)
                title = re.sub(r'\s*\|\s*.*$', '', title) # Strip site name suffix

            # 2. Company Name
            company = "Perusahaan"
            comp_tag = (
                soup.find(class_=re.compile(r'company|employer|perusahaan', re.I))
                or soup.find("meta", property="og:site_name")
            )
            if comp_tag:
                company = comp_tag.get("content") if comp_tag.name == "meta" else comp_tag.get_text(strip=True)

            # 3. Location
            location = "Indonesia"
            loc_tag = soup.find(class_=re.compile(r'location|lokasi|city', re.I))
            if loc_tag:
                location = loc_tag.get_text(strip=True)

            # 4. Salary detection (BUGFIX: Enhanced regex pattern supporting Rp/IDR ranges & single figures)
            salary_min, salary_max = None, None
            salary_match = re.search(r'(?:Rp|IDR)\.?\s*([\d.]+)\s*[-–]\s*(?:Rp|IDR)?\.?\s*([\d.]+)', trimmed_text, re.I)
            if salary_match:
                try:
                    min_str = salary_match.group(1).replace('.', '')
                    max_str = salary_match.group(2).replace('.', '')
                    salary_min = int(min_str)
                    salary_max = int(max_str)
                    if salary_min < 1000:
                        salary_min *= 1_000_000
                    if salary_max < 1000:
                        salary_max *= 1_000_000
                except (ValueError, OverflowError):
                    pass
            else:
                single_match = re.search(r'(?:Gaji|Salary|IDR|Rp)\.?\s*([\d.]+)', trimmed_text, re.I)
                if single_match:
                    try:
                        val = int(single_match.group(1).replace('.', ''))
                        if val > 100_000:
                            salary_min = val
                    except (ValueError, OverflowError):
                        pass

            # 5. Remote detection
            is_remote = bool(re.search(r'\b(remote|wfh|work from home)\b', trimmed_text, re.I))

            # 6. Job Type heuristic
            job_type = "Full-time"
            if re.search(r'\b(internship|magang)\b', trimmed_text, re.I):
                job_type = "Internship"
            elif re.search(r'\b(kontrak|contract)\b', trimmed_text, re.I):
                job_type = "Contract"
            elif re.search(r'\b(part-time|paruh waktu)\b', trimmed_text, re.I):
                job_type = "Part-time"

            # 7. Experience requirement heuristic
            job_exp = None
            exp_match = re.search(r'\b(\d+\s*[-–]?\s*\d*\s*tahun|\d+\s*\+?\s*years?)\b', trimmed_text, re.I)
            if exp_match:
                job_exp = exp_match.group(1).strip()

            # 8. Sector heuristic
            sektor = "Umum"
            if re.search(r'\b(developer|software|engineer|tech|ti|it|data|cyber|cloud)\b', trimmed_text, re.I):
                sektor = "Teknologi & TI"
            elif re.search(r'\b(finance|akuntansi|banking|keuangan)\b', trimmed_text, re.I):
                sektor = "Keuangan"

            # 9. Requirements extraction heuristic
            requirements = []
            req_section = re.search(r'(?:kualifikasi|persyaratan|requirements|qualifications)[\s\S]{1,500}', trimmed_text, re.I)
            if req_section:
                lines = req_section.group(0).split('\n')[1:8]
                for line in lines:
                    clean_line = re.sub(r'^[•\-\*1-9\.]+\s*', '', line.strip())
                    if len(clean_line) > 5 and not re.search(r'^(kualifikasi|persyaratan|requirements|qualifications)$', clean_line, re.I):
                        requirements.append(clean_line)

            # 10. Skill keywords discovery from text
            common_skills = [
                "Python", "Docker", "Kubernetes", "React", "Node.js", "Laravel", "PHP",
                "SQL", "PostgreSQL", "MySQL", "AWS", "CI/CD", "Git", "Figma", "Golang"
            ]
            discovered_skills = [s for s in common_skills if re.search(r'\b' + re.escape(s) + r'\b', trimmed_text, re.I)]

            desc = trimmed_text[:500] + ("..." if len(trimmed_text) > 500 else "")

            return JobExtractionSchema(
                title=title or "Lowongan Pekerjaan",
                company_name=company or "Perusahaan",
                location=location or "Indonesia",
                salary_min=salary_min,
                salary_max=salary_max,
                job_type=job_type,
                job_experience=job_exp,
                is_remote=is_remote,
                sektor=sektor,
                description=desc,
                requirements=requirements,
                skills=discovered_skills,
                source_url=url,
            )
        except Exception as e:
            # RELIABILITY FIX: Prevent unexpected parsing errors on malformed HTML from crashing the pipeline
            logger.error(f"Fallback parser encountered error for {url}: {e}")
            return JobExtractionSchema(
                title="Lowongan Pekerjaan",
                company_name="Perusahaan",
                location="Indonesia",
                description=trimmed_text[:500] if trimmed_text else "Content unavailable",
                source_url=url,
            )
