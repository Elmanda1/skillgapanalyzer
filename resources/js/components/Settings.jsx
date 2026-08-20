import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon.jsx';


const SYSTEM_STATUS = [
  { name: 'API Gateway',    status: 'Online',    badge: 'badge-green' },
  { name: 'Scraping Engine',status: 'Aktif',     badge: 'badge-green' },
  { name: 'Database Sync',  status: 'Menunggu',  badge: 'badge-yellow' },
];

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  
  // Set default active section based on role
  const initialSection = user?.role === 'institusi' ? 'profil' : 'akun';
  const [activeSection, setActiveSection] = useState(initialSection);

  // States for institusi
  const [instName, setInstName]   = useState('Universitas Teknologi Nusantara');
  const [instDomain, setInstDomain] = useState('utn.ac.id');
  const [instFocus, setInstFocus] = useState('Teknologi Informasi, Rekayasa Perangkat Lunak, Sains Data');
  const [syncFreq, setSyncFreq]   = useState('Setiap Hari (00:00 WIB)');
  const [scrapeLimit, setScrapeLimit] = useState(5000);
  const [targets, setTargets] = useState({ linkedin: true, techinasia: true, jobstreet: false });

  // States for dosen/mahasiswa
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileID, setProfileID] = useState(user?.role === 'dosen' ? '0412345678' : '2141720123'); // NIDN or NIM
  const [profileProdi, setProfileProdi] = useState('Teknik Informatika');
  const [targetCareer, setTargetCareer] = useState('Backend Engineer');
  const [notifEmail, setNotifEmail] = useState(true);

  let NAV_ITEMS = [];
  if (user?.role === 'institusi') {
    NAV_ITEMS = [
      { id: 'profil',    label: 'Profil Institusi',    icon: 'domain' },
      { id: 'users',     label: 'Manajemen Pengguna',  icon: 'manage_accounts' },
      { id: 'scraping',  label: 'Konfigurasi Scraping', icon: 'robot_2' },
      { id: 'api',       label: 'Integrasi API',        icon: 'hub' },
    ];
  } else if (user?.role === 'dosen') {
    NAV_ITEMS = [
      { id: 'akun',      label: 'Profil Akun',         icon: 'account_circle' },
      { id: 'notif',     label: 'Preferensi Sistem',   icon: 'tune' },
    ];
  } else {
    NAV_ITEMS = [
      { id: 'akun',      label: 'Profil Akun',         icon: 'account_circle' },
      { id: 'notif',     label: 'Preferensi Notifikasi', icon: 'notifications' },
    ];
  }

  const handleSaveProfil  = (e) => { e.preventDefault(); toast.success('Berhasil', 'Profil institusi berhasil disimpan.'); };
  const handleApplyScraping = () => toast.success('Tersimpan', 'Konfigurasi scraping berhasil diperbarui.');

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Pengaturan {user?.role === 'institusi' ? 'Sistem' : 'Akun'}</h1>
        <p className="text-sm text-text-secondary mt-1">Kelola konfigurasi platform, integrasi, dan preferensi pengguna.</p>
      </div>

      {/* ── Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="space-y-4">

          {/* Nav card */}
          <div className="card overflow-hidden">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors border-b border-border last:border-0 ${
                  activeSection === item.id
                    ? 'bg-brand-light text-brand font-semibold'
                    : 'text-text-secondary hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`text-[18px] ${activeSection === item.id ? 'text-brand' : 'text-text-muted'}`} name={item.icon} />
                  <span>{item.label}</span>
                </div>
                <Icon className="text-[16px] text-text-muted" name="chevron_right" />
              </button>
            ))}
          </div>

          {/* System status (Only for institusi) */}
          {user?.role === 'institusi' && (
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold text-text mb-3">Status Sistem</h3>
              <div className="space-y-3">
                {SYSTEM_STATUS.map(s => (
                  <div key={s.name} className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">{s.name}</span>
                    <span className={`badge ${s.badge}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profil Institusi */}
          {activeSection === 'profil' && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Profil Institusi</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Informasi dasar organisasi dan branding.</p>
                </div>
                <button onClick={handleSaveProfil} className="btn-primary">Simpan</button>
              </div>
              <form onSubmit={handleSaveProfil} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nama Institusi</label>
                    <input
                      value={instName}
                      onChange={e => setInstName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Domain Resmi</label>
                    <input
                      value={instDomain}
                      onChange={e => setInstDomain(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Fokus Industri / Fakultas Utama</label>
                  <input
                    value={instFocus}
                    onChange={e => setInstFocus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Logo Institusi</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-brand hover:bg-brand-light/30 transition-all cursor-pointer">
                    <Icon className="text-3xl text-text-muted block mx-auto mb-2" name="cloud_upload" />
                    <p className="text-sm font-medium text-text-secondary">Klik untuk unggah</p>
                    <p className="text-xs text-text-muted mt-1">SVG, PNG, atau JPG (Maks. 2MB)</p>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Konfigurasi Scraping */}
          {activeSection === 'scraping' && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Konfigurasi Scraping</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Atur frekuensi dan target pengambilan data lowongan kerja.</p>
                </div>
                <button onClick={handleApplyScraping} className="btn-primary">Terapkan</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Frekuensi Sinkronisasi</label>
                  <div className="relative">
                    <select
                      value={syncFreq}
                      onChange={e => setSyncFreq(e.target.value)}
                      className="w-full appearance-none pl-3 pr-8 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 cursor-pointer transition-all"
                    >
                      <option>Setiap Hari (00:00 WIB)</option>
                      <option>Setiap 12 Jam</option>
                      <option>Setiap 6 Jam</option>
                      <option>Manual</option>
                    </select>
                    <Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-[16px] pointer-events-none" name="expand_more" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Batas Pengambilan (Per Siklus)</label>
                  <input
                    type="number"
                    value={scrapeLimit}
                    onChange={e => setScrapeLimit(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-3">Target Sumber Data</label>
                <div className="space-y-3">
                  {[
                    { key: 'linkedin',   label: 'LinkedIn Jobs API (Premium)', connected: true },
                    { key: 'techinasia', label: 'TechInAsia Scraper',          connected: true },
                    { key: 'jobstreet',  label: 'JobStreet API',               connected: false },
                  ].map(t => (
                    <label key={t.key} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={targets[t.key]}
                          onChange={e => setTargets(p => ({ ...p, [t.key]: e.target.checked }))}
                          className="w-4 h-4 rounded accent-brand"
                        />
                        <span className="text-sm font-medium text-text">{t.label}</span>
                      </div>
                      {t.connected
                        ? <span className="badge badge-green">Terkoneksi</span>
                        : <span className="badge badge-gray">Tidak Aktif</span>
                      }
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Manajemen Pengguna */}
          {activeSection === 'users' && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Manajemen Pengguna</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Kelola hak akses dosen, mahasiswa, dan administrator.</p>
                </div>
                <button
                  onClick={() => toast.info('Fitur Terkunci', 'Manajemen pengguna sedang dalam mode read-only.')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Icon className="text-[16px]" name="add" /> Tambah Pengguna
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-border">
                <Icon className="text-4xl text-gray-300 mb-2" name="manage_accounts" />
                <p className="text-sm font-semibold text-text-secondary">Tidak ada daftar pengguna terbaru.</p>
                <p className="text-xs text-text-muted">Integrasi SSO belum dikonfigurasi.</p>
              </div>
            </div>
          )}

          {/* Integrasi API */}
          {activeSection === 'api' && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Integrasi API & Webhook</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Kelola akses kunci API untuk integrasi sistem pihak ketiga.</p>
                </div>
                <button
                  onClick={() => toast.success('API Key Dibuat', 'Kunci API baru berhasil di-generate.')}
                  className="btn-outline flex items-center gap-2"
                >
                  <Icon className="text-[16px]" name="key" /> Generate Key
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-white flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-text">SIAKAD Webhook</p>
                    <p className="text-xs text-text-secondary mt-0.5 font-mono">sk_live_1982j3h102***</p>
                  </div>
                  <span className="badge badge-green">Aktif</span>
                </div>
              </div>
            </div>
          )}

          {/* Profil Akun (Mahasiswa / Dosen) */}
          {activeSection === 'akun' && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Profil Akun</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Kelola informasi pribadi dan data pengguna.</p>
                </div>
                <button onClick={(e) => { e.preventDefault(); toast.success('Tersimpan', 'Profil akun berhasil diperbarui.'); }} className="btn-primary">Simpan</button>
              </div>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nama Lengkap</label>
                    <input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email Akses</label>
                    <input
                      type="email"
                      placeholder="email@kampus.ac.id"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      {user?.role === 'dosen' ? 'NIDN' : 'NIM'}
                    </label>
                    <input
                      value={profileID}
                      onChange={e => setProfileID(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Program Studi</label>
                    <input
                      value={profileProdi}
                      onChange={e => setProfileProdi(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                </div>
                {user?.role === 'mahasiswa' && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Target Karier (Pekerjaan Impian)</label>
                    <input
                      value={targetCareer}
                      onChange={e => setTargetCareer(e.target.value)}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                    />
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Preferensi Notifikasi (Mahasiswa / Dosen) */}
          {activeSection === 'notif' && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Preferensi</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Atur preferensi pemberitahuan dan sistem.</p>
                </div>
                <button onClick={(e) => { e.preventDefault(); toast.success('Tersimpan', 'Preferensi berhasil disimpan.'); }} className="btn-primary">Simpan</button>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifEmail}
                      onChange={e => setNotifEmail(e.target.checked)}
                      className="w-4 h-4 rounded accent-brand"
                    />
                    <span className="text-sm font-medium text-text">Kirim Email Pemberitahuan (Mingguan)</span>
                  </div>
                  <span className="badge badge-gray">Opsional</span>
                </label>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
