<?php

namespace Tests\Feature;

use App\Services\ETL\SkillExtractorService;
use Database\Seeders\TaxonomySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExtractorRobustnessTest extends TestCase
{
    use RefreshDatabase;

    private SkillExtractorService $extractor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(TaxonomySeeder::class);
        $this->extractor = app(SkillExtractorService::class);
        $this->extractor->loadIndex(true);
    }

    public function test_html_and_math_inequalities_safety(): void
    {
        $rawText = <<<HTML
        <div>
            <h3>Lowongan Backend Engineer</h3>
            <p>Gaji &gt; Rp 15.000.000 dengan pengalaman &lt; 3 tahun.</p>
            <p>Wajib menguasai <strong>Docker</strong>, <em>PostgreSQL</em>, dan <code>Python</code>.</p>
            <script>console.log("malicious");</script>
        </div>
        HTML;

        $extracted = $this->extractor->extract($rawText);
        $names = array_column($extracted, 'name');

        $this->assertContains('Docker', $names);
        $this->assertContains('PostgreSQL', $names);
        $this->assertContains('Python', $names);
    }

    public function test_short_aliases_false_positive_rejection_matrix(): void
    {
        $negativeCases = [
            'We plan to go to Bandung for vacation.' => 'Go (Golang)',
            'Let us go forward with the sales proposal.' => 'Go (Golang)',
            'The basketball team scored 110 pts in the finals.' => 'TypeScript',
            'Looking at the ts stats for this quarter.' => 'TypeScript',
            'Please submit your updated cv and portfolio to HR.' => 'Computer Vision',
            'We reviewed your cv and would like to invite you.' => 'Computer Vision',
            'Pour 250 ml of solution into the flask.' => 'Machine Learning',
            'Drive at 60 ml per hour on the highway.' => 'Machine Learning',
            'I have to leave right rn for the meeting.' => 'React Native',
            'What are you doing rn?' => 'React Native',
            'The elastic band on the trousers is worn out.' => 'Elasticsearch',
            'Let us debug why the team is arriving late to meetings.' => 'Debugging',
            'Medical blood tests are required for pre-employment.' => 'Unit Testing',
            'You need to take a rest after working long hours.' => 'REST APIs',
            'Do not be a silly git in public.' => 'Git Version Control',
        ];

        foreach ($negativeCases as $text => $unexpectedSkill) {
            $extracted = $this->extractor->extract($text);
            $names = array_column($extracted, 'name');
            $this->assertNotContains(
                $unexpectedSkill,
                $names,
                "False positive detected: '{$unexpectedSkill}' was falsely matched in: '{$text}'"
            );
        }
    }

    public function test_short_aliases_positive_match_with_context_matrix(): void
    {
        $positiveCases = [
            'Hiring a backend engineer with go language experience.' => 'Go (Golang)',
            'Building high-throughput microservices using go programming.' => 'Go (Golang)',
            'Frontend web developer with strong ts and React skills.' => 'TypeScript',
            'Writing clean typed code with ts framework.' => 'TypeScript',
            'AI researcher developing cv models for image recognition.' => 'Computer Vision',
            'Deep learning cv object detection using opencv.' => 'Computer Vision',
            'Data scientist building ml algorithms and predictive models.' => 'Machine Learning',
            'Mobile app developer experienced in rn and Flutter for iOS and Android.' => 'React Native',
            'Configuring an elastic cluster for logstash search indexing.' => 'Elasticsearch',
            'Software developer handling bug fixing and debug code issues.' => 'Debugging',
            'Backend QA engineer writing automation unit tests and tdd coverage.' => 'Unit Testing',
            'Building secure REST APIs with JSON endpoints for web services.' => 'REST APIs',
            'Managing project git repository and branch PR version control.' => 'Git Version Control',
        ];

        foreach ($positiveCases as $text => $expectedSkill) {
            $extracted = $this->extractor->extract($text);
            $names = array_column($extracted, 'name');
            $this->assertContains(
                $expectedSkill,
                $names,
                "Expected skill '{$expectedSkill}' was not matched in: '{$text}'"
            );
        }
    }

    public function test_bilingual_mixed_curriculum_and_industry_descriptions(): void
    {
        $text = <<<TEXT
        Dibutuhkan Senior Fullstack Developer:
        - Pengalaman minimal 3 tahun menggunakan Laravel dan Vue.js.
        - Terbiasa dengan arsitektur microservices, Docker, dan CI/CD pipelines.
        - Memahami database MySQL dan Redis untuk caching.
        - Mampu bekerjasama dalam tim (Stakeholder Communication) dan memiliki kemampuan Problem Solving yang baik.
        TEXT;

        $extracted = $this->extractor->extract($text);
        $names = array_column($extracted, 'name');

        $this->assertContains('Laravel', $names);
        $this->assertContains('Vue.js', $names);
        $this->assertContains('Docker', $names);
        $this->assertContains('CI/CD Pipelines', $names);
        $this->assertContains('MySQL', $names);
        $this->assertContains('Redis', $names);
        $this->assertContains('Microservices', $names);
        $this->assertContains('Problem Solving', $names);
    }

    public function test_canonical_vs_alias_confidence_scoring(): void
    {
        // Exact canonical match
        $canonicalText = "Experience with Docker and Laravel.";
        $extracted = $this->extractor->extract($canonicalText);

        foreach ($extracted as $item) {
            $this->assertEquals(1.0, $item['confidence'], "Canonical skill should have 1.0 confidence");
        }

        // Single occurrence guarded alias match
        $aliasText = "Developer skilled in containerization.";
        $extractedAlias = $this->extractor->extract($aliasText);

        $this->assertCount(1, $extractedAlias);
        $this->assertEquals('Docker', $extractedAlias[0]['name']);
        $this->assertEquals(0.90, $extractedAlias[0]['confidence']);
    }
}
