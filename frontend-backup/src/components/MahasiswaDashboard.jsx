import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { useToast } from '../context/ToastContext';
import { useSkills } from '../context/SkillContext';

// ─── Dummy Data ────────────────────────────────────────────────────────────
const STUDENT = {
  name: 'Ahmad Fauzi',
  nim: '2141720123',
  prodi: 'Teknik Informatika',
  semester: 6,
  ipk: 3.62,
  targetRole: 'Backend Engineer',
  matchScore: 72,
  institution: 'Politeknik Negeri Jakarta',
};

// Removed MY_SKILLS in favor of Context

const SKILL_GAPS = [
  { name: 'Docker & Kubernetes', category: 'Cloud & DevOps',  gap: 60, priority: 'Tinggi',  course: 'Cloud Computing (IF5011)' },
  { name: 'Node.js (Advanced)', category: 'Backend Dev',       gap: 30, priority: 'Tinggi',  course: 'Pemrograman Web Lanjut (IF4012)' },
  { name: 'Python (ML/Data)',   category: 'AI/Data Science',   gap: 15, priority: 'Sedang',  course: 'Machine Learning (IF5021)' },
  { name: 'GraphQL API',        category: 'Backend Dev',       gap: 40, priority: 'Sedang',  course: 'Arsitektur Aplikasi (IF5031)' },
];

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

export default function MahasiswaDashboard({ user }) {
  const toast = useToast();
  const { mySkills } = useSkills();
  const radarRef   = useRef(null);
  const radarChart = useRef(null);

  useEffect(() => {
    if (!radarRef.current) return;
    if (radarChart.current) radarChart.current.destroy();

    radarChart.current = new Chart(radarRef.current.getContext('2d'), {
      type: 'radar',
      data: {
        labels: mySkills.map(s => s.name),
        datasets: [
          {
            label: 'Skill Saya',
            data: mySkills.map(s => s.levelValue),
            backgroundColor: 'rgba(6,78,59,0.12)',
            borderColor: '#064e3b',
            borderWidth: 2,
            pointBackgroundColor: '#064e3b',
            pointRadius: 4,
          },
          {
            label: 'Kebutuhan Industri',
            data: mySkills.map(s => s.required),
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 16 } },
          tooltip: { backgroundColor: '#1f2937', cornerRadius: 8 },
        },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { display: false },
            grid: { color: '#e5e7eb' },
            pointLabels: { font: { family: 'Inter', size: 11 }, color: '#6b7280' },
          }
        }
      }
    });
    return () => { if (radarChart.current) radarChart.current.destroy(); };
  }, [mySkills]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Halo, {STUDENT.name}! 👋</h1>
          <p className="text-sm text-text-secondary mt-1">
            {STUDENT.prodi} — Semester {STUDENT.semester} &nbsp;·&nbsp; NIM {STUDENT.nim}
          </p>
        </div>
        <div className="card px-4 py-3 text-right">
          <p className="text-xs text-text-secondary">Target Karier</p>
          <p className="font-display text-base font-bold text-brand mt-0.5">{STUDENT.targetRole}</p>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="text-xs text-text-secondary">Match Rate:</span>
            <span className="badge badge-green">{STUDENT.matchScore}%</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'IPK',              val: STUDENT.ipk,       icon: 'grade',        iconBg: 'bg-amber-50 text-amber-600' },
          { label: 'Skill Dikuasai',   val: mySkills.length.toString(), icon: 'psychology',   iconBg: 'bg-brand-light text-brand' },
          { label: 'Skill Gap Kritis', val: mySkills.filter(s => s.required - s.levelValue > 20).length.toString(), icon: 'warning',      iconBg: 'bg-red-50 text-red-500' },
          { label: 'Lowongan Cocok',   val: `${JOB_RECS.length}`, icon: 'work_alert', iconBg: 'bg-blue-50 text-blue-600' },
        ].map(m => (
          <div key={m.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
              <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text">{m.val}</p>
              <p className="text-xs text-text-secondary">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Radar + Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card p-5">
          <h2 className="font-display text-base font-semibold text-text mb-1">Profil Skill Saya</h2>
          <p className="text-xs text-text-secondary mb-4">Dibandingkan kebutuhan industri sebagai Backend Engineer.</p>
          <div className="min-h-[260px] relative"><canvas ref={radarRef}/></div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-text mb-1">Skill Gap yang Perlu Ditutup</h2>
          <p className="text-xs text-text-secondary mb-4">Skill berikut sangat dibutuhkan industri tapi masih lemah di profilmu.</p>
          <div className="space-y-4">
            {mySkills.map(sk => {
              const gap = sk.required - sk.levelValue;
              return (
                <div key={sk.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-text">{sk.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-brand font-semibold">{sk.levelValue}%</span>
                      <span className="text-text-muted">/ {sk.required}% target</span>
                      {gap > 0 && <span className="badge badge-red text-[10px]">-{gap}%</span>}
                      {gap <= 0 && <span className="badge badge-green text-[10px]">✓</span>}
                    </div>
                  </div>
                  <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gray-200" style={{ width: `${sk.required}%` }}/>
                    <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all" style={{ width: `${sk.levelValue}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Job recs + Learning path */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Job recommendations */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display text-base font-semibold text-text">Lowongan yang Cocok Untukmu</h2>
            <p className="text-xs text-text-secondary mt-0.5">Berdasarkan profil skill saat ini.</p>
          </div>
          <div className="divide-y divide-border">
            {JOB_RECS.map(job => (
              <div key={job.title} className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{job.title}</p>
                  <p className="text-xs text-text-secondary">{job.company} &nbsp;·&nbsp; {job.location}</p>
                  <p className="text-xs text-brand font-medium mt-0.5">{job.salary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`badge text-xs ${job.match >= 80 ? 'badge-green' : job.match >= 70 ? 'badge-yellow' : 'badge-gray'}`}>
                    {job.match}% cocok
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning path */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display text-base font-semibold text-text">Rencana Belajar AI</h2>
            <p className="text-xs text-text-secondary mt-0.5">Langkah prioritas menuju {STUDENT.targetRole}.</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {LEARNING_PATH.map(step => (
              <div key={step.step} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${step.done ? 'bg-brand-light border-brand-border' : 'bg-white border-border'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${step.done ? 'bg-brand text-white' : 'bg-gray-100 text-text-secondary'}`}>
                  {step.done ? <span className="material-symbols-outlined text-[14px]">check</span> : step.step}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${step.done ? 'text-brand line-through' : 'text-text'}`}>{step.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{step.platform}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-xs text-text-muted">{step.duration}</span>
                  </div>
                </div>
                {!step.done && (
                  <button
                    onClick={() => toast.info('Membuka Modul', `Mengarahkan ke platform ${step.platform}... (Simulasi)`)}
                    className="text-xs font-semibold text-brand hover:underline flex-shrink-0"
                  >
                    Mulai →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
