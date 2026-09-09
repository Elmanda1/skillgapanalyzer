<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\GapAnalysis;
use App\Models\ScrapingAgent;
use App\Models\Skill;
use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Database\Seeder;

class SystemDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Skills
        $skillsData = [
            ['nama' => 'Docker', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'Kubernetes', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'AWS Cloud', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'LLM Fine-tuning', 'kategori' => 'AI & Data Science', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'React.js', 'kategori' => 'Frontend Dev', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'Next.js', 'kategori' => 'Frontend Dev', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'Flutter', 'kategori' => 'Mobile Dev', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'Laravel', 'kategori' => 'Backend Dev', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'GraphQL APIs', 'kategori' => 'Backend Dev', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'Zero Trust Architecture', 'kategori' => 'Cybersecurity', 'sektor_industri_terkait' => 'Keuangan'],
            ['nama' => 'Snowflake', 'kategori' => 'Data Science', 'sektor_industri_terkait' => 'Kesehatan'],
            ['nama' => 'Computer Vision', 'kategori' => 'AI & Data Science', 'sektor_industri_terkait' => 'Manufaktur'],
            ['nama' => 'CI/CD Pipelines', 'kategori' => 'Cloud & DevOps', 'sektor_industri_terkait' => 'Teknologi & TI'],
            ['nama' => 'PostgreSQL', 'kategori' => 'Database', 'sektor_industri_terkait' => 'Keuangan'],
        ];

        $skills = [];
        foreach ($skillsData as $sd) {
            $skills[$sd['nama']] = Skill::create($sd);
        }

        // 2. Course templates per study program discipline
        $prodiTemplates = [
            'informatika' => [
                ['name' => 'Pemrograman Web Enterprise', 'credits' => 4, 'semester' => 3, 'skills' => ['React.js', 'Next.js', 'Laravel', 'Node.js', 'HTML5', 'CSS3']],
                ['name' => 'Teknologi Cloud & DevOps', 'credits' => 3, 'semester' => 4, 'skills' => ['Docker', 'Kubernetes', 'AWS Cloud', 'CI/CD Pipelines', 'Linux Administration']],
                ['name' => 'Basis Data & Sistem Terdistribusi', 'credits' => 3, 'semester' => 3, 'skills' => ['PostgreSQL', 'MySQL', 'Redis', 'REST APIs', 'Microservices']],
                ['name' => 'Pengembangan Aplikasi Mobile Terapan', 'credits' => 3, 'semester' => 4, 'skills' => ['Flutter', 'React Native', 'Kotlin']],
                ['name' => 'Keamanan Siber & Aplikasi', 'credits' => 3, 'semester' => 5, 'skills' => ['Zero Trust Architecture', 'Penetration Testing', 'Network Security']],
                ['name' => 'Manajemen Agile & Soft Skills', 'credits' => 2, 'semester' => 2, 'skills' => ['Agile Project Management', 'Stakeholder Communication', 'Problem Solving']],
            ],
            'elektronika' => [
                ['name' => 'Mikrokontroler & Embedded Systems', 'credits' => 4, 'semester' => 3, 'skills' => ['Linux Administration', 'Python', 'Debugging', 'Unit Testing']],
                ['name' => 'Elektronika Digital & Instrumentasi', 'credits' => 4, 'semester' => 2, 'skills' => ['Problem Solving', 'Incident Response', 'Time Management']],
                ['name' => 'IoT & Komunikasi Nirkabel', 'credits' => 3, 'semester' => 4, 'skills' => ['Network Security', 'REST APIs', 'Linux Administration']],
                ['name' => 'Manajemen Mutu & K3 Industri', 'credits' => 2, 'semester' => 1, 'skills' => ['Technical Writing', 'Continuous Learning', 'Stakeholder Communication']],
            ],
            'telekomunikasi' => [
                ['name' => 'Jaringan Komputer & Routing', 'credits' => 4, 'semester' => 3, 'skills' => ['Network Security', 'Linux Administration', 'Nginx', 'SIEM']],
                ['name' => 'Komunikasi Data & Protokol Transmisi', 'credits' => 3, 'semester' => 4, 'skills' => ['REST APIs', 'Microservices', 'GraphQL APIs', 'PostgreSQL']],
                ['name' => 'Administrasi Server & Infra Cloud', 'credits' => 3, 'semester' => 4, 'skills' => ['Linux Administration', 'Prometheus', 'Grafana', 'Ansible']],
                ['name' => 'Manajemen Proyek Telekomunikasi', 'credits' => 2, 'semester' => 2, 'skills' => ['Agile Project Management', 'Time Management', 'Stakeholder Communication']],
            ],
            'sains data' => [
                ['name' => 'Pemrograman Data & Statistik', 'credits' => 4, 'semester' => 2, 'skills' => ['Python', 'Pandas', 'Scikit-learn', 'MySQL']],
                ['name' => 'Machine Learning & Deep Learning', 'credits' => 4, 'semester' => 4, 'skills' => ['Machine Learning', 'Deep Learning', 'PyTorch / TensorFlow', 'Computer Vision']],
                ['name' => 'Data Engineering & Big Data Warehousing', 'credits' => 3, 'semester' => 5, 'skills' => ['Data Engineering', 'Snowflake', 'Spark', 'PostgreSQL']],
                ['name' => 'Visualisasi Data & Analytics', 'credits' => 3, 'semester' => 3, 'skills' => ['Tableau', 'Natural Language Processing', 'LLM Fine-tuning']],
                ['name' => 'Analisis Masalah & Berpikir Kritis', 'credits' => 2, 'semester' => 1, 'skills' => ['Problem Solving', 'Technical Writing', 'Continuous Learning']],
            ],
            'sistem informasi' => [
                ['name' => 'Analisis & Perancangan Sistem Informasi', 'credits' => 4, 'semester' => 3, 'skills' => ['Requirements Analysis', 'Stakeholder Communication', 'Agile Project Management']],
                ['name' => 'Pengembangan Aplikasi Web Bisnis', 'credits' => 4, 'semester' => 4, 'skills' => ['Laravel', 'PHP', 'MySQL', 'HTML5', 'CSS3', 'REST APIs']],
                ['name' => 'Business Intelligence & Data Analisis', 'credits' => 3, 'semester' => 5, 'skills' => ['Tableau', 'PostgreSQL', 'Scrum Master']],
                ['name' => 'Desain Antarmuka Produk & UX', 'credits' => 3, 'semester' => 2, 'skills' => ['Figma', 'React.js']],
                ['name' => 'Manajemen Proyek TI & Komunikasi Stakeholder', 'credits' => 2, 'semester' => 3, 'skills' => ['Agile Project Management', 'Stakeholder Communication', 'Problem Solving', 'Time Management']],
            ],
        ];

        $skillsByName = Skill::all()->keyBy('nama');
        $allStudyPrograms = StudyProgram::all();

        foreach ($allStudyPrograms as $sp) {
            $dosens = User::role('dosen')->where('study_program_id', $sp->id)->get();
            $nameLower = mb_strtolower($sp->nama_prodi, 'UTF-8');

            $templateKey = 'informatika';
            if (str_contains($nameLower, 'elektronika')) {
                $templateKey = 'elektronika';
            } elseif (str_contains($nameLower, 'telekomunikasi')) {
                $templateKey = 'telekomunikasi';
            } elseif (str_contains($nameLower, 'sains data')) {
                $templateKey = 'sains data';
            } elseif (str_contains($nameLower, 'sistem informasi') || str_contains($nameLower, 'manajemen informatika')) {
                $templateKey = 'sistem informasi';
            }

            $selectedTemplates = $prodiTemplates[$templateKey];

            foreach ($selectedTemplates as $index => $tmpl) {
                $prefix = match (true) {
                    str_contains($sp->nama_institusi, 'Jakarta') => 'PNJ',
                    str_contains($sp->nama_institusi, 'Bandung') || str_contains($sp->nama_institusi, 'POLBAN') => 'PLB',
                    str_contains($sp->nama_institusi, 'Surabaya') || str_contains($sp->nama_institusi, 'PENS') => 'PNS',
                    str_contains($sp->nama_institusi, 'Malang') || str_contains($sp->nama_institusi, 'POLINEMA') => 'PLM',
                    str_contains($sp->nama_institusi, 'Semarang') || str_contains($sp->nama_institusi, 'POLINES') => 'PLS',
                    str_contains($sp->nama_institusi, 'Bali') || str_contains($sp->nama_institusi, 'PNB') => 'PNB',
                    default => 'MK',
                };

                $course = Course::create([
                    'study_program_id' => $sp->id,
                    'code' => "{$prefix}-" . (300 + $index * 10),
                    'name' => $tmpl['name'],
                    'semester' => $tmpl['semester'],
                    'credits' => $tmpl['credits'],
                    'versi' => 'v1',
                    'status_verifikasi_ekstraksi' => true,
                ]);

                $skillIds = [];
                foreach ($tmpl['skills'] as $sName) {
                    if (isset($skillsByName[$sName])) {
                        $skillIds[] = $skillsByName[$sName]->id;
                    }
                }
                if (! empty($skillIds)) {
                    $course->skills()->sync($skillIds);
                }

                if ($dosens->isNotEmpty()) {
                    $assignedDosen = $dosens[$index % $dosens->count()];
                    $assignedDosen->courses()->syncWithoutDetaching([$course->id]);
                }
            }
        }

        // Run gap analysis engine dynamically for seeded programs
        $analyzer = app(\App\Services\Analysis\SkillGapAnalyzerService::class);
        $analyzer->analyze(null, '2026-08');

        // 4. Seed Scraping Agents
        ScrapingAgent::create([
            'wilayah' => 'JKT-Node-01 (DKI Jakarta & Banten)',
            'status' => 'Aktif',
            'uptime' => 99.98,
            'volume_data' => 4.2,
            'last_sync' => now(),
        ]);

        ScrapingAgent::create([
            'wilayah' => 'JBR-Node-02 (Jawa Barat & Bandung)',
            'status' => 'Aktif',
            'uptime' => 99.91,
            'volume_data' => 3.5,
            'last_sync' => now(),
        ]);

        ScrapingAgent::create([
            'wilayah' => 'JTM-Node-03 (Jawa Timur & Surabaya/Malang)',
            'status' => 'Aktif',
            'uptime' => 99.95,
            'volume_data' => 3.8,
            'last_sync' => now(),
        ]);

        ScrapingAgent::create([
            'wilayah' => 'JTG-Node-04 (Jawa Tengah & Semarang)',
            'status' => 'Aktif',
            'uptime' => 99.80,
            'volume_data' => 2.4,
            'last_sync' => now(),
        ]);

        ScrapingAgent::create([
            'wilayah' => 'DPS-Node-05 (Bali & Nusa Tenggara)',
            'status' => 'Sinkronisasi',
            'uptime' => 98.65,
            'volume_data' => 1.7,
            'last_sync' => now(),
        ]);
    }
}
