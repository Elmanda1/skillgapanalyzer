<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama_institusi', 'jenjang', 'nama_prodi', 'sectors'])]
class StudyProgram extends Model
{
    protected $casts = [
        'sectors' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get effective sectors for the study program (from DB or smart derivation from nama_prodi).
     *
     * @return array<string>
     */
    public function getEffectiveSectors(): array
    {
        if (! empty($this->sectors) && is_array($this->sectors)) {
            return $this->sectors;
        }

        $name = mb_strtolower($this->nama_prodi ?? '', 'UTF-8');

        if (str_contains($name, 'sistem informasi') || str_contains($name, 'manajemen informatika')) {
            return ['Teknologi & TI', 'Bisnis & Manajemen'];
        }

        if (str_contains($name, 'informatika') || str_contains($name, 'komputer') || str_contains($name, 'perangkat lunak') || str_contains($name, 'ti')) {
            return ['Teknologi & TI'];
        }

        if (str_contains($name, 'elektro') || str_contains($name, 'telekomunikasi') || str_contains($name, 'mekatronika')) {
            return ['Teknologi & TI', 'Teknik & Rekayasa'];
        }

        if (str_contains($name, 'bisnis') || str_contains($name, 'pemasaran') || str_contains($name, 'manajemen') || str_contains($name, 'akuntansi')) {
            return ['Bisnis & Manajemen'];
        }

        if (str_contains($name, 'sipil') || str_contains($name, 'konstruksi') || str_contains($name, 'bangunan')) {
            return ['Teknik & Rekayasa', 'Konstruksi'];
        }

        if (str_contains($name, 'mesin') || str_contains($name, 'otomotif')) {
            return ['Teknik & Rekayasa', 'Manufaktur'];
        }

        if (str_contains($name, 'desain') || str_contains($name, 'animasi') || str_contains($name, 'multimedia')) {
            return ['Kreatif & Desain'];
        }

        return ['Teknologi & TI'];
    }
}

