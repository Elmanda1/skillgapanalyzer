# Finalisasi Hybrid Extractor & Domain-Aware Taxonomy
**Proof Logika & Test Suite Wajib Passed**

---

## 1. Ruang Lingkup Finalisasi

Dokumen ini menutup 3 area yang sudah didesain sepanjang diskusi:

| Area | Komponen |
|---|---|
| A. Extractor | Layer 1 (exact match) + Layer 2 (alias + proximity guard) — deterministik, real-time |
| B. Domain Affinity Guard | Filter skill non-relevan (kasus "Sales" nyasar ke Prodi TI) dipasang di titik akar (`$evalSkillIds`) |
| C. Sektor dari Kategori | `industry_sectors` diturunkan dari `kategori` yang sudah ada (bottom-up), bukan diimpor dari daftar eksternal |

Layer 3 (semantic discovery), individual skill verification per mahasiswa, dan normalisasi SKS **di luar scope** finalisasi ini (sudah disepakati ditunda).

---

## 2. Proof Logika

### 2.1 Proof — Guard Rule Layer 2 Menutup False Positive

**Klaim:** Alias pendek/ambigu (`go`, `ts`, `ml`, dst.) tidak lagi ke-tag kalau tidak ada konteks teknis di sekitarnya.

**Logika guard:**
```
Match diterima HANYA JIKA:
  alias.min_context_required = false
  ATAU
  minimal 1 context_keyword ditemukan dalam window [i-5, i+n-1+5] token
```

**Bukti lewat 2 kasus kontras dengan alias yang sama ("go"):**

| Kasus | Kalimat | Token di sekitar "go" (±5) | context_keywords match? | Hasil |
|---|---|---|---|---|
| Negatif | *"We want to go ahead with the project."* | want, to, ahead, with, the | Tidak ada (`golang`, `programming`, `developer`, dll tidak muncul) | **DITOLAK** — bukan match Go(Golang) |
| Positif | *"Backend developer skilled in go programming."* | backend, developer, skilled, in, programming | `developer` ✓, `programming` ✓ | **DITERIMA** — confidence 0.90 |

Ini membuktikan guard bekerja berdasarkan **konteks token nyata**, bukan sekadar ada/tidaknya kata — sehingga kalimat sehari-hari yang kebetulan mengandung alias pendek tidak ikut ke-tag.

### 2.2 Proof — Domain Affinity Guard Menutup Kasus "Sales di Prodi TI"

**Klaim:** Skill di luar sektor prodi tidak akan pernah sampai ke `TaxonomyClassifierService`, sehingga tidak mungkin muncul sebagai rekomendasi.

**Rantai pembuktian (lokasi guard dipasang di titik akar):**

```
Skill "Sales"
  → kategori = "Sales & Marketing"
  → category_sector_map: "Sales & Marketing" → sector "Bisnis & Manajemen"
  → Prodi "Teknik Informatika" → sectors: ["Teknologi & TI"]
  → intersect(["Bisnis & Manajemen"], ["Teknologi & TI"]) = KOSONG
  → isDomainRelevant() = false
  → dimension skill "Sales" = hard_technical → guard DIBERLAKUKAN
  → Skill "Sales" DIKELUARKAN dari $evalSkillIds
  → TaxonomyClassifierService TIDAK PERNAH menerima skill ini untuk Prodi TI
  → GapMapController TIDAK PERNAH generate rekomendasi "Integrasi Modul Sales"
```

**Kontras — skill yang seharusnya tetap lolos (Docker untuk Prodi TI):**
```
Skill "Docker" → kategori "Cloud & DevOps" → sector "Teknologi & TI"
Prodi TI → sectors: ["Teknologi & TI"]
intersect = ["Teknologi & TI"] (tidak kosong) → isDomainRelevant() = true → LOLOS evaluasi
```

**Kontras — skill lintas-disiplin tidak boleh ke-block (Team Collaboration):**
```
Skill "Team Collaboration" → dimension = social_situational (BUKAN hard_technical)
→ guard TIDAK diberlakukan sama sekali → LOLOS untuk semua prodi tanpa cek sektor
```

Tiga kasus ini membuktikan guard **presisi**: memblokir yang memang di luar domain, meloloskan yang relevan, dan tidak menyentuh dimensi kompetensi yang memang lintas-disiplin.

### 2.3 Proof — Fail-Open untuk Kategori Belum Ter-mapping

**Klaim:** Skill baru dari Layer 3 yang belum sempat dikategorikan tidak hilang begitu saja dari evaluasi.

