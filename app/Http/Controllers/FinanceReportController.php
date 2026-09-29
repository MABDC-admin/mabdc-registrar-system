<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\FeeStructure;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class FinanceReportController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        // 1. Collections Report (Payments by method)
        $paymentMethodsQuery = Payment::query()
            ->selectRaw('payment_method, SUM(amount) as total')
            ->groupBy('payment_method')
            ->get()
            ->pluck('total', 'payment_method')
            ->all();

        $collectionsByMethod = [
            'Cash' => 0,
            'Credit Card' => 0,
            'Bank Transfer' => 0,
            'Cheque' => 0,
        ];

        foreach ($paymentMethodsQuery as $method => $total) {
            $methodName = $method ?: 'Other';
            if ($methodName === 'Card' || $methodName === 'Credit Card') {
                $collectionsByMethod['Credit Card'] += (float)$total;
            } else {
                if (isset($collectionsByMethod[$methodName])) {
                    $collectionsByMethod[$methodName] += (float)$total;
                } else {
                    $collectionsByMethod[$methodName] = (float)$total;
                }
            }
        }

        $recentPayments = Payment::with('enrollment.learner')
            ->latest('transaction_date')
            ->take(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'learner_name' => $p->enrollment?->learner?->full_name ?? 'System',
                'amount' => $p->amount,
                'method' => $p->payment_method,
                'date' => $p->transaction_date,
                'reference' => $p->reference_number,
            ]);

        // 2. Outstanding Balances Report
        $outstandingAccounts = Enrollment::activeYear()->with(['learner', 'academicYear'])
            ->when($activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id))
            ->get()
            ->map(function ($enrollment) {
                $balance = $enrollment->financeLedgers()->sum('amount');
                $totalFees = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
                $totalPayments = $enrollment->financeLedgers()->where('type', 'payment')->sum('amount');
                return [
                    'id' => $enrollment->id,
                    'learner_name' => optional($enrollment->learner)->full_name ?? 'N/A',
                    'lrn' => optional($enrollment->learner)->lrn ?? 'N/A',
                    'level' => $enrollment->level,
                    'total_fees' => $totalFees,
                    'total_payments' => abs($totalPayments),
                    'balance' => $balance,
                ];
            })
            ->filter(fn ($e) => $e['balance'] > 0)
            ->sortByDesc('balance')
            ->values()
            ->all();

        // 3. Fee Structure Summaries
        $feeStructures = FeeStructure::query()
            ->get()
            ->map(fn ($fs) => [
                'id' => $fs->id,
                'name' => $fs->name,
                'type' => $fs->type,
                'amount' => $fs->amount,
                'is_active' => $fs->is_active,
            ]);

        // Summary stats
        $totalOutstandingSum = collect($outstandingAccounts)->sum('balance');
        $totalCollectedSum = Payment::sum('amount');

        return Inertia::render('Finance/Reports', [
            'collectionsByMethod' => $collectionsByMethod,
            'recentPayments' => $recentPayments,
            'outstandingAccounts' => $outstandingAccounts,
            'feeStructures' => $feeStructures,
            'stats' => [
                'total_outstanding' => $totalOutstandingSum,
                'total_collected' => $totalCollectedSum,
                'active_academic_year' => $activeYear?->name ?? 'None',
            ]
        ]);
    }

    public function exportOutstandingPdf()
    {
        $activeYear = AcademicYear::where('is_active', true)->first();

        $accounts = Enrollment::activeYear()->with('learner')
            ->when($activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id))
            ->get()
            ->map(function ($enrollment) {
                $balance = $enrollment->financeLedgers()->sum('amount');
                return [
                    'learner_name' => optional($enrollment->learner)->full_name ?? 'N/A',
                    'lrn' => optional($enrollment->learner)->lrn ?? 'N/A',
                    'level' => $enrollment->level,
                    'balance' => $balance,
                ];
            })
            ->filter(fn ($e) => $e['balance'] > 0)
            ->sortByDesc('balance')
            ->values()
            ->all();

        $pdf = Pdf::loadView('pdf.reports.outstanding', [
            'accounts' => $accounts,
            'academic_year' => $activeYear?->name ?? 'Global',
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ]);

        return $pdf->download('Outstanding_Balances_Report.pdf');
    }

    public function exportCollectionsPdf()
    {
        $payments = Payment::with('enrollment.learner')
            ->latest('transaction_date')
            ->get()
            ->map(fn ($p) => [
                'learner_name' => $p->enrollment?->learner?->full_name ?? 'System',
                'amount' => $p->amount,
                'method' => $p->payment_method,
                'date' => $p->transaction_date,
                'reference' => $p->reference_number,
            ]);

        $pdf = Pdf::loadView('pdf.reports.collections', [
            'payments' => $payments,
            'total_amount' => Payment::sum('amount'),
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ]);

        return $pdf->download('Collection_History_Report.pdf');
    }
}
