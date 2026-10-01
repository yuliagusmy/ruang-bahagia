<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Booking;

class MidtransTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_generate_midtrans_snap_token()
    {
        $user = User::factory()->create();
        $booking = Booking::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/payments", [
                'amount' => 50000,
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['token', 'redirect_url']]);
    }
}
