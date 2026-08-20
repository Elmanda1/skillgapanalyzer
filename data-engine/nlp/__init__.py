"""
NLP Extraction and Normalization Package for Skill Gap Analyzer (Module 4.2)
"""
from .normalizer import clean_text, tokenize, extract_ngrams
from .extractor import SkillExtractor

__all__ = ["clean_text", "tokenize", "extract_ngrams", "SkillExtractor"]
