import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';


const CLUSTER_DATA = [
  { label: 'Cloud & DevOps',       value: 320, color: '#064e3b' },
  { label: 'AI & Data Science',    value: 275, color: '#059669' },
  { label: 'Frontend Dev',         value: 248, color: '#34d399' },
  { label: 'Cybersecurity',        value: 220, color: '#0d9488' },
  { label: 'Backend Dev',          value: 185, color: '#6ee7b7' },
];
const TOTAL_SKILLS = CLUSTER_DATA.reduce((s, d) => s + d.value, 0);

const trendingSkills = [
  { name: 'Kubernetes',          category: 'Cloud & DevOps',          pct: 24 },
  { name: 'LLM Fine-tuning',     category: 'AI Engineering',           pct: 24 },
  { name: 'Zero Trust Arch.',    category: 'Cybersecurity',            pct: 24 },
  { name: 'Snowflake',           category: 'Data Engineering',         pct: 24 },
];

const allSkills = [
  { name: 'Docker',                  cluster: 'Cloud & DevOps',          demand: 85, demandText: 'Sangat Tinggi', status: 'Mature' },
  { name: 'Kubernetes',              cluster: 'Cloud & DevOps',          demand: 92, demandText: 'Sangat Tinggi', status: 'Growing' },
  { name: 'AWS Cloud',               cluster: 'Cloud & DevOps',          demand: 78, demandText: 'Tinggi',        status: 'Mature' },
  { name: 'CI/CD Pipeline',          cluster: 'Cloud & DevOps',          demand: 88, demandText: 'Sangat Tinggi', status: 'Growing' },
  { name: 'LLM Fine-tuning',         cluster: 'AI & Data Science',       demand: 90, demandText: 'Sangat Tinggi', status: 'Growing' },
  { name: 'PyTorch / TensorFlow',    cluster: 'AI & Data Science',       demand: 82, demandText: 'Sangat Tinggi', status: 'Mature' },
  { name: 'Snowflake',               cluster: 'AI & Data Science',       demand: 74, demandText: 'Tinggi',        status: 'Growing' },
  { name: 'Zero Trust Architecture', cluster: 'Cybersecurity',           demand: 89, demandText: 'Sangat Tinggi', status: 'Growing' },
  { name: 'React.js / Next.js',      cluster: 'Frontend Development',    demand: 94, demandText: 'Sangat Tinggi', status: 'Mature' },
  { name: 'GraphQL APIs',            cluster: 'Backend Development',     demand: 70, demandText: 'Tinggi',        status: 'Growing' },
];

const clusters = ['Semua', 'Cloud & DevOps', 'AI & Data Science', 'Cybersecurity', 'Frontend Development', 'Backend Development'];

const statusBadge = (s) => s === 'Mature' ? 'badge badge-gray' : 'badge badge-green';

