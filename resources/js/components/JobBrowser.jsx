import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const DUMMY_JOBS = [
  { id: 1, title: 'Junior Backend Developer', company: 'Gojek', location: 'Jakarta, Indonesia (Hybrid)', salary: 'Rp 8–12 jt/bln', match: 85, type: 'Full-time', skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker'] },
  { id: 2, title: 'Software Engineer', company: 'Tokopedia', location: 'Jakarta, Indonesia (On-site)', salary: 'Rp 10–15 jt/bln', match: 78, type: 'Full-time', skills: ['Golang', 'GRPC', 'Redis', 'Kubernetes'] },
  { id: 3, title: 'Node.js Developer', company: 'Dana', location: 'Jakarta, Indonesia (Remote)', salary: 'Rp 9–13 jt/bln', match: 72, type: 'Contract', skills: ['Node.js', 'MongoDB', 'AWS', 'Microservices'] },
  { id: 4, title: 'Full-stack Dev (Junior)', company: 'Tiket.com', location: 'Bali, Indonesia (Remote)', salary: 'Rp 7–11 jt/bln', match: 68, type: 'Full-time', skills: ['React', 'Node.js', 'Tailwind', 'MySQL'] },
  { id: 5, title: 'Frontend Engineer', company: 'Traveloka', location: 'Tangerang, Banten (Hybrid)', salary: 'Rp 9–14 jt/bln', match: 55, type: 'Full-time', skills: ['React', 'Next.js', 'TypeScript', 'Figma'] },
  { id: 6, title: 'Backend Intern', company: 'Ruangguru', location: 'Jakarta (Remote)', salary: 'Rp 3–5 jt/bln', match: 92, type: 'Internship', skills: ['Node.js', 'REST API', 'Git'] },
];

export default function JobBrowser() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filteredJobs = DUMMY_JOBS.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || job.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleApply = (company) => {
    toast.success('Berhasil Disimpan', `Lowongan dari ${company} telah disimpan ke daftar lamaran Anda.`);
  };

  return (
    <div className="w-full p-6 md:p-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-brand">work</span>
            Eksplorasi Lowongan
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Temukan lowongan pekerjaan yang paling cocok dengan profil skill Anda saat ini.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari posisi atau perusahaan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-white"
            />
          </div>
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg text-sm bg-white outline-none focus:border-brand"
          >
            <option value="All">Semua Tipe</option>
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length > 0 ? filteredJobs.map(job => (
          <div key={job.id} className="card p-5 hover:shadow-lg transition-shadow border border-border/50 hover:border-brand/30 group flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-text group-hover:text-brand transition-colors">{job.title}</h3>
                <p className="text-sm text-text-secondary">{job.company}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${job.match >= 80 ? 'bg-green-50 text-green-700 border-green-200' : job.match >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                {job.match}% Cocok
              </div>
            </div>
            
            <div className="space-y-2 mb-4 flex-1">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {job.location}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                {job.salary}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {job.type}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-semibold text-text-secondary mb-2">Syarat Keahlian:</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-gray-100 text-text-secondary text-[10px] font-medium rounded">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button 
                onClick={() => handleApply(job.company)}
                className="flex-1 btn-primary py-2 text-xs font-semibold"
              >
                Simpan & Lamar
              </button>
              <button className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:bg-gray-50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">bookmark_border</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">work_off</span>
            <p className="text-text-secondary text-sm">Tidak ada lowongan yang sesuai dengan pencarian Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
