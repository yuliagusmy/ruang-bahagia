<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Client;
use App\Models\Booking;
use App\Models\ProofingSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_endpoints()
    {
        $user = User::factory()->create([
            'role' => 'user',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/summary');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_summary_and_photographers_list()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'subscription_tier' => 'pro',
        ]);

        $photographer = User::factory()->create([
            'role' => 'user',
            'brand_name' => 'Lensa Abadi Studio',
            'city' => 'Bandung',
        ]);

        // Buat 2 klien untuk fotografer ini
        Client::create([
            'user_id' => $photographer->id,
            'name' => 'Rina & Budi',
            'email' => 'rina@example.com',
            'phone' => '081234567890',
        ]);
        Client::create([
            'user_id' => $photographer->id,
            'name' => 'Siti & Dedi',
            'email' => 'siti@example.com',
            'phone' => '081234567891',
        ]);

        // 1. Tes Summary
        $resSummary = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/summary');
        $resSummary->assertStatus(200)
            ->assertJsonPath('data.ecosystem_metrics.total_clients', 2);

        // 2. Tes Daftar Fotografer
        $resPhotographers = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/photographers');
        $resPhotographers->assertStatus(200);

        // Cari fotografer di daftar items
        $items = $resPhotographers->json('data.items');
        $found = collect($items)->firstWhere('id', $photographer->id);

        $this->assertNotNull($found);
        $this->assertEquals(2, $found['clients_count']);
        $this->assertEquals('Lensa Abadi Studio', $found['brand_name']);
    }

    public function test_admin_can_adjust_photographer_subscription()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $photographer = User::factory()->create([
            'role' => 'user',
            'subscription_tier' => 'free',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/photographers/{$photographer->id}/adjust-subscription", [
            'action' => 'grant_pro',
            'days' => 60,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_pro', true);

        $photographer->refresh();
        $this->assertTrue((bool)$photographer->is_pro);
        $this->assertEquals('pro', $photographer->subscription_tier);
        $this->assertNotNull($photographer->subscription_expires_at);
    }
}
