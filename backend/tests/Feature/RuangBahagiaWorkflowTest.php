<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Client;
use App\Models\Notification;
use App\Models\Package;
use App\Models\Schedule;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RuangBahagiaWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $photographer;
    protected Package $package;
    protected Schedule $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->photographer = User::factory()->create([
            'username'   => 'fotograferkece',
            'brand_name' => 'Kece Photography Studio',
            'phone'      => '081234567890',
            'city'       => 'Jakarta Selatan',
        ]);

        $this->package = Package::create([
            'user_id'         => $this->photographer->id,
            'name'            => 'Paket Wisuda Silver',
            'price'           => 1500000,
            'dp_amount'       => 500000,
            'duration_hours'  => 2,
            'photo_quota'     => 25,
            'selection_quota' => 25,
            'description'     => 'Dokumentasi foto wisuda lengkap',
            'is_active'       => true,
        ]);

        $this->schedule = Schedule::create([
            'user_id'    => $this->photographer->id,
            'date'       => now()->addDays(5)->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time'   => '12:00:00',
            'status'     => 'available',
        ]);
    }

    /** @test */
    public function it_can_fetch_public_photographer_profile()
    {
        $response = $this->getJson("/api/photographers/{$this->photographer->username}");

        $response->assertStatus(200)
            ->assertJsonPath('data.photographer.username', 'fotograferkece')
            ->assertJsonPath('data.photographer.brand_name', 'Kece Photography Studio');
    }

    /** @test */
    public function client_can_request_booking_publicly()
    {
        $bookingData = [
            'name'           => 'Nadia Klien',
            'email'          => 'nadia@example.com',
            'phone'          => '08987654321',
            'package_id'     => $this->package->id,
            'schedule_id'    => $this->schedule->id,
            'event_date'     => now()->addDays(5)->format('Y-m-d'),
            'event_time'     => '10:00',
            'event_location' => 'Studio Foto Kebayoran',
        ];

        $response = $this->postJson('/api/bookings/request', $bookingData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'booking_code',
                'total_price',
                'dp_amount',
            ]);

        $this->assertDatabaseHas('bookings', [
            'user_id'    => $this->photographer->id,
            'package_id' => $this->package->id,
            'status'     => 'pending',
        ]);

        $this->assertDatabaseHas('clients', [
            'phone'   => '08987654321',
            'user_id' => $this->photographer->id,
        ]);
    }

    /** @test */
    public function photographer_can_manage_booking_and_record_payment()
    {
        $client = Client::create([
            'user_id' => $this->photographer->id,
            'name'    => 'Budi Klien',
            'phone'   => '08111222333',
        ]);

        $booking = Booking::create([
            'booking_code'     => 'RB-TEST-001',
            'user_id'          => $this->photographer->id,
            'client_id'        => $client->id,
            'package_id'       => $this->package->id,
            'event_date'       => now()->addDays(3)->format('Y-m-d'),
            'event_time'       => '14:00',
            'total_price'      => 1500000,
            'dp_amount'        => 500000,
            'remaining_amount' => 1000000,
            'status'           => 'confirmed',
        ]);

        // Catat pembayaran DP
        $payResponse = $this->actingAs($this->photographer, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/payments", [
                'type'           => 'dp',
                'amount'         => 500000,
                'payment_method' => 'transfer',
            ]);

        $payResponse->assertStatus(201);
        $this->assertEquals('dp_paid', $booking->fresh()->status);
    }

    /** @test */
    public function photographer_can_record_expenses_and_view_financial_report()
    {
        $client = Client::create([
            'user_id' => $this->photographer->id,
            'name'    => 'Siti Klien',
            'phone'   => '08222333444',
        ]);

        $booking = Booking::create([
            'booking_code'     => 'RB-TEST-002',
            'user_id'          => $this->photographer->id,
            'client_id'        => $client->id,
            'package_id'       => $this->package->id,
            'event_date'       => now()->format('Y-m-d'),
            'event_time'       => '09:00',
            'total_price'      => 2000000,
            'dp_amount'        => 500000,
            'remaining_amount' => 1500000,
            'status'           => 'completed',
        ]);

        // Catat pengeluaran sesi
        $expenseResponse = $this->actingAs($this->photographer, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/expenses", [
                'title'    => 'Sewa Studio & Properti',
                'amount'   => 400000,
                'category' => 'studio_rental',
            ]);

        $expenseResponse->assertStatus(201);

        // Cek laporan keuangan
        $reportResponse = $this->actingAs($this->photographer, 'sanctum')
            ->getJson('/api/reports/financial?period=this_month');

        $reportResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'summary' => [
                        'total_revenue',
                        'total_expenses',
                        'net_profit',
                    ],
                ],
            ]);
    }

    /** @test */
    public function client_can_submit_review_and_photographer_receives_it()
    {
        $client = Client::create([
            'user_id' => $this->photographer->id,
            'name'    => 'Dewi Klien',
            'phone'   => '08555666777',
        ]);

        $booking = Booking::create([
            'booking_code'     => 'RB-REV-001',
            'user_id'          => $this->photographer->id,
            'client_id'        => $client->id,
            'package_id'       => $this->package->id,
            'event_date'       => now()->format('Y-m-d'),
            'event_time'       => '13:00',
            'total_price'      => 1500000,
            'dp_amount'        => 500000,
            'remaining_amount' => 1000000,
            'status'           => 'completed',
        ]);

        // Submit review dari portal delivery publik
        $reviewResponse = $this->postJson('/api/deliveries/RB-REV-001/review', [
            'rating'  => 5,
            'comment' => 'Fotografer sangat ramah, hasil editan foto sangat memuaskan!',
        ]);

        $reviewResponse->assertStatus(201);

        $this->assertDatabaseHas('testimonials', [
            'booking_id' => $booking->id,
            'user_id'    => $this->photographer->id,
            'rating'     => 5,
        ]);

        // Cek ulasan masuk di panel privat fotografer
        $listResponse = $this->actingAs($this->photographer, 'sanctum')
            ->getJson('/api/reviews');

        $listResponse->assertStatus(200)
            ->assertJsonPath('data.0.comment', 'Fotografer sangat ramah, hasil editan foto sangat memuaskan!');
    }

    /** @test */
    public function standalone_proofing_tool_can_be_used_without_client_or_booking()
    {
        // 1. Fotografer membuat sesi proofing langsung (tanpa booking / client)
        $createResponse = $this->actingAs($this->photographer, 'sanctum')
            ->postJson('/api/proofing-sessions', [
                'title'           => 'Sesi Wisuda UI 2026',
                'client_name'     => 'Budi & Keluarga',
                'client_phone'    => '081299887766',
                'selection_quota' => 20,
            ]);

        $createResponse->assertStatus(201);
        $sessionId = $createResponse->json('data.id');
        $slug      = $createResponse->json('data.slug');
        $pin       = $createResponse->json('data.pin');

        $this->assertDatabaseHas('proofing_sessions', [
            'id'          => $sessionId,
            'user_id'     => $this->photographer->id,
            'booking_id'  => null,
            'title'       => 'Sesi Wisuda UI 2026',
            'client_name' => 'Budi & Keluarga',
        ]);

        // 2. Fotografer memasukkan foto ke sesi
        $addPhotosResponse = $this->actingAs($this->photographer, 'sanctum')
            ->postJson("/api/proofing-sessions/{$sessionId}/photos", [
                'photos' => [
                    [
                        'original_filename' => '_DSC5001.JPG',
                        'display_filename'  => '_DSC5001.JPG',
                        'lowres_path'       => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
                    ],
                    [
                        'original_filename' => '_DSC5002.JPG',
                        'display_filename'  => '_DSC5002.JPG',
                        'lowres_path'       => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
                    ],
                ],
            ]);

        $addPhotosResponse->assertStatus(200)
            ->assertJsonPath('data.total_photos', 2);

        $photo1Id = $addPhotosResponse->json('data.photos.0.id');

        // 3. Klien membuka tautan publik sesi proofing via browser smartphone
        $clientAccess = $this->getJson("/api/proof/{$slug}?pin={$pin}");
        $clientAccess->assertStatus(200)
            ->assertJsonPath('data.title', 'Sesi Wisuda UI 2026')
            ->assertJsonPath('data.client_name', 'Budi & Keluarga')
            ->assertJsonPath('data.total_photos', 2);

        // 4. Klien memilih foto dan mengirimkan hasil seleksi
        $selectResponse = $this->postJson("/api/proof/{$slug}/selections", [
            'pin'       => $pin,
            'photo_ids' => [$photo1Id],
        ]);

        $selectResponse->assertStatus(200)
            ->assertJsonPath('data.selected_count', 1);

        // 5. Fotografer memeriksa hasil seleksi dan query Lightroom
        $photographerCheck = $this->actingAs($this->photographer, 'sanctum')
            ->getJson("/api/proofing-sessions/{$sessionId}");

        $photographerCheck->assertStatus(200)
            ->assertJsonPath('data.selected_count', 1)
            ->assertJsonPath('data.selected_filenames.0', '_DSC5001.JPG')
            ->assertJsonPath('data.lightroom_query', '_DSC5001');

        // 6. Pastikan in-app notifikasi tercatat
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->photographer->id,
            'type'    => 'selection_done',
        ]);
    }
}
