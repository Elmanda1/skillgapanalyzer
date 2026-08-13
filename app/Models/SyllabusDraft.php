<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['gap_analysis_id', 'konten_draft', 'status', 'approver_id'])]
class SyllabusDraft extends Model
{
    public function gapAnalysis()
    {
        return $this->belongsTo(GapAnalysis::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class);
    }
}