```
Skill baru "Rust" → kategori = "Bahasa Pemrograman Baru" (belum ada di category_sector_map)
→ CategorySectorMap::where('kategori', ...)->value('sector_id') = NULL
→ isDomainRelevant() return true (fail-open)
→ Skill tetap dievaluasi, TIDAK hilang diam-diam
```
Ini penting karena fail-closed di titik ini akan menyembunyikan skill_shortages yang valid tanpa jejak — lebih aman default lolos, dirapikan kategorinya belakangan.

---

## 3. Test Suite Wajib Passed — Logic / Backend

### 3.1 Normalizer

| ID | Input | Expected Output | Menutup |
|---|---|---|---|
| N-01 | `"Gaji > 15 Juta & pengalaman < 3 tahun"` | String utuh, tidak terpotong | Weakness #7 |
| N-02 | `"<p>Hello</p> World"` | `"Hello World"` | Baseline HTML strip |
| N-03 | `"<!-- comment -->Text"` | `" Text"` | Edge case comment tag |
| N-04 | `"C++"`, `"C#"`, `".NET"`, `"Node.js"`, `"CI / CD"` | `"c++"`, `"c#"`, `".net"`, `"node.js"`, `"ci/cd"` | Preservasi token teknis |

### 3.2 Extractor Layer 1 & 2

| ID | Input Kalimat | Alias Diuji | Expected | Menutup |
|---|---|---|---|---|
| E-01 | `"We want to go ahead with the project."` | `go` | TIDAK match Go(Golang) | Weakness #5 |
| E-02 | `"Backend developer skilled in go programming."` | `go` | Match Go(Golang), conf 0.90 | Weakness #5 |
| E-03 | `"The team scored 110 pts in the game."` | `ts` | TIDAK match TypeScript | Weakness #8 |
| E-04 | `"Frontend developer with strong ts and React skills."` | `ts` | Match TypeScript, conf 0.90 | Weakness #8 |
| E-05 | `"Please send your cv to HR."` | `cv` | TIDAK match Computer Vision | Weakness #5/#8 |
| E-06 | `"Engineer developing cv models for image detection."` | `cv` | Match Computer Vision, conf 0.90 | Weakness #5/#8 |
| E-07 | Ulangi E-01 s.d. E-06 di **Python extractor** | — | Hasil identik dengan PHP (match/tidak, confidence) | Weakness #9 |
| E-08 | `"Menguasai Docker dan Laravel."` | `Docker` (canonical) | Match, conf 1.0, tanpa guard | Layer 1 baseline |

### 3.3 Domain Affinity Guard

| ID | Skenario | Expected | Menutup |
|---|---|---|---|
| D-01 | Skill "Sales" (hard_technical, kategori "Sales & Marketing") dievaluasi untuk Prodi "Teknik Informatika" (sector "Teknologi & TI") | `isDomainRelevant() = false`, skill **tidak masuk** `$evalSkillIds` | Bug "Sales di Prodi TI" |
| D-02 | Skill "Docker" (hard_technical, kategori "Cloud & DevOps") dievaluasi untuk Prodi TI | `isDomainRelevant() = true`, skill masuk `$evalSkillIds` | Regression guard |
| D-03 | Skill "Team Collaboration" (dimension `social_situational`) dievaluasi untuk Prodi TI maupun Prodi Sipil | Guard **tidak diberlakukan**, skill selalu lolos | Lintas-disiplin |
| D-04 | Skill baru dengan `kategori` belum ada di `category_sector_map` | `isDomainRelevant() = true` (fail-open) | Anti-hilang-diam-diam |
| D-05 | Ulangi D-01 dengan skill_id yang sama tapi Prodi "Sistem Informasi" yang sector-nya `["Teknologi & TI", "Bisnis & Manajemen"]` | `isDomainRelevant() = true` (Sales relevan untuk SI) | Multi-sektor prodi |
| D-06 | End-to-end: jalankan `SkillGapAnalyzerService` penuh untuk Prodi TI dengan dataset lowongan campuran (IT + Sales) | Output `gap_analyses` **tidak mengandung** baris skill "Sales" sama sekali untuk Prodi TI | Regression test utama |

### 3.4 Governance Taksonomi

