<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'study_program_id',
    'code',
    'name',
    'semester',
    'credits',
    'versi',
    'status_verifikasi_ekstraksi',
    'is_overridden',
    'override_notes',
    'overridden_by',
    'overridden_at',
    'original_dosen_snapshot',
])]
class Course extends Model
{
    use HasFactory;

    public function studyProgram()
    {
        return $this->belongsTo(StudyProgram::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class)
            ->withPivot(['is_overridden', 'override_notes', 'overridden_by', 'overridden_at', 'original_dosen_skills_snapshot']);
    }

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function learningOutcomes()
    {
        return $this->hasMany(LearningOutcome::class);
    }

    public function overriddenByUser()
    {
        return $this->belongsTo(User::class, 'overridden_by');
    }

    protected function casts(): array
    {
        return [
            'status_verifikasi_ekstraksi' => 'boolean',
            'is_overridden' => 'boolean',
            'overridden_at' => 'datetime',
            'original_dosen_snapshot' => 'array',
        ];
    }
}
