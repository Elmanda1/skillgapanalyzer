<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama', 'kategori', 'sektor_industri_terkait', 'dimension', 'is_hard_skill'])]
class Skill extends Model
{
    public function aliases()
    {
        return $this->hasMany(SkillAlias::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class);
    }
}
