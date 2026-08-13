# Graph Report - skillgapanalyzer  (2026-08-13)

## Corpus Check
- 25 files · ~22,295 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 180 nodes · 233 edges · 16 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `44bb6239`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `PRD — Skill Gap Analyzer` - 21 edges
2. `useToast()` - 19 edges
3. `11. Rekomendasi Modul & Fitur Tambahan (Untuk Iterasi Berikutnya)` - 9 edges
4. `useAuth()` - 7 edges
5. `Components` - 6 edges
6. `scripts` - 5 edges
7. `useSkills()` - 5 edges
8. `6. Modul: Dasbor (Dashboard Analitik Utama)` - 5 edges
9. `7. Modul: Peta Kompetensi (Skill Gap Map)` - 5 edges
10. `8. Modul: Analisis AI` - 5 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/context/AuthContext.jsx
- `CompetencyMap()` --calls--> `useToast()`  [EXTRACTED]
  src/components/CompetencyMap.jsx → src/context/ToastContext.jsx
- `MahasiswaDashboard()` --calls--> `useToast()`  [EXTRACTED]
  src/components/MahasiswaDashboard.jsx → src/context/ToastContext.jsx
- `Settings()` --calls--> `useToast()`  [EXTRACTED]
  src/components/Settings.jsx → src/context/ToastContext.jsx
- `SkillManager()` --calls--> `useToast()`  [EXTRACTED]
  src/components/SkillManager.jsx → src/context/ToastContext.jsx

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (20): AIAnalysis(), aiCards, gapSkills, generatorSteps, CampusManagement(), CURRICULUM_PROPOSALS, MASTER_COURSES, USERS (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (27): 0. Cara Pakai Dokumen Ini, 10. Modul Pendukung: Pengaturan & Bantuan, 12. Alur Pengguna Utama (Key User Flows), 13. Kebutuhan Data & Model Konseptual, 14. Kebutuhan Non-Fungsional, 15. Arsitektur Teknis (Ringkasan dari Proposal), 16. Metrik Keberhasilan (KPI Produk), 17. Roadmap Bertahap (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (12): Dashboard(), Help(), Settings(), SYSTEM_STATUS, AuthContext, DEMO_USERS, useAuth(), LoginPage() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (13): JOB_RECS, LEARNING_PATH, MahasiswaDashboard(), SKILL_GAPS, STUDENT, SkillManager(), TRENDING_SKILLS, AuthProvider() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (13): dependencies, chart.js, react, react-dom, name, private, scripts, build (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (12): Brand & Style, Buttons, Cards, Colors, Components, Elevation & Depth, Inputs, Layout & Spacing (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, oxlint, postcss, tailwindcss, @tailwindcss/postcss, @types/react, @types/react-dom (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (9): 11.1 Modul Manajemen Kurikulum (belum ada di desain saat ini), 11.2 Modul Kolaborasi Industri, 11.3 Modul Laporan & Ekspor untuk Akreditasi, 11.4 Portal Ringkas untuk Mahasiswa, 11.5 Sistem Notifikasi & Digest, 11.6 Audit Trail & Explainability AI, 11.7 Perbandingan Antar-Program Studi / Benchmarking, 11.8 Manajemen Taksonomi Skill (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (6): allSkills, CLUSTER_DATA, clusters, CompetencyMap(), TOTAL_SKILLS, trendingSkills

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (3): LandingPage(), StatCard(), useCountUp()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (5): 7.1 Fitur, 7.2 User Story, 7.3 Kriteria Penerimaan, 7.4 Data yang Dibutuhkan, 7. Modul: Peta Kompetensi (Skill Gap Map)

### Community 12 - "Community 12"
Cohesion: 0.40
Nodes (5): 9.1 Fitur, 9.2 User Story, 9.3 Kriteria Penerimaan, 9.4 Data yang Dibutuhkan, 9. Modul: Agen Scraping

### Community 13 - "Community 13"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **107 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `name` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PRD — Skill Gap Analyzer` connect `Community 1` to `Community 11`, `Community 12`, `Community 7`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 0` to `Community 8`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `11. Rekomendasi Modul & Fitur Tambahan (Untuk Iterasi Berikutnya)` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08266129032258064 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._