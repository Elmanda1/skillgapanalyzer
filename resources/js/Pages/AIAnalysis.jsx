import React, { useState, useEffect, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon.jsx';


export default function AIAnalysis({
  criticalGaps = [],
  studyPrograms = [],
  selectedProgramId = 1,
  selectedPeriod = '',
  radarDimensions = [],
  totalEvaluated = 0,
  availablePeriods = [],
}) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [generatorState, setGeneratorState] = useState('idle');
  const [generatorStep, setGeneratorStep] = useState(0);
  const [selectedGapForRps, setSelectedGapForRps] = useState(null);
  const [generatedSyllabus, setGeneratedSyllabus] = useState(null);
  const [appliedDrafts, setAppliedDrafts] = useState({});

  const radarRef = useRef(null);
  const radarChart = useRef(null);

  // Render Radar Chart for 5 Dimensions
  useEffect(() => {
    if (!radarRef.current || radarDimensions.length === 0) return;
    if (radarChart.current) radarChart.current.destroy();

    radarChart.current = new Chart(radarRef.current.getContext('2d'), {
      type: 'radar',
      data: {
        labels: radarDimensions.map(d => d.label),
        datasets: [{
          label: 'Capaian Kurikulum (%)',
          data: radarDimensions.map(d => d.score),
          backgroundColor: 'rgba(13, 148, 136, 0.2)',
          borderColor: '#0d9488',
          borderWidth: 2,
          pointBackgroundColor: '#0d9488',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 5,
        }, {
          label: 'Target Industri (%)',
          data: [90, 85, 85, 80, 80],
          backgroundColor: 'rgba(234, 88, 12, 0.08)',
          borderColor: '#ea580c',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, font: { size: 9 } },
            pointLabels: { font: { size: 10, weight: '600' } },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      if (radarChart.current) radarChart.current.destroy();
    };
  }, [radarDimensions]);

  const handleProgramChange = (e) => {
    const pId = e.target.value;
    router.get('/ai-analysis', { program_id: pId, period: selectedPeriod }, { preserveState: true });
  };

  const handlePeriodChange = (e) => {
    const per = e.target.value;
    router.get('/ai-analysis', { program_id: selectedProgramId, period: per }, { preserveState: true });
  };

  const startGenerator = (gapItem) => {
    setSelectedGapForRps(gapItem);
    setGeneratorState('generating');
    setGeneratorStep(1);
    toast.info('Memulai AI Generator...', `Menganalisis kebutuhan materi untuk ${gapItem.name}.`);

    setTimeout(() => {
      setGeneratorStep(2);
      setTimeout(() => {
        setGeneratorStep(3);
        setTimeout(() => {
          setGeneratorState('finished');
          setGeneratedSyllabus({
            title: `Rencana Pembelajaran Semester (RPS): ${gapItem.name}`,
            course: `Praktikum ${gapItem.name} Terapan`,
            credits: '3 SKS (1 Teori, 2 Praktikum)',
            semester: 'Semester 5 / 6',
            cpmk: [
              `1. Mahasiswa mampu memahami konsep dasar dan arsitektur ${gapItem.name} dalam ekosistem industri modern.`,
              `2. Mahasiswa mampu mengimplementasikan dan mengonfigurasi ${gapItem.name} pada proyek berskala riil.`,
              `3. Mahasiswa mampu melakukan pengujian, troubleshooting, dan deployment berbasis standar industri.`,
            ],
            tools: `${gapItem.name}, Git, Docker, Linux Server, Automated Testing`,
          });
          toast.success('Selesai', `Draf RPS untuk ${gapItem.name} berhasil digenerate.`);
        }, 1000);
      }, 1000);
    }, 900);
  };

  const handleApply = (id, title) => {
    setAppliedDrafts(p => ({ ...p, [id]: true }));
    toast.success('Draf Diterapkan', `RPS "${title}" telah disimpan sebagai draf usulan kurikulum prodi.`);
  };

  const filteredGaps = criticalGaps.filter(g =>
    !searchQuery ||
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProgramObj = studyPrograms.find(p => p.id === Number(selectedProgramId)) || studyPrograms[0];

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up space-y-6">

      {/* ── Header Bar ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text">Rekomendasi Intervensi Kurikulum</h1>
          <p className="text-sm text-text-secondary mt-1">
            Saran penyesuaian materi kuliah dan generator draf RPS otomatis berdasarkan kesenjangan kompetensi industri.
          </p>
        </div>

        {/* Filters: Program & Period */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedProgramId}
              onChange={handleProgramChange}
              className="appearance-none pl-3 pr-8 py-2 border border-border rounded-xl text-sm bg-slate-50 font-medium text-text focus:outline-none focus:border-brand cursor-pointer shadow-sm"
            >
              {studyPrograms.map(p => (
                <option key={p.id} value={p.id}>Prodi: {p.nama_prodi} ({p.jenjang})</option>
              ))}
            </select>
            <Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none" name="expand_more" />
          </div>

          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              className="appearance-none pl-3 pr-8 py-2 border border-border rounded-xl text-sm bg-slate-50 font-medium text-text focus:outline-none focus:border-brand cursor-pointer shadow-sm"
            >
              {availablePeriods.map(p => (
                <option key={p} value={p}>Periode: {p}</option>
              ))}
            </select>
            <Icon className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none" name="calendar_month" />
          </div>

          <button
            onClick={() => {
              toast.info('Re-Analisis', 'Menjalankan engine kalkulasi ulang kesenjangan kurikulum...');
              router.post('/analysis/run', { study_program_id: selectedProgramId, period: selectedPeriod }, {
                preserveScroll: true,
                onSuccess: () => toast.success('Selesai', 'Data kesenjangan berhasil diperbarui secara live.'),
              });
            }}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl bg-white hover:bg-slate-50 shadow-sm"
          >
            <Icon className="text-[16px]" name="sync" />
            Re-Analisis
          </button>
        </div>
      </div>

      {/* ── Top Section: Radar Chart & Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 5 Dimensions Radar */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-display text-base font-semibold text-text">Radar 5 Dimensi Kompetensi</h3>
              <p className="text-xs text-text-muted">Isnandar et al. (2024)</p>
            </div>
            <span className="text-xs font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-md">
              {selectedProgramObj?.nama_prodi}
            </span>
          </div>
          <div className="h-56 relative my-2">
            <canvas ref={radarRef} />
          </div>
          <p className="text-[11px] text-text-secondary text-center border-t border-slate-100 pt-2">
            Membandingkan capaian kurikulum saat ini terhadap batas standar industri (Target 80-90%).
          </p>
        </div>

        {/* Urgent Gaps Overview */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-base font-semibold text-text">Kesenjangan Prioritas Tertinggi</h3>
              <p className="text-xs text-text-secondary">Daftar keahlian dengan urgensi intervensi kurikulum tertinggi.</p>
            </div>
            <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-lg border border-rose-200">
              {criticalGaps.length} Kesenjangan Kritis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Keahlian & Kategori</th>
                  <th className="py-2.5 px-2">Mismatch Type</th>
                  <th className="py-2.5 px-2 text-center">Urgensi</th>
                  <th className="py-2.5 px-2 text-center">Bukti Lowongan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criticalGaps.slice(0, 5).map((gap) => (
                  <tr key={gap.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-text">{gap.name}</div>
                      <div className="text-[10px] text-text-muted">{gap.category}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${gap.tipe_mismatch === 'skill_shortages'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                        {gap.tipe_mismatch === 'skill_shortages' ? 'Skill Shortage' : 'Underskilling'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="font-bold text-rose-600">{gap.skor_urgensi}/10</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-medium text-slate-700">
                      {gap.evidence_count} lowongan
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => startGenerator(gap)}
                        className="btn-outline text-[11px] py-1 px-2 rounded-lg bg-brand-light text-brand border-brand/30 hover:bg-brand hover:text-white transition-all inline-flex items-center gap-1"
                      >
                        <Icon className="text-[13px]" name="auto_awesome" />
                        Generate RPS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-text-muted">
            <span>Menampilkan 5 dari {criticalGaps.length} kesenjangan terdeteksi</span>
            <Link href="/competency" className="text-brand font-medium hover:underline flex items-center gap-1">
              Buka Seluruh Peta Kesenjangan
              <Icon className="text-[14px]" name="arrow_forward" />
            </Link>
          </div>
        </div>

      </div>

      {/* ── RPS Generator Modal / Result Box ── */}
      {generatorState !== 'idle' && (
        <div className="bg-white border-2 border-brand/30 rounded-2xl p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Icon className="text-brand text-2xl" name="auto_awesome" />
              <div>
                <h3 className="font-display text-lg font-bold text-text">
                  AI RPS Generator: {selectedGapForRps?.name}
                </h3>
                <p className="text-xs text-text-secondary">Penyusunan Capaian Pembelajaran berbasis Standar KKNI & Industri</p>
              </div>
            </div>
            <button
              onClick={() => setGeneratorState('idle')}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              Tutup ✕
            </button>
          </div>

          {generatorState === 'generating' ? (
            <div className="py-8 text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
              <p className="text-sm font-semibold text-text">
                {generatorStep === 1 && 'Menganalisis teks kesenjangan kurikulum & profil industri...'}
                {generatorStep === 2 && 'Merumuskan Capaian Pembelajaran Mata Kuliah (CPMK)...'}
                {generatorStep === 3 && 'Memvalidasi kesesuaian SKS dan modul praktikum...'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-text-muted block">Usulan Mata Kuliah:</span>
                  <strong className="text-text">{generatedSyllabus?.course}</strong>
                </div>
                <div>
                  <span className="text-text-muted block">Bobot & SKS:</span>
                  <strong className="text-text">{generatedSyllabus?.credits}</strong>
                </div>
                <div>
                  <span className="text-text-muted block">Rekomendasi Penempatan:</span>
                  <strong className="text-text">{generatedSyllabus?.semester}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Capaian Pembelajaran Mata Kuliah (CPMK):
                </h4>
                <div className="space-y-2">
                  {generatedSyllabus?.cpmk.map((c, i) => (
                    <div key={i} className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-slate-800 flex items-start gap-2">
                      <Icon className="text-emerald-600 text-[16px] mt-0.5" name="check_circle" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setGeneratorState('idle')}
                  className="btn-outline text-xs py-2 px-4 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    handleApply(selectedGapForRps?.id, generatedSyllabus?.course);
                    setGeneratorState('idle');
                  }}
                  className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <Icon className="text-[16px]" name="save" />
                  Terapkan Sebagai Draf Resmi
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI Recommendation Cards Grid ── */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-text">
              Daftar Paket Rekomendasi Kurikulum ({filteredGaps.length} Paket)
            </h2>
            <p className="text-xs text-text-secondary">Saran konkret penyesuaian materi untuk dosen pengampu & Kaprodi.</p>
          </div>

          <div className="relative w-full md:w-64">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]" name="search" />
            <input
              type="text"
              placeholder="Cari rekomendasi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-xl text-xs focus:outline-none focus:border-brand bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGaps.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${item.tipe_mismatch === 'skill_shortages'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                    {item.proposed_tag}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Dampak: {item.impact}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-text mb-1">
                  {item.action_title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">
                  {item.body}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <Icon className="text-[14px]" name="warning" />
                  Urgensi: <strong className="text-rose-600">{item.urgency} ({item.skor_urgensi}/10)</strong>
                </span>

                <button
                  onClick={() => startGenerator(item)}
                  className="btn-primary text-xs py-1.5 px-3 rounded-xl flex items-center gap-1.5"
                >
                  <Icon className="text-[15px]" name="auto_awesome" />
                  Buat Draf RPS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
