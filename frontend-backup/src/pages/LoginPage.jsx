import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

const ROLE_CARDS = [
  {
    role: 'institusi',
    label: 'Admin Institusi',
    sublabel: 'Kaprodi / Pimpinan Kampus',
    icon: 'school',
    iconBg: 'bg-brand text-white',
    description: 'Kelola kurikulum, analisis gap skill, dan ekspor laporan akreditasi.',
  },
  {
    role: 'dosen',
    label: 'Dosen',
    sublabel: 'Pengajar / Koordinator MK',
    icon: 'person_book',
    iconBg: 'bg-brand text-white',
    description: 'Pantau gap per mata kuliah yang diampu dan terima usulan materi baru.',
  },
  {
    role: 'mahasiswa',
    label: 'Mahasiswa',
    sublabel: 'Mahasiswa / Calon Lulusan',
    icon: 'menu_book',
    iconBg: 'bg-brand text-white',
    description: 'Lihat profil skill, rekomendasi karier, dan rencana belajar personalmu.',
  },
];

export default function LoginPage({ onBack }) {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const demoUser = selectedRole
    ? DEMO_USERS.find(u => u.role === selectedRole)
    : null;

  const handleRoleSelect = (role) => {
    const demo = DEMO_USERS.find(u => u.role === role);
    setSelectedRole(role);
    setEmail(demo?.email ?? '');
    setPassword(demo?.password ?? '');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password wajib diisi.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600)); // simulate network
    const result = login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  const quickLogin = (role) => {
    const demo = DEMO_USERS.find(u => u.role === role);
    if (demo) login(demo.email, demo.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-page-bg via-white to-brand/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(6,78,59,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(6,78,59,0.1) 0%, transparent 40%)',
          }}
        />
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm z-50"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
      )}

      <div className="w-full max-w-lg relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="material-symbols-outlined text-white text-3xl">insights</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text">Skill Gap Analyzer</h1>
          <p className="text-sm text-text-secondary mt-1">Sistem Analitik Kurikulum Vokasi</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          <h2 className="font-display text-lg font-bold text-text mb-1">Masuk ke Sistem</h2>
          <p className="text-sm text-text-secondary mb-6">Pilih peran Anda, lalu masuk dengan kredensial.</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {ROLE_CARDS.map(rc => (
              <button
                key={rc.role}
                onClick={() => handleRoleSelect(rc.role)}
                className={`group rounded-2xl border p-4 text-center transition-all duration-300 flex flex-col items-center gap-3 relative overflow-hidden ${
                  selectedRole === rc.role
                    ? 'border-brand bg-brand/5 shadow-md shadow-brand/10'
                    : 'border-gray-200 hover:border-brand/30 bg-white hover:shadow-lg'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 ${selectedRole === rc.role ? 'scale-110' : 'group-hover:scale-110'} ${rc.iconBg} shadow-sm`}>
                  <span className="material-symbols-outlined text-[24px]">{rc.icon}</span>
                </div>
                <div>
                  <p className={`text-xs font-bold leading-tight ${selectedRole === rc.role ? 'text-brand' : 'text-text group-hover:text-brand'}`}>
                    {rc.label}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Role description */}
          {selectedRole && (
            <div className="bg-brand/10 border border-brand/20 rounded-xl px-4 py-3 mb-6 text-xs text-brand-dark flex items-start gap-3 animate-fade-in-up">
              <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0 text-brand">lightbulb</span>
              <span className="leading-relaxed">{ROLE_CARDS.find(r => r.role === selectedRole)?.description}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2">Email Akses</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="Masukkan email..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2">Kata Sandi</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]">lock</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand/30 hover:shadow-brand/40 transition-all transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  Masuk...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  Masuk ke Sistem
                </>
              )}
            </button>
          </form>

          {/* Demo quick-login */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[11px] text-text-muted text-center mb-3">Demo — klik untuk login instan:</p>
            <div className="flex gap-2">
              {ROLE_CARDS.map(rc => (
                <button
                  key={rc.role}
                  onClick={() => quickLogin(rc.role)}
                  className="flex-1 py-2 rounded-lg border border-border text-[11px] font-semibold text-text-secondary hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  {rc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-5">
          Sistem Analitik Skill Gap — KMIPN VIII &nbsp;·&nbsp; Demo v0.1
        </p>
      </div>
    </div>
  );
}
