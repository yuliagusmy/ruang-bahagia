<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    /**
     * POST /deliveries/{bookingCode}/review
     * Endpoint publik klien untuk mengirim ulasan setelah melihat / mengunduh foto final
     */
    public function publicStore(Request $request, string $bookingCode): JsonResponse
    {
        $booking = Booking::with(['client', 'package', 'user'])
            ->where('booking_code', $bookingCode)
            ->firstOrFail();

        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:3|max:1000',
        ]);

        $clientName = $booking->client?->name ?? 'Klien';

        // Update jika klien sudah pernah mengirim ulasan, atau buat baru
        $testimonial = Testimonial::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id'     => $booking->user_id,
                'client_name' => $clientName,
                'rating'      => $data['rating'],
                'comment'     => $data['comment'],
                'is_approved' => true,
            ]
        );

        // Kirim notifikasi in-app ke fotografer
        Notification::create([
            'user_id'         => $booking->user_id,
            'title'           => "Ulasan Klien Masuk! ⭐ {$data['rating']}/5",
            'body'            => "Kak {$clientName} memberikan ulasan: \"{$data['comment']}\"",
            'type'            => 'client_review',
            'data'            => [
                'booking_id'     => $booking->id,
                'testimonial_id' => $testimonial->id,
                'client_name'    => $clientName,
                'rating'         => $data['rating'],
                'url'            => "/bookings/{$booking->id}",
            ],
            'notifiable_type' => Booking::class,
            'notifiable_id'   => $booking->id,
        ]);

        return response()->json([
            'data'    => $testimonial,
            'message' => 'Terima kasih banyak atas ulasan dan apresiasi Anda!',
        ], 201);
    }

    /**
     * GET /photographers/{username}/reviews
     * Endpoint publik untuk mengambil ulasan yang disetujui untuk profil publik fotografer
     */
    public function publicList(string $username): JsonResponse
    {
        $photographer = User::where('username', $username)->firstOrFail();

        $testimonials = Testimonial::where('user_id', $photographer->id)
            ->where('is_approved', true)
            ->with(['booking.package:id,name'])
            ->orderByDesc('is_featured')
            ->orderByDesc('created_at')
            ->take(20)
            ->get()
            ->map(function ($t) {
                return [
                    'id'           => $t->id,
                    'client_name'  => $t->client_name,
                    'rating'       => $t->rating,
                    'comment'      => $t->comment,
                    'package_name' => $t->booking?->package?->name ?? 'Sesi Foto',
                    'is_featured'  => $t->is_featured,
                    'created_at'   => $t->created_at->format('d M Y'),
                ];
            });

        $averageRating = Testimonial::where('user_id', $photographer->id)
            ->where('is_approved', true)
            ->avg('rating');

        return response()->json([
            'data' => [
                'reviews'        => $testimonials,
                'total_count'    => $testimonials->count(),
                'average_rating' => $averageRating ? round((float) $averageRating, 1) : 5.0,
            ],
            'message' => 'Ulasan berhasil dimuat.',
        ]);
    }

    /**
     * GET /testimonials/featured
     * Endpoint publik untuk ulasan ber-rating tinggi lintas studio di Landing Page
     */
    public function featuredGlobal(): JsonResponse
    {
        $testimonials = Testimonial::where('is_approved', true)
            ->where('rating', '>=', 4)
            ->with(['booking.package:id,name', 'user:id,name,brand_name,username,avatar_path'])
            ->orderByDesc('is_featured')
            ->orderByDesc('rating')
            ->orderByDesc('created_at')
            ->take(6)
            ->get()
            ->map(function ($t) {
                return [
                    'id'                => $t->id,
                    'client_name'       => $t->client_name,
                    'rating'            => $t->rating,
                    'comment'           => $t->comment,
                    'package_name'      => $t->booking?->package?->name ?? 'Dokumentasi Sesi',
                    'photographer_name' => $t->user?->brand_name ?? $t->user?->name ?? 'Ruang Bahagia Studio',
                    'photographer_user' => $t->user?->username,
                    'created_at'        => $t->created_at->format('d M Y'),
                ];
            });

        return response()->json([
            'data'    => $testimonials,
            'message' => 'Testimoni sorotan berhasil dimuat.',
        ]);
    }

    /**
     * GET /reviews
     * Endpoint privat fotografer untuk melihat semua ulasan masuk
     */
    public function index(Request $request): JsonResponse
    {
        $testimonials = Testimonial::where('user_id', $request->user()->id)
            ->with(['booking.package:id,name', 'booking.client:id,name,phone'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data'    => $testimonials,
            'message' => 'Daftar ulasan fotografer berhasil dimuat.',
        ]);
    }

    /**
     * PATCH /reviews/{testimonial}/toggle-featured
     * Tandai ulasan favorit / sorotan di profil
     */
    public function toggleFeatured(Request $request, Testimonial $testimonial): JsonResponse
    {
        abort_if($testimonial->user_id !== $request->user()->id, 403);

        $testimonial->update(['is_featured' => !$testimonial->is_featured]);

        return response()->json([
            'data'    => $testimonial,
            'message' => $testimonial->is_featured ? 'Ulasan ditandai sebagai sorotan.' : 'Sorotan ulasan dicabut.',
        ]);
    }

    /**
     * DELETE /reviews/{testimonial}
     */
    public function destroy(Request $request, Testimonial $testimonial): JsonResponse
    {
        abort_if($testimonial->user_id !== $request->user()->id, 403);

        $testimonial->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Ulasan berhasil dihapus.',
        ]);
    }
}
