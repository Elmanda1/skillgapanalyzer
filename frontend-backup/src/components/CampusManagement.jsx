import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

// Dummy Data
const USERS = [
  { id: 'U001', name: 'Ahmad Fauzi', role: 'Mahasiswa', prodi: 'Teknik Informatika', status: 'Aktif' },
  { id: 'U002', name: 'Budi Santoso, M.Kom', role: 'Dosen', prodi: 'Teknik Informatika', status: 'Aktif' },
  { id: 'U003', name: 'Citra Kirana', role: 'Mahasiswa', prodi: 'Sistem Informasi', status: 'Aktif' },
  { id: 'U004', name: 'Dr. Dian Sastro', role: 'Dosen', prodi: 'Sains Data', status: 'Cuti' },
];

const CURRICULUM_PROPOSALS = [
  { id: 'P01', dosen: 'Budi Santoso, M.Kom', mk: 'Cloud Computing', usulan: 'Praktikum Docker & Kubernetes', tanggal: '2025-10-12', status: 'Menunggu' },
  { id: 'P02', dosen: 'Dr. Dian Sastro', mk: 'Machine Learning', usulan: 'Integrasi LLM & Prompt Engineering', tanggal: '2025-10-15', status: 'Menunggu' },
];

const MASTER_COURSES = [
  { id: 'MK01', nama: 'Pemrograman Web Lanjut', sks: 3, prodi: 'Teknik Informatika', gap: 78 },
  { id: 'MK02', nama: 'Basis Data', sks: 3, prodi: 'Teknik Informatika', gap: 62 },
  { id: 'MK03', nama: 'Jaringan Komputer', sks: 3, prodi: 'Teknik Informatika', gap: 45 },
  { id: 'MK04', nama: 'Cloud Computing', sks: 3, prodi: 'Sistem Informasi', gap: 91 },
];

export default function CampusManagement() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('kurikulum');
  const [users, setUsers] = useState(USERS);
  const [proposals, setProposals] = useState(CURRICULUM_PROPOSALS);
  const [courses, setCourses] = useState(MASTER_COURSES);

  // Users Handlers
  const handleAddUser = () => {
    toast.success('Simulasi', 'Modal tambah pengguna akan muncul di sini.');
  };

  const handleDeleteUser = (id) => {
    if (confirm('Hapus pengguna ini?')) {
      setUsers(users.filter(u => u.id !== id));
      toast.success('Terhapus', 'Pengguna berhasil dihapus.');
    }
  };

  // Curriculum Handlers
  const handleActionProposal = (id, action) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, status: action } : p));
    toast.success('Berhasil', `Usulan telah di${action.toLowerCase()}.`);
  };

  // Report Handler
  const handleGenerateReport = () => {
    toast.info('Memproses Laporan', 'Sedang mengompilasi data kurikulum & industri...');
    setTimeout(() => {
      toast.success('Selesai', 'Laporan_Penyelarasan_Industri_2025.pdf berhasil diunduh.');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-brand">domain</span>
          Manajemen Kampus
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Pusat kendali administratif untuk pengguna, persetujuan kurikulum, dan laporan akreditasi.
        </p>
      </div>

      {/* Internal Tabs */}
      <div className="flex border-b border-border mb-6">
        {[
          { id: 'kurikulum', label: 'Data Kurikulum', icon: 'menu_book' },
          { id: 'pengguna', label: 'Civitas Akademika', icon: 'group' },
          { id: 'akreditasi', label: 'Laporan Akreditasi', icon: 'workspace_premium' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card p-0 overflow-hidden">
        
        {/* 1. Pengguna */}
        {activeTab === 'pengguna' && (
          <div>
            <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50">
              <h2 className="font-display text-base font-semibold text-text">Daftar Civitas Akademika</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-100 bg-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">upload</span> Import CSV
                </button>
                <button onClick={handleAddUser} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">add</span> Tambah Pengguna
                </button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-white border-b border-border">
                {['ID', 'NAMA', 'ROLE', 'PRODI', 'STATUS', 'AKSI'].map(h =>
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary tracking-wide">{h}</th>
                )}
              </tr></thead>
              <tbody className="divide-y divide-border bg-white">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-text-secondary">{u.id}</td>
                    <td className="px-5 py-3 font-medium text-text">{u.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'Dosen' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.prodi}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${u.status === 'Aktif' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button className="text-text-muted hover:text-brand transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-text-muted hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Kurikulum */}
        {activeTab === 'kurikulum' && (
          <div className="flex flex-col gap-6 p-5">
            {/* Master Kurikulum */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="font-display text-base font-semibold text-text">Daftar Mata Kuliah Kampus (Master Data)</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Seluruh mata kuliah yang terdaftar dan skor kesenjangannya (Gap Score).</p>
                </div>
                <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">add</span> Tambah MK Baru
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-white border-b border-border">
                  {['KODE', 'MATA KULIAH', 'SKS', 'PRODI', 'GAP SCORE', 'AKSI'].map(h =>
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary tracking-wide">{h}</th>
                  )}
                </tr></thead>
                <tbody className="divide-y divide-border bg-white">
                  {courses.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-text-secondary">{c.id}</td>
                      <td className="px-5 py-3 font-medium text-text">{c.nama}</td>
                      <td className="px-5 py-3">{c.sks} SKS</td>
                      <td className="px-5 py-3 text-text-secondary">{c.prodi}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${c.gap >= 80 ? 'bg-red-50 text-red-700 border-red-200' : c.gap >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          Gap: {c.gap}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button className="text-text-muted hover:text-brand transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Usulan Kurikulum */}
            <div className="border border-border rounded-xl overflow-hidden mt-4">
              <div className="p-4 border-b border-border bg-gray-50">
                <h2 className="font-display text-base font-semibold text-text flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand text-[18px]">notifications_active</span>
                  Persetujuan Usulan Pembaruan Silabus
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">Review usulan pembaruan materi yang diajukan oleh dosen berdasarkan saran AI.</p>
              </div>
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-white border-b border-border">
                  {['TANGGAL', 'DOSEN', 'MATA KULIAH', 'USULAN PEMBARUAN', 'STATUS', 'AKSI'].map(h =>
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary tracking-wide">{h}</th>
                  )}
                </tr></thead>
                <tbody className="divide-y divide-border bg-white">
                  {proposals.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-xs text-text-secondary">{p.tanggal}</td>
                      <td className="px-5 py-4 font-medium text-text">{p.dosen}</td>
                      <td className="px-5 py-4 font-semibold text-text">{p.mk}</td>
                      <td className="px-5 py-4 text-text-secondary">{p.usulan}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${p.status === 'Disetujui' ? 'bg-green-50 text-green-700 border-green-200' : p.status === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.status === 'Menunggu' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleActionProposal(p.id, 'Disetujui')} className="px-3 py-1 bg-brand text-white rounded text-xs font-semibold hover:bg-brand-dark transition-colors">Setujui</button>
                            <button onClick={() => handleActionProposal(p.id, 'Ditolak')} className="px-3 py-1 border border-red-200 text-red-600 rounded text-xs font-semibold hover:bg-red-50 transition-colors">Tolak</button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Akreditasi */}
        {activeTab === 'akreditasi' && (
          <div className="p-8 text-center bg-white flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center text-brand mb-4">
              <span className="material-symbols-outlined text-[40px]">workspace_premium</span>
            </div>
            <h2 className="font-display text-xl font-bold text-text mb-2">Laporan Penyelarasan Industri</h2>
            <p className="text-sm text-text-secondary max-w-lg mb-8">
              Unduh laporan komprehensif yang berisi metrik kesesuaian kurikulum kampus Anda terhadap tren keahlian industri terkini. Sangat direkomendasikan untuk dilampirkan pada instrumen akreditasi BAN-PT.
            </p>
            <button onClick={handleGenerateReport} className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">download</span> Generate PDF Laporan
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
