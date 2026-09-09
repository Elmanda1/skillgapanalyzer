import React from 'react';
import { useForm, Link, usePage } from '@inertiajs/react';
import Icon from '../../components/Icon.jsx';


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
          <Icon className="text-brand text-[22px]" name="book_2" />
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
        <Icon className="text-text-muted text-[20px] transition-all duration-200 group-hover:text-brand group-hover:translate-x-0.5" name="chevron_right" />
      </div>
    </Link>
  );
}

// ─── Field helper ──────────────────────────────────────────────────────────
function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-text-secondary mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-status-red-text">{error}</p>}
    </div>
  );
}

const INPUT_CLASS = 'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all';

// ─── Import Card ────────────────────────────────────────────────────────────
function ImportCard() {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';

  const send = async (dryRun) => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('dry_run', dryRun ? '1' : '0');
    try {
      const res = await fetch('/curriculum/import', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrf, Accept: 'application/json' },
        body: fd,
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Import gagal');
      setPreview(json);
      if (json.mode === 'committed') {
        setFile(null);
        window.location.reload();
      }
    } catch (e) {
      setPreview({ mode: 'error', errors: [{ row: '-', message: e.message }] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-base font-bold text-text">Import Excel Kurikulum</h2>
        <a href="/curriculum/template" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
          <Icon className="text-[16px]" name="download" /> Template
        </a>
      </div>
      <p className="text-xs text-text-muted mb-4">Kolom: kode, nama, semester, sks, versi, skills (;), cpl_text, cpl_source. Maks 1000 baris.</p>
      <div className="flex items-center gap-3">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files[0] || null)} className="text-sm" />
        <button disabled={!file || busy} onClick={() => send(true)} className="btn-primary disabled:opacity-60">Preview</button>
        {preview?.mode === 'preview' && preview.errors?.length === 0 && (
          <button disabled={busy} onClick={() => send(false)} className="btn-primary">Konfirmasi Import ({preview.valid} valid)</button>
        )}
      </div>
      {preview?.errors?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {preview.errors.map((e, i) => (
            <li key={i} className="text-xs text-status-red-text">Baris {e.row}: {e.message}</li>
          ))}
        </ul>
      )}
      {preview?.warnings?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {preview.warnings.map((w, i) => (
            <li key={i} className="text-xs text-amber-600">Baris {w.row}: skill tak dikenal: {w.skills.join(', ')}</li>
          ))}
        </ul>
      )}
      {preview?.mode === 'preview' && preview.errors?.length === 0 && (
        <p className="mt-3 text-xs text-status-green-text">{preview.valid} baris valid, siap dikonfirmasi.</p>
      )}
    </section>
  );
}

// ─── Main Curriculum Index ─────────────────────────────────────────────────
export default function CurriculumIndex({ courses, studyPrograms = [] }) {
  const { auth } = usePage().props;
  const isSuperAdmin = auth?.role === 'super_admin';
  const userProdi = auth?.user?.study_program || studyPrograms.find(sp => sp.id === auth?.user?.study_program_id);

  const form = useForm({
    study_program_id: '',
    code: '',
    name: '',
    semester: '',
    credits: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    form.post('/curriculum/courses', { onSuccess: () => form.reset() });
  };

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">

      {/* ── Page header ── */}
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Daftar Mata Kuliah</h1>
        <p className="text-sm text-text-secondary mt-1">Kelola mata kuliah kurikulum, capaian pembelajaran, dan pemetaan skill.</p>
      </header>

      <div className="space-y-6">
        {/* ── Import Excel Kurikulum Card ── */}
        <ImportCard />

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Daftar Mata Kuliah ── */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-text">Semua Mata Kuliah</h2>
              <span className="badge badge-gray">{courses.length} MK</span>
            </div>
            {courses.length === 0 ? (
              <div className="card p-10 text-center">
                <Icon className="text-[36px] text-text-muted mb-2" name="menu_book" />
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

          {/* ── Tambah Mata Kuliah ── */}
          <section className="card p-6 lg:col-span-1 lg:sticky lg:top-24">
            <h2 className="font-display text-base font-bold text-text mb-1">Tambah Mata Kuliah</h2>
            <p className="text-xs text-text-muted mb-5">Lengkapi data dasar mata kuliah baru.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSuperAdmin ? (
                <Field id="study_program_id" label={`Program Studi (${studyPrograms.length} Tersedia di DB)`} error={form.errors.study_program_id}>
                  <select
                    id="study_program_id"
                    required
                    value={form.data.study_program_id}
                    onChange={(e) => form.setData('study_program_id', e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">-- Pilih Program Studi --</option>
                    {studyPrograms.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.jenjang} {sp.nama_prodi} - {sp.nama_institusi}
                      </option>
                    ))}
                  </select>
                  {studyPrograms.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">Belum ada program studi di database.</p>
                  )}
                </Field>
              ) : (
                <div className="bg-brand/5 border border-brand/20 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Program Studi Terkait</span>
                    <Icon className="text-brand text-[16px]" name="domain" />
                  </div>
                  <p className="text-sm font-bold text-text">
                    {userProdi ? `${userProdi.jenjang} ${userProdi.nama_prodi}` : 'Teknik Informatika'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {userProdi?.nama_institusi || 'Politeknik Negeri Jakarta'}
                  </p>
                </div>
              )}
              <Field id="code" label="Kode MK" error={form.errors.code}>
                <input
                  id="code"
                  type="text"
                  value={form.data.code}
                  onChange={(e) => form.setData('code', e.target.value)}
                  placeholder="cth: TI-401"
                  className={INPUT_CLASS}
                />
              </Field>
              <Field id="name" label="Nama Mata Kuliah" error={form.errors.name}>
                <input
                  id="name"
                  type="text"
                  value={form.data.name}
                  onChange={(e) => form.setData('name', e.target.value)}
                  placeholder="cth: Pemrograman Web"
                  className={INPUT_CLASS}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="semester" label="Semester" error={form.errors.semester}>
                  <input
                    id="semester"
                    type="number"
                    min="1"
                    value={form.data.semester}
                    onChange={(e) => form.setData('semester', e.target.value)}
                    placeholder="cth: 4"
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field id="credits" label="SKS" error={form.errors.credits}>
                  <input
                    id="credits"
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
                <Icon className="text-[16px]" name="add" />
                {form.processing ? 'Menyimpan...' : 'Simpan Mata Kuliah'}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
