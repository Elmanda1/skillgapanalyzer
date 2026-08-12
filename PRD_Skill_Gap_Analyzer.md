# PRD — Skill Gap Analyzer
**Product Requirements Document**
Versi 0.1 (Draft awal, disusun dari Proposal KMIPN VIII + eksplorasi desain)

---

## 0. Cara Pakai Dokumen Ini

Dokumen ini disusun agar bisa langsung dijadikan konteks kerja untuk AI coding assistant (mis. di text editor/IDE). Setiap modul ditulis dengan format: **Tujuan → Fitur → User Story → Kriteria Penerimaan → Data yang Dibutuhkan**, supaya bisa langsung diturunkan jadi task/ticket atau prompt pembuatan komponen. Bagian 11 khusus berisi rekomendasi modul/fitur baru di luar yang sudah ada di desain awal (Google Stitch), untuk bahan iterasi berikutnya.

---

## 1. Ringkasan Eksekutif

**Skill Gap Analyzer** adalah sistem berbasis *Curriculum Intelligence* yang membandingkan secara kuantitatif antara **sisi Supply** (Learning Outcome / RPS kurikulum vokasi) dengan **sisi Demand** (kebutuhan kompetensi riil dari ribuan lowongan kerja) menggunakan NLP dan data mining. Output utamanya bukan sekadar "ada gap atau tidak", melainkan peta kesenjangan yang terklasifikasi (mis. *underskilling*, *skill shortage*) sehingga institusi vokasi bisa mendapat rekomendasi konkret: skill/topik apa yang perlu ditambahkan atau diperdalam ke kurikulum.

Produk ini menyasar tiga sisi pemangku kepentingan sekaligus:
- **Institusi pendidikan vokasi** — dasar objektif untuk revisi kurikulum/RPS.
- **Mahasiswa/lulusan vokasi** — insight skill tambahan yang perlu dikuasai sebelum lulus.
- **Industri & pembuat kebijakan** — jembatan informasi untuk kolaborasi kurikulum/magang dan basis *Labor Market Information System* (LMIS).

## 2. Latar Belakang Masalah

- *Skill mismatch* antara lulusan vokasi dan kebutuhan industri adalah masalah struktural yang berulang di riset nasional maupun internasional, namun belum ada mekanisme objektif dan terukur untuk mengidentifikasinya.
- Pendekatan yang sudah ada (tracer study, program *link and match* manual, portal lowongan kerja konvensional) bersifat retroaktif, subjektif, atau tidak memberi umpan balik analitik ke kampus.
- Skala masalah: pengangguran lulusan sarjana/diploma naik 14,6% (Feb 2024 → Feb 2025); proyeksi kekurangan 9 juta pekerja digital hingga 2030; ~44% kompetensi inti tenaga kerja global diperkirakan berubah pada 2027 karena AI & otomasi.
- Riset World Bank (2026) merekomendasikan pergeseran fokus "dari okupasi ke keterampilan" dan penguatan *data-driven policymaking* lewat LMIS — ini jadi landasan konsep produk.
- Belum ada sistem berbasis AI yang otomatis mendeteksi skill gap dari data lowongan kerja riil, sekaligus mengklasifikasikan jenis mismatch-nya (bukan cuma biner ada/tidak).

## 3. Tujuan Produk

1. Mengekstraksi dan memetakan Learning Outcome kurikulum vokasi secara terstruktur.
2. Mengumpulkan & menganalisis kebutuhan kompetensi dari ribuan lowongan kerja secara otomatis (web scraping + NLP).
3. Membandingkan kedua sisi data untuk menghasilkan *skill gap map* yang terukur, objektif, dan bisa diperbarui berkala — dengan taksonomi klasifikasi mismatch (bukan hanya gap/no-gap).
4. Menyediakan rekomendasi konkret: skill/topik apa yang perlu ditambah/diperdalam ke kurikulum, idealnya sampai ke draft silabus.

