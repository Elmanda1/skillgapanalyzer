<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\StudyProgram;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'study_program_id' => StudyProgram::create([
                'nama_institusi' => 'Politeknik Negeri Jakarta',
                'jenjang' => 'D4',
                'nama_prodi' => 'Teknik Informatika',
            ])->id,
            'code' => fake()->unique()->regexify('[A-Z]{2}-[0-9]{3}'),
            'name' => fake()->sentence(3),
            'semester' => fake()->numberBetween(1, 8),
            'credits' => fake()->numberBetween(1, 4),
            'versi' => 'v1',
            'status_verifikasi_ekstraksi' => false,
        ];
    }
}
