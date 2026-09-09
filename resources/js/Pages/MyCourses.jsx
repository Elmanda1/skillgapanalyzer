import React, { useMemo } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Icon from '../components/Icon.jsx';

export default function MyCourses() {
  const { courses = [], currentSemester = 1, studyProgram = null } = usePage().props;

  const grouped = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (!map.has(c.semester)) map.set(c.semester, []);
      map.get(c.semester).push(c);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [courses]);

  const passedCount = courses.filter((c) => c.status === 'passed').length;
  const currentCount = courses.filter((c) => c.status === 'current').length;

  return (
    <div className="w-full p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Matkul Saya</h1>
        <p className="text-sm text-text-secondary mt-1">
          {studyProgram ? `${studyProgram.jenjang} ${studyProgram.nama_prodi} — ` : ''}Semester {currentSemester} · {passedCount} lulus · {currentCount} berjalan
        </p>
      </div>

      {grouped.length === 0 && (
        <div className="card p-8 text-center text-sm text-text-secondary">
          Belum ada mata kuliah untuk semester kamu.
        </div>
      )}

      {grouped.map(([semester, list]) => (
        <section key={semester} className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-gray-50/60 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-text flex items-center gap-2">
              <Icon className="text-brand text-[18px]" name="menu_book" />
              Semester {semester}
            </h2>
            <span className="text-xs text-text-muted">{list.length} MK</span>
          </div>
          <div className="divide-y divide-border">
            {list.map((c) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand">{c.code}</span>
                    <span className="text-[11px] text-text-muted">· {c.credits} SKS</span>
                  </div>
                  <p className="text-sm font-semibold text-text truncate">{c.name}</p>
                  {c.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-[10px] bg-gray-100 text-text-secondary px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`badge text-[11px] ${c.status === 'passed' ? 'badge-green' : 'badge-yellow'}`}>
                  {c.status === 'passed' ? 'Lulus' : 'Berjalan'}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Link href="/dashboard" className="text-xs font-semibold text-brand hover:underline">
        ← Kembali ke dashboard
      </Link>
    </div>
  );
}
