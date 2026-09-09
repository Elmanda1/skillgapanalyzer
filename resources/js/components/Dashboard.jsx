import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import Icon from '../components/Icon.jsx';


const MetricCard = ({ title, value, change, changeType, icon, iconBg, note }) => (
  <div className="card p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{title}</p>
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className="text-[18px]" name={icon} />
      </div>
    </div>
    <div>
      <h3 className="font-display text-3xl font-bold text-text">{value}</h3>
      <div className="flex items-center gap-2 mt-1.5">
        {change && (
          <span className={`badge text-[11px] ${changeType === 'up' ? 'badge-green' : 'badge-red'}`}>
            <Icon className="text-[12px]" name={changeType === 'up' ? 'trending_up' : 'trending_down'} />
            {change}
          </span>
        )}
        {note && <span className="text-[11px] text-text-muted">{note}</span>}
      </div>
    </div>
  </div>
);

export default function Dashboard({ setActiveTab }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(6,78,59,0.18)');
    gradient.addColorStop(1, 'rgba(6,78,59,0)');

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00'],
        datasets: [
          {
            label: 'Laju (GB/s)',
            data: [40, 65, 80, 142.8, 90, 70, 85],
            borderColor: '#064e3b',
            backgroundColor: gradient,
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#064e3b',
            pointBorderWidth: 2,
            pointRadius: 4,
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Delay (ms)',
            data: [120, 115, 110, 150, 125, 118, 122],
            borderColor: '#d1d5db',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937',
            titleFont: { family: 'Outfit', size: 12, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af' },
          },
          y: {
            grid: { color: '#f3f4f6', drawBorder: false },
            ticks: { font: { family: 'Inter', size: 12 }, color: '#9ca3af', stepSize: 50 },
            beginAtZero: true,
          },
        },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const sectors = [
    { name: 'Teknologi & TI', pct: 45, color: '#064e3b' },
    { name: 'Keuangan', pct: 28, color: '#059669' },
    { name: 'Kesehatan', pct: 15, color: '#6b7280' },
    { name: 'Manufaktur', pct: 12, color: '#9ca3af' },
  ];

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Dashboard Analitik Utama</h1>
          <p className="text-sm text-text-secondary mt-1">
            Ringkasan real-time ekstraksi skill dan kesehatan pipeline.
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="btn-outline flex items-center gap-2">
            <Icon className="text-[16px]" name="download" />
            Ekspor Data
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {isSyncing ? 'Mensinkronkan...' : 'Sinkronisasi'}
          </button>
        </div>
      </div>

      {/* ── Campus Management Banner ── */}
      <div className="bg-gradient-to-r from-brand to-brand-light text-white rounded-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-brand/20">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Icon className="text-[24px]" name="domain" />
            Pusat Manajemen Kampus Aktif
          </h2>
          <p className="text-sm text-brand-50 mt-1 max-w-2xl">
            Sistem sekarang memiliki pusat kendali terintegrasi. Anda dapat mengelola akun pengguna, mereview usulan kurikulum dari dosen, dan mencetak laporan akreditasi.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('management')}
          className="px-5 py-2.5 bg-white text-brand rounded-lg text-sm font-bold shadow hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          Buka Manajemen Kampus
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <MetricCard
          title="Skill Diekstraksi"
          value="14,208"
          change="+12.5%"
          changeType="up"
          note="vs minggu lalu"
          icon="data_object"
          iconBg="bg-cyan-50 text-cyan-600"
        />
        <MetricCard
          title="Mata Kuliah Sinkron"
          value="3,492"
          change="+5.2%"
          changeType="up"
          note="vs minggu lalu"
          icon="library_books"
          iconBg="bg-brand-light text-brand"
        />
        <MetricCard
          title="Permintaan HTTP (24J)"
          value="1.2M"
          change="-2.1%"
          changeType="down"
          note="vs minggu lalu"
          icon="swap_vert"
          iconBg="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Gap Skill Kritis"
          value="42"
          note="Membutuhkan perhatian segera"
          icon="warning"
          iconBg="bg-red-50 text-red-500"
        />
      </div>

      {/* ── Middle Row: Chart + Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

        {/* Line Chart */}
        <div className="card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-text">
                Laju Ingesti vs Intelligent Delay
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Throughput data pipeline selama 12 jam terakhir.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-brand inline-block" />
                Laju (GB/s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-gray-300 inline-block" />
                Delay (ms)
              </span>
            </div>
          </div>
          <div className="relative flex-1 min-h-[260px]">
            <canvas ref={chartRef} />
            {/* Tooltip overlay */}
            <div className="absolute top-6 right-[28%] bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-brand shadow-md">
              Peak: 142.8 GB/s
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-border rotate-45 z-[-1]" />
            </div>
          </div>
        </div>

        {/* Competency Distribution */}
        <div className="card p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-text">Peta Kompetensi Industri</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Distribusi skill berdasarkan sektor.
            </p>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {sectors.map(s => (
              <div key={s.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-text">{s.name}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.pct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
