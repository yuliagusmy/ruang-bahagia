<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Client;
use App\Models\Package;
use App\Models\ProofingPhoto;
use App\Models\ProofingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A01: Booking code harus acak & tidak sekuensial untuk mencegah IDOR / scraping
     */
    public function test_booking_code_is_randomized_and_not_sequential(): void
    {
        $user = User::factory()->create();

        $client = Client::create([
            'user_id' => $user->id,
            'name'    => 'Klien Test',
            'phone'   => '081234567890',
            'status'  => 'inquiry',
        ]);

        $package = Package::create([
            'user_id'         => $user->id,
            'name'            => 'Paket Test',
            'price'           => 500000,
            'dp_amount'       => 200000,
            'duration_hours'  => 1,
            'photo_quota'     => 10,
            'selection_quota' => 10,
            'is_active'       => true,
        ]);

        $booking1 = Booking::create([
            'user_id'          => $user->id,
            'client_id'        => $client->id,
            'package_id'       => $package->id,
            'event_date'       => now()->addDays(5)->toDateString(),
            'event_time'       => '10:00',
            'total_price'      => 500000,
            'dp_amount'        => 200000,
            'remaining_amount' => 300000,
            'status'           => 'confirmed',
        ]);

        $booking2 = Booking::create([
            'user_id'          => $user->id,
            'client_id'        => $client->id,
            'package_id'       => $package->id,
            'event_date'       => now()->addDays(6)->toDateString(),
            'event_time'       => '11:00',
            'total_price'      => 500000,
            'dp_amount'        => 200000,
            'remaining_amount' => 300000,
            'status'           => 'confirmed',
        ]);

        $this->assertNotEmpty($booking1->booking_code);
        $this->assertNotEmpty($booking2->booking_code);
        $this->assertNotEquals($booking1->booking_code, $booking2->booking_code);
        // Pastikan tidak berakhiran 0001 / 0002 sekuensial
        $this->assertFalse(str_ends_with($booking1->booking_code, '-0001'));
    }

    /**
     * A01: Fotografer A tidak boleh membuat booking memakai client_id milik Fotografer B
     */
    public function test_photographer_cannot_use_another_users_client(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $clientB = Client::create([
            'user_id' => $userB->id,
            'name'    => 'Klien User B',
            'phone'   => '081299999999',
            'status'  => 'inquiry',
        ]);

        $packageA = Package::create([
            'user_id'         => $userA->id,
            'name'            => 'Paket User A',
            'price'           => 500000,
            'dp_amount'       => 200000,
            'duration_hours'  => 1,
            'photo_quota'     => 10,
            'selection_quota' => 10,
            'is_active'       => true,
        ]);

        Sanctum::actingAs($userA);

        $response = $this->postJson('/api/bookings', [
            'client_id'      => $clientB->id, // milik userB
            'package_id'     => $packageA->id,
            'event_date'     => now()->addDays(3)->toDateString(),
            'event_time'     => '14:00',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['client_id']);
    }

    /**
     * A08: Webhook Midtrans menolak jika signature_key kosong pada mode non-demo
     */
    public function test_midtrans_webhook_requires_signature_in_production(): void
    {
        config(['services.midtrans.server_key' => 'Mid-server-REAL-LIVE-KEY-12345']);

        $response = $this->postJson('/api/webhooks/midtrans', [
            'order_id'           => 'SUB-2026-TEST',
            'status_code'        => '200',
            'gross_amount'       => '490000',
            'transaction_status' => 'settlement',
            // signature_key sengaja dihilangkan
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Signature key wajib disertakan.']);
    }

    /**
     * A07: Proofing menolak akses PIN yang salah secara aman
     */
    public function test_proofing_access_with_invalid_pin_is_rejected(): void
    {
        $user = User::factory()->create();
        $session = ProofingSession::create([
            'user_id'         => $user->id,
            'title'           => 'Sesi Wisuda UGM',
            'slug'            => 'wisuda-ugm-2026',
            'pin'             => '654321',
            'selection_quota' => 10,
            'status'          => 'active',
            'expires_at'      => now()->addDays(7),
        ]);

        $response = $this->getJson("/api/proof/{$session->slug}?pin=000000");

        $response->assertStatus(403)
            ->assertJson(['message' => 'PIN akses tidak valid.']);
    }

    /**
     * A10: Pengaturan Wablas yang mengarah ke IP internal/private ditolak
     */
    public function test_wablas_ssrf_attempt_is_blocked(): void
    {
        $user = User::factory()->create([
            'notification_settings' => [
                'wa_gateway_provider' => 'wablas',
                'wa_gateway_token'    => 'dummy-token',
                'wablas_server_url'   => 'http://169.254.169.254', // AWS/GCP internal metadata
            ],
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/whatsapp/test', [
            'phone' => '081234567890',
        ]);

        $response->assertStatus(422)
            ->assertJson(['message' => 'Alamat server Wablas tidak valid atau tidak diizinkan demi alasan keamanan.']);
    }
}
