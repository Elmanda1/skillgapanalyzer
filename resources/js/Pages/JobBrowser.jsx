import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useSkills } from '../context/SkillContext';
import Icon from '../components/Icon.jsx';


const formatSalary = (min, max) => {
  if (min === null && max === null) return null;
  const fmt = v => {
    if (v === null) return null;
    return v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1).replace('.0', '')} jt` : `Rp ${v.toLocaleString('id-ID')}`;
  };
  const lo = fmt(min);
  const hi = fmt(max);
  if (lo && hi) return `${lo} – ${hi}`;
  return lo || hi;
};

const computeMatchRate = (userSkills, jobSkills) => {
  if (!userSkills?.length || !jobSkills?.length) return null;
  const userKeys = new Set(userSkills.map(s => s.toLowerCase()));
  const overlap = jobSkills.filter(s => userKeys.has(s.toLowerCase())).length;
  return Math.round((overlap / jobSkills.length) * 100);
};

function MatchBadge({ rate }) {
  if (rate === null) return null;
  const tone = rate >= 70 ? 'badge-green' : rate >= 40 ? 'badge-blue' : 'badge-red';
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tone}`}>{rate}% Cocok</span>;
}

function CompanyLogo({ job }) {
  const [failed, setFailed] = useState(false);
  const fallback = (job.company_name || '?').trim().charAt(0).toUpperCase();

  if (!job.company_logo || failed) {
    return (
      <div className="w-10 h-10 rounded-lg border border-border bg-brand/10 text-brand font-bold flex items-center justify-center flex-shrink-0">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={job.company_logo}
      alt=""
      onError={() => setFailed(true)}
      className="w-10 h-10 rounded-lg object-contain border border-border bg-white flex-shrink-0"
      loading="lazy"
    />
  );
}

export default function JobBrowser() {
  const { jobs, filters = {}, lokasiOptions = [], sektorOptions = [], totalDatabaseJobs = 0 } = usePage().props;
  const { mySkills = [] } = useSkills() || {};

  const [search, setSearch] = useState(filters.search || '');
  const debounceRef = useRef(null);

  const userSkillNames = useMemo(() => mySkills.map(s => s.name).filter(Boolean), [mySkills]);

  const hasActiveFilters = Boolean(filters.search || filters.lokasi || filters.sektor || filters.is_remote);

  const applyFilters = (patch) => {
    router.get('/jobs', { ...filters, ...patch }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const resetFilters = () => {
    setSearch('');
    router.get('/jobs', {}, { preserveState: true, preserveScroll: true, replace: true });
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (filters.search || '')) applyFilters({ search, page: 1 });
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const total = jobs?.total ?? 0;
  const pageItems = jobs?.data ?? [];

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
            <Icon className="text-[28px] text-brand" name="work" />
            Eksplorasi Lowongan
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {totalDatabaseJobs > 0
              ? `${totalDatabaseJobs.toLocaleString('id-ID')} total lowongan riil dari loker.id, dipadankan dengan profil skill Anda.`
              : 'Temukan lowongan pekerjaan riil yang paling cocok dengan profil skill Anda.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]" name="search" />
            <input
              type="text"
              placeholder="Cari posisi, skill, atau PT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-white"
            />
          </div>
          <select
            value={filters.lokasi || ''}
            onChange={e => applyFilters({ lokasi: e.target.value, page: 1 })}
            className="px-4 py-2 border border-border rounded-lg text-sm bg-white outline-none focus:border-brand"
          >
            <option value="">Semua Lokasi</option>
            {lokasiOptions.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filters.sektor || ''}
            onChange={e => applyFilters({ sektor: e.target.value, page: 1 })}
            className="px-4 py-2 border border-border rounded-lg text-sm bg-white outline-none focus:border-brand"
          >
            <option value="">Semua Sektor</option>
            {sektorOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(filters.is_remote)}
              onChange={e => applyFilters({ is_remote: e.target.checked ? '1' : '', page: 1 })}
              className="accent-brand"
            />
            <span className="text-sm text-text-secondary">Remote</span>
          </label>
        </div>
      </div>

      {pageItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map(job => {
              const rate = computeMatchRate(userSkillNames, job.skills?.map(s => s.nama));
              const salary = formatSalary(job.salary_min, job.salary_max);
              return (
                <div key={job.id} className="card p-5 hover:shadow-lg transition-shadow border border-border/50 hover:border-brand/30 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <CompanyLogo job={job} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-text group-hover:text-brand transition-colors leading-snug">{job.title}</h3>
                        <p className="text-sm text-text-secondary truncate">{job.company_name}</p>
                      </div>
                    </div>
                    <MatchBadge rate={rate} />
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Icon className="text-[16px]" name="pin_drop" />
                      {job.lokasi || 'Lokasi tidak dicantumkan'}
                      {job.is_remote && <span className="badge badge-green text-[10px] px-1.5 py-0.5">Remote</span>}
                    </div>
                    {salary && (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Icon className="text-[16px]" name="payments" />
                        {salary}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Icon className="text-[16px]" name="schedule" />
                      {job.job_type || 'Tipe tidak dicantumkan'}
                      {job.job_experience && <span>· {job.job_experience}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Icon className="text-[16px]" name="domain" />
                      {job.sektor}
                    </div>
                  </div>

                  {job.skills?.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[11px] font-semibold text-text-secondary mb-2">Syarat Keahlian:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 8).map(s => (
                          <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-text-secondary text-[10px] font-medium rounded">
                            {s.nama}
                          </span>
                        ))}
                        {job.skills.length > 8 && (
                          <span className="px-2 py-0.5 bg-gray-50 text-text-muted text-[10px] font-medium rounded">
                            +{job.skills.length - 8} lagi
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-auto">
                    {job.source_url && (
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 btn-primary py-2 text-xs font-semibold text-center"
                      >
                        Lihat di loker.id
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {jobs.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {jobs.links?.filter(l => l.label !== '&laquo; Previous' && l.label !== 'Next &raquo;').map((link, idx) => {
                const label = link.label.replace(/&laquo;|&raquo;/g, '').trim();
                if (label === 'Previous' || label === 'Next') {
                  return (
                    <button
                      key={idx}
                      disabled={!link.url}
                      onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                      className="px-3 py-2 border border-border rounded-lg text-sm text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <Icon className="text-[16px]" name={label === 'Previous' ? 'chevron_left' : 'chevron_right'} />
                    </button>
                  );
                }
                return (
                  <button
                    key={idx}
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      link.active ? 'bg-brand text-white border-brand' : 'border-border text-text-secondary hover:bg-gray-50 disabled:opacity-40'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="py-24 text-center">
          <Icon className="text-5xl text-gray-300 mb-3" name="work_off" />
          <h3 className="font-display text-lg font-bold text-text">
            {totalDatabaseJobs === 0 ? 'Belum ada data lowongan' : 'Tidak ada lowongan yang cocok'}
          </h3>
          <p className="text-text-secondary text-sm mt-1 max-w-md mx-auto">
            {totalDatabaseJobs === 0
              ? 'Belum ada lowongan terimport di database. Jalankan `php artisan jobs:import` untuk mengisi data riil.'
              : `Tidak ditemukan lowongan yang cocok dengan kata kunci atau filter saat ini. Coba sesuaikan kata kunci pencarian.`}
          </p>
          {hasActiveFilters && totalDatabaseJobs > 0 && (
            <div className="mt-4">
              <button
                onClick={resetFilters}
                className="btn-secondary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Icon className="text-[16px]" name="restart_alt" />
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}