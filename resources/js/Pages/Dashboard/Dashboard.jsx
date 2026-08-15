
import React, { useEffect, useRef, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import { useSkills } from '../../context/SkillContext';
import { useToast } from '../../context/ToastContext';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  kaprodi: 'Kaprodi',
  dosen: 'Dosen',
  mahasiswa: 'Mahasiswa',
};

const MISMATCH_LABELS = {
  aligned: 'Aligned',
  over_skill: 'Over Skill',
  under_skill: 'Under Skill',
};

const MetricCard = ({ title, value, change, changeType, icon, iconBg, note }) => (
  <div className="bg-white border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{title}</p>
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
    </div>
    <div>
      <h3 className="font-display text-3xl font-bold text-text">{value}</h3>
      <div className="flex items-center gap-2 mt-1.5">
        {change && (
          <span className={`badge text-[11px] ${changeType === 'up' ? 'badge-green' : 'badge-red'}`}>
            <span className="material-symbols-outlined text-[12px]">
              {changeType === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            {change}
          </span>
        )}
        {note && <span className="text-[11px] text-text-muted">{note}</span>}
      </div>
    </div>
  </div>
);

function StatCard({ icon, label, value, tone = 'brand' }) {
  const chipClass = {
    brand: 'bg-brand-light text-brand',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
  }[tone];

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-lg ${chipClass} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <p className="text-xs text-text-secondary font-medium">{label}</p>
      <p className="font-display text-3xl font-bold text-text">{value}</p>
    </div>
  );
}

// ─── Dummy Data for Student ───
const JOB_RECS = [
  { title: 'Junior Backend Developer', company: 'Gojek',      location: 'Jakarta', match: 85, salary: 'Rp 8–12 jt/bln',  logo: '🚀' },
  { title: 'Software Engineer',        company: 'Tokopedia',  location: 'Jakarta', match: 78, salary: 'Rp 10–15 jt/bln', logo: '🛒' },
  { title: 'Node.js Developer',        company: 'Dana',       location: 'Jakarta', match: 72, salary: 'Rp 9–13 jt/bln',  logo: '💳' },
  { title: 'Full-stack Dev (Junior)',   company: 'Tiket.com', location: 'Bali',    match: 68, salary: 'Rp 7–11 jt/bln',  logo: '✈️' },
];

const LEARNING_PATH = [
  { step: 1, title: 'Selesaikan Modul Docker Basics',      platform: 'Dicoding',   duration: '2 minggu', done: true  },
  { step: 2, title: 'Kubernetes for Beginners',             platform: 'Udemy',      duration: '3 minggu', done: false },
  { step: 3, title: 'Build REST API with Node.js + Express',platform: 'YouTube/PJ', duration: '1 minggu', done: false },
  { step: 4, title: 'CI/CD Pipeline with GitHub Actions',   platform: 'GitHub Docs',duration: '1 minggu', done: false },
];

