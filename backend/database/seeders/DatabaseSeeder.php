<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Client;
use App\Models\Package;
use App\Models\PortfolioItem;
use App\Models\ProofingPhoto;
use App\Models\ProofingSession;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Fotografer Utama
        $photographer = User::updateOrCreate(
            ['email' => 'fotografer@ruangbahagia.com'],
            [
                'name'         => 'Yulian Agus',
                'brand_name'   => 'Ruang Bahagia Photography',
                'username'     => 'yuliagus',
                'password'     => Hash::make('password123'),
                'phone'        => '081234567890',
                'whatsapp'     => '081234567890',
                'instagram'    => '@ruangbahagia.studio',
                'city'         => 'Jakarta',
                'bio'          => 'Fotografer freelance spesialis intimate wedding, editorial portrait, dan hangatnya momen keluarga.',
            ]
        );

        // 2. Paket Layanan Foto
        $pkgWedding = Package::updateOrCreate(
            ['user_id' => $photographer->id, 'name' => 'Intimate Wedding'],
            [
                'description'     => 'Liputan akad & resepsi intim hingga 6 jam. Menghasilkan foto penuh emosi dan cerita.',
                'duration_hours'  => 6,
                'photo_quota'     => 40,
                'selection_quota' => 60,
                'revision_count'  => 2,
                'price'           => 5500000,
                'dp_amount'       => 1500000,
                'is_active'       => true,
                'inclusions'      => ['Flashdisk Kayu Eksklusif', 'Semua File Hi-Res', '40 Foto Cetak 4R + Box', 'Online Proofing Portal'],
            ]
        );

        $pkgPrewed = Package::updateOrCreate(
            ['user_id' => $photographer->id, 'name' => 'Prewedding Sunset'],
            [
                'description'     => 'Sesi foto outdoor romantis saat golden hour. Konsep casual atau etnik tradisional.',
                'duration_hours'  => 3,
                'photo_quota'     => 25,
                'selection_quota' => 40,
                'revision_count'  => 1,
                'price'           => 3000000,
                'dp_amount'       => 1000000,
                'is_active'       => true,
                'inclusions'      => ['1 Lokasi Pilihan', '2 Set Busana', '25 Foto Retouch', 'Client Proofing Swipe'],
            ]
        );

        $pkgPortrait = Package::updateOrCreate(
            ['user_id' => $photographer->id, 'name' => 'Personal & Graduation'],
            [
                'description'     => 'Sesi studio atau outdoor untuk wisuda, personal branding, atau portrait keluarga.',
                'duration_hours'  => 2,
                'photo_quota'     => 15,
                'selection_quota' => 25,
                'revision_count'  => 1,
                'price'           => 1200000,
                'dp_amount'       => 400000,
                'is_active'       => true,
                'inclusions'      => ['15 Foto Final Edit', 'Akses Proofing Online', 'High Resolution JPG'],
            ]
        );

        // 3. Klien CRM
        $client1 = Client::updateOrCreate(
            ['user_id' => $photographer->id, 'phone' => '081298765431'],
            [
                'name'            => 'Anisa & Dimas',
                'email'           => 'anisa.dimas@gmail.com',
                'instagram'       => '@anisaputri',
                'status'          => 'dp_paid',
                'notes'           => 'Suka tone warna warm earthy, konsep outdoor dekat pepohonan hijau.',
            ]
        );

        $client2 = Client::updateOrCreate(
            ['user_id' => $photographer->id, 'phone' => '081298765432'],
            [
                'name'            => 'Reza Pratama',
                'email'           => 'reza.p@gmail.com',
                'instagram'       => '@rezapratama',
                'status'          => 'editing',
                'notes'           => 'Wisuda S2 Magister Manajemen UI.',
            ]
        );

        $client3 = Client::updateOrCreate(
            ['user_id' => $photographer->id, 'phone' => '081298765433'],
            [
                'name'            => 'Siti Rahmawati',
                'email'           => 'siti.rahma@yahoo.com',
                'status'          => 'inquiry',
                'notes'           => 'Tanya jadwal untuk wedding bulan depan di Balai Kartini.',
            ]
        );

        // 4. Jadwal (Schedules)
        Schedule::updateOrCreate(
            ['user_id' => $photographer->id, 'date' => now()->addDays(2)->toDateString(), 'start_time' => '09:00:00'],
            [
                'end_time'   => '12:00:00',
                'status'     => 'available',
                'location'   => 'Studio Utama Ruang Bahagia',
                'notes'      => 'Slot Pagi: Pencahayaan Alami Studio',
            ]
        );

        Schedule::updateOrCreate(
            ['user_id' => $photographer->id, 'date' => now()->addDays(2)->toDateString(), 'start_time' => '14:00:00'],
            [
                'end_time'   => '17:00:00',
                'status'     => 'available',
                'location'   => 'Outdoor / Sekitar Jakarta',
                'notes'      => 'Slot Sore: Warm Sunset Lighting',
            ]
        );

        Schedule::updateOrCreate(
            ['user_id' => $photographer->id, 'date' => now()->addDays(4)->toDateString(), 'start_time' => '10:00:00'],
            [
                'end_time'   => '13:00:00',
                'status'     => 'available',
                'location'   => 'Studio Utama Ruang Bahagia',
                'notes'      => 'Slot Siang: Sesi Portrait & Prewedding',
            ]
        );

        Schedule::updateOrCreate(
            ['user_id' => $photographer->id, 'date' => now()->addDays(5)->toDateString(), 'start_time' => '08:00:00'],
            [
                'end_time'   => '14:00:00',
                'status'     => 'booked',
                'location'   => 'Plataran Dharmawangsa',
                'notes'      => 'Sesi Wedding Anisa & Dimas',
            ]
        );

        Schedule::updateOrCreate(
            ['user_id' => $photographer->id, 'date' => now()->addDays(7)->toDateString(), 'start_time' => '00:00:00'],
            [
                'end_time'   => '23:59:59',
                'status'     => 'blocked',
                'notes'      => 'Libur maintenance gear & recovery',
            ]
        );

        // 5. Bookings
        Booking::updateOrCreate(
            ['booking_code' => 'RB-2024-0001'],
            [
                'user_id'          => $photographer->id,
                'client_id'        => $client1->id,
                'package_id'       => $pkgWedding->id,
                'event_date'       => now()->addDays(5)->toDateString(),
                'event_time'       => '08:00:00',
                'event_location'   => 'Plataran Dharmawangsa, Jakarta Selatan',
                'event_type'       => 'wedding',
                'total_price'      => $pkgWedding->price,
                'dp_amount'        => $pkgWedding->dp_amount,
                'remaining_amount' => $pkgWedding->price - $pkgWedding->dp_amount,
                'status'           => 'dp_paid',
                'special_requests' => 'Fokus ke candid kedua orang tua saat prosesi sungkeman.',
            ]
        );

        $bookingGraduation = Booking::updateOrCreate(
            ['booking_code' => 'RB-2024-0002'],
            [
                'user_id'          => $photographer->id,
                'client_id'        => $client2->id,
                'package_id'       => $pkgPortrait->id,
                'event_date'       => now()->subDays(2)->toDateString(),
                'event_time'       => '14:00:00',
                'event_location'   => 'Gedung Rektorat UI Depok',
                'event_type'       => 'graduation',
                'total_price'      => $pkgPortrait->price,
                'dp_amount'        => $pkgPortrait->dp_amount,
                'remaining_amount' => 0,
                'status'           => 'editing',
                'special_requests' => 'Foto bersama kedua orang tua dan adik kandung.',
            ]
        );

        // 6. Portfolio Items
        PortfolioItem::updateOrCreate(
            ['user_id' => $photographer->id, 'title' => 'The Intimate Vow of Sarah & Kevin'],
            [
                'category'       => 'wedding',
                'description'    => 'Momen sakral penuh kehangatan keluarga di bawah rindangnya pinus Lembang. Mengutamakan ekspresi candid alami dan interaksi intim dua insan.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
                'photos'         => [
                    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
                    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
                    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
                    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
                    'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800',
                ],
                'is_featured'    => true,
                'is_visible'     => true,
                'taken_at'       => '2024-02-14',
            ]
        );

        PortfolioItem::updateOrCreate(
            ['user_id' => $photographer->id, 'title' => 'Sunset Breeze di Parangtritis'],
            [
                'category'       => 'prewedding',
                'description'    => 'Siluet golden hour berbalut busana tenun khas Nusantara. Angin pantai dan ombak lembut menjadi latar kehangatan cinta mereka.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
                'photos'         => [
                    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
                    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800',
                    'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800',
                    'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
                    'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800',
                ],
                'is_featured'    => true,
                'is_visible'     => true,
                'taken_at'       => '2024-03-01',
            ]
        );

        PortfolioItem::updateOrCreate(
            ['user_id' => $photographer->id, 'title' => 'Graduation Memory at UI - Yuliagus'],
            [
                'category'       => 'portrait',
                'description'    => 'Senyum bangga perayaan kelulusan bersama kedua orang tua dan sahabat di lingkungan kampus Universitas Indonesia Depok.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
                'photos'         => [
                    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
                    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
                    'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=800',
                    'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
                ],
                'is_featured'    => false,
                'is_visible'     => true,
                'taken_at'       => '2024-02-28',
            ]
        );

        PortfolioItem::updateOrCreate(
            ['user_id' => $photographer->id, 'title' => 'Earthy Botanical Editorial'],
            [
                'category'       => 'editorial',
                'description'    => 'Eksplorasi gaya editorial bernuansa alam organik dan pencahayaan lembut dalam studio.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
                'photos'         => [
                    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
                    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
                ],
                'is_featured'    => false,
                'is_visible'     => true,
                'taken_at'       => '2024-01-20',
            ]
        );

        // 7. Demo Proofing Session untuk Klien
        $proofingSession = ProofingSession::updateOrCreate(
            ['slug' => 'demo-wisuda'],
            [
                'booking_id'      => $bookingGraduation->id,
                'user_id'         => $photographer->id,
                'pin'             => '1234',
                'total_photos'    => 8,
                'selection_quota' => 5,
                'selected_count'  => 0,
                'status'          => 'active',
                'expires_at'      => now()->addDays(14),
            ]
        );

        $demoPhotos = [
            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
            'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
            'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=800',
            'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
        ];

        foreach ($demoPhotos as $idx => $photoUrl) {
            ProofingPhoto::updateOrCreate(
                [
                    'proofing_session_id' => $proofingSession->id,
                    'original_filename'   => sprintf('IMG_%04d.JPG', $idx + 101),
                ],
                [
                    'display_filename'    => sprintf('Graduation_Yuliagus_%02d.jpg', $idx + 1),
                    'lowres_path'         => $photoUrl,
                    'sort_order'          => $idx,
                    'status'              => 'ready',
                ]
            );
        }
    }
}