export default function CompetencyMap() {
  const toast = useToast();
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCluster, setActiveCluster] = useState('Semua');
  const [showAll, setShowAll] = useState(false);
  const donutRef   = useRef(null);
  const donutChart = useRef(null);

  useEffect(() => {
    if (!donutRef.current) return;
    if (donutChart.current) donutChart.current.destroy();
    donutChart.current = new Chart(donutRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: CLUSTER_DATA.map(d => d.label),
        datasets: [{
          data: CLUSTER_DATA.map(d => d.value),
          backgroundColor: CLUSTER_DATA.map(d => d.color),
          hoverBackgroundColor: CLUSTER_DATA.map(d => d.color),
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937', cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} skill (${Math.round(ctx.parsed/TOTAL_SKILLS*100)}%)`
            }
          }
        }
      }
    });
    return () => { if (donutChart.current) donutChart.current.destroy(); };
  }, []);

  const filtered = allSkills.filter(sk => {
    const q = searchQuery.toLowerCase();
    return (
      (activeCluster === 'Semua' || sk.cluster === activeCluster) &&
      (sk.name.toLowerCase().includes(q) || sk.cluster.toLowerCase().includes(q))
    );
  });

  const displayed = showAll ? filtered : filtered.slice(0, 5);

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Peta Kluster Kompetensi Detail</h1>
          <p className="text-sm text-text-secondary mt-1">Analisis granular kluster industri dan tren keahlian terkini.</p>
        </div>
        <button
          onClick={() => toast.success('Berhasil', 'Laporan taksonomi skill sedang diunduh.')}
          className="btn-outline flex items-center gap-2 text-xs py-1.5 mt-4 md:mt-0"
        >
          <Icon className="text-[16px]" name="download" />
          Unduh Laporan Taksonomi
        </button>
      </div>

      {/* ── Top row: Cluster Map + Trending ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

        {/* Cluster visualization */}
        <div className="card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-text">Distribusi Kluster Kompetensi</h2>
              <p className="text-xs text-text-secondary mt-0.5">Visualisasi interaktif hirarki keahlian kurikulum vs industri.</p>
            </div>
            <div className="flex gap-1.5">
              {['zoom_in','zoom_out'].map(ico => (
                <button key={ico} className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-text-secondary hover:bg-gray-50 transition-colors">
                  <Icon className="text-[16px]" name={ico} />
                </button>
              ))}
            </div>
          </div>

          {/* Real Chart.js Doughnut */}
          <div className="flex-1 min-h-[320px] relative flex items-center justify-center gap-6">
            {/* Chart */}
            <div className="relative w-64 h-64 flex-shrink-0">
              <canvas ref={donutRef} />
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs font-semibold text-text-secondary">Total Skills</p>
                <p className="font-display text-3xl font-bold text-text">{TOTAL_SKILLS.toLocaleString()}</p>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3">
              {CLUSTER_DATA.map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <div>
                    <p className="text-sm font-medium text-text leading-tight">{d.label}</p>
                    <p className="text-xs text-text-muted">{d.value} skill ({Math.round(d.value/TOTAL_SKILLS*100)}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trending panel */}
        <div className="card p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-text flex items-center gap-2">
              <Icon className="text-[18px] text-brand" name="trending_up" />
              Skills yang sedang tren
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">Tren peningkatan permintaan dalam 7 hari terakhir.</p>
          </div>
          <div className="space-y-3 flex-1">
            {trendingSkills.map(sk => (
              <div key={sk.name} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                  <Icon className="text-brand text-[16px]" name="code" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{sk.name}</p>
                  <p className="text-xs text-text-secondary truncate">{sk.category}</p>
                </div>
                <span className="badge badge-green flex-shrink-0">+{sk.pct}%</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.info('Tren Lengkap', 'Membuka panel tren lengkap dengan data historis 30 hari...')}
            className="mt-4 text-sm font-semibold text-brand hover:underline text-center w-full"
          >
            Lihat Semua Tren
          </button>
        </div>
      </div>

      {/* ── Skills Table ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-text">Daftar Keahlian per Kluster</h2>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-56">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter keahlian..."
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Cluster filter tabs */}
        <div className="px-5 py-3 border-b border-border flex gap-2 overflow-x-auto">
          {clusters.map(c => (
            <button
              key={c}
              onClick={() => setActiveCluster(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCluster === c
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              {['KEAHLIAN (SKILL)','KLUSTER UTAMA','TINGKAT PERMINTAAN','STATUS'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayed.map(sk => (
              <tr key={sk.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-text">{sk.name}</td>
                <td className="px-5 py-3.5 text-text-secondary">{sk.cluster}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-28 progress-track">
                      <div className="progress-fill" style={{ width: `${sk.demand}%` }} />
                    </div>
                    <span className="text-xs text-text-secondary whitespace-nowrap">{sk.demandText}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={statusBadge(sk.status)}>{sk.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 5 && (
          <div className="px-5 py-3 border-t border-border text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-semibold text-brand hover:underline flex items-center gap-1 mx-auto"
            >
              {showAll ? 'Tampilkan Lebih Sedikit' : `Muat Lebih Banyak (${filtered.length - 5} lagi)`}
              <Icon className="text-[16px]" name={showAll ? 'expand_less' : 'expand_more'} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
