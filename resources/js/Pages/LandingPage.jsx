import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavBar } from '@/components/ui/tubelight-navbar';
import { CinematicFooter } from '@/components/ui/motion-footer';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { BrandLogo } from '@/components/BrandLogo';
import { JOB_PORTALS, TECH_SKILLS } from '@/components/BrandLogosData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Home,
  Sparkles,
  PlayCircle,
  Users,
  Workflow,
  HelpCircle,
  Check,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  BarChart3,
  TrendingUp,
  GraduationCap,
  UserCheck,
  Database,
  Cpu,
  FileCheck,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

const navItems = [
  { name: 'Beranda', id: 'hero' },
  { name: 'Latar Belakang', id: 'fitur' },
  { name: 'Simulasi', id: 'live-demo' },
  { name: 'Peran', id: 'untuk-siapa' },
  { name: 'Cara Kerja', id: 'cara-kerja' },
];





// ─── Component 2: Live Interactive Dashboard Mockup ─────────────────────────
function LiveDashboardPreview() {
  const [activeTab, setActiveTab] = useState('gap-map');
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2026-Q1');

  const skillsData = [
    { name: 'Docker', rate: 35, jobs: '1.4K', status: 'Kritis', desc: 'Containerization & Multi-stage builds' },
    { name: 'Kubernetes', rate: 28, jobs: '980', status: 'Kritis', desc: 'Cluster orchestration & Ingress' },
    { name: 'CI/CD', rate: 45, jobs: '1.2K', status: 'Kritis', desc: 'GitHub Actions & Automated Testing' },
    { name: 'React.js', rate: 88, jobs: '2.1K', status: 'Sesuai', desc: 'Component Architecture & Hooks' },
    { name: 'Laravel', rate: 82, jobs: '1.8K', status: 'Sesuai', desc: 'Eloquent ORM & RESTful APIs' },
    { name: 'PostgreSQL', rate: 74, jobs: '1.6K', status: 'Minor Gap', desc: 'Indexing & Database Performance' },
    { name: 'Redis Cache', rate: 40, jobs: '890', status: 'Kritis', desc: 'In-memory caching & queues' },
    { name: 'Cloud AWS', rate: 32, jobs: '1.1K', status: 'Kritis', desc: 'EC2, S3, IAM & Cloud Architecture' },
  ];

  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Glow Backdrop */}
      <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-400/20 to-emerald-600/10 blur-xl opacity-70 -z-10" />

      {/* Main Glass Dashboard Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/90 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-emerald-950/10">
        {/* Browser Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/90 dark:bg-slate-950/80 border-b border-gray-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400/90" />
              <div className="w-3 h-3 rounded-full bg-amber-400/90" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
            </div>
            <span className="hidden sm:inline-block ml-2 text-gray-400 dark:text-gray-500 font-mono text-[11px]">
              https://app.skillgapanalyzer.id/gap-map
            </span>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              aria-label="Pilih Periode Analisis"
              className="bg-transparent border-none outline-hidden cursor-pointer text-gray-700 dark:text-gray-200 text-[11px]"
            >
              <option value="2026-Q1">Periode: 2026 Q1</option>
              <option value="2025-Q4">Periode: 2025 Q4</option>
            </select>
          </div>
        </div>

        {/* Dashboard Sub-nav tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-4 py-2 bg-gray-50/40 dark:bg-slate-950/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('gap-map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'gap-map'
                  ? 'bg-emerald-800 dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              Peta Kesenjangan
            </button>
            <button
              onClick={() => setActiveTab('kpi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'kpi'
                  ? 'bg-emerald-800 dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              KPI & Metrik
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Data Live loker.id
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-4 sm:p-5">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2.5 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-300 uppercase">Skill Terpetakan</p>
              <p className="font-display text-lg font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">14,208</p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">+342 minggu ini</span>
            </div>
            <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 rounded-xl p-2.5 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] font-semibold text-rose-900 dark:text-rose-300 uppercase">Gap Kritis</p>
              <p className="font-display text-lg font-bold text-rose-950 dark:text-rose-100 mt-0.5">42 Skill</p>
              <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">Butuh revisi RPS</span>
            </div>
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl p-2.5 transition-transform hover:-translate-y-0.5">
              <p className="text-[10px] font-semibold text-blue-900 dark:text-blue-300 uppercase">Keselarasan</p>
              <p className="font-display text-lg font-bold text-blue-950 dark:text-blue-100 mt-0.5">70.4%</p>
              <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">+12.5% YoY</span>
            </div>
          </div>

          {/* Interactive Chart Area */}
          <div className="bg-gray-50/70 dark:bg-slate-950/60 rounded-xl p-3 border border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
                <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                Kesesuaian Skill vs Permintaan Pasar (Hover Batang)
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-700 dark:bg-emerald-500" /> Sesuai
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-rose-500" /> Gap Kritis
                </span>
              </div>
            </div>

            {/* Interactive Bars */}
            <div className="flex items-end gap-1.5 sm:gap-2 h-36 pt-4 pb-1 px-1">
              {skillsData.map((item, idx) => {
                const isCritical = item.rate < 60;
                const isHovered = hoveredSkill?.name === item.name;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredSkill(item)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 relative ${
                        isCritical
                          ? isHovered
                            ? 'bg-rose-600 scale-x-105'
                            : 'bg-rose-400/90 dark:bg-rose-500/80'
                          : isHovered
                          ? 'bg-emerald-900 dark:bg-emerald-500 scale-x-105'
                          : 'bg-emerald-700 dark:bg-emerald-600'
                      }`}
                      style={{ height: `${item.rate}%` }}
                    >
                      {/* Live Bar Top Value */}
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.rate}%
                      </span>
                    </div>
                    <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detail Tooltip Bar on Hover */}
            <div className="mt-2 pt-2 border-t border-gray-200/70 dark:border-slate-800 min-h-[32px] flex items-center justify-between text-xs">
              {hoveredSkill ? (
                <div className="flex items-center justify-between w-full text-emerald-950 dark:text-emerald-300 font-medium">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hoveredSkill.rate >= 60 ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                    <strong>{hoveredSkill.name}:</strong> {hoveredSkill.desc}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {hoveredSkill.jobs} lowongan · Status: {hoveredSkill.status}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-[11px] italic">
                  Arahkan kursor pada diagram untuk menginspeksi detail kompetensi spesifik...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge 1 (Top Right) */}
      <div className="absolute -top-4 -right-2 sm:-right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl dark:shadow-black/50 border border-gray-100 dark:border-slate-800 p-3 animate-float hidden sm:block">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Match Rate Vokasi</p>
            <p className="font-display text-base font-bold text-emerald-950 dark:text-emerald-100 leading-none mt-0.5">
              70.4% <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">+12.5%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Badge 2 (Bottom Left) */}
      <div className="absolute -bottom-5 -left-2 sm:-left-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl dark:shadow-black/50 border border-gray-100 dark:border-slate-800 px-3.5 py-2.5 animate-float-slow hidden sm:flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100">42 Skill Kritis Terdeteksi</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Rekomendasi revisi RPS siap diekspor</p>
        </div>
      </div>
    </div>
  );
}

// ─── Component 3: Live Interactive Curriculum Studio (Split Layout) ─────────
function LiveDemoSection() {
  const sampleCourses = {
    cloud: {
      name: 'Cloud Computing & Arsitektur Server',
      code: 'MK-CC501',
      semester: 'Semester 5',
      sks: '3 SKS',
      baseScore: 62,
      currentSkills: ['Linux Administration', 'VirtualBox & Hypervisor', 'Apache Server', 'MySQL DB', 'Bash Shell Script'],
      gapSkills: [
        { name: 'Docker & Multi-Stage Builds', urgency: 'Kritis', jobs: '1.420 Lowongan' },
        { name: 'Kubernetes Pods & Ingress', urgency: 'Kritis', jobs: '980 Lowongan' },
        { name: 'CI/CD GitHub Actions', urgency: 'Tinggi', jobs: '1.240 Lowongan' },
      ],
      recommendation: 'Perlu menambahkan modul praktikum Docker multi-stage build dan automated deployment pipeline pada pertemuan ke-6 hingga ke-9.',
    },
    web: {
      name: 'Pemrograman Web Lanjut & Full-Stack',
      code: 'MK-PW402',
      semester: 'Semester 4',
      sks: '4 SKS',
      baseScore: 71,
      currentSkills: ['HTML5 & Modern CSS', 'PHP Dasar & OOP', 'Bootstrap 5 UI', 'REST API Client', 'SQL Queries'],
      gapSkills: [
        { name: 'React.js Component Architecture', urgency: 'Kritis', jobs: '2.150 Lowongan' },
        { name: 'TailwindCSS Modern Layout', urgency: 'Tinggi', jobs: '1.800 Lowongan' },
        { name: 'Automated Testing (PHPUnit/Jest)', urgency: 'Kritis', jobs: '940 Lowongan' },
      ],
      recommendation: 'Modernisasi stack frontend ke framework reaktif berbasis komponen dan sertakan praktikum unit testing otomatis.',
    },
    ai: {
      name: 'Kecerdasan Buatan Terapan & Data Science',
      code: 'MK-AI603',
      semester: 'Semester 6',
      sks: '3 SKS',
      baseScore: 58,
      currentSkills: ['Python Fundamentals', 'Numpy & Pandas Wrangling', 'Klasifikasi K-Means', 'Linear Regression'],
      gapSkills: [
        { name: 'LangChain & RAG LLM Pipeline', urgency: 'Kritis', jobs: '860 Lowongan' },
        { name: 'FastAPI Microservice Deployment', urgency: 'Tinggi', jobs: '1.120 Lowongan' },
        { name: 'PyTorch / HuggingFace Fine-Tuning', urgency: 'Kritis', jobs: '750 Lowongan' },
      ],
      recommendation: 'Fokuskan praktikum pada model retrieval-augmented generation (RAG) dan deployment API model AI menggunakan FastAPI/Docker.',
    },
    net: {
      name: 'Sistem Jaringan & Cyber Security',
      code: 'MK-NS304',
      semester: 'Semester 3',
      sks: '3 SKS',
      baseScore: 66,
      currentSkills: ['TCP/IP Protocol Suite', 'Cisco Packet Tracer', 'Subnetting & VLAN', 'Network Troubleshooting', 'Firewall Rules'],
      gapSkills: [
        { name: 'Cloud VPC & Security Groups', urgency: 'Kritis', jobs: '1.050 Lowongan' },
        { name: 'Penetration Testing & OWASP', urgency: 'Tinggi', jobs: '890 Lowongan' },
        { name: 'Zero Trust Network Architecture', urgency: 'Tinggi', jobs: '640 Lowongan' },
      ],
      recommendation: 'Sertakan studi kasus pengamanan cloud VPC serta simulasi audit kerentanan web berbasis standar OWASP Top 10.',
    },
  };

  const [selectedKey, setSelectedKey] = useState('cloud');
  const [includeLab, setIncludeLab] = useState(true);
  const [includeCert, setIncludeCert] = useState(false);

  const course = sampleCourses[selectedKey];
  const calculatedScore = Math.min(
    98,
    course.baseScore + (includeLab ? 15 : 0) + (includeCert ? 10 : 0)
  );

  const getStatus = (score) => {
    if (score >= 85) return { label: 'Sangat Selaras Industri', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 70) return { label: 'Selaras dengan Catatan', color: 'text-teal-700 bg-teal-50 border-teal-200' };
    return { label: 'Kesenjangan Kritis', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const status = getStatus(calculatedScore);

  return (
    <section id="live-demo" className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/60 dark:bg-slate-900/90 border-y border-gray-200 dark:border-slate-800 transition-colors lazy-section">
      <div className="max-w-7xl mx-auto">
        {/* Split Two-Column Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: Context & Interactive Controls (5 cols) ── */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="space-y-3">
              <span className="badge badge-green text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-700 dark:text-emerald-400" />
                Simulasi Interaktif
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                Simulasi Evaluasi Capaian Mata Kuliah
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                Pilih contoh mata kuliah vokasi untuk melihat perbandingan materi silabus dengan kebutuhan keterampilan yang sedang dicari di bursa kerja.
              </p>
            </div>

            {/* Course Selector Cards */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Pilih Mata Kuliah untuk Diuji:
              </p>
              {Object.entries(sampleCourses).map(([key, item]) => {
                const isSelected = selectedKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedKey(key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-emerald-700 dark:border-emerald-500 shadow-md shadow-emerald-950/5 ring-2 ring-emerald-700/20 dark:ring-emerald-500/20'
                        : 'bg-white/70 dark:bg-slate-900/70 border-gray-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-emerald-900 dark:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        <BookOpen size={16} />
                      </div>
                      <div className="truncate">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-950 dark:text-emerald-200' : 'text-gray-800 dark:text-gray-200'}`}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {item.code} · {item.semester} ({item.sks})
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Simulation Parameters / Toggles */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 shadow-xs space-y-3">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <Layers size={15} className="text-emerald-700 dark:text-emerald-400" />
                Parameter Intervensi Kurikulum:
              </p>
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Sertakan Praktikum Lab Mandiri
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold ml-1">(+15% Skor)</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeLab}
                  onChange={(e) => setIncludeLab(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs border-t border-gray-100 dark:border-slate-800">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Standar Akreditasi LAM-INFOKOM
                  <span className="text-teal-700 dark:text-teal-400 font-bold ml-1">(+10% Skor)</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeCert}
                  onChange={(e) => setIncludeCert(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-emerald-700 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Live Interactive Simulation Board (7 cols) ── */}
          <div className="lg:col-span-7">
            <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl rounded-2xl relative overflow-hidden">
              
              {/* Header: Course Title & Animated Match Rate Gauge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
                    <span className="font-mono text-emerald-800 dark:text-emerald-400 font-bold">{course.code}</span>
                    <span>·</span>
                    <span>{course.semester} · {course.sks}</span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug">
                    {course.name}
                  </h3>
                </div>

                {/* Live Animated Score Gauge */}
                <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-slate-950/70 p-3 rounded-xl border border-gray-200/80 dark:border-slate-800 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Indeks Keselarasan
                    </p>
                    <p className="font-display text-3xl font-black text-emerald-950 dark:text-emerald-300 leading-none mt-0.5">
                      {calculatedScore}%
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${status.color}`}>
                    {status.label}
                  </div>
                </div>
              </div>

              {/* Progress Bar Visualizer */}
              <div className="mt-4 mb-6">
                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: `${calculatedScore}%` }}
                  />
                </div>
              </div>

              {/* Side-by-Side Breakdown: Current RPS vs Industry Gap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Current Syllabus Topics */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <Check size={14} className="text-emerald-700 dark:text-emerald-400" />
                      Materi Terpenuhi di RPS
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 font-mono">
                      {course.currentSkills.length} Topik
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {course.currentSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-900 dark:text-emerald-200 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Industry Skills */}
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-rose-600 dark:text-rose-400" />
                      Kesenjangan Kritis Industri
                    </span>
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 font-mono">
                      {course.gapSkills.length} Gap
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {course.gapSkills.map((gap, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-rose-900/60 text-[11px] shadow-2xs"
                      >
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate mr-2">{gap.name}</span>
                        <span className="text-rose-700 dark:text-rose-400 font-mono text-[10px] font-bold whitespace-nowrap">
                          {gap.jobs}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-950 text-white flex items-start gap-3.5 shadow-md">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={16} />
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-left">
                  <span className="font-bold text-emerald-300 block mb-0.5">
                    Rekomendasi Revisi Kurikulum dari NLP Engine:
                  </span>
                  <p className="text-gray-300">{course.recommendation}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Ingin memetakan seluruh program studi kampus Anda?
                </span>
                <Link
                  href="/login"
                  className="gradient-brand-cta text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:opacity-95 transition-opacity whitespace-nowrap"
                >
                  Analisis Seluruh Prodi
                  <ArrowRight size={14} />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Component 4: Persona Tabs Switcher ("Untuk Siapa") ─────────────────────
function PersonaTabsSection() {
  const [activePersona, setActivePersona] = useState('kaprodi');

  const personas = {
    kaprodi: {
      id: 'kaprodi',
      icon: GraduationCap,
      role: 'Ketua Program Studi',
      headline: 'Pemantauan Keselarasan Kurikulum Program Studi',
      desc: 'Melihat rekapitulasi ketercapaian kompetensi industri pada seluruh mata kuliah untuk bahan evaluasi kurikulum dan akreditasi.',
      benefits: [
        'Dashboard ringkasan keselarasan kurikulum per semester dan program studi',
        'Ekspor matriks kesenjangan kompetensi untuk kelengkapan dokumen akreditasi',
        'Identifikasi kebutuhan teknologi industri terkini untuk pembaruan kurikulum',
        'Pengelolaan data mata kuliah dan silabus secara terstruktur',
      ],
      previewBadge: 'Akses Kaprodi',
      previewTitle: 'Rekapitulasi Keselarasan Kurikulum',
      previewStat: '78.5% Rata-rata Keselarasan Mata Kuliah',
    },
    dosen: {
      id: 'dosen',
      icon: UserCheck,
      role: 'Dosen Pengampu',
      headline: 'Evaluasi Materi dan Silabus Perkuliahan',
      desc: 'Mengevaluasi kesesuaian materi mata kuliah yang diampu dengan keterampilan teknis yang sedang dicari di bursa kerja.',
      benefits: [
        'Analisis kesenjangan spesifik per mata kuliah terhadap kualifikasi lowongan',
        'Rekomendasi topik praktikum dan teknologi industri yang relevan',
        'Daftar referensi kompetensi teknis yang sering dibutuhkan di bidang terkait',
        'Dokumen pendukung untuk penyusunan dan revisi Rencana Pembelajaran Semester (RPS)',
      ],
      previewBadge: 'Akses Dosen',
      previewTitle: 'Evaluasi Silabus & RPS',
      previewStat: 'Rekomendasi Topik Praktikum Tersedia',
    },
    mahasiswa: {
      id: 'mahasiswa',
      icon: BookOpen,
      role: 'Mahasiswa',
      headline: 'Pemetaan Kesiapan Kompetensi Karir',
      desc: 'Melihat keterkaitan mata kuliah yang telah diambil dengan kebutuhan kualifikasi industri untuk mempersiapkan portofolio mandiri.',
      benefits: [
        'Pemetaan kecocokan mata kuliah yang telah ditempuh dengan lowongan kerja aktif',
        'Identifikasi keterampilan tambahan yang perlu dipelajari secara mandiri',
        'Daftar lowongan kerja yang relevan dengan kompetensi yang dikuasai',
        'Panduan persiapan kompetensi teknis sebelum magang industri',
      ],
      previewBadge: 'Akses Mahasiswa',
      previewTitle: 'Kesiapan Kompetensi Karir',
      previewStat: '84% Kesesuaian Kualifikasi',
    },
  };

  const current = personas[activePersona];

  return (
    <section id="untuk-siapa" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/70 dark:bg-slate-950/90 transition-colors lazy-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge badge-blue mb-3 inline-flex">Persona Beragam, Satu Tujuan</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dibuat untuk Seluruh Ekosistem Pendidikan Vokasi
          </h2>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Setiap pemangku kepentingan mendapatkan antarmuka terpersonalisasi yang dirancang khusus untuk mempercepat link and match.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 shadow-sm max-w-full overflow-x-auto">
            {Object.values(personas).map((p) => {
              const isActive = activePersona === p.id;
              const RoleIcon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePersona(p.id)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-800 dark:bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <RoleIcon className="w-4 h-4" />
                  {p.role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Persona Content Box */}
        <div className="card p-6 sm:p-10 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 shadow-lg rounded-2xl animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Benefits & Description */}
            <div className="lg:col-span-7 space-y-5">
              <span className="badge badge-green text-xs font-semibold uppercase tracking-wide">
                {current.previewBadge}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-snug">
                {current.headline}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                {current.desc}
              </p>

              <div className="pt-2 space-y-3">
                {current.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Role Mini Card */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  {React.createElement(current.icon, { className: "w-28 h-28" })}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                      Live Workspace Preview
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-white mb-1">
                    {current.previewTitle}
                  </h4>
                  <p className="text-xs text-emerald-200/90 mb-6">
                    Terintegrasi dengan basis data kurikulum dan scraping loker.id terdistribusi.
                  </p>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15">
                    <p className="text-[11px] text-emerald-200 font-medium">Metrik Kunci</p>
                    <p className="font-display text-xl font-extrabold text-white mt-0.5">
                      {current.previewStat}
                    </p>
                  </div>
                  <div className="mt-5">
                    <Link
                      href={`/login?role=${current.id}`}
                      className="w-full py-2.5 bg-white text-emerald-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                    >
                      Buka Dashboard {current.role.split(' ')[0]}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Component 5: Animated Process Timeline ("Cara Kerja") ──────────────────
function ProcessTimelineSection() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      step: 1,
      tag: 'Fase 01',
      icon: Database,
      title: 'Ekstraksi Data Lowongan Kerja Otomatis',
      summary: 'Agen scraping terdistribusi mengumpulkan ribuan lowongan dari portal kerja nasional (loker.id, Glints, JobStreet).',
      detail: 'Model NLP Named Entity Recognition (NER) mengekstrak entitas skill, kualifikasi teknis, sertifikasi, serta rentang gaji yang dibutuhkan industri secara periodik.',
      badge: 'Continuous Ingestion',
    },
    {
      step: 2,
      tag: 'Fase 02',
      icon: Cpu,
      title: 'Analisis Kesenjangan & Semantic Vector Matching',
      summary: 'Dokumen kurikulum dan Learning Outcome mata kuliah dipetakan ke dalam vektor semantik.',
      detail: 'Algoritma Cosine Similarity menghitung derajat keselarasan materi kuliah terhadap tuntutan industri dan mengklasifikasikannya ke dalam status Sesuai, Minor Gap, atau Kritis.',
      badge: 'AI Powered Engine',
    },
    {
      step: 3,
      tag: 'Fase 03',
      icon: FileCheck,
      title: 'Rekomendasi Konkret & Draft RPS Otomatis',
      summary: 'Sistem merumuskan solusi kurikulum yang siap dieksekusi oleh program studi.',
      detail: 'Dosen dan Kaprodi menerima rekomendasi penambahan topik praktikum terinci, referensi silabus modern, serta matriks kesiapan yang dapat diunduh untuk borang akreditasi.',
      badge: 'Actionable Output',
    },
  ];

  return (
    <section id="cara-kerja" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 transition-colors lazy-section">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="badge badge-gray mb-3 inline-flex">Alur Kerja Sistem</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dari Data Pasar Mentah Menjadi Kurikulum Unggul
          </h2>
          <p className="text-gray-600 mt-3 text-sm sm:text-base">
            Tiga tahapan sistematis tanpa survei manual yang melelahkan.
          </p>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {steps.map((s) => {
            const isActive = activeStep === s.step;
            const StepIcon = s.icon;
            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`card p-5 cursor-pointer transition-all duration-200 border-2 text-left ${
                  isActive
                    ? 'border-emerald-700 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-md -translate-y-1'
                    : 'border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-emerald-800 dark:bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {s.tag}
                  </span>
                  <StepIcon
                    className={`w-5 h-5 ${isActive ? 'text-emerald-800 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}
                  />
                </div>
                <h4 className="font-display text-base font-bold text-gray-900 dark:text-white mb-1 leading-snug">
                  {s.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {s.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Step Deep-Dive Showcase */}
        {steps.map((s) => {
          if (s.step !== activeStep) return null;
          const ActiveStepIcon = s.icon;
          return (
            <div
              key={s.step}
              className="card p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-950 border border-gray-200/90 dark:border-slate-800 shadow-lg rounded-2xl animate-fade-in flex flex-col md:flex-row gap-6 items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-800 dark:bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <ActiveStepIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="badge badge-green text-xs">{s.badge}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Langkah {s.step} dari 3</span>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{s.detail}</p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/login"
                  className="btn-outline text-xs px-4 py-2.5 flex items-center gap-2 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                >
                  Jelajahi Modul
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}



// ─── Component 7: FAQ Accordion Section (Hirael FAQ-05 Pattern) ───────────
const FAQS = [
  {
    id: 'item-1',
    q: 'Apakah Skill Gap Analyzer gratis digunakan oleh institusi pendidikan vokasi?',
    a: 'Ya. Program Studi, Jurusan, maupun institusi Pendidikan Vokasi (Politeknik, D3/D4, S1 Terapan) dapat mengevaluasi keselarasan kurikulum internal secara mandiri tanpa biaya lisensi awal.',
  },
  {
    id: 'item-2',
    q: 'Dari mana basis data kebutuhan lowongan kerja dikumpulkan?',
    a: 'Data dihimpun dan diperbarui secara otomatis dari berbagai portal lowongan kerja nasional (loker.id, Glints, JobStreet). Mesin scraping terdistribusi meng-ingest entitas kualifikasi teknis dan skill yang dibutuhkan industri secara realtime.',
  },
  {
    id: 'item-3',
    q: 'Bagaimana AI mengukur kesenjangan kurikulum secara ilmiah?',
    a: 'Sistem memanfaatkan model NLP Semantic Vector Matching (Cosine Similarity) untuk memetakan teks Rencana Pembelajaran Semester (RPS) & CPL mata kuliah terhadap klaster keterampilan industri guna mengukur derajat keselarasan secara terukur.',
  },
  {
    id: 'item-4',
    q: 'Apakah hasil analisis dapat diekspor untuk akreditasi LAM-INFOKOM / BAN-PT?',
    a: 'Tentu. Sistem menyediakan fitur ekspor otomatis matriks capaian CPL-Industri, laporan tren kompetensi, serta borang evaluasi kurikulum berbasis data pasar kerja yang dapat dilampirkan dalam evaluasi berkala dan borang akreditasi.',
  },
  {
    id: 'item-5',
    q: 'Bagaimana peran Dosen dan Mahasiswa di dalam platform ini?',
    a: 'Dosen pengampu dapat mengidentifikasi topik praktikum terkini untuk memperbarui RPS. Mahasiswa dapat melihat kesesuaian mata kuliah yang telah diambil dengan kualifikasi bursa kerja aktif serta mendapat panduan portofolio mandiri.',
  },
  {
    id: 'item-6',
    q: 'Bagaimana cara memasukkan dokumen kurikulum prodi kami ke dalam sistem?',
    a: 'Cukup unggah berkas RPS (format PDF/Word/JSON) atau masukkan ringkasan capaian mata kuliah pada dashboard prodi. Mesin AI akan langsung mengekstrak entitas kompetensi dan menyajikan peta kesenjangan kurikulum dalam hitungan detik.',
  },
];

function FAQSection() {
  return (
    <section id="faq" data-slot="faq" className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/70 dark:bg-slate-950/90 transition-colors lazy-section">
      <div className="max-w-4xl mx-auto">
        {/* Centered Header outside card */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge badge-gray mb-3 inline-flex">FAQ & Bantuan</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Pertanyaan Umum seputar Platform
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm sm:text-base">
            Hal-hal yang paling sering ditanyakan seputar evaluasi kurikulum vokasi, analisis kesenjangan AI, dan borang akreditasi.
          </p>
        </div>

        {/* Clean Accordion Card */}
        <div className="card p-6 sm:p-10 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 shadow-xl rounded-3xl">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            {FAQS.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="py-0.5">
                <AccordionTrigger className="text-left text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-emerald-800 dark:hover:text-emerald-400">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}


// ─── Main LandingPage ──────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashScroll = () => {
      const hash = window.location.hash ? window.location.hash.replace('#', '') : null;
      const params = new URLSearchParams(window.location.search);
      const targetId = hash || params.get('scrollTo');
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          setTimeout(() => {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }, 150);
        }
      }
    };
    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* ── Tubelight Floating Navbar with Light Lamp ── */}
      <NavBar items={navItems} defaultActive="Beranda" />

      {/* ── Main Content Area (Curtain for Footer Reveal) ── */}
      <main className="relative z-10 w-full bg-white dark:bg-slate-950 dark:text-gray-100 shadow-2xl transition-colors duration-500">
        {/* ── Hero Section ── */}
        <section id="hero" className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 ambient-mesh-glow relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left animate-fade-in-up">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.12] tracking-tight">
                Kurikulum Vokasi yang Selalu{' '}
                <span className="relative inline-block text-emerald-900 dark:text-emerald-400">
                  Relevan
                  <svg className="absolute -bottom-1 left-0 w-full" height="7" viewBox="0 0 200 7">
                    <path
                      d="M0 5 Q100 0 200 5"
                      stroke="#059669"
                      strokeWidth="3.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{' '}
                dengan Industri
              </h1>

              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl">
                Sistem analitik untuk membandingkan capaian pembelajaran kurikulum vokasi dengan data kebutuhan lowongan kerja industri — menghasilkan rekomendasi konkret untuk evaluasi RPS dan akreditasi prodi.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/login"
                  className="gradient-brand-cta text-white font-semibold px-6 py-3.5 rounded-xl text-sm sm:text-base inline-flex items-center gap-2 hover:opacity-95 transition-opacity"
                >
                  Mulai Analisis Gratis
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
                <button
                  onClick={() => {
                    const el = document.getElementById('live-demo');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-outline px-6 py-3.5 rounded-xl text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlayCircle className="w-4.5 h-4.5 text-emerald-800 dark:text-emerald-400" />
                  Coba Demo Mini
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-gray-200/80 dark:border-white/10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  Khusus Pendidikan Vokasi
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  Analisis Semantik Kurikulum
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  Mendukung Akreditasi LAM-INFOKOM
                </span>
              </div>
            </div>

            {/* Hero Right Mockup */}
            <div className="lg:col-span-6 animate-fade-in delay-100">
              <LiveDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Infinite Slider: Integrated Job Portals & Data Ingestion ── */}
      <section className="py-8 bg-white dark:bg-slate-900 border-y border-gray-200/90 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 mb-4 text-center">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest">
            Referensi Data Keterampilan dari Portal Lowongan Kerja & Ekosistem Industri
          </p>
        </div>

        {/* Row 1: Real Job Portals with Vector Logos */}
        <InfiniteSlider
          speed={32}
          items={JOB_PORTALS.map((portal, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-md transition-all group cursor-default"
            >
              {portal.logo}
              <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 whitespace-nowrap">
                {portal.tag}
              </span>
            </div>
          ))}
        />

        {/* Row 2: Real-time Tracked Tech Competencies with Real Vector Icons */}
        <div className="mt-3">
          <InfiniteSlider
            speed={38}
            direction="right"
            items={TECH_SKILLS.map((sk, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs select-none hover:bg-emerald-950 hover:border-emerald-500/50 transition-all border border-slate-800 cursor-default"
              >
                <div className="flex-shrink-0">{sk.icon}</div>
                <span className="font-semibold text-gray-100">{sk.name}</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  {sk.growth}
                </span>
              </div>
            ))}
          />
        </div>
      </section>

      {/* ── Problem & Urgency Section ("Latar Belakang & Tantangan") ── */}
      <section id="fitur" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50/70 dark:bg-slate-950/90 transition-colors lazy-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge badge-gray mb-3 inline-flex">Latar Belakang</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Tantangan Penyelarasan Kurikulum Vokasi
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm sm:text-base">
              Perkembangan kebutuhan industri menuntut evaluasi kurikulum berkala yang didasarkan pada data nyata bursa kerja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">
                Dinamika Kebutuhan Industri
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Kualifikasi teknis dan perangkat kerja di industri terus berkembang, sehingga capaian pembelajaran program studi memerlukan peninjauan berbasis tren pasar riil.
              </p>
            </div>

            <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">
                Kesiapan Kerja Lulusan
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Perekrut memprioritaskan calon lulusan yang menguasai perangkat praktis terkini di samping pemahaman konsep dasar perkuliahan.
              </p>
            </div>

            <div className="card p-6 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2">
                Bukti Dukung Akreditasi
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Evaluasi kurikulum berkala dan borang akreditasi membutuhkan data objektif mengenai keselarasan materi dengan kebutuhan dunia usaha dan industri (DUDI).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Interaktif: Simulasi Evaluasi Capaian Mata Kuliah ── */}
      <LiveDemoSection />

      {/* ── Section "Untuk Siapa": Sasaran Pengguna ── */}
      <PersonaTabsSection />

      {/* ── Section "Cara Kerja": Process Timeline ── */}
      <ProcessTimelineSection />

      {/* ── FAQ ── */}
      <FAQSection />
      </main>

      {/* ── Cinematic Motion Footer with Curtain Reveal ── */}
      <CinematicFooter />
    </div>
  );
}
