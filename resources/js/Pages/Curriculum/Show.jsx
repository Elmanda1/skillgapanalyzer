import React, { useEffect, useRef, useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
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
            <Icon className="text-[14px]" name="description" />
            {lo.source_doc}
          </span>
        )}
      </div>
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

  const isSelected = (id) => skillForm.data.skill_ids.includes(id);

  const selectedSkills = course.skills.filter((s) => isSelected(s.id));

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <div className="mb-4">
        <Link href="/curriculum" className="btn-outline inline-flex items-center gap-2">
          <Icon className="text-[16px]" name="arrow_back" />
          Kembali ke Daftar Kurikulum
        </Link>
      </div>

      <main className="py-4">
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
                <Icon className="text-[16px]" name="add" />
                {loForm.processing ? 'Menyimpan...' : 'Tambah Capaian Pembelajaran'}
              </button>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-base font-bold text-text mb-1">Peta Skill</h2>
            <p className="text-xs text-text-muted mb-2">
              Petakan skill industri yang relevan dengan mata kuliah ini.
            </p>
            <p className="text-xs text-text-muted mb-5">
              Terpilih <span className="font-bold text-text">{skillForm.data.skill_ids.length}</span> dari {totalSkills} skill di katalog.
            </p>

            {selectedSkills.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {selectedSkills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    title={`Hapus ${s.nama}`}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-brand-light text-brand font-semibold hover:bg-brand hover:text-white transition-colors"
                  >
                    {s.nama}
                    <Icon className="text-[13px]" name="close" />
                  </button>
                ))}
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