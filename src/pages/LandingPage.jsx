import React, { useEffect, useRef, useState } from 'react';

// ─── Animated counter hook ─────────────────────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3); // ease-out cubic
      setValue(Math.floor(eased * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return [value, ref];
}

// ─── Mini Dashboard Mockup ─────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative hidden lg:block">
      {/* Main card */}
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        style={{ transform: 'perspective(1200px) rotateY(-10deg) rotateX(4deg)', transformStyle: 'preserve-3d' }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-gray-400 border border-gray-200">
            app.skillgapanalyzer.id
          </div>
        </div>
        {/* App UI */}
        <div className="flex" style={{ height: 280 }}>
          {/* Sidebar */}
          <div className="w-24 bg-white border-r border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-5 h-5 rounded-md bg-brand flex-shrink-0" />
              <div className="space-y-1">
                <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
                <div className="w-8 h-1.5 bg-gray-200 rounded-full" />
              </div>
            </div>
            {[true, false, false, false, false].map((active, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 ${active ? 'bg-green-50' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded ${active ? 'bg-brand' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-1.5 rounded-full ${active ? 'bg-brand/30' : 'bg-gray-100'}`} />
                {active && <div className="absolute right-0 w-0.5 h-4 bg-brand rounded-l-full" />}
              </div>
            ))}
          </div>
          {/* Main content */}
          <div className="flex-1 bg-gray-50 p-4">
            {/* Page header */}
            <div className="h-4 w-44 bg-gray-300 rounded-full mb-1" />
            <div className="h-2.5 w-64 bg-gray-200 rounded-full mb-4" />
            {/* Metric cards */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { c: 'bg-cyan-100', v: '14.2K' },
                { c: 'bg-green-100', v: '3,492' },
                { c: 'bg-blue-100', v: '1.2M' },
                { c: 'bg-red-100', v: '42' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm">
                  <div className={`w-5 h-5 rounded-md ${m.c} mb-2`} />
                  <div className="text-[10px] font-bold text-gray-700">{m.v}</div>
                  <div className="h-1.5 w-8 bg-gray-100 rounded-full mt-1" />
                </div>
              ))}
            </div>
            {/* Chart */}
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="h-2 w-28 bg-gray-200 rounded-full mb-3" />
              <div className="flex items-end gap-1 h-16">
                {[35, 52, 45, 78, 62, 90, 72, 85, 58, 76, 68, 82].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i === 5 || i === 7 ? '#064e3b' : '#d1fae5',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating notification card */}
      <div className="absolute -bottom-5 -left-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 text-[16px]">check_circle</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">Analisis selesai</p>
          <p className="text-[10px] text-gray-400">Gap terdeteksi: 42 skill kritis</p>
        </div>
      </div>
      {/* Floating stat card */}
      <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3">
        <p className="text-[10px] font-semibold text-gray-400 mb-0.5">Match Rate</p>
        <p className="font-display text-2xl font-bold text-brand">70%</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-green-500 text-[12px]">trending_up</span>
          <span className="text-[10px] text-green-600 font-semibold">+12.5%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat counter card ─────────────────────────────────────────────────────
function StatCard({ target, suffix = '', prefix = '', label, icon }) {
  const [count, ref] = useCountUp(target);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl font-extrabold text-white mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <p className="text-green-200 text-sm font-medium">{label}</p>
    </div>
  );
}

// ─── Feature card ──────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div className={`card p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up ${delay}`}>
      <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-brand text-[22px]">{icon}</span>
      </div>
      <h3 className="font-display text-base font-bold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Role card ─────────────────────────────────────────────────────────────
function RoleCard({ icon, color, role, label, points, delay }) {
  return (
    <div className={`card p-6 border-t-4 ${color} animate-fade-in-up ${delay}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[28px] text-text-secondary">{icon}</span>
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{role}</p>
          <h3 className="font-display text-base font-bold text-text">{label}</h3>
        </div>
      </div>
      <ul className="space-y-2.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <span className="material-symbols-outlined text-brand text-[16px] mt-0.5 flex-shrink-0">check_circle</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main LandingPage ──────────────────────────────────────────────────────
export default function LandingPage({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Sticky Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur border-b border-border shadow-sm' : 'bg-transparent'
        }`}>
        <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">insights</span>
            </div>
            <span className="font-display font-bold text-text">Skill Gap Analyzer</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            {['Fitur', 'Modul', 'Untuk Siapa', 'Tentang'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-text transition-colors">{l}</a>
            ))}
          </div>
          <button
            onClick={onLogin}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
          >
            Masuk ke Sistem
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-white via-gray-50 to-green-50/30">
        <div className="max-w-6xl mx-auto flex items-center gap-16">
          <div className="flex-1 animate-fade-in-up">
            <h1 className="font-display text-5xl xl:text-6xl font-extrabold text-text leading-[1.1] mb-5">
              Kurikulum Vokasi<br />
              yang Selalu{' '}
              <span className="text-brand relative">
                Relevan
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6">
                  <path d="M0 5 Q100 0 200 5" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span><br />
              dengan Industri
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-lg mb-8">
              Platform analitik berbasis AI yang membandingkan Learning Outcome kurikulum vokasi secara otomatis dengan ribuan lowongan kerja — dan menghasilkan rekomendasi konkret untuk revisi.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onLogin} className="btn-primary px-7 py-3 text-base flex items-center gap-2">
                Mulai Analisis Gratis
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button
                onClick={() => document.getElementById('modul')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline px-7 py-3 text-base flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                Lihat Modul
              </button>
            </div>
            {/* Mini trust badges */}
            <div className="flex items-center gap-4 mt-8 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-green-500">check</span>
                Gratis untuk kampus vokasi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-green-500">check</span>
                Setup dalam 5 menit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-green-500">check</span>
                Tanpa kartu kredit
              </span>
            </div>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* ── Partners strip ── */}
      <section className="border-y border-border py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-text-muted text-center uppercase tracking-widest mb-6">
            Dipercaya oleh institusi vokasi terkemuka
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 items-center">
            {['Politeknik Negeri Jakarta', 'POLBAN', 'PENS', 'Poltek Semarang', 'Poltek Malang', 'PNB Bali'].map(name => (
              <div key={name} className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors">
                <div className="w-6 h-6 rounded bg-brand-light flex items-center justify-center">
                  <span className="material-symbols-outlined text-brand text-[12px]">school</span>
                </div>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Section ── */}
      <section className="py-20 px-6 bg-white" id="fitur">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-red mb-3 inline-flex">Masalah yang Kami Selesaikan</span>
            <h2 className="font-display text-3xl font-bold text-text">
              Skill Mismatch adalah Masalah Struktural
            </h2>
            <p className="text-text-secondary mt-3 max-w-2xl mx-auto">
              Lulusan vokasi sering tidak siap kerja bukan karena malas belajar — tapi karena kurikulum tidak update dengan kebutuhan industri.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'trending_up', color: 'text-red-500', bg: 'bg-red-50', stat: '+14.6%', title: 'Pengangguran Lulusan Meningkat', desc: 'Pengangguran lulusan sarjana/diploma naik 14.6% dari Feb 2024 ke Feb 2025.' },
              { icon: 'people_outline', color: 'text-amber-500', bg: 'bg-amber-50', stat: '9 Juta', title: 'Kekurangan Tenaga Digital', desc: 'Indonesia diproyeksikan kekurangan 9 juta pekerja digital pada 2030 akibat gap skill.' },
              { icon: 'sync_problem', color: 'text-blue-500', bg: 'bg-blue-50', stat: '44%', title: 'Kompetensi Inti Akan Berubah', desc: '44% kompetensi inti tenaga kerja global diperkirakan berubah pada 2027 karena AI & otomasi.' },
            ].map(p => (
              <div key={p.title} className="card p-6">
                <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-4`}>
                  <span className={`material-symbols-outlined text-[24px] ${p.color}`}>{p.icon}</span>
                </div>
                <div className={`font-display text-2xl font-extrabold ${p.color} mb-1`}>{p.stat}</div>
                <h3 className="font-display text-sm font-bold text-text mb-2">{p.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-brand">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-green-200 text-sm font-semibold uppercase tracking-widest mb-10">
            Platform Dalam Angka
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <StatCard target={14208} suffix="" label="Skill Dipetakan" />
            <StatCard target={3492} suffix="" label="Mata Kuliah Tersinkron" />
            <StatCard target={1248} suffix="" label="Kluster Kompetensi" />
            <StatCard target={42} suffix="" label="Institusi Aktif" />
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section className="py-20 px-6 bg-page-bg" id="modul">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-green mb-3 inline-flex">4 Modul Inti</span>
            <h2 className="font-display text-3xl font-bold text-text">Fitur yang Dirancang untuk Aksi</h2>
            <p className="text-text-secondary mt-3 max-w-xl mx-auto">
              Setiap modul dirancang untuk menghasilkan output yang bisa langsung ditindaklanjuti oleh institusi vokasi.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="Modul">
            <FeatureCard icon="grid_view" delay="delay-100" title="Dasbor Analitik Real-Time" desc="Pantau KPI kesehatan kurikulum, tren ekstraksi skill, dan status infrastruktur scraping dalam satu halaman." />
            <FeatureCard icon="book_2" delay="delay-200" title="Peta Kluster Kompetensi" desc="Visualisasikan gap secara interaktif. Lihat distribusi skill per kluster industri dan identifikasi area yang paling tertinggal." />
            <FeatureCard icon="auto_awesome" delay="delay-300" title="Analisis AI & Generator Silabus" desc="Mesin analisis kesenjangan berbasis NLP yang menghasilkan rekomendasi konkret lengkap dengan draft RPS otomatis." />
            <FeatureCard icon="dns" delay="delay-400" title="Manajemen Agen Scraping" desc="Kelola node pengumpul data lowongan kerja dari portal nasional dan internasional secara terdistribusi." />
          </div>
        </div>
      </section>

      {/* ── For Each Role ── */}
      <section className="py-20 px-6 bg-white" id="untuk-siapa">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-blue mb-3 inline-flex">Untuk Semua Pemangku Kepentingan</span>
            <h2 className="font-display text-3xl font-bold text-text">Satu Platform, Tiga Perspektif</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <RoleCard
              delay="delay-100"
              icon="school" color="border-brand" role="Admin Institusi / Kaprodi"
              label="Pimpinan Kampus"
              points={[
                'Dashboard gap kurikulum vs industri secara real-time',
                'Generator silabus RPS otomatis berbasis AI',
                'Ekspor laporan analitik untuk akreditasi',
                'Manajemen agen scraping & sumber data',
              ]}
            />
            <RoleCard
              delay="delay-200"
              icon="person_book" color="border-blue-500" role="Dosen / Koordinator MK"
              label="Pengajar"
              points={[
                'Gap score per mata kuliah yang diampu',
                'Usulan materi & topik baru dari AI',
                'Perbandingan silabus vs tren industri',
                'Dashboard skill yang perlu diperkuat',
              ]}
            />
            <RoleCard
              delay="delay-300"
              icon="menu_book" color="border-violet-500" role="Mahasiswa / Calon Lulusan"
              label="Mahasiswa"
              points={[
                'Profil skill pribadi vs kebutuhan industri',
                'Rekomendasi lowongan pekerjaan yang cocok',
                'Rencana belajar AI yang dipersonalisasi',
                'Gap skill kritis sebelum kelulusan',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 bg-page-bg" id="tentang">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-gray mb-3 inline-flex">Cara Kerja</span>
            <h2 className="font-display text-3xl font-bold text-text">Dari Data Mentah ke Rekomendasi Konkret</h2>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border hidden md:block" />
            <div className="space-y-8">
              {[
                { step: '01', icon: 'hub', title: 'Ekstraksi Data Lowongan', desc: 'Agen scraping mengumpulkan ribuan lowongan kerja dari LinkedIn, JobStreet, Indeed, dan portal nasional secara otomatis menggunakan NLP.' },
                { step: '02', icon: 'compare', title: 'Analisis Kesenjangan AI', desc: 'Model AI membandingkan Learning Outcome kurikulum vokasi dengan skill yang paling banyak diminta industri, mengklasifikasikan jenis mismatch.' },
                { step: '03', icon: 'edit_document', title: 'Rekomendasi & Draft RPS', desc: 'Sistem menghasilkan rekomendasi konkret: skill/topik yang perlu ditambah, dan secara opsional membuat draft Rencana Pembelajaran Semester.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center flex-shrink-0 text-white font-bold text-sm z-10">
                    {item.step}
                  </div>
                  <div className="card flex-1 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-brand text-[20px]">{item.icon}</span>
                      <h3 className="font-display text-base font-bold text-text">{item.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 bg-brand">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-extrabold text-white mb-4">
            Mulai Analisis Kurikulum Anda Hari Ini
          </h2>
          <p className="text-green-200 mb-8 text-base">
            Bergabunglah dengan 42+ institusi vokasi yang sudah menggunakan Skill Gap Analyzer untuk membuat keputusan kurikulum berbasis data.
          </p>
          <button
            onClick={onLogin}
            className="bg-white text-brand font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors text-base inline-flex items-center gap-2 shadow-lg"
          >
            Masuk & Coba Sekarang — Gratis
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <p className="text-green-300 text-xs mt-4">Demo tersedia · Tanpa instalasi · Langsung pakai</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[16px]">insights</span>
                </div>
                <span className="font-display font-bold text-white text-sm">Skill Gap Analyzer</span>
              </div>
              <p className="text-xs leading-relaxed">Platform analitik kurikulum vokasi berbasis AI. Proyek KMIPN VIII 2025.</p>
            </div>
            {[
              { title: 'Produk', links: ['Fitur', 'Modul', 'Harga', 'Changelog'] },
              { title: 'Sumber Daya', links: ['Dokumentasi', 'API', 'Panduan', 'Studi Kasus'] },
              { title: 'Perusahaan', links: ['Tentang Kami', 'Blog', 'Kontak', 'Kebijakan Privasi'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white text-sm font-semibold mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs">© 2025 Skill Gap Analyzer. Semua hak dilindungi.</p>
            <div className="flex items-center gap-4 text-xs">
              <span>Versi 0.1 — Demo</span>
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Sistem Aktif
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
