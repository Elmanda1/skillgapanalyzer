import React, { useState, useEffect, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';


const MISMATCH_CONFIG = {
  aligned: { label: 'Aligned (Selaras)', color: '#10b981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'Kompetensi kurikulum sejalan dengan permintaan pasar' },
  skill_shortages: { label: 'Skill Shortages', color: '#ef4444', bg: 'bg-rose-50 text-rose-700 border-rose-200', desc: 'Kebutuhan industri tinggi namun materi belum diajarkan' },
  underskilling: { label: 'Underskilling', color: '#f97316', bg: 'bg-orange-50 text-orange-700 border-orange-200', desc: 'Materi diajarkan namun bobot/kedalaman masih kurang' },
  skill_gaps: { label: 'Skill Gaps', color: '#eab308', bg: 'bg-amber-50 text-amber-700 border-amber-200', desc: 'Kebutuhan industri ada, pemenuhan kurikulum baru sebagian' },
  overeducation: { label: 'Overeducation', color: '#64748b', bg: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'Materi diajarkan intensif namun kebutuhan industri minim' },
};

const DIMENSIONS = [
  { key: 'all', label: 'Semua Dimensi' },
  { key: 'hard_technical', label: 'Hard Technical' },
  { key: 'task_management', label: 'Task Management' },
  { key: 'contingency_management', label: 'Contingency Mgmt' },
  { key: 'knowledge_information', label: 'Knowledge & Info' },
  { key: 'social_situational', label: 'Social & Situational' },
];

export default function CompetencyMap({
  initialGaps = [],
  studyPrograms = [],
  selectedProgramId = 1,
  selectedPeriod = '',
  clusterData = [],
  trends = [],
  availablePeriods = [],
}) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMismatch, setActiveMismatch] = useState('all');
  const [activeDimension, setActiveDimension] = useState('all');
  const [activeCluster, setActiveCluster] = useState('Semua');
  const [selectedSkillTrend, setSelectedSkillTrend] = useState(null);

  const donutRef = useRef(null);
  const donutChart = useRef(null);
  const trendChartRef = useRef(null);
  const trendChart = useRef(null);

  // 1. Render Doughnut Chart for Category Clusters
  useEffect(() => {
    if (!donutRef.current || clusterData.length === 0) return;
    if (donutChart.current) donutChart.current.destroy();

    donutChart.current = new Chart(donutRef.current.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: clusterData.map(d => d.label),
        datasets: [{
          data: clusterData.map(d => d.value),
          backgroundColor: clusterData.map(d => d.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            cornerRadius: 8,
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} skill`,
            },
          },
        },
      },
    });

    return () => {
      if (donutChart.current) donutChart.current.destroy();
    };
  }, [clusterData]);

  // 2. Render Historical Trend Chart
  useEffect(() => {
    if (!trendChartRef.current || trends.length === 0) return;
    if (trendChart.current) trendChart.current.destroy();

    const targetTrend = selectedSkillTrend
      ? trends.find(t => t.skill_id === selectedSkillTrend)
      : trends[0];

    if (!targetTrend || !targetTrend.series) return;

    const labels = targetTrend.series.map(s => s.period);
    const dataPoints = targetTrend.series.map(s => s.frequency);

    trendChart.current = new Chart(trendChartRef.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${targetTrend.skill_name} (Jumlah Lowongan)`,
          data: dataPoints,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#0d9488',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
        },
      },
    });

    return () => {
      if (trendChart.current) trendChart.current.destroy();
    };
  }, [trends, selectedSkillTrend]);

  // Handler for Program / Period change
  const handleProgramChange = (e) => {
    const pId = e.target.value;
    router.get('/competency', { program_id: pId, period: selectedPeriod }, { preserveState: true });
  };

  const handlePeriodChange = (e) => {
    const per = e.target.value;
    router.get('/competency', { program_id: selectedProgramId, period: per }, { preserveState: true });
  };

  // Filter skills
  const filteredSkills = initialGaps.filter(sk => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || sk.name.toLowerCase().includes(q) || (sk.kategori && sk.kategori.toLowerCase().includes(q));
    const matchMismatch = activeMismatch === 'all' || sk.tipe_mismatch === activeMismatch;
    const matchDimension = activeDimension === 'all' || sk.dimension === activeDimension;
    const matchCluster = activeCluster === 'Semua' || sk.kategori === activeCluster;

    return matchSearch && matchMismatch && matchDimension && matchCluster;
  });

  const selectedProgramObj = studyPrograms.find(p => p.id === Number(selectedProgramId)) || studyPrograms[0];

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up space-y-6">

      {/* ── Header Bar ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text">Peta Kesenjangan Keterampilan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Analisis multi-dimensi perbandingan kurikulum prodi vokasi terhadap tren kebutuhan riil 8.200+ lowongan industri.
          </p>
        </div>

        {/* Filters: Program & Period */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedProgramId}
              onChange={handleProgramChange}
              className="appearance-none pl-3 pr-8 py-2 border border-border rounded-xl text-sm bg-slate-50 font-medium text-text focus:outline-none focus:border-brand cursor-pointer shadow-sm"
            >
              {studyPrograms.map(p => (
                <option key={p.id} value={p.id}>Prodi: {p.nama_prodi} ({p.jenjang})</option>
              ))}
            </select>
            <Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none" name="expand_more" />
          </div>

          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="appearance-none pl-3 pr-8 py-2 border border-border rounded-xl text-sm bg-slate-50 font-medium text-text focus:outline-none focus:border-brand cursor-pointer shadow-sm"
            >
              {availablePeriods.map(p => (
                <option key={p} value={p}>Periode: {p}</option>
              ))}
            </select>
            <Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none" name="calendar_month" />
          </div>

          <button
            onClick={() => {
              toast.info('Re-Analisis', 'Menjalankan engine kalkulasi ulang kesenjangan kurikulum...');
              router.post('/analysis/run', { study_program_id: selectedProgramId, period: selectedPeriod }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Selesai', 'Data kesenjangan berhasil diperbarui secara live.'),
              });
            }}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl bg-white hover:bg-slate-50 shadow-sm"
          >
            <Icon className="text-[16px]" name="sync" />
            Re-Analisis
          </button>
        </div>
      </div>

      {/* ── Top Metric Cards & Doughnut/Trend Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Cluster Donut */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-base font-semibold text-text">Distribusi Kategori Keahlian</h3>
            <span className="text-xs text-text-muted">{initialGaps.length} Total Skill</span>
          </div>
          <div className="h-44 relative my-2">
            <canvas ref={donutRef} />
          </div>
          <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-slate-100 text-[11px] text-text-secondary">
            {clusterData.slice(0, 4).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label} ({c.value})
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Historical Trend Series */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-display text-base font-semibold text-text">Tren Kebutuhan Industri (Time-Series)</h3>
              <p className="text-xs text-text-secondary">Historis dinamika lowongan dari 23 periode bulanan.</p>
            </div>
            {trends.length > 0 && (
              <select
                value={selectedSkillTrend || trends[0]?.skill_id}
                onChange={e => setSelectedSkillTrend(Number(e.target.value))}
                className="text-xs border border-border rounded-lg px-2 py-1 bg-slate-50"
              >
                {trends.map(t => (
                  <option key={t.skill_id} value={t.skill_id}>{t.skill_name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="h-44 w-full relative my-1">
            <canvas ref={trendChartRef} />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-slate-100">
            <span>Sumber Data: loker.id dataset (8.200+ job vacancies)</span>
            <span className="text-brand font-medium">Idempotent Snapshot Ingestion</span>
          </div>
        </div>

      </div>

      {/* ── Taxonomy & Dimension Filter Tabs ── */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">

        {/* Mismatch Taxonomy Tabs */}
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">
            Filter 8 Taksonomi Kesenjangan (Vázquez-Villegas & Borrego, 2026):
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveMismatch('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${activeMismatch === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              Semua ({initialGaps.length})
            </button>
            {Object.entries(MISMATCH_CONFIG).map(([key, cfg]) => {
              const count = initialGaps.filter(g => g.tipe_mismatch === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveMismatch(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${activeMismatch === key
                      ? 'ring-2 ring-offset-1 ring-slate-800 font-semibold ' + cfg.bg
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 Competence Dimensions & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {DIMENSIONS.map(d => (
              <button
                key={d.key}
                onClick={() => setActiveDimension(d.key)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${activeDimension === d.key
                    ? 'bg-brand text-white font-medium shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
            <input
              type="text"
              placeholder="Cari keahlian / kategori..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-xl text-xs focus:outline-none focus:border-brand bg-slate-50"
            />
          </div>
        </div>

      </div>

      {/* ── Interactive Skill Cards Grid (Peta Kesenjangan) ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold text-text">
            Hasil Evaluasi Kesenjangan ({filteredSkills.length} Keahlian)
          </h2>
          <span className="text-xs text-text-muted">
            Program: <strong className="text-text">{selectedProgramObj?.nama_prodi}</strong>
          </span>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center text-text-muted">
            <Icon className="text-4xl mb-2 text-slate-300" name="search_off" />
            <p className="text-sm font-medium">Tidak ada keahlian yang cocok dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((item) => {
              const mismatchInfo = MISMATCH_CONFIG[item.tipe_mismatch] || MISMATCH_CONFIG.aligned;
              const urgency = item.skor_urgensi;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Category & Mismatch Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-brand bg-brand-light/40 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                        {item.kategori || 'Umum'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${mismatchInfo.bg}`}>
                        {mismatchInfo.label.split(' ')[0]}
                      </span>
                    </div>

                    {/* Skill Title */}
                    <h3 className="font-display text-base font-bold text-text mb-1 truncate" title={item.name}>
                      {item.name}
                    </h3>

                    {/* Dimension Tag */}
                    <div className="text-[11px] text-text-muted mb-3 flex items-center gap-1">
                      <Icon className="text-[13px]" name="tune" />
                      <span className="capitalize">{item.dimension.replace('_', ' ')}</span>
                    </div>

                    {/* Urgency Meter */}
                    <div className="space-y-1 my-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-text-secondary">Skor Urgensi Gap:</span>
                        <span className={`font-bold ${urgency >= 8 ? 'text-rose-600' : urgency >= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                          {urgency}/10
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${urgency >= 8 ? 'bg-rose-500' : urgency >= 5 ? 'bg-orange-400' : 'bg-emerald-500'
                            }`}
                          style={{ width: `${Math.max(8, urgency * 10)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-text-muted pt-1">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          📚 {item.total_sks || 0} Total SKS Diajarkan
                        </span>
                        <span className="font-semibold text-brand bg-brand-light/50 px-1.5 py-0.5 rounded border border-brand/20">
                          💼 {item.evidence_count} Lowongan Industri
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link to Jobs Browser */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {item.evidence_count > 0 ? (
                      <Link
                        href={`/jobs?search=${encodeURIComponent(item.name)}`}
                        className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                      >
                        <Icon className="text-[14px]" name="work" />
                        Lihat {item.evidence_count} Lowongan Riil
                      </Link>
                    ) : (
                      <span className="text-[11px] text-text-muted">Kurikulum Tersedia</span>
                    )}

                    <span className="text-[10px] text-slate-400">ID #{item.skill_id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
