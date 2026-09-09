import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useToast } from '../context/ToastContext';
import { useSkills } from '../context/SkillContext';
import Icon from '../components/Icon.jsx';
import MyCoursesSection from '../components/MyCoursesSection.jsx';


const TRENDING_SKILLS = [
  { name: 'Docker', count: 1205, demand: 'Tinggi', category: 'DevOps' },
  { name: 'Node.js', count: 980, demand: 'Tinggi', category: 'Backend' },
  { name: 'Kubernetes', count: 850, demand: 'Sedang', category: 'DevOps' },
  { name: 'TypeScript', count: 820, demand: 'Tinggi', category: 'Bahasa Pemrograman' },
  { name: 'Go (Golang)', count: 640, demand: 'Tinggi', category: 'Backend' },
  { name: 'AWS', count: 590, demand: 'Sedang', category: 'Cloud' },
];

export default function SkillManager() {
  const toast = useToast();
  const { mySkills, addSkill, removeSkill } = useSkills();
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState('Dasar');
  const { courses = [], currentSemester = 1, studyProgram = null } = usePage().props;

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    
    const success = addSkill(newSkill, newLevel, 'Ditambahkan Manual');
    if (!success) {
      toast.info('Info', 'Skill ini sudah ada di profil Anda.');
    } else {
      toast.success('Skill Ditambahkan', `${newSkill} berhasil ditambahkan ke profil Anda.`);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (id) => {
    removeSkill(id);
  };

  const handleAddTrending = (skillName) => {
    const success = addSkill(skillName, 'Dasar', 'Ditambahkan dari Tren');
    if (!success) {
      toast.info('Info', 'Skill ini sudah ada di profil Anda.');
    } else {
      toast.success('Skill Ditambahkan', `${skillName} berhasil ditambahkan.`);
    }
  };

  // Generate dynamic AI insight based on user skills
  const hasDocker = mySkills.some(s => s.name.toLowerCase() === 'docker');
  const hasNode = mySkills.some(s => s.name.toLowerCase() === 'node.js');
  const hasK8s = mySkills.some(s => s.name.toLowerCase() === 'kubernetes');

  let dynamicInsight = (
    <>Profil Anda saat ini memiliki kecocokan tinggi dengan lowongan Frontend. Namun, menambahkan skill <strong>Docker</strong> atau <strong>Node.js</strong> dapat meningkatkan peluang Anda hingga 40% untuk posisi Full-stack Developer.</>
  );

  if (hasDocker && hasNode && !hasK8s) {
    dynamicInsight = (
      <>Bagus! Anda sudah memiliki <strong>Docker</strong> dan <strong>Node.js</strong>. Anda memiliki basis yang sangat kuat untuk Full-stack/Backend Developer. Pelajari <strong>Kubernetes</strong> untuk membuka peluang DevOps dengan kenaikan gaji hingga 25%.</>
    );
  } else if (hasDocker && hasNode && hasK8s) {
    dynamicInsight = (
      <>Luar biasa! Kombinasi <strong>Docker</strong>, <strong>Node.js</strong>, dan <strong>Kubernetes</strong> membuat profil Anda sangat kompetitif (Top 5%). Anda siap untuk melamar posisi Senior Backend atau DevOps Engineer.</>
    );
  } else if (mySkills.length > 8) {
    dynamicInsight = (
      <>Profil Anda sangat beragam dengan {mySkills.length} skill. Fokus tingkatkan penguasaan (Mahir) pada 3 skill utama Anda untuk membedakan diri Anda dari kandidat lain.</>
    );
  }

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
          <Icon className="text-[28px] text-brand" name="psychology" />
          Manajemen Keahlian
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Kelola portofolio skill Anda dan pantau skill apa yang sedang banyak dicari di industri saat ini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Form & Skill Saya */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5">
            <h3 className="font-display text-base font-semibold text-text mb-4">Tambah Skill Baru</h3>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nama Skill</label>
                <input
                  type="text"
                  placeholder="Contoh: Python, Figma..."
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Tingkat Penguasaan</label>
                <select
                  value={newLevel}
                  onChange={e => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand bg-white"
                >
                  <option>Dasar (Beginner)</option>
                  <option>Menengah (Intermediate)</option>
                  <option>Mahir (Advanced)</option>
                </select>
              </div>
              <button type="submit" className="w-full btn-primary py-2 text-sm">
                Tambahkan
              </button>
            </form>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-gray-50">
              <h3 className="font-display text-sm font-semibold text-text">Skill Saya ({mySkills.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {mySkills.length === 0 ? (
                <div className="p-6 text-center text-sm text-text-muted">Belum ada skill yang ditambahkan.</div>
              ) : (
                mySkills.map(skill => (
                  <div key={skill.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-text">{skill.name}</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">{skill.levelString} &bull; {skill.type}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Hapus Skill"
                    >
                      <Icon className="text-[18px]" name="delete" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Trending Skills */}
        <div className="lg:col-span-2">
          <div className="card p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display text-lg font-bold text-text">Rangkuman Tren Skill Industri</h3>
                <p className="text-xs text-text-secondary mt-1">Skill yang paling sering muncul dari 5000+ lowongan kerja bulan ini.</p>
              </div>
              <Icon className="text-brand text-3xl opacity-20" name="trending_up" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRENDING_SKILLS.map((ts, idx) => (
                <div key={ts.name} className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-brand/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-text-secondary group-hover:bg-brand-light group-hover:text-brand transition-colors">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text">{ts.name}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{ts.count} Penyebutan &bull; <span className="text-brand font-semibold">Demand {ts.demand}</span></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAddTrending(ts.name)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-secondary hover:bg-brand hover:border-brand hover:text-white transition-all"
                    title="Tambahkan ke Profil"
                  >
                    <Icon className="text-[16px]" name="add" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
              <Icon className="text-blue-600" name="lightbulb" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 mb-1">Insight AI</h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  {dynamicInsight}
                </p>
              </div>
            </div>
            
          </div>
        </div>

        <MyCoursesSection courses={courses} currentSemester={currentSemester} studyProgram={studyProgram} />

      </div>
    </div>
  );
}