| ID | Skenario | Expected | Menutup |
|---|---|---|---|
| G-01 | Hasil Layer 3 discovery untuk frasa baru | Masuk `taxonomy_candidates` dengan `status = pending`, `source = semantic_discovery` | Tidak auto-tag |
| G-02 | Dosen submit skill baru "React JS" saat "React" sudah ada di taksonomi | Sistem menampilkan `duplicate_warning` merujuk ke "React" (curated synonym table) | Anti-duplikasi |
| G-03 | Dosen submit skill baru, belum di-approve super admin | Skill **belum** muncul di `skills`/`skill_aliases` resmi, status `pending` | Governance gate |
| G-04 | Super admin approve kandidat dari `taxonomy_candidates` | Row baru masuk `skills`/`skill_aliases`, `source` tercatat sesuai asal (`curated_submission` / `semantic_discovery`) | Traceability |

### 3.5 Aggregator Scraper (guard rail)

| ID | Skenario | Expected | Menutup |
|---|---|---|---|
| S-01 | `active_ids` run baru turun >50% dari run sebelumnya | Proses **ditahan**, aggregat **tidak** ditimpa, anomali ter-log | Weakness #1 |
| S-02 | `active_ids` run baru turun wajar (<10%) | Aggregat ditimpa normal | Baseline |
| S-03 | Job ID hilang dari aggregat baru | Row di DB Laravel jadi `status = expired`, **row tidak terhapus** | Preservasi histori growthRate |
| S-04 | Hitung `growthRate` setelah S-03 dijalankan beberapa periode | `prevFreq` tetap terbaca dari data historis (termasuk yang `expired`) | Weakness terkait histori |

---

## 4. Test Suite Wajib Passed — Frontend

| ID | Komponen | Precondition | Expected UI Behavior |
|---|---|---|---|
| F-01 | Dashboard Kaprodi — Skill Gap Map | Dataset campuran (job IT + Sales), Prodi = Teknik Informatika | Skill "Sales" **tidak muncul** di daftar/peta kesenjangan sama sekali |
| F-02 | Dashboard Kaprodi — Skill Gap Map | Skill "Docker" dengan ratio < 0.50 | Badge merah "Underskilling", skor urgensi ditampilkan sesuai perhitungan backend |
| F-03 | Super Admin — Panel Scraper | Sanity check trip (S-01) | Banner peringatan anomali tampil, tombol "timpa aggregat" **tidak otomatis jalan**, perlu konfirmasi manual |
| F-04 | Super Admin — Panel Scraper | Fetch berjalan normal | Status run terakhir + timestamp `scraped_at` terbaru tampil |
| F-05 | Super Admin — Antrian Taksonomi | Ada kandidat dari `curated_submission` dan `semantic_discovery` | Keduanya tampil dalam **satu list**, dengan konteks berbeda: CPMK+matkul untuk submission dosen, similarity_score+contoh kalimat untuk discovery |
| F-06 | Super Admin — Antrian Taksonomi | Klik approve/reject pada satu kandidat | Status berubah tanpa reload penuh, kandidat lain di list tidak terpengaruh |
| F-07 | Form Submit Skill (Dosen) | Mengetik "React JS" saat "React" sudah ada | Peringatan duplikat muncul **real-time** (sebelum submit ditekan) |
| F-08 | Form Submit Skill (Dosen) | Submit berhasil | Status yang tampil ke dosen: "Menunggu review Super Admin" (bukan langsung aktif) |
| F-09 | Dashboard Dosen — Silabus & CPMK Review | Skill sudah di-mapping ke matkul | CPMK terkait tampil sesuai data yang diinput saat submission |

---

## 5. Acceptance Criteria (Checklist Ringkas)

- [ ] Semua test **N-xx** (normalizer) passed
- [ ] Semua test **E-xx** (extractor Layer 1–2) passed, termasuk E-07 (konsistensi Python vs PHP)
- [ ] Semua test **D-xx** (domain affinity), khususnya **D-06 tidak boleh gagal** — ini regression test inti dari bug "Sales di Prodi TI"
- [ ] Semua test **G-xx** (governance) passed — tidak ada skill baru yang lolos ke taksonomi resmi tanpa status `approved`
- [ ] Semua test **S-xx** (scraper guard rail) passed — terutama S-01 (anomali tidak boleh auto-overwrite)
- [ ] Semua test **F-xx** (frontend) passed secara visual/manual di dashboard masing-masing role (Kaprodi, Dosen, Super Admin)
- [ ] Tidak ada satu pun skill dengan `dimension = hard_technical` yang lolos ke prodi di luar sektornya (kecuali fail-open kategori belum ter-mapping, D-04)