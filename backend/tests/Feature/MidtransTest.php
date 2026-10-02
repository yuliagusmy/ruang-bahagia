<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class MidtransTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_generate_midtrans_snap_token_for_subscription()
    {
        $user = User::factory()->create([
            'phone' => '081234567890',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/subscription/create-transaction', [
                'plan' => 'monthly',
            ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         'order_id',
                         'plan',
                         'amount',
                         'snap_token',
                         'redirect_url',
                     ],
                     'message',
                 ]);
    }
}
