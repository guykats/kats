<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_calendar_page_loads(): void
    {
        $response = $this->get('/calendar');

        $response->assertStatus(200);
    }
}
