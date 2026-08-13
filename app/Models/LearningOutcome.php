<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['course_id', 'text', 'source_doc'])]
class LearningOutcome extends Model
{
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
