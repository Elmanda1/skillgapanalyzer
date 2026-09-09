import React, { useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { COMPETENCE_DIMENSIONS, CATEGORIES } from '../../constants/taxonomy';
import { useToast } from '../../context/ToastContext';
import Icon from '../../components/Icon.jsx';


const emptyForm = {
  nama: '',
  kategori: '',
  sektor_industri_terkait: 'Teknologi & TI',
  dimension: 'hard_technical',
  is_hard_skill: true,
  aliases: '',
};

const inputCls =
  'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all font-sans text-text';

const errCls = 'text-xs text-red-500 mt-1';

export default function TaxonomyManage({ skills, search = '' }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef(null);
  const form = useForm(emptyForm);

  const items = Array.isArray(skills?.data) ? skills.data : [];
  const currentPage = Number(skills?.current_page ?? 1);
  const total = Number(skills?.total ?? items.length);
  const totalPages = Math.max(1, Number(skills?.last_page ?? 1));
  const from = Number(skills?.from ?? 0);
  const to = Number(skills?.to ?? 0);

  const applySearch = (value) => {
    setLoading(true);
    router.get('/taxonomy/manage', { search: value, page: 1 }, {
      preserveState: true,
      preserveScroll: true,
      only: ['skills'],
      onFinish: () => setLoading(false),
    });
  };

  const onSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applySearch(value), 300);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setLoading(true);
      router.get('/taxonomy/manage', { search: searchInput, page }, {
        preserveState: true,
        preserveScroll: true,
        only: ['skills'],
        onFinish: () => setLoading(false),
      });
      document.querySelector('.card table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const pageNumbers = (() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  })();

  const openCreate = () => {
    form.setData({ ...emptyForm });
    form.clearErrors();
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (skill) => {
    form.setData({
      nama: skill.nama,
      kategori: skill.kategori,
      sektor_industri_terkait: skill.sektor_industri_terkait,
      dimension: skill.dimension || 'hard_technical',
      is_hard_skill: !!skill.is_hard_skill,
      aliases: (skill.aliases || []).map(a => a.alias_name).join(', '),
    });
    form.clearErrors();
    setEditing(skill);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
    form.reset();
  };

  const submit = (e) => {
    e.preventDefault();
    const opts = {
      onSuccess: () => {
        toast.success('Berhasil', editing ? 'Skill diperbarui.' : 'Skill ditambahkan.');
        close();
      },
      onError: (errs) => toast.error('Gagal', Object.values(errs)[0] || 'Validasi gagal'),
    };
    form.transform((data) => ({
      ...data,
      aliases: data.aliases.split(',').map(s => s.trim()).filter(Boolean),
    }));
    if (editing) {
      form.put(`/taxonomy/manage/${editing.id}`, opts);
    } else {
      form.post('/taxonomy/manage', opts);
    }
  };

  const remove = (skill) => {
    if (deletingId) return;
    if (!confirm(`Hapus "${skill.nama}" dan semua aliasnya?`)) return;
    setDeletingId(skill.id);
    router.delete(`/taxonomy/manage/${skill.id}`, {
      onSuccess: () => {
        setDeletingId(null);
        toast.success('Berhasil', 'Skill dihapus.');
      },
      onError: () => {
        setDeletingId(null);
        toast.error('Gagal', 'Tidak dapat menghapus skill ini.');
      },
    });
  };

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <Head title="Manajemen Taksonomi" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
            <Icon className="text-[24px] text-brand" name="category" />
            Manajemen Taksonomi
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Kelola skill, kategori, dan alias untuk referensi taksonomi
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Icon className="text-[18px]" name="add" />
          Tambah Skill
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="font-display text-base font-semibold text-text">
            Daftar Skill ({total})
          </h2>
          <div className="relative w-64">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
            <input
              value={searchInput}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Cari nama atau kategori..."
              className="w-full pl-8 pr-4 py-2 border border-border rounded-lg text-sm bg-gray-50 focus:outline-none focus:border-brand focus:bg-white transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              {['SKILL', 'KATEGORI', 'DIMENSI', 'ALIAS', 'AKSI'].map(h => (
                <th key={h} className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && Array.from({ length: 10 }).map((_, i) => (
              <tr key={`sk-${i}`} className="animate-pulse">
                <td className="px-5 py-3.5">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-5 w-24 bg-gray-200 rounded-full" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-4 w-14 bg-gray-200 rounded" />
                </td>
                <td className="px-5 py-3.5">
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-text-muted">
                  Tidak ada skill yang cocok
                </td>
              </tr>
            )}
            {!loading && items.map(sk => {
              const dim = COMPETENCE_DIMENSIONS.find(d => d.value === sk.dimension);
              return (
                <tr key={sk.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-text">{sk.nama}</td>
                  <td className="px-5 py-3 text-text-secondary">{sk.kategori}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${dim ? dim.color : 'badge-gray'}`}>
                      {dim ? dim.labelId : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary">
                    {(sk.aliases || []).length} alias
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(sk)}
                        title="Edit"
                        aria-label={`Edit ${sk.nama}`}
                        className="w-8 h-8 rounded-md hover:bg-brand-light text-text-secondary hover:text-brand flex items-center justify-center transition-colors"
                      >
                        <Icon className="text-[16px]" name="edit" />
                      </button>
                      <button
                        onClick={() => remove(sk)}
                        title="Hapus"
                        aria-label={`Hapus ${sk.nama}`}
                        disabled={deletingId === sk.id}
                        className="w-8 h-8 rounded-md hover:bg-red-50 text-text-secondary hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon className="text-[16px]" name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              Menampilkan {from}–{to} dari {total} skill
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                title="Sebelumnya"
                className="w-8 h-8 rounded-md border border-border hover:border-brand text-text-secondary hover:text-brand flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon className="text-[16px]" name="chevron_left" />
              </button>
              {pageNumbers.map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-text-muted">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-md text-xs font-semibold flex items-center justify-center transition-colors ${
                      p === currentPage
                        ? 'bg-brand text-white'
                        : 'border border-border hover:border-brand text-text-secondary hover:text-brand'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Berikutnya"
                className="w-8 h-8 rounded-md border border-border hover:border-brand text-text-secondary hover:text-brand flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon className="text-[16px]" name="chevron_right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-[9999] p-4 transition-all duration-200" onClick={close}>
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/80 w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-text mb-4">
              {editing ? 'Edit Skill' : 'Tambah Skill'}
            </h3>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="skill-nama">
                  Nama Skill
                </label>
                <input
                  id="skill-nama"
                  type="text"
                  required
                  placeholder="cth: Kubernetes"
                  value={form.data.nama}
                  onChange={e => form.setData('nama', e.target.value)}
                  className={inputCls}
                />
                {form.errors.nama && <p className={errCls}>{form.errors.nama}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="skill-kategori">
                  Kategori
                </label>
                <select
                  id="skill-kategori"
                  required
                  value={form.data.kategori}
                  onChange={e => form.setData('kategori', e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {form.errors.kategori && <p className={errCls}>{form.errors.kategori}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="skill-sektor">
                  Sektor Industri Terkait
                </label>
                <input
                  id="skill-sektor"
                  type="text"
                  required
                  placeholder="cth: Teknologi & TI"
                  value={form.data.sektor_industri_terkait}
                  onChange={e => form.setData('sektor_industri_terkait', e.target.value)}
                  className={inputCls}
                />
                {form.errors.sektor_industri_terkait && <p className={errCls}>{form.errors.sektor_industri_terkait}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="skill-dimension">
                  Dimensi Kompetensi
                </label>
                <select
                  id="skill-dimension"
                  value={form.data.dimension}
                  onChange={e => form.setData('dimension', e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  {COMPETENCE_DIMENSIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.labelId}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.data.is_hard_skill}
                  onChange={e => form.setData('is_hard_skill', e.target.checked)}
                  className="rounded"
                />
                Hard skill (dapat diukur otomatis)
              </label>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5" htmlFor="skill-aliases">
                  Alias
                </label>
                <input
                  id="skill-aliases"
                  type="text"
                  placeholder="contoh: k8s, kubernetes orchestration"
                  value={form.data.aliases}
                  onChange={e => form.setData('aliases', e.target.value)}
                  className={inputCls}
                />
                {form.errors['aliases.0'] && <p className={errCls}>{form.errors['aliases.0']}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 btn-outline px-4 py-2.5 rounded-lg text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={form.processing}
                  className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {form.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}