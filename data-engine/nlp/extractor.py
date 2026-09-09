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
    {"nama": "Prometheus", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["prometheus monitoring", "prom metrics"]},
    {"nama": "Grafana", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["grafana dashboard", "grafana visualization"]},
    {"nama": "Linux Administration", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["linux server", "sysadmin", "bash linux", "linux"]},
    {"nama": "Nginx", "kategori": "Cloud & DevOps", "dimension": "hard_technical", "aliases": ["nginx web server", "nginx reverse proxy"]},

    # AI & Data Science
    {"nama": "LLM Fine-tuning", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["large language model tuning", "llm training", "fine-tuning llm", "large language model", "llm", "generative ai", "genai"]},
    {"nama": "Machine Learning", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": [
        "ml models", "predictive modeling", "machine learning algorithm",
        {"alias": "ml", "min_context_required": True, "context_keywords": ["machine", "learning", "model", "ai", "data", "algorithm", "engineer"]}
    ]},
    {"nama": "Deep Learning", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["neural networks", "deep neural net", "artificial neural network"]},
    {"nama": "PyTorch / TensorFlow", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["pytorch", "tensorflow", "tf", "torch", "keras"]},
    {"nama": "Computer Vision", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": [
        "image recognition", "object detection", "opencv",
        {"alias": "cv", "min_context_required": True, "context_keywords": ["vision", "image", "detection", "ai", "model", "deep learning", "opencv"]}
    ]},
    {"nama": "Natural Language Processing", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["nlp", "text processing", "language models", "spacy", "nltk", "transformers"]},
    {"nama": "Snowflake", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["snowflake data warehouse", "snowflake db"]},
    {"nama": "Pandas", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["python pandas", "pandas dataframe"]},
    {"nama": "Scikit-learn", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["sklearn", "scikit learn"]},
    {"nama": "Data Engineering", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["data pipeline", "etl data", "data pipeline etl", "etl"]},
    {"nama": "Spark", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["apache spark", "spark streaming"]},
    {"nama": "Tableau", "kategori": "AI & Data Science", "dimension": "hard_technical", "aliases": ["tableau dashboard", "tableau viz"]},

    # Frontend Dev
    {"nama": "React.js", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["react", "reactjs", "react js", "react library"]},
    {"nama": "Next.js", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["nextjs", "next js", "react next"]},
    {"nama": "Vue.js", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["vue", "vuejs", "vue js"]},
    {"nama": "Angular", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["angularjs", "angular framework"]},
    {"nama": "TypeScript", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": [
        "typed javascript",
        {"alias": "ts", "min_context_required": True, "context_keywords": ["typescript", "javascript", "developer", "frontend", "code", "typed", "stack", "framework"]}
    ]},
    {"nama": "Tailwind CSS", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["tailwind", "tailwindcss"]},
    {"nama": "CSS3", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["css", "cascading style sheets"]},
    {"nama": "HTML5", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["html", "markup html"]},
    {"nama": "Redux", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["redux state", "state management redux", "redux toolkit"]},
    {"nama": "Svelte", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["sveltekit", "svelte js"]},
    {"nama": "Figma", "kategori": "Frontend Dev", "dimension": "hard_technical", "aliases": ["figma design", "figma ui", "ui/ux design"]},

    # Backend Dev
    {"nama": "Laravel", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["laravel php", "laravel framework"]},
    {"nama": "Node.js", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["node", "nodejs", "node js", "express", "express.js", "nestjs"]},
    {"nama": "Python", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": [
        "python3", "django", "fastapi", "flask",
        {"alias": "py", "min_context_required": True, "context_keywords": ["python", "developer", "django", "fastapi", "flask", "script", "backend", "data"]}
    ]},
    {"nama": "Go (Golang)", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": [
        "golang", "go language", "go programming",
        {"alias": "go", "min_context_required": True, "context_keywords": ["golang", "language", "developer", "programming", "backend", "engineer", "code", "stack"]}
    ]},
    {"nama": "Java", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["java se", "spring boot", "spring java", "spring framework"]},
    {"nama": "PHP", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["php8", "php7", "native php", "php language"]},
    {"nama": "C# / .NET", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["c#", ".net", "dotnet", "asp.net", "entity framework"]},
    {"nama": "GraphQL APIs", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": ["graphql", "gql", "graph ql", "graphql api", "apollo graphql"]},
    {"nama": "REST APIs", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": [
        "restful api", "restful", "api development", "json api",
        {"alias": "rest", "min_context_required": True, "context_keywords": ["api", "restful", "endpoints", "json", "http", "backend", "web service", "services"]}
    ]},
    {"nama": "Microservices", "kategori": "Backend Dev", "dimension": "contingency_management", "aliases": ["microservice", "services architecture", "soa"]},

    # Database
    {"nama": "PostgreSQL", "kategori": "Database", "dimension": "hard_technical", "aliases": [
        "postgres", "pgsql", "postgresql db",
        {"alias": "pg", "min_context_required": True, "context_keywords": ["postgres", "postgresql", "database", "sql", "db", "rdbms"]}
    ]},
    {"nama": "MySQL", "kategori": "Database", "dimension": "hard_technical", "aliases": ["maria", "mariadb", "mysql database", "mysql db", "sql"]},
    {"nama": "MongoDB", "kategori": "Database", "dimension": "hard_technical", "aliases": ["mongo", "mongodb nosql", "nosql mongodb"]},
    {"nama": "Redis", "kategori": "Database", "dimension": "hard_technical", "aliases": ["redis cache", "redis in-memory", "redis store"]},
    {"nama": "Elasticsearch", "kategori": "Database", "dimension": "hard_technical", "aliases": [
        "elk search", "elk",
        {"alias": "elastic", "min_context_required": True, "context_keywords": ["elasticsearch", "search", "elk", "kibana", "logstash", "indexing", "cluster"]}
    ]},

    # Mobile Dev
    {"nama": "Flutter", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["dart flutter", "flutter framework", "flutter dart", "flutter sdk"]},
    {"nama": "React Native", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": [
        "react-native", "react native mobile",
        {"alias": "rn", "min_context_required": True, "context_keywords": ["react", "native", "mobile", "app", "developer", "ios", "android"]}
    ]},
    {"nama": "Kotlin", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["android kotlin", "kotlin android"]},
    {"nama": "Swift", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["ios swift", "swiftui", "swift apple", "swift ios"]},
    {"nama": "Android SDK", "kategori": "Mobile Dev", "dimension": "hard_technical", "aliases": ["android dev", "android development"]},

    # Cybersecurity
    {"nama": "Zero Trust Architecture", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["zero trust", "zta", "ztna", "zero trust network"]},
    {"nama": "Penetration Testing", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["pentest", "pen testing", "ethical hacking", "vulnerability assessment"]},
    {"nama": "Network Security", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["cyber security network", "netsec", "firewall", "ids/ips", "vpn security"]},
    {"nama": "SIEM", "kategori": "Cybersecurity", "dimension": "hard_technical", "aliases": ["security info event mgmt", "splunk siem"]},
    {"nama": "ISO 27001", "kategori": "Cybersecurity", "dimension": "knowledge_information", "aliases": ["iso27001", "27001 certification"]},

    # Non-Hard Competence Dimensions
    {"nama": "Agile / Scrum", "kategori": "Task Management", "dimension": "task_management", "aliases": ["scrum", "agile methodology", "kanban", "sprint planning", "jira", "agile scrum", "agile project management"]},
    {"nama": "Scrum Master", "kategori": "Task Management", "dimension": "task_management", "aliases": ["scrummaster", "scrum facilitator"]},
    {"nama": "Stakeholder Communication", "kategori": "Social & Situational", "dimension": "social_situational", "aliases": ["communication skills", "stakeholder mgmt", "komunikasi tim", "interpersonal communication", "team collaboration", "kerjasama tim"]},
    {"nama": "Technical Writing", "kategori": "Knowledge & Information", "dimension": "knowledge_information", "aliases": ["documentation", "tech writing", "dokumentasi teknis"]},
    {"nama": "Requirements Analysis", "kategori": "Contingency Management", "dimension": "contingency_management", "aliases": ["requirement gathering", "business analysis", "analisis kebutuhan"]},
    {"nama": "Incident Response", "kategori": "Contingency Management", "dimension": "contingency_management", "aliases": ["incident mgmt", "oncall response", "manajemen insiden"]},
    {"nama": "Team Leadership", "kategori": "Social & Situational", "dimension": "social_situational", "aliases": ["leadership", "team lead", "kepemimpinan tim"]},
    {"nama": "Problem Solving", "kategori": "Contingency Management", "dimension": "contingency_management", "aliases": ["analytical thinking", "troubleshooting", "problem solving", "pemecahan masalah"]},
    {"nama": "Root Cause Analysis", "kategori": "Contingency Management", "dimension": "contingency_management", "aliases": ["rca", "analisis akar masalah"]},
    {"nama": "Continuous Learning", "kategori": "Knowledge & Information", "dimension": "knowledge_information", "aliases": ["self learning", "belajar mandiri", "adaptability", "upskilling"]},
    {"nama": "Debugging", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": [
        "bug fixing",
        {"alias": "debug", "min_context_required": True, "context_keywords": ["debugging", "code", "software", "bug", "developer", "engineer", "issue", "fix"]}
    ]},
    {"nama": "Code Review", "kategori": "Backend Dev", "dimension": "contingency_management", "aliases": ["peer review", "review pr"]},
    {"nama": "Git Version Control", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": [
        "github", "gitlab",
        {"alias": "git", "min_context_required": True, "context_keywords": ["github", "gitlab", "version", "control", "repository", "commit", "branch", "vcs", "pr"]}
    ]},
    {"nama": "Unit Testing", "kategori": "Backend Dev", "dimension": "hard_technical", "aliases": [
        "tdd", "unit tests",
        {"alias": "tests", "min_context_required": True, "context_keywords": ["unit", "testing", "automation", "qa", "code", "coverage", "tdd", "integration"]}
    ]},
]


class SkillExtractor:
    """
    High-performance Hybrid Skill Extractor (Layer 1 Exact Match & Layer 2 Alias + Proximity Guard).
    """

    def __init__(self, taxonomy: Optional[List[Dict[str, Any]]] = None):
        self.taxonomy = taxonomy or DEFAULT_TAXONOMY
        self.patterns: List[Dict[str, Any]] = []
        self._build_index()

    def _build_index(self):
        """
        Pre-compile lookup patterns and context guard rules for each canonical skill and its aliases.
        """
        self.patterns = []
        for item in self.taxonomy:
            canonical = item["nama"]
            category = item.get("kategori", "Umum")
            dimension = item.get("dimension", "hard_technical")
            raw_aliases = item.get("aliases", [])

            # Compile canonical (Layer 1)
            compiled_terms = []
            norm_canonical = normalize_skill_name(canonical)
            if norm_canonical:
                escaped = re.escape(norm_canonical).replace(r"\/", r"\s*/\s*")
                regex = re.compile(r"(?<![a-zA-Z0-9_])" + escaped + r"(?![a-zA-Z0-9_])", re.IGNORECASE)
                compiled_terms.append({
                    "raw_term": canonical,
                    "norm_term": norm_canonical,
                    "is_canonical": True,
                    "min_context_required": False,
                    "context_keywords": set(),
                    "regex": regex,
                })

            # Compile aliases (Layer 2)
            for alias_entry in raw_aliases:
                if isinstance(alias_entry, dict):
                    alias_name = alias_entry.get("alias", "")
                    min_context = bool(alias_entry.get("min_context_required", False))
                    context_keywords = {
                        normalize_skill_name(k) for k in alias_entry.get("context_keywords", [])
                        if normalize_skill_name(k)
                    }
                else:
                    alias_name = str(alias_entry)
                    min_context = False
                    context_keywords = set()

                norm_alias = normalize_skill_name(alias_name)
                if not norm_alias or norm_alias == norm_canonical:
                    continue

                escaped = re.escape(norm_alias).replace(r"\/", r"\s*/\s*")
                regex = re.compile(r"(?<![a-zA-Z0-9_])" + escaped + r"(?![a-zA-Z0-9_])", re.IGNORECASE)
                compiled_terms.append({
                    "raw_term": alias_name,
                    "norm_term": norm_alias,
                    "is_canonical": False,
                    "min_context_required": min_context,
                    "context_keywords": context_keywords,
                    "regex": regex,
                })

            # Sort compiled terms by length descending
            compiled_terms.sort(key=lambda x: len(x["norm_term"]), reverse=True)

            self.patterns.append({
                "canonical": canonical,
                "category": category,
                "dimension": dimension,
                "compiled_terms": compiled_terms,
            })

    def extract(self, text: str, min_confidence: float = 0.5) -> List[Dict[str, Any]]:
        """
        Extract canonical skills present in the given text using Layer 1 & 2 Guarded rules.
        """
        if not text or not isinstance(text, str):
            return []

        cleaned = clean_text(text)
        if not cleaned:
            return []

        from .normalizer import tokenize
        tokens = tokenize(cleaned)
        token_count = len(tokens)

        results = []
        for pat in self.patterns:
            canonical = pat["canonical"]
            category = pat["category"]
            dimension = pat["dimension"]

            total_occurrences = 0
            matched_terms = []
            has_canonical_match = False

            for term_info in pat["compiled_terms"]:
                regex = term_info["regex"]
                raw_term = term_info["raw_term"]
                is_canonical = term_info["is_canonical"]
                min_context = term_info["min_context_required"]
                context_keywords = term_info["context_keywords"]

                # Find all match spans in cleaned text
                matches = list(regex.finditer(cleaned))
                if not matches:
                    continue

                term_occurrences = 0
                for match in matches:
                    if is_canonical or not min_context:
                        term_occurrences += 1
                    else:
                        # Check +-5 token window around match position
                        match_start = match.start()
                        match_end = match.end()

                        # Map character span to token indices
                        prefix_tokens = tokenize(cleaned[:match_start])
                        match_tokens = tokenize(cleaned[match_start:match_end])
                        match_token_idx = len(prefix_tokens)
                        match_token_len = max(1, len(match_tokens))

                        win_start = max(0, match_token_idx - 5)
                        win_end = min(token_count, match_token_idx + match_token_len + 5)

                        window_tokens = set(tokens[win_start:match_token_idx] + tokens[match_token_idx + match_token_len:win_end])

                        if window_tokens.intersection(context_keywords):
                            term_occurrences += 1

                if term_occurrences > 0:
                    total_occurrences += term_occurrences
                    matched_terms.append(raw_term)
                    if is_canonical:
                        has_canonical_match = True

            if total_occurrences > 0:
                confidence = 1.0 if (has_canonical_match or total_occurrences >= 2) else 0.90

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

