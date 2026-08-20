
import React, { useEffect, useRef, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import { useSkills } from '../../context/SkillContext';
import { useToast } from '../../context/ToastContext';
import Icon from '../../components/Icon.jsx';


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

function StatCard({ icon, label, value, tone = 'brand' }) {
  const chipClass = {
    brand: 'bg-brand-light text-brand',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
  }[tone];

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-lg ${chipClass} flex items-center justify-center`}>
        <Icon className="text-[20px]" name={icon} />
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

  // ─── Mahasiswa State ───
  const careerRoles = stats.careerRoles || [];
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const activeRoleData = careerRoles[selectedRoleIdx] || careerRoles[0] || {
    name: 'Backend & Cloud Engineer',
    match: 78,
    salary: 'Rp 9.000.000 – Rp 15.000.000/bln',
    demand: 'Sangat Tinggi',
    description: 'Membangun arsitektur server terdistribusi, API, dan cloud.',
    requiredSkills: [
      { name: 'Node.js / Express', userLevel: 85, targetLevel: 90, status: 'aligned' },
      { name: 'PostgreSQL', userLevel: 75, targetLevel: 85, status: 'minor_gap' },
      { name: 'Docker & Containers', userLevel: 40, targetLevel: 85, status: 'critical_gap' },
      { name: 'CI/CD Pipelines', userLevel: 50, targetLevel: 80, status: 'critical_gap' },
    ],
  };

  const [completedSteps, setCompletedSteps] = useState(new Set(['LR01']));

  // ─── Dosen State ───
  const dosenCourses = stats.courses || [];
  const [activeCourseIdx, setActiveCourseIdx] = useState(0);
  const activeDosenCourse = dosenCourses[activeCourseIdx] || dosenCourses[0] || null;
  const [dosenProposals, setDosenProposals] = useState(stats.curriculumProposals || []);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({ mk: '', usulan: '', dampak: '+20% Keselarasan' });

  // Radar chart update for Mahasiswa and Line chart for Super Admin
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext('2d');

    if (role === 'super_admin') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(6,78,59,0.18)');
      gradient.addColorStop(1, 'rgba(6,78,59,0)');

      const chartRates = stats.throughputRates || [40, 65, 80, 142.8, 90, 70, 85];
      const chartDelays = chartRates.map(r => Math.max(20, Math.round(150 - r * 0.4)));

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00'],
          datasets: [
            {
              label: 'Laju (GB/s)',
              data: chartRates,
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
              data: chartDelays,
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
    } else if (role === 'mahasiswa' && activeRoleData?.requiredSkills?.length > 0) {
      const skills = activeRoleData.requiredSkills;
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: skills.map(s => s.name),
          datasets: [
            {
              label: 'Skill Saya Saat Ini',
              data: skills.map(s => s.userLevel),
              backgroundColor: 'rgba(6,78,59,0.18)',
              borderColor: '#064e3b',
              borderWidth: 2.5,
              pointBackgroundColor: '#064e3b',
              pointBorderColor: '#fff',
              pointHoverRadius: 6,
              pointRadius: 4,
            },
            {
              label: 'Standar Industri (Scraped)',
              data: skills.map(s => s.targetLevel),
              backgroundColor: 'rgba(59,130,246,0.08)',
              borderColor: '#3b82f6',
              borderWidth: 2,
              borderDash: [4,4],
              pointBackgroundColor: '#3b82f6',
              pointRadius: 3,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { font: { family: 'Inter', size: 11, weight: 'bold' }, padding: 15, boxWidth: 12 }
            },
            tooltip: { backgroundColor: '#1f2937', cornerRadius: 8 },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { display: false, stepSize: 25 },
              grid: { color: '#e5e7eb' },
              angleLines: { color: '#e5e7eb' },
              pointLabels: { font: { family: 'Outfit', size: 11, weight: '600' }, color: '#374151' },
            }
          }
        }
      });
    }

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [role, selectedRoleIdx, activeRoleData]);

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
    <div className="w-full p-6 md:p-8 space-y-6">
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
          {/* ── National Management Banner ── */}
          <div className="bg-gradient-to-r from-brand-dark via-brand to-emerald-800 text-white rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl shadow-brand/10 border border-brand/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                <Icon className="text-[32px]" name="shield" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    Pusat Analitik Vokasi Nasional
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {stats.totalCampuses || 6} Kampus Terintegrasi
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold">
                  Dashboard Kendali Nasional & Multi-Institusi
                </h2>
                <p className="text-xs text-brand-light mt-1 max-w-2xl leading-relaxed">
                  Pemantauan makro keselarasan kurikulum politeknik vokasi se-Indonesia, ekstraksi taksonomi skill industri, dan infrastruktur agen data crawling real-time.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link
                href="/management"
                className="px-5 py-2.5 bg-white text-brand rounded-xl text-sm font-bold shadow-md hover:bg-gray-50 transition-all flex items-center gap-2 flex-1 lg:flex-initial justify-center"
              >
                <Icon className="text-[18px]" name="domain" />
                Kelola Seluruh Kampus
              </Link>
            </div>
          </div>

          {/* ── Metric Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Skill Diekstraksi"
              value={stats.totalSkills?.toLocaleString() || '0'}
              change="+12.5%"
              changeType="up"
              note="di taksonomi nasional"
              icon="data_object"
              iconBg="bg-cyan-50 text-cyan-600"
            />
            <MetricCard
              title="Mata Kuliah Sinkron"
              value={stats.totalCourses?.toLocaleString() || '0'}
              change={`+${stats.totalStudyPrograms || 0} Prodi`}
              changeType="up"
              note="di 6 politeknik"
              icon="menu_book"
              iconBg="bg-brand-light text-brand"
            />
            <MetricCard
              title="Permintaan Pipeline (24J)"
              value={stats.totalHttpRequests || '1.2M'}
              change={`${stats.totalDataProcessed || 0} TB`}
              changeType="up"
              note="Volume data crawling"
              icon="swap_vert"
              iconBg="bg-blue-50 text-blue-600"
            />
            <MetricCard
              title="Gap Skill Kritis"
              value={stats.mismatchGaps?.toString() || '0'}
              note="Perlu review kurikulum"
              icon="warning"
              iconBg="bg-red-50 text-red-500"
            />
          </div>

          {/* ── Middle Row: Chart + Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart */}
            <div className="card p-6 lg:col-span-2 flex flex-col bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">
                    Laju Ingesti vs Intelligent Delay
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Throughput data pipeline pengumpulan lowongan industri 12 jam terakhir.
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
                  Peak: {stats.throughputPeak || '142.8 GB/s'}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-border rotate-45 z-[-1]" />
                </div>
              </div>
            </div>

            {/* Competency Distribution */}
            <div className="card p-6 flex flex-col bg-white">
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold text-text">Peta Kompetensi Industri</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Distribusi taksonomi skill berdasarkan sektor.
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

          {/* ── Multi-Campus Monitoring Matrix Table ── */}
          {stats.campusSummaries?.length > 0 && (
            <div className="card overflow-hidden bg-white">
              <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="font-display text-base font-semibold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[20px]" name="school" />
                    Matriks Pemantauan 6 Politeknik Terhubung
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">Ringkasan kurikulum, gap kompetensi, dan civitas akademika tiap institusi.</p>
                </div>
                <Link
                  href="/management"
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Detail Manajemen Kampus →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white border-b border-border">
                      {['INSTITUSI / KAMPUS', 'PRODI', 'TOTAL MK', 'GAP KRITIS', 'DOSEN / MAHASISWA', 'STATUS'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.campusSummaries.map((camp, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-text flex items-center gap-2">
                          <Icon className="text-brand text-[18px]" name="domain" />
                          {camp.name}
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">{camp.prodiCount} Program Studi</td>
                        <td className="px-5 py-3.5 font-semibold text-text">{camp.courseCount} Mata Kuliah</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${camp.gapCount > 5 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {camp.gapCount} Mismatch
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-text-secondary">
                          {camp.dosenCount} Dosen · {camp.mhsCount} Mahasiswa
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="badge badge-green text-[10px] py-0.5 px-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                            Tersinkron
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Scraping Nodes Table ── */}
          <div className="card overflow-hidden bg-white">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="font-display text-base font-semibold text-text">Infrastruktur Agen Scraping Regional</h2>
                <p className="text-xs text-text-secondary mt-0.5">Status operasional node crawling data lowongan kerja di berbagai wilayah.</p>
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
                            <Icon className="text-[16px]" name="dns" />
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

      {/* ─── Kaprodi / Admin Institusi Layout ─── */}
      {role === 'kaprodi' && (
        <div className="space-y-6">
          {/* ── Campus & Prodi Hero Banner ── */}
          <div className="bg-gradient-to-r from-brand to-brand-dark text-white rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-lg shadow-brand/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                <Icon className="text-[32px]" name="school" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {stats.studyProgram?.nama_institusi || 'Politeknik Negeri Jakarta'}
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Prodi Aktif
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold">
                  {stats.studyProgram ? `${stats.studyProgram.jenjang} ${stats.studyProgram.nama_prodi}` : 'Program Studi Belum Ditetapkan'}
                </h2>
                <p className="text-xs text-brand-light mt-1 max-w-2xl leading-relaxed">
                  Pusat analitik dan pemantauan keselarasan kurikulum prodi terhadap kebutuhan skill industri terkini secara terintegrasi.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Link
                href="/curriculum"
                className="px-4 py-2.5 bg-white text-brand rounded-xl text-sm font-bold shadow hover:bg-gray-50 transition-all flex items-center gap-2 flex-1 lg:flex-initial justify-center"
              >
                <Icon className="text-[18px]" name="menu_book" />
                Kurikulum Prodi
              </Link>
              <Link
                href="/management"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 flex-1 lg:flex-initial justify-center backdrop-blur-sm"
              >
                <Icon className="text-[18px]" name="domain" />
                Manajemen Institusi
              </Link>
            </div>
          </div>

          {/* ── Metric Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Mata Kuliah Program"
              value={stats.totalCourses?.toString() || '0'}
              change="+1 MK"
              changeType="up"
              note="di prodi ini"
              icon="menu_book"
              iconBg="bg-brand-light text-brand"
            />
            <MetricCard
              title="Total Analisis Gap"
              value={stats.totalGaps?.toString() || '0'}
              note="Capaian kompetensi"
              icon="insights"
              iconBg="bg-cyan-50 text-cyan-600"
            />
            <MetricCard
              title="Gap Mismatch (Kritis)"
              value={stats.mismatchGaps?.toString() || '0'}
              note="Memerlukan revisi materi"
              icon="warning"
              iconBg="bg-red-50 text-red-500"
            />
            <MetricCard
              title="Civitas Prodi"
              value={`${stats.totalDosen || 0} Dosen`}
              note={`${stats.totalMahasiswa || 0} Mahasiswa Terdaftar`}
              icon="groups"
              iconBg="bg-purple-50 text-purple-600"
            />
          </div>

          {/* ── Middle Row: Gap Breakdown & Quick Insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gap Distribution */}
            <div className="card p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-text">Distribusi Kategori Gap</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Status keselarasan kompetensi dengan industri.</p>
                  </div>
                  <Icon className="text-brand text-[22px]" name="pie_chart" />
                </div>

                <div className="space-y-4 my-4">
                  {stats.gapByType?.length > 0 ? (
                    stats.gapByType.map(g => {
                      const label = MISMATCH_LABELS[g.tipe_mismatch] ?? g.tipe_mismatch;
                      const total = stats.totalGaps || 1;
                      const pct = Math.round((g.total / total) * 100);
                      const colorClass = g.tipe_mismatch === 'aligned' 
                        ? 'bg-emerald-500' 
                        : g.tipe_mismatch === 'under_skill' 
                        ? 'bg-red-500' 
                        : 'bg-blue-500';

                      return (
                        <div key={g.tipe_mismatch}>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-semibold text-text flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                              {label}
                            </span>
                            <span className="text-text-muted font-mono font-semibold">{g.total} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-text-muted text-center py-6">Belum ada data analisis gap.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs">
                <span className="text-text-muted">Rekomendasi Tindakan:</span>
                <Link href="/ai-analysis" className="font-semibold text-brand hover:underline flex items-center gap-1">
                  Analisis AI
                  <Icon className="text-[14px]" name="arrow_forward" />
                </Link>
              </div>
            </div>

            {/* Program Priority Courses */}
            <div className="card p-0 bg-white lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[20px]" name="fact_check" />
                    Mata Kuliah Prioritas Evaluasi
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">Mata kuliah kurikulum prodi dengan tingkat kesenjangan tertinggi.</p>
                </div>
                <Link href="/curriculum" className="text-xs font-bold text-brand hover:underline">
                  Lihat Semua MK →
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white border-b border-border">
                      {['KODE', 'MATA KULIAH', 'SEMESTER / SKS', 'GAP SCORE', 'AKSI'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.courses?.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand">{c.code}</td>
                        <td className="px-5 py-3.5 font-medium text-text">{c.name}</td>
                        <td className="px-5 py-3.5 text-xs text-text-secondary">Semester {c.semester} · {c.credits} SKS</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.gap >= 70 ? 'bg-red-50 text-red-700 border-red-200' : c.gap >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            Gap: {c.gap}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/curriculum/courses/${c.id}`}
                            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                          >
                            Detail
                            <Icon className="text-[14px]" name="chevron_right" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {(!stats.courses || stats.courses.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-5 py-8 text-center text-xs text-text-muted">
                          Belum ada mata kuliah terdaftar di program studi ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dosen Layout ─── */}
      {role === 'dosen' && (
        <div className="space-y-6">
          {/* ── Hero Banner ── */}
          <div className="bg-gradient-to-r from-brand to-brand-dark text-white rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-lg shadow-brand/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                <Icon className="text-[32px]" name="cast_for_education" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {stats.studyProgram?.nama_institusi || 'Politeknik Negeri Jakarta'}
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Dosen Pengampu Aktif
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold">
                  Selamat Bertugas, {user.name}
                </h2>
                <p className="text-xs text-brand-light mt-1 max-w-2xl leading-relaxed">
                  Pantau keselarasan materi ajar terhadap kebutuhan industri, analisa gap kompetensi berbasis AI scraper, dan ajukan pembaruan silabus ke Kaprodi.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => {
                  setProposalForm({
                    mk: activeDosenCourse?.name || 'Cloud Computing',
                    usulan: 'Integrasi materi praktikum Docker & Cloud deployment terkini',
                    dampak: '+20% Keselarasan'
                  });
                  setShowProposalModal(true);
                }}
                className="px-4 py-2.5 bg-white text-brand rounded-xl text-sm font-bold shadow hover:bg-gray-50 transition-all flex items-center gap-2 flex-1 lg:flex-initial justify-center"
              >
                <Icon className="text-[18px]" name="add_task" />
                Ajukan Usulan Silabus
              </button>
              <Link
                href="/ai-analysis"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 flex-1 lg:flex-initial justify-center backdrop-blur-sm"
              >
                <Icon className="text-[18px]" name="auto_awesome" />
                Analisis AI Kurikulum
              </Link>
            </div>
          </div>

          {/* ── Key Metrics Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Mata Kuliah Diampu"
              value={dosenCourses.length.toString()}
              note="di program studi ini"
              icon="menu_book"
              iconBg="bg-brand-light text-brand"
            />
            <MetricCard
              title="Rata-rata Gap Score"
              value={dosenCourses.length > 0 ? `${Math.round(dosenCourses.reduce((acc, c) => acc + (c.gap || 0), 0) / dosenCourses.length)}%` : '0%'}
              note="Kesenjangan silabus vs pasar"
              icon="insights"
              iconBg="bg-amber-50 text-amber-600"
            />
            <MetricCard
              title="Sinyal Lowongan Industri"
              value="1.240+"
              change="+34%"
              changeType="up"
              note="Terdeteksi AI Scraper"
              icon="radar"
              iconBg="bg-blue-50 text-blue-600"
            />
            <MetricCard
              title="Usulan Silabus Aktif"
              value={dosenProposals.length.toString()}
              note="1 disetujui, 1 menunggu"
              icon="assignment_turned_in"
              iconBg="bg-purple-50 text-purple-600"
            />
          </div>

          {/* ── Interactive Course Evaluator & AI Diff Assistant ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Selector List */}
            <div className="card p-0 bg-white overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-gray-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="text-brand text-[20px]" name="library_books" />
                  <h3 className="font-display text-sm font-bold text-text">Daftar Mata Kuliah Diampu</h3>
                </div>
                <span className="text-xs text-text-muted">{dosenCourses.length} MK</span>
              </div>
              <div className="divide-y divide-border overflow-y-auto max-h-[420px]">
                {dosenCourses.map((c, idx) => {
                  const isSelected = activeCourseIdx === idx;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCourseIdx(idx)}
                      className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 ${
                        isSelected ? 'bg-brand/5 border-l-4 border-brand' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-brand">{c.code}</span>
                          <span className="text-[10px] text-text-muted">· Smt {c.semester} ({c.credits} SKS)</span>
                        </div>
                        <p className="font-semibold text-text text-sm">{c.name}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.skills?.slice(0, 3).map(sk => (
                            <span key={sk} className="text-[10px] bg-gray-100 text-text-secondary px-2 py-0.5 rounded">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.gap >= 70 ? 'bg-red-50 text-red-700 border-red-200' : c.gap >= 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          Gap: {c.gap}%
                        </span>
                        <span className="text-[10px] text-text-muted">{c.status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Syllabus Diff & Upgrade Assistant */}
            <div className="card p-6 bg-white lg:col-span-2 flex flex-col justify-between space-y-5">
              {activeDosenCourse ? (
                <>
                  <div>
                    <div className="flex items-start justify-between pb-4 border-b border-border">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge badge-brand text-xs font-mono">{activeDosenCourse.code}</span>
                          <span className="text-xs text-text-muted">Semester {activeDosenCourse.semester} · {activeDosenCourse.credits} SKS</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-text">
                          Evaluasi Silabus: {activeDosenCourse.name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Hasil perbandingan materi aktif dengan tren kata kunci lowongan industri (Scraper Engine).
                        </p>
                      </div>
                      <Link
                        href={`/curriculum/courses/${activeDosenCourse.id}`}
                        className="text-xs font-bold text-brand hover:underline flex items-center gap-1"
                      >
                        Detail MK <Icon className="text-[14px]" name="open_in_new" />
                      </Link>
                    </div>

                    {/* Diff Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      {/* Current Syllabus */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="text-gray-600 text-[18px]" name="history_edu" />
                          <h4 className="text-xs font-bold text-text uppercase tracking-wider">Silabus Berjalan Saat Ini</h4>
                        </div>
                        <div className="space-y-2">
                          {activeDosenCourse.skills && activeDosenCourse.skills.length > 0 ? (
                            activeDosenCourse.skills.map(s => (
                              <div key={s} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-gray-100">
                                <span className="font-medium text-text">{s}</span>
                                <span className="text-[10px] text-gray-500 font-medium">Dasar / Konseptual</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-text-muted py-2">Belum ada rincian kompetensi.</p>
                          )}
                        </div>
                      </div>

                      {/* AI Scraper Recommendation */}
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="text-brand text-[18px]" name="auto_awesome" />
                          <h4 className="text-xs font-bold text-brand uppercase tracking-wider">Rekomendasi AI Scraper (2026)</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                            <p className="font-bold text-text flex items-center gap-1">
                              <span className="text-emerald-600 font-bold">+</span> Tambahkan Praktikum Docker & Microservices
                            </p>
                            <p className="text-[11px] text-text-muted mt-0.5">Permintaan industri naik +34% pada posisi Junior & Middle Engineer.</p>
                          </div>
                          <div className="text-xs bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                            <p className="font-bold text-text flex items-center gap-1">
                              <span className="text-emerald-600 font-bold">+</span> Integrasi REST API Performance & Redis Caching
                            </p>
                            <p className="text-[11px] text-text-muted mt-0.5">85% lowongan backend mensyaratkan pemahaman memory caching.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Banner */}
                  <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-text">Tingkatkan Relevansi Mata Kuliah Ini</p>
                      <p className="text-[11px] text-text-muted">Usulan silabus akan langsung masuk ke antrean review Kaprodi.</p>
                    </div>
                    <button
                      onClick={() => {
                        setProposalForm({
                          mk: activeDosenCourse.name,
                          usulan: `Pembaruan silabus ${activeDosenCourse.name}: Integrasi modul Docker, Redis & Studi Kasus Industri`,
                          dampak: '+25% Keselarasan'
                        });
                        setShowProposalModal(true);
                      }}
                      className="btn-primary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                    >
                      <Icon className="text-[16px]" name="send" />
                      Ajukan Pembaruan ke Kaprodi
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-text-muted text-xs">
                  Pilih mata kuliah di sebelah kiri untuk melihat evaluasi silabus.
                </div>
              )}
            </div>
          </div>

          {/* ── Market Trends Feed & Proposals Table ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Market Scraped Trends */}
            <div className="card p-0 bg-white overflow-hidden">
              <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[18px]" name="trending_up" />
                    Tren Skill Industri Terkini (AI Scraper Feed)
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">Sinyal kompetensi yang paling sering dicari perusahaan di Indonesia.</p>
                </div>
                <span className="badge badge-green text-[10px]">Live Data</span>
              </div>
              <div className="divide-y divide-border">
                {stats.marketTrends?.map(item => (
                  <div key={item.skill} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text text-sm">{item.skill}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${item.urgency === 'Tinggi' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.jobCount} lowongan · Sumber: {item.source}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="badge badge-green text-xs font-mono font-bold">
                        {item.demand}
                      </span>
                      <button
                        onClick={() => {
                          setProposalForm({
                            mk: activeDosenCourse?.name || 'Mata Kuliah Pilihan',
                            usulan: `Penyisipan materi ${item.skill} ke dalam silabus aktif`,
                            dampak: '+18% Keselarasan'
                          });
                          setShowProposalModal(true);
                        }}
                        className="px-2.5 py-1 text-xs text-brand hover:bg-brand-light font-bold rounded-lg border border-brand/20 transition-all"
                      >
                        + Silabus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dosen Submitted Proposals */}
            <div className="card p-0 bg-white overflow-hidden">
              <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[18px]" name="history" />
                    Status Usulan Pembaruan Silabus
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">Riwayat proposal kurikulum yang diajukan ke Kaprodi.</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                {dosenProposals.map(p => (
                  <div key={p.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-text text-sm">{p.mk}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${p.status.includes('Disetujui') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{p.usulan}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-text-muted">
                      <span>Diajukan: {p.tanggal}</span>
                      <span className="font-bold text-emerald-600">Estimasi Dampak: {p.dampak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Proposal Modal ── */}
          {showProposalModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 animate-fade-in-up">
                <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                  <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[20px]" name="post_add" />
                    Ajukan Usulan Pembaruan Silabus
                  </h3>
                  <button onClick={() => setShowProposalModal(false)} className="text-text-muted hover:text-text">
                    <Icon className="text-[20px]" name="close" />
                  </button>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const newProp = {
                    id: `P0${dosenProposals.length + 1}`,
                    mk: proposalForm.mk,
                    usulan: proposalForm.usulan,
                    tanggal: new Date().toISOString().split('T')[0],
                    status: 'Menunggu Review Kaprodi',
                    dampak: proposalForm.dampak,
                  };
                  setDosenProposals([newProp, ...dosenProposals]);
                  setShowProposalModal(false);
                  toast.success('Usulan Terkirim', 'Proposal pembaruan silabus telah diteruskan ke dashboard Kaprodi.');
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text mb-1">Mata Kuliah</label>
                      <input
                        type="text"
                        value={proposalForm.mk}
                        onChange={(e) => setProposalForm({ ...proposalForm, mk: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text mb-1">Rincian Usulan Pembaruan Silabus / Materi</label>
                      <textarea
                        rows={4}
                        value={proposalForm.usulan}
                        onChange={(e) => setProposalForm({ ...proposalForm, usulan: e.target.value })}
                        required
                        placeholder="Tuliskan topik praktikum atau teknologi baru yang ingin dimasukkan..."
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text mb-1">Estimasi Peningkatan Keselarasan</label>
                      <input
                        type="text"
                        value={proposalForm.dampak}
                        onChange={(e) => setProposalForm({ ...proposalForm, dampak: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(false)}
                      className="px-4 py-2 text-xs font-bold text-text-secondary hover:bg-gray-100 rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Icon className="text-[16px]" name="send" />
                      Kirim ke Kaprodi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Mahasiswa Layout ─── */}
      {role === 'mahasiswa' && (
        <div className="space-y-6">
          {/* ── Student Profile & Target Career Banner ── */}
          <div className="bg-gradient-to-r from-brand to-brand-dark text-white rounded-2xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-lg shadow-brand/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner font-bold text-xl">
                {user.name?.charAt(0) || 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {stats.studentProfile?.institusi || 'Politeknik Negeri Jakarta'}
                  </span>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Semester {stats.studentProfile?.semester || 6} · NIM {stats.studentProfile?.nim || '214172001'}
                  </span>
                </div>
                <h2 className="font-display text-xl md:text-2xl font-bold">
                  Halo, {user.name}! 👋
                </h2>
                <p className="text-xs text-brand-light mt-1 max-w-2xl leading-relaxed">
                  {stats.studentProfile?.prodi || 'S1 Teknik Informatika'} — Jelajahi jalur karier industri, ukur kesiapan skill, dan selesaikan roadmap untuk menutup gap kompetensi.
                </p>
              </div>
            </div>

            {/* Target Role & Match Gauge */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4 w-full lg:w-auto">
              <div className="text-right">
                <p className="text-[10px] text-brand-light uppercase tracking-wider font-bold">Target Karier Aktif</p>
                <p className="font-display text-sm font-bold text-white mt-0.5">{activeRoleData.name}</p>
                <p className="text-[11px] text-emerald-300 font-semibold">{activeRoleData.salary}</p>
              </div>
              <div className="w-12 h-12 rounded-full border-3 border-emerald-400 flex items-center justify-center font-display font-bold text-white text-sm bg-white/10 shadow-inner">
                {activeRoleData.match}%
              </div>
            </div>
          </div>

          {/* ── Key Metrics Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Kesesuaian Karier"
              value={`${activeRoleData.match}%`}
              change="+6%"
              changeType="up"
              note="vs bulan lalu"
              icon="verified"
              iconBg="bg-brand-light text-brand"
            />
            <MetricCard
              title="Skill Siap Industri"
              value={`${activeRoleData.requiredSkills.filter(s => s.status === 'aligned').length} Skill`}
              note="Memenuhi standar"
              icon="psychology"
              iconBg="bg-blue-50 text-blue-600"
            />
            <MetricCard
              title="Skill Gap Kritis"
              value={`${activeRoleData.requiredSkills.filter(s => s.status === 'critical_gap').length} Skill`}
              note="Perlu ditingkatkan segera"
              icon="warning"
              iconBg="bg-red-50 text-red-500"
            />
            <MetricCard
              title="Lowongan Cocok"
              value={`${stats.scrapedJobs?.length || 4} Rekomendasi`}
              note="Scraped dari Tech Hubs"
              icon="work_history"
              iconBg="bg-purple-50 text-purple-600"
            />
          </div>

          {/* ── Career Path Explorer (Pills / Switcher) ── */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                  <Icon className="text-brand text-[20px]" name="explore" />
                  Eksplorasi Jalur Karier & Sinkronisasi AI Scraper
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Pilih target karier untuk menyesuaikan analisis radar skill, roadmap belajar, dan lowongan kerja terkait.
                </p>
              </div>
              <span className="badge badge-green text-xs font-mono font-bold">
                {activeRoleData.demand}
              </span>
            </div>

            {/* Career Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {careerRoles.map((cr, idx) => {
                const isSelected = selectedRoleIdx === idx;
                return (
                  <button
                    key={cr.id}
                    onClick={() => {
                      setSelectedRoleIdx(idx);
                      toast.info('Target Karier Diubah', `Menampilkan analisis kompetensi untuk ${cr.name}`);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-md scale-[1.02]'
                        : 'bg-gray-50/70 text-text-secondary border-border hover:bg-gray-100 hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="text-[20px]" name={cr.icon} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-brand-light text-brand'}`}>
                        {cr.match}% Cocok
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-text'}`}>{cr.name}</p>
                      <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-brand-light' : 'text-text-muted'}`}>{cr.salary}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Radar Chart & Dynamic Skill Matrix ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Radar Chart */}
            <div className="card p-5 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-base font-bold text-text">Radar Kompetensi</h3>
                  <Icon className="text-brand text-[20px]" name="radar" />
                </div>
                <p className="text-xs text-text-secondary mb-4">
                  Perbandingan profil skill Anda terhadap benchmark pasar industri untuk <span className="font-bold text-text">{activeRoleData.name}</span>.
                </p>
                <div className="relative min-h-[280px] flex items-center justify-center">
                  <canvas ref={chartRef} />
                </div>
              </div>
              <div className="pt-3 border-t border-border mt-3 text-center">
                <span className="text-[11px] text-text-muted">
                  Hijau: Penguasaan Anda · Biru Putus-putus: Standar Industri
                </span>
              </div>
            </div>

            {/* Detailed Skills Gap Matrix */}
            <div className="card p-5 lg:col-span-2 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-text">Matriks Analisis Gap Skill</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Rincian penguasaan skill spesifik untuk posisi {activeRoleData.name}.</p>
                  </div>
                  <Link href="/competency" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                    Peta Kompetensi <Icon className="text-[14px]" name="arrow_forward" />
                  </Link>
                </div>

                <div className="space-y-4 my-4">
                  {activeRoleData.requiredSkills.map(sk => {
                    const diff = sk.targetLevel - sk.userLevel;
                    return (
                      <div key={sk.name} className="p-3 rounded-xl bg-gray-50 border border-gray-200/80">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text text-xs">{sk.name}</span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${sk.status === 'aligned' ? 'bg-emerald-100 text-emerald-800' : sk.status === 'minor_gap' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {sk.status === 'aligned' ? '✓ Siap Industri' : sk.status === 'minor_gap' ? 'Gap Ringan' : 'Gap Kritis'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-brand">{sk.userLevel}%</span>
                            <span className="text-text-muted">/ {sk.targetLevel}% Target</span>
                            {diff > 0 ? (
                              <span className="badge badge-red text-[10px]">-{diff}%</span>
                            ) : (
                              <span className="badge badge-green text-[10px]">✓ Terpenuhi</span>
                            )}
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="relative w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gray-300 rounded-full" style={{ width: `${sk.targetLevel}%` }} />
                          <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${sk.status === 'aligned' ? 'bg-emerald-600' : sk.status === 'minor_gap' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${sk.userLevel}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-muted">Ingin konsultasi kurikulum dengan dosen?</span>
                <Link href="/curriculum" className="font-bold text-brand hover:underline">
                  Lihat Mata Kuliah Penunjang →
                </Link>
              </div>
            </div>
          </div>

          {/* ── AI Learning Roadmap & Live Scraped Jobs Feed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actionable Learning Roadmap */}
            <div className="card p-0 bg-white overflow-hidden">
              <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[18px]" name="checklist" />
                    Rencana Belajar AI (Tutup Skill Gap)
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">Langkah prioritas untuk menguasai kompetensi {activeRoleData.name}.</p>
                </div>
                <span className="badge badge-brand text-xs font-bold">
                  {completedSteps.size} dari {stats.learningRoadmap?.length || 4} Selesai
                </span>
              </div>
              <div className="p-4 space-y-3">
                {stats.learningRoadmap?.map(step => {
                  const isDone = completedSteps.has(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                        isDone ? 'bg-brand-light/60 border-brand-border' : 'bg-white border-border hover:border-brand/40'
                      }`}
                    >
                      <button
                        onClick={() => {
                          const next = new Set(completedSteps);
                          if (next.has(step.id)) next.delete(step.id);
                          else next.add(step.id);
                          setCompletedSteps(next);
                          toast.success(
                            isDone ? 'Ditandai Belum Selesai' : 'Langkah Selesai! 🎉',
                            `Progress modul "${step.skill}" telah diperbarui.`
                          );
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                          isDone ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-text-secondary border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {isDone ? <Icon className="text-[16px]" name="check" /> : step.step}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-brand uppercase">{step.skill}</span>
                          {step.campusCourseLink && (
                            <span className="text-[10px] bg-gray-100 text-text-muted px-1.5 py-0.2 rounded">
                              📚 {step.campusCourseLink}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-bold mt-0.5 ${isDone ? 'text-brand line-through' : 'text-text'}`}>
                          {step.title}
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {step.platform} · {step.duration}
                        </p>
                      </div>

                      {!isDone && (
                        <button
                          onClick={() => toast.info('Membuka Modul', `Mengarahkan ke ${step.platform}... (Simulasi)`)}
                          className="px-2.5 py-1 text-xs font-bold text-brand hover:bg-brand-light rounded-lg border border-brand/20 transition-all flex-shrink-0"
                        >
                          Mulai →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Scraped Jobs Feed */}
            <div className="card p-0 bg-white overflow-hidden">
              <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                    <Icon className="text-brand text-[18px]" name="work" />
                    Lowongan Kerja Terverifikasi (AI Scraper)
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">Lowongan aktif yang cocok dengan profil vokasi Anda.</p>
                </div>
                <span className="badge badge-green text-[10px]">Real-Time Ingestion</span>
              </div>
              <div className="divide-y divide-border">
                {stats.scrapedJobs?.map(job => (
                  <div key={job.id} className="p-4 hover:bg-gray-50/80 transition-colors flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-text text-sm truncate">{job.title}</p>
                        <span className={`badge text-xs font-bold ${job.matchRate >= 80 ? 'badge-green' : 'badge-yellow'}`}>
                          {job.matchRate}% Cocok
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 font-medium">{job.company} · {job.location}</p>
                      <p className="text-xs text-brand font-bold mt-1">{job.salary}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.tags?.map(t => (
                          <span key={t} className="text-[10px] bg-gray-100 text-text-secondary px-2 py-0.5 rounded font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-2">🕒 {job.scrapedAt}</p>
                    </div>
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
