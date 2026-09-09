<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'study_program_id', 'semester'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    public function studyProgram()
    {
        return $this->belongsTo(StudyProgram::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class);
    }

    public function acquiredCourses()
    {
        if (! $this->study_program_id) {
            return Course::query()->whereRaw('1 = 0');
        }

        return Course::where('study_program_id', $this->study_program_id)
            ->where('semester', '<=', $this->semester ?? 1);
    }

    public function acquiredSkills()
    {
        if (! $this->study_program_id) {
            return Skill::query()->whereRaw('1 = 0');
        }

        $studyProgramId = $this->study_program_id;
        $maxSemester = $this->semester ?? 1;

        return Skill::whereHas('courses', function ($q) use ($studyProgramId, $maxSemester) {
            $q->where('study_program_id', $studyProgramId)
                ->where('semester', '<=', $maxSemester);
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
