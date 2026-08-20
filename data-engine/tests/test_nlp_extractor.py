import sys
from pathlib import Path

data_engine_dir = Path(__file__).resolve().parent.parent
if str(data_engine_dir) not in sys.path:
    sys.path.insert(0, str(data_engine_dir))

import pytest
from nlp.normalizer import clean_text, tokenize, normalize_skill_name
from nlp.extractor import SkillExtractor, DEFAULT_TAXONOMY


def test_clean_text():
    html_input = "<p>Dibutuhkan <strong>Software Engineer</strong> dengan kemampuan:</p><ul><li>React.js &amp; Laravel</li></ul>"
    cleaned = clean_text(html_input)
    assert "Dibutuhkan Software Engineer" in cleaned
    assert "React.js & Laravel" in cleaned
    assert "<p>" not in cleaned
    assert "<li>" not in cleaned


def test_normalize_skill_name():
    assert normalize_skill_name("  React.JS  ") == "react.js"
    assert normalize_skill_name("CI / CD Pipelines") == "ci/cd pipelines"
    assert normalize_skill_name("Docker Container") == "docker container"


def test_extract_exact_skills():
    extractor = SkillExtractor()
    job_text = """
    Kami mencari Fullstack Developer yang mahir menggunakan Laravel, React.js, dan Docker.
    Pengalaman dengan database PostgreSQL dan deployment ke AWS Cloud merupakan nilai tambah.
    """
    skills = extractor.extract_skill_names(job_text)
    assert "Laravel" in skills
    assert "React.js" in skills
    assert "Docker" in skills
    assert "PostgreSQL" in skills
    assert "AWS Cloud" in skills


def test_extract_alias_and_synonym_resolution():
    extractor = SkillExtractor()
    # "k8s" should resolve to "Kubernetes"
    # "containerization" should resolve to "Docker"
    # "ci/cd" should resolve to "CI/CD Pipelines"
    # "postgres" should resolve to "PostgreSQL"
    job_text = "Familiar with k8s orchestration, containerization, ci/cd workflows, and postgres db."
    skills = extractor.extract_skill_names(job_text)
    assert "Kubernetes" in skills
    assert "Docker" in skills
    assert "CI/CD Pipelines" in skills
    assert "PostgreSQL" in skills


def test_word_boundary_isolation_prevents_false_positives():
    extractor = SkillExtractor()
    # The word "good", "going", "gopher" should not falsely match "Go (Golang)"
    # The word "reaction" should not falsely match "React.js"
    text = "We have a good team going forward and fast reaction time."
    skills = extractor.extract_skill_names(text)
    assert "React.js" not in skills
    assert "Go (Golang)" not in skills


def test_curriculum_learning_outcomes_extraction():
    extractor = SkillExtractor()
    rps_lo_text = """
    Capaian Pembelajaran Mata Kuliah (CPMK):
    1. Mahasiswa mampu merancang arsitektur microservices menggunakan Docker dan Kubernetes.
    2. Mahasiswa mampu mengimplementasikan pipeline CI/CD dengan GitHub Actions.
    3. Mahasiswa mampu menguji ketahanan sistem dengan Root Cause Analysis.
    """
    extracted = extractor.extract(rps_lo_text)
    skills = [e["skill"] for e in extracted]

    assert "Docker" in skills
    assert "Kubernetes" in skills
    assert "CI/CD Pipelines" in skills
    assert "Root Cause Analysis" in skills

    # Check dimension tagging for non-hard dimension (Root Cause Analysis -> contingency_management)
    rca = next(e for e in extracted if e["skill"] == "Root Cause Analysis")
    assert rca["dimension"] == "contingency_management"
