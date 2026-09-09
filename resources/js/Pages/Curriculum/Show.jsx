import React, { useEffect, useRef, useState } from 'react';
import { useForm, Link, router } from '@inertiajs/react';
import Icon from '../../components/Icon.jsx';


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
function LearningOutcomeItem({ index, lo, courseId }) {
  const [isEditing, setIsEditing] = useState(false);
  const editForm = useForm({
    text: lo.text || '',
    source_doc: lo.source_doc || '',
  });

  const handleToggle = () => {
    router.post(`/curriculum/courses/${courseId}/learning-outcomes/${lo.id}/override`, {}, {
      preserveScroll: true,
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    editForm.put(`/curriculum/courses/${courseId}/learning-outcomes/${lo.id}`, {
      preserveScroll: true,
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleDelete = () => {
    if (confirm('Apakah Anda yakin ingin menghapus capaian pembelajaran (CPMK) ini?')) {
      router.delete(`/curriculum/courses/${courseId}/learning-outcomes/${lo.id}`, {
        preserveScroll: true,
      });
    }
  };

  const auditorName = lo.is_overridden
    ? (lo.overridden_by_user?.name ? `Kaprodi (${lo.overridden_by_user.name})` : 'Kaprodi')
    : 'Dosen Pengampu';

  return (
    <li className={`border rounded-xl p-4.5 transition-all duration-200 ${
      lo.is_overridden 
        ? 'bg-purple-50/80 border-purple-300 shadow-sm ring-1 ring-purple-400/20' 
        : 'bg-white border-border hover:border-gray-300'
    }`}>
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Icon className="text-[14px]" name="edit" />
              Edit CPMK #{index} {lo.is_overridden ? '(Mode Kaprodi - Auto Snapshot Dosen)' : '(Draf Dosen)'}
            </span>
            <button
              type="button"
              onClick={() => {
                editForm.setData({ text: lo.text || '', source_doc: lo.source_doc || '' });
                setIsEditing(false);
              }}
              className="text-xs text-text-muted hover:text-text font-semibold"
            >
              Batal
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">Teks Capaian Pembelajaran</label>
            <textarea
              rows="3"
              value={editForm.data.text}
              onChange={(e) => editForm.setData('text', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              required
            />
            {editForm.errors.text && <p className="mt-1 text-xs text-status-red-text">{editForm.errors.text}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1">Sumber Dokumen (opsional)</label>
            <input
              type="text"
              value={editForm.data.source_doc}
              onChange={(e) => editForm.setData('source_doc', e.target.value)}
              placeholder="cth: RPS-TI-401.pdf"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-outline text-xs py-1.5 px-3"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editForm.processing}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-60"
            >
              <Icon className="text-[14px]" name="check" />
              {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
              lo.is_overridden ? 'bg-purple-700 text-white' : 'bg-brand text-white'
            }`}>
              {index}
            </span>
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-text leading-relaxed">{lo.text}</p>
              
              {lo.is_overridden && lo.original_dosen_text && lo.original_dosen_text !== lo.text && (
                <div className="p-2.5 rounded-lg bg-white/90 border border-purple-200 text-xs shadow-2xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Snapshot Draf Awal Dosen:
                  </span>
                  <p className="text-slate-600 italic">"{lo.original_dosen_text}"</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {lo.is_overridden ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 border border-purple-300 font-bold text-[11px]">
                    <svg className="w-3.5 h-3.5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Disahkan & Di-override oleh {auditorName}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Draf Dosen Pengampu (Default)
                  </div>
                )}

                {lo.source_doc && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Dokumen: {lo.source_doc}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Edit CPMK ini"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-text hover:bg-gray-200 border border-gray-200 transition-all flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>

              <button
                type="button"
                onClick={handleDelete}
                title="Hapus CPMK ini"
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                lo.is_overridden
                  ? 'bg-purple-200 text-purple-900 hover:bg-purple-300 border border-purple-300'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white'
              }`}
            >
              {lo.is_overridden ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Batalkan Override</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Tetapkan Override Kaprodi</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-text-muted">
              {lo.is_overridden ? 'CPMK Resmi Kaprodi' : 'Klik untuk kunci pengesahan'}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Skill checkbox row (search result) ────────────────────────────────────
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
export default function CurriculumShow({ course, totalSkills = 0 }) {
  const sp = course.study_program;
  const verified = Boolean(course.status_verifikasi_ekstraksi);

  const loForm = useForm({ text: '', source_doc: '' });
  const skillForm = useForm({ skill_ids: course.skills.map((s) => s.id) });
  const courseOverrideForm = useForm({ override_notes: '' });

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const handleCourseOverride = () => {
    courseOverrideForm.post(`/curriculum/courses/${course.id}/override`);
  };

  const runSearch = async (value) => {
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/taxonomy/search?q=${encodeURIComponent(value)}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Gagal mencari skill');
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onQueryChange = (value) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSearch(value), 300);
  };

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
  
  const toggleSkillItemOverride = (skillId) => {
    router.post(`/curriculum/courses/${course.id}/skills/${skillId}/override`, {}, {
      preserveScroll: true,
    });
  };

  const isSelected = (id) => skillForm.data.skill_ids.includes(id);

  const selectedSkills = course.skills.filter((s) => isSelected(s.id));

  const courseAuditor = course.is_overridden
    ? (course.overridden_by_user?.name ? `Kaprodi (${course.overridden_by_user.name})` : 'Kaprodi')
    : 'Dosen (Default)';

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <div className="mb-4">
        <Link href="/curriculum" className="btn-outline inline-flex items-center gap-2">
          <Icon className="text-[16px]" name="arrow_back" />
          Kembali ke Daftar Kurikulum
        </Link>
      </div>

      <main className="py-4">
        {/* ── Page Header ── */}
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap bg-white p-6 rounded-2xl border border-border/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge badge-gray font-mono">{course.code}</span>
              <span className={`badge ${verified ? 'badge-green' : 'badge-yellow'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-status-green-dot' : 'bg-status-yellow-dot'}`} />
                {verified ? 'Terverifikasi' : 'Belum Terverifikasi'}
              </span>
              <span className={`badge font-bold px-3 py-1 text-xs rounded-lg ${course.is_overridden ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                <svg className="w-3.5 h-3.5 inline mr-1 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Audit MK: {courseAuditor}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-text">{course.name}</h1>
            <p className="text-sm text-text-secondary mt-1">
              {sp ? `${sp.jenjang} ${sp.nama_prodi} · ${sp.nama_institusi}` : 'Tanpa program studi'}
            </p>
          </div>

          <button
            type="button"
            disabled={courseOverrideForm.processing}
            onClick={handleCourseOverride}
            className={`btn border flex items-center gap-2 text-xs font-bold transition-all px-4 py-2.5 rounded-xl shadow-sm ${
              course.is_overridden
                ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {course.is_overridden ? 'Batalkan Override Mata Kuliah' : 'Pengesahan Override Mata Kuliah'}
          </button>
        </header>

        {/* ── Detail Card ── */}
        <section className="card p-6 mb-6">
          <h2 className="font-display text-base font-bold text-text mb-4">Detail Mata Kuliah</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <DetailItem label="Kode MK" value={course.code} mono />
            <DetailItem label="Semester" value={course.semester} />
            <DetailItem label="SKS" value={course.credits} />
            <DetailItem label="Versi" value={course.versi || '—'} />
          </div>

          <div className="mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 flex-wrap bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2">
              <Icon className="text-[18px] text-slate-600" name="shield" />
              <span className="text-slate-700 font-medium">
                Status Audit Kurikulum: <strong className="text-text">{courseAuditor}</strong>
              </span>
            </div>
            {course.is_overridden && (
              <span className="text-[11px] text-purple-800 font-semibold bg-purple-100/80 px-2.5 py-1 rounded-md border border-purple-200">
                Disahkan Manual oleh Kaprodi
              </span>
            )}
          </div>
        </section>

        {/* ── Grid Content: Capaian & Skill ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Capaian Pembelajaran (CPMK) */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base font-bold text-text">Capaian Pembelajaran (CPMK)</h2>
              <span className="badge bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold">
                {course.learning_outcomes.filter(lo => lo.is_overridden).length} Override Kaprodi
              </span>
            </div>
            <p className="text-xs text-text-muted mb-5">Learning outcome yang dimiliki mata kuliah ini beserta status audit pengesahan.</p>

            {course.learning_outcomes.length === 0 ? (
              <p className="text-sm text-text-muted bg-page-bg border border-border rounded-lg p-4 mb-5">
                Belum ada capaian pembelajaran untuk mata kuliah ini.
              </p>
            ) : (
              <ol className="space-y-3 mb-5">
                {course.learning_outcomes.map((lo, i) => (
                  <LearningOutcomeItem key={lo.id} index={i + 1} lo={lo} courseId={course.id} />
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
                <Icon className="text-[16px]" name="add" />
                {loForm.processing ? 'Menyimpan...' : 'Tambah Capaian Pembelajaran'}
              </button>
            </form>
          </section>

          {/* Peta Skill */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base font-bold text-text">Peta Skill Industri</h2>
              <span className="badge bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold">
                {selectedSkills.filter(s => Boolean(s.pivot?.is_overridden)).length} Override Kaprodi
              </span>
            </div>
            <p className="text-xs text-text-muted mb-2">
              Petakan skill industri yang relevan dengan mata kuliah ini.
            </p>
            <p className="text-xs text-text-muted mb-4">
              Terpilih <span className="font-bold text-text">{skillForm.data.skill_ids.length}</span> dari {totalSkills} skill di katalog.
            </p>

            {/* Selected Skills List */}
            {selectedSkills.length > 0 && (
              <div className="space-y-2 mb-5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Skill Terpasang ({selectedSkills.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((s) => {
                    const isSkillOverridden = Boolean(s.pivot?.is_overridden);
                    return (
                      <div
                        key={s.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSkillOverridden
                            ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/30'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        <span>{s.nama}</span>

                        {isSkillOverridden ? (
                          <span className="bg-purple-900 text-purple-100 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Kaprodi
                          </span>
                        ) : (
                          <span className="bg-emerald-200 text-emerald-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Dosen
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleSkillItemOverride(s.id)}
                          title={isSkillOverridden ? 'Batalkan status override Kaprodi untuk skill ini' : 'Tandai skill ini sebagai Override Kaprodi'}
                          className={`ml-1 text-[10px] px-1.5 py-0.5 rounded transition-all font-bold ${
                            isSkillOverridden
                              ? 'bg-purple-800 text-purple-100 hover:bg-purple-900'
                              : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                          }`}
                        >
                          {isSkillOverridden ? 'Un-override' : 'Override'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSkill(s.id)}
                          title={`Lepas skill ${s.nama}`}
                          className="hover:text-red-300 transition-colors ml-0.5"
                        >
                          <Icon className="text-[14px]" name="close" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="relative mb-4">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
              <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Cari skill untuk dipetakan..."
                className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1 mb-5">
              {searching && (
                <p className="text-xs text-text-muted text-center py-3">Mencari...</p>
              )}

              {!searching && searched && results.length === 0 && (
                <p className="text-sm text-text-muted bg-page-bg border border-border rounded-lg p-4 text-center">
                  Tidak ada skill yang cocok dengan pencarian.
                </p>
              )}

              {!searching && results.map((skill) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  checked={isSelected(skill.id)}
                  onToggle={toggleSkill}
                />
              ))}

              {!searching && !searched && (
                <p className="text-xs text-text-muted text-center py-3">
                  Ketik untuk mencari skill dari katalog.
                </p>
              )}
            </div>

            {skillForm.errors.skill_ids && (
              <p className="text-xs text-status-red-text mb-2">{skillForm.errors.skill_ids}</p>
            )}

            <form onSubmit={handleSkillSubmit}>
              <button
                type="submit"
                disabled={skillForm.processing}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Icon className="text-[16px]" name="sync" />
                {skillForm.processing ? 'Menyimpan...' : 'Simpan Pemetaan Skill'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}