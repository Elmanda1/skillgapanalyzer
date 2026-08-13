import React from 'react';
import { useForm, Link } from '@inertiajs/react';

// ─── Course row card ───────────────────────────────────────────────────────
function CourseCard({ course }) {
  const sp = course.study_program;
  const verified = Boolean(course.status_verifikasi_ekstraksi);

  return (
    <Link
      href={`/curriculum/courses/${course.id}`}
      className="card p-5 flex items-start justify-between gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-brand text-[22px]">book_2</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-gray font-mono">{course.code}</span>
            <span className={`badge ${verified ? 'badge-green' : 'badge-yellow'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-status-green-dot' : 'bg-status-yellow-dot'}`} />
              {verified ? 'Terverifikasi' : 'Belum Terverifikasi'}
            </span>
          </div>
          <h3 className="font-display text-base font-bold text-text group-hover:text-brand transition-colors">{course.name}</h3>
          <p className="text-xs text-text-muted mt-1">
            {sp ? `${sp.jenjang} ${sp.nama_prodi} · ${sp.nama_institusi}` : 'Tanpa program studi'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-text">Semester {course.semester}</p>
          <p className="text-xs text-text-muted mt-0.5">{course.credits} SKS{course.versi ? ` · ${course.versi}` : ''}</p>
        </div>
        <span className="material-symbols-outlined text-text-muted text-[20px] transition-all duration-200 group-hover:text-brand group-hover:translate-x-0.5">chevron_right</span>
      </div>
    </Link>
  );
}

// ─── Field helper ──────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-text-secondary mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-status-red-text">{error}</p>}
    </div>
  );
}

const INPUT_CLASS = 'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all';

// ─── Main Curriculum Index ─────────────────────────────────────────────────
export default function CurriculumIndex({ courses }) {
  const form = useForm({ code: '', name: '', semester: '', credits: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    form.post('/curriculum/courses', { onSuccess: () => form.reset() });
  };

  return (
    <div className="min-h-screen bg-page-bg font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">insights</span>
            </div>
            <span className="font-display font-bold text-text">Skill Gap Analyzer</span>
          </div>
          <span className="badge badge-green">Kurikulum</span>
        </div>
      </nav>

      {/* ── Page header ── */}
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <h1 className="font-display text-2xl font-bold text-text">Daftar Mata Kuliah</h1>
        <p className="text-sm text-text-secondary mt-1">Kelola mata kuliah kurikulum, capaian pembelajaran, dan pemetaan skill.</p>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ── Tambah Mata Kuliah ── */}
        <section className="card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-base font-bold text-text mb-1">Tambah Mata Kuliah</h2>
          <p className="text-xs text-text-muted mb-5">Lengkapi data dasar mata kuliah baru.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Kode MK" error={form.errors.code}>
              <input
                type="text"
                value={form.data.code}
                onChange={(e) => form.setData('code', e.target.value)}
                placeholder="cth: TI-401"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Nama Mata Kuliah" error={form.errors.name}>
              <input
                type="text"
                value={form.data.name}
                onChange={(e) => form.setData('name', e.target.value)}
                placeholder="cth: Pemrograman Web"
                className={INPUT_CLASS}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Semester" error={form.errors.semester}>
                <input
                  type="number"
                  min="1"
                  value={form.data.semester}
                  onChange={(e) => form.setData('semester', e.target.value)}
                  placeholder="cth: 4"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="SKS" error={form.errors.credits}>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.data.credits}
                  onChange={(e) => form.setData('credits', e.target.value)}
                  placeholder="cth: 3"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
            {form.errors.study_program_id && (
              <p className="text-xs text-status-red-text">{form.errors.study_program_id}</p>
            )}
            <button
              type="submit"
              disabled={form.processing}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {form.processing ? 'Menyimpan...' : 'Simpan Mata Kuliah'}
            </button>
          </form>
        </section>

        {/* ── Daftar Mata Kuliah ── */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-text">Semua Mata Kuliah</h2>
            <span className="badge badge-gray">{courses.length} MK</span>
          </div>
          {courses.length === 0 ? (
            <div className="card p-10 text-center">
              <span className="material-symbols-outlined text-[36px] text-text-muted mb-2">menu_book</span>
              <p className="text-sm text-text-secondary">Belum ada mata kuliah. Tambahkan mata kuliah pertama melalui form di samping.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
