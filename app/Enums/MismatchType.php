<?php

namespace App\Enums;

/**
 * 8-type mismatch classification (Vázquez-Villegas & Borrego, 2026).
 * Spec §6 — adapted for Skill Gap Analyzer v1.
 */
enum MismatchType: string
{
    case Overeducation = 'over_education';
    case Underskilling = 'under_skill';
    case SkillShortages = 'skill_shortage';
    case SkillGaps = 'skill_gap';
    case Overskilling = 'over_skill';
    case Undereducation = 'under_education';
    case FieldOfStudyMismatch = 'field_mismatch';
    case SkillObsolescence = 'skill_obsolete';

    public function label(): string
    {
        return match ($this) {
            self::Overeducation => 'Overeducation',
            self::Underskilling => 'Underskilling',
            self::SkillShortages => 'Skill Shortages',
            self::SkillGaps => 'Skill Gaps',
            self::Overskilling => 'Overskilling',
            self::Undereducation => 'Undereducation',
            self::FieldOfStudyMismatch => 'Field-of-Study Mismatch',
            self::SkillObsolescence => 'Skill Obsolescence',
        };
    }

    public function labelId(): string
    {
        return match ($this) {
            self::Overeducation => 'Keterlaluan Pendidikan',
            self::Underskilling => 'Keahlian Kurang',
            self::SkillShortages => 'Kekurangan Skill',
            self::SkillGaps => 'Kesenjangan Skill',
            self::Overskilling => 'Keahlian Berlebihan',
            self::Undereducation => 'Kekurangan Pendidikan',
            self::FieldOfStudyMismatch => 'Ketidakcocokan Bidang',
            self::SkillObsolescence => 'Skill Usang',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Overeducation, self::Overskilling => 'badge-gray',
            self::Underskilling, self::SkillGaps => 'badge-yellow',
            self::SkillShortages, self::Undereducation => 'badge-red',
            self::FieldOfStudyMismatch => 'badge-purple',
            self::SkillObsolescence => 'badge-orange',
        };
    }

    public function severity(): int
    {
        return match ($this) {
            self::SkillShortages, self::Undereducation, self::FieldOfStudyMismatch => 3,
            self::Underskilling, self::SkillGaps, self::SkillObsolescence => 2,
            self::Overeducation, self::Overskilling => 1,
        };
    }
}
