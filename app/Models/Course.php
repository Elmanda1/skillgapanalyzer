<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['study_program_id', 'code', 'name', 'semester', 'credits', 'versi', 'status_verifikasi_ekstraksi'])]
class Course extends Model
{
    public function studyProgram()
    {
        return $this->belongsTo(StudyProgram::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status_verifikasi_ekstraksi' => 'boolean',
        ];
    }
}
