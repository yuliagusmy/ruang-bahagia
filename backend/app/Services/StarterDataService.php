<?php

namespace App\Services;

use App\Models\Package;
use App\Models\PortfolioItem;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class StarterDataService
{
    /**
     * Inisialisasi data starter awal (paket dan portofolio dummy berkualitas)
     * untuk fotografer baru atau profil yang masih kosong, sehingga halaman
     * profil publik langsung tampak profesional dan siap diedit oleh fotografer.
     */
    public function seedStarterDataForPhotographer(User $user): void
    {
        $this->seedBioIfEmpty($user);
        $this->seedPackagesIfEmpty($user);
        $this->seedPortfolioIfEmpty($user);
    }

    /**
     * Berikan bio default bernuansa hangat dan ramah jika fotografer belum mengisi bio.
     */
    public function seedBioIfEmpty(User $user): void
    {
        if (empty($user->bio)) {
            $user->update([
                'bio' => 'Fotografer profesional yang berfokus pada dokumentasi momen berharga dengan visual hangat, sentuhan editorial elegan, dan cerita yang abadi. Melayani sesi wedding, prewedding, dan portrait.',
            ]);
        }
    }

    /**
     * Berikan starter paket layanan jika fotografer belum memiliki paket aktif.
     */
    public function seedPackagesIfEmpty(User $user): void
    {
        if ($user->packages()->count() > 0) {
            return;
        }

        try {
            $starterPackages = [
                [
                    'user_id'         => $user->id,
                    'name'            => 'Sesi Personal & Portrait',
                    'description'     => 'Cocok untuk foto profil profesional, wisuda, personal branding, atau portrait santai outdoor.',
                    'duration_hours'  => 1,
                    'photo_quota'     => 15,
                    'selection_quota' => 30,
                    'revision_count'  => 2,
                    'price'           => 750000,
                    'dp_amount'       => 250000,
                    'is_active'       => true,
                    'inclusions'      => [
                        '1 Jam sesi pemotretan santai',
                        '15 Foto terpilih dengan color grading (high-res)',
                        'Akses galeri swipe proofing digital via smartphone',
                        'Semua file original JPEG',
                    ],
                ],
                [
                    'user_id'         => $user->id,
                    'name'            => 'Sesi Prewedding & Intimate',
                    'description'     => 'Dokumentasi momen hangat dan autentik pasangan dengan konsep editorial elegan di lokasi outdoor maupun indoor.',
                    'duration_hours'  => 3,
                    'photo_quota'     => 35,
                    'selection_quota' => 70,
                    'revision_count'  => 3,
                    'price'           => 2500000,
                    'dp_amount'       => 750000,
                    'is_active'       => true,
                    'inclusions'      => [
                        '3 Jam pemotretan (2 pilihan wardrobe/lokasi)',
                        '35 Foto edited resolusi tinggi',
                        'Swipe proofing foto instan via smartphone klien',
                        'Penyimpanan cloud Google Drive',
                        '1 Cetak pembesaran 30x40 cm',
                    ],
                ],
                [
                    'user_id'         => $user->id,
                    'name'            => 'Sesi Intimate Wedding & Akad',
                    'description'     => 'Liputan dokumentasi sakral akad nikah atau resepsi intim bersama keluarga terdekat.',
                    'duration_hours'  => 4,
                    'photo_quota'     => 50,
                    'selection_quota' => 100,
                    'revision_count'  => 3,
                    'price'           => 3500000,
                    'dp_amount'       => 1000000,
                    'is_active'       => true,
                    'inclusions'      => [
                        '4 Jam liputan akad & intimate session',
                        '50 Foto edited pilihan terbaik',
                        'Akses galeri digital untuk seluruh keluarga',
                        'Seluruh file master JPEG via cloud drive',
                    ],
                ],
            ];

            foreach ($starterPackages as $pkgData) {
                Package::create($pkgData);
            }

            Log::info("Starter packages seeded for photographer ID: {$user->id} (@{$user->username})");
        } catch (\Throwable $e) {
            Log::error("Failed seeding starter packages for user {$user->id}: " . $e->getMessage());
        }
    }

    /**
     * Berikan starter sesi portofolio terpilih dengan foto estetis jika fotografer belum memiliki portofolio.
     */
    public function seedPortfolioIfEmpty(User $user): void
    {
        if ($user->portfolioItems()->count() > 0) {
            return;
        }

        try {
            $starterPortfolio = [
                [
                    'user_id'        => $user->id,
                    'title'          => 'Golden Hour Botanical Engagement',
                    'description'    => 'Sesi foto prewedding hangat di tengah kebun raya saat cahaya sore keemasan (golden hour).',
                    'category'       => 'prewedding',
                    'thumbnail_path' => 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop',
                    'photos'         => [
                        'https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1000&auto=format&fit=crop',
                    ],
                    'is_featured'    => true,
                    'is_visible'     => true,
                    'sort_order'     => 1,
                    'taken_at'       => now()->subMonths(1)->toDateString(),
                ],
                [
                    'user_id'        => $user->id,
                    'title'          => 'The Elegant Akad & Intimate Celebration',
                    'description'    => 'Dokumentasi prosesi sakral janji suci dan kehangatan tawa keluarga dalam nuansa modern warm.',
                    'category'       => 'wedding',
                    'thumbnail_path' => 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&auto=format&fit=crop',
                    'photos'         => [
                        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1000&auto=format&fit=crop',
                    ],
                    'is_featured'    => true,
                    'is_visible'     => true,
                    'sort_order'     => 2,
                    'taken_at'       => now()->subMonths(2)->toDateString(),
                ],
                [
                    'user_id'        => $user->id,
                    'title'          => 'Studio Editorial & Natural Light Portrait',
                    'description'    => 'Eksplorasi ekspresi dan kepribadian autentik dengan pencahayaan alami studio yang lembut.',
                    'category'       => 'portrait',
                    'thumbnail_path' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop',
                    'photos'         => [
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop',
                        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&auto=format&fit=crop',
                    ],
                    'is_featured'    => false,
                    'is_visible'     => true,
                    'sort_order'     => 3,
                    'taken_at'       => now()->subMonths(3)->toDateString(),
                ],
            ];

            foreach ($starterPortfolio as $itemData) {
                PortfolioItem::create($itemData);
            }

            Log::info("Starter portfolio seeded for photographer ID: {$user->id} (@{$user->username})");
        } catch (\Throwable $e) {
            Log::error("Failed seeding starter portfolio for user {$user->id}: " . $e->getMessage());
        }
    }
}
