<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * GET /bookings/{booking}/expenses
     * Ambil daftar biaya operasional dan kalkulasi laba bersih untuk booking ini
     */
    public function index(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $expenses = $booking->expenses()->orderByDesc('expense_date')->orderByDesc('id')->get();

        $totalRevenue = (float) $booking->total_price;
        $totalPaid = (float) $booking->payments()->where('status', 'paid')->sum('amount');
        $totalExpense = (float) $expenses->sum('amount');
        $netProfit = $totalRevenue - $totalExpense;
        $marginPercent = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 1) : 0;

        return response()->json([
            'data' => [
                'expenses'               => $expenses,
                'categories'             => BookingExpense::categories(),
                'summary' => [
                    'total_revenue'         => $totalRevenue,
                    'total_paid'            => $totalPaid,
                    'total_expense'         => $totalExpense,
                    'net_profit'            => $netProfit,
                    'profit_margin_percent' => $marginPercent,
                ],
            ],
            'message' => 'Daftar pengeluaran booking berhasil dimuat.',
        ]);
    }

    /**
     * POST /bookings/{booking}/expenses
     * Catat pos pengeluaran baru untuk sesi booking ini
     */
    public function store(Request $request, Booking $booking): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');

        $data = $request->validate([
            'category'     => 'required|string|in:studio_rental,assistant_fee,transport,printing,props,other',
            'title'        => 'required|string|max:200',
            'amount'       => 'required|numeric|min:1',
            'expense_date' => 'nullable|date',
            'notes'        => 'nullable|string|max:500',
        ]);

        $expense = BookingExpense::create([
            'booking_id'   => $booking->id,
            'user_id'      => $request->user()->id,
            'category'     => $data['category'],
            'title'        => $data['title'],
            'amount'       => $data['amount'],
            'expense_date' => $data['expense_date'] ?? now()->toDateString(),
            'notes'        => $data['notes'] ?? null,
        ]);

        return response()->json([
            'data'    => $expense,
            'message' => 'Catatan pengeluaran proyek berhasil ditambahkan.',
        ], 201);
    }

    /**
     * DELETE /bookings/{booking}/expenses/{expense}
     * Hapus pos pengeluaran
     */
    public function destroy(Request $request, Booking $booking, BookingExpense $expense): JsonResponse
    {
        abort_if($booking->user_id !== $request->user()->id, 403, 'Akses ditolak.');
        abort_if($expense->booking_id !== $booking->id, 404, 'Data pengeluaran tidak ditemukan pada booking ini.');

        $expense->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Pengeluaran berhasil dihapus.',
        ]);
    }
}
