<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['study_program_id', 'skill_id', 'tipe_mismatch', 'skor_urgensi', 'match_rate', 'periode_data', 'evidence_count'])]
class GapAnalysis extends Model
{
    public function studyProgram()
    {
        return $this->belongsTo(StudyProgram::class);
    }

    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }

    public function syllabusDrafts()
    {
        return $this->hasMany(SyllabusDraft::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'match_rate' => 'float',
        ];
    }
}
