<?php

namespace App\Enums;

/**
 * 5 competence dimensions (Isnandar et al., 2024).
 * Spec §6 — hard vs non-hard skill dimensions for taxonomy tagging.
 */
enum CompetenceDimension: string
{
    case HardTechnical = 'hard_technical';
    case TaskManagement = 'task_management';
    case ContingencyManagement = 'contingency_management';
    case KnowledgeInformation = 'knowledge_information';
    case SocialSituational = 'social_situational';

    public function label(): string
    {
        return match ($this) {
            self::HardTechnical => 'Hard/Technical Skills',
            self::TaskManagement => 'Task Management',
            self::ContingencyManagement => 'Contingency Management',
            self::KnowledgeInformation => 'Knowledge & Information',
            self::SocialSituational => 'Social & Situational',
        };
    }

    public function labelId(): string
    {
        return match ($this) {
            self::HardTechnical => 'Keterampilan Teknis',
            self::TaskManagement => 'Manajemen Tugas',
            self::ContingencyManagement => 'Manajemen Kontingensi',
            self::KnowledgeInformation => 'Pengetahuan & Informasi',
            self::SocialSituational => 'Sosial & Situasional',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::HardTechnical => 'badge-green',
            self::TaskManagement => 'badge-blue',
            self::ContingencyManagement => 'badge-purple',
            self::KnowledgeInformation => 'badge-amber',
            self::SocialSituational => 'badge-pink',
        };
    }

    public function isHardSkill(): bool
    {
        return $this === self::HardTechnical;
    }
}