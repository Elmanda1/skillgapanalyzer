<?php

use App\Models\Course;
use App\Models\LearningOutcome;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningOutcomeTest extends TestCase
{
    use RefreshDatabase;

    private function createCourse(): Course
    {
        return Course::factory()->create();
    }

    public function test_can_create_learning_outcome_for_course()
    {
        $course = $this->createCourse();

        LearningOutcome::create([
            'course_id' => $course->id,
            'text' => 'Mahasiswa mampu memahami dasar pemrograman',
            'source_doc' => 'RPS_Dasar_Pemrograman.pdf',
        ]);

        $this->assertDatabaseHas('learning_outcomes', ['text' => 'Mahasiswa mampu memahami dasar pemrograman']);
        $this->assertCount(1, $course->learningOutcomes);
    }

    public function test_learning_outcome_belongs_to_course()
    {
        $course = $this->createCourse();
        $lo = LearningOutcome::create([
            'course_id' => $course->id,
            'text' => 'Mahasiswa mampu memahami dasar pemrograman',
        ]);

        $this->assertTrue($lo->course->is($course));
    }
}