### Non-Goals (di luar cakupan versi awal)
- Bukan portal lowongan kerja / job board untuk pencari kerja.
- Bukan sistem approval resmi kurikulum (rekomendasi, bukan otomatis mengubah RPS institusi).
- Tidak menjamin kepatuhan hukum scraping tiap portal kerja — perlu review ToS per sumber saat implementasi.

## 4. Target Pengguna & Peran (Roles)

| Peran | Kebutuhan Utama | Level Akses |
|---|---|---|
| **Admin Institusi / Kaprodi** | Lihat dashboard gap, kelola data kurikulum, terima rekomendasi, ekspor laporan akreditasi | Penuh (dashboard, upload kurikulum, generate silabus, atur agen scraping) |
| **Dosen** | Lihat gap per mata kuliah yang diampu, terima usulan materi tambahan | Read + kontribusi silabus untuk mata kuliah sendiri |
| **Mahasiswa** (opsional, fase lanjut) | Lihat skill yang sedang tinggi permintaan tapi belum diajarkan | Read-only, versi ringkas/publik |
| **Super Admin / Ops** | Kelola agen scraping, sumber data, kesehatan pipeline, user & role | Penuh + system settings |

## 5. Peta Modul Produk

Berdasarkan desain yang sudah dibuat, ada 4 modul inti + 2 modul pendukung:

1. **Dasbor** — ringkasan real-time (KPI, tren ingest, kompetensi per sektor, status agen).
2. **Peta Kompetensi** — visualisasi skill gap map, overlap map, tingkat kecocokan (match rate).
3. **Analisis AI** — mesin analisis kesenjangan (gap detection), filter kurikulum vs industri, generator silabus otomatis.
4. **Agen Scraping** — manajemen node/agen pengumpul data lowongan kerja per wilayah.
5. **Pengaturan** — konfigurasi akun, institusi, sumber data, notifikasi.
6. **Bantuan** — dokumentasi & support.

Modul tambahan yang direkomendasikan ada di **Bagian 11**.

---

## 6. Modul: Dasbor (Dashboard Analitik Utama)

**Tujuan:** memberi ringkasan kesehatan sistem dan insight cepat begitu admin login, tanpa perlu masuk ke modul detail.

### 6.1 Fitur

**a. Kartu Metrik Utama (Summary Cards)**
- Skill Diekstraksi (total skill unik yang berhasil diekstrak dari semua sumber) + tren vs minggu lalu.
- Mata Kuliah Sinkron (jumlah mata kuliah yang sudah dipetakan ke taksonomi skill) + tren.
- Permintaan HTTP 24 Jam (indikator kesehatan/beban infrastruktur scraping) + tren.
- Gap Skill Kritis (jumlah gap berprioritas tinggi yang butuh perhatian segera).

**b. Grafik "Laju Ingesti vs Intelligent Delay"**
- Line chart dual-axis: throughput data (GB/s) vs delay pipeline (ms) sepanjang 12/24 jam terakhir.
- Tooltip interaktif menampilkan titik puncak (peak value).
- Tujuan: memantau kesehatan pipeline scraping-NLP secara operasional.

**c. Peta Kompetensi Industri (ringkas)**
- Distribusi skill berdasarkan sektor industri (Teknologi & TI, Keuangan, Kesehatan, Manufaktur, dst.) dalam bentuk progress bar berperingkat.
- Berfungsi sebagai pintu masuk cepat ke modul Peta Kompetensi lengkap.

**d. Tabel Infrastruktur Agen Scraping (ringkas)**
- Daftar node scraping per wilayah (nama node, status Aktif/Sinkronisasi/Error, uptime %, volume data diproses).
- Link "Lihat Semua Agen" ke modul Agen Scraping.

**e. Aksi Global**
- Tombol **Ekspor Data** (unduh snapshot data/laporan, mis. PDF/Excel untuk kebutuhan akreditasi).
- Tombol **Sinkronisasi** (memicu refresh manual seluruh pipeline data).

