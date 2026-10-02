<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingExpense;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Resolusi rentang tanggal berdasarkan parameter periode
     */
    private function resolveDateRange(Request $request): array
    {
        $period = $request->query('period', 'this_month');
        $now = now();

        switch ($period) {
            case 'last_month':
                $start = $now->copy()->subMonthNoOverflow()->startOfMonth();
                $end   = $now->copy()->subMonthNoOverflow()->endOfMonth();
                $label = 'Bulan Lalu (' . $start->translatedFormat('F Y') . ')';
                break;

            case 'this_year':
                $start = $now->copy()->startOfYear();
                $end   = $now->copy()->endOfYear();
                $label = 'Tahun Ini (' . $now->year . ')';
                break;

            case 'all':
                $start = Carbon::create(2020, 1, 1);
                $end   = $now->copy()->addYear();
                $label = 'Semua Periode';
                break;

            case 'custom':
                $start = $request->query('start_date') ? Carbon::parse($request->query('start_date'))->startOfDay() : $now->copy()->startOfMonth();
                $end   = $request->query('end_date') ? Carbon::parse($request->query('end_date'))->endOfDay() : $now->copy()->endOfMonth();
                $label = $start->format('d/m/Y') . ' - ' . $end->format('d/m/Y');
                break;

            case 'this_month':
            default:
                $start = $now->copy()->startOfMonth();
                $end   = $now->copy()->endOfMonth();
                $label = 'Bulan Ini (' . $now->translatedFormat('F Y') . ')';
                break;
        }

        return [$start, $end, $label, $period];
    }

    /**
     * GET /reports/financial
     * Data agregat laporan keuangan studio (Pendapatan, Beban, Laba Bersih, Margin)
     */
    public function financial(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        [$startDate, $endDate, $label, $period] = $this->resolveDateRange($request);

        // Ambil booking dalam rentang tanggal
        $bookings = Booking::with(['client', 'package', 'payments', 'expenses'])
            ->where('user_id', $userId)
            ->whereBetween('event_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('event_date', 'asc')
            ->get();

        // Ambil pengeluaran dalam rentang tanggal
        $expenses = BookingExpense::where('user_id', $userId)
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('expense_date', 'desc')
            ->get();

        // Ambil pembayaran riil yang diterima dalam rentang tanggal
        $payments = Payment::where('user_id', $userId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()])
            ->get();

        $totalRevenue = (float) $bookings->whereNotIn('status', ['cancelled'])->sum('total_price');
        $totalPaid = (float) $payments->sum('amount');
        $totalExpenses = (float) $expenses->sum('amount');
        $netProfit = $totalRevenue - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 1) : 0;
        $totalReceivable = max(0, $totalRevenue - $totalPaid);

        // Pengeluaran per kategori
        $categoryMaster = BookingExpense::categories();
        $expensesByCategory = [];
        foreach ($categoryMaster as $key => $catLabel) {
            $catExpenses = $expenses->where('category', $key);
            $expensesByCategory[] = [
                'category' => $key,
                'label'    => $catLabel,
                'total'    => (float) $catExpenses->sum('amount'),
                'count'    => $catExpenses->count(),
            ];
        }

        // Rincian per booking
        $bookingRows = $bookings->map(function ($b) {
            $revenue = (float) $b->total_price;
            $paid = (float) $b->payments->where('status', 'paid')->sum('amount');
            $cost = (float) $b->expenses->sum('amount');
            $profit = $revenue - $cost;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 1) : 0;

            return [
                'id'             => $b->id,
                'booking_code'   => $b->booking_code,
                'event_date'     => $b->event_date?->format('Y-m-d'),
                'client_name'    => $b->client?->name ?? 'Klien',
                'package_name'   => $b->package?->name ?? 'Paket',
                'status'         => $b->status,
                'total_price'    => $revenue,
                'total_paid'     => $paid,
                'remaining'      => max(0, $revenue - $paid),
                'total_expenses' => $cost,
                'net_profit'     => $profit,
                'profit_margin'  => $margin,
            ];
        });

        return response()->json([
            'data' => [
                'period' => [
                    'key'        => $period,
                    'label'      => $label,
                    'start_date' => $startDate->toDateString(),
                    'end_date'   => $endDate->toDateString(),
                ],
                'summary' => [
                    'total_revenue'         => $totalRevenue,
                    'total_paid'            => $totalPaid,
                    'total_receivable'      => $totalReceivable,
                    'total_expenses'        => $totalExpenses,
                    'net_profit'            => $netProfit,
                    'profit_margin_percent' => $profitMargin,
                    'total_bookings'        => $bookings->count(),
                    'completed_bookings'    => $bookings->where('status', 'completed')->count(),
                ],
                'expenses_by_category' => $expensesByCategory,
                'bookings'             => $bookingRows,
                'recent_expenses'      => $expenses->take(30),
            ],
            'message' => 'Laporan keuangan berhasil dikalkulasi.',
        ]);
    }

    /**
     * GET /reports/financial/export-csv
     * Unduh berkas spreadsheet CSV dengan format UTF-8 BOM untuk Microsoft Excel
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $userId = $request->user()->id;
        $photographer = $request->user();
        [$startDate, $endDate, $label] = $this->resolveDateRange($request);

        $bookings = Booking::with(['client', 'package', 'payments', 'expenses'])
            ->where('user_id', $userId)
            ->whereBetween('event_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('event_date', 'asc')
            ->get();

        $expenses = BookingExpense::where('user_id', $userId)
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('expense_date', 'desc')
            ->get();

        $totalRevenue = (float) $bookings->whereNotIn('status', ['cancelled'])->sum('total_price');
        $totalExpenses = (float) $expenses->sum('amount');
        $netProfit = $totalRevenue - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 1) : 0;

        $filename = 'laporan-keuangan-' . preg_replace('/[^a-zA-Z0-9_-]/', '-', strtolower($label)) . '.csv';

        return response()->streamDownload(function () use ($photographer, $label, $totalRevenue, $totalExpenses, $netProfit, $profitMargin, $bookings, $expenses) {
            $handle = fopen('php://output', 'w');

            // Tambahkan UTF-8 BOM agar Excel Windows membuka file tanpa karakter aneh
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header Studio
            fputcsv($handle, ['LAPORAN KEUANGAN & LABA BERSIH STUDIO']);
            fputcsv($handle, ['Studio / Fotografer', $photographer->brand_name ?? $photographer->name]);
            fputcsv($handle, ['Periode', $label]);
            fputcsv($handle, ['Tanggal Ekspor', now()->translatedFormat('d F Y, H:i') . ' WIB']);
            fputcsv($handle, []);

            // Ringkasan
            fputcsv($handle, ['RINGKASAN EKSEKUTIF']);
            fputcsv($handle, ['Total Omzet / Pendapatan', number_format($totalRevenue, 0, ',', '.')]);
            fputcsv($handle, ['Total Biaya Operasional', number_format($totalExpenses, 0, ',', '.')]);
            fputcsv($handle, ['Laba Bersih (Net Profit)', number_format($netProfit, 0, ',', '.')]);
            fputcsv($handle, ['Margin Keuntungan Bersih', $profitMargin . '%']);
            fputcsv($handle, []);

            // Tabel Sesi Booking
            fputcsv($handle, ['RINCIAN PROYEK SESI FOTO']);
            fputcsv($handle, [
                'Kode Booking',
                'Tanggal Sesi',
                'Nama Klien',
                'Paket Layanan',
                'Status Sesi',
                'Nilai Kontrak (Rp)',
                'Total Terbayar (Rp)',
                'Sisa Piutang (Rp)',
                'Biaya Proyek (Rp)',
                'Laba Bersih (Rp)',
                'Margin (%)'
            ]);

            foreach ($bookings as $b) {
                $rev = (float) $b->total_price;
                $paid = (float) $b->payments->where('status', 'paid')->sum('amount');
                $cost = (float) $b->expenses->sum('amount');
                $prof = $rev - $cost;
                $marg = $rev > 0 ? round(($prof / $rev) * 100, 1) : 0;

                fputcsv($handle, [
                    $b->booking_code,
                    $b->event_date?->format('d/m/Y') ?? '-',
                    $b->client?->name ?? 'Klien',
                    $b->package?->name ?? 'Paket',
                    ucfirst(str_replace('_', ' ', $b->status)),
                    $rev,
                    $paid,
                    max(0, $rev - $paid),
                    $cost,
                    $prof,
                    $marg . '%'
                ]);
            }

            fputcsv($handle, []);

            // Tabel Pengeluaran
            fputcsv($handle, ['RINCIAN PENGELUARAN OPERASIONAL']);
            fputcsv($handle, [
                'Tanggal',
                'Kode Booking Terkait',
                'Kategori Beban',
                'Keterangan Pengeluaran',
                'Nominal (Rp)',
                'Catatan'
            ]);

            $categories = BookingExpense::categories();
            foreach ($expenses as $e) {
                fputcsv($handle, [
                    $e->expense_date?->format('d/m/Y') ?? '-',
                    $e->booking?->booking_code ?? 'Umum',
                    $categories[$e->category] ?? $e->category,
                    $e->title,
                    $e->amount,
                    $e->notes ?? '-'
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
