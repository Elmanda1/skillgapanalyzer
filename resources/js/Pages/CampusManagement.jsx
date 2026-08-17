import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useForm, Link, usePage, router } from '@inertiajs/react';

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

export default function CampusManagement({ 
  dbCourses = [], 
  dbUsers = [], 
  studyPrograms = [],
  campuses = [],
  currentInstitution = 'Seluruh Kampus Terhubung (6 Politeknik)',
  currentProdi = null
}) {
  const toast = useToast();
  const { auth } = usePage().props;
  const userRole = auth?.role || 'mahasiswa';
  const currentUser = auth?.user;

  const [activeTab, setActiveTab] = useState('kurikulum');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(dbUsers.length > 0 ? dbUsers : USERS);
  const [proposals, setProposals] = useState(CURRICULUM_PROPOSALS);
  const [courses, setCourses] = useState(dbCourses.length > 0 ? dbCourses : MASTER_COURSES);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sync state if props change
  useEffect(() => {
    if (dbCourses.length > 0) {
      setCourses(dbCourses);
    }
  }, [dbCourses]);

  useEffect(() => {
    if (dbUsers.length > 0) {
      setUsers(dbUsers);
    }
  }, [dbUsers]);

  // Inertia form to create a new Course
  const courseForm = useForm({
    study_program_id: currentUser?.study_program_id || '',
    code: '',
    name: '',
    semester: '',
    credits: '',
    versi: 'v1',
  });

  // Inertia form to edit a Course
  const editCourseForm = useForm({
    study_program_id: '',
    code: '',
    name: '',
    semester: '',
    credits: '',
    versi: 'v1',
  });

  // Inertia form to create a User
  const userForm = useForm({
    name: '',
    email: '',
    password: '',
    role: 'mahasiswa',
    study_program_id: currentUser?.study_program_id || '',
  });

  // Inertia form to edit a User
  const editUserForm = useForm({
    name: '',
    email: '',
    password: '',
    role: 'mahasiswa',
    study_program_id: '',
  });

  // Automatically update study_program_id when user details load
  useEffect(() => {
    if (currentUser?.study_program_id) {
      courseForm.setData('study_program_id', currentUser.study_program_id);
    }
  }, [currentUser]);

  // Submit create course to Laravel backend
  const handleCreateCourseDb = (e) => {
    e.preventDefault();
    courseForm.post('/management/courses', {
      onSuccess: () => {
        toast.success('Berhasil', 'Mata kuliah baru berhasil ditambahkan.');
        setShowAddCourseModal(false);
        courseForm.reset();
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] || 'Gagal menyimpan mata kuliah.';
        toast.error('Gagal', msg);
      }
    });
  };

  // Submit edit course to Laravel backend
  const handleEditCourseDb = (e) => {
    e.preventDefault();
    if (!selectedCourse?.db_id) return;
    editCourseForm.put(`/management/courses/${selectedCourse.db_id}`, {
      onSuccess: () => {
        toast.success('Berhasil', 'Mata kuliah berhasil diperbarui.');
        setShowEditCourseModal(false);
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] || 'Gagal memperbarui mata kuliah.';
        toast.error('Gagal', msg);
      }
    });
  };

  // Submit create user to Laravel backend
  const handleCreateUserDb = (e) => {
    e.preventDefault();
    userForm.post('/management/users', {
      onSuccess: () => {
        toast.success('Berhasil', 'Pengguna civitas akademika baru berhasil didaftarkan.');
        setShowAddUserModal(false);
        userForm.reset();
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] || 'Gagal mendaftarkan pengguna.';
        toast.error('Gagal', msg);
      }
    });
  };

  // Submit edit user to Laravel backend
  const handleEditUserDb = (e) => {
    e.preventDefault();
    if (!selectedUser?.db_id) return;
    editUserForm.put(`/management/users/${selectedUser.db_id}`, {
      onSuccess: () => {
        toast.success('Berhasil', 'Data civitas akademika berhasil diperbarui.');
        setShowEditUserModal(false);
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] || 'Gagal memperbarui data pengguna.';
        toast.error('Gagal', msg);
      }
    });
  };

  // Submit delete user to Laravel backend
  const handleDeleteUserDb = (user) => {
    if (!user?.db_id) {
      setUsers(users.filter(u => u.id !== user.id));
      toast.info('Dihapus', 'Data dummy pengguna dihapus dari tampilan.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${user.name}?`)) {
      router.delete(`/management/users/${user.db_id}`, {
        onSuccess: () => {
          toast.success('Berhasil', `Akun ${user.name} berhasil dihapus.`);
        },
        onError: () => {
          toast.error('Gagal', 'Tidak dapat menghapus pengguna ini.');
        }
      });
    }
  };

  // Handlers for Proposal Tab
  const handleApprove = (id) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, status: 'Disetujui' } : p));
    toast.success('Usulan Disetujui', 'Pembaruan silabus telah diteruskan ke kurikulum aktif.');
  };

  const handleReject = (id) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, status: 'Ditolak' } : p));
    toast.info('Usulan Ditolak', 'Dosen pengusul akan menerima catatan revisi.');
  };

  // Filters State
  const [selectedRole, setSelectedRole] = useState('all');

  const DEFAULT_CAMPUSES = [
    'Politeknik Negeri Jakarta',
    'Politeknik Negeri Bandung (POLBAN)',
    'Politeknik Elektronika Negeri Surabaya (PENS)',
    'Politeknik Negeri Malang (POLINEMA)',
    'Politeknik Negeri Semarang (POLINES)',
    'Politeknik Negeri Bali (PNB)',
  ];

  const campusList = (campuses && campuses.length > 0) 
    ? (Array.isArray(campuses) ? campuses : Object.values(campuses)) 
    : DEFAULT_CAMPUSES;

  const handleGenerateReport = () => {
    window.open('/management/report', '_blank');
  };

  const getInstitutionName = (u) => {
    if (u.institusi && u.institusi !== '-' && u.institusi !== 'Umum') return u.institusi;
    if (u.studyProgram?.nama_institusi) return u.studyProgram.nama_institusi;
    if (u.study_program?.nama_institusi) return u.study_program.nama_institusi;
    if (u.study_program_id) {
      const sp = studyPrograms.find(s => s.id === u.study_program_id);
      if (sp) return sp.nama_institusi;
    }
    if (u.email?.includes('pnj.ac.id')) return 'Politeknik Negeri Jakarta';
    if (u.email?.includes('polban.ac.id')) return 'Politeknik Negeri Bandung (POLBAN)';
    if (u.email?.includes('pens.ac.id')) return 'Politeknik Elektronika Negeri Surabaya (PENS)';
    if (u.email?.includes('polinema.ac.id')) return 'Politeknik Negeri Malang (POLINEMA)';
    if (u.email?.includes('polines.ac.id')) return 'Politeknik Negeri Semarang (POLINES)';
    if (u.email?.includes('pnb.ac.id')) return 'Politeknik Negeri Bali (PNB)';
    if (u.role?.toLowerCase() === 'super_admin') return 'Kementerian / Nasional';
    return 'Politeknik Negeri Jakarta';
  };

  const getProgramName = (u) => {
    if (u.role?.toLowerCase() === 'super_admin') return 'Pusat Tata Kelola';
    if (u.prodi && u.prodi !== '-' && u.prodi !== 'Umum') {
      return (u.jenjang && u.jenjang !== '-' ? `${u.jenjang} ` : 'S1 ') + u.prodi;
    }
    if (u.study_program_id) {
      const sp = studyPrograms.find(s => s.id === u.study_program_id);
      if (sp) return `${sp.jenjang} ${sp.nama_prodi}`;
    }
    return 'S1 Teknik Informatika';
  };

  const getCourseInstitution = (c) => {
    if (c.institusi && c.institusi !== '-' && c.institusi !== 'Umum') return c.institusi;
    if (c.studyProgram?.nama_institusi) return c.studyProgram.nama_institusi;
    if (c.study_program_id) {
      const sp = studyPrograms.find(s => s.id === c.study_program_id);
      if (sp) return sp.nama_institusi;
    }
    if (c.code?.startsWith('PNJ')) return 'Politeknik Negeri Jakarta';
    if (c.code?.startsWith('PLB')) return 'Politeknik Negeri Bandung (POLBAN)';
    if (c.code?.startsWith('PNS')) return 'Politeknik Elektronika Negeri Surabaya (PENS)';
    if (c.code?.startsWith('PLM')) return 'Politeknik Negeri Malang (POLINEMA)';
    if (c.code?.startsWith('PLS')) return 'Politeknik Negeri Semarang (POLINES)';
    if (c.code?.startsWith('PNB')) return 'Politeknik Negeri Bali (PNB)';
    return 'Politeknik Negeri Jakarta';
  };

  const getCourseProgram = (c) => {
    if (c.prodi && c.prodi !== '-' && c.prodi !== 'Umum') {
      return (c.jenjang && c.jenjang !== '-' ? `${c.jenjang} ` : 'S1 ') + c.prodi;
    }
    if (c.study_program_id) {
      const sp = studyPrograms.find(s => s.id === c.study_program_id);
      if (sp) return `${sp.jenjang} ${sp.nama_prodi}`;
    }
    return 'S1 Teknik Informatika';
  };

  const filteredUsers = users.map(u => ({
    ...u,
    institusiText: getInstitutionName(u),
    prodiText: getProgramName(u),
  })).filter(u => {
    const matchCampus = selectedCampus === 'all' || u.institusiText === selectedCampus;
    const matchRole = selectedRole === 'all' || u.role?.toLowerCase() === selectedRole.toLowerCase();
    const matchSearch = !searchQuery || (
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.prodiText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.institusiText?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchCampus && matchRole && matchSearch;
  });

  const filteredCourses = courses.map(c => ({
    ...c,
    institusiText: getCourseInstitution(c),
    prodiText: getCourseProgram(c),
  })).filter(c => {
    const matchCampus = selectedCampus === 'all' || c.institusiText === selectedCampus;
    const matchSearch = !searchQuery || (
      c.nama?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.prodiText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institusiText?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchCampus && matchSearch;
  });

  const getCampusBadgeColor = (inst) => {
    if (!inst) return 'bg-gray-100 text-gray-700 border-gray-200';
    if (inst.includes('Jakarta') || inst.includes('PNJ')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (inst.includes('Bandung') || inst.includes('POLBAN')) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (inst.includes('Surabaya') || inst.includes('PENS')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    if (inst.includes('Malang') || inst.includes('POLINEMA')) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    if (inst.includes('Semarang') || inst.includes('POLINES')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (inst.includes('Bali') || inst.includes('PNB')) return 'bg-purple-50 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-brand-light text-brand text-xs font-bold px-2.5 py-0.5 rounded-full">
              {userRole === 'super_admin' ? 'Tata Kelola Vokasi Nasional' : 'Administrasi Kampus'}
            </span>
            <span className="text-xs text-text-muted">·</span>
            <span className="text-xs text-text-muted">
              {userRole === 'super_admin' ? 'Multi-Institusi' : currentInstitution}
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-brand">domain</span>
            {userRole === 'super_admin' ? 'Manajemen Multi-Kampus & Civitas' : `Manajemen Institusi — ${currentInstitution}`}
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl">
            {userRole === 'super_admin'
              ? 'Pusat kendali administratif untuk mengawasi 6 Politeknik Negeri terintegrasi, master data kurikulum, pemetaan kompetensi, dan akun civitas akademika.'
              : 'Pusat kendali administratif institusi untuk mengelola civitas akademika, usulan silabus dosen, dan data kurikulum program studi.'}
          </p>
        </div>

        {/* Global Action / Stats */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateReport}
            className="px-4 py-2.5 bg-white border border-border hover:bg-gray-50 text-text rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-brand">picture_as_pdf</span>
            Ekspor Akreditasi
          </button>
        </div>
      </div>

      {/* ── Quick Filter Toolbar (Multi-Campus & Search) ── */}
      <div className="bg-white border border-border rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
        {/* Campus Filter Selector */}
        {userRole === 'super_admin' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-brand text-[18px]">school</span>
                Pilih Kampus / Politeknik:
              </span>
              <span className="text-xs text-text-muted font-medium">
                {selectedCampus === 'all' ? 'Menampilkan 6 Politeknik' : selectedCampus}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCampus('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCampus === 'all'
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-gray-50 text-text-secondary border-border hover:bg-gray-100 hover:text-text'
                }`}
              >
                🌟 Semua Kampus (6 Politeknik)
              </button>
              {campusList.map(cName => {
                const isSelected = selectedCampus === cName;
                const shortLabel = cName.replace('Politeknik Negeri ', 'Poltek ').replace('Politeknik Elektronika Negeri ', 'PENS ');
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => setSelectedCampus(cName)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-gray-50 text-text-secondary border-border hover:bg-gray-100 hover:text-text'
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Secondary Filter & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-3 border-t border-border">
          {/* Internal Tabs */}
          <div className="flex items-center bg-gray-100/80 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: 'pengguna', label: 'Civitas Akademika', icon: 'group', count: filteredUsers.length },
              { id: 'kurikulum', label: 'Data Kurikulum', icon: 'menu_book', count: filteredCourses.length },
              { id: 'akreditasi', label: 'Laporan Akreditasi', icon: 'workspace_premium' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-brand-light text-brand' : 'bg-gray-200 text-gray-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Action */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, email, kampus, prodi..."
                className="w-full pl-9 pr-8 py-2 border border-border rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {activeTab === 'pengguna' ? (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="btn-primary px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Tambah Akun
              </button>
            ) : activeTab === 'kurikulum' ? (
              <button
                onClick={() => setShowAddCourseModal(true)}
                className="btn-primary px-3.5 py-2 text-xs rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Tambah MK
              </button>
            ) : null}
          </div>
        </div>

        {/* Role Pills if in Pengguna Tab */}
        {activeTab === 'pengguna' && (
          <div className="flex items-center gap-2 pt-2 border-t border-dashed border-gray-200">
            <span className="text-[11px] font-semibold text-text-muted">Peran:</span>
            {['all', 'kaprodi', 'dosen', 'mahasiswa', 'super_admin'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedRole === r
                    ? 'bg-brand text-white font-bold'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {r === 'all' ? 'Semua Peran' : r === 'super_admin' ? 'Super Admin' : r === 'kaprodi' ? 'Admin Institusi' : r === 'dosen' ? 'Dosen' : 'Mahasiswa'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab Content Container ── */}
      <div className="card p-0 overflow-hidden bg-white border border-border rounded-2xl shadow-sm">
        
        {/* 1. Pengguna (Civitas Akademika) */}
        {activeTab === 'pengguna' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    {['ID', 'NAMA & EMAIL', 'PERAN', 'INSTITUSI / KAMPUS', 'PROGRAM STUDI', 'STATUS', 'AKSI'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredUsers.map(u => {
                    const roleColor = u.role.toLowerCase() === 'dosen' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : u.role.toLowerCase() === 'super_admin' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : u.role.toLowerCase() === 'kaprodi' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-teal-50 text-teal-700 border-teal-200';

                    const roleLabel = u.role.toLowerCase() === 'kaprodi' ? 'Admin Institusi' : u.role;

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-text-secondary">{u.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {u.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-text text-sm">{u.name}</p>
                              <p className="text-xs text-text-muted font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${roleColor}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${getCampusBadgeColor(u.institusiText)}`}>
                            <span className="material-symbols-outlined text-[15px]">domain</span>
                            <span>{u.institusiText}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-text">
                            {u.prodiText}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedUser(u);
                                editUserForm.setData({
                                  name: u.name,
                                  email: u.email || '',
                                  password: '',
                                  role: u.role.toLowerCase(),
                                  study_program_id: studyPrograms.find(sp => sp.nama_prodi === u.prodi)?.id || '',
                                });
                                setShowEditUserModal(true);
                              }}
                              className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-lg transition-all"
                              title="Edit Pengguna"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteUserDb(u)} 
                              className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Hapus Pengguna"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-xs text-text-muted">
                        <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">person_off</span>
                        Tidak ada akun civitas akademika yang cocok dengan kriteria pencarian/filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Kurikulum */}
        {activeTab === 'kurikulum' && (
          <div className="divide-y divide-border">
            {/* Master Kurikulum Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-border">
                    {['KODE MK', 'NAMA MATA KULIAH', 'SKS / SMT', 'INSTITUSI / KAMPUS', 'PROGRAM STUDI', 'GAP SCORE', 'AKSI'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredCourses.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-brand bg-brand-light/30 rounded-r-none">
                        {c.code || '-'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-text">{c.nama}</td>
                      <td className="px-5 py-4 text-xs text-text-secondary">
                        Semester {c.semester || '3'} · {c.sks} SKS
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${getCampusBadgeColor(c.institusiText)}`}>
                          <span className="material-symbols-outlined text-[15px]">domain</span>
                          <span>{c.institusiText}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-secondary">
                        <span className="font-semibold text-text">{c.prodiText}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${c.gap > 70 ? 'bg-red-50 text-red-700 border-red-200' : c.gap > 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          Gap: {c.gap}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedCourse(c);
                              editCourseForm.setData({
                                code: c.code || '',
                                name: c.nama || '',
                                semester: c.semester || '3',
                                credits: c.sks || '3',
                                versi: 'v1',
                                study_program_id: c.study_program_id || '',
                              });
                              setShowEditCourseModal(true);
                            }}
                            className="p-1.5 text-text-muted hover:text-brand hover:bg-brand-light rounded-lg transition-all"
                            title="Edit Mata Kuliah"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <Link 
                            href={c.db_id ? `/curriculum/courses/${c.db_id}` : '#'} 
                            className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Detail Kurikulum"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                          <button 
                            onClick={() => handleDeleteCourseDb(c)} 
                            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Mata Kuliah"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCourses.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-xs text-text-muted">
                        <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">menu_book</span>
                        Tidak ada mata kuliah yang cocok dengan kriteria pencarian/filter.
                      </td>
                    </tr>
                  )}
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
                            <button onClick={() => handleApprove(p.id)} className="px-3 py-1 bg-brand text-white rounded text-xs font-semibold hover:bg-brand-dark transition-colors">Setujui</button>
                            <button onClick={() => handleReject(p.id)} className="px-3 py-1 border border-red-200 text-red-600 rounded text-xs font-semibold hover:bg-red-50 transition-colors">Tolak</button>
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

      {/* ── Add Course Modal ── */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-border overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">book_2</span>
                Tambah Mata Kuliah Baru
              </h3>
              <button 
                onClick={() => setShowAddCourseModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddCourseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="modal-code">Kode MK</label>
                <input
                  id="modal-code"
                  type="text"
                  required
                  placeholder="cth: TI-401"
                  value={courseForm.data.code}
                  onChange={e => courseForm.setData('code', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="modal-name">Nama Mata Kuliah</label>
                <input
                  id="modal-name"
                  type="text"
                  required
                  placeholder="cth: Pemrograman Web Enterprise"
                  value={courseForm.data.name}
                  onChange={e => courseForm.setData('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="modal-semester">Semester</label>
                  <input
                    id="modal-semester"
                    type="number"
                    min="1"
                    max="12"
                    required
                    placeholder="cth: 4"
                    value={courseForm.data.semester}
                    onChange={e => courseForm.setData('semester', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="modal-credits">SKS</label>
                  <input
                    id="modal-credits"
                    type="number"
                    min="1"
                    max="12"
                    required
                    placeholder="cth: 3"
                    value={courseForm.data.credits}
                    onChange={e => courseForm.setData('credits', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                  />
                </div>
              </div>

              {/* Study Program select */}
              {userRole === 'super_admin' ? (
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="modal-prodi">Program Studi</label>
                  <select
                    id="modal-prodi"
                    required
                    value={courseForm.data.study_program_id}
                    onChange={e => courseForm.setData('study_program_id', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer font-sans text-text"
                  >
                    <option value="">Pilih Program Studi</option>
                    {studyPrograms.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.jenjang} {sp.nama_prodi} - {sp.nama_institusi}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-gray-50 border border-border rounded-lg p-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase">Program Studi Terpilih</p>
                  <p className="text-sm font-semibold text-text mt-0.5">
                    {studyPrograms.find(sp => sp.id === currentUser?.study_program_id)
                      ? `${studyPrograms.find(sp => sp.id === currentUser?.study_program_id).jenjang} ${studyPrograms.find(sp => sp.id === currentUser?.study_program_id).nama_prodi}`
                      : 'Prodi Anda'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border hover:bg-gray-100 rounded-lg text-sm font-semibold text-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={courseForm.processing}
                  className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {courseForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Course Modal ── */}
      {showEditCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-border overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">edit</span>
                Edit Mata Kuliah
              </h3>
              <button 
                onClick={() => setShowEditCourseModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditCourseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-modal-code">Kode MK</label>
                <input
                  id="edit-modal-code"
                  type="text"
                  required
                  value={editCourseForm.data.code}
                  onChange={e => editCourseForm.setData('code', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-modal-name">Nama Mata Kuliah</label>
                <input
                  id="edit-modal-name"
                  type="text"
                  required
                  value={editCourseForm.data.name}
                  onChange={e => editCourseForm.setData('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-modal-semester">Semester</label>
                  <input
                    id="edit-modal-semester"
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={editCourseForm.data.semester}
                    onChange={e => editCourseForm.setData('semester', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-modal-credits">SKS</label>
                  <input
                    id="edit-modal-credits"
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={editCourseForm.data.credits}
                    onChange={e => editCourseForm.setData('credits', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                  />
                </div>
              </div>

              {userRole === 'super_admin' ? (
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-modal-prodi">Program Studi</label>
                  <select
                    id="edit-modal-prodi"
                    required
                    value={editCourseForm.data.study_program_id}
                    onChange={e => editCourseForm.setData('study_program_id', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer font-sans text-text"
                  >
                    <option value="">Pilih Program Studi</option>
                    {studyPrograms.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.jenjang} {sp.nama_prodi} - {sp.nama_institusi}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-gray-50 border border-border rounded-lg p-3">
                  <p className="text-[10px] font-bold text-text-muted uppercase">Program Studi</p>
                  <p className="text-sm font-semibold text-text mt-0.5">
                    {studyPrograms.find(sp => sp.id === editCourseForm.data.study_program_id)
                      ? `${studyPrograms.find(sp => sp.id === editCourseForm.data.study_program_id).jenjang} ${studyPrograms.find(sp => sp.id === editCourseForm.data.study_program_id).nama_prodi}`
                      : '—'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCourseModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border hover:bg-gray-100 rounded-lg text-sm font-semibold text-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editCourseForm.processing}
                  className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editCourseForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-border overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">person_add</span>
                Tambah Pengguna Baru
              </h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="user-name">Nama Lengkap</label>
                <input
                  id="user-name"
                  type="text"
                  required
                  placeholder="cth: Ahmad Fauzi"
                  value={userForm.data.name}
                  onChange={e => userForm.setData('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  type="email"
                  required
                  placeholder="cth: ahmad@pnj.ac.id"
                  value={userForm.data.email}
                  onChange={e => userForm.setData('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="user-password">Password</label>
                <input
                  id="user-password"
                  type="password"
                  required
                  placeholder="Minimal 8 karakter"
                  value={userForm.data.password}
                  onChange={e => userForm.setData('password', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="user-role">Peran</label>
                  <select
                    id="user-role"
                    required
                    value={userForm.data.role}
                    onChange={e => userForm.setData('role', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer font-sans text-text"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="kaprodi">Kaprodi</option>
                    <option value="dosen">Dosen</option>
                    <option value="mahasiswa">Mahasiswa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="user-prodi">Program Studi</label>
                  <select
                    id="user-prodi"
                    value={userForm.data.study_program_id}
                    onChange={e => userForm.setData('study_program_id', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer font-sans text-text"
                  >
                    <option value="">Pilih Program Studi (Opsional)</option>
                    {studyPrograms.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.jenjang} {sp.nama_prodi}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border hover:bg-gray-100 rounded-lg text-sm font-semibold text-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={userForm.processing}
                  className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {userForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-border overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-gray-50 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-text flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">edit</span>
                Edit Data Pengguna
              </h3>
              <button 
                onClick={() => setShowEditUserModal(false)}
                className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-user-name">Nama Lengkap</label>
                <input
                  id="edit-user-name"
                  type="text"
                  required
                  value={editUserForm.data.name}
                  onChange={e => editUserForm.setData('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-user-email">Email</label>
                <input
                  id="edit-user-email"
                  type="email"
                  required
                  value={editUserForm.data.email}
                  onChange={e => editUserForm.setData('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-user-password">Password Baru <span className="font-normal text-text-muted">(kosongkan jika tidak diubah)</span></label>
                <input
                  id="edit-user-password"
                  type="password"
                  placeholder="Ketik password baru jika ingin mengubah"
                  value={editUserForm.data.password}
                  onChange={e => editUserForm.setData('password', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-user-role">Peran</label>
                  <select
                    id="edit-user-role"
                    required
                    value={editUserForm.data.role}
                    onChange={e => editUserForm.setData('role', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer font-sans text-text"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="kaprodi">Kaprodi</option>
                    <option value="dosen">Dosen</option>
                    <option value="mahasiswa">Mahasiswa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="edit-user-prodi">Program Studi</label>
                  <select
                    id="edit-user-prodi"
                    value={editUserForm.data.study_program_id}
                    onChange={e => editUserForm.setData('study_program_id', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer font-sans text-text"
                  >
                    <option value="">Pilih Program Studi (Opsional)</option>
                    {studyPrograms.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.jenjang} {sp.nama_prodi}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border hover:bg-gray-100 rounded-lg text-sm font-semibold text-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editUserForm.processing}
                  className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editUserForm.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
