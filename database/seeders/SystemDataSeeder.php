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
            ['nama' => 'Zero Trust Architecture', 'kategori' => 'Cybersecurity', 'sektor_industri_terkait' => 'Keuangan'],
            ['nama' => 'Snowflake', 'kategori' => 'Data Science', 'sektor_industri_terkait' => 'Kesehatan'],
            ['nama' => 'GraphQL APIs', 'kategori' => 'Backend Dev', 'sektor_industri_terkait' => 'Teknologi & TI'],
        ];

        $skills = [];
        foreach ($skillsData as $sd) {
            $skills[$sd['nama']] = Skill::create($sd);
        }

        // 2. Fetch Study Programs and Users
        $prodiTI = StudyProgram::where('nama_prodi', 'Teknik Informatika')->first();
        $prodiTE = StudyProgram::where('nama_prodi', 'Teknik Elektronika')->first();

        $dosenTI = User::role('dosen')->where('study_program_id', $prodiTI?->id)->get();
        $dosenTE = User::role('dosen')->where('study_program_id', $prodiTE?->id)->get();

        // 3. Seed Courses and link to Study Programs
        $courses = [];

        if ($prodiTI) {
            $courses[] = Course::create([
                'study_program_id' => $prodiTI->id,
                'code' => 'IF-301',
                'name' => 'Pemrograman Web Enterprise',
                'semester' => 3,
                'credits' => 4,
                'versi' => 'v1',
                'status_verifikasi_ekstraksi' => true,
            ]);

            $courses[] = Course::create([
                'study_program_id' => $prodiTI->id,
                'code' => 'IF-402',
                'name' => 'Teknologi Cloud & DevOps',
                'semester' => 4,
                'credits' => 3,
                'versi' => 'v1',
                'status_verifikasi_ekstraksi' => true,
            ]);

            $courses[] = Course::create([
                'study_program_id' => $prodiTI->id,
                'code' => 'IF-501',
                'name' => 'Kecerdasan Buatan & Machine Learning',
                'semester' => 5,
                'credits' => 3,
                'versi' => 'v1',
                'status_verifikasi_ekstraksi' => false,
            ]);
        }

        if ($prodiTE) {
            $courses[] = Course::create([
                'study_program_id' => $prodiTE->id,
                'code' => 'EL-301',
                'name' => 'Mikroelektronika & Embedded Systems',
                'semester' => 3,
                'credits' => 4,
                'versi' => 'v1',
                'status_verifikasi_ekstraksi' => true,
            ]);
        }

        // 4. Link Courses to Skills
        foreach ($courses as $course) {
            if ($course->code === 'IF-301') {
                $course->skills()->sync([$skills['React.js']->id, $skills['GraphQL APIs']->id]);
            } elseif ($course->code === 'IF-402') {
                $course->skills()->sync([$skills['Docker']->id, $skills['Kubernetes']->id, $skills['AWS Cloud']->id]);
            } elseif ($course->code === 'IF-501') {
                $course->skills()->sync([$skills['LLM Fine-tuning']->id, $skills['Snowflake']->id]);
            }
        }

        // 5. Link Courses to Dosens
        if ($dosenTI->count() > 0) {
            // Dosen 1 teaches Web Enterprise and Cloud
            $dosenTI[0]->courses()->sync([$courses[0]->id, $courses[1]->id]);
            if ($dosenTI->count() > 1) {
                // Dosen 2 teaches AI
                $dosenTI[1]->courses()->sync([$courses[2]->id]);
            }
        }

        if ($dosenTE->count() > 0 && isset($courses[3])) {
            $dosenTE[0]->courses()->sync([$courses[3]->id]);
        }

        // 6. Seed GapAnalysis Records
        if ($prodiTI) {
            GapAnalysis::create([
                'study_program_id' => $prodiTI->id,
                'skill_id' => $skills['Docker']->id,
                'tipe_mismatch' => 'under_skill',
                'skor_urgensi' => 8,
                'match_rate' => 65.0,
                'periode_data' => '2026-08',
                'evidence_count' => 14,
            ]);

            GapAnalysis::create([
                'study_program_id' => $prodiTI->id,
                'skill_id' => $skills['Kubernetes']->id,
                'tipe_mismatch' => 'under_skill',
                'skor_urgensi' => 9,
                'match_rate' => 40.0,
                'periode_data' => '2026-08',
                'evidence_count' => 22,
            ]);

            GapAnalysis::create([
                'study_program_id' => $prodiTI->id,
                'skill_id' => $skills['LLM Fine-tuning']->id,
                'tipe_mismatch' => 'under_skill',
                'skor_urgensi' => 10,
                'match_rate' => 10.0,
                'periode_data' => '2026-08',
                'evidence_count' => 8,
            ]);

            GapAnalysis::create([
                'study_program_id' => $prodiTI->id,
                'skill_id' => $skills['React.js']->id,
                'tipe_mismatch' => 'aligned',
                'skor_urgensi' => 0,
                'match_rate' => 95.0,
                'periode_data' => '2026-08',
                'evidence_count' => 45,
            ]);
        }

        // 7. Seed Scraping Agents
        ScrapingAgent::create([
            'wilayah' => 'JKT-Node-01 (Jakarta)',
            'status' => 'Aktif',
            'uptime' => 99.98,
            'volume_data' => 4.2,
            'last_sync' => now(),
        ]);

        ScrapingAgent::create([
            'wilayah' => 'SUB-Node-02 (Surabaya)',
            'status' => 'Aktif',
            'uptime' => 99.95,
            'volume_data' => 2.8,
            'last_sync' => now(),
        ]);

        ScrapingAgent::create([
            'wilayah' => 'BDO-Node-03 (Bandung)',
            'status' => 'Sinkronisasi',
            'uptime' => 98.50,
            'volume_data' => 1.1,
            'last_sync' => now(),
        ]);
    }
}
