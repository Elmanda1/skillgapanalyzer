# -*- coding: utf-8 -*-
"""
Skill Extraction and Synonym Normalization Engine (Module 4.2).
Matches unstructured Indonesian/English text against canonical skills taxonomy.
"""
import re
from typing import Dict, List, Optional, Set, Any
from .normalizer import clean_text, normalize_skill_name


# Default standard taxonomy (aligned with TaxonomySeeder.php & SDD §6)
DEFAULT_TAXONOMY = [
    # Cloud & DevOps
    {"nama": "Docker", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["containerization", "docker container", "docker engine"]},
    {"nama": "Kubernetes", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["k8s", "kubernetes orchestration", "k8s cluster"]},
    {"nama": "AWS Cloud", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["amazon web services", "aws ec2", "aws s3", "aws"]},
    {"nama": "Microsoft Azure", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["azure", "microsoft azure cloud"]},
    {"nama": "Google Cloud Platform", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["gcp", "google cloud"]},
    {"nama": "CI/CD Pipelines", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["ci cd", "ci/cd", "continuous integration", "continuous deployment", "jenkins", "github actions", "gitlab ci"]},
    {"nama": "Terraform", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["infrastructure as code", "iac", "terraform hcl"]},
    {"nama": "Ansible", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["ansible playbook", "automation ansible"]},
    {"nama": "Linux Administration", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["linux server", "sysadmin", "bash linux", "linux"]},
    {"nama": "Nginx", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["nginx web server", "nginx reverse proxy"]},

    # AI & Data Science
    {"nama": "LLM Fine-tuning", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["large language model", "llm training", "fine-tuning llm", "llm", "generative ai", "genai"]},
    {"nama": "Machine Learning", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["ml", "ml models", "predictive modeling", "machine learning algorithm"]},
    {"nama": "Deep Learning", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["neural networks", "deep neural net", "artificial neural network"]},
    {"nama": "PyTorch / TensorFlow", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["pytorch", "tensorflow", "tf", "torch", "keras"]},
    {"nama": "Computer Vision", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["cv", "image recognition", "object detection", "opencv"]},
    {"nama": "Natural Language Processing", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["nlp", "text processing", "language models", "spacy", "nltk", "transformers"]},
    {"nama": "Snowflake", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["snowflake data warehouse", "snowflake db"]},
    {"nama": "Pandas", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["python pandas", "pandas dataframe"]},
    {"nama": "Scikit-learn", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["sklearn", "scikit learn"]},
    {"nama": "Data Engineering", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["data pipeline", "etl data", "data pipeline etl", "etl"]},

    # Frontend Dev
    {"nama": "React.js", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["react", "reactjs", "react js", "react library"]},
    {"nama": "Next.js", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["nextjs", "next js", "react next"]},
    {"nama": "Vue.js", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["vue", "vuejs", "vue js"]},
    {"nama": "Angular", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["angularjs", "angular framework"]},
    {"nama": "TypeScript", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["ts", "typed javascript"]},
    {"nama": "Tailwind CSS", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["tailwind", "tailwindcss"]},
    {"nama": "CSS3", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["css", "cascading style sheets"]},
    {"nama": "HTML5", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["html", "markup html"]},
    {"nama": "Redux", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["redux state", "state management redux", "redux toolkit"]},
    {"nama": "Figma", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["figma design", "figma ui", "ui/ux design"]},

    # Backend Dev
    {"nama": "Laravel", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["laravel php", "laravel framework"]},
    {"nama": "Node.js", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["node", "nodejs", "node js", "express", "express.js", "nestjs"]},
    {"nama": "Python", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["python3", "py", "django", "fastapi", "flask"]},
    {"nama": "Go (Golang)", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["golang", "go programming"]},
    {"nama": "Java", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["java se", "spring boot", "spring java", "spring framework"]},
    {"nama": "PHP", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["php8", "php7", "native php"]},
    {"nama": "C# / .NET", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["c#", ".net", "dotnet", "asp.net", "entity framework"]},
    {"nama": "GraphQL APIs", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["graphql", "graphql api", "apollo graphql"]},
    {"nama": "RESTful API", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["rest api", "restful", "api development", "json api"]},

    # Database
    {"nama": "PostgreSQL", "kategori": "Database", "dimension": "hard_technical", "aliases": ["postgres", "pgsql", "postgresql db"]},
    {"nama": "MySQL", "kategori": "Database", "dimension": "hard_technical", "aliases": ["mariadb", "mysql database", "sql"]},
    {"nama": "MongoDB", "kategori": "Database", "dimension": "hard_technical", "aliases": ["mongo", "nosql mongodb"]},
    {"nama": "Redis", "kategori": "Database", "dimension": "hard_technical", "aliases": ["redis cache", "redis in-memory"]},

    # Mobile Dev
    {"nama": "Flutter", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["dart flutter", "flutter framework", "dart"]},
    {"nama": "React Native", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["react-native", "rn mobile"]},
    {"nama": "Kotlin", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["android kotlin", "kotlin android"]},
    {"nama": "Swift", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["ios swift", "swiftui", "swift apple"]},

    # Cybersecurity
    {"nama": "Zero Trust Architecture", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["zero trust", "zta"]},
    {"nama": "Penetration Testing", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["pentest", "ethical hacking", "vulnerability assessment"]},
    {"nama": "Network Security", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["firewall", "ids/ips", "vpn security"]},

    # Non-Hard Competence Dimensions (Task, Contingency, Knowledge, Social)
    {"nama": "Agile / Scrum", "kategori": "Task Management", "dimension": "task_management", "aliases": ["scrum", "agile methodology", "kanban", "sprint planning", "jira"]},
    {"nama": "Project Management", "kategori": "Task Management", "dimension": "task_management", "aliases": ["manajemen proyek", "project planning", "timeline management"]},
    {"nama": "Root Cause Analysis", "kategori": "Contingency Management", "dimension": "contingency_management", "aliases": ["troubleshooting", "debugging", "incident response", "problem solving", "rca"]},
    {"nama": "Continuous Learning", "kategori": "Knowledge & Information", "dimension": "knowledge_information", "aliases": ["self learning", "belajar mandiri", "adaptability"]},
    {"nama": "Team Collaboration", "kategori": "Social & Situational", "dimension": "social_situational", "aliases": ["kerjasama tim", "teamwork", "komunikasi tim", "interpersonal communication"]},
]