### 6.2 User Story
- *Sebagai Admin Institusi*, saya ingin melihat ringkasan skill gap kritis begitu login, agar saya tahu prioritas tindak lanjut tanpa harus menelusuri semua data.
- *Sebagai Super Admin*, saya ingin memantau throughput vs delay pipeline, agar saya bisa mendeteksi gangguan infrastruktur scraping lebih awal.

### 6.3 Kriteria Penerimaan
- Semua kartu metrik menampilkan data real-time (maks. delay 5 menit dari sumber) dan indikator tren dibanding periode sebelumnya.
- Grafik dapat di-hover untuk melihat nilai spesifik per titik waktu.
- Tombol Sinkronisasi memberi feedback status (loading, sukses, gagal) yang jelas.

### 6.4 Data yang Dibutuhkan
- Time-series metrik ingest (throughput, delay).
- Agregat jumlah skill unik & mata kuliah tersinkron per periode.
- Status & metadata tiap agen scraping.
- Agregasi skill per kategori sektor industri.

---

## 7. Modul: Peta Kompetensi (Skill Gap Map)

**Tujuan:** menyediakan visualisasi inti dari value proposition produk — perbandingan supply (kurikulum) vs demand (industri) pada level skill granular.

### 7.1 Fitur

**a. Skill Gap Map / Overlap Map**
- Visualisasi (mis. Venn/diagram overlap atau matrix) yang menunjukkan: skill yang hanya ada di kurikulum, skill yang hanya diminta industri, dan skill yang beririsan (selaras).
- Bisa difilter: "Hanya Kurikulum", "Hanya Industri", "Kurikulum vs Industri" (irisan).

**b. Tabel Kesenjangan Keterampilan Terdeteksi**
- Daftar skill dengan kolom: nama skill, kategori (mis. Backend Dev, DevOps, CI/CD Pipelines, GraphQL API), tingkat urgensi (Kritis/Tinggi/Sedang), status (Permintaan Tinggi—Tidak Diajarkan / Selaras / Keterampilan Selaras).
- Sortir/filter berdasarkan urgensi, kategori, program studi.

**c. Tingkat Kecocokan (Match Rate)**
- Skor persentase kecocokan kurikulum terhadap kebutuhan industri per program studi, ditampilkan sebagai gauge/percentage indicator.

**d. Analisis Konvergensi**
- Tren perubahan match rate dari waktu ke waktu — apakah kesenjangan mengecil atau melebar setelah revisi kurikulum diterapkan.

**e. Pencarian & Filter Lanjut**
- Search bar "Cari keterampilan..." + filter kategori, program studi, rentang waktu data lowongan.

### 7.2 User Story
- *Sebagai Kaprodi*, saya ingin melihat skill mana yang paling diminati industri tapi belum ada di kurikulum saya, agar saya tahu prioritas revisi RPS.
- *Sebagai Dosen*, saya ingin memfilter gap khusus mata kuliah yang saya ampu.

### 7.3 Kriteria Penerimaan
- Setiap skill di tabel gap punya label taksonomi mismatch yang jelas (bukan hanya "gap"/"tidak gap"), minimal 2 kategori: *underskilling* (skill diajarkan tapi levelnya kurang) dan *skill shortage* (skill sama sekali tidak diajarkan tapi sangat dicari).
- Match rate dihitung dari data ≥ N lowongan kerja terbaru (N dikonfigurasi, default mis. 90 hari terakhir) agar representatif.

### 7.4 Data yang Dibutuhkan
- Taksonomi skill terstandardisasi (normalisasi sinonim, mis. "K8s" = "Kubernetes").
- Mapping skill ↔ Learning Outcome/mata kuliah.
- Mapping skill ↔ frekuensi kemunculan di lowongan kerja per periode.
- Skor urgensi (kombinasi: frekuensi permintaan industri, tren pertumbuhan, ketiadaan di kurikulum).

---

## 8. Modul: Analisis AI