export default function Dashboard() {
  const { auth, stats = {} } = usePage().props;
  const user = auth.user;
  const role = auth.role || 'mahasiswa';

  const toast = useToast();
  const { mySkills = [] } = useSkills() || {};

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');

    if (role === 'super_admin') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(6,78,59,0.18)');
      gradient.addColorStop(1, 'rgba(6,78,59,0)');

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00'],
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
              data: [120,115,110,150,125,118,122],
              borderColor: '#d1d5db',
              borderWidth: 2,
              borderDash: [5,5],
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
    } else if (role === 'mahasiswa' && mySkills.length > 0) {
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: mySkills.map(s => s.name),
          datasets: [
            {
              label: 'Skill Saya',
              data: mySkills.map(s => s.levelValue),
              backgroundColor: 'rgba(6,78,59,0.12)',
              borderColor: '#064e3b',
              borderWidth: 2,
              pointBackgroundColor: '#064e3b',
              pointRadius: 3,
            },
            {
              label: 'Kebutuhan Industri',
              data: mySkills.map(s => s.required),
              backgroundColor: 'rgba(209,213,219,0.1)',
              borderColor: '#9ca3af',
              borderWidth: 1,
              borderDash: [3,3],
              pointRadius: 0,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1f2937', cornerRadius: 8 },
          },
          scales: {
            r: {
              min: 0, max: 100,
              ticks: { display: false },
              grid: { color: '#e5e7eb' },
              pointLabels: { font: { family: 'Inter', size: 11 }, color: '#6b7280' },
            }
          }
        }
      });
    }

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [role, mySkills]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const sectorColors = {
    'Teknologi & TI': '#064e3b',
    'Keuangan': '#059669',
    'Kesehatan': '#6b7280',
    'Manufaktur': '#9ca3af',
  };

  const sectors = (stats.sectors || []).map(s => ({
    name: s.name,
    pct: Math.round(s.pct),
    color: sectorColors[s.name] || '#9ca3af',
  }));

  if (!user) return null;

  const subtitle = {
    super_admin: 'Ringkasan real-time ekstraksi skill dan kesehatan pipeline.',
    kaprodi: stats.studyProgram
      ? `Ringkasan analitik kurikulum ${stats.studyProgram.nama_prodi} (${stats.studyProgram.jenjang}).`
      : 'Ringkasan analitik kurikulum program studi Anda.',
    dosen: 'Ringkasan mata kuliah yang Anda ampu.',
    mahasiswa: 'Selamat datang di platform analisis kesenjangan skill.',
  }[role] ?? '';

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">
            {role === 'super_admin' ? 'Dashboard Analitik Utama' : role === 'mahasiswa' ? `Halo, ${user.name}! 👋` : `Halo, ${user.name}`}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {role === 'mahasiswa' ? `${user.study_program?.nama_prodi || 'Teknik Informatika'} — Semester ${user.semester || 6} · NIM ${user.nim || '2141720123'}` : subtitle}
          </p>
        </div>
        {role === 'super_admin' && (
          <div className="flex gap-3">
            <button className="btn-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">download</span>
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
        )}
        {role === 'mahasiswa' && (
          <div className="bg-white border border-border rounded-xl px-4 py-2.5 text-right shadow-sm">
            <p className="text-xs text-text-secondary">Target Karier</p>
            <p className="font-display text-sm font-bold text-brand mt-0.5">{user.target_role || 'Backend Engineer'}</p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[10px] text-text-secondary">Match Rate:</span>
              <span className="badge badge-green text-[10px] py-0.5 px-1.5">72%</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Super Admin Layout ─── */}
      {role === 'super_admin' && (
        <div className="space-y-6">
          {/* ── Campus Management Banner ── */}
          <div className="bg-gradient-to-r from-brand to-brand-hover text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-brand/10">
            <div>
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px]">domain</span>
                Pusat Manajemen Kampus Aktif
              </h2>
              <p className="text-sm text-brand-light mt-1 max-w-2xl">
                Sistem sekarang memiliki pusat kendali terintegrasi. Anda dapat mengelola akun pengguna, mereview usulan kurikulum dari dosen, dan mencetak laporan akreditasi.
              </p>
            </div>
            <Link
              href="/management"
              className="px-5 py-2.5 bg-white text-brand rounded-lg text-sm font-bold shadow hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Buka Manajemen Kampus
            </Link>
          </div>

          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Skill Diekstraksi"
              value={stats.totalSkills?.toLocaleString() || '0'}
              change="+12.5%"
              changeType="up"
              note="vs minggu lalu"
              icon="data_object"
              iconBg="bg-cyan-50 text-cyan-600"
            />
            <MetricCard
              title="Mata Kuliah Sinkron"
              value={stats.totalCourses?.toLocaleString() || '0'}
              change="+5.2%"
              changeType="up"
              note="vs minggu lalu"
              icon="menu_book"
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
              value={stats.mismatchGaps?.toString() || '0'}
              note="Membutuhkan perhatian segera"
              icon="warning"
              iconBg="bg-red-50 text-red-500"
            />
          </div>

          {/* ── Middle Row: Chart + Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Line Chart */}
            <div className="card p-5 lg:col-span-2 flex flex-col bg-white">
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
                <div className="absolute top-6 right-[28%] bg-white border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-brand shadow-md">
                  Peak: 142.8 GB/s
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-border rotate-45 z-[-1]" />
                </div>
              </div>
            </div>

            {/* Competency Distribution */}
            <div className="card p-5 flex flex-col bg-white">
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold text-text">Peta Kompetensi Industri</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Distribusi skill berdasarkan sektor.
                </p>
              </div>
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {sectors.length > 0 ? (
                  sectors.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-medium text-text">{s.name}</span>
                        <span className="text-sm font-bold" style={{ color: s.color }}>{s.pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-text-muted">Belum ada data sektor.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Scraping Nodes Table ── */}
          <div className="card overflow-hidden bg-white">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="font-display text-base font-semibold text-text">Infrastruktur Agen Scraping</h2>
                <p className="text-xs text-text-secondary mt-0.5">Status node pengumpulan data regional.</p>
              </div>
              <Link
                href="/scraping"
                className="text-sm font-semibold text-brand hover:underline"
              >
                Lihat Semua Agen →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    {['WILAYAH / NODE','STATUS','UPTIME','DATA DIPROSES'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.scrapingAgents?.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-text-secondary">
                            <span className="material-symbols-outlined text-[16px]">dns</span>
                          </div>
                          <span className="font-medium text-text">{row.wilayah}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${row.status === 'Aktif' ? 'badge-green' : 'badge-yellow'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-text">{row.uptime}%</td>
                      <td className="px-5 py-3.5 font-mono text-text-secondary">{row.volume_data} TB</td>
                    </tr>
                  ))}
                  {(!stats.scrapingAgents || stats.scrapingAgents.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-xs text-text-muted">
                        Tidak ada agen scraping terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Kaprodi Layout ─── */}
      {role === 'kaprodi' && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
            <div>
              <p className="font-display font-bold text-text">
                {stats.studyProgram ? `${stats.studyProgram.nama_prodi} — ${stats.studyProgram.jenjang}` : 'Program Studi belum ditetapkan'}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {stats.studyProgram?.nama_institusi ?? 'Hubungi administrator untuk mengatur program studi Anda.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon="menu_book" label="Mata Kuliah Program" value={stats.totalCourses} />
            <StatCard icon="insights" label="Total Analisis Gap" value={stats.totalGaps} />
            <StatCard icon="warning" label="Gap Mismatch" value={stats.mismatchGaps} tone="amber" />
          </div>

          {stats.gapByType?.length > 0 && (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
              <p className="text-sm font-bold text-text mb-3">Rincian Tipe Gap</p>
              <div className="flex flex-wrap gap-2">
                {stats.gapByType.map(g => (
                  <span
                    key={g.tipe_mismatch}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-light text-brand"
                  >
                    {MISMATCH_LABELS[g.tipe_mismatch] ?? g.tipe_mismatch} · {g.total}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Dosen Layout ─── */}
      {role === 'dosen' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon="menu_book" label="Mata Kuliah Diampu" value={stats.courses?.length ?? 0} />
            <StatCard icon="insights" label="Total Gap Program" value={stats.totalGaps} />
            <StatCard icon="person_book" label="Role" value={ROLE_LABELS[role]} />
          </div>

          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-brand">library_books</span>
              <p className="text-sm font-bold text-text">Mata Kuliah yang Diampu</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-text-muted border-b border-gray-100">
                    <th className="px-5 py-3 font-semibold">Kode</th>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 font-semibold">Semester</th>
                    <th className="px-5 py-3 font-semibold">SKS</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.courses?.map(course => (
                    <tr key={course.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-brand">{course.code}</td>
                      <td className="px-5 py-3 font-medium text-text">{course.name}</td>
                      <td className="px-5 py-3 text-text-secondary">Semester {course.semester}</td>
                      <td className="px-5 py-3 text-text-secondary">{course.credits} SKS</td>
                    </tr>
                  ))}
                  {(!stats.courses || stats.courses.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center text-xs text-text-muted">
                        Belum ada mata kuliah yang diampu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mahasiswa Layout ─── */}
      {role === 'mahasiswa' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'IPK',              val: user.ipk || '3.62',   icon: 'grade',        iconBg: 'bg-amber-50 text-amber-600' },
              { label: 'Skill Dikuasai',   val: mySkills.length.toString(), icon: 'psychology',   iconBg: 'bg-brand-light text-brand' },
              { label: 'Skill Gap Kritis', val: mySkills.filter(s => s.required - s.levelValue > 10).length.toString(), icon: 'warning',      iconBg: 'bg-red-50 text-red-500' },
              { label: 'Lowongan Cocok',   val: `${JOB_RECS.length}`, icon: 'work_alert', iconBg: 'bg-blue-50 text-blue-600' },
            ].map(m => (
              <div key={m.label} className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
                  <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-text">{m.val}</p>
                  <p className="text-xs text-text-secondary">{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Skills Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Radar chart */}
            <div className="card p-5 bg-white flex flex-col">
              <h2 className="font-display text-base font-semibold text-text mb-1">Profil Skill Saya</h2>
              <p className="text-xs text-text-secondary mb-4">Dibandingkan kebutuhan industri sebagai Backend Engineer.</p>
              <div className="relative flex-1 min-h-[260px]">
                <canvas ref={chartRef} />
              </div>
            </div>

            {/* Gaps List */}
            <div className="card p-5 lg:col-span-2 bg-white">
              <h2 className="font-display text-base font-semibold text-text mb-1">Skill Gap yang Perlu Ditutup</h2>
              <p className="text-xs text-text-secondary mb-4">Skill berikut sangat dibutuhkan industri tapi masih lemah di profilmu.</p>
              <div className="space-y-4">
                {mySkills.map(sk => {
                  const gap = sk.required - sk.levelValue;
                  return (
                    <div key={sk.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-text">{sk.name}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-brand font-semibold">{sk.levelValue}%</span>
                          <span className="text-text-muted">/ {sk.required}% target</span>
                          {gap > 0 && <span className="badge badge-red text-[10px]">-{gap}%</span>}
                          {gap <= 0 && <span className="badge badge-green text-[10px]">✓</span>}
                        </div>
                      </div>
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full bg-gray-200" style={{ width: `${sk.required}%` }}/>
                        <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all" style={{ width: `${sk.levelValue}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Job recs + Learning path */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Job recommendations */}
            <div className="card overflow-hidden bg-white">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-display text-base font-semibold text-text">Lowongan yang Cocok Untukmu</h2>
                <p className="text-xs text-text-secondary mt-0.5">Berdasarkan profil skill saat ini.</p>
              </div>
              <div className="divide-y divide-border">
                {JOB_RECS.map(job => (
                  <div key={job.title} className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{job.title}</p>
                      <p className="text-xs text-text-secondary">{job.company} &nbsp;·&nbsp; {job.location}</p>
                      <p className="text-xs text-brand font-medium mt-0.5">{job.salary}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge text-xs ${job.match >= 80 ? 'badge-green' : job.match >= 70 ? 'badge-yellow' : 'badge-gray'}`}>
                        {job.match}% cocok
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning path */}
            <div className="card overflow-hidden bg-white">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-display text-base font-semibold text-text">Rencana Belajar AI</h2>
                <p className="text-xs text-text-secondary mt-0.5">Langkah prioritas menuju {user.target_role || 'Backend Engineer'}.</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {LEARNING_PATH.map(step => (
                  <div key={step.step} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${step.done ? 'bg-brand-light border-brand-border' : 'bg-white border-border'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${step.done ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary'}`}>
                      {step.done ? <span className="material-symbols-outlined text-[14px]">check</span> : step.step}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${step.done ? 'text-brand line-through' : 'text-text'}`}>{step.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted">{step.platform}</span>
                        <span className="text-text-muted">·</span>
                        <span className="text-xs text-text-muted">{step.duration}</span>
                      </div>
                    </div>
                    {!step.done && (
                      <button
                        onClick={() => toast.info('Membuka Modul', `Mengarahkan ke platform ${step.platform}... (Simulasi)`)}
                        className="text-xs font-semibold text-brand hover:underline flex-shrink-0"
                      >
                        Mulai →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
