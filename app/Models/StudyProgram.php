<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['nama_institusi', 'jenjang', 'nama_prodi'])]
class StudyProgram extends Model
{
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