**Tujuan:** ruang kerja analitik mendalam tempat AI menjalankan deteksi gap dan menghasilkan rekomendasi yang bisa ditindaklanjuti, termasuk draft silabus otomatis.

### 8.1 Fitur

**a. Panel Analisis Kesenjangan Keterampilan**
- Ringkasan naratif hasil analisis (mis. "Ditemukan 30% kesenjangan pada keterampilan teknis inti").
- Breakdown per kategori skill dengan tingkat urgensi.

**b. Peta Keterampilan Tumpang Tindih**
- Visual overlap sisi kurikulum vs industri (detail, bukan ringkas seperti di Dasbor).

**c. Filter Sumber Data**
- Toggle: Hanya Kurikulum / Hanya Industri / Kurikulum vs Industri — untuk mengisolasi sisi data yang dianalisis.

**d. Generate Silabus Otomatis**
- Tombol "Mulai Generator AI" yang menghasilkan **draft modul/silabus baru** berdasarkan skill gap prioritas tinggi.
- Output: rancangan "Modul Baru" atau "Pembaruan Materi" untuk mata kuliah tertentu, lengkap dengan estimasi topik yang perlu ditambahkan.
- Aksi lanjutan: **Terapkan Draft** (menyimpan sebagai draft resmi ke sistem kurikulum institusi, bukan langsung final).

**e. Riwayat Analisis**
- Log analisis yang pernah dijalankan (kapan, sumber data apa, hasil ringkas) — agar bisa dibandingkan antar periode.

### 8.2 User Story
- *Sebagai Kaprodi*, saya ingin AI merancang draft silabus tambahan berdasarkan gap yang ditemukan, agar saya tidak mulai dari nol saat merevisi RPS.
- *Sebagai Dosen*, saya ingin melihat alasan (evidence) di balik rekomendasi AI, misalnya berapa banyak lowongan yang menyebut skill tersebut, agar saya percaya pada rekomendasinya.

### 8.3 Kriteria Penerimaan
- Setiap rekomendasi AI menyertakan **evidence/justifikasi** (jumlah lowongan pendukung, tren, sumber data periode berapa) — bukan rekomendasi black-box.
- Draft silabus yang dihasilkan berstatus "draft" dan butuh approval manual dosen/kaprodi sebelum dianggap final (human-in-the-loop, sejalan dengan tujuan produk sebagai alat bantu, bukan pengambil keputusan otomatis).
- Proses generate memberi indikator progres (karena melibatkan pemrosesan NLP yang mungkin memakan waktu).

### 8.4 Data yang Dibutuhkan
- Model NLP untuk ekstraksi entitas skill (Named Entity Recognition) dari teks lowongan & dokumen kurikulum — proposal menyebut TF-IDF atau IndoBERT.
- Template struktur silabus/RPS institusi (agar output generator kompatibel dengan format existing).
- Data historis hasil analisis untuk tracking konvergensi/perubahan.

---

## 9. Modul: Agen Scraping

**Tujuan:** transparansi dan kontrol atas infrastruktur pengumpulan data lowongan kerja (web scraping) yang menjadi sumber sisi "demand".

### 9.1 Fitur

**a. Tabel Status Node/Agen**
- Kolom: Wilayah/Node (mis. JKT-Node-01, SUB-Node-02, BDO-Node-03), Status (Aktif/Sinkronisasi/Error), Uptime %, Volume Data Diproses (mis. dalam TB).

**b. Detail per Agen**
- Log aktivitas scraping, sumber portal kerja yang di-crawl, jadwal (mis. mingguan sesuai proposal), riwayat error.

**c. Manajemen Sumber Data**
- Tambah/nonaktifkan sumber portal lowongan kerja.
- Konfigurasi jadwal crawling & rate limiting (untuk menjaga kepatuhan terhadap ToS situs sumber).

**d. Notifikasi Kesehatan Sistem**
- Alert otomatis bila ada node down, gagal sinkron, atau delay pipeline melebihi ambang batas.

### 9.2 User Story
- *Sebagai Super Admin*, saya ingin tahu segera saat sebuah node scraping gagal sinkron, agar data yang masuk ke analisis tetap representatif dan up-to-date.

### 9.3 Kriteria Penerimaan
- Status node ter-update otomatis (real-time atau near real-time), bukan manual refresh.
- Ada mekanisme retry otomatis untuk node yang gagal sebelum dieskalasi jadi alert ke admin.

### 9.4 Data yang Dibutuhkan
- Health-check log per node.
- Konfigurasi sumber & jadwal crawling.
- Volume data & error rate historis per node.

---

## 10. Modul Pendukung: Pengaturan & Bantuan

- **Pengaturan**: profil institusi, manajemen pengguna & role, integrasi (API key untuk sumber data lowongan resmi jika ada), preferensi notifikasi, kebijakan retensi data.
- **Bantuan**: dokumentasi penggunaan, FAQ, kontak support — penting karena target pengguna (dosen/kaprodi) belum tentu punya latar belakang teknis.

---

## 11. Rekomendasi Modul & Fitur Tambahan (Untuk Iterasi Berikutnya)

Ini bagian yang diminta khusus: peluang memperkaya dari desain yang sudah ada di Google Stitch, supaya cakupan produk lebih dari sekadar dashboard analitik.

### 11.1 Modul Manajemen Kurikulum (belum ada di desain saat ini)
Saat ini alur "upload dokumen kurikulum/RPS → diekstrak jadi Learning Outcome" belum punya modul UI sendiri (hanya disebut di proposal, belum divisualkan). Direkomendasikan:
- Upload dokumen kurikulum (PDF/Word) per program studi.
- Preview hasil ekstraksi otomatis (Learning Outcome yang berhasil dideteksi) dengan opsi koreksi manual oleh dosen — penting karena akurasi NLP tidak akan 100%.
- Versioning kurikulum (bandingkan gap sebelum vs sesudah revisi).

### 11.2 Modul Kolaborasi Industri
Proposal menyebut peran industri sebagai mitra kolaborasi, tapi belum ada representasi di UI:
- Ruang bagi mitra industri memberi masukan langsung ke draft silabus (bukan cuma data lowongan pasif).
- Laporan yang bisa dibagikan ke industri untuk showcase kesesuaian kurikulum ("kami sudah menutup gap X berdasarkan masukan Anda").

### 11.3 Modul Laporan & Ekspor untuk Akreditasi
Institusi vokasi rutin butuh laporan untuk kebutuhan akreditasi/audit internal:
- Generate laporan periodik (bulanan/semesteran) berisi tren gap, match rate, tindakan yang sudah diambil.
- Ekspor ke format yang kompatibel dengan kebutuhan borang akreditasi (PDF terstruktur, Excel).

### 11.4 Portal Ringkas untuk Mahasiswa
Saat ini seluruh desain berorientasi admin/institusi. Sesuai tujuan "manfaat bagi mahasiswa", bisa ditambahkan:
- Versi publik/ringkas dashboard: skill apa yang sedang tinggi permintaan di sektor pilihan, tanpa data sensitif institusi.
- Rekomendasi belajar mandiri (link ke sumber belajar) untuk skill yang gap di kurikulum mereka.

### 11.5 Sistem Notifikasi & Digest
- Notifikasi in-app/email mingguan: "5 skill baru terdeteksi sebagai kritis minggu ini".
- Digest otomatis untuk kaprodi tanpa harus login rutin ke dashboard.

### 11.6 Audit Trail & Explainability AI
- Log siapa yang menyetujui/menolak draft silabus AI, kapan, dan alasannya — penting untuk akuntabilitas keputusan kurikulum.
- Panel "Kenapa AI merekomendasikan ini?" yang menampilkan evidence mentah (contoh cuplikan lowongan kerja yang menyebut skill tersebut).

### 11.7 Perbandingan Antar-Program Studi / Benchmarking
- Bandingkan match rate antar program studi dalam satu institusi, atau (opsional, dengan consent) antar institusi — bermanfaat untuk pembuat kebijakan vokasi nasional (mendukung visi LMIS Indonesia Emas 2045 yang disebut proposal).

### 11.8 Manajemen Taksonomi Skill
- UI untuk admin mengelola/mengoreksi taksonomi skill (menggabungkan sinonim, mis. "ReactJS" vs "React.js"), karena akurasi normalisasi istilah sangat menentukan kualitas seluruh analisis.

---

## 12. Alur Pengguna Utama (Key User Flows)

**Flow A — Onboarding Institusi**
1. Admin institusi mendaftar/login → membuat profil program studi.
2. Upload dokumen kurikulum/RPS (Modul Manajemen Kurikulum – rekomendasi baru).
3. Sistem mengekstraksi Learning Outcome → admin/dosen memverifikasi hasil ekstraksi.
4. Sistem otomatis menjalankan pencocokan dengan data industri yang sudah ter-scraping → hasil pertama muncul di Dasbor & Peta Kompetensi.

**Flow B — Investigasi Gap Mingguan (rutin)**
1. Admin/dosen menerima notifikasi digest mingguan.
2. Masuk ke Dasbor → lihat kartu Gap Skill Kritis.
3. Klik ke Peta Kompetensi → filter berdasarkan program studi/kategori.
4. Masuk ke Analisis AI → jalankan Generate Silabus Otomatis untuk skill prioritas tinggi.
5. Review draft → revisi manual → simpan sebagai draft resmi (belum final tanpa approval formal institusi).

**Flow C — Monitoring Infrastruktur (Super Admin)**
1. Login → cek Dasbor untuk laju ingest & delay.
2. Jika ada anomali, masuk ke Agen Scraping → identifikasi node bermasalah.
3. Restart/reconfigure node atau eskalasi ke tim teknis.

---

## 13. Kebutuhan Data & Model Konseptual

Entitas inti yang perlu ada di skema data:

- **Skill** (id, nama, kategori, sinonim/alias, sektor industri terkait)
- **ProgramStudi** (id, nama institusi, jenjang)
- **Kurikulum/MataKuliah** (id, program_studi_id, versi, Learning Outcome, daftar skill terkait, status verifikasi ekstraksi)
- **Lowongan** (id, sumber/portal, tanggal crawl, sektor, daftar skill terdeteksi, lokasi)
- **GapAnalysis** (id, program_studi_id, skill_id, tipe_mismatch [underskilling/skill_shortage/aligned], skor_urgensi, match_rate, periode_data, evidence_count)
- **DraftSilabus** (id, gap_analysis_id, konten_draft, status [draft/direview/diterapkan], approver, timestamp)
- **AgenScraping** (id, wilayah, status, uptime, volume_data, last_sync)
- **User & Role** (institusi, prodi, level akses)

---

## 14. Kebutuhan Non-Fungsional

- **Akurasi ekstraksi NLP**: perlu benchmark internal (mis. precision/recall ekstraksi skill) sebelum rilis, karena seluruh value proposition bergantung pada kualitas ekstraksi entitas.
- **Kesegaran data (freshness)**: data lowongan idealnya diperbarui berkala (proposal menyarankan mingguan) agar tren "real-time" valid.
- **Skalabilitas**: arsitektur harus menangani relasi kompleks antar kurikulum, mata kuliah, dan ribuan data skill (proposal memilih Laravel karena pertimbangan ini).
- **Keamanan & privasi data institusi**: dokumen kurikulum bersifat sensitif — perlu kontrol akses per institusi/prodi, bukan data lintas institusi tercampur tanpa izin.
- **Kepatuhan scraping**: perlu kebijakan rate-limiting dan penghormatan robots.txt/ToS tiap sumber lowongan kerja untuk menghindari risiko hukum/pemblokiran.
- **Aksesibilitas & bahasa**: antarmuka berbahasa Indonesia, ramah untuk pengguna non-teknis (dosen/kaprodi).
- **Human-in-the-loop**: keputusan final revisi kurikulum tetap di tangan manusia — sistem hanya merekomendasikan.

