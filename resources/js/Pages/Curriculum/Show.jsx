import React from 'react';
import { useForm, Link } from '@inertiajs/react';

// ─── Detail row helper ─────────────────────────────────────────────────────
function DetailItem({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold text-text mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ─── Learning outcome row ──────────────────────────────────────────────────
function LearningOutcomeItem({ index, lo }) {
  return (
    <li className="flex items-start gap-3 bg-page-bg border border-border rounded-lg p-4">
      <span className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {index}
      </span>
      <div>
        <p className="text-sm text-text leading-relaxed">{lo.text}</p>
        {lo.source_doc && (
          <span className="badge badge-gray mt-2">
            <span className="material-symbols-outlined text-[14px]">description</span>
            {lo.source_doc}
          </span>
        )}
      </div>
    </li>
  );
}

// ─── Skill checkbox row ────────────────────────────────────────────────────
function SkillRow({ skill, checked, onToggle }) {
  return (
    <label className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-all duration-150 ${checked ? 'border-brand bg-brand-light/60' : 'border-border hover:border-gray-300 hover:bg-gray-50'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(skill.id)}
        className="mt-0.5 w-4 h-4 rounded border-border accent-brand flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text">{skill.nama}</p>
        <p className="text-xs text-text-muted mt-0.5 truncate">{skill.sektor_industri_terkait}</p>
      </div>
      {skill.kategori && <span className="badge badge-blue flex-shrink-0">{skill.kategori}</span>}
    </label>
  );
}

// ─── Main Curriculum Show ──────────────────────────────────────────────────
export default function CurriculumShow({ course, skills }) {
  const sp = course.study_program;
  const verified = Boolean(course.status_verifikasi_ekstraksi);

  const loForm = useForm({ text: '', source_doc: '' });
  const skillForm = useForm({ skill_ids: course.skills.map((s) => s.id) });

  const handleLoSubmit = (e) => {
    e.preventDefault();
    loForm.post(`/curriculum/courses/${course.id}/learning-outcomes`, {
      onSuccess: () => loForm.reset('text', 'source_doc'),
    });
  };

  const handleSkillSubmit = (e) => {
    e.preventDefault();
    skillForm.post(`/curriculum/courses/${course.id}/skills`);
  };

  const toggleSkill = (id) => {
    const ids = skillForm.data.skill_ids;
    skillForm.setData('skill_ids', ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };

  return (
    <div className="min-h-screen bg-page-bg font-sans">

      {/* ── Top bar ── */}
      <nav className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">insights</span>
            </div>
            <span className="font-display font-bold text-text">Skill Gap Analyzer</span>
          </div>
          <Link href="/curriculum" className="btn-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Header ── */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-gray font-mono">{course.code}</span>
            <span className={`badge ${verified ? 'badge-green' : 'badge-yellow'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-status-green-dot' : 'bg-status-yellow-dot'}`} />
              {verified ? 'Terverifikasi' : 'Belum Terverifikasi'}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text">{course.name}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {sp ? `${sp.jenjang} ${sp.nama_prodi} · ${sp.nama_institusi}` : 'Tanpa program studi'}
          </p>
        </header>

        {/* ── Detail mata kuliah ── */}
        <section className="card p-6 mb-6">
          <h2 className="font-display text-base font-bold text-text mb-4">Detail Mata Kuliah</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <DetailItem label="Kode MK" value={course.code} mono />
            <DetailItem label="Semester" value={course.semester} />
            <DetailItem label="SKS" value={course.credits} />
            <DetailItem label="Versi" value={course.versi || '—'} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Capaian Pembelajaran ── */}
          <section className="card p-6">
            <h2 className="font-display text-base font-bold text-text mb-1">Capaian Pembelajaran</h2>
            <p className="text-xs text-text-muted mb-5">Learning outcome yang dimiliki mata kuliah ini.</p>

            {course.learning_outcomes.length === 0 ? (
              <p className="text-sm text-text-muted bg-page-bg border border-border rounded-lg p-4 mb-5">
                Belum ada capaian pembelajaran untuk mata kuliah ini.
              </p>
            ) : (
              <ol className="space-y-2.5 mb-5">
                {course.learning_outcomes.map((lo, i) => (
                  <LearningOutcomeItem key={lo.id} index={i + 1} lo={lo} />
                ))}
              </ol>
            )}

            <form onSubmit={handleLoSubmit} className="space-y-4 border-t border-border pt-5">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="lo-text">Teks Capaian</label>
                <textarea
                  id="lo-text"
                  rows="3"
                  value={loForm.data.text}
                  onChange={(e) => loForm.setData('text', e.target.value)}
                  placeholder="cth: Mahasiswa mampu memahami dasar pemrograman..."
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                />
                {loForm.errors.text && <p className="mt-1.5 text-xs text-status-red-text">{loForm.errors.text}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="lo-source">Sumber Dokumen <span className="font-normal text-text-muted">(opsional)</span></label>
                <input
                  id="lo-source"
                  type="text"
                  value={loForm.data.source_doc}
                  onChange={(e) => loForm.setData('source_doc', e.target.value)}
                  placeholder="cth: RPS-TI-401.pdf"
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all"
                />
                {loForm.errors.source_doc && <p className="mt-1.5 text-xs text-status-red-text">{loForm.errors.source_doc}</p>}
              </div>
              <button
                type="submit"
                disabled={loForm.processing}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                {loForm.processing ? 'Menyimpan...' : 'Tambah Capaian Pembelajaran'}
              </button>
            </form>
          </section>

          {/* ── Peta Skill ── */}
          <section className="card p-6">
            <h2 className="font-display text-base font-bold text-text mb-1">Peta Skill</h2>
            <p className="text-xs text-text-muted mb-2">
              Petakan skill industri yang relevan dengan mata kuliah ini.
            </p>
            <p className="text-xs text-text-muted mb-5">
              Terpilih <span className="font-bold text-text">{skillForm.data.skill_ids.length}</span> dari {skills.length} skill di katalog.
            </p>

            {skills.length === 0 ? (
              <p className="text-sm text-text-muted bg-page-bg border border-border rounded-lg p-4 mb-5">
                Katalog skill masih kosong.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1 mb-5">
                {skills.map((skill) => (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    checked={skillForm.data.skill_ids.includes(skill.id)}
                    onToggle={toggleSkill}
                  />
                ))}
              </div>
            )}

            {skillForm.errors.skill_ids && (
              <p className="text-xs text-status-red-text mb-2">{skillForm.errors.skill_ids}</p>
            )}

            <form onSubmit={handleSkillSubmit}>
              <button
                type="submit"
                disabled={skillForm.processing}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                {skillForm.processing ? 'Menyimpan...' : 'Simpan Pemetaan Skill'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
