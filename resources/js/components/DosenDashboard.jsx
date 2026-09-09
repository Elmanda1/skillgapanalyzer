import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';


// ─── Dummy data ────────────────────────────────────────────────────────────
const MATAKULIAH_LIST = [
  { nama: 'Pemrograman Web Lanjut', kode: 'IF4012', sks: 3, semester: 5, gapScore: 78, skills: ['React.js','Node.js','REST API'], status: 'Perlu Update' },
  { nama: 'Basis Data',             kode: 'IF3021', sks: 3, semester: 3, gapScore: 62, skills: ['SQL','PostgreSQL','NoSQL'],      status: 'Perlu Update' },
  { nama: 'Jaringan Komputer',      kode: 'IF3031', sks: 3, semester: 3, gapScore: 45, skills: ['TCP/IP','Subnetting'],         status: 'Cukup Baik' },
  { nama: 'Cloud Computing',        kode: 'IF5011', sks: 3, semester: 5, gapScore: 91, skills: ['AWS','Docker','Kubernetes'],   status: 'Kritis' },
  { nama: 'Keamanan Sistem',        kode: 'IF4022', sks: 2, semester: 5, gapScore: 55, skills: ['Firewall','OWASP','VPN'],      status: 'Cukup Baik' },
  { nama: 'Machine Learning',       kode: 'IF5021', sks: 3, semester: 5, gapScore: 84, skills: ['Python','TensorFlow','NumPy'], status: 'Perlu Update' },
];

const USULAN_MATERI = [
  { mk: 'Pemrograman Web Lanjut', materi: 'Tambahkan modul Next.js & Server-Side Rendering', dampak: '+18%', prioritas: 'Tinggi' },
  { mk: 'Basis Data',             materi: 'Perkenalkan Redis & Time-Series DB (InfluxDB)',   dampak: '+12%', prioritas: 'Sedang' },
  { mk: 'Cloud Computing',        materi: 'Praktikum Docker & Kubernetes cluster lokal',     dampak: '+25%', prioritas: 'Tinggi' },
];

// ─── Component ────────────────────────────────────────────────────────────
const GapBadge = ({ score }) => {
  if (score >= 80) return <span className="badge badge-red">{score}%</span>;
  if (score >= 60) return <span className="badge badge-yellow">{score}%</span>;
  return <span className="badge badge-green">{score}%</span>;
};