---

## 15. Arsitektur Teknis (Ringkasan dari Proposal)

| Lapisan | Teknologi | Fungsi |
|---|---|---|
| Data Engine | Python (Spacy/NLTK, TF-IDF atau IndoBERT) | Web scraping lowongan kerja + ekstraksi entitas skill (NER) dari teks lowongan & dokumen kurikulum |
| Backend | Laravel | API, manajemen relasi data kompleks (kurikulum ↔ mata kuliah ↔ skill) |
| Frontend | React.js (via Inertia.js) + Tailwind CSS | Dashboard analitik interaktif |

---

## 16. Metrik Keberhasilan (KPI Produk)

- Jumlah program studi yang aktif memakai sistem dan memperbarui kurikulum berbasis rekomendasi.
- Perubahan match rate rata-rata (naik) pada program studi yang sudah menindaklanjuti rekomendasi, dibanding sebelum pakai sistem.
- Jumlah draft silabus yang diterapkan (bukan hanya dibuat) — indikator rekomendasi benar-benar actionable.
- Waktu rata-rata dari "gap terdeteksi" ke "draft revisi dibuat" (menunjukkan efisiensi dibanding proses manual).
- Tingkat kepuasan pengguna (dosen/kaprodi) terhadap relevansi rekomendasi AI (survei UAT).

---

## 17. Roadmap Bertahap

Mengikuti tahapan strategis di proposal, diterjemahkan ke rilis produk:

**Tahap 1 — MVP (Requirements & Data Acquisition)**
- Modul Manajemen Kurikulum (upload + ekstraksi dasar).
- Agen Scraping untuk 1–2 sumber lowongan kerja utama.
- Peta Kompetensi versi dasar (tabel gap + match rate, tanpa taksonomi mismatch lengkap).

**Tahap 2 — Core Analytics**
- Dasbor lengkap dengan metrik real-time.
- Analisis AI dengan taksonomi mismatch penuh (underskilling, skill shortage, aligned).
- Notifikasi dasar.

**Tahap 3 — Generative & Validasi**
- Generate Silabus Otomatis + alur approval draft.
- UAT terbatas dengan pihak kampus untuk memvalidasi kemasukakalan rekomendasi.

**Tahap 4 — Rilis & Ekspansi**
- Deployment publik, update data berkala (mingguan).
- Modul tambahan sesuai prioritas bisnis: Laporan Akreditasi, Portal Mahasiswa, Kolaborasi Industri, Benchmarking antar-prodi.

---

## 18. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Akurasi NLP rendah untuk Bahasa Indonesia teknis/istilah campuran (Indo-Inggris) | Kombinasi model (IndoBERT + kamus istilah manual), verifikasi manual tahap awal |
| Sumber lowongan memblokir/melarang scraping | Diversifikasi sumber, gunakan API resmi bila tersedia, hormati rate limit |
| Institusi enggan mempercayai rekomendasi AI untuk keputusan kurikulum | Sertakan evidence transparan, jadikan draft (bukan otomatis final), libatkan dosen di UAT |
| Data lowongan tidak representatif (bias sektor/wilayah) | Diversifikasi sumber & sektor, tampilkan ukuran sampel (evidence_count) secara eksplisit ke pengguna |
| Skalabilitas basis data seiring bertambah institusi | Desain skema data multi-tenant sejak awal (isolasi per institusi) |

---

## 19. Referensi Sumber

Disarikan dari *Proposal Hackathon KMIPN VIII — "Pengembangan Aplikasi Skill Gap Analyzer Berbasis AI dan Data Mining Untuk Sinkronisasi Kurikulum Vokasi Dengan Kebutuhan Industri"* (Tim "Kami Daftar KMIPN H-3", Politeknik Negeri Jakarta), dikombinasikan dengan eksplorasi desain UI (Dasbor, Peta Kompetensi, Analisis AI, Agen Scraping).
