// Mismatch types — mirrors backend App\Enums\MismatchType
export const MISMATCH_TYPES = [
  { value: 'over_education',     label: 'Overeducation',               labelId: 'Keterlaluan Pendidikan',  color: 'badge-gray'   },
  { value: 'under_skill',        label: 'Underskilling',              labelId: 'Keahlian Kurang',         color: 'badge-yellow' },
  { value: 'skill_shortage',     label: 'Skill Shortages',            labelId: 'Kekurangan Skill',         color: 'badge-red'    },
  { value: 'skill_gap',          label: 'Skill Gaps',                 labelId: 'Kesenjangan Skill',       color: 'badge-yellow' },
  { value: 'over_skill',         label: 'Overskilling',               labelId: 'Keahlian Berlebihan',     color: 'badge-gray'   },
  { value: 'under_education',    label: 'Undereducation',             labelId: 'Kekurangan Pendidikan',   color: 'badge-red'    },
  { value: 'field_mismatch',     label: 'Field-of-Study Mismatch',    labelId: 'Ketidakcocokan Bidang',   color: 'badge-purple' },
  { value: 'skill_obsolete',     label: 'Skill Obsolescence',         labelId: 'Skill Usang',             color: 'badge-orange' },
];

// Competence dimensions — mirrors backend App\Enums\CompetenceDimension
export const COMPETENCE_DIMENSIONS = [
  { value: 'hard_technical',         label: 'Hard/Technical Skills',   labelId: 'Keterampilan Teknis',   color: 'badge-green'  },
  { value: 'task_management',        label: 'Task Management',         labelId: 'Manajemen Tugas',       color: 'badge-blue'   },
  { value: 'contingency_management', label: 'Contingency Management',  labelId: 'Manajemen Kontingensi', color: 'badge-purple' },
  { value: 'knowledge_information',  label: 'Knowledge & Information', labelId: 'Pengetahuan & Informasi', color: 'badge-amber' },
  { value: 'social_situational',     label: 'Social & Situational',    labelId: 'Sosial & Situasional',  color: 'badge-pink'   },
];

export const CATEGORIES = [
  'Cloud & DevOps',
  'AI & Data Science',
  'Frontend Dev',
  'Backend Dev',
  'Database',
  'Cybersecurity',
  'Mobile Dev',
  'Soft Skills',
];
