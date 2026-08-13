<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['skill_id', 'alias_name'])]
class SkillAlias extends Model
{
    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }
}
