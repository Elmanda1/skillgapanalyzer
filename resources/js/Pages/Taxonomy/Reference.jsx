import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import { COMPETENCE_DIMENSIONS } from '../../constants/taxonomy';
import Icon from '../../components/Icon.jsx';


const DIM_LABEL = Object.fromEntries(COMPETENCE_DIMENSIONS.map(d => [d.value, d.labelId]));
const DIM_COLOR = Object.fromEntries(COMPETENCE_DIMENSIONS.map(d => [d.value, d.color]));
const DIM_CHART_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];
const DEFAULT_DIM = 'hard_technical';

export default function TaxonomyReference({ skills, filters = {}, summary = {} }) {
  const donutRef = useRef(null);
  const donutChart = useRef(null);
  const searchTimer = useRef(null);
  const [search, setSearch] = useState(filters.search || '');
  const [loading, setLoading] = useState(false);

  const items = Array.isArray(skills?.data) ? skills.data : [];
  const currentPage = Number(skills?.current_page ?? 1);
  const total = Number(skills?.total ?? items.length);
  const totalPages = Math.max(1, Number(skills?.last_page ?? 1));
  const from = Number(skills?.from ?? 0);
  const to = Number(skills?.to ?? 0);

  const dimCounts = summary.dimensionCounts ?? {};
  const totalSkills = summary.totalSkills ?? 0;

  const applyFilters = (overrides = {}) => {
    setLoading(true);
    router.get('/taxonomy', {
      search: overrides.search ?? search,
      dimension: overrides.dimension ?? filters.dimension ?? 'all',
      kategori: overrides.kategori ?? filters.kategori ?? 'all',
      page: overrides.page ?? 1,
    }, {
      preserveState: true,
      preserveScroll: true,
      only: ['skills', 'filters'],
      onFinish: () => setLoading(false),
    });
  };

  const onSearchChange = (value) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilters({ search: value }), 300);
  };

  const setDimension = (dim) => {
    if (dim === (filters.dimension || 'all')) return;
    applyFilters({ dimension: dim, search });
  };

  const setCategory = (cat) => {
    if (cat === (filters.kategori || 'all')) return;
    applyFilters({ kategori: cat, search });
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      applyFilters({ page });
      document.querySelector('.card table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const pageNumbers = (() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  })();

  useEffect(() => {
    const ctx = donutRef.current?.getContext('2d');
    if (!ctx) return;
    try {
      if (donutChart.current) donutChart.current.destroy();
      donutChart.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: COMPETENCE_DIMENSIONS.map(d => DIM_LABEL[d.value]),
          datasets: [{
            data: COMPETENCE_DIMENSIONS.map(d => dimCounts[d.value] ?? 0),
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
    } catch {
      donutChart.current = null;
    }
    return () => { if (donutChart.current) donutChart.current.destroy(); };
  }, [dimCounts, totalSkills]);

  const categories = useMemo(() => summary.categories ?? [], [summary.categories]);

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <Head title="Referensi Taksonomi" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
            <Icon className="text-[24px] text-brand" name="category" />
            Referensi Taksonomi Keahlian
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {totalSkills} skill • {summary.totalAliases ?? 0} sinonim • 5 dimensi kompetensi
          </p>
        </div>
      </div>

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
                  {dimCounts[d.value] ?? 0} skill ({totalSkills ? Math.round((dimCounts[d.value] ?? 0) / totalSkills * 100) : 0}%)
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-base font-semibold text-text mb-3">Info Taksonomi</h2>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <p className="flex items-start gap-2">
              <Icon className="text-[16px] text-brand mt-0.5 flex-shrink-0" name="menu_book" />
              Berdasarkan kerangka Vázquez-Villegas &amp; Borrego (2026) untuk klasifikasi 8 tipe mismatch
            </p>
            <p className="flex items-start gap-2">
              <Icon className="text-[16px] text-brand mt-0.5 flex-shrink-0" name="school" />
              Dimensi kompetensi mengacu pada Isnandar et al. (2024)
            </p>
            <p className="flex items-start gap-2">
              <Icon className="text-[16px] text-brand mt-0.5 flex-shrink-0" name="info" />
              Estimasi untuk dimensi non-hard skill ditandai khusus
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="font-display text-base font-semibold text-text">Daftar Skill ({total})</h2>
          <div className="relative w-full md:w-64">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
            <input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Cari skill, sinonim, atau kategori..."
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-b border-border flex gap-2 overflow-x-auto">
          <button
            onClick={() => setDimension('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              !filters.dimension || filters.dimension === 'all' ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Semua Dimensi
          </button>
          {COMPETENCE_DIMENSIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setDimension(d.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filters.dimension === d.value ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              {DIM_LABEL[d.value]}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="px-5 py-3 border-b border-border flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                !filters.kategori || filters.kategori === 'all' ? 'bg-brand-light text-brand' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map(c => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  filters.kategori === c.name ? 'bg-brand-light text-brand' : 'bg-gray-50 text-text-secondary hover:bg-gray-100'
                }`}
              >
                {c.name} ({c.total})
              </button>
            ))}
          </div>
        )}

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              {['SKILL', 'KATEGORI', 'DIMENSI', 'ALIAS', 'SEKTOR'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && Array.from({ length: 10 }).map((_, i) => (
              <tr key={`sk-${i}`} className="animate-pulse">
                <td className="px-5 py-3.5">
                  <div className="h-4 w-44 bg-gray-200 rounded" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-5 w-24 bg-gray-200 rounded-full" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-5 w-28 bg-gray-200 rounded-full" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-text-muted">Tidak ada skill yang cocok</td>
              </tr>
            )}
            {!loading && items.map(sk => (
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

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              Menampilkan {from}–{to} dari {total} skill
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                title="Sebelumnya"
                className="w-8 h-8 rounded-md border border-border hover:border-brand text-text-secondary hover:text-brand flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon className="text-[16px]" name="chevron_left" />
              </button>
              {pageNumbers.map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-text-muted">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-md text-xs font-semibold flex items-center justify-center transition-colors ${
                      p === currentPage
                        ? 'bg-brand text-white'
                        : 'border border-border hover:border-brand text-text-secondary hover:text-brand'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Berikutnya"
                className="w-8 h-8 rounded-md border border-border hover:border-brand text-text-secondary hover:text-brand flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon className="text-[16px]" name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}