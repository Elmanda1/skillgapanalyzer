import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

// Institusi components
import Dashboard    from './components/Dashboard';
import CompetencyMap from './components/CompetencyMap';
import AIAnalysis   from './components/AIAnalysis';
import ScrapingAgents from './components/ScrapingAgents';
import Settings     from './components/Settings';
import Help         from './components/Help';
import CampusManagement from './components/CampusManagement';

// Role-specific components
import DosenDashboard   from './components/DosenDashboard';
import MahasiswaDashboard from './components/MahasiswaDashboard';
import JobBrowser       from './components/JobBrowser';
import SkillManager     from './components/SkillManager';

// ─── Nav Configs per Role ──────────────────────────────────────────────────
const NAV_BY_ROLE = {
  institusi: [
    { id: 'dashboard',   label: 'Dasbor',          icon: 'grid_view' },
    { id: 'management',  label: 'Manajemen Kampus', icon: 'domain' },
    { id: 'competency',  label: 'Peta Kompetensi',  icon: 'book_2' },
    { id: 'ai_analysis', label: 'Analisis AI',       icon: 'auto_awesome' },
    { id: 'scraping',    label: 'Agen Scraping',     icon: 'dns' },
  ],
  dosen: [
    { id: 'dashboard',   label: 'Dasbor Dosen',     icon: 'grid_view' },
    { id: 'ai_analysis', label: 'Analisis AI',       icon: 'auto_awesome' },
    { id: 'competency',  label: 'Peta Kompetensi',   icon: 'book_2' },
  ],
  mahasiswa: [
    { id: 'dashboard',   label: 'Profil Skill',      icon: 'person' },
    { id: 'skills',      label: 'Manajemen Keahlian',icon: 'psychology' },
    { id: 'competency',  label: 'Tren Industri',     icon: 'trending_up' },
    { id: 'jobs',        label: 'Lowongan Kerja',    icon: 'work' },
  ],
};

const BOTTOM_NAV = [
  { id: 'settings', label: 'Pengaturan', icon: 'settings' },
  { id: 'help',     label: 'Bantuan',    icon: 'help_outline' },
];

// Role metadata
const ROLE_META = {
  institusi: { label: 'Admin Institusi', color: 'bg-brand' },
  dosen:     { label: 'Dosen',           color: 'bg-brand' },
  mahasiswa: { label: 'Mahasiswa',       color: 'bg-brand' },
};

// ─── NavButton ─────────────────────────────────────────────────────────────
function NavButton({ item, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
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
    </button>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  // Show login page if not authenticated
  if (!user) {
    if (showLogin) return <LoginPage onBack={() => setShowLogin(false)} />;
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  const navItems  = NAV_BY_ROLE[user.role] ?? NAV_BY_ROLE.institusi;
  const roleMeta  = ROLE_META[user.role]   ?? ROLE_META.institusi;

  const renderContent = () => {
    // Mahasiswa role
    if (user.role === 'mahasiswa') {
      switch (activeTab) {
        case 'dashboard':   return <MahasiswaDashboard user={user} />;
        case 'skills':      return <SkillManager />;
        case 'competency':  return <CompetencyMap />;
        case 'jobs':        return <JobBrowser />;
        case 'settings':    return <Settings />;
        case 'help':        return <Help />;
        default:            return <MahasiswaDashboard user={user} />;
      }
    }
    // Dosen role
    if (user.role === 'dosen') {
      switch (activeTab) {
        case 'dashboard':   return <DosenDashboard user={user} />;
        case 'competency':  return <CompetencyMap />;
        case 'ai_analysis': return <AIAnalysis />;
        case 'settings':    return <Settings />;
        case 'help':        return <Help />;
        default:            return <DosenDashboard user={user} />;
      }
    }
    // Institusi (admin) role — default
    switch (activeTab) {
      case 'dashboard':   return <Dashboard setActiveTab={setActiveTab} />;
      case 'management':  return <CampusManagement />;
      case 'competency':  return <CompetencyMap />;
      case 'ai_analysis': return <AIAnalysis />;
      case 'scraping':    return <ScrapingAgents />;
      case 'settings':    return <Settings />;
      case 'help':        return <Help />;
      default:            return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-page-bg font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-52 fixed inset-y-0 left-0 bg-white border-r border-border flex flex-col z-50">

        {/* Brand */}
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
          {/* Role badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${roleMeta.color}`}>
              {roleMeta.label}
            </span>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-text truncate">{user.name}</p>
          <p className="text-[11px] text-text-muted truncate mt-0.5">{user.institution}</p>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 pb-4 space-y-0.5">
          {BOTTOM_NAV.map(item => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
          <div className="border-t border-border mt-2 pt-2">
            <button
              onClick={logout}
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

        {/* Header */}
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
            <button
              onClick={() => setActiveTab('help')}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${activeTab === 'help' ? 'bg-brand-light text-brand' : 'text-text-secondary hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </button>
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
            {/* Avatar with initials fallback */}
            <div
              onClick={logout}
              title="Klik untuk keluar"
              className={`w-9 h-9 flex-shrink-0 rounded-full overflow-hidden border-2 border-border cursor-pointer hover:border-brand transition-colors flex items-center justify-center text-white text-sm font-bold ${roleMeta.color}`}
            >
              {user.avatarInitials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-page-bg">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
