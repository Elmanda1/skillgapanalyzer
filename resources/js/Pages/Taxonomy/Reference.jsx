import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import { COMPETENCE_DIMENSIONS, CATEGORIES } from '../../constants/taxonomy';

const DIM_LABEL = Object.fromEntries(COMPETENCE_DIMENSIONS.map(d => [d.value, d.labelId]));
const DIM_COLOR = Object.fromEntries(COMPETENCE_DIMENSIONS.map(d => [d.value, d.color]));
const DIM_CHART_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];
const DEFAULT_DIM = 'hard_technical';

export default function TaxonomyReference({ skills, totalSkills, totalAliases }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDim, setActiveDim] = useState('all');
  const [activeCat, setActiveCat] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const donutRef = useRef(null);
  const donutChart = useRef(null);

  const dimCounts = useMemo(() => {
    const counts = Object.fromEntries(COMPETENCE_DIMENSIONS.map(d => [d.value, 0]));
    skills.forEach(sk => {
      const dim = sk.dimension ?? DEFAULT_DIM;
      counts[dim] = (counts[dim] ?? 0) + 1;
    });
    return counts;
  }, [skills]);

  useEffect(() => {
    if (!donutRef.current) return;
    if (donutChart.current) donutChart.current.destroy();
    donutChart.current = new Chart(donutRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: COMPETENCE_DIMENSIONS.map(d => DIM_LABEL[d.value]),
        datasets: [{
          data: COMPETENCE_DIMENSIONS.map(d => dimCounts[d.value]),
          backgroundColor: DIM_CHART_COLORS,
          hoverBackgroundColor: DIM_CHART_COLORS,
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
              label: ctx => ` ${ctx.label}: ${ctx.parsed} skill (${totalSkills ? Math.round(ctx.parsed / totalSkills * 100) : 0}%)`,
            },
          },
        },
      },
    });
    return () => { if (donutChart.current) donutChart.current.destroy(); };
  }, [dimCounts, totalSkills]);

  const filtered = skills.filter(sk => {
    const q = searchQuery.toLowerCase();
    const aliasMatch = (sk.aliases || []).some(a => (a.alias_name || '').toLowerCase().includes(q));
    return (
      (activeDim === 'all' || (sk.dimension ?? DEFAULT_DIM) === activeDim) &&
      (activeCat === 'all' || sk.kategori === activeCat) &&
      (sk.nama.toLowerCase().includes(q) || (sk.kategori || '').toLowerCase().includes(q) || aliasMatch)
    );
  });

  const displayed = showAll ? filtered : filtered.slice(0, 10);

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <Head title="Referensi Taksonomi" />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-brand">category</span>
            Referensi Taksonomi Keahlian
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {totalSkills} skill • {totalAliases} sinonim • 5 dimensi kompetensi
          </p>
        </div>
      </div>

      {/* ── Top row: Distribution chart + Info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card p-5 lg:col-span-2 flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-56 h-56 flex-shrink-0">
            <canvas ref={donutRef} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-semibold text-text-secondary">Total Skill</p>
              <p className="font-display text-3xl font-bold text-text">{totalSkills}</p>
            </div>
          </div>
          <div className="space-y-3 w-full">
            {COMPETENCE_DIMENSIONS.map(d => (
              <div key={d.value} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`badge ${d.color}`}>{DIM_LABEL[d.value]}</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {dimCounts[d.value]} skill ({totalSkills ? Math.round(dimCounts[d.value] / totalSkills * 100) : 0}%)
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-base font-semibold text-text mb-3">Info Taksonomi</h2>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-brand mt-0.5 flex-shrink-0">menu_book</span>
              Berdasarkan kerangka Vázquez-Villegas &amp; Borrego (2026) untuk klasifikasi 8 tipe mismatch
            </p>
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-brand mt-0.5 flex-shrink-0">school</span>
              Dimensi kompetensi mengacu pada Isnandar et al. (2024)
            </p>
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-brand mt-0.5 flex-shrink-0">info</span>
              Estimasi untuk dimensi non-hard skill ditandai khusus
            </p>
          </div>
        </div>
      </div>

      {/* ── Skills Table ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="font-display text-base font-semibold text-text">Daftar Skill</h2>
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">search</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari skill, sinonim, atau kategori..."
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Dimension filter chips */}
        <div className="px-5 py-3 border-b border-border flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveDim('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeDim === 'all' ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Semua Dimensi
          </button>
          {COMPETENCE_DIMENSIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setActiveDim(d.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeDim === d.value ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {DIM_LABEL[d.value]}
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        <div className="px-5 py-3 border-b border-border flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
              activeCat === 'all' ? 'bg-brand-light text-brand' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
            }`}
          >
            Semua Kategori
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeCat === c ? 'bg-brand-light text-brand' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              {['SKILL', 'KATEGORI', 'DIMENSI', 'ALIAS', 'SEKTOR'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayed.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-text-muted">Tidak ada skill yang cocok</td>
              </tr>
            )}
            {displayed.map(sk => (
              <tr key={sk.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-text">{sk.nama}</td>
                <td className="px-5 py-3.5 text-text-secondary">{sk.kategori}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${DIM_COLOR[sk.dimension] || 'badge-gray'}`}>
                    {DIM_LABEL[sk.dimension ?? DEFAULT_DIM] ?? '—'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {(sk.aliases || []).length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(sk.aliases || []).slice(0, 3).map(a => (
                        <span key={a.id} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-text-secondary">{a.alias_name}</span>
                      ))}
                      {(sk.aliases || []).length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-text-secondary">
                          +{(sk.aliases || []).length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs text-text-secondary">{sk.sektor_industri_terkait}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 10 && (
          <div className="px-5 py-3 border-t border-border text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-semibold text-brand hover:underline flex items-center gap-1 mx-auto"
            >
              {showAll ? 'Tampilkan Lebih Sedikit' : `Muat Lebih Banyak (${filtered.length - 10} lagi)`}
              <span className="material-symbols-outlined text-[16px]">{showAll ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
