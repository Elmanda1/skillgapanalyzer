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

        // 2. Course templates per field
        $courseTemplates = [
            [
                'code' => 'TI-301',
                'name' => 'Pemrograman Web Enterprise',
                'semester' => 3,
                'credits' => 4,
                'skills' => ['React.js', 'Laravel', 'GraphQL APIs'],
                'gap' => [
                    ['skill' => 'React.js', 'type' => 'aligned', 'urgency' => 0, 'match' => 95.0, 'count' => 45],
                    ['skill' => 'Laravel', 'type' => 'aligned', 'urgency' => 2, 'match' => 90.0, 'count' => 38],
                ]
            ],
            [
                'code' => 'TI-402',
                'name' => 'Teknologi Cloud & DevOps',
                'semester' => 4,
                'credits' => 3,
                'skills' => ['Docker', 'Kubernetes', 'AWS Cloud', 'CI/CD Pipelines'],
                'gap' => [
                    ['skill' => 'Docker', 'type' => 'under_skill', 'urgency' => 8, 'match' => 55.0, 'count' => 28],
                    ['skill' => 'Kubernetes', 'type' => 'under_skill', 'urgency' => 9, 'match' => 35.0, 'count' => 22],
                    ['skill' => 'AWS Cloud', 'type' => 'under_skill', 'urgency' => 7, 'match' => 60.0, 'count' => 19],
                ]
            ],
            [
                'code' => 'TI-501',
                'name' => 'Kecerdasan Buatan & Machine Learning',
                'semester' => 5,
                'credits' => 3,
                'skills' => ['LLM Fine-tuning', 'Snowflake', 'Computer Vision'],
                'gap' => [
                    ['skill' => 'LLM Fine-tuning', 'type' => 'under_skill', 'urgency' => 10, 'match' => 20.0, 'count' => 18],
                    ['skill' => 'Computer Vision', 'type' => 'under_skill', 'urgency' => 7, 'match' => 65.0, 'count' => 14],
                ]
            ],
            [
                'code' => 'TI-403',
                'name' => 'Pengembangan Aplikasi Mobile Terapan',
                'semester' => 4,
                'credits' => 3,
                'skills' => ['Flutter', 'GraphQL APIs'],
                'gap' => [
                    ['skill' => 'Flutter', 'type' => 'aligned', 'urgency' => 1, 'match' => 88.0, 'count' => 32],
                ]
            ],
            [
                'code' => 'TI-302',
                'name' => 'Keamanan Siber & Arsitektur Jaringan',
                'semester' => 3,
                'credits' => 3,
                'skills' => ['Zero Trust Architecture', 'PostgreSQL'],
                'gap' => [
                    ['skill' => 'Zero Trust Architecture', 'type' => 'under_skill', 'urgency' => 9, 'match' => 30.0, 'count' => 15],
                ]
            ],
        ];

        // 3. Seed Courses & Gap Analysis for all study programs
        $allStudyPrograms = StudyProgram::all();

        foreach ($allStudyPrograms as $sp) {
            $dosens = User::role('dosen')->where('study_program_id', $sp->id)->get();

            foreach ($courseTemplates as $index => $tmpl) {
                // Course Code prefix based on institution code
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

                // Link Skills
                $skillIds = [];
                foreach ($tmpl['skills'] as $sName) {
                    if (isset($skills[$sName])) {
                        $skillIds[] = $skills[$sName]->id;
                    }
                }
                if (!empty($skillIds)) {
                    $course->skills()->sync($skillIds);
                }

                // Link to a Lecturer if available
                if ($dosens->isNotEmpty()) {
                    $assignedDosen = $dosens[$index % $dosens->count()];
                    $assignedDosen->courses()->syncWithoutDetaching([$course->id]);
                }

                // Gap Analysis for this prodi
                foreach ($tmpl['gap'] as $gapData) {
                    if (isset($skills[$gapData['skill']])) {
                        GapAnalysis::create([
                            'study_program_id' => $sp->id,
                            'skill_id' => $skills[$gapData['skill']]->id,
                            'tipe_mismatch' => $gapData['type'],
                            'skor_urgensi' => $gapData['urgency'],
                            'match_rate' => $gapData['match'],
                            'periode_data' => '2026-08',
                            'evidence_count' => $gapData['count'],
                        ]);
                    }
                }
            }
        }

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