class SkillExtractor:
    """
    High-performance Skill Extractor with exact word-boundary regex matching
    and synonym normalization.
    """

    def __init__(self, taxonomy: Optional[List[Dict[str, Any]]] = None):
        self.taxonomy = taxonomy or DEFAULT_TAXONOMY
        self.patterns: List[Dict[str, Any]] = []
        self._build_index()

    def _build_index(self):
        """
        Pre-compile regex patterns for each canonical skill and its aliases.
        """
        self.patterns = []
        for item in self.taxonomy:
            canonical = item["nama"]
            category = item.get("kategori", "Umum")
            dimension = item.get("dimension", "hard_technical")
            aliases = item.get("aliases", [])

            # Collect all matchable terms (canonical name + aliases)
            terms = [canonical] + list(aliases)
            # Sort terms by length descending to match longer specific terms first
            terms = sorted(list(set(terms)), key=lambda x: len(x), reverse=True)

            compiled_terms = []
            for term in terms:
                norm_term = normalize_skill_name(term)
                if not norm_term:
                    continue

                # Escape special regex chars except word boundaries
                escaped = re.escape(norm_term)
                # Handle slash / dot flexibly
                escaped = escaped.replace(r"\/", r"\s*/\s*")

                # Use negative lookbehind and lookahead for exact word boundary
                # especially for words with special symbols (+, #, .)
                regex = re.compile(
                    r"(?<![a-zA-Z0-9_])" + escaped + r"(?![a-zA-Z0-9_])",
                    re.IGNORECASE,
                )
                compiled_terms.append((term, regex))

            self.patterns.append({
                "canonical": canonical,
                "category": category,
                "dimension": dimension,
                "compiled_terms": compiled_terms,
            })

    def extract(self, text: str, min_confidence: float = 0.5) -> List[Dict[str, Any]]:
        """
        Extract canonical skills present in the given text.

        Returns list of matched skill dicts:
        [
            {
                "skill": "Docker",
                "category": "Cloud & DevOps",
                "dimension": "hard_technical",
                "matched_alias": "containerization",
                "occurrences": 2,
                "confidence": 1.0
            },
            ...
        ]
        """
        if not text or not isinstance(text, str):
            return []

        cleaned = clean_text(text)
        if not cleaned:
            return []

        results = []
        for pat in self.patterns:
            canonical = pat["canonical"]
            category = pat["category"]
            dimension = pat["dimension"]

            total_occurrences = 0
            matched_terms = []

            for raw_term, regex in pat["compiled_terms"]:
                matches = regex.findall(cleaned)
                count = len(matches)
                if count > 0:
                    total_occurrences += count
                    matched_terms.append(raw_term)

            if total_occurrences > 0:
                # Calculate confidence score (1.0 for multiple occurrences or canonical name match)
                canonical_matched = any(
                    normalize_skill_name(t) == normalize_skill_name(canonical)
                    for t in matched_terms
                )
                confidence = 1.0 if (canonical_matched or total_occurrences >= 2) else 0.85

                if confidence >= min_confidence:
                    results.append({
                        "skill": canonical,
                        "category": category,
                        "dimension": dimension,
                        "matched_alias": matched_terms[0] if matched_terms else canonical,
                        "matched_terms": matched_terms,
                        "occurrences": total_occurrences,
                        "confidence": confidence,
                    })

        return results

    def extract_skill_names(self, text: str) -> List[str]:
        """
        Convenience method returning deduplicated list of canonical skill names.
        """
        extracted = self.extract(text)
        return [item["skill"] for item in extracted]
