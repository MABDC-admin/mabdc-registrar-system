<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\FinanceLedger;
use App\Models\InstallmentPlan;
use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $statusFilter = $request->query('status');

        // ── Dashboard KPIs ──────────────────────────────────────────────────
        $totalBilled   = FinanceLedger::whereIn('type', ['charge', 'tax'])->sum('amount');
        $totalPayments = abs(FinanceLedger::where('type', 'payment')->sum('amount'));
        $totalRefunds  = abs(FinanceLedger::where('type', 'refund')->sum('amount'));
        $totalDiscounts= abs(FinanceLedger::where('type', 'discount')->sum('amount'));
        $outstanding   = $totalBilled - $totalPayments - $totalDiscounts - $totalRefunds;
        $collectionRate= $totalBilled > 0 ? round(($totalPayments / $totalBilled) * 100, 1) : 0;

        // Overdue: enrollments with balance > 0 and financial_status != 'Cleared'
        $overdueCount  = Enrollment::activeYear()->where('financial_status', '!=', 'Cleared')
            ->where('financial_status', '!=', 'No Assessment')
            ->count();

        // Recent 10 transactions across all ledgers
        $recentTransactions = FinanceLedger::with(['enrollment.learner'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($l) => [
                'id'          => $l->id,
                'type'        => $l->type,
                'description' => $l->description,
                'amount'      => $l->amount,
                'date'        => $l->transaction_date,
                'learner'     => optional($l->enrollment->learner)->full_name,
            ]);

        // Monthly income for the current year (last 12 months)
        $monthlyIncome = FinanceLedger::where('type', 'payment')
            ->where('transaction_date', '>=', now()->subYear())
            ->select(DB::raw("TO_CHAR(transaction_date, 'Mon YYYY') as month"), DB::raw('ABS(SUM(amount)) as total'))
            ->groupBy(DB::raw("TO_CHAR(transaction_date, 'Mon YYYY')"))
            ->orderBy(DB::raw("MIN(transaction_date)"))
            ->get();

        // Learners with financial holds (balance > 0, partially paid or unpaid)
        $financialHolds = Enrollment::activeYear()->with('learner')
            ->whereIn('financial_status', ['Unpaid', 'Partially Paid'])
            ->limit(5)
            ->get()
            ->map(fn ($e) => [
                'id'     => $e->id,
                'name'   => optional($e->learner)->full_name,
                'status' => $e->financial_status,
                'level'  => $e->level,
            ]);

        // ── Extra Analytics ──────────────────────────────────────────────────

        // Status distribution counts
        $statusBreakdown = Enrollment::activeYear()->select('financial_status', DB::raw('count(*) as count'))
            ->groupBy('financial_status')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->financial_status => (int) $row->count]);

        // Per grade-level outstanding
        $gradeBreakdown = Enrollment::activeYear()->join('finance_ledgers', 'enrollments.id', '=', 'finance_ledgers.enrollment_id')
            ->select('enrollments.level', DB::raw('count(distinct enrollments.id) as count'), DB::raw('round(sum(finance_ledgers.amount)::numeric, 2) as outstanding'))
            ->groupBy('enrollments.level')
            ->havingRaw('sum(finance_ledgers.amount) > 0')
            ->orderByDesc('outstanding')
            ->get()
            ->map(fn ($row) => [
                'level'       => $row->level,
                'count'       => (int) $row->count,
                'outstanding' => (float) $row->outstanding,
            ])
            ->values();

        // Top 5 debtors
        $topDebtors = Enrollment::activeYear()->with('learner')
            ->join('finance_ledgers', 'enrollments.id', '=', 'finance_ledgers.enrollment_id')
            ->whereIn('enrollments.financial_status', ['Unpaid', 'Partially Paid'])
            ->select('enrollments.id', 'enrollments.level', 'enrollments.learner_id', DB::raw('round(sum(finance_ledgers.amount)::numeric, 2) as balance'))
            ->groupBy('enrollments.id', 'enrollments.level', 'enrollments.learner_id')
            ->havingRaw('sum(finance_ledgers.amount) > 0')
            ->orderByDesc('balance')
            ->limit(5)
            ->get()
            ->map(fn ($e) => [
                'id'      => $e->id,
                'name'    => optional($e->learner)->full_name,
                'level'   => $e->level,
                'balance' => (float) $e->balance,
            ])
            ->values();

        // Today's collections
        $todayCollections = abs(FinanceLedger::where('type', 'payment')
            ->whereDate('transaction_date', today())
            ->sum('amount'));

        $todayCount = FinanceLedger::where('type', 'payment')
            ->whereDate('transaction_date', today())
            ->count();
        // ────────────────────────────────────────────────────────────────────

        return Inertia::render('Finance/Index', [
            'kpis'               => [
                'total_billed'      => $totalBilled,
                'total_payments'    => $totalPayments,
                'total_discounts'   => $totalDiscounts,
                'total_refunds'     => $totalRefunds,
                'outstanding'       => $outstanding,
                'collection_rate'   => $collectionRate,
                'overdue_count'     => $overdueCount,
                'today_collections' => $todayCollections,
                'today_count'       => $todayCount,
            ],
            'recent_transactions' => $recentTransactions,
            'monthly_income'      => $monthlyIncome,
            'financial_holds'     => $financialHolds,
            'status_breakdown'    => $statusBreakdown,
            'grade_breakdown'     => $gradeBreakdown,
            'top_debtors'         => $topDebtors,
        ]);
    }

    public function show(Enrollment $enrollment)
    {
        $enrollment->load(['learner.primaryPhoto', 'academicYear', 'financeLedgers' => function ($query) {
            $query->orderBy('transaction_date', 'desc')->orderBy('created_at', 'desc');
        }, 'installmentPlans']);

        $balance = $enrollment->financeLedgers()->sum('amount');
        
        // Computed summaries for the UI
        $totalFees = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
        $totalPayments = $enrollment->financeLedgers()->where('type', 'payment')->sum('amount');
        $totalDiscounts = $enrollment->financeLedgers()->where('type', 'discount')->sum('amount');

        return Inertia::render('Finance/Show', [
            'enrollment' => [
                'id' => $enrollment->id,
                'learner_name' => $enrollment->learner->full_name,
                'lrn' => $enrollment->learner->lrn,
                'photo_url' => $enrollment->learner->primaryPhoto ? asset('storage/' . $enrollment->learner->primaryPhoto->filename) : null,
                'grade_level' => $enrollment->level,
                'academic_year' => $enrollment->academicYear->name,
                'financial_status' => $enrollment->financial_status ?? 'No Assessment',
                'balance' => $balance,
                'total_fees' => $totalFees,
                'total_payments' => abs($totalPayments),
                'total_discounts' => abs($totalDiscounts),
                'ledgers' => $enrollment->financeLedgers,
                'installment_plans' => $enrollment->installmentPlans,
            ]
        ]);
    }

    public function storeCharge(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date',
            'apply_vat' => 'nullable|boolean',
        ]);

        // Base Charge
        $enrollment->financeLedgers()->create([
            'type' => 'charge',
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'transaction_date' => $validated['transaction_date'],
        ]);

        $applyVat = $request->boolean('apply_vat', true);
        $taxAmount = 0;

        if ($applyVat) {
            // UAE VAT (5%)
            $taxAmount = round($validated['amount'] * 0.05, 2);
            $enrollment->financeLedgers()->create([
                'type' => 'tax',
                'description' => 'UAE VAT (5%) on ' . $validated['description'],
                'amount' => $taxAmount,
                'transaction_date' => $validated['transaction_date'],
            ]);
        }

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'charge_applied',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
            'before' => null,
            'after' => [
                'type' => 'charge',
                'description' => $validated['description'],
                'amount' => $validated['amount'],
                'tax_amount' => $taxAmount,
                'transaction_date' => $validated['transaction_date'],
            ],
            'metadata' => [
                'learner_name' => optional($enrollment->learner)->full_name,
                'message' => 'Charge of AED ' . number_format($validated['amount'], 2) . ($applyVat ? ' (+ 5% VAT)' : ' (No VAT)') . ' applied for ' . $validated['description'],
            ],
        ]);

        $this->updateFinancialStatus($enrollment);

        $msg = $applyVat ? 'Charge and 5% VAT applied successfully.' : 'Custom charge (VAT exempt) applied successfully.';
        return redirect()->back()->with('success', $msg);
    }

    public function storePayment(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|string',
            'receipt_number' => 'required|string|unique:receipts,receipt_number',
            'transaction_date' => 'required|date',
            'reference_number' => 'nullable|string|max:255',
        ]);

        // Guard: Cannot collect more than the outstanding balance
        $currentBalance = (float) $enrollment->financeLedgers()->sum('amount');

        if ($currentBalance <= 0) {
            return redirect()->back()->withErrors([
                'amount' => 'Cannot collect payment as this student has no outstanding balance (Current Balance: AED ' . number_format($currentBalance, 2) . ').'
            ]);
        }

        if ($validated['amount'] > ($currentBalance + 0.001)) {
            return redirect()->back()->withErrors([
                'amount' => 'Payment amount (AED ' . number_format($validated['amount'], 2) . ') cannot exceed the outstanding balance (AED ' . number_format($currentBalance, 2) . ').'
            ]);
        }

        // 1. Create the formal Payment record
        $payment = \App\Models\Payment::create([
            'enrollment_id' => $enrollment->id,
            'amount' => $validated['amount'],
            'payment_method' => $validated['method'],
            'reference_number' => $request->input('reference_number'),
            'transaction_date' => $validated['transaction_date'],
            'processed_by' => auth()->id(),
            'status' => 'completed',
        ]);

        // 2. Create Receipt with manual receipt number
        $receipt = \App\Models\Receipt::create([
            'payment_id' => $payment->id,
            'receipt_number' => $validated['receipt_number'],
            'issued_date' => $validated['transaction_date'],
        ]);

        // 3. Create Ledger Entry
        $refString = $request->filled('reference_number') ? ' | Ref: ' . $request->input('reference_number') : '';
        $enrollment->financeLedgers()->create([
            'type' => 'payment',
            'description' => 'Payment via ' . $validated['method'] . ' (Receipt: ' . $validated['receipt_number'] . $refString . ')',
            'amount' => -$validated['amount'], // Negative for payments
            'transaction_date' => $validated['transaction_date'],
        ]);

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'payment_recorded',
            'subject_type' => \App\Models\Payment::class,
            'subject_id' => $payment->id,
            'before' => null,
            'after' => [
                'type' => 'payment',
                'amount' => $validated['amount'],
                'method' => $validated['method'],
                'receipt_number' => $validated['receipt_number'],
                'reference_number' => $request->input('reference_number'),
                'transaction_date' => $validated['transaction_date'],
            ],
            'metadata' => [
                'learner_name' => optional($enrollment->learner)->full_name,
                'message' => 'Payment of AED ' . number_format($validated['amount'], 2) . ' recorded via ' . $validated['method'] . ' (Receipt: ' . $validated['receipt_number'] . ($request->filled('reference_number') ? ', Ref: ' . $request->input('reference_number') : '') . ')',
            ],
        ]);

        $this->updateFinancialStatus($enrollment);

        return redirect()->back()->with('success', 'Payment recorded successfully. Receipt generated: ' . $validated['receipt_number']);
    }

    public function storeDiscount(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'type' => 'required|string',
            'discount_mode' => 'required|string|in:fixed,percent',
            'amount' => 'required_if:discount_mode,fixed|nullable|numeric|min:0.01',
            'percent' => 'required_if:discount_mode,percent|nullable|numeric|min:0.01|max:100',
            'transaction_date' => 'required|date',
        ]);

        if ($request->discount_mode === 'percent') {
            $totalFees = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
            if ($totalFees <= 0) {
                return redirect()->back()->withErrors(['amount' => 'Cannot apply percentage discount as this student has no assessed fees.']);
            }
            $amount = round(($request->percent / 100) * $totalFees, 2);
            $description = 'Discount: ' . $request->type . ' (' . $request->percent . '%)';
        } else {
            $amount = $request->amount;
            $description = 'Discount: ' . $request->type;
        }

        $enrollment->financeLedgers()->create([
            'type' => 'discount',
            'description' => $description,
            'amount' => -$amount, // Negative for discounts
            'transaction_date' => $request->transaction_date,
        ]);

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'discount_applied',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
            'before' => null,
            'after' => [
                'type' => 'discount',
                'discount_type' => $request->type,
                'mode' => $request->discount_mode,
                'amount' => $amount,
                'transaction_date' => $request->transaction_date,
            ],
            'metadata' => [
                'learner_name' => optional($enrollment->learner)->full_name,
                'message' => 'Discount of AED ' . number_format($amount, 2) . ' applied (' . $description . ')',
            ],
        ]);

        $this->updateFinancialStatus($enrollment);

        return redirect()->back()->with('success', 'Discount applied successfully.');
    }

    public function updateFinancialStatus(Enrollment $enrollment)
    {
        $ledgers = $enrollment->financeLedgers;
        if ($ledgers->isEmpty()) {
            $enrollment->update(['financial_status' => 'No Assessment']);
            return;
        }

        $balance = $ledgers->sum('amount');
        if ($balance <= 0) {
            $enrollment->update(['financial_status' => 'Cleared']);
        } elseif ($ledgers->where('type', 'payment')->isNotEmpty()) {
            $enrollment->update(['financial_status' => 'Partially Paid']);
        } else {
            $enrollment->update(['financial_status' => 'Unpaid']);
        }
    }

    public function showReceipt(\App\Models\Receipt $receipt)
    {
        $receipt->load(['payment.enrollment.learner', 'payment.enrollment.academicYear']);
        
        $enrollment = $receipt->payment->enrollment;
        $balance = $enrollment->financeLedgers()->sum('amount');

        return Inertia::render('Finance/Receipt', [
            'receipt' => array_merge($receipt->toArray(), [
                'current_balance' => $balance,
            ]),
        ]);
    }

    public function storeRefund(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'amount'           => 'required|numeric|min:0.01',
            'reason'           => 'required|string|max:255',
            'transaction_date' => 'required|date',
        ]);

        $enrollment->financeLedgers()->create([
            'type'             => 'refund',
            'description'      => 'Refund: ' . $request->reason,
            'amount'           => -$request->amount, // Negative – reduces amount owed
            'transaction_date' => $request->transaction_date,
        ]);

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'refund_issued',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
            'before' => null,
            'after' => [
                'type' => 'refund',
                'amount' => $request->amount,
                'reason' => $request->reason,
                'transaction_date' => $request->transaction_date,
            ],
            'metadata' => [
                'learner_name' => optional($enrollment->learner)->full_name,
                'message' => 'Refund of AED ' . number_format($request->amount, 2) . ' issued for: ' . $request->reason,
            ],
        ]);

        $this->updateFinancialStatus($enrollment);

        return redirect()->back()->with('success', 'Refund of AED ' . number_format($request->amount, 2) . ' issued successfully.');
    }

    public function storeInstallmentPlan(Request $request, Enrollment $enrollment)
    {
        $request->validate([
            'total_months' => 'required|integer|min:1|max:12',
            'start_date' => 'required|date',
        ]);

        $totalFees = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
        
        if ($totalFees <= 0) {
            return redirect()->back()->withErrors(['amount' => 'Cannot generate installment plan for zero or negative fees.']);
        }

        $monthlyAmount = $totalFees / $request->total_months;

        $enrollment->installmentPlans()->create([
            'total_months' => $request->total_months,
            'monthly_amount' => $monthlyAmount,
            'start_date' => $request->start_date,
        ]);

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'installment_plan_created',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
            'before' => null,
            'after' => [
                'total_months' => $request->total_months,
                'monthly_amount' => $monthlyAmount,
                'start_date' => $request->start_date,
            ],
            'metadata' => [
                'learner_name' => optional($enrollment->learner)->full_name,
                'message' => 'Installment plan generated for ' . $request->total_months . ' months (AED ' . number_format($monthlyAmount, 2) . '/month)',
            ],
        ]);

        return redirect()->back()->with('success', 'Installment plan generated successfully.');
    }

    public function settings()
    {
        $fees = \App\Models\GradeLevelFee::all();

        // Attach per-level assessment counts
        $fees = $fees->map(function ($fee) {
            $total    = Enrollment::activeYear()->where('level', $fee->grade_level)->where('mode', $fee->mode)->count();
            // "Assessed" = enrollment already has a Tuition Fee charge entry (mirrors backend guard)
            $assessed = Enrollment::activeYear()->where('level', $fee->grade_level)
                ->where('mode', $fee->mode)
                ->whereHas('financeLedgers', function ($q) {
                    $q->where('type', 'charge')->where('description', 'Tuition Fee');
                })
                ->count();
            $fee->total_count    = $total;
            $fee->assessed_count = $assessed;
            return $fee;
        });

        $levelOrder = [
            'L1' => 1, 'L2' => 2,
            'G1' => 3, 'G2' => 4, 'G3' => 5, 'G4' => 6, 'G5' => 7, 'G6' => 8,
            'G7' => 9, 'G8' => 10, 'G9' => 11, 'G10' => 12, 'G11' => 13, 'G12' => 14
        ];

        $sortedFees = $fees->sortBy(function ($fee) use ($levelOrder) {
            $levelWeight = $levelOrder[$fee->grade_level] ?? 99;
            $modeWeight = $fee->mode === 'face_to_face' ? 1 : 2;
            return $levelWeight * 10 + $modeWeight;
        });

        return Inertia::render('Finance/Settings', [
            'fees' => $sortedFees->values(),
        ]);
    }

    public function storeSettings(Request $request)
    {
        $validated = $request->validate([
            'grade_level' => 'required|string',
            'base_tuition' => 'required|numeric|min:0',
            'mode' => 'required|string|in:face_to_face,online',
        ]);

        \App\Models\GradeLevelFee::updateOrCreate(
            ['grade_level' => $validated['grade_level'], 'mode' => $validated['mode']],
            ['base_tuition' => $validated['base_tuition']]
        );

        return redirect()->back()->with('success', 'Grade level fee updated successfully.');
    }

    public function destroySettings(\App\Models\GradeLevelFee $fee)
    {
        $fee->delete();
        return redirect()->back()->with('success', 'Grade level tuition fee deleted successfully.');
    }

    public function batchAssess(Request $request)
    {
        $validated = $request->validate([
            'grade_level' => 'required|string',
            'mode' => 'required|string|in:face_to_face,online',
        ]);

        $fees = \App\Models\FeeStructure::where('is_active', true)
            ->where(function($q) use ($validated) {
                $q->whereNull('level')->orWhere('level', $validated['grade_level']);
            })
            ->where('is_optional', false)
            ->get();

        $gradeLevelFee = \App\Models\GradeLevelFee::where('grade_level', $validated['grade_level'])
            ->where('mode', $validated['mode'])
            ->first();

        if ($fees->isEmpty() && !$gradeLevelFee) {
            return redirect()->back()->withErrors(['grade_level' => 'No active mandatory fee structures or tuition fees defined for this level.']);
        }

        // Find enrollments in this grade level that match the selected study mode and have no tuition charge yet (double-assessment guard).
        $enrollments = Enrollment::activeYear()->where('level', $validated['grade_level'])
            ->where('mode', $validated['mode'])
            ->whereDoesntHave('financeLedgers', function ($q) {
                $q->where('type', 'charge')->where('description', 'Tuition Fee');
            })
            ->get();

        $count = 0;
        foreach ($enrollments as $enrollment) {
            
            // --- CARRY FORWARD LOGIC ---
            $pastEnrollments = Enrollment::where('learner_id', $enrollment->learner_id)
                ->where('id', '!=', $enrollment->id)
                ->get();

            $totalArrears = 0;
            $totalCredits = 0;
            foreach ($pastEnrollments as $past) {
                $pastBalance = $past->financeLedgers()->sum('amount');
                if ($pastBalance > 0) {
                    $totalArrears += $pastBalance;
                    $past->financeLedgers()->create([
                        'type' => 'payment',
                        'description' => 'Balance transferred to new Academic Year',
                        'amount' => -$pastBalance,
                        'transaction_date' => now(),
                    ]);
                    $past->update(['financial_status' => 'Cleared']);
                } elseif ($pastBalance < 0) {
                    $absCredit = abs($pastBalance);
                    $totalCredits += $absCredit;
                    $past->financeLedgers()->create([
                        'type' => 'charge',
                        'description' => 'Credit balance transferred to new Academic Year',
                        'amount' => $absCredit,
                        'transaction_date' => now(),
                    ]);
                    $past->update(['financial_status' => 'Cleared']);
                }
            }

            if ($totalArrears > 0) {
                $enrollment->financeLedgers()->create([
                    'type' => 'charge',
                    'description' => 'Previous Year Arrears Forwarded',
                    'amount' => $totalArrears,
                    'transaction_date' => now(),
                ]);
            }

            if ($totalCredits > 0) {
                $enrollment->financeLedgers()->create([
                    'type' => 'discount',
                    'description' => 'Previous Year Credit Balance Forwarded',
                    'amount' => -$totalCredits,
                    'transaction_date' => now(),
                ]);
            }
            // ---------------------------

            // Assess base tuition if configured — skip if already charged (extra guard)
            if ($gradeLevelFee) {
                $alreadyCharged = $enrollment->financeLedgers()
                    ->where('type', 'charge')
                    ->where('description', 'Tuition Fee')
                    ->exists();

                if (!$alreadyCharged) {
                    $enrollment->financeLedgers()->create([
                        'type' => 'charge',
                        'description' => 'Tuition Fee',
                        'amount' => $gradeLevelFee->base_tuition,
                        'transaction_date' => now(),
                    ]);
                }
            }

            foreach ($fees as $fee) {
                $enrollment->financeLedgers()->create([
                    'type' => 'charge',
                    'description' => $fee->name,
                    'amount' => $fee->amount,
                    'transaction_date' => now(),
                ]);
            }

            // Generate Registration Fee Payment (-500.00) during batch assessment
            $hasRegFee = $enrollment->financeLedgers()
                ->where('type', 'payment')
                ->where('description', 'like', '%Registration%')
                ->exists();

            if (!$hasRegFee) {
                $enrollment->financeLedgers()->create([
                    'type' => 'payment',
                    'description' => 'Registration Fee',
                    'amount' => -500.00,
                    'transaction_date' => now(),
                ]);
            }
            
            $enrollment->update(['financial_status' => 'Unpaid']);
            $count++;
        }

        AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'batch_assessment_completed',
            'subject_type' => Enrollment::class,
            'subject_id' => 0,
            'payload' => [
                'grade_level' => $validated['grade_level'],
                'mode' => $validated['mode'],
                'student_count' => $count,
                'message' => "Batch tuition & mandatory fees assessment completed for {$count} students in {$validated['grade_level']} ({$validated['mode']}).",
            ]
        ]);

        return redirect()->back()->with('success', "Successfully assessed tuition and mandatory fees for {$count} students in {$validated['grade_level']} ({$validated['mode']}).");
    }
}