export default function DosenDashboard({ user }) {
  const toast = useToast();
  const barRef   = useRef(null);
  const barChart = useRef(null);
  const [mataKuliahList, setMataKuliahList] = useState(MATAKULIAH_LIST);
  const [activeMK, setActiveMK] = useState(mataKuliahList[0]);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newMK, setNewMK] = useState({ nama: '', kode: '', sks: 3, semester: 1 });

  const handleAddMK = (e) => {
    e.preventDefault();
    if (!newMK.nama || !newMK.kode) return;
    
    const mkToAdd = {
      ...newMK,
      gapScore: 50 + Math.floor(Math.random() * 40), // Random gap 50-90
      skills: ['Belum ditentukan'],
      status: 'Perlu Update',
    };
    
    const updatedList = [mkToAdd, ...mataKuliahList];
    setMataKuliahList(updatedList);
    setActiveMK(mkToAdd);
    setShowModal(false);
    setNewMK({ nama: '', kode: '', sks: 3, semester: 1 });
    toast.success('Berhasil', `Mata kuliah ${mkToAdd.nama} berhasil ditambahkan.`);
  };

  const handleDetailClick = (mk) => {
    setActiveMK(mk);
    toast.info('Detail Ditampilkan', `Menampilkan detail untuk ${mk.nama} di panel atas.`);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!barRef.current) return;
    if (barChart.current) barChart.current.destroy();

    barChart.current = new Chart(barRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: mataKuliahList.map(m => m.kode),
        datasets: [{
          label: 'Gap Score (%)',
          data: mataKuliahList.map(m => m.gapScore),
          backgroundColor: mataKuliahList.map(m =>
            m.gapScore >= 80 ? '#fca5a5' : m.gapScore >= 60 ? '#fde68a' : '#a7f3d0'
          ),
          borderColor: mataKuliahList.map(m =>
            m.gapScore >= 80 ? '#ef4444' : m.gapScore >= 60 ? '#f59e0b' : '#10b981'
          ),
          borderWidth: 1.5,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1f2937', cornerRadius: 8,
            callbacks: { label: ctx => ` Gap Score: ${ctx.parsed.y}%` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#9ca3af' } },
          y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#9ca3af' }, max: 100, beginAtZero: true },
        }
      }
    });
    return () => { if (barChart.current) barChart.current.destroy(); };
  }, [mataKuliahList]);

  const filtered = mataKuliahList.filter(m =>
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    m.kode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Selamat datang, {user.name.split(',')[0]}!</h1>
        <p className="text-sm text-text-secondary mt-1">
          Dasbor Dosen — {user.department} &nbsp;·&nbsp; {user.institution}
        </p>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Mata Kuliah Diampu', val: mataKuliahList.length.toString(), icon: 'book_2',        iconBg: 'bg-blue-50 text-blue-600' },
          { label: 'MK Status Kritis',   val: '1', icon: 'warning',       iconBg: 'bg-red-50 text-red-500' },
          { label: 'Usulan Materi Baru', val: '3', icon: 'lightbulb',     iconBg: 'bg-amber-50 text-amber-600' },
          { label: 'Avg Gap Score',       val: '69%',icon: 'analytics',   iconBg: 'bg-brand-light text-brand' },
        ].map(m => (
          <div key={m.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
              <Icon className="text-[20px]" name={m.icon} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text">{m.val}</p>
              <p className="text-xs text-text-secondary">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-text mb-1">Gap Score per Mata Kuliah</h2>
          <p className="text-xs text-text-secondary mb-4">Semakin tinggi skor, semakin besar kesenjangan industri.</p>
          <div className="relative min-h-[200px]">
            <canvas ref={barRef} />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-text-secondary">
            {[['bg-green-200','Cukup Baik (< 60%)'],['bg-yellow-200','Perlu Update (60-79%)'],['bg-red-200','Kritis (≥ 80%)']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${c} inline-block border border-gray-200`}/>
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5 flex flex-col">
          <h2 className="font-display text-base font-semibold text-text mb-1">Detail: {activeMK.nama}</h2>
          <p className="text-xs text-text-secondary mb-3">{activeMK.kode} &nbsp;·&nbsp; {activeMK.sks} SKS &nbsp;·&nbsp; Sem {activeMK.semester}</p>
          <div className="mb-3">
            <div className="flex justify-between mb-1"><span className="text-xs text-text-secondary">Gap Score</span><GapBadge score={activeMK.gapScore}/></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${activeMK.gapScore}%`, backgroundColor: activeMK.gapScore >= 80 ? '#ef4444' : activeMK.gapScore >= 60 ? '#f59e0b' : '#064e3b' }}/></div>
          </div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5">Skill yang perlu diperkuat:</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {activeMK.skills.map(s => <span key={s} className="badge badge-blue text-[10px]">{s}</span>)}
          </div>
          <p className="text-xs text-text-muted mt-auto">Klik MK di tabel untuk detail lain.</p>
        </div>
      </div>

      {/* Mata Kuliah table */}
      <div className="card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-display text-base font-semibold text-text">Daftar Mata Kuliah yang Diampu</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-48 lg:w-64">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari MK..."
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand transition-all"/>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-3 text-sm flex items-center gap-1 whitespace-nowrap">
              <Icon className="text-[18px]" name="add" />
              Tambah MK
            </button>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-gray-50 border-b border-border">
            {['MATA KULIAH','KODE','SKS','SEM','GAP SCORE','STATUS','AKSI'].map(h =>
              <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
            )}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.map(mk => (
              <tr key={mk.kode} className={`hover:bg-gray-50 transition-colors cursor-pointer ${activeMK.kode === mk.kode ? 'bg-brand-light/40' : ''}`} onClick={() => setActiveMK(mk)}>
                <td className="px-5 py-3 font-semibold text-text">{mk.nama}</td>
                <td className="px-5 py-3 font-mono text-xs text-text-secondary">{mk.kode}</td>
                <td className="px-5 py-3 text-center">{mk.sks}</td>
                <td className="px-5 py-3 text-center">{mk.semester}</td>
                <td className="px-5 py-3"><GapBadge score={mk.gapScore}/></td>
                <td className="px-5 py-3">
                  <span className={`badge ${mk.status === 'Kritis' ? 'badge-red' : mk.status === 'Perlu Update' ? 'badge-yellow' : 'badge-green'}`}>{mk.status}</span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={(e) => { e.stopPropagation(); handleDetailClick(mk); }} className="text-xs font-semibold text-brand hover:underline flex items-center gap-0.5">
                    Detail <Icon className="text-[14px]" name="chevron_right" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Suggested updates */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-base font-semibold text-text flex items-center gap-2">
            <Icon className="text-[18px] text-brand" name="auto_awesome" />
            Usulan Pembaruan Materi dari AI
          </h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-gray-50 border-b border-border">
            {['MATA KULIAH','USULAN MATERI','DAMPAK KECOCOKAN','PRIORITAS','AKSI'].map(h =>
              <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
            )}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {USULAN_MATERI.map((u, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-text">{u.mk}</td>
                <td className="px-5 py-3.5 text-text-secondary">{u.materi}</td>
                <td className="px-5 py-3.5 font-semibold text-brand">{u.dampak}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${u.prioritas === 'Tinggi' ? 'badge-red' : 'badge-yellow'}`}>{u.prioritas}</span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="btn-primary py-1.5 px-3 text-xs">Terapkan Draft</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah MK */}
      {showModal && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/80 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-display font-bold text-lg text-text">Tambah Mata Kuliah</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text">
                <Icon className="" name="close" />
              </button>
            </div>
            <form onSubmit={handleAddMK} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Nama Mata Kuliah</label>
                <input required type="text" value={newMK.nama} onChange={e => setNewMK({...newMK, nama: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-brand outline-none" placeholder="Contoh: Pemrograman Web"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Kode MK</label>
                  <input required type="text" value={newMK.kode} onChange={e => setNewMK({...newMK, kode: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-brand outline-none" placeholder="IF1234"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">SKS & Semester</label>
                  <div className="flex gap-2">
                    <input required type="number" min="1" max="6" value={newMK.sks} onChange={e => setNewMK({...newMK, sks: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-brand outline-none" placeholder="SKS"/>
                    <input required type="number" min="1" max="8" value={newMK.semester} onChange={e => setNewMK({...newMK, semester: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-brand outline-none" placeholder="Sem"/>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50">Batal</button>
                <button type="submit" className="btn-primary py-2 px-4 text-sm">Simpan MK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
