import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import Icon from '../components/Icon.jsx';


export default function RegisterPage({ studyPrograms = [] }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    study_program_id: studyPrograms[0]?.id || '',
    semester: 1,
  });
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/register', {
      onSuccess: () => reset(),
    });
  };

  const formError = errors.name ?? errors.email ?? errors.password ?? errors.password_confirmation ?? errors.study_program_id ?? errors.semester;

  const inputClass = (hasError) =>
    `w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white ${
      hasError ? 'border-red-300' : 'border-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-page-bg via-white to-brand/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(6,78,59,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(6,78,59,0.1) 0%, transparent 40%)',
          }}
        />
      </div>

      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-brand transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-sm z-50"
      >
        <Icon className="text-[18px]" name="arrow_back" />
        Kembali
      </Link>

      <div className="w-full max-w-lg relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4 shadow-md">
            <Icon className="text-white text-3xl" name="insights" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text">Skill Gap Analyzer</h1>
          <p className="text-sm text-text-secondary mt-1">Sistem Analitik Kurikulum Vokasi</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          <h2 className="font-display text-lg font-bold text-text mb-1">Daftar sebagai Mahasiswa</h2>
          <p className="text-sm text-text-secondary mb-6">Buat akun untuk mulai memantau profil skill Anda.</p>

          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 mb-4">
              <Icon className="text-[14px]" name="error" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2">Nama Lengkap</label>
              <div className="relative group">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]" name="person" />
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData('name', e.target.value)}
                  placeholder="Masukkan nama lengkap..."
                  className={inputClass(errors.name)}
                  required
                />
              </div>
              {errors.name && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2">Email</label>
              <div className="relative group">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]" name="mail" />
                <input
                  type="email"
                  value={data.email}
                  onChange={e => setData('email', e.target.value)}
                  placeholder="nama@email.com"
                  className={inputClass(errors.email)}
                  required
                />
              </div>
              {errors.email && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-text-secondary mb-2">Program Studi / Kampus</label>
                <div className="relative group">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]" name="school" />
                  <select
                    value={data.study_program_id}
                    onChange={e => setData('study_program_id', e.target.value)}
                    className={inputClass(errors.study_program_id)}
                    required
                  >
                    <option value="">Pilih Program Studi...</option>
                    {studyPrograms.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.nama_institusi} - {sp.jenjang} {sp.nama_prodi}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.study_program_id && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.study_program_id}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">Semester Saat Ini</label>
                <div className="relative group">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]" name="format_list_numbered" />
                  <select
                    value={data.semester}
                    onChange={e => setData('semester', parseInt(e.target.value))}
                    className={inputClass(errors.semester)}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.semester && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.semester}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2">Kata Sandi</label>
              <div className="relative group">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]" name="lock" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={data.password}
                  onChange={e => setData('password', e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text transition-colors">
                  <Icon className="text-[20px]" name={showPw ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2">Konfirmasi Kata Sandi</label>
              <div className="relative group">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand transition-colors text-[20px]" name="lock_reset" />
                <input
                  type="password"
                  value={data.password_confirmation}
                  onChange={e => setData('password_confirmation', e.target.value)}
                  placeholder="Ulangi kata sandi..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                  required
                />
              </div>
              {errors.password_confirmation && <p className="mt-1.5 text-[11px] font-medium text-red-500">{errors.password_confirmation}</p>}
            </div>

            <div className="bg-brand/10 border border-brand/20 rounded-xl px-4 py-3 text-xs text-brand-dark flex items-start gap-3">
              <Icon className="text-[16px] mt-0.5 flex-shrink-0 text-brand" name="lightbulb" />
              <span className="leading-relaxed">Pendaftaran otomatis memberikan peran <b>Mahasiswa</b>. Fitur profil skill mahasiswa hadir di fase berikutnya.</span>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 bg-brand hover:bg-brand-dark text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand/30 hover:shadow-brand/40 transition-all transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-70 disabled:cursor-wait"
            >
              {processing ? (
                <>
                  <Icon className="text-[16px] animate-spin" name="progress_activity" />
                  Mendaftar...
                </>
              ) : (
                <>
                  <Icon className="text-[16px]" name="how_to_reg" />
                  Daftar Sekarang
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            <span className="text-xs text-text-secondary">Sudah punya akun?&nbsp;</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
            >
              Masuk di sini
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-5">
          Sistem Analitik Skill Gap — KMIPN VIII &nbsp;·&nbsp; Demo v0.1
        </p>
      </div>
    </div>
  );
}
