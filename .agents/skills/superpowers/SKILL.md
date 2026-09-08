---
name: superpowers
description: Rigorous software engineering superpowers covering TDD, systematic error triage, root-cause analysis (RCA), and continuous self-verification before declaring tasks complete.
---

# Superpowers Skill — Engineering Excellence & Rigor

Terinspirasi dari metodologi *software craftsmanship* komprehensif, skill ini mendefinisikan standar disiplin eksekusi kode tingkat tinggi.

---

## 1. Test-Driven & Verification-First Mindset

*   **Done Means Verified:** Suatu fitur atau perbaikan belum selesai sampai berhasil dibuktikan melalui verifikasi otomatis (tes unit/build) atau observasi fungsional langsung.
*   **Perceive Before Act:** Jangan pernah menyentuh atau memodifikasi kode sebelum memahami struktur dependensi, alur eksekusi (*data flow*), dan potensi efek samping.
*   **Single-Source-of-Truth:** Hindari duplikasi logika bisnis atau styling di banyak tempat. Konsolidasikan konstanta, tipe data, dan aturan desain ke modul terpusat.

---

## 2. Root Cause Analysis (RCA) Protocol

Ketika terjadi kegagalan (misalnya build error, crash runtime, regresi UI):
1.  **Stop Quick Hacks:** Jangan melakukan *trial-and-error* membabi-buta atau menambah *workaround* sementara yang mengaburkan masalah inti.
2.  **Trace Execution:** Telusuri rantai pemanggilan dari input hingga titik kegagalan terjadi.
3.  **Identify Invariant Violation:** Temukan asumsi yang dilanggar (misalnya struktur payload API yang berubah, mismatch dependensi React 19, atau selector CSS yang tumpang tindih).
4.  **Fix at the Root:** Terapkan perbaikan permanen pada level arsitektur atau validasi yang tepat, lalu verifikasi kembali seluruh alur kerja.

---

## 3. Disiplin Perubahan Atomik

*   Pecah tugas besar menjadi langkah-langkah independen yang dapat diverifikasi satu per satu.
*   Setiap langkah harus meninggalkan sistem dalam keadaan bekerja (*working and passing state*).
