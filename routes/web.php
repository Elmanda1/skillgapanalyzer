<?php

use App\Http\Controllers\CurriculumController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\TaxonomyController;
use App\Models\Course;
use App\Models\GapAnalysis;
use App\Models\Skill;
use App\Models\StudyProgram;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('LandingPage');
});

Route::get('/login', function () {
    return inertia('LoginPage');
})->name('login');

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::get('/register', function () {
    return inertia('RegisterPage');
})->name('register');
Route::post('/register', [AuthController::class, 'registerStudent']);

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', function () {
        $user = request()->user();
        $role = $user->roles->first()?->name;

        $stats = match ($role) {
            'super_admin' => [
                'totalSkills' => Skill::count(),
                'totalCourses' => Course::count(),
                'totalGaps' => GapAnalysis::count(),
                'mismatchGaps' => GapAnalysis::where('tipe_mismatch', '!=', 'aligned')->count(),
                'totalStudyPrograms' => StudyProgram::count(),
                'totalCampuses' => StudyProgram::distinct('nama_institusi')->count('nama_institusi'),
                'totalUsers' => \App\Models\User::count(),
                'totalDosen' => \App\Models\User::role('dosen')->count(),
                'totalMahasiswa' => \App\Models\User::role('mahasiswa')->count(),
                'totalDataProcessed' => round(\App\Models\ScrapingAgent::sum('volume_data'), 1),
                'totalHttpRequests' => number_format(\App\Models\ScrapingAgent::count() * 240000 + 450000),
                'throughputPeak' => round(\App\Models\ScrapingAgent::sum('volume_data') * 10.2 + 25.4, 1) . ' GB/s',
                'throughputRates' => [
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 2.8, 1),
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 4.5, 1),
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 6.2, 1),
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 10.2 + 25.4, 1),
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 7.1, 1),
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 5.4, 1),
                    round(\App\Models\ScrapingAgent::sum('volume_data') * 6.8, 1),
                ],
                'scrapingAgents' => \App\Models\ScrapingAgent::all(),
                'sectors' => Skill::select('sektor_industri_terkait as name', DB::raw('count(*) * 100 / (select count(*) from skills) as pct'))
                    ->groupBy('sektor_industri_terkait')
                    ->get(),
                'campusSummaries' => StudyProgram::select('nama_institusi')
                    ->distinct()
                    ->get()
                    ->map(function ($inst) {
                        $spIds = StudyProgram::where('nama_institusi', $inst->nama_institusi)->pluck('id');
                        $courseCount = Course::whereIn('study_program_id', $spIds)->count();
                        $gapCount = GapAnalysis::whereIn('study_program_id', $spIds)->where('tipe_mismatch', '!=', 'aligned')->count();
                        $dosenCount = \App\Models\User::role('dosen')->whereIn('study_program_id', $spIds)->count();
                        $mhsCount = \App\Models\User::role('mahasiswa')->whereIn('study_program_id', $spIds)->count();
                        return [
                            'name' => $inst->nama_institusi,
                            'prodiCount' => $spIds->count(),
                            'courseCount' => $courseCount,
                            'gapCount' => $gapCount,
                            'dosenCount' => $dosenCount,
                            'mhsCount' => $mhsCount,
                        ];
                    }),
            ],
            'kaprodi' => [
                'studyProgram' => $user->studyProgram?->only(['id', 'nama_institusi', 'nama_prodi', 'jenjang']),
                'totalCourses' => Course::where('study_program_id', $user->study_program_id)->count(),
                'totalGaps' => GapAnalysis::where('study_program_id', $user->study_program_id)->count(),
                'mismatchGaps' => GapAnalysis::where('study_program_id', $user->study_program_id)
                    ->where('tipe_mismatch', '!=', 'aligned')
                    ->count(),
                'gapByType' => GapAnalysis::where('study_program_id', $user->study_program_id)
                    ->select('tipe_mismatch', DB::raw('count(*) as total'))
                    ->groupBy('tipe_mismatch')
                    ->get(),
                'totalDosen' => \App\Models\User::role('dosen')->where('study_program_id', $user->study_program_id)->count(),
                'totalMahasiswa' => \App\Models\User::role('mahasiswa')->where('study_program_id', $user->study_program_id)->count(),
                'courses' => Course::where('study_program_id', $user->study_program_id)
                    ->with('skills')
                    ->take(6)
                    ->get()
                    ->map(function ($c) use ($user) {
                        $skillsCount = $c->skills()->count();
                        if ($skillsCount === 0) {
                            $gap = 100;
                        } else {
                            $skillIds = $c->skills()->pluck('skills.id');
                            $gaps = GapAnalysis::where('study_program_id', $user->study_program_id)
                                ->whereIn('skill_id', $skillIds)
                                ->get();
                            $gap = $gaps->isEmpty() ? 0 : round(100 - ($gaps->avg('match_rate') ?? 100));
                        }
                        return [
                            'id' => $c->id,
                            'code' => $c->code,
                            'name' => $c->name,
                            'semester' => $c->semester,
                            'credits' => $c->credits,
                            'gap' => $gap,
                        ];
                    }),
            ],
            'dosen' => [
                'studyProgram' => $user->studyProgram?->only(['id', 'nama_institusi', 'nama_prodi', 'jenjang']),
                'totalGaps' => GapAnalysis::where('study_program_id', $user->study_program_id ?? 1)->count(),
                'courses' => Course::where('study_program_id', $user->study_program_id ?? 1)
                    ->with('skills')
                    ->get()
                    ->map(function ($c) use ($user) {
                        $skillsCount = $c->skills()->count();
                        if ($skillsCount === 0) {
                            $gap = 65;
                        } else {
                            $skillIds = $c->skills()->pluck('skills.id');
                            $gaps = GapAnalysis::where('study_program_id', $user->study_program_id ?? 1)
                                ->whereIn('skill_id', $skillIds)
                                ->get();
                            $gap = $gaps->isEmpty() ? 55 : round(100 - ($gaps->avg('match_rate') ?? 50));
                        }
                        return [
                            'id' => $c->id,
                            'code' => $c->code,
                            'name' => $c->name,
                            'semester' => $c->semester,
                            'credits' => $c->credits,
                            'gap' => $gap,
                            'skills' => $c->skills->pluck('nama')->all(),
                            'status' => $gap >= 70 ? 'Kritis' : ($gap >= 40 ? 'Perlu Update' : 'Sesuai Industri'),
                        ];
                    }),
                'marketTrends' => [
                    ['skill' => 'Docker & Kubernetes', 'demand' => '+34%', 'jobCount' => 1240, 'source' => 'Tech Hub Scraper', 'urgency' => 'Tinggi'],
                    ['skill' => 'Next.js & Server Actions', 'demand' => '+28%', 'jobCount' => 890, 'source' => 'LinkedIn Jobs', 'urgency' => 'Tinggi'],
                    ['skill' => 'Microservices Architecture', 'demand' => '+22%', 'jobCount' => 670, 'source' => 'Gojek/Tokopedia Crawl', 'urgency' => 'Sedang'],
                    ['skill' => 'Prompt Engineering & LLM API', 'demand' => '+45%', 'jobCount' => 520, 'source' => 'AI Job Index', 'urgency' => 'Tinggi'],
                    ['skill' => 'GraphQL & REST Performance', 'demand' => '+15%', 'jobCount' => 430, 'source' => 'JobStreet Indonesia', 'urgency' => 'Sedang'],
                ],
                'curriculumProposals' => [
                    ['id' => 'P01', 'mk' => 'Cloud Computing', 'usulan' => 'Praktikum Docker, CI/CD Pipeline & Kubernetes Cluster', 'tanggal' => '2026-08-10', 'status' => 'Menunggu Review Kaprodi', 'dampak' => '+25% Keselarasan'],
                    ['id' => 'P02', 'mk' => 'Pemrograman Web Lanjut', 'usulan' => 'Integrasi Next.js Fullstack & TailwindCSS Component System', 'tanggal' => '2026-08-12', 'status' => 'Disetujui', 'dampak' => '+18% Keselarasan'],
                ]
            ],
            'mahasiswa' => [
                'studyProgram' => $user->studyProgram?->only(['id', 'nama_institusi', 'nama_prodi', 'jenjang']),
                'studentProfile' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'nim' => '214172' . sprintf("%04d", $user->id),
                    'prodi' => $user->studyProgram ? ($user->studyProgram->jenjang . ' ' . $user->studyProgram->nama_prodi) : 'S1 Teknik Informatika',
                    'institusi' => $user->studyProgram ? $user->studyProgram->nama_institusi : 'Politeknik Negeri Jakarta',
                    'semester' => 6,
                    'ipk' => '3.78',
                    'targetRole' => 'Backend Engineer',
                ],
                'careerRoles' => [
                    [
                        'id' => 'backend',
                        'name' => 'Backend & Cloud Engineer',
                        'icon' => 'dns',
                        'match' => 78,
                        'salary' => 'Rp 9.000.000 – Rp 15.000.000/bln',
                        'demand' => 'Sangat Tinggi (1.420 lowongan aktif)',
                        'description' => 'Membangun arsitektur server terdistribusi, REST/GraphQL API, database caching, dan deployment cloud container.',
                        'requiredSkills' => [
                            ['name' => 'Node.js / Express', 'userLevel' => 85, 'targetLevel' => 90, 'status' => 'aligned'],
                            ['name' => 'PostgreSQL & SQL Tuning', 'userLevel' => 75, 'targetLevel' => 85, 'status' => 'minor_gap'],
                            ['name' => 'Docker & Containerization', 'userLevel' => 40, 'targetLevel' => 85, 'status' => 'critical_gap'],
                            ['name' => 'CI/CD & GitHub Actions', 'userLevel' => 50, 'targetLevel' => 80, 'status' => 'critical_gap'],
                            ['name' => 'Redis Caching & Queue', 'userLevel' => 60, 'targetLevel' => 80, 'status' => 'minor_gap'],
                            ['name' => 'Cloud (AWS / GCP)', 'userLevel' => 35, 'targetLevel' => 75, 'status' => 'critical_gap'],
                        ],
                    ],
                    [
                        'id' => 'fullstack',
                        'name' => 'Full-Stack Web Developer',
                        'icon' => 'layers',
                        'match' => 84,
                        'salary' => 'Rp 8.000.000 – Rp 14.000.000/bln',
                        'demand' => 'Tinggi (2.150 lowongan aktif)',
                        'description' => 'Mengembangkan aplikasi web end-to-end dari frontend interaktif (React/Vue) hingga backend service dan database.',
                        'requiredSkills' => [
                            ['name' => 'React.js & Inertia', 'userLevel' => 90, 'targetLevel' => 85, 'status' => 'aligned'],
                            ['name' => 'PHP & Laravel', 'userLevel' => 88, 'targetLevel' => 85, 'status' => 'aligned'],
                            ['name' => 'REST API Design', 'userLevel' => 80, 'targetLevel' => 85, 'status' => 'aligned'],
                            ['name' => 'TailwindCSS & UI Polish', 'userLevel' => 92, 'targetLevel' => 80, 'status' => 'aligned'],
                            ['name' => 'Automated Testing (PHPUnit/Jest)', 'userLevel' => 45, 'targetLevel' => 75, 'status' => 'critical_gap'],
                        ],
                    ],
                    [
                        'id' => 'ai_engineer',
                        'name' => 'AI & Machine Learning Engineer',
                        'icon' => 'smart_toy',
                        'match' => 65,
                        'salary' => 'Rp 11.000.000 – Rp 18.000.000/bln',
                        'demand' => 'Pertumbuhan Tercepat (+45% YoY)',
                        'description' => 'Mengembangkan model machine learning, fine-tuning LLM, prompt engineering pipeline, dan integrasi vector search.',
                        'requiredSkills' => [
                            ['name' => 'Python & Pandas', 'userLevel' => 70, 'targetLevel' => 85, 'status' => 'minor_gap'],
                            ['name' => 'PyTorch / TensorFlow', 'userLevel' => 50, 'targetLevel' => 80, 'status' => 'critical_gap'],
                            ['name' => 'LLM API & LangChain', 'userLevel' => 55, 'targetLevel' => 85, 'status' => 'critical_gap'],
                            ['name' => 'Vector Databases (Pinecone/pgvector)', 'userLevel' => 40, 'targetLevel' => 80, 'status' => 'critical_gap'],
                        ],
                    ],
                    [
                        'id' => 'devops',
                        'name' => 'DevOps & Site Reliability Engineer (SRE)',
                        'icon' => 'cloud_sync',
                        'match' => 58,
                        'salary' => 'Rp 10.000.000 – Rp 17.000.000/bln',
                        'demand' => 'Sangat Tinggi (870 lowongan)',
                        'description' => 'Mengelola infrastruktur cloud, automated deployment pipelines, monitoring sistem terdistribusi, dan security hardening.',
                        'requiredSkills' => [
                            ['name' => 'Linux System Admin', 'userLevel' => 75, 'targetLevel' => 85, 'status' => 'minor_gap'],
                            ['name' => 'Kubernetes & Helm', 'userLevel' => 30, 'targetLevel' => 85, 'status' => 'critical_gap'],
                            ['name' => 'Terraform & IaC', 'userLevel' => 25, 'targetLevel' => 80, 'status' => 'critical_gap'],
                            ['name' => 'Prometheus & Grafana', 'userLevel' => 40, 'targetLevel' => 75, 'status' => 'critical_gap'],
                        ],
                    ]
                ],
                'scrapedJobs' => [
                    [
                        'id' => 'JOB01',
                        'title' => 'Junior Backend Engineer',
                        'company' => 'PT GoTo Gojek Tokopedia',
                        'location' => 'Jakarta Selatan (Hybrid)',
                        'salary' => 'Rp 9.500.000 - 13.000.000',
                        'logo' => '🚀',
                        'matchRate' => 86,
                        'tags' => ['Golang', 'PostgreSQL', 'Docker', 'Redis'],
                        'scrapedAt' => '2 jam lalu (via LinkedIn Ingestion)',
                    ],
                    [
                        'id' => 'JOB02',
                        'title' => 'Cloud & DevOps Associate',
                        'company' => 'Traveloka Indonesia',
                        'location' => 'Tangerang (On-site / Hybrid)',
                        'salary' => 'Rp 10.000.000 - 14.500.000',
                        'logo' => '✈️',
                        'matchRate' => 74,
                        'tags' => ['AWS', 'Kubernetes', 'CI/CD', 'Terraform'],
                        'scrapedAt' => '4 jam lalu (via JobStreet Scraper)',
                    ],
                    [
                        'id' => 'JOB03',
                        'title' => 'Fullstack Web Engineer',
                        'company' => 'DANA Indonesia',
                        'location' => 'Jakarta Pusat (Remote Friendly)',
                        'salary' => 'Rp 8.500.000 - 12.500.000',
                        'logo' => '💳',
                        'matchRate' => 82,
                        'tags' => ['React.js', 'Node.js', 'REST API', 'MySQL'],
                        'scrapedAt' => '5 jam lalu (via TechInAsia Ingestion)',
                    ],
                    [
                        'id' => 'JOB04',
                        'title' => 'AI Applications Engineer',
                        'company' => 'Bukalapak',
                        'location' => 'Jakarta (Remote)',
                        'salary' => 'Rp 11.000.000 - 16.000.000',
                        'logo' => '🤖',
                        'matchRate' => 68,
                        'tags' => ['Python', 'OpenAI API', 'LangChain', 'FastAPI'],
                        'scrapedAt' => '6 jam lalu (via Indeed Ingestion)',
                    ],
                ],
                'learningRoadmap' => [
                    [
                        'id' => 'LR01',
                        'step' => 1,
                        'skill' => 'Docker Containerization & Multi-Stage Builds',
                        'title' => 'Praktikum Docker Dasar hingga Deployment Microservice',
                        'platform' => 'Modul Kampus & Dicoding Indonesia',
                        'duration' => '2 Minggu (12 Jam)',
                        'done' => true,
                        'campusCourseLink' => 'Cloud Computing (Semester 5)',
                    ],
                    [
                        'id' => 'LR02',
                        'step' => 2,
                        'skill' => 'CI/CD Pipeline with GitHub Actions',
                        'title' => 'Automated Testing, Docker Build & Staging Release Flow',
                        'platform' => 'GitHub Learning Lab & Project Lab',
                        'duration' => '1 Minggu (8 Jam)',
                        'done' => false,
                        'campusCourseLink' => 'Manajemen Proyek Perangkat Lunak',
                    ],
                    [
                        'id' => 'LR03',
                        'step' => 3,
                        'skill' => 'Kubernetes Pods, Services & Ingress Networking',
                        'title' => 'Orkestrasi Container & Auto-scaling di Klaster Cloud',
                        'platform' => 'Udemy / Coursera Vokasi',
                        'duration' => '3 Minggu (20 Jam)',
                        'done' => false,
                        'campusCourseLink' => 'Cloud Computing Lanjut',
                    ],
                    [
                        'id' => 'LR04',
                        'step' => 4,
                        'skill' => 'Redis In-Memory Caching & Distributed Message Queue',
                        'title' => 'Optimasi Latensi API dan Asynchronous Task Processing',
                        'platform' => 'Redis University & YouTube Vokasi',
                        'duration' => '1.5 Minggu (10 Jam)',
                        'done' => false,
                        'campusCourseLink' => 'Basis Data Lanjut',
                    ],
                ]
            ],
            default => [],
        };

        return inertia('Dashboard/Dashboard', ['stats' => $stats]);
    })->name('dashboard');

    Route::get('/management', function () {
        $user = request()->user();
        $role = $user->roles->first()?->name;

        // Fetch Study Programs
        $studyPrograms = StudyProgram::all();

        // Fetch Courses
        $coursesQuery = Course::with('studyProgram');
        if ($role !== 'super_admin') {
            $coursesQuery->where('study_program_id', $user->study_program_id);
        }
        $courses = $coursesQuery->get();

        // Fetch Users (civitas akademika)
        $usersQuery = \App\Models\User::with(['studyProgram', 'roles']);
        if ($role !== 'super_admin') {
            $usersQuery->where('study_program_id', $user->study_program_id);
        }
        $users = $usersQuery->get()->map(function ($u) {
            $roleName = $u->roles->first()?->name ?? 'mahasiswa';
            $isSuperAdmin = $roleName === 'super_admin';
            $campusName = $u->studyProgram ? $u->studyProgram->nama_institusi : ($isSuperAdmin ? 'Kementerian / Nasional' : 'Umum');
            $prodiName = $u->studyProgram ? $u->studyProgram->nama_prodi : ($isSuperAdmin ? 'Pusat Tata Kelola' : 'Umum');
            $jenjang = $u->studyProgram ? $u->studyProgram->jenjang : '-';

            return [
                'id' => sprintf("U%03d", $u->id),
                'db_id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => ucfirst($roleName),
                'institusi' => $campusName,
                'prodi' => $prodiName,
                'jenjang' => $jenjang,
                'status' => 'Aktif',
            ];
        });

        // Map courses with gap scores calculated dynamically
        $dbCourses = $courses->map(function ($c) {
            $skillsCount = $c->skills()->count();
            if ($skillsCount === 0) {
                $gapScore = 100;
            } else {
                $skillIds = $c->skills()->pluck('skills.id');
                $gaps = GapAnalysis::where('study_program_id', $c->study_program_id)
                    ->whereIn('skill_id', $skillIds)
                    ->get();
                
                if ($gaps->isEmpty()) {
                    $gapScore = 0;
                } else {
                    $avgMatchRate = $gaps->avg('match_rate') ?? 100;
                    $gapScore = round(100 - $avgMatchRate);
                }
            }

            $campusName = $c->studyProgram ? $c->studyProgram->nama_institusi : 'Umum';
            $prodiName = $c->studyProgram ? $c->studyProgram->nama_prodi : 'Umum';
            $jenjang = $c->studyProgram ? $c->studyProgram->jenjang : 'S1';

            return [
                'id' => sprintf("MK%02d", $c->id),
                'db_id' => $c->id,
                'code' => $c->code,
                'nama' => $c->name,
                'sks' => $c->credits,
                'semester' => $c->semester,
                'institusi' => $campusName,
                'prodi' => $prodiName,
                'jenjang' => $jenjang,
                'gap' => $gapScore,
                'study_program_id' => $c->study_program_id,
            ];
        });

        $allCampuses = StudyProgram::select('nama_institusi')->distinct()->pluck('nama_institusi')->values()->all();

        return inertia('CampusManagement', [
            'dbCourses' => $dbCourses->values()->all(),
            'dbUsers' => $users->values()->all(),
            'studyPrograms' => $studyPrograms->values()->all(),
            'campuses' => $allCampuses,
            'currentInstitution' => $user->studyProgram ? $user->studyProgram->nama_institusi : ($role === 'super_admin' ? 'Seluruh Kampus Terhubung (6 Politeknik)' : 'Institusi Kampus'),
            'currentProdi' => $user->studyProgram ? ($user->studyProgram->jenjang . ' ' . $user->studyProgram->nama_prodi) : null,
        ]);
    })->name('management');

    Route::get('/competency', function () {
        return inertia('CompetencyMap');
    })->name('competency');

    Route::get('/ai-analysis', function () {
        return inertia('AIAnalysis');
    })->name('ai-analysis');

    Route::get('/scraping', function () {
        return inertia('ScrapingAgents');
    })->name('scraping');

    Route::get('/settings', function () {
        return inertia('Settings');
    })->name('settings');

    Route::get('/help', function () {
        return inertia('Help');
    })->name('help');

    Route::get('/skills', function () {
        return inertia('SkillManager');
    })->name('skills');

    Route::get('/jobs', [JobController::class, 'index'])->name('jobs');

    Route::middleware(['role:kaprodi|super_admin|dosen'])->prefix('curriculum')->name('curriculum.')->group(function () {
        Route::get('/', [CurriculumController::class, 'index'])->name('index');
        Route::get('/courses/{course}', [CurriculumController::class, 'show'])->name('courses.show');
        Route::post('/courses', [CurriculumController::class, 'storeCourse'])->name('courses.store');
        Route::put('/courses/{course}', [CurriculumController::class, 'updateCourse'])->name('courses.update');
        Route::post('/courses/{course}/skills', [CurriculumController::class, 'syncSkills'])->name('courses.skills.sync');
        Route::post('/courses/{course}/learning-outcomes', [CurriculumController::class, 'storeLearningOutcome'])->name('courses.learning-outcomes.store');
    });

    Route::middleware(['role:kaprodi|super_admin'])->group(function () {
        Route::post('/management/users', function (\Illuminate\Http\Request $request) {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
                'role' => ['required', 'string', 'in:super_admin,kaprodi,dosen,mahasiswa'],
                'study_program_id' => ['nullable', 'exists:study_programs,id'],
            ]);

            $user = \App\Models\User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'study_program_id' => $validated['study_program_id'] ?? null,
            ]);

            $user->assignRole($validated['role']);

            return back();
        })->name('management.users.store');

        Route::put('/management/users/{user}', function (\Illuminate\Http\Request $request, \App\Models\User $user) {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
                'password' => ['nullable', 'string', 'min:8'],
                'role' => ['required', 'string', 'in:super_admin,kaprodi,dosen,mahasiswa'],
                'study_program_id' => ['nullable', 'exists:study_programs,id'],
            ]);

            $data = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'study_program_id' => $validated['study_program_id'] ?? null,
            ];

            if ($validated['password']) {
                $data['password'] = bcrypt($validated['password']);
            }

            $user->update($data);

            $user->syncRoles([$validated['role']]);

            return back();
        })->name('management.users.update');

        Route::delete('/management/users/{user}', function (\App\Models\User $user) {
            if ($user->id === request()->user()->id) {
                return back()->withErrors(['error' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
            }
            $user->delete();
            return back();
        })->name('management.users.delete');
    });

    Route::get('/taxonomy', [TaxonomyController::class, 'reference'])->name('taxonomy.reference');

    Route::middleware(['role:kaprodi|super_admin'])->prefix('taxonomy/manage')->name('taxonomy.manage.')->group(function () {
        Route::get('/', [TaxonomyController::class, 'index'])->name('index');
        Route::post('/', [TaxonomyController::class, 'store'])->name('store');
        Route::put('/{skill}', [TaxonomyController::class, 'update'])->name('update');
        Route::delete('/{skill}', [TaxonomyController::class, 'destroy'])->name('destroy');
    });

    Route::get('/management/report', function () {
        $user = request()->user();
        $role = $user->roles->first()?->name;

        // If kaprodi, get their own prodi. If admin, get first prodi or a default
        $studyProgram = $role === 'super_admin' 
            ? \App\Models\StudyProgram::first() 
            : $user->studyProgram;

        if (!$studyProgram) {
            abort(404, 'Program Studi tidak ditemukan.');
        }

        // Get courses and calculate gap analyses for the report
        $courses = \App\Models\Course::where('study_program_id', $studyProgram->id)
            ->with(['skills', 'learningOutcomes'])
            ->get();
            
        $gapAnalyses = \App\Models\GapAnalysis::where('study_program_id', $studyProgram->id)
            ->with('skill')
            ->get();

        return view('report', [
            'studyProgram' => $studyProgram,
            'courses' => $courses,
            'gapAnalyses' => $gapAnalyses,
        ]);
    })->name('management.report');

});
