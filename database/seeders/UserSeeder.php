<?php

namespace Database\Seeders;

use App\Models\StudyProgram;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed roles, study programs, and role-based dummy users.
     */
    public function run(): void
    {
        $password = 'password';

        foreach (['super_admin', 'kaprodi', 'dosen', 'mahasiswa'] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        $studyPrograms = collect([
            ['nama_institusi' => 'Politeknik Negeri Jakarta', 'jenjang' => 'S1', 'nama_prodi' => 'Teknik Informatika'],
            ['nama_institusi' => 'Politeknik Negeri Jakarta', 'jenjang' => 'D3', 'nama_prodi' => 'Teknik Elektronika'],
        ])->map(fn (array $program) => StudyProgram::create($program));

        $superAdmin = User::factory()->create([
            'name' => 'Dewi Lestari',
            'email' => 'admin@pnj.ac.id',
            'password' => $password,
        ]);
        $superAdmin->assignRole('super_admin');

        $kaprodiNames = ['Agus Setiawan', 'Rina Kartika'];
        $kaprodiEmails = ['kaprodi1@pnj.ac.id', 'kaprodi2@pnj.ac.id'];
        foreach ($studyPrograms as $index => $program) {
            $kaprodi = User::factory()->create([
                'name' => $kaprodiNames[$index],
                'email' => $kaprodiEmails[$index],
                'password' => $password,
                'study_program_id' => $program->id,
            ]);
            $kaprodi->assignRole('kaprodi');
        }

        $dosenNames = ['Bambang Prasetyo', 'Fitri Handayani', 'Hendra Wijaya', 'Yuni Astuti', 'Andi Firmansyah'];
        $dosenCountsPerProgram = [3, 2];
        $dosenIndex = 0;
        foreach ($studyPrograms as $index => $program) {
            for ($i = 0; $i < $dosenCountsPerProgram[$index]; $i++) {
                $dosen = User::factory()->create([
                    'name' => $dosenNames[$dosenIndex],
                    'email' => 'dosen' . ($dosenIndex + 1) . '@pnj.ac.id',
                    'password' => $password,
                    'study_program_id' => $program->id,
                ]);
                $dosen->assignRole('dosen');
                $dosenIndex++;
            }
        }

        $mahasiswaNames = [
            'Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Hartono', 'Putri Ayu', 'Rizky Pratama',
            'Nadia Safitri', 'Dedi Kurniawan', 'Maya Puspita', 'Fajar Ramadhan', 'Intan Permata',
        ];
        foreach ($mahasiswaNames as $index => $name) {
            $mahasiswa = User::factory()->create([
                'name' => $name,
                'email' => 'mahasiswa' . ($index + 1) . '@pnj.ac.id',
                'password' => $password,
            ]);
            $mahasiswa->assignRole('mahasiswa');
        }
    }
}
