import React from 'react';

export default function Help() {
  return (
    <div className="p-6 max-w-[1000px] mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-brand">help_outline</span>
          Pusat Bantuan & Dokumentasi
        </h1>
        <p className="text-sm text-text-secondary mt-2">
          Panduan singkat mengenai alur kerja sistem Skill Gap Analyzer dan penjelasan fitur utama.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Apa itu Skill Gap Analyzer */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-text mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand">insights</span>
            Apa itu Skill Gap Analyzer?
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            Skill Gap Analyzer adalah platform analitik cerdas yang membantu institusi pendidikan (seperti Politeknik atau Universitas) mencocokkan kurikulum yang diajarkan dengan permintaan riil di dunia industri. Sistem ini secara otomatis menarik data ribuan lowongan pekerjaan, mengekstrak kata kunci keterampilan teknis, dan membandingkannya dengan silabus atau Rencana Pembelajaran Semester (RPS).
          </p>
        </div>

        {/* Alur Kerja Sistem */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-text mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand">account_tree</span>
            Alur Kerja Sistem (Flow)
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-text text-sm mb-1">Pengumpulan Data (Scraping)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Agen scraping (bot) mengumpulkan data lowongan kerja dari portal seperti LinkedIn, JobStreet, atau TechInAsia secara berkala. Data mentah ini kemudian disimpan untuk diproses.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-text text-sm mb-1">Ekstraksi & Analisis AI (NLP)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Mesin Natural Language Processing (NLP) mengekstrak *skill* atau keahlian spesifik dari deskripsi lowongan tersebut. Sistem juga membaca data silabus dari kampus.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-text text-sm mb-1">Pemetaan Kesenjangan (Gap Mapping)</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sistem membandingkan skill yang ada di industri dengan skill yang diajarkan di kampus. Jika ada skill tinggi peminat tapi belum diajarkan, itu diidentifikasi sebagai *Gap* (Kesenjangan).
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-border">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-text text-sm mb-1">Rekomendasi RPS Otomatis</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  AI Generator kemudian dapat menghasilkan draft rekomendasi Rencana Pembelajaran Semester (RPS) baru untuk menutup *gap* yang ditemukan. Dosen dapat menyetujui atau menyesuaikannya.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ atau Info Tambahan */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-text mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand">info</span>
            Penjelasan Role Pengguna
          </h2>
          <div className="space-y-3 mt-4">
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm text-text mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-brand">shield_person</span>
                Admin Institusi
              </h4>
              <p className="text-xs text-text-secondary">Dapat melihat seluruh dashboard, memantau agen scraping, mengonfigurasi API, dan mengelola pengguna.</p>
            </div>
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm text-text mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-brand">person_add</span>
                Dosen / Kaprodi
              </h4>
              <p className="text-xs text-text-secondary">Fokus pada analisis kesenjangan, melihat tren industri, dan melakukan generate draft silabus/RPS untuk mata kuliah yang diampunya.</p>
            </div>
            <div className="p-3">
              <h4 className="font-semibold text-sm text-text mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-brand">school</span>
                Mahasiswa
              </h4>
              <p className="text-xs text-text-secondary">Melihat peta kecocokan skill pribadinya dengan industri, rekomendasi pekerjaan, serta panduan kursus spesifik (Learning Path) untuk mengejar ketertinggalan skill.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
