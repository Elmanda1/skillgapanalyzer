<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'course_id',
    'text',
    'source_doc',
    'is_overridden',
    'override_notes',
    'overridden_by',
    'overridden_at',
    'original_dosen_text',
])]
class LearningOutcome extends Model
{
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function overriddenByUser()
    {
        return $this->belongsTo(User::class, 'overridden_by');
    }

    protected function casts(): array
    {
        return [
            'is_overridden' => 'boolean',
            'overridden_at' => 'datetime',
        ];
    }
}
