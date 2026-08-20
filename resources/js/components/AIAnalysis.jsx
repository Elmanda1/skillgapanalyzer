import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';


const gapSkills = [
  { name: 'Docker & Containerization', category: 'DevOps',        demand: 85, urgency: 'Kritis' },
  { name: 'GraphQL API',               category: 'Backend Dev',   demand: 65, urgency: 'Menengah' },
  { name: 'CI/CD Pipelines',           category: 'DevOps',        demand: 90, urgency: 'Kritis' },
  { name: 'Kubernetes Orchestration',  category: 'DevOps',        demand: 92, urgency: 'Kritis' },
  { name: 'LLM Fine-tuning & Vector DBs', category: 'AI Engineering', demand: 78, urgency: 'Menengah' },
];

const urgencyBadge = (u) =>
  u === 'Kritis' ? 'badge badge-red' : 'badge badge-yellow';

const generatorSteps = [
  { label: 'Menganalisis kesenjangan kurikulum...', icon: 'search' },
  { label: 'Merancang RPS dengan standar KKNI...', icon: 'edit_document' },
  { label: 'Finalisasi & validasi output AI...',   icon: 'check_circle' },
];

const aiCards = [
  {
    id: 'docker',
    tag: 'Modul Baru',
    tagColor: 'badge-blue',
    icon: 'add',
    title: 'Integrasi Docker & Kubernetes',
    body: 'Tambahkan sebagai modul praktikum 4 minggu pada mata kuliah "Cloud Computing" semester 6.',
    impact: '+5%',
  },
  {
    id: 'react',
    tag: 'Pembaruan Materi',
    tagColor: 'badge-green',
    icon: 'update',
    title: 'Fokus React.js & Next.js',
    body: 'Geser bobot materi dari Vanilla JS ke framework modern pada mata kuliah "Pemrograman Web Lanjut".',
    impact: '+8%',
  },
];

