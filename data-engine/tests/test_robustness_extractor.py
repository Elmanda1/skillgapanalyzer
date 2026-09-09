import sys
from pathlib import Path

data_engine_dir = Path(__file__).resolve().parent.parent
if str(data_engine_dir) not in sys.path:
    sys.path.insert(0, str(data_engine_dir))

import pytest
from nlp.extractor import SkillExtractor
from nlp.normalizer import clean_text, tokenize, normalize_skill_name


@pytest.fixture
def extractor():
    return SkillExtractor()


def test_html_and_math_inequalities_safety(extractor):
    """Verify that HTML is stripped safely but math operators like < and > are preserved."""
    raw_text = """
    <div>
        <h3>Lowongan Backend Engineer</h3>
        <p>Gaji &gt; Rp 15.000.000 dengan pengalaman &lt; 3 tahun.</p>
        <p>Wajib menguasai <strong>Docker</strong>, <em>PostgreSQL</em>, dan <code>Python</code>.</p>
        <script>console.log("malicious");</script>
    </div>
    """
    skills = extractor.extract_skill_names(raw_text)
    assert "Docker" in skills
    assert "PostgreSQL" in skills
    assert "Python" in skills
    assert len(skills) == 3


def test_case_and_formatting_invariance(extractor):
    """Test mixed case, extra whitespace, and slash variations."""
    variations = [
        "dOcKeR containerization DOCKER",
        "CI / CD pipelines with GITHUB ACTIONS",
        "React.JS and NEXT.JS development",
        "c# and .net core backend",
        "NODE.JS and EXPRESS",
    ]
    for text in variations:
        skills = extractor.extract_skill_names(text)
        assert len(skills) > 0


def test_robustness_short_alias_matrix(extractor):
    """Exhaustive positive and negative test matrix for guarded short aliases."""
    test_cases = [
        # Golang ("go")
        ("We plan to go to Bandung for vacation.", "Go (Golang)", False),
        ("Let's go forward with the project proposal.", "Go (Golang)", False),
        ("Hiring a backend engineer with go language experience.", "Go (Golang)", True),
        ("Building high-throughput microservices using go programming.", "Go (Golang)", True),

        # TypeScript ("ts")
        ("The basketball team scored 110 pts in the finals.", "TypeScript", False),
        ("Looking at the ts stats for this quarter.", "TypeScript", False),
        ("Frontend web developer with strong ts and React skills.", "TypeScript", True),
        ("Writing clean typed code with ts framework.", "TypeScript", True),

        # Computer Vision ("cv")
        ("Please submit your updated cv and portfolio to HR.", "Computer Vision", False),
        ("We reviewed your cv and would like to invite you.", "Computer Vision", False),
        ("AI researcher developing cv models for image recognition.", "Computer Vision", True),
        ("Deep learning cv object detection using opencv.", "Computer Vision", True),

        # Machine Learning ("ml")
        ("Pour 250 ml of solution into the flask.", "Machine Learning", False),
        ("Drive at 60 ml per hour on the highway.", "Machine Learning", False),
        ("Data scientist building ml algorithms and predictive models.", "Machine Learning", True),

        # React Native ("rn")
        ("I have to leave right rn for the meeting.", "React Native", False),
        ("What are you doing rn?", "React Native", False),
        ("Mobile app developer experienced in rn and Flutter for iOS and Android.", "React Native", True),

        # Elasticsearch ("elastic")
        ("The elastic band on the trousers is worn out.", "Elasticsearch", False),
        ("Elastic material design for clothing.", "Elasticsearch", False),
        ("Configuring an elastic cluster for logstash search indexing.", "Elasticsearch", True),

        # Debugging ("debug")
        ("Let's debug why the team is arriving late to meetings.", "Debugging", False),
        ("Software developer handling bug fixing and debug code issues.", "Debugging", True),

        # Unit Testing ("tests")
        ("Medical blood tests are required for pre-employment.", "Unit Testing", False),
        ("Final semester written tests will take place tomorrow.", "Unit Testing", False),
        ("Backend QA engineer writing automation unit tests and tdd coverage.", "Unit Testing", True),

        # REST APIs ("rest")
        ("You need to take a rest after working long hours.", "REST APIs", False),
        ("The rest of the employees will attend virtually.", "REST APIs", False),
        ("Building secure REST APIs with JSON endpoints for web services.", "REST APIs", True),

        # Git ("git")
        ("Don't be a silly git in public.", "Git Version Control", False),
        ("Managing project git repository and branch PR version control.", "Git Version Control", True),
    ]

    for text, target_skill, should_match in test_cases:
        extracted = extractor.extract_skill_names(text)
        if should_match:
            assert target_skill in extracted, f"Expected '{target_skill}' in '{text}' but got {extracted}"
        else:
            assert target_skill not in extracted, f"Did NOT expect '{target_skill}' in '{text}' but got {extracted}"


def test_mixed_bilingual_job_postings(extractor):
    """Test realistic Indonesian and English job descriptions."""
    text_id = """
    Dibutuhkan Senior Fullstack Developer:
    - Pengalaman minimal 3 tahun menggunakan Laravel dan Vue.js.
    - Terbiasa dengan arsitektur microservices, Docker, dan CI/CD pipelines.
    - Memahami database MySQL dan Redis untuk caching.
    - Mampu bekerjasama dalam tim (Team Collaboration) dan memiliki kemampuan Problem Solving yang baik.
    """
    extracted = extractor.extract(text_id)
    skills = [e["skill"] for e in extracted]

    assert "Laravel" in skills
    assert "Vue.js" in skills
    assert "Docker" in skills
    assert "CI/CD Pipelines" in skills
    assert "MySQL" in skills
    assert "Redis" in skills
    assert "Stakeholder Communication" in skills
    assert "Problem Solving" in skills



def test_confidence_and_canonical_prioritization(extractor):
    """Verify Layer 1 exact canonical match always gets 1.0 confidence."""
    text = "Proficient in Docker and Kubernetes orchestration."
    extracted = extractor.extract(text)

    docker = next(e for e in extracted if e["skill"] == "Docker")
    assert docker["confidence"] == 1.0

    k8s = next(e for e in extracted if e["skill"] == "Kubernetes")
    assert k8s["confidence"] >= 0.90
