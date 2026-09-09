import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';

const formatNowDDMMYYYYHHMMSS = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const DEFAULT_AGENTS = [
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

export default function ScrapingAgents() {
  const pageProps = usePage()?.props || {};
  const dbAgents = pageProps.dbAgents;

  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [activeDeployingAgent, setActiveDeployingAgent] = useState(null);

  const [formData, setFormData] = useState({
    domain_url: '',
    agent_code: '',
  });

  const logContainerRef = useRef(null);

  const initialAgents = (dbAgents && dbAgents.length > 0)
    ? dbAgents.map(a => ({
        db_id: a.db_id,
        id: a.id || a.agent_code || 'AGENT-LOKERID-01',
        source: a.sumber || a.source || 'loker.id',
        domain_url: a.domain_url || `https://${a.sumber || 'loker.id'}`,
        status: a.status || 'Active',
        data: a.data || '1.5 GB',
        lastScrap: a.last_scrap || a.lastScrap || formatNowDDMMYYYYHHMMSS(),
      }))
    : DEFAULT_AGENTS;

  const [agentsList, setAgentsList] = useState(initialAgents);

  useEffect(() => {
    if (dbAgents && dbAgents.length > 0) {
      setAgentsList(dbAgents.map(a => ({
        db_id: a.db_id,
        id: a.id || a.agent_code || 'AGENT-LOKERID-01',
        source: a.sumber || a.source || 'loker.id',
        domain_url: a.domain_url || `https://${a.sumber || 'loker.id'}`,
        status: a.status || 'Active',
        data: a.data || '1.5 GB',
        lastScrap: a.last_scrap || a.lastScrap || formatNowDDMMYYYYHHMMSS(),
      })));
    }
  }, [dbAgents]);

  const [logs, setLogs] = useState([
    `[${formatNowDDMMYYYYHHMMSS()}] [SYSTEM] Inisiasi Jaringan Agen Scraping regional...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-LOKERID-01: Terhubung ke portal loker.id.`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-JOBSTREET-01: Memulai crawl index portal jobstreet.co.id...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-TECHINASIA-01: Mengunduh data lowongan tech baru dari id.techinasia.com...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [SUCCESS] AGENT-LOKERID-01: Berhasil mengekstraksi lowongan "DevOps Engineer" — Skill: Docker, K8s, Terraform.`,
    `[${formatNowDDMMYYYYHHMMSS()}] [WARNING] AGENT-KALIBRR-01: Penolakan akses HTTP 429. Mencoba retry mekanisme...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-INDEED-01: Mensinkronkan lowongan terbaru ke basis data pusat...`,
  ]);

  const startStream = (targetDomain, targetAgentCode) => {
    setIsSyncing(true);
    const cleanDomain = targetDomain.replace(/^https?:\/\//, '').replace('www.', '');

    const eventSource = new EventSource(`/scraping/deploy-stream?domain_url=${encodeURIComponent(targetDomain)}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.line) {
          setLogs(prev => [data.line, ...prev.slice(0, 100)]);
        }
        if (data.done) {
          setIsSyncing(false);
          setActiveDeployingAgent(null);
          eventSource.close();
          const nowStr = formatNowDDMMYYYYHHMMSS();
          setAgentsList(prev => prev.map(a => 
            a.source.includes(cleanDomain) || a.id === targetAgentCode
              ? { ...a, status: 'Active', lastScrap: nowStr }
              : a
          ));
          toast.success('Deployment Agen Selesai', `Scraper AI untuk domain ${cleanDomain} berhasil dieksekusi.`);
        }
      } catch (err) {
        console.error('Failed to parse SSE event data', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
      setIsSyncing(false);
      setActiveDeployingAgent(null);
      toast.info('Stream Selesai', 'Sesi stream log agen scraping ditutup.');
    };
  };

  const handleDeployFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.domain_url.trim()) {
      toast.error('URL Domain Diperlukan', 'Masukkan URL domain portal yang valid.');
      return;
    }

    const domainUrl = formData.domain_url.trim();
    const cleanDomain = domainUrl.replace(/^https?:\/\//, '').replace('www.', '');
    const generatedCode = formData.agent_code.trim() || `AGENT-${cleanDomain.split('.')[0].toUpperCase()}-01`;

    setShowDeployModal(false);
    toast.info('Deploying Agen Baru', `Menghubungkan ke engine scraper AI untuk ${cleanDomain}...`);

    const newAgent = {
      id: generatedCode,
      source: cleanDomain,
      domain_url: domainUrl,
      status: 'Syncing',
      data: '0.5 GB',
      lastScrap: formatNowDDMMYYYYHHMMSS(),
    };

    setAgentsList(prev => [newAgent, ...prev]);
    setActiveDeployingAgent(generatedCode);

    if (typeof router !== 'undefined' && router.post) {
      router.post('/scraping/deploy', formData, {
        preserveScroll: true,
        onSuccess: () => {
          startStream(domainUrl, generatedCode);
        },
        onError: () => {
          startStream(domainUrl, generatedCode);
        }
      });
    } else {
      startStream(domainUrl, generatedCode);
    }
  };

  const handleSyncAll = () => {
    if (isSyncing) return;
    toast.info('Sinkronisasi Ulang', 'Menghubungkan ke agen scraper Python real-time (High-Speed Mode)...');
    startStream('https://www.loker.id', 'AGENT-LOKERID-01');
  };

  const jobTitles  = ['Backend Developer','Data Scientist','Frontend Engineer','Security Specialist','Cloud Architect'];
  const skillSets  = [['GraphQL','Node.js','PostgreSQL'],['Python','PyTorch','SQL'],['React','Tailwind','Vite'],['Zero Trust','SIEM','ISO27001'],['AWS','Kubernetes','CI/CD']];
  const portals    = ['loker.id','jobstreet.co.id','id.indeed.com','id.techinasia.com'];

  useEffect(() => {
    if (isSyncing) return;

    const interval = setInterval(() => {
      const agent  = agentsList[Math.floor(Math.random() * agentsList.length)];
      if (!agent) return;
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
    <div className="w-full p-6 md:p-8 animate-fade-in-up relative">

      {/* ── Modal Deploy Agen Baru ── */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-border">
            <div className="flex justify-between items-center pb-4 border-b border-border mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <Icon className="text-brand text-[18px]" name="add_to_queue" />
                </div>
                <h3 className="font-display font-bold text-lg text-text">Deploy Agen Scraper Baru</h3>
              </div>
              <button 
                onClick={() => setShowDeployModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon className="text-[20px]" name="close" />
              </button>
            </div>

            <form onSubmit={handleDeployFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Link Domain Target <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://id.techinasia.com atau https://www.loker.id"
                  value={formData.domain_url}
                  onChange={e => setFormData({ ...formData, domain_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-gray-50"
                />
                <p className="text-[11px] text-text-muted mt-1">Masukkan URL lengkap domain portal lowongan yang akan di-crawl oleh Universal AI Scraper.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                  Kode/ID Agen (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: AGENT-TECHINASIA-01"
                  value={formData.agent_code}
                  onChange={e => setFormData({ ...formData, agent_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-gray-50 font-mono"
                />
              </div>

              <p className="text-[11px] text-brand font-medium mt-1">⚡ High-Speed Mode (16 Parallel Workers, Interval 0.05s) aktif untuk ekstraksi cepat tanpa limitasi.</p>

              <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="btn-outline px-4 py-2 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2"
                >
                  <Icon className="text-[16px]" name="rocket_launch" />
                  Deploy & Jalankan Scraper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowDeployModal(true)}>
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
              {filtered.map(a => {
                const isCurrentSyncing = isSyncing && (activeDeployingAgent === a.id || a.status === 'Syncing');
                return (
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
                      <span className={statusBadge(isCurrentSyncing ? 'Syncing' : a.status)}>
                        {isCurrentSyncing ? 'Syncing' : a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{a.data}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">{a.lastScrap}</td>
                  </tr>
                );
              })}
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
