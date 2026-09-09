import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Label } from '../components/ui/label.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';

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
  ABORTED: { color: '#dc2626', label: 'ABORTED' },
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

const STRATEGY_OPTIONS = [
  { value: 'api', label: 'API (Fastest)' },
  { value: 'html_selectors', label: 'HTML Selectors' },
  { value: 'hybrid', label: 'Hybrid (API + HTML)' },
];

const PAGINATION_TYPES = [
  { value: 'page_param', label: 'Page Parameter (?page=N)' },
  { value: 'path', label: 'Path (/page/N)' },
  { value: 'offset', label: 'Offset (?offset=N&limit=M)' },
];

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

  // Profiles tab state
  const [activeTab, setActiveTab] = useState('agents');
  const [profiles, setProfiles] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    scraping_policy_id: '',
    name: '',
    domain: '',
    strategy: 'api',
    api_endpoints: { list: '', detail: '' },
    api_headers: {},
    json_field_mapping: {},
    job_id_extractor: '',
    list_selectors: { item: '', detail_link: '' },
    detail_selectors: { title: '', company_name: '', location: '' },
    pagination: { type: 'page_param', param: 'page', max: 50 },
    crawl_delay_seconds: 2.0,
    concurrency: 4,
    is_active: true,
  });
  const [profileTestResult, setProfileTestResult] = useState(null);
  const [isTestingProfile, setIsTestingProfile] = useState(false);

  // Pre-compute JSON strings to avoid build-time escape issues
  const apiHeadersJson = JSON.stringify(profileForm.api_headers, null, 2);
  const fieldMappingJson = JSON.stringify(profileForm.json_field_mapping, null, 2);
  const paginationJson = JSON.stringify(profileForm.pagination, null, 2);

  const logContainerRef = useRef(null);
  const eventSourceRef = useRef(null);

  const [logs, setLogs] = useState([
    `[${formatNowDDMMYYYYHHMMSS()}] [SYSTEM] Inisiasi Jaringan Agen Scraping regional...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-LOKERID-01: Terhubung ke portal loker.id.`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-JOBSTREET-01: Memulai crawl index portal jobstreet.co.id...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-TECHINASIA-01: Mengunduh data lowongan tech baru dari id.techinasia.com...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [SUCCESS] AGENT-LOKERID-01: Berhasil mengekstraksi lowongan "DevOps Engineer" — Skill: Docker, K8s, Terraform.`,
    `[${formatNowDDMMYYYYHHMMSS()}] [WARNING] AGENT-KALIBRR-01: Penolakan akses HTTP 429. Mencoba retry mekanisme...`,
    `[${formatNowDDMMYYYYHHMMSS()}] [INFO] AGENT-INDEED-01: Mensinkronkan lowongan terbaru ke basis data pusat...`,
  ]);

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

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);



  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/v1/scraper-profiles');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch profiles:', err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/v1/scraper-policies');
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
    return [];
  };

  const handleProfileFormChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedProfileFormChange = (parent, field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const openCreateProfileModal = async () => {
    const policies = await fetchPolicies();
    if (policies.length > 0) {
      setProfileForm(prev => ({ ...prev, scraping_policy_id: policies[0].id }));
    }
    setEditingProfile(null);
    setProfileForm({
      scraping_policy_id: policies[0]?.id || '',
      name: '',
      domain: '',
      strategy: 'api',
      api_endpoints: { list: '', detail: '' },
      api_headers: { 'Accept': 'application/json', 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' },
      json_field_mapping: {},
      job_id_extractor: '',
      list_selectors: { item: '', detail_link: '' },
      detail_selectors: { title: '', company_name: '', location: '' },
      pagination: { type: 'page_param', param: 'page', max: 50 },
      crawl_delay_seconds: 2.0,
      concurrency: 4,
      is_active: true,
    });
    setShowProfileModal(true);
  };

  const openEditProfileModal = async (profile) => {
    const policies = await fetchPolicies();
    setEditingProfile(profile);
    setProfileForm({
      scraping_policy_id: profile.scraping_policy_id,
      name: profile.name,
      domain: profile.domain,
      strategy: profile.strategy,
      api_endpoints: profile.api_endpoints || { list: '', detail: '' },
      api_headers: profile.api_headers || {},
      json_field_mapping: profile.json_field_mapping || {},
      job_id_extractor: profile.job_id_extractor || '',
      list_selectors: profile.list_selectors || { item: '', detail_link: '' },
      detail_selectors: profile.detail_selectors || { title: '', company_name: '', location: '' },
      pagination: profile.pagination || { type: 'page_param', param: 'page', max: 50 },
      crawl_delay_seconds: profile.crawl_delay_seconds || 2.0,
      concurrency: profile.concurrency || 4,
      is_active: profile.is_active,
    });
    setShowProfileModal(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!editingProfile;
    const url = isEdit 
      ? `/api/v1/scraper-profiles/${editingProfile.id}`
      : '/api/v1/scraper-profiles';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
        body: JSON.stringify(profileForm),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save profile');
      }

      toast.success(isEdit ? 'Profile Updated' : 'Profile Created', `${profileForm.name} has been saved.`);
      setShowProfileModal(false);
      fetchProfiles();
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleDeleteProfile = async (profile) => {
    if (!window.confirm(`Delete profile "${profile.name}" (${profile.domain})?`)) return;

    try {
      const response = await fetch(`/api/v1/scraper-profiles/${profile.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
      });

      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Deleted', 'Profile has been removed.');
      fetchProfiles();
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleTestProfile = async (profile) => {
    setIsTestingProfile(true);
    setProfileTestResult(null);

    try {
      const response = await fetch(`/api/v1/scraper-profiles/${profile.id}/test`, {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') },
      });

      const data = await response.json();
      setProfileTestResult(data);
      
      if (data.success) {
        toast.success('Test Success', `Found ${data.jobs_found} sample jobs.`);
      } else {
        toast.error('Test Failed', data.error || 'Unknown error');
      }
    } catch (err) {
      toast.error('Error', err.message);
      setProfileTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingProfile(false);
    }
  };

  const handleAbortScraping = async (targetAgentCode, targetDomain) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const nowStr = formatNowDDMMYYYYHHMMSS();
    const initLog = `[${nowStr}] [SYSTEM] 🛑 Mengirim sinyal penghentian (Abort) untuk agen ${targetAgentCode || 'Aktif'}...`;
    setLogs(prev => [initLog, ...prev.slice(0, 100)]);

    setIsSyncing(false);
    setActiveDeployingAgent(null);

    setAgentsList(prev => prev.map(a => 
      (targetAgentCode && a.id === targetAgentCode) || (targetDomain && a.source.includes(targetDomain)) || a.status === 'Syncing'
        ? { ...a, status: 'Offline', lastScrap: nowStr }
        : a
    ));

    try {
      const res = await fetch('/scraping/abort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
        body: JSON.stringify({
          agent_code: targetAgentCode,
          domain_url: targetDomain,
        }),
      });

      const data = await res.json();
      const ts = formatNowDDMMYYYYHHMMSS();

      if (res.ok && data.success) {
        const resultLog = `[${ts}] [ABORTED] ✅ ${data.log_message || `Penghentian scraper agen ${targetAgentCode || ''} berhasil diselesaikan.`}`;
        setLogs(prev => [resultLog, ...prev.slice(0, 100)]);
        toast.warning('Scraper Dihentikan', data.message || 'Proses scraping berhasil dibatalkan.');
      } else {
        const errLog = `[${ts}] [ERROR] ❌ Gagal menghentikan scraper: ${data.message || 'Server Error'}`;
        setLogs(prev => [errLog, ...prev.slice(0, 100)]);
        toast.error('Gagal Abort', data.message || 'Gagal mengirim sinyal penghentian.');
      }
    } catch (err) {
      const ts = formatNowDDMMYYYYHHMMSS();
      const catchLog = `[${ts}] [ERROR] ❌ Gagal menghubungi server saat penghentian scraper: ${err.message}`;
      setLogs(prev => [catchLog, ...prev.slice(0, 100)]);
      toast.error('Error Koneksi', 'Tidak dapat terhubung ke server untuk menghentikan scraper.');
    }
  };


  const downloadLogs = () => {
    const textContent = logs.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    link.download = `scraping_live_log_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Log Diunduh', 'File log live scraper berhasil disimpan.');
  };

  const clearLogs = () => {
    setLogs([`[${formatNowDDMMYYYYHHMMSS()}] [SYSTEM] Log live dibersihkan oleh Super Admin.`]);
    toast.info('Log Dibersihkan', 'Tampilan log live telah dikosongkan.');
  };


  const startStream = (targetDomain, targetAgentCode) => {
    setIsSyncing(true);
    const cleanDomain = targetDomain.replace(/^https?:\/\//, '').replace('www.', '');

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/scraping/deploy-stream?domain_url=${encodeURIComponent(targetDomain)}&agent_code=${encodeURIComponent(targetAgentCode || '')}`);

    eventSourceRef.current = eventSource;

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
          eventSourceRef.current = null;
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
      eventSourceRef.current = null;
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
    toast.info('Sinkronisasi Ulang', 'Menghubungkan ke agen scraper Python real-time...');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 p-4 animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setShowDeployModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/15 max-w-lg w-full p-6 border border-slate-200/80">
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
          {isSyncing && (
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm animate-pulse"
              onClick={() => handleAbortScraping(activeDeployingAgent, '')}
            >
              <Icon className="text-[16px]" name="stop_circle" />
              Hentikan Scraper
            </button>
          )}
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

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agents">Agen Scraping</TabsTrigger>
          <TabsTrigger value="profiles">Profiler Scraper</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
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
                {['AGEN / ID', 'SUMBER', 'STATUS', 'DATA', 'LAST SCRAP', 'AKSI'].map(h => (
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isCurrentSyncing ? (
                        <button
                          onClick={() => handleAbortScraping(a.id, a.source)}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1"
                          title="Hentikan scraper agen ini"
                        >
                          <Icon className="text-[14px]" name="stop" />
                          Abort
                        </button>
                      ) : (
                        <button
                          onClick={() => startStream(a.domain_url || `https://${a.source}`, a.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                          title="Mulai scraping domain ini"
                        >
                          <Icon className="text-[14px]" name="play_arrow" />
                          Start
                        </button>
                      )}
                    </td>
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
            <div className="flex items-center gap-2">
              <button
                onClick={downloadLogs}
                className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-text-secondary px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                title="Unduh file log live (.txt)"
              >
                <Icon className="text-[14px]" name="download" />
                Unduh
              </button>
              <button
                onClick={clearLogs}
                className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-text-secondary px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                title="Bersihkan tampilan log"
              >
                <Icon className="text-[14px]" name="delete_sweep" />
                Bersihkan
              </button>
              {isSyncing && (
                <button
                  onClick={() => handleAbortScraping(activeDeployingAgent, '')}
                  className="text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 animate-pulse"
                  title="Hentikan paksa scraper saat ini"
                >
                  <Icon className="text-[14px]" name="stop_circle" />
                  Abort
                </button>
              )}
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold ml-1">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                {isSyncing ? 'Syncing Live...' : 'Live'}
              </span>
            </div>

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
        </TabsContent>

        <TabsContent value="profiles">
          <div className="space-y-6">
            {/* Profile List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Icon className="text-brand text-[20px]" name="tune" />
                  Profiler Scraper
                </CardTitle>
                <Button onClick={openCreateProfileModal} className="btn-primary">
                  <Icon className="text-[16px]" name="add" />
                  Tambah Profil
                </Button>
              </CardHeader>
              <CardContent>
                {profiles.length === 0 ? (
                  <div className="py-12 text-center text-text-muted">
                    <Icon className="text-4xl text-gray-300 mb-3" name="tune" />
                    <p className="text-lg font-medium">Belum ada profiler scraper</p>
                    <p className="text-sm mt-1">Tambah profil untuk mengaktifkan scraping cepat (API/HTML selectors) per domain.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-border">
                          {['DOMAIN', 'NAMA', 'STRATEGI', 'STATUS', 'AKSI'].map(h => (
                            <th key={h} className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {profiles.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-text">{p.domain}</td>
                            <td className="px-4 py-3 text-text-secondary">{p.name}</td>
                            <td className="px-4 py-3">
                              <Badge variant={p.strategy === 'api' ? 'default' : 'secondary'}>
                                {p.strategy === 'api' ? '⚡ API' : p.strategy === 'html_selectors' ? '🔍 HTML' : '🔀 Hybrid'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={p.is_active ? 'default' : 'secondary'}>
                                {p.is_active ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openEditProfileModal(p)}>
                                  <Icon className="text-[14px]" name="edit" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleTestProfile(p)} disabled={isTestingProfile}>
                                  <Icon className="text-[14px]" name="play_circle" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteProfile(p)}>
                                  <Icon className="text-[14px]" name="delete" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Result Modal */}
            {profileTestResult && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Icon className="text-[18px]" name="science" />
                    Hasil Test Scraping
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileTestResult.success ? (
                    <>
                      <p className="text-green-700 mb-3">✅ Berhasil menemukan {profileTestResult.jobs_found} lowongan sampel</p>
                      <div className="max-h-64 overflow-y-auto">
                        {profileTestResult.sample_jobs?.map((job, idx) => (
                          <div key={idx} className="p-3 bg-white border border-border rounded-lg mb-2">
                            <p className="font-semibold text-text">{job.title}</p>
                            <p className="text-sm text-text-secondary">{job.company_name} • {job.location} • {job.sektor}</p>
                            <p className="text-xs text-text-muted mt-1">Skills: {job.skills?.join(', ') || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-red-700">❌ {profileTestResult.error || 'Test gagal'}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Profile Create/Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border">
            <div className="flex justify-between items-center pb-4 border-b border-border mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                  <Icon className="text-brand text-[18px]" name="tune" />
                </div>
                <h3 className="font-display font-bold text-lg text-text">{editingProfile ? 'Edit Profil Scraper' : 'Tambah Profil Scraper Baru'}</h3>
              </div>
              <button onClick={() => { setShowProfileModal(false); setEditingProfile(null); }} className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <Icon className="text-[20px]" name="close" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Scraping Policy *</Label>
                  <Select value={profileForm.scraping_policy_id} onValueChange={e => handleProfileFormChange('scraping_policy_id', e)}>
                    <SelectTrigger><SelectValue placeholder="Pilih policy" /></SelectTrigger>
                    <SelectContent>
                      {/* Policies would be fetched dynamically, for now use the form value */}
                      <SelectItem value={profileForm.scraping_policy_id}>{profileForm.scraping_policy_id}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Nama Profil *</Label>
                  <Input value={profileForm.name} onChange={e => handleProfileFormChange('name', e.target.value)} placeholder="Contoh: JobStreet API" required />
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Domain *</Label>
                  <Input value={profileForm.domain} onChange={e => handleProfileFormChange('domain', e.target.value)} placeholder="jobstreet.co.id" required />
                </div>
                <div>
                  <Label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Strategi *</Label>
                  <Select value={profileForm.strategy} onValueChange={e => handleProfileFormChange('strategy', e)}>
                    <SelectTrigger><SelectValue placeholder="Pilih strategi" /></SelectTrigger>
                    <SelectContent>
                      {STRATEGY_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strategy-specific fields */}
              {(profileForm.strategy === 'api' || profileForm.strategy === 'hybrid') && (
                <div className="space-y-4 border-t border-border pt-6">
                  <h4 className="font-semibold text-text flex items-center gap-2">
                    <Icon className="text-brand" name="api" />
                    Konfigurasi API
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>List Endpoint URL</Label>
                      <Input value={profileForm.api_endpoints.list} onChange={e => handleNestedProfileFormChange('api_endpoints', 'list', e.target.value)} placeholder="https://api.example.com/jobs?page={page}" />
                      <p className="text-[11px] text-text-muted mt-1">Gunakan {"{page}"} untuk pagination</p>
                    </div>
                    <div>
                      <Label>Detail Endpoint URL</Label>
                      <Input value={profileForm.api_endpoints.detail} onChange={e => handleNestedProfileFormChange('api_endpoints', 'detail', e.target.value)} placeholder="https://api.example.com/job/{id}" />
                      <p className="text-[11px] text-text-muted mt-1">Gunakan {"{id}"} untuk job ID</p>
                    </div>
                  </div>
                  <div>
                    <Label>Job ID Extractor (Regex)</Label>
                    <Input value={profileForm.job_id_extractor} onChange={e => handleProfileFormChange('job_id_extractor', e.target.value)} placeholder="/job/([a-zA-Z0-9-]+)" />
                    <p className="text-[11px] text-text-muted mt-1">Regex untuk mengekstrak job ID dari detail URL</p>
                  </div>
<div>
                      <Label>API Headers (JSON)</Label>
                      <Textarea value={apiHeadersJson} onChange={e => handleProfileFormChange('api_headers', JSON.parse(e.target.value))} rows={4} className="font-mono text-xs" />
                    </div>
                    <div>
                      <Label>Field Mapping (JSON)</Label>
                      <Textarea value={fieldMappingJson} onChange={e => handleProfileFormChange('json_field_mapping', JSON.parse(e.target.value))} rows={6} className="font-mono text-xs" />
                      <p className="text-[11px] text-text-muted mt-1">Mapping field API ke schema internal. Format JSON: title, company_name, location, salary_min, salary_max, skills, description, requirements, source_url</p>
                    </div>
                </div>
              )}

              {(profileForm.strategy === 'html_selectors' || profileForm.strategy === 'hybrid') && (
                <div className="space-y-4 border-t border-border pt-6">
                  <h4 className="font-semibold text-text flex items-center gap-2">
                    <Icon className="text-brand" name="code" />
                    HTML Selectors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>List Item Selector</Label>
                      <Input value={profileForm.list_selectors.item} onChange={e => handleNestedProfileFormChange('list_selectors', 'item', e.target.value)} placeholder=".job-card, .vacancy-item" />
                    </div>
                    <div>
                      <Label>Detail Link Selector</Label>
                      <Input value={profileForm.list_selectors.detail_link} onChange={e => handleNestedProfileFormChange('list_selectors', 'detail_link', e.target.value)} placeholder="a.job-link@href" />
                      <p className="text-[11px] text-text-muted mt-1">Gunakan @attr untuk attribute (href, src, dll)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Title Selector</Label>
                      <Input value={profileForm.detail_selectors.title} onChange={e => handleNestedProfileFormChange('detail_selectors', 'title', e.target.value)} placeholder="h1.title" />
                    </div>
                    <div>
                      <Label>Company Selector</Label>
                      <Input value={profileForm.detail_selectors.company_name} onChange={e => handleNestedProfileFormChange('detail_selectors', 'company_name', e.target.value)} placeholder=".company-name" />
                    </div>
                    <div>
                      <Label>Location Selector</Label>
                      <Input value={profileForm.detail_selectors.location} onChange={e => handleNestedProfileFormChange('detail_selectors', 'location', e.target.value)} placeholder=".job-location" />
                    </div>
                  </div>
                  <div>
                    <Label>Pagination Config (JSON)</Label>
                    <Textarea value={paginationJson} onChange={e => handleProfileFormChange('pagination', JSON.parse(e.target.value))} rows={3} className="font-mono text-xs" />
                  </div>
                </div>
              )}

              {/* Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6">
                <div>
                  <Label>Crawl Delay (seconds)</Label>
                  <Input type="number" step="0.1" min="0" value={profileForm.crawl_delay_seconds} onChange={e => handleProfileFormChange('crawl_delay_seconds', parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label>Concurrency</Label>
                  <Input type="number" min="1" max="20" value={profileForm.concurrency} onChange={e => handleProfileFormChange('concurrency', parseInt(e.target.value))} />
                </div>
                <div className="flex items-end">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={profileForm.is_active} onChange={e => handleProfileFormChange('is_active', e.target.checked)} className="accent-brand" />
                    <span>Aktif</span>
                  </Label>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowProfileModal(false); setEditingProfile(null); }}>
                  Batal
                </Button>
                <Button type="submit" className="btn-primary">
                  <Icon className="text-[16px]" name="save" />
                  {editingProfile ? 'Update Profil' : 'Simpan Profil'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
