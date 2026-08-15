import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

// ─── Nav Configs per Role ──────────────────────────────────────────────────
const NAV_BY_ROLE = {
  super_admin: [
    { id: 'dashboard',   label: 'Dasbor',          icon: 'grid_view', href: '/dashboard' },
    { id: 'management',  label: 'Manajemen Kampus', icon: 'domain', href: '/management' },
    { id: 'competency',  label: 'Peta Kompetensi',  icon: 'book_2', href: '/competency' },
    { id: 'ai_analysis', label: 'Analisis AI',       icon: 'auto_awesome', href: '/ai-analysis' },
    { id: 'scraping',    label: 'Agen Scraping',     icon: 'dns', href: '/scraping' },
  ],
  kaprodi: [
    { id: 'dashboard',   label: 'Dasbor',          icon: 'grid_view', href: '/dashboard' },
    { id: 'management',  label: 'Manajemen Kampus', icon: 'domain', href: '/management' },
    { id: 'competency',  label: 'Peta Kompetensi',  icon: 'book_2', href: '/competency' },
    { id: 'ai_analysis', label: 'Analisis AI',       icon: 'auto_awesome', href: '/ai-analysis' },
  ],
  dosen: [
    { id: 'dashboard',   label: 'Dasbor Dosen',     icon: 'grid_view', href: '/dashboard' },
    { id: 'ai_analysis', label: 'Analisis AI',       icon: 'auto_awesome', href: '/ai-analysis' },
    { id: 'competency',  label: 'Peta Kompetensi',   icon: 'book_2', href: '/competency' },
  ],
  mahasiswa: [
    { id: 'dashboard',   label: 'Profil Skill',      icon: 'person', href: '/dashboard' },
    { id: 'skills',      label: 'Manajemen Keahlian',icon: 'psychology', href: '/skills' },
    { id: 'competency',  label: 'Tren Industri',     icon: 'trending_up', href: '/competency' },
    { id: 'jobs',        label: 'Lowongan Kerja',    icon: 'work', href: '/jobs' },
  ],
};

const BOTTOM_NAV = [
  { id: 'settings', label: 'Pengaturan', icon: 'settings', href: '/settings' },
  { id: 'help',     label: 'Bantuan',    icon: 'help_outline', href: '/help' },
];

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: 'bg-brand' },
  kaprodi: { label: 'Kaprodi', color: 'bg-brand' },
  dosen:     { label: 'Dosen',           color: 'bg-brand' },
  mahasiswa: { label: 'Mahasiswa',       color: 'bg-brand' },
};

function NavButton({ item, isActive }) {
  return (
    <Link
      href={item.href}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
        isActive
          ? 'bg-brand-light text-brand font-semibold'
          : 'text-text-secondary hover:bg-gray-100 hover:text-text'
      }`}
    >
      {isActive && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-brand rounded-l-full" />
      )}
      <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-brand' : 'text-text-secondary'}`}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

export default function AppLayout({ children }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const role = auth?.role || 'mahasiswa';
  
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.mahasiswa;
  const roleMeta = ROLE_META[role] ?? ROLE_META.mahasiswa;

  const currentPath = window.location.pathname;

  const handleLogout = () => {
    router.post('/logout');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-page-bg font-sans">
      {/* ── Sidebar ── */}
      <aside className="w-52 fixed inset-y-0 left-0 bg-white border-r border-border flex flex-col z-50">
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[20px]">insights</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm text-text leading-tight">Skill Gap</p>
              <p className="font-display font-bold text-sm text-text leading-tight">Analyzer</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-text truncate">{user?.name || 'User'}</p>
          <p className="text-[11px] text-text-muted truncate mt-0.5">{user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavButton
              key={item.id}
              item={item}
              isActive={currentPath === item.href}
            />
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-0.5">
          {BOTTOM_NAV.map(item => (
            <NavButton
              key={item.id}
              item={item}
              isActive={currentPath === item.href}
            />
          ))}
          <div className="border-t border-border mt-2 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 ml-52 flex flex-col min-h-screen">
        <header className="h-14 sticky top-0 bg-white border-b border-border flex items-center justify-between px-6 z-40">
          <div className="relative w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari kurikulum, skill, atau nodus..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm outline-none transition-all placeholder:text-text-muted font-sans ${
                searchFocused ? 'border-brand ring-2 ring-brand/20 bg-white' : 'border-border'
              }`}
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/help"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${currentPath === '/help' ? 'bg-brand-light text-brand' : 'text-text-secondary hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </Link>
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="w-9 h-9 flex items-center justify-center rounded-full text-text-secondary hover:bg-gray-100 transition-colors relative">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-border p-2 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="font-semibold text-text text-sm">Notifikasi</p>
                  </div>
                  <div className="py-1">
                    <div className="px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <p className="text-sm font-medium text-text">Analisis AI Selesai</p>
                      <p className="text-xs text-text-secondary mt-0.5">Ditemukan 12 gap baru di prodi IF.</p>
                      <p className="text-[10px] text-text-muted mt-1">2 menit yang lalu</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              onClick={handleLogout}
              title="Klik untuk keluar"
              className={`w-9 h-9 flex-shrink-0 rounded-full overflow-hidden border-2 border-border cursor-pointer hover:border-brand transition-colors flex items-center justify-center text-white text-sm font-bold ${roleMeta.color}`}
            >
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 bg-page-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
