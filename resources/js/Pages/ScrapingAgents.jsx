import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';

const formatNowDDMMYYYYHHMMSS = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const AGENTS = [
  { id: 'AGENT-LOKERID-01',    source: 'loker.id',          status: 'Active',  data: '2.4 GB', lastScrap: '09/09/2026 23:30:15' },
  { id: 'AGENT-JOBSTREET-01',  source: 'jobstreet.co.id',   status: 'Active',  data: '1.8 GB', lastScrap: '09/09/2026 23:15:00' },
  { id: 'AGENT-INDEED-01',     source: 'id.indeed.com',     status: 'Syncing', data: '1.2 GB', lastScrap: '09/09/2026 22:45:10' },
  { id: 'AGENT-KALIBRR-01',    source: 'kalibrr.com',       status: 'Active',  data: '0.8 GB', lastScrap: '09/09/2026 21:10:00' },
  { id: 'AGENT-TECHINASIA-01', source: 'id.techinasia.com',  status: 'Active',  data: '0.6 GB', lastScrap: '09/09/2026 20:05:30' },
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
  ERROR:   { color: '#ef4444', label: 'ERROR' },
  SYSTEM:  { color: '#8b5cf6', label: 'SYSTEM' },
};

const parseLog = (log) => {
  const tsMatch = log.match(/^\[(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})\]\s+(.*)/);
  let timestamp = '';
  let content = log;

  if (tsMatch) {
    timestamp = tsMatch[1];
    content = tsMatch[2];
  }

  const match = content.match(/^\[(\w+)\]\s+(.*)/);
  if (match) return { timestamp, type: match[1], message: match[2] };
  return { timestamp, type: 'INFO', message: content };
};