export default function AIAnalysis() {
  const toast = useToast();
  const [activeProdi, setActiveProdi]       = useState('Teknik Informatika');
  const [searchQuery, setSearchQuery]       = useState('');
  const [generatorState, setGeneratorState] = useState('idle');
  const [generatorStep, setGeneratorStep]   = useState(0);
  const [appliedDrafts, setAppliedDrafts]   = useState({});

  const filtered = gapSkills.filter(sk =>
    sk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sk.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startGenerator = () => {
    toast.info('Memulai AI...', 'Menganalisis data kesenjangan kurikulum untuk prodi ini.');
    setGeneratorState('generating');
    setGeneratorStep(1);
    setTimeout(() => { setGeneratorStep(2);
      setTimeout(() => { setGeneratorStep(3);
        setTimeout(() => {
          setGeneratorState('finished');
          toast.success('Selesai', 'RPS berhasil digenerate berdasarkan rekomendasi AI.');
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleApply = (id, title) => {
    setAppliedDrafts(p => ({ ...p, [id]: true }));
    toast.success('Draft Diterapkan', `RPS "${title}" berhasil diterapkan sebagai draf resmi.`);
  };

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div className="max-w-xl">
          <h1 className="font-display text-2xl font-bold text-text">Analisis Kesenjangan Keterampilan AI</h1>
          <p className="text-sm text-text-secondary mt-1">
            Perbandingan mendalam antara kurikulum institusi saat ini dan permintaan keterampilan industri terkini, dianalisis secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="relative">
            <select
              value={activeProdi}
              onChange={e => setActiveProdi(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand cursor-pointer text-text"
            >
              <option>Program Studi: Teknik Informatika</option>
              <option>Program Studi: Sistem Informasi</option>
              <option>Program Studi: Ilmu Komputer</option>
            </select>
            <Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-[16px] pointer-events-none" name="expand_more" />
          </div>
          <button className="btn-outline flex items-center gap-2">
            <Icon className="text-[16px]" name="filter_list" />
            Filter Lanjut
          </button>
        </div>
      </div>

      {/* ── Data Source Context ── */}
      <div className="card p-5 mb-5 bg-gradient-to-r from-brand to-[#043326] text-white">
        <h2 className="font-display text-base font-semibold flex items-center gap-2 mb-3">
          <Icon className="text-[18px]" name="info" />
          Konteks Analisis Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-green-200 mb-1">Data Kurikulum (Input)</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Sistem telah meng-ekstrak <span className="font-bold text-white">75 skill teknis</span> dari silabus dan Rencana Pembelajaran Semester (RPS) Program Studi Teknik Informatika, khususnya pada konsentrasi rekayasa perangkat lunak dan infrastruktur IT.
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-blue-200 mb-1">Data Industri (Target)</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Agen scraping mengumpulkan <span className="font-bold text-white">92 skill prioritas tinggi</span> dari 4,500+ lowongan pekerjaan (Software Engineer, DevOps, Backend) di wilayah Jabodetabek selama 3 bulan terakhir.
            </p>
          </div>
        </div>
      </div>

      {/* ── Match Rate + Venn ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">

        {/* Match rate gauge */}
        <div className="card p-5 lg:col-span-4 flex flex-col">
          <h2 className="font-display text-base font-semibold text-text">Tingkat Kecocokan</h2>
          <p className="text-xs text-text-secondary mb-4">KURIKULUM VS INDUSTRI</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#064e3b" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40 * 0.7} ${2 * Math.PI * 40}`}
                />
              </svg>
              <div className="text-center z-10">
                <p className="font-display text-3xl font-bold text-text">70%</p>
              </div>
            </div>
            <span className="badge badge-green mt-4 text-sm px-4 py-1.5">Status: Cukup Baik</span>
            <p className="text-xs text-text-secondary mt-3 text-center">
              Ditemukan 30% kesenjangan pada keterampilan teknis inti.
            </p>
          </div>
        </div>

        {/* Venn Overlap */}
        <div className="card p-5 lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-text">Peta Keterampilan Tumpang Tindih</h2>
              <p className="text-xs text-text-secondary mt-0.5">AREA KONVERGENSI</p>
            </div>
            <button className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors">
              <Icon className="text-[16px]" name="fullscreen" />
            </button>
          </div>
          {/* SVG Venn Diagram */}
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <svg width="340" height="200" viewBox="0 0 340 200">
              <ellipse cx="140" cy="100" rx="110" ry="80" fill="#dbeafe" fillOpacity="0.7"/>
              <ellipse cx="210" cy="100" rx="110" ry="80" fill="#d1fae5" fillOpacity="0.7"/>
              <text x="85"  y="105" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1e40af">Kurikulum</text>
              <text x="85"  y="122" textAnchor="middle" fontSize="12" fill="#1e40af">(75)</text>
              <text x="267" y="105" textAnchor="middle" fontSize="13" fontWeight="600" fill="#065f46">Industri</text>
              <text x="267" y="122" textAnchor="middle" fontSize="12" fill="#065f46">(92)</text>
              <text x="175" y="95" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">54</text>
              <rect x="122" y="108" width="107" height="24" rx="12" fill="white" fillOpacity="0.85"/>
              <text x="175" y="124" textAnchor="middle" fontSize="10" fontWeight="600" fill="#064e3b">Keterampilan Selaras</text>
            </svg>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            {[
              { color: '#dbeafe', label: 'Hanya Kurikulum' },
              { color: '#d1fae5', label: 'Hanya Industri' },
              { color: '#a7f3d0', label: 'Selaras' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-text-secondary">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: l.color, border: '1px solid #e5e7eb' }}/>
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gap Skills Table ── */}
      <div className="card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-text">Kesenjangan Keterampilan Terdeteksi</h2>
            <p className="text-xs text-text-secondary mt-0.5">DIMINTA TINGGI, TIDAK DIAJARKAN</p>
          </div>
          <div className="relative w-56">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari keterampilan..."
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand transition-all"
            />
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              {['KETERAMPILAN','KATEGORI','PERMINTAAN INDUSTRI','URGENSI','AKSI'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(sk => (
              <tr key={sk.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-text">{sk.name}</td>
                <td className="px-5 py-3.5 text-text-secondary">{sk.category}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-24 progress-track">
                      <div className="progress-fill" style={{ width: `${sk.demand}%` }}/>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {sk.demand >= 80 ? 'Tinggi' : 'Sedang'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={urgencyBadge(sk.urgency)}>{sk.urgency}</span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-sm font-semibold text-brand hover:underline flex items-center gap-0.5">
                    Detail <Icon className="text-[14px]" name="chevron_right" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── AI Recommendation Cards ── */}
      <div>
        <h2 className="font-display text-base font-semibold text-text mb-4 flex items-center gap-2">
          <Icon className="text-[18px] text-brand" name="auto_awesome" />
          Rekomendasi Pembaruan Kurikulum AI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiCards.map(card => (
            <div key={card.id} className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <span className={`badge ${card.tagColor}`}>{card.tag}</span>
                <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <Icon className="text-brand text-[16px]" name={card.icon} />
                </div>
              </div>
              <h3 className="font-display text-sm font-bold text-text mb-2">{card.title}</h3>
              <p className="text-xs text-text-secondary mb-4">{card.body}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  Dampak Kecocokan: <span className="text-brand font-bold">{card.impact}</span>
                </span>
                <button
                  onClick={() => handleApply(card.id, card.title)}
                  disabled={appliedDrafts[card.id]}
                  className={`text-xs font-semibold ${appliedDrafts[card.id] ? 'text-text-muted cursor-default' : 'text-brand hover:underline cursor-pointer'}`}
                >
                  {appliedDrafts[card.id] ? '✓ Diterapkan' : 'Terapkan Draft'}
                </button>
              </div>
            </div>
          ))}

          {/* AI Generator Card */}
          <div className="card p-5 bg-brand text-white border-0">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display text-sm font-bold leading-snug">Generate Silabus Otomatis</h3>
              <Icon className="text-white/60 text-[20px]" name="auto_awesome" />
            </div>
            <p className="text-xs text-white/80 mb-4">
              Biarkan AI merancang draf Rencana Pembelajaran Semester (RPS) lengkap berdasarkan kesenjangan yang ditemukan.
            </p>

            {generatorState === 'idle' && (
              <button
                onClick={startGenerator}
                className="w-full py-2 rounded-lg bg-white text-brand text-sm font-semibold hover:bg-brand-light transition-colors flex items-center justify-center gap-2"
              >
                <Icon className="text-[16px]" name="auto_awesome" />
                Mulai Generator AI
              </button>
            )}

            {generatorState === 'generating' && (
              <div className="space-y-2">
                {generatorSteps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs transition-all ${i < generatorStep ? 'opacity-100' : 'opacity-30'}`}>
                    <Icon className={`text-[14px] ${i < generatorStep ? 'text-white' : 'text-white/40'}`} name={i + 1 < generatorStep ? 'check_circle' : i + 1 === generatorStep ? 'hourglass_top' : 'radio_button_unchecked'} />
                    <span className="text-white/90">{step.label}</span>
                  </div>
                ))}
              </div>
            )}

            {generatorState === 'finished' && (
              <div className="text-center">
                <Icon className="text-white text-3xl" name="check_circle" />
                <p className="text-xs text-white/90 mt-1 font-semibold">RPS berhasil digenerate!</p>
                <button
                  onClick={() => setGeneratorState('idle')}
                  className="mt-2 text-xs text-white/70 hover:text-white underline"
                >
                  Generate ulang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
