---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, palette rules, and making choices that do not read as templated defaults.
---

# Frontend Design Skill — SkillGapAnalyzer Edition

Pendekatan ini bertindak sebagai **Design Lead** studio desain yang memberikan identitas visual khas, berkarakter, berkelas, dan bebas dari klise AI (*AI-generated tells*).

---

## 1. Aturan Warna & Sistem Desain Proyek (SkillGapAnalyzer)

Warna utama proyek ini adalah **Emerald / Forest Green** yang merepresentasikan institusi pendidikan vokasi dan industri modern yang presisi:

### Core Palette (Tailwind v4 Token)
*   **Primary Brand (`--color-brand`):** `#064e3b` (Deep Forest Emerald)
*   **Primary Hover (`--color-brand-hover`):** `#065f46`
*   **Brand Light (`--color-brand-light`):** `#ecfdf5` (Mint Soft)
*   **Brand Border (`--color-brand-border`):** `#a7f3d0`
*   **Brand Muted (`--color-brand-muted`):** `#d1fae5`

### Neutral & Surfaces
*   **Page Background:** `#f9fafb` (Cool Off-White)
*   **Card / Surface:** `#ffffff` (Solid White / Translucent Glass `rgba(255, 255, 255, 0.85)`)
*   **Deep Dark Surface:** `#0f172a` (Slate 900 untuk elemen hero kontras tinggi)
*   **Text Primary:** `#111827` (Gray 900)
*   **Text Secondary:** `#4b5563` (Gray 600)
*   **Text Muted:** `#9ca3af` (Gray 400)
*   **Border:** `#e5e7eb` (Gray 200)

### Aturan Perbaikan Gradient (Gradient Formula Guidelines)
Hindari gradient pudar atau flat linier 2-warna yang tampak generik (seperti `from-white to-green-50`). Gunakan formula berikut:

1.  **Ambient Radial Mesh (Latar Belakang Hidup):**
    Gunakan `radial-gradient` dengan aksen emerald sangat halus (opacity 3% - 8%) yang dipadukan dengan aksen teal atau slate untuk menciptakan kedalaman spasial tanpa mengganggu keterbacaan teks:
    ```css
    background: radial-gradient(circle at 20% 20%, rgba(6, 78, 59, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(13, 148, 136, 0.04) 0%, transparent 50%),
                #f9fafb;
    ```
2.  **Hero & CTA Gradient (Vibrant & Deep):**
    Kombinasikan emerald pekat dengan teal dan mint highlights:
    ```css
    background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #0d9488 100%);
    box-shadow: 0 10px 25px -5px rgba(6, 78, 59, 0.3), 0 8px 10px -6px rgba(6, 78, 59, 0.2);
    ```
3.  **Glassmorphism Surface (Glass Cards):**
    ```css
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(229, 231, 235, 0.8);
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
    ```

---

## 2. Prinsip Tipografi & Hirarki

*   **Display Font:** `Outfit`, sans-serif untuk judul besar, kartu metrik, dan headline hero. Karakter geometris namun ramah.
*   **Body Font:** `Inter`, sans-serif untuk badan teks, tabel data, dan label fungsional.
*   **Line Length:** Batasi panjang baris maksimal 75–80 karakter untuk kenyamanan membaca.
*   **Anti-AI Tells:**
    *   HINDARI memberi warna/italic hanya pada satu kata dalam judul jika tidak benar-benar fungsional.
    *   HINDARI label all-caps berlebihan di atas setiap heading.
    *   HINDARI penomoran "01, 02, 03" kecuali pada alur proses yang berurutan (*sequential workflow*).

---

## 3. Dinamika & Animasi (Motion Design)

*   **Purpose-Driven Motion:** Animasi hanya dihadirkan untuk merespons aksi pengguna (hover, expand, filter, switch tab) atau memberikan orientasi posisi (*scroll progress, live dashboard counter*).
*   **Butter-Smooth Easing:** Gunakan `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out cubic) untuk transisi yang terasa responsif dan alami.
*   **Zero Jank:** Prioritaskan animasi berbasis `transform` dan `opacity` yang diakselerasi GPU.