export default function ScrapingAgents({ dbAgents }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const logContainerRef = useRef(null);

  const initialAgents = (dbAgents && dbAgents.length > 0)
    ? dbAgents.map(a => ({
        id: a.id || a.id_code || 'AGENT-LOKERID-01',
        source: a.sumber || a.source || 'loker.id',
        status: a.status || 'Active',
        data: a.data || '1.5 GB',
        lastScrap: a.last_scrap || a.lastScrap || formatNowDDMMYYYYHHMMSS(),
      }))
    : AGENTS;

  const [agentsList, setAgentsList] = useState(initialAgents);

  const [logs, setLogs] = useState([
    `[${formatNowDDMMYYYYHHMMSS()}] [SYSTEM] Inisiasi Jaringan Agen Scraping regional...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-LOKERID-01: Terhubung ke portal loker.id.`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-JOBSTREET-01: Memulai crawl index portal jobstreet.co.id...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-TECHINASIA-01: Mengunduh data lowongan tech baru dari id.techinasia.com...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [SUCCESS] AGENT-LOKERID-01: Berhasil mengekstraksi lowongan "DevOps Engineer" — Skill: Docker, K8s, Terraform.`,
    `[${formatNowDDMMYYYYHHMMSS()}] [WARNING] AGENT-KALIBRR-01: Penolakan akses HTTP 429. Mencoba retry mekanisme...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-INDEED-01: Mensinkronkan lowongan terbaru ke basis data pusat...`,
  ]);

  const handleDeploy = () => {
    toast.info('Deploy Agen', 'Permintaan deployment agen baru sedang diproses...');
  };

  const handleSyncAll = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    toast.info('Sinkronisasi Ulang', 'Menghubungkan ke agen scraper Python real-time...');

    const eventSource = new EventSource('/scraping/sync-stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.line) {
          setLogs(prev => [data.line, ...prev.slice(0, 100)]);
        }
        if (data.done) {
          setIsSyncing(false);
          eventSource.close();
          const nowStr = formatNowDDMMYYYYHHMMSS();
          setAgentsList(prev => prev.map(a => 
            a.source.includes('loker.id') || a.id.includes('LOKERID')
              ? { ...a, status: 'Active', lastScrap: nowStr }
              : a
          ));
          toast.success('Sinkronisasi Ulang Selesai', 'Scraper Python & pengimporan data lowongan berhasil dieksekusi.');
        }
      } catch (err) {
        console.error('Failed to parse SSE event data', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setIsSyncing(false);
      toast.info('Stream Selesai', 'Sesi sinkronisasi ulang log live telah ditutup.');
    };
  };

  const jobTitles  = ['Backend Developer','Data Scientist','Frontend Engineer','Security Specialist','Cloud Architect'];
  const skillSets  = [['GraphQL','Node.js','PostgreSQL'],['Python','PyTorch','SQL'],['React','Tailwind','Vite'],['Zero Trust','SIEM','ISO27001'],['AWS','Kubernetes','CI/CD']];
  const portals    = ['loker.id','jobstreet.co.id','id.indeed.com','id.techinasia.com'];

  useEffect(() => {
    if (isSyncing) return;

    const interval = setInterval(() => {
      const agent  = agentsList[Math.floor(Math.random() * agentsList.length)];
      const jobIdx = Math.floor(Math.random() * jobTitles.length);
      let newLog   = '';
      const nowStr = formatNowDDMMYYYYHHMMSS();
      if (agent.status === 'Active') {
        newLog = `[${nowStr}] [SUCCESS] ${agent.id}: Ekstraksi "${jobTitles[jobIdx]}" (${portals[Math.floor(Math.random()*portals.length)]}) — Skill: [${skillSets[jobIdx].join(', ')}].`;
      } else if (agent.status === 'Syncing') {
        newLog = `[${nowStr}] [INFO] ${agent.id}: Sinkronisasi silang kluster data dengan model normalisasi NLP...`;
      } else {
        newLog = `[${nowStr}] [WARNING] ${agent.id}: Menguji gateway IP proxy alternatif karena rate limits...`;
      }
      setLogs(prev => [newLog, ...prev.slice(0, 50)]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSyncing, agentsList]);

  const filtered = agentsList.filter(a =>
    a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCounts = { Active: 0, Syncing: 0, Error: 0 };
  agentsList.forEach(a => { if (statCounts[a.status] !== undefined) statCounts[a.status]++; });

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Infrastruktur & Jaringan Agen</h1>
          <p className="text-sm text-text-secondary mt-1">Status operasional dan performa nodus crawling data mining lowongan kerja regional.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            className={`btn-outline flex items-center gap-2 ${isSyncing ? 'opacity-70 cursor-not-allowed' : ''}`} 
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            <Icon className={`text-[16px] ${isSyncing ? 'animate-spin' : ''}`} name="refresh" />
            {isSyncing ? 'Sinkronisasi Berjalan...' : 'Sinkronisasi Ulang'}
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleDeploy}>
            <Icon className="text-[16px]" name="add" />
            Deploy Agen Baru
          </button>
        </div>
      </div>

      {/* ── Stat summary ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Agen Aktif',      val: statCounts.Active,  badge: 'badge-green' },
          { label: 'Sinkronisasi',    val: isSyncing ? statCounts.Syncing + 1 : statCounts.Syncing, badge: 'badge-yellow' },
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
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari domain / agen..."
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand transition-all"
              />
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                {['AGEN / ID', 'SUMBER', 'STATUS', 'DATA', 'LAST SCRAP'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                        <Icon className="text-brand text-[14px]" name="dns" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-text">{a.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs font-medium">{a.source}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(isSyncing && (a.source.includes('loker.id') || a.id.includes('LOKERID')) ? 'Syncing' : a.status)}>
                      {isSyncing && (a.source.includes('loker.id') || a.id.includes('LOKERID')) ? 'Syncing' : a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{a.data}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">{a.lastScrap}</td>
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
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
              {isSyncing ? 'Syncing Live...' : 'Live'}
            </span>
          </div>
          <div ref={logContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-gray-950 min-h-[360px] max-h-[480px] font-mono text-xs">
            {logs.map((log, i) => {
              const { timestamp, type, message } = parseLog(log);
              const cfg = LOG_TYPES[type] || LOG_TYPES.INFO;
              return (
                <div key={i} className="flex items-start gap-2 leading-relaxed animate-fade-in font-mono text-[11px]">
                  {timestamp && <span className="text-gray-500 shrink-0">[{timestamp}]</span>}
                  <span className="flex-shrink-0 font-bold" style={{ color: cfg.color }}>[{cfg.label}]</span>
                  <span className="text-gray-300 break-all">{message}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

