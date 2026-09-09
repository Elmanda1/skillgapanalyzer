<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Inertia looks in resource_path('js/pages') by default, real dir is js/Pages.
        config()->set('inertia.pages.paths', [resource_path('js/Pages')]);
    }
}
