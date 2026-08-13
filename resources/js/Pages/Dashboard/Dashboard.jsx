import React from 'react';
import { router, usePage } from '@inertiajs/react';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  kaprodi: 'Kaprodi',
  dosen: 'Dosen',
  mahasiswa: 'Mahasiswa',
};

const MISMATCH_LABELS = {
  aligned: 'Aligned',
  over_skill: 'Over Skill',
  under_skill: 'Under Skill',
};

function StatCard({ icon, label, value, tone = 'brand' }) {
  const chipClass = {
    brand: 'bg-brand-light text-brand',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
  }[tone];

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-lg ${chipClass} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <p className="text-xs text-text-secondary font-medium">{label}</p>
      <p className="font-display text-3xl font-bold text-text">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { auth, stats = {} } = usePage().props;
  const user = auth.user;
  const role = auth.role;

  if (!user) return null;

  const handleLogout = () => router.post('/logout');

  const subtitle = {
    super_admin: 'Ringkasan analitik seluruh institusi.',
    kaprodi: stats.studyProgram
      ? `Ringkasan analitik kurikulum ${stats.studyProgram.nama_prodi} (${stats.studyProgram.jenjang}).`
      : 'Ringkasan analitik kurikulum program studi Anda.',
    dosen: 'Ringkasan mata kuliah yang Anda ampu.',
    mahasiswa: 'Selamat datang di Skill Gap Analyzer.',
  }[role] ?? '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-page-bg via-white to-brand/5 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(6,78,59,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(6,78,59,0.1) 0%, transparent 40%)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto p-6 relative z-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-2xl">insights</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-text">Halo, {user.name}</h1>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-light text-brand">
                  {ROLE_LABELS[role] ?? role}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-xl border border-white/50 text-sm font-semibold text-text-secondary hover:text-brand hover:border-brand/30 shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Keluar
          </button>
        </header>

        {/* ─── Super Admin ─── */}
        {role === 'super_admin' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon="data_object" label="Total Skill" value={stats.totalSkills} />
            <StatCard icon="menu_book" label="Total Mata Kuliah" value={stats.totalCourses} />
            <StatCard icon="insights" label="Total Analisis Gap" value={stats.totalGaps} />
            <StatCard icon="warning" label="Gap Mismatch" value={stats.mismatchGaps} tone="red" />
            <StatCard icon="domain" label="Program Studi" value={stats.totalStudyPrograms} />
          </div>
        )}

        {/* ─── Kaprodi ─── */}
        {role === 'kaprodi' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]">school</span>
              </div>
              <div>
                <p className="font-display font-bold text-text">
                  {stats.studyProgram ? `${stats.studyProgram.nama_prodi} — ${stats.studyProgram.jenjang}` : 'Program Studi belum ditetapkan'}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {stats.studyProgram?.nama_institusi ?? 'Hubungi administrator untuk mengatur program studi Anda.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon="menu_book" label="Mata Kuliah Program" value={stats.totalCourses} />
              <StatCard icon="insights" label="Total Analisis Gap" value={stats.totalGaps} />
              <StatCard icon="warning" label="Gap Mismatch" value={stats.mismatchGaps} tone="amber" />
            </div>

            {stats.gapByType?.length > 0 && (
              <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm p-5">
                <p className="text-sm font-bold text-text mb-3">Rincian Tipe Gap</p>
                <div className="flex flex-wrap gap-2">
                  {stats.gapByType.map(g => (
                    <span
                      key={g.tipe_mismatch}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-light text-brand"
                    >
                      {MISMATCH_LABELS[g.tipe_mismatch] ?? g.tipe_mismatch} · {g.total}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Dosen ─── */}
        {role === 'dosen' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon="menu_book" label="Mata Kuliah Diampu" value={stats.courses?.length ?? 0} />
              <StatCard icon="insights" label="Total Gap Program" value={stats.totalGaps} />
              <StatCard icon="person_book" label="Role" value={ROLE_LABELS[role]} />
            </div>

            <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-brand">library_books</span>
                <p className="text-sm font-bold text-text">Mata Kuliah yang Diampu</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-text-muted border-b border-gray-100">
                      <th className="px-5 py-3 font-semibold">Kode</th>
                      <th className="px-5 py-3 font-semibold">Nama</th>
                      <th className="px-5 py-3 font-semibold">Semester</th>
                      <th className="px-5 py-3 font-semibold">SKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.courses?.map(course => (
                      <tr key={course.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-brand">{course.code}</td>
                        <td className="px-5 py-3 font-medium text-text">{course.name}</td>
                        <td className="px-5 py-3 text-text-secondary">Semester {course.semester}</td>
                        <td className="px-5 py-3 text-text-secondary">{course.credits} SKS</td>
                      </tr>
                    ))}
                    {(!stats.courses || stats.courses.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-5 py-8 text-center text-xs text-text-muted">
                          Belum ada mata kuliah yang diampu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── Mahasiswa ─── */}
        {role === 'mahasiswa' && (
          <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">account_circle</span>
            </div>
            <p className="font-display text-lg font-bold text-text">{user.name}</p>
            <span className="mt-2 inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-light text-brand">
              {ROLE_LABELS[role]}
            </span>
            <p className="mt-4 text-xs text-text-secondary leading-relaxed">
              Fitur profil skill mahasiswa hadir di fase berikutnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
