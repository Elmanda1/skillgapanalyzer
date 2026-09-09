<?php

namespace Database\Seeders;

use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed roles, study programs across 6 Politeknik, and role-based users (~73 users).
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $hashedPassword = Hash::make('password');

        // 1. Roles
        $roles = [];
        foreach (['super_admin', 'kaprodi', 'dosen', 'mahasiswa'] as $r) {
            $roles[$r] = Role::firstOrCreate(['name' => $r]);
        }

        // 2. 6 Top Politeknik in Indonesia
        $campuses = [
            [
                'campus' => 'Politeknik Negeri Jakarta',
                'programs' => [
                    ['jenjang' => 'S1', 'nama_prodi' => 'Teknik Informatika'],
                    ['jenjang' => 'D3', 'nama_prodi' => 'Teknik Elektronika'],
                ],
                'kaprodi' => ['name' => 'Agus Setiawan, M.T.', 'email' => 'kaprodi1@pnj.ac.id'],
                'dosen' => [
                    ['name' => 'Bambang Prasetyo, M.Kom.', 'email' => 'dosen1@pnj.ac.id'],
                    ['name' => 'Fitri Handayani, M.Kom.', 'email' => 'dosen2@pnj.ac.id'],
                    ['name' => 'Hendra Wijaya, S.T., M.T.', 'email' => 'dosen3@pnj.ac.id'],
                ],
                'mahasiswa' => [
                    ['name' => 'Ahmad Fauzi', 'email' => 'mahasiswa1@pnj.ac.id'],
                    ['name' => 'Siti Nurhaliza', 'email' => 'mahasiswa2@pnj.ac.id'],
                    ['name' => 'Budi Hartono', 'email' => 'mahasiswa3@pnj.ac.id'],
                    ['name' => 'Putri Ayu', 'email' => 'mahasiswa4@pnj.ac.id'],
                    ['name' => 'Rizky Pratama', 'email' => 'mahasiswa5@pnj.ac.id'],
                    ['name' => 'Nadia Safitri', 'email' => 'mahasiswa6@pnj.ac.id'],
                ],
            ],
            [
                'campus' => 'Politeknik Negeri Bandung (POLBAN)',
                'programs' => [
                    ['jenjang' => 'S1', 'nama_prodi' => 'Teknik Informatika'],
                    ['jenjang' => 'D3', 'nama_prodi' => 'Teknik Telekomunikasi'],
                ],
                'kaprodi' => ['name' => 'Rina Kartika, Ph.D.', 'email' => 'kaprodi1@polban.ac.id'],
                'dosen' => [
                    ['name' => 'Asep Sunandar, M.T.', 'email' => 'dosen1@polban.ac.id'],
                    ['name' => 'Gita Gutawa, M.Kom.', 'email' => 'dosen2@polban.ac.id'],
                    ['name' => 'Cecep Supriatna, M.Sc.', 'email' => 'dosen3@polban.ac.id'],
                ],
                'mahasiswa' => [
                    ['name' => 'Dedi Kurniawan', 'email' => 'mahasiswa1@polban.ac.id'],
                    ['name' => 'Maya Puspita', 'email' => 'mahasiswa2@polban.ac.id'],
                    ['name' => 'Fajar Ramadhan', 'email' => 'mahasiswa3@polban.ac.id'],
                    ['name' => 'Intan Permata', 'email' => 'mahasiswa4@polban.ac.id'],
                    ['name' => 'Gilang Ramadhan', 'email' => 'mahasiswa5@polban.ac.id'],
                    ['name' => 'Taufik Hidayat', 'email' => 'mahasiswa6@polban.ac.id'],
                ],
            ],
            [
                'campus' => 'Politeknik Elektronika Negeri Surabaya (PENS)',
                'programs' => [
                    ['jenjang' => 'S1', 'nama_prodi' => 'Teknik Informatika'],
                    ['jenjang' => 'S1', 'nama_prodi' => 'Sains Data Terapan'],
                ],
                'kaprodi' => ['name' => 'Dr. Irfan Maulana, S.T., M.Eng.', 'email' => 'kaprodi1@pens.ac.id'],
                'dosen' => [
                    ['name' => 'Bayu Pratama, M.Kom.', 'email' => 'dosen1@pens.ac.id'],
                    ['name' => 'Nurul Hidayah, M.T.', 'email' => 'dosen2@pens.ac.id'],
                    ['name' => 'Surya Kencana, S.Kom., M.Cs.', 'email' => 'dosen3@pens.ac.id'],
                ],
                'mahasiswa' => [
                    ['name' => 'Aldi Taher', 'email' => 'mahasiswa1@pens.ac.id'],
                    ['name' => 'Cahyo Utomo', 'email' => 'mahasiswa2@pens.ac.id'],
                    ['name' => 'Dinda Kirana', 'email' => 'mahasiswa3@pens.ac.id'],
                    ['name' => 'Eka Putra', 'email' => 'mahasiswa4@pens.ac.id'],
                    ['name' => 'Firman Syah', 'email' => 'mahasiswa5@pens.ac.id'],
                    ['name' => 'Gita Savitri', 'email' => 'mahasiswa6@pens.ac.id'],
                ],
            ],
            [
                'campus' => 'Politeknik Negeri Malang (POLINEMA)',
                'programs' => [
                    ['jenjang' => 'S1', 'nama_prodi' => 'Teknik Informatika'],
                    ['jenjang' => 'S1', 'nama_prodi' => 'Sistem Informasi Bisnis'],
                ],
                'kaprodi' => ['name' => 'Dwi Ratnasari, M.Kom.', 'email' => 'kaprodi1@polinema.ac.id'],
                'dosen' => [
                    ['name' => 'Danang Joyo, M.T.', 'email' => 'dosen1@polinema.ac.id'],
                    ['name' => 'Ratna Sari Dewi, M.Kom.', 'email' => 'dosen2@polinema.ac.id'],
                    ['name' => 'Wahyu Utomo, S.T., M.Cs.', 'email' => 'dosen3@polinema.ac.id'],
                ],
                'mahasiswa' => [
                    ['name' => 'Hadi Sucipto', 'email' => 'mahasiswa1@polinema.ac.id'],
                    ['name' => 'Indah Lestari', 'email' => 'mahasiswa2@polinema.ac.id'],
                    ['name' => 'Joko Widodo', 'email' => 'mahasiswa3@polinema.ac.id'],
                    ['name' => 'Kurnia Meiga', 'email' => 'mahasiswa4@polinema.ac.id'],
                    ['name' => 'Lukman Hakim', 'email' => 'mahasiswa5@polinema.ac.id'],
                    ['name' => 'Mega Utami', 'email' => 'mahasiswa6@polinema.ac.id'],
                ],
            ],
            [
                'campus' => 'Politeknik Negeri Semarang (POLINES)',
                'programs' => [
                    ['jenjang' => 'S1', 'nama_prodi' => 'Teknologi Rekayasa Perangkat Lunak'],
                ],
                'kaprodi' => ['name' => 'Eko Prasetyo, S.T., M.Kom.', 'email' => 'kaprodi1@polines.ac.id'],
                'dosen' => [
                    ['name' => 'Bagus Wicaksono, M.T.', 'email' => 'dosen1@polines.ac.id'],
                    ['name' => 'Siti Maimunah, M.Kom.', 'email' => 'dosen2@polines.ac.id'],
                    ['name' => 'Tri Haryanto, M.Cs.', 'email' => 'dosen3@polines.ac.id'],
                ],
                'mahasiswa' => [
                    ['name' => 'Naufal Abiyyu', 'email' => 'mahasiswa1@polines.ac.id'],
                    ['name' => 'Oki Setiana', 'email' => 'mahasiswa2@polines.ac.id'],
                    ['name' => 'Panji Gumilang', 'email' => 'mahasiswa3@polines.ac.id'],
                    ['name' => 'Qori Sandioriva', 'email' => 'mahasiswa4@polines.ac.id'],
                    ['name' => 'Reza Rahadian', 'email' => 'mahasiswa5@polines.ac.id'],
                    ['name' => 'Salsa Bila', 'email' => 'mahasiswa6@polines.ac.id'],
                ],
            ],
            [
                'campus' => 'Politeknik Negeri Bali (PNB)',
                'programs' => [
                    ['jenjang' => 'S1', 'nama_prodi' => 'Manajemen Informatika'],
                ],
                'kaprodi' => ['name' => 'I Wayan Sudiarta, M.Kom.', 'email' => 'kaprodi1@pnb.ac.id'],
                'dosen' => [
                    ['name' => 'I Made Sudarma, M.T.', 'email' => 'dosen1@pnb.ac.id'],
                    ['name' => 'Ni Nyoman Ayu, M.Kom.', 'email' => 'dosen2@pnb.ac.id'],
                    ['name' => 'I Ketut Gede, M.Cs.', 'email' => 'dosen3@pnb.ac.id'],
                ],
                'mahasiswa' => [
                    ['name' => 'I Putu Gede Artha', 'email' => 'mahasiswa1@pnb.ac.id'],
                    ['name' => 'Ni Kadek Sintya', 'email' => 'mahasiswa2@pnb.ac.id'],
                    ['name' => 'I Komang Wira', 'email' => 'mahasiswa3@pnb.ac.id'],
                    ['name' => 'Ni Wayan Desi', 'email' => 'mahasiswa4@pnb.ac.id'],
                    ['name' => 'I Gede Bagus', 'email' => 'mahasiswa5@pnb.ac.id'],
                    ['name' => 'Ni Made Rai', 'email' => 'mahasiswa6@pnb.ac.id'],
                ],
            ],
        ];

        // 3. Super Admin (National Administrator, Unaffiliated to any single campus)
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@skillgap.id'],
            [
                'name' => 'Dewi Lestari',
                'password' => $hashedPassword,
                'study_program_id' => null,
            ]
        );
        $superAdmin->syncRoles(['super_admin']);

        // 4. Seed Campuses, Programs, and Users
        foreach ($campuses as $cData) {
            $createdPrograms = [];
            foreach ($cData['programs'] as $p) {
                $sp = StudyProgram::firstOrCreate([
                    'nama_institusi' => $cData['campus'],
                    'jenjang' => $p['jenjang'],
                    'nama_prodi' => $p['nama_prodi'],
                ]);
                $createdPrograms[] = $sp;
            }

            $mainProgram = $createdPrograms[0];

            // Seed Kaprodi
            $kaprodi = User::firstOrCreate(
                ['email' => $cData['kaprodi']['email']],
                [
                    'name' => $cData['kaprodi']['name'],
                    'password' => $hashedPassword,
                    'study_program_id' => $mainProgram->id,
                ]
            );
            $kaprodi->syncRoles(['kaprodi']);

            // Seed Dosen
            foreach ($cData['dosen'] as $d) {
                $dosen = User::firstOrCreate(
                    ['email' => $d['email']],
                    [
                        'name' => $d['name'],
                        'password' => $hashedPassword,
                        'study_program_id' => $mainProgram->id,
                    ]
                );
                $dosen->syncRoles(['dosen']);
            }

            // Seed Mahasiswa
            foreach ($cData['mahasiswa'] as $idx => $m) {
                $mahasiswa = User::firstOrCreate(
                    ['email' => $m['email']],
                    [
                        'name' => $m['name'],
                        'password' => $hashedPassword,
                        'study_program_id' => $mainProgram->id,
                        'semester' => ($idx % 8) + 1,
                    ]
                );
                $mahasiswa->syncRoles(['mahasiswa']);
            }
        }
    }
}
