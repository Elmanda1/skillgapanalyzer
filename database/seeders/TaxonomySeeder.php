<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\SkillAlias;
use Illuminate\Database\Seeder;

/**
 * Taxonomy seed: 73 IT skills across 5 competence dimensions and 8 categories,
 * with synonym aliases. Spec §6 / Q10 resolution (ESCO/O*NET-style subset).
 *
 * Idempotent: upserts by skill name, aliases by unique alias_name.
 */
class TaxonomySeeder extends Seeder
{
    public function run(): void
    {
        $dim = ['hard' => 'hard_technical', 'task' => 'task_management', 'cont' => 'contingency_management', 'know' => 'knowledge_information', 'soc' => 'social_situational'];
        $sector = 'Teknologi & TI';

        // [name, kategori, dimension, is_hard_skill, [aliases]]
        $rows = [
            // ── Cloud & DevOps (hard) ──
            ['Docker', 'Cloud & DevOps', $dim['hard'], true, ['containerization', 'docker container', 'docker engine']],
            ['Kubernetes', 'Cloud & DevOps', $dim['hard'], true, ['k8s', 'kubernetes orchestration', 'k8s cluster']],
            ['AWS Cloud', 'Cloud & DevOps', $dim['hard'], true, ['amazon web services', 'aws ec2', 'aws s3']],
            ['Microsoft Azure', 'Cloud & DevOps', $dim['hard'], true, ['azure', 'microsoft azure cloud']],
            ['Google Cloud Platform', 'Cloud & DevOps', $dim['hard'], true, ['gcp', 'google cloud']],
            ['CI/CD Pipelines', 'Cloud & DevOps', $dim['hard'], true, ['ci cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions']],
            ['Terraform', 'Cloud & DevOps', $dim['hard'], true, ['infrastructure as code', 'iac', 'terraform hcl']],
            ['Ansible', 'Cloud & DevOps', $dim['hard'], true, ['ansible playbook', 'automation ansible']],
            ['Prometheus', 'Cloud & DevOps', $dim['hard'], true, ['prometheus monitoring', 'prom metrics']],
            ['Grafana', 'Cloud & DevOps', $dim['hard'], true, ['grafana dashboard', 'grafana visualization']],
            ['Linux Administration', 'Cloud & DevOps', $dim['hard'], true, ['linux server', 'sysadmin', 'bash linux']],
            ['Nginx', 'Cloud & DevOps', $dim['hard'], true, ['nginx web server', 'nginx reverse proxy']],

            // ── AI & Data Science (hard) ──
            ['LLM Fine-tuning', 'AI & Data Science', $dim['hard'], true, ['large language model tuning', 'llm training', 'fine-tuning llm']],
            ['Machine Learning', 'AI & Data Science', $dim['hard'], true, ['ml', 'ml models', 'predictive modeling']],
            ['Deep Learning', 'AI & Data Science', $dim['hard'], true, ['neural networks', 'deep neural net']],
            ['PyTorch / TensorFlow', 'AI & Data Science', $dim['hard'], true, ['pytorch', 'tensorflow', 'tf', 'torch']],
            ['Computer Vision', 'AI & Data Science', $dim['hard'], true, ['cv', 'image recognition', 'object detection']],
            ['Natural Language Processing', 'AI & Data Science', $dim['hard'], true, ['nlp', 'text processing', 'language models']],
            ['Snowflake', 'AI & Data Science', $dim['hard'], true, ['snowflake data warehouse', 'snowflake db']],
            ['Pandas', 'AI & Data Science', $dim['hard'], true, ['python pandas', 'pandas dataframe']],
            ['Scikit-learn', 'AI & Data Science', $dim['hard'], true, ['sklearn', 'scikit learn']],
            ['Data Engineering', 'AI & Data Science', $dim['hard'], true, ['data pipeline', 'etl data', 'data pipeline etl']],
            ['Spark', 'AI & Data Science', $dim['hard'], true, ['apache spark', 'spark streaming']],
            ['Tableau', 'AI & Data Science', $dim['hard'], true, ['tableau dashboard', 'tableau viz']],

            // ── Frontend Dev (hard) ──
            ['React.js', 'Frontend Dev', $dim['hard'], true, ['react', 'reactjs', 'react js', 'react library']],
            ['Next.js', 'Frontend Dev', $dim['hard'], true, ['nextjs', 'next js', 'react next']],
            ['Vue.js', 'Frontend Dev', $dim['hard'], true, ['vue', 'vuejs', 'vue js']],
            ['Angular', 'Frontend Dev', $dim['hard'], true, ['angularjs', 'angular framework']],
            ['TypeScript', 'Frontend Dev', $dim['hard'], true, ['ts', 'typed javascript']],
            ['Tailwind CSS', 'Frontend Dev', $dim['hard'], true, ['tailwind', 'tailwindcss']],
            ['CSS3', 'Frontend Dev', $dim['hard'], true, ['css', 'cascading style sheets']],
            ['HTML5', 'Frontend Dev', $dim['hard'], true, ['html', 'markup html']],
            ['Redux', 'Frontend Dev', $dim['hard'], true, ['redux state', 'state management redux']],
            ['Svelte', 'Frontend Dev', $dim['hard'], true, ['sveltekit', 'svelte js']],
            ['Figma', 'Frontend Dev', $dim['hard'], true, ['figma design', 'figma ui']],

            // ── Backend Dev (hard) ──
            ['Laravel', 'Backend Dev', $dim['hard'], true, ['laravel php', 'laravel framework']],
            ['Node.js', 'Backend Dev', $dim['hard'], true, ['node', 'nodejs', 'node js', 'express']],
            ['Python', 'Backend Dev', $dim['hard'], true, ['python3', 'py']],
            ['Go (Golang)', 'Backend Dev', $dim['hard'], true, ['go', 'golang']],
            ['Java', 'Backend Dev', $dim['hard'], true, ['java se', 'spring boot', 'spring java']],
            ['PHP', 'Backend Dev', $dim['hard'], true, ['php8', 'php language']],
            ['GraphQL APIs', 'Backend Dev', $dim['hard'], true, ['graphql', 'gql', 'graph ql']],
            ['REST APIs', 'Backend Dev', $dim['hard'], true, ['rest', 'restful api', 'restful']],
            ['Microservices', 'Backend Dev', $dim['cont'], false, ['microservice', 'services architecture', 'soa']],
            ['PostgreSQL', 'Database', $dim['hard'], true, ['postgres', 'pg', 'postgresql db']],
            ['MySQL', 'Database', $dim['hard'], true, ['maria', 'mariadb', 'mysql db']],
            ['MongoDB', 'Database', $dim['hard'], true, ['mongo', 'mongodb nosql']],
            ['Redis', 'Database', $dim['hard'], true, ['redis cache', 'redis store']],
            ['Elasticsearch', 'Database', $dim['hard'], true, ['elastic', 'elk search']],

            // ── Cybersecurity (hard) ──
            ['Zero Trust Architecture', 'Cybersecurity', $dim['hard'], true, ['zero trust', 'ztna', 'zero trust network']],
            ['Penetration Testing', 'Cybersecurity', $dim['hard'], true, ['pentest', 'pen testing', 'ethical hacking']],
            ['Network Security', 'Cybersecurity', $dim['hard'], true, ['cyber security network', 'netsec']],
            ['SIEM', 'Cybersecurity', $dim['hard'], true, ['security info event mgmt', 'splunk siem']],
            ['ISO 27001', 'Cybersecurity', $dim['know'], false, ['iso27001', '27001 certification']],

            // ── Mobile Dev (hard) ──
            ['Flutter', 'Mobile Dev', $dim['hard'], true, ['flutter dart', 'flutter sdk']],
            ['React Native', 'Mobile Dev', $dim['hard'], true, ['rn', 'react native mobile']],
            ['Kotlin', 'Mobile Dev', $dim['hard'], true, ['android kotlin']],
            ['Swift', 'Mobile Dev', $dim['hard'], true, ['ios swift', 'swift ios']],
            ['Android SDK', 'Mobile Dev', $dim['hard'], true, ['android dev', 'android development']],

            // ── Non-hard competence dimensions (task / contingency / knowledge / social) ──
            ['Agile Project Management', 'Soft Skills', $dim['task'], false, ['agile', 'scrum', 'agile scrum']],
            ['Scrum Master', 'Soft Skills', $dim['task'], false, ['scrummaster', 'scrum facilitator']],
            ['Stakeholder Communication', 'Soft Skills', $dim['soc'], false, ['communication skills', 'stakeholder mgmt']],
            ['Technical Writing', 'Soft Skills', $dim['know'], false, ['documentation', 'tech writing']],
            ['Requirements Analysis', 'Soft Skills', $dim['cont'], false, ['requirement gathering', 'business analysis']],
            ['Incident Response', 'Soft Skills', $dim['cont'], false, ['incident mgmt', 'oncall response']],
            ['Team Leadership', 'Soft Skills', $dim['soc'], false, ['leadership', 'team lead']],
            ['Problem Solving', 'Soft Skills', $dim['cont'], false, ['analytical thinking', 'troubleshooting']],
            ['Time Management', 'Soft Skills', $dim['task'], false, ['task prioritization']],
            ['Continuous Learning', 'Soft Skills', $dim['know'], false, ['self learning', 'upskilling']],
            ['Debugging', 'Backend Dev', $dim['hard'], true, ['debug', 'bug fixing']],
            ['Code Review', 'Backend Dev', $dim['cont'], false, ['peer review', 'review pr']],
            ['Git Version Control', 'Backend Dev', $dim['hard'], true, ['git', 'github', 'gitlab']],
            ['Unit Testing', 'Backend Dev', $dim['hard'], true, ['tests', 'tdd', 'unit tests']],
        ];

        foreach ($rows as $row) {
            [$name, $kategori, $dimension, $isHard, $aliases] = $row;

            $skill = Skill::firstOrCreate(
                ['nama' => trim($name)],
                [
                    'kategori' => $kategori,
                    'sektor_industri_terkait' => $sector,
                    'dimension' => $dimension,
                    'is_hard_skill' => $isHard,
                ]
            );

            // Update existing rows that predate the new columns
            $skill->update([
                'kategori' => $kategori,
                'dimension' => $dimension,
                'is_hard_skill' => $isHard,
            ]);

            foreach ($aliases as $alias) {
                SkillAlias::firstOrCreate(
                    ['alias_name' => trim($alias)],
                    ['skill_id' => $skill->id]
                );
            }
        }
    }
}