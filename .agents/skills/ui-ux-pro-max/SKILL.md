---
name: ui-ux-pro-max
description: Pro-level UI/UX guidelines covering ergonomic layouts, micro-interactions, state management (loading, empty, error), data visualization standards, and WCAG accessibility.
---

# UI/UX Pro Max Skill

Panduan standar desain interaksi dan pengalaman pengguna tingkat lanjut untuk aplikasi analitik data, dasbor pendidikan, dan antarmuka web modern.

---

## 1. Ergonomi Antarmuka & Visual Hierarchy

*   **F-Pattern & Z-Pattern Scanning:** Letakkan KPI metrik kunci dan filter utama di area kiri atas. Data visualization harus dapat dipindai (*scannable*) dalam waktu < 3 detik.
*   **Information Chunking:** Jangan menumpuk seluruh data dalam satu layer. Gunakan kartu terstruktur (*bento cards*), tab segmentasi (*segmented controls*), dan laci detail (*drawer/modal*).
*   **Touch & Click Targets:** Target klik interaktif minimal 40×40px dengan jarak antar elemen yang cukup guna mencegah *misclick*.

---

## 2. State-Driven UX (Status UI Lengkap)

Setiap komponen yang mengambil atau memproses data WAJIB memiliki status visual yang terdefinisi:
1.  **Ideal State:** Tampilan data lengkap dengan kontras dan tata letak yang proporsional.
2.  **Loading / Skeleton State:** Skeleton pulse yang menyerupai bentuk konten aslinya (bukan sekadar spinner statis).
3.  **Empty State:** Ilustrasi/ikon minimalis + penjelasan ramah + tombol *Call to Action* langsung untuk mulai mengisi data.
4.  **Error State:** Penjelasan masalah dalam bahasa pengguna (bukan pesan *system stack trace* teknis) disertai aksi perbaikan / tombol coba lagi.

---

## 3. Dashboard Data Ergonomics

*   **Grafik dengan Konteks:** Setiap angka atau persentase (misal: *Match Rate 78%*) harus disertai konteks: perbandingan tren (+5% dari bulan lalu), target pemenuhan, atau status *Urgent/Normal*.
*   **Interactive Tooltips:** Saat pengguna mengarahkan kursor pada grafik batang/radar, tampilkan tooltip instan yang informatif dengan detail breakdown.
*   **Progressive Disclosure:** Tampilkan informasi inti terlebih dahulu, berikan akses interaktif (*expandable, drilldown*) untuk pengguna yang ingin melihat rincian kalkulasi.

---

## 4. Aksesibilitas & Kontras (WCAG 2.1 AA)

*   Rasio kontras teks utama terhadap background minimal **4.5:1** (dan 3:1 untuk teks besar).
*   Gunakan indikator visual selain warna untuk menandai status (misalnya ikon + teks label, bukan hanya warna hijau/merah).
*   Semua aksi penting harus dapat diakses melalui navigasi keyboard dengan `focus-visible` ring yang jelas.
