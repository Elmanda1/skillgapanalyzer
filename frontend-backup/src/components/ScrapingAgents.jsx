import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const AGENTS = [
  { id: 'JKT-Worker-01', source: 'LinkedIn Jobs', location: 'Jakarta',  status: 'Active',  uptime: '99.98%', data: '1.8 TB' },
  { id: 'JKT-Worker-02', source: 'JobStreet',     location: 'Jakarta',  status: 'Active',  uptime: '99.95%', data: '2.4 TB' },
  { id: 'SBY-Index-01',  source: 'Indeed ID',     location: 'Surabaya', status: 'Syncing', uptime: '99.50%', data: '1.2 TB' },
  { id: 'BDG-Proxy-02',  source: 'Kalibrr',       location: 'Bandung',  status: 'Error',   uptime: '98.50%', data: '0.8 TB' },
  { id: 'MLG-Scout-01',  source: 'TechInAsia',    location: 'Malang',   status: 'Active',  uptime: '99.90%', data: '0.6 TB' },
];


const statusBadge = (s) => {
  if (s === 'Active')  return 'badge badge-green';
  if (s === 'Syncing') return 'badge badge-yellow';
  return 'badge badge-red';
};

const LOG_TYPES = {
  SUCCESS: { color: '#10b981', label: 'SUCCESS' },
  INFO:    { color: '#3b82f6', label: 'INFO' },
  WARNING: { color: '#f59e0b', label: 'WARNING' },
  SYSTEM:  { color: '#8b5cf6', label: 'SYSTEM' },
};

const parseLog = (log) => {
  const match = log.match(/^\[(\w+)\]\s+(.*)/);
  if (match) return { type: match[1], message: match[2] };
  return { type: 'INFO', message: log };
};

export default function ScrapingAgents() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeploy = () => {
    toast.info('Deploy Agen', 'Permintaan deployment agen baru sedang diproses...');
  };

  const handleSyncAll = () => {
    toast.info('Sinkronisasi', 'Mensinkronisasi ulang semua agen scraping...');
  };

  const [logs, setLogs] = useState([
    '[SYSTEM] Inisiasi Jaringan Agen Scraping regional...',
    '[INFO] JKT-Worker-01: Terhubung ke portal LinkedIn Jobs wilayah DKI Jakarta.',
    '[INFO] JKT-Worker-02: Memulai crawl index portal JobStreet...',
    '[INFO] MLG-Scout-01: Mengunduh data lowongan tech baru dari TechInAsia...',
    '[SUCCESS] JKT-Worker-01: Berhasil mengekstraksi lowongan "DevOps Engineer" — Skill: Docker, K8s, Terraform.',
    '[WARNING] BDG-Proxy-02: Penolakan akses HTTP 429. Mencoba retry mekanisme...',
    '[INFO] SBY-Index-01: Mensinkronkan 120 lowongan terbaru ke basis data pusat...',
  ]);

  const jobTitles  = ['Backend Developer','Data Scientist','Frontend Engineer','Security Specialist','Cloud Architect'];
  const skillSets  = [['GraphQL','Node.js','PostgreSQL'],['Python','PyTorch','SQL'],['React','Tailwind','Vite'],['Zero Trust','SIEM','ISO27001'],['AWS','Kubernetes','CI/CD']];
  const portals    = ['LinkedIn Jobs','JobStreet','Indeed ID','TechInAsia'];

  useEffect(() => {
    const interval = setInterval(() => {
      const agent  = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const jobIdx = Math.floor(Math.random() * jobTitles.length);
      let newLog   = '';
      if (agent.status === 'Active') {
        newLog = `[SUCCESS] ${agent.id}: Ekstraksi "${jobTitles[jobIdx]}" (${portals[Math.floor(Math.random()*portals.length)]}) — Skill: [${skillSets[jobIdx].join(', ')}].`;
      } else if (agent.status === 'Syncing') {
        newLog = `[INFO] ${agent.id}: Sinkronisasi silang kluster data dengan model normalisasi NLP...`;
      } else {
        newLog = `[WARNING] ${agent.id}: Menguji gateway IP proxy alternatif karena rate limits...`;
      }
      setLogs(prev => [newLog, ...prev.slice(0, 20)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = AGENTS.filter(a =>
    a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCounts = { Active: 0, Syncing: 0, Error: 0 };
  AGENTS.forEach(a => { if (statCounts[a.status] !== undefined) statCounts[a.status]++; });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Infrastruktur & Jaringan Agen</h1>
          <p className="text-sm text-text-secondary mt-1">Status operasional dan performa nodus crawling data mining lowongan kerja regional.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="btn-outline flex items-center gap-2" onClick={handleSyncAll}>
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Sinkronisasi Ulang
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleDeploy}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Deploy Agen Baru
          </button>
        </div>
      </div>

      {/* ── Stat summary ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Agen Aktif',      val: statCounts.Active,  badge: 'badge-green' },
          { label: 'Sinkronisasi',    val: statCounts.Syncing, badge: 'badge-yellow' },
          { label: 'Error / Offline', val: statCounts.Error,   badge: 'badge-red' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-4">
            <span className={`badge ${s.badge} text-base px-3 py-1.5`}>{s.val}</span>
            <span className="text-sm font-medium text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Agents table + log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Table */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-text">Daftar Agen Aktif</h2>
            <div className="relative w-52">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">search</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari agen..."
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand transition-all"
              />
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                {['AGEN / ID','SUMBER','LOKASI','STATUS','UPTIME','DATA'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center">
                        <span className="material-symbols-outlined text-brand text-[14px]">dns</span>
                      </div>
                      <span className="font-mono text-xs font-semibold text-text">{a.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{a.source}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{a.location}</td>
                  <td className="px-4 py-3"><span className={statusBadge(a.status)}>{a.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-text">{a.uptime}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{a.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live log */}
        <div className="card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-text">Log Live</h2>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-gray-950 min-h-[360px] max-h-[480px] font-mono text-xs">
            {logs.map((log, i) => {
              const { type, message } = parseLog(log);
              const cfg = LOG_TYPES[type] || LOG_TYPES.INFO;
              return (
                <div key={i} className="flex gap-2 leading-relaxed">
                  <span className="flex-shrink-0 font-bold" style={{ color: cfg.color }}>[{cfg.label}]</span>
                  <span className="text-gray-300">{message}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
