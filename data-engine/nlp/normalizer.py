# -*- coding: utf-8 -*-
"""
Text cleaning, tokenization, and normalization utilities for Skill Extraction.
Preserves technical skill notations (e.g. 'c++', 'c#', '.net', 'node.js', 'ci/cd').
"""
import re
import html
from typing import List, Set


# Stopwords in Indonesian & English that shouldn't interfere with skill keywords
STOPWORDS = {
    # Indonesian
    "dan", "atau", "yang", "di", "ke", "dari", "untuk", "pada", "dengan", "adalah",
    "sebagai", "dalam", "bisa", "dapat", "memiliki", "menguasai", "pengalaman",
    "minimal", "tahun", "posisi", "pekerjaan", "tanggung", "jawab", "kualifikasi",
    "mampu", "memahami", "mahasiswa", "mata", "kuliah", "capaian", "pembelajaran",
    "lulusan", "materi", "pokok", "bahasan", "deskripsi", "tujuan", "kursus",
    # English
    "and", "or", "the", "in", "to", "for", "with", "is", "as", "by", "an", "at",
    "of", "on", "from", "experience", "skills", "knowledge", "required", "preferred",
    "ability", "strong", "proficient", "understanding", "year", "years", "candidate",
}


def clean_text(text: str) -> str:
    """
    Clean raw HTML / markdown text, normalize spaces, and unescape entities.
    Safely strips HTML tags while preserving mathematical/comparison symbols.
    """
    if not text or not isinstance(text, str):
        return ""

    # Unescape HTML entities (&amp;, &lt;, etc.)
    text = html.unescape(text)

    # Strip HTML tags (matches tag-like structures starting with a tag name or comment)
    text = re.sub(r"<(?:/?[a-zA-Z][a-zA-Z0-9:-]*\b[^>]*|!--.*?--)>", " ", text, flags=re.DOTALL)

    # Replace newlines, tabs, and multiple spaces with a single space
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)

    return text.strip()



def normalize_skill_name(name: str) -> str:
    """
    Normalize a skill/alias string into canonical lookup key.
    Examples:
      'React.js' -> 'react.js'
      '  CI / CD  ' -> 'ci/cd'
      'Docker Container' -> 'docker container'
    """
    if not name:
        return ""
    cleaned = clean_text(name).lower()
    # Normalize slashes with spaces (e.g. 'CI / CD' -> 'ci/cd')
    cleaned = re.sub(r"\s*/\s*", "/", cleaned)
    return cleaned


def tokenize(text: str) -> List[str]:
    """
    Tokenize text into lowercased words/symbols suitable for NLP analysis,
    preserving tech tokens (+, #, ., /).
    """
    if not text:
        return []
    cleaned = clean_text(text).lower()
    # Extract alphanumeric words and common tech terms (e.g. c++, c#, .net, vue.js)
    pattern = re.compile(r"[a-z0-9+#./-]+")
    tokens = pattern.findall(cleaned)
    # Strip leading/trailing dots or hyphens
    tokens = [t.strip(".-") for t in tokens if t.strip(".-")]
    return tokens


def extract_ngrams(tokens: List[str], n: int) -> List[str]:
    """
    Generate n-grams joined by a single space.
    """
    if n < 1 or len(tokens) < n:
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]
