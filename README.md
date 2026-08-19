# Skill Gap Analyzer

Sistem analisis kesenjangan kompetensi antara kebutuhan industri (lowongan kerja dari loker.id) dengan kurikulum program studi. Dibangun dengan Laravel 12 + React (Inertia) + SQLite, dilengkapi crawler Python di `data-engine/`.

## Fitur Utama

- **Job Browser** (`/jobs`) — daftar lowongan dari loker.id dengan pencarian, filter sektor/lokasi, rentang gaji, dan logo perusahaan.
- **Gap Analysis** — pemetaan skill lowongan terhadap kompetensi program studi, kursus, dan matakuliah.
- **Scraping Agents** — dashboard monitoring node crawler (demo).
- **Data Pipeline** — impor streaming data JSON crawler (`jobs:import`), pengunduh logo (`jobs:fetch-logos`), serta dump/restore data (`data:dump`, `data:restore`).

## Persyaratan

- PHP 8.2+ (direkomendasikan 8.4) dengan ekstensi `pdo_sqlite`, `gd`, `mbstring`.
- Composer, Node.js (20+), npm.
- Python 3.11+ untuk crawler (opsional).

## Instalasi

```bash
git clone <repo-url>
cd skillgapanalyzer
composer install
npm install && npm run build
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Saat diminta akun admin/akun demo, gunakan `php artisan db:seed --class=UserSeeder`.

## Menyiapkan Data Lowongan (Member Tim)

Data lowongan, skills, dan relasinya **tidak disimpan di git** karena ukurannya besar. File tersebut dipaketkan sebagai dump SQL terkompresi yang disimpan di repo:

| File | Isi |
| --- | --- |
| `database/dumps/skillgap-bootstrap.sql.gz` | 8.214 lowongan, 5.228 skills, 17.733 relasi skill–lowongan, 176 alias (≈0,7 MB) |

Untuk mengisinya setelah `php artisan migrate --seed`:

```bash
php artisan data:restore
```

Catatan:

- Perintah ini **idempotent** — aman dijalankan berulang, dan tidak menyentuh data akun, kursus, atau gap analysis.
- Logo perusahaan (≈7090 file, ±235 MB) **tidak ikut** di dump. Tanpa logo, UI memakai inisial perusahaan sebagai fallback. Untuk mendapatkan logo penuh, jalankan:

```bash
php artisan jobs:fetch-logos
```

- `database/datajson/` (hasil crawler mentah) juga tidak masuk git. Crawler di `data-engine/` dapat membuat ulang data tersebut:

```bash
cd data-engine
pip install -r requirements.txt
python scrape_loker.py --phase all     # enumerate → detail → aggregate
```

- Jalankan test untuk memastikan data terpasang dengan benar:

```bash
php artisan test --filter=JobVacancyTest
```

### Memperbarui Data (Admin)

Jika ada data baru dari crawler, perbarui dump agar member lain mendapatkannya:

```bash
php artisan jobs:import                       # dari database/datajson/lowongan_loker_id.json
php artisan jobs:fetch-logos                  # unduh logo baru
php artisan data:dump                         # regen database/dumps/skillgap-bootstrap.sql.gz
git add database/dumps/skillgap-bootstrap.sql.gz
git commit -m "data: refresh job bootstrap from loker.id crawl"
git push
```

## Perintah Artisan

| Perintah | Fungsi |
| --- | --- |
| `php artisan jobs:import` | Impor streaming JSON lowongan (idempotent via slug) |
| `php artisan jobs:fetch-logos` | Unduh logo perusahaan yang belum ada |
| `php artisan data:dump` | Ekspor tabel job-domain ke dump SQL.gz |
| `php artisan data:restore` | Pulihkan data dari dump SQL.gz (idempotent) |

Opsi tambahan: `--limit=N` untuk smoke test, `--file=path`/`--path=path` untuk sumber/tujuan kustom.

## Pengujian

```bash
php artisan test            # 66 test, 249 assertions
cd data-engine && python -m pytest tests/
```

## Lisensi

Proyek ini dibuat untuk keperluan akademik (KMIPN). Logo perusahaan tetap milik masing-masing pemilik merek.
