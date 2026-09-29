<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Learner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use App\Mail\ParentStatementMail;
use App\Mail\ParentReceiptMail;
use App\Models\AuditEvent;
use App\Models\Receipt;
use App\Models\InstallmentPlan;
use App\Mail\ParentInstallmentPlanMail;

class LearnerAccountController extends Controller
{
    /**
     * List all learner accounts with their financial summary.
     */
    public function index(Request $request)
    {
        $search       = $request->query('search');
        $statusFilter = $request->query('status');
        $levelFilter  = $request->query('level');

        $enrollments = Enrollment::activeYear()->with(['learner', 'academicYear'])
            ->withSum('financeLedgers as balance', 'amount')
            ->when($search, function ($query, $search) {
                $query->whereHas('learner', function ($q) use ($search) {
                    $q->where('full_name', 'ilike', "%{$search}%")
                      ->orWhere('lrn',       'ilike', "%{$search}%");
                });
            })
            ->when($statusFilter, fn ($q, $s) => $q->where('financial_status', $s))
            ->when($levelFilter, fn ($q, $l) => $q->where('level', $l))
            ->paginate(13)
            ->withQueryString();

        // Batch resolve statement_sent statuses to eliminate N+1 queries
        $enrollmentIds = $enrollments->pluck('id')->toArray();
        $sentStatements = AuditEvent::query()
            ->where('event_type', 'email_statement_sent')
            ->where('subject_type', Enrollment::class)
            ->whereIn('subject_id', $enrollmentIds)
            ->pluck('subject_id')
            ->toArray();

        $enrollments->through(function ($enrollment) use ($sentStatements) {
            return [
                'id'             => $enrollment->id,
                'learner_name'   => optional($enrollment->learner)->full_name,
                'lrn'            => optional($enrollment->learner)->lrn,
                'mother_email'   => optional($enrollment->learner)->mother_email,
                'father_email'   => optional($enrollment->learner)->father_email,
                'receipt_email'  => optional($enrollment->learner)->receipt_email,
                'grade_level'    => $enrollment->level,
                'academic_year'  => optional($enrollment->academicYear)->name,
                'balance'        => (float) ($enrollment->balance ?? 0),
                'status'         => $enrollment->financial_status,
                'statement_sent' => in_array($enrollment->id, $sentStatements, true),
            ];
        });

        $levels = Enrollment::activeYear()
            ->distinct()
            ->whereNotNull('level')
            ->pluck('level')
            ->filter()
            ->values()
            ->sortBy(fn ($level) => $this->levelSortKey($level))
            ->values()
            ->toArray();

        $pendingRegistrations = \App\Models\AdmissionApplication::query()
            ->whereNull('learner_id')
            ->where(function ($q) {
                $q->where('status', \App\Enums\ApplicationStatus::AwaitingDownpayment->value)
                  ->orWhere('status', 'awaiting_downpayment')
                  ->orWhereNull('status')
                  ->orWhere('status', 'pending');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($app) {
                $first = trim($app->first_name ?? '');
                $middle = trim($app->middle_name ?? '');
                $last = trim($app->last_name ?? '');
                $parts = array_filter([$first, $middle, $last]);
                $fullName = count($parts) > 0 ? implode(' ', $parts) : ($app->full_name ?: "Applicant #{$app->id}");

                $classificationStr = (string) (is_object($app->classification) ? $app->classification->value : $app->classification);
                $isReturning = in_array(strtolower(trim($classificationStr)), ['returning', 'returning student'], true);
                $prevBal = (float) $app->previous_balance;

                return [
                    'id' => $app->id,
                    'full_name' => $fullName,
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => $app->email,
                    'contact_number' => $app->contact_number,
                    'level_applied_for' => $app->level_applied_for,
                    'classification' => $classificationStr,
                    'is_returning' => $isReturning,
                    'previous_balance' => $prevBal,
                    'status' => is_object($app->status) ? $app->status->value : $app->status,
                    'created_at' => $app->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('LearnerAccounts/Index', [
            'enrollments' => $enrollments,
            'pendingRegistrations' => $pendingRegistrations,
            'levels'      => $levels,
            'filters'     => $request->only(['search', 'status', 'level']),
        ]);
    }

    public function settleApplicationRegistration(Request $request, \App\Models\AdmissionApplication $application)
    {
        $validated = $request->validate([
            'receipt_no' => 'nullable|string|max:100',
        ]);

        $receiptNo = !empty($validated['receipt_no']) ? $validated['receipt_no'] : 'OR-' . date('Ymd') . '-' . rand(1000, 9999);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($application, $receiptNo) {
            // Lock the application so a double-click or retry cannot record the downpayment twice.
            $application = \App\Models\AdmissionApplication::query()->whereKey($application->id)->lockForUpdate()->firstOrFail();
            if (!empty($application->metadata['registration_settled'])) {
                return redirect()->back()->withErrors([
                    'receipt_no' => 'This application\'s registration has already been settled (Receipt #' . ($application->metadata['downpayment_receipt_no'] ?? 'n/a') . ').',
                ]);
            }

            $classVal =is_object($application->classification) ? $application->classification->value : (string) $application->classification;

            // 1. Find or create Learner
            $normalizedName = preg_replace('/\s+/', ' ', trim(preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($application->full_name))));
            $learner = null;
            if ($application->learner_id) {
                $learner = Learner::find($application->learner_id);
            }
            if (!$learner) {
                $learner = Learner::where('normalized_name', $normalizedName)->first();
            }
            if (!$learner) {
                $learner = Learner::create([
                    'full_name' => $application->full_name,
                    'normalized_name' => $normalizedName,
                    'birth_date' => $application->date_of_birth,
                    'mother_contact_number' => $application->contact_number,
                    'mother_email' => $application->email,
                    'metadata' => [
                        'enrollment_type' => $classVal,
                        'date_admitted' => now()->toDateString(),
                        'contact_preferences' => [
                            'primary_email' => $application->email,
                            'primary_mobile' => $application->contact_number,
                        ],
                        'academic' => [
                            'program' => $application->metadata['program'] ?? 'Regular',
                        ]
                    ],
                ]);
            }

            // 2. Find or create Enrollment
            $enrollment = Enrollment::where('academic_year_id', $application->academic_year_id)
                ->where('learner_id', $learner->id)
                ->first();

            if (!$enrollment) {
                $enrollment = Enrollment::create([
                    'academic_year_id' => $application->academic_year_id,
                    'learner_id' => $learner->id,
                    'level' => $application->level_applied_for,
                    'session' => $application->metadata['session'] ?? 'Morning',
                    'status' => 'enrolled',
                    'financial_status' => 'Partially Paid',
                    'registration_settled' => true,
                    'registration_settled_at' => now(),
                    'registration_settled_by' => auth()->id(),
                    'downpayment_verified_at' => now(),
                    'downpayment_receipt_no' => $receiptNo,
                    'session_slot_reserved' => true,
                    'capacity_waitlisted' => false,
                    'enrolled_on' => now(),
                    'metadata' => [],
                ]);
            } else {
                $enrollment->update([
                    'status' => 'enrolled',
                    'registration_settled' => true,
                    'registration_settled_at' => now(),
                    'registration_settled_by' => auth()->id(),
                    'downpayment_verified_at' => now(),
                    'downpayment_receipt_no' => $receiptNo,
                    'enrolled_on' => now(),
                ]);
            }

            // An existing enrollment may already have its downpayment recorded (e.g. via Mark Registration Settled).
            $hasRegPayment = $enrollment->financeLedgers()->where('type', 'payment')->where('description', 'like', '%Registration%')->exists();
            if ($hasRegPayment) {
                // Throw (not return) so the enrollment changes above are rolled back too.
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'receipt_no' => 'The registration downpayment for this learner is already recorded on their account.',
                ]);
            }

            // 3. Post Finance Ledger charge & payment for Registration Fee (₱500 / AED 500 equivalent)
            $regCharge = $enrollment->financeLedgers()->where('type', 'charge')->where('description', 'like', '%Registration Fee%')->first();
            if (!$regCharge) {
                $enrollment->financeLedgers()->create([
                    'type' => 'charge',
                    'description' => 'Registration Fee',
                    'amount' => 500.00,
                    'transaction_date' => now(),
                ]);
            }

            $payment = \App\Models\Payment::create([
                'enrollment_id' => $enrollment->id,
                'amount' => 500.00,
                'payment_method' => 'Cash',
                'reference_number' => $receiptNo,
                'status' => 'completed',
                'transaction_date' => now(),
                'processed_by' => auth()->id(),
                'remarks' => 'Registration Downpayment (Automatic Enrollment)',
            ]);

            $receipt = Receipt::create([
                'payment_id' => $payment->id,
                'receipt_number' => $receiptNo,
                'issued_date' => now(),
                'notes' => 'Registration Fee Downpayment / Tax Invoice',
            ]);

            $enrollment->financeLedgers()->create([
                'type' => 'payment',
                'description' => 'Registration Fee Settlement (Receipt: ' . $receiptNo . ')',
                'amount' => -500.00,
                'transaction_date' => now(),
            ]);

            // 4. Auto-assess Tuition & Mandatory Fees + Auto-generate 10-Month Installment Plan (inclusive of 5% VAT)
            $this->autoAssessAndCreateInstallmentPlan($enrollment, $application->metadata['mode'] ?? 'face_to_face');

            // 5. Update Application status
            $application->update([
                'learner_id' => $learner->id,
                'status' => \App\Enums\ApplicationStatus::ApprovedForEnrollment->value,
                'metadata' => array_merge($application->metadata ?? [], [
                    'registration_settled' => true,
                    'registration_settled_at' => now()->toDateTimeString(),
                    'registration_settled_by' => auth()->id(),
                    'downpayment_receipt_no' => $receiptNo,
                    'auto_enrolled' => true,
                ]),
            ]);

            // 6. Audit Event
            AuditEvent::create([
                'event_type' => 'registration_settled_and_auto_enrolled',
                'subject_type' => Enrollment::class,
                'subject_id' => $enrollment->id,
                'user_id' => auth()->id(),
                'actor_id' => auth()->id(),
                'metadata' => [
                    'receipt_no' => $receiptNo,
                    'receipt_id' => $receipt->id,
                    'learner_id' => $learner->id,
                    'application_id' => $application->id,
                ],
            ]);

            // 7. Generate Contract PDF & Email if parent email available
            try {
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', ['enrollment' => $enrollment]);
                $pdfData = $pdf->output();
                if (!empty($application->email)) {
                    \Illuminate\Support\Facades\Mail::to($application->email)->send(new \App\Mail\EnrollmentContractMail($enrollment, $pdfData));
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Auto-enroll contract generation/email: " . $e->getMessage());
            }

            return redirect()->back()->with([
                'success' => "Applicant {$application->full_name} is now officially ENROLLED! Registration settled, fees assessed, and 10-Month Installment Plan (inclusive of 5% VAT) generated. (Receipt #{$receiptNo})",
                'receipt_id' => $receipt->id,
                'receipt_url' => route('finance.receipt', $receipt->id),
            ]);
        });
    }

    /**
     * Show the full statement of account for a single enrollment.
     * Delegates to the Finance Show view (same data shape).
     */
    public function show(Enrollment $enrollment)
    {
        $enrollment->load([
            'learner.primaryPhoto',
            'academicYear',
            'financeLedgers' => function ($query) {
                $query->orderBy('transaction_date', 'desc')->orderBy('created_at', 'desc');
            },
            'installmentPlans',
            'receipts',
        ]);

        $balance        = $enrollment->financeLedgers()->sum('amount');
        $totalFees      = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
        $totalPayments  = $enrollment->financeLedgers()->where('type', 'payment')->sum('amount');
        $totalDiscounts = $enrollment->financeLedgers()->where('type', 'discount')->sum('amount');

        $statusLabel = match (true) {
            $totalFees == 0         => 'No Assessment',
            $balance   <= 0         => 'Cleared',
            $totalPayments < 0      => 'Partially Paid',
            default                 => 'Unpaid',
        };

        $receiptIds = $enrollment->receipts->pluck('id');
        $emailedReceiptIds = AuditEvent::query()
            ->where('event_type', 'receipt_email_sent')
            ->where('subject_type', Receipt::class)
            ->whereIn('subject_id', $receiptIds)
            ->pluck('subject_id')
            ->toArray();

        $statementSent = AuditEvent::query()
            ->where('event_type', 'email_statement_sent')
            ->where('subject_type', Enrollment::class)
            ->where('subject_id', $enrollment->id)
            ->exists();

        $latestPlan = $enrollment->installmentPlans->last();
        $installmentEmailed = false;
        if ($latestPlan) {
            $installmentEmailed = AuditEvent::query()
                ->where('event_type', 'installment_plan_email_sent')
                ->where('subject_type', InstallmentPlan::class)
                ->where('subject_id', $latestPlan->id)
                ->exists();
        }

        $pendingPastBalance = (float) \Illuminate\Support\Facades\DB::table('enrollments')
            ->join('finance_ledgers', 'enrollments.id', '=', 'finance_ledgers.enrollment_id')
            ->where('enrollments.learner_id', $enrollment->learner_id)
            ->where('enrollments.id', '!=', $enrollment->id)
            ->sum('finance_ledgers.amount');

        return Inertia::render('LearnerAccounts/Show', [
            'enrollment' => array_merge($enrollment->toArray(), [
                'learner_name'    => optional($enrollment->learner)->full_name,
                'lrn'             => optional($enrollment->learner)->lrn,
                'photo_url'       => $enrollment->learner?->primaryPhoto ? asset('storage/' . $enrollment->learner->primaryPhoto->filename) : null,
                'academic_year'   => optional($enrollment->academicYear)->name,
                'grade_level'     => $enrollment->level,
                'balance'         => $balance,
                'total_fees'      => $totalFees,
                'total_payments'  => abs($totalPayments),
                'total_discounts' => abs($totalDiscounts),
                'financial_status'=> $statusLabel,
                'ledgers'         => $enrollment->financeLedgers,
                'installment_plans'=> $enrollment->installmentPlans,
                'receipts'        => $enrollment->receipts,
                'receipt_email'   => optional($enrollment->learner)->receipt_email,
            ]),
            'emailedReceiptIds' => $emailedReceiptIds,
            'statementSent' => $statementSent,
            'installmentEmailed' => $installmentEmailed,
            'pendingPastBalance' => $pendingPastBalance,
            'activePlanInstallments' => $latestPlan ? $this->calculateInstallmentStatus($latestPlan) : null,
        ]);
    }

    /* ── Ledger actions (reuse Finance logic via delegation) ── */

    public function storePayment(Request $request, Enrollment $enrollment)
    {
        return app(FinanceController::class)->storePayment($request, $enrollment);
    }

    public function storeDiscount(Request $request, Enrollment $enrollment)
    {
        return app(FinanceController::class)->storeDiscount($request, $enrollment);
    }

    public function storeCharge(Request $request, Enrollment $enrollment)
    {
        return app(FinanceController::class)->storeCharge($request, $enrollment);
    }

    public function storeRefund(Request $request, Enrollment $enrollment)
    {
        return app(FinanceController::class)->storeRefund($request, $enrollment);
    }

    public function storeInstallmentPlan(Request $request, Enrollment $enrollment)
    {
        return app(FinanceController::class)->storeInstallmentPlan($request, $enrollment);
    }

    public static function normalizeLevel(?string $level): string
    {
        $level = trim((string) $level);
        if (preg_match('/^(?:grade|gr|g|group)\s*0*([0-9]+)$/i', $level, $m)) {
            return 'G' . (int) $m[1];
        }
        if (preg_match('/^(?:level|lvl|l)\s*0*([0-9]+)$/i', $level, $m)) {
            return 'L' . (int) $m[1];
        }
        if (preg_match('/^0*([0-9]+)$/', $level, $m)) {
            return 'G' . (int) $m[1];
        }
        return strtoupper($level);
    }

    /**
     * Auto-assesses the tuition & mandatory fees and auto-generates a 10-month installment plan
     * (all fees and monthly installment amounts are inclusive of 5% VAT).
     */
    public function autoAssessAndCreateInstallmentPlan(Enrollment $enrollment, ?string $mode = null)
    {
        $mode = $mode ?: ($enrollment->mode ?: 'face_to_face');
        if ($enrollment->mode !== $mode) {
            $enrollment->update(['mode' => $mode]);
        }

        $normLevel = self::normalizeLevel($enrollment->level);
        $rawLevel  = $enrollment->level;

        // 1. Find GradeLevelFee for this level & mode (base tuition inclusive of 5% VAT)
        $gradeLevelFee = \App\Models\GradeLevelFee::where(function ($q) use ($normLevel, $rawLevel) {
                $q->where('grade_level', $normLevel)->orWhere('grade_level', $rawLevel);
            })
            ->where('mode', $mode)
            ->first();

        // 2. Find mandatory active FeeStructures (inclusive of 5% VAT, excluding registration type)
        $fees = \App\Models\FeeStructure::where('is_active', true)
            ->where(function ($q) use ($normLevel, $rawLevel) {
                $q->whereNull('level')
                  ->orWhere('level', $normLevel)
                  ->orWhere('level', $rawLevel);
            })
            ->where('is_optional', false)
            ->where('type', '!=', 'registration')
            ->where('name', 'not like', '%Registration%')
            ->get();

        \DB::transaction(function () use ($enrollment, $gradeLevelFee, $fees) {
            // Check if Tuition Fee is already assessed
            $hasTuition = $enrollment->financeLedgers()
                ->where('type', 'charge')
                ->where('description', 'like', '%Tuition%')
                ->exists();

            if (!$hasTuition) {
                // --- CARRY FORWARD LOGIC ---
                // Both legs are 'transfer' entries: they move a balance between years without
                // counting as new billing, a discount or cash collected.
                $pastEnrollments = Enrollment::where('learner_id', $enrollment->learner_id)
                    ->where('id', '!=', $enrollment->id)
                    ->get();

                $totalArrears = 0;
                $totalCredits = 0;
                foreach ($pastEnrollments as $past) {
                    $pastBalance = (float) $past->financeLedgers()->sum('amount');
                    if ($pastBalance > 0.001) {
                        $totalArrears += $pastBalance;
                        $past->financeLedgers()->create([
                            'type' => 'transfer',
                            'description' => 'Balance transferred to new Academic Year',
                            'amount' => -$pastBalance,
                            'transaction_date' => now(),
                        ]);
                        $past->update(['financial_status' => 'Cleared']);
                    } elseif ($pastBalance < -0.001) {
                        $absCredit = abs($pastBalance);
                        $totalCredits += $absCredit;
                        $past->financeLedgers()->create([
                            'type' => 'transfer',
                            'description' => 'Credit balance transferred to new Academic Year',
                            'amount' => $absCredit,
                            'transaction_date' => now(),
                        ]);
                        $past->update(['financial_status' => 'Cleared']);
                    }
                }

                if ($totalArrears > 0) {
                    $enrollment->financeLedgers()->create([
                        'type' => 'transfer',
                        'description' => 'Previous Year Arrears Forwarded',
                        'amount' => $totalArrears,
                        'transaction_date' => now(),
                    ]);
                }

                if ($totalCredits > 0) {
                    $enrollment->financeLedgers()->create([
                        'type' => 'transfer',
                        'description' => 'Previous Year Credit Balance Forwarded',
                        'amount' => -$totalCredits,
                        'transaction_date' => now(),
                    ]);
                }

                // Assess base tuition + 5% VAT (Total Tuition is inclusive of 5% VAT)
                if ($gradeLevelFee) {
                    $totalTuition = (float) $gradeLevelFee->base_tuition;
                    $basePrice = round($totalTuition / 1.05, 2);
                    $vatAmount = round($totalTuition - $basePrice, 2);

                    $enrollment->financeLedgers()->create([
                        'type' => 'charge',
                        'description' => 'Tuition Fee',
                        'amount' => $basePrice,
                        'transaction_date' => now(),
                    ]);

                    if ($vatAmount > 0) {
                        $enrollment->financeLedgers()->create([
                            'type' => 'tax',
                            'description' => 'UAE VAT (5%) on Tuition Fee',
                            'amount' => $vatAmount,
                            'transaction_date' => now(),
                        ]);
                    }
                }

                // Assess other mandatory fees (inclusive of 5% VAT)
                foreach ($fees as $fee) {
                    $feeAmount = abs((float) $fee->amount);
                    if ($feeAmount > 0) {
                        $feeExists = $enrollment->financeLedgers()
                            ->where('type', 'charge')
                            ->where('description', $fee->name)
                            ->exists();

                        if (!$feeExists) {
                            $enrollment->financeLedgers()->create([
                                'type' => 'charge',
                                'description' => $fee->name,
                                'amount' => $feeAmount,
                                'transaction_date' => now(),
                            ]);
                        }
                    }
                }
            }

            // 3. Auto-generate / Sync 10-Month Installment Plan (Inclusive of 5% VAT)
            $currentBalance = (float) $enrollment->financeLedgers()->sum('amount');
            $existingPlan = $enrollment->installmentPlans()->latest()->first();

            if ($currentBalance > 0) {
                $totalMonths = 10;
                $monthlyAmount = round($currentBalance / $totalMonths, 2);
                $startDate = now()->toDateString();

                if (!$existingPlan) {
                    $enrollment->installmentPlans()->create([
                        'total_months' => $totalMonths,
                        'monthly_amount' => $monthlyAmount,
                        'start_date' => $startDate,
                    ]);

                    AuditEvent::query()->create([
                        'actor_id' => auth()->id(),
                        'event_type' => 'installment_plan_created',
                        'subject_type' => Enrollment::class,
                        'subject_id' => $enrollment->id,
                        'before' => null,
                        'after' => [
                            'total_months' => $totalMonths,
                            'monthly_amount' => $monthlyAmount,
                            'start_date' => $startDate,
                        ],
                        'metadata' => [
                            'learner_name' => optional($enrollment->learner)->full_name,
                            'message' => 'Auto-generated 10-Month Installment Plan (AED ' . number_format($monthlyAmount, 2) . '/month, inclusive of 5% VAT)',
                        ],
                    ]);
                } else {
                    $existingPlan->update([
                        'total_months' => $totalMonths,
                        'monthly_amount' => $monthlyAmount,
                    ]);
                }
            }
        });

        app(FinanceController::class)->updateFinancialStatus($enrollment);
    }

    public function assessTuition(Request $request, Enrollment $enrollment)
    {
        $mode = $request->input('mode', $enrollment->mode ?? 'face_to_face');

        if ($mode && $mode !== $enrollment->mode) {
            $enrollment->update(['mode' => $mode]);
        }

        $this->autoAssessAndCreateInstallmentPlan($enrollment, $mode);

        return redirect()->back()->with('success', 'Student tuition and mandatory fees assessed successfully, and 10-Month Installment Plan (inclusive of 5% VAT) generated.');
    }

    public function updateLedger(Request $request, Enrollment $enrollment, \App\Models\FinanceLedger $ledger)
    {
        if ($ledger->enrollment_id !== $enrollment->id) {
            abort(403, 'Unauthorized ledger entry.');
        }

        if ($ledger->type === 'payment') {
            return redirect()->back()->withErrors([
                'amount' => 'Payment entries cannot be edited. Issue a refund to correct a payment.',
            ]);
        }

        if ($ledger->type === 'transfer') {
            return redirect()->back()->withErrors([
                'amount' => 'Balance transfers between academic years cannot be edited.',
            ]);
        }

        $request->validate([
            'transaction_date' => 'required|date',
            'description'      => 'required|string|max:255',
            'amount'           => 'required|numeric',
        ]);

        // Keep the sign correct depending on original ledger type:
        $amount = floatval($request->amount);
        $isNegativeType = in_array($ledger->type, ['payment', 'discount']);
        if ($isNegativeType && $amount > 0) {
            $amount = -$amount;
        } elseif (!$isNegativeType && $amount < 0) {
            $amount = -$amount;
        }

        $before = $ledger->only(['type', 'description', 'amount', 'transaction_date']);

        $ledger->update([
            'transaction_date' => $request->transaction_date,
            'description'      => $request->description,
            'amount'           => $amount,
        ]);

        \App\Models\AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'ledger_updated',
            'subject_type' => \App\Models\FinanceLedger::class,
            'subject_id' => $ledger->id,
            'before' => $before,
            'after' => $ledger->only(['type', 'description', 'amount', 'transaction_date']),
            'metadata' => [
                'enrollment_id' => $enrollment->id,
                'learner_name' => optional($enrollment->learner)->full_name,
            ],
        ]);

        app(FinanceController::class)->updateFinancialStatus($enrollment);

        return redirect()->back()->with('success', 'Ledger entry updated successfully.');
    }

    public function destroyLedger(Enrollment $enrollment, \App\Models\FinanceLedger $ledger)
    {
        if ($ledger->enrollment_id !== $enrollment->id) {
            abort(403, 'Unauthorized ledger entry.');
        }

        if ($ledger->type === 'payment') {
            return redirect()->back()->withErrors([
                'amount' => 'Payment entries cannot be deleted. Issue a refund to reverse a payment.',
            ]);
        }

        if ($ledger->type === 'transfer') {
            return redirect()->back()->withErrors([
                'amount' => 'Balance transfers between academic years cannot be deleted.',
            ]);
        }

        $before = $ledger->only(['type', 'description', 'amount', 'transaction_date']);
        $ledger->delete();

        \App\Models\AuditEvent::query()->create([
            'actor_id' => auth()->id(),
            'event_type' => 'ledger_deleted',
            'subject_type' => \App\Models\FinanceLedger::class,
            'subject_id' => $ledger->id,
            'before' => $before,
            'after' => null,
            'metadata' => [
                'enrollment_id' => $enrollment->id,
                'learner_name' => optional($enrollment->learner)->full_name,
            ],
        ]);

        app(FinanceController::class)->updateFinancialStatus($enrollment);

        return redirect()->back()->with('success', 'Ledger entry deleted successfully.');
    }

    /**
     * Finance staff can set a dedicated receipt/statement email on the learner.
     */
    public function updateReceiptEmail(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'receipt_email' => 'nullable|email|max:255',
        ]);

        $enrollment->learner->update([
            'receipt_email' => $validated['receipt_email'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Receipt email address updated successfully.');
    }

    public function emailStatement(Request $request, Enrollment $enrollment)
    {
        $learner = $enrollment->learner;

        // Prefer the finance-assigned receipt_email; fall back to parent emails
        $emails = $learner->receipt_email
            ? [$learner->receipt_email]
            : collect([$learner->mother_email, $learner->father_email])->filter()->unique()->all();

        if (empty($emails)) {
            return redirect()->back()->withErrors([
                'email' => 'No email address configured for this student. Please add a receipt email or parent contact details.'
            ]);
        }

        // Calculate totals for statement
        $balance        = $enrollment->financeLedgers()->sum('amount');
        $totalFees      = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
        $totalPayments  = $enrollment->financeLedgers()->where('type', 'payment')->sum('amount');
        $totalDiscounts = $enrollment->financeLedgers()->where('type', 'discount')->sum('amount');

        try {
            // Send Email
            Mail::to($emails)->send(new ParentStatementMail(
                $enrollment,
                $totalFees,
                $totalPayments,
                $totalDiscounts,
                $balance
            ));
        } catch (\Throwable $e) {
            \Log::error('Failed to send statement email: ' . $e->getMessage());
            return redirect()->back()->withErrors([
                'email' => 'Mail delivery service unreachable (' . $e->getMessage() . '). Statement generated, but email could not be delivered.'
            ]);
        }

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => $request->user()?->id,
            'event_type' => 'email_statement_sent',
            'subject_type' => Enrollment::class,
            'subject_id' => $enrollment->id,
            'before' => null,
            'after' => null,
            'metadata' => [
                'learner_name' => $learner->full_name,
                'sent_to' => implode(', ', $emails),
                'message' => 'Statement of Account emailed to parent(s): ' . implode(', ', $emails),
            ],
        ]);

        return redirect()->back()->with('success', 'Statement of Account emailed successfully to: ' . implode(', ', $emails));
    }

    private function getPhotoBase64(Learner $learner): ?string
    {
        $photo = $learner?->primaryPhoto;
        if ($photo && file_exists(storage_path('app/public/' . $photo->filename))) {
            $path = storage_path('app/public/' . $photo->filename);
            $type = pathinfo($path, PATHINFO_EXTENSION);
            $data = file_get_contents($path);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }
        return null;
    }

    public function printStatement(Request $request, Enrollment $enrollment)
    {
        $learner = $enrollment->learner;

        // Calculate totals for statement
        $balance        = $enrollment->financeLedgers()->sum('amount');
        $totalFees      = $enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');
        $totalPayments  = $enrollment->financeLedgers()->where('type', 'payment')->sum('amount');
        $totalDiscounts = $enrollment->financeLedgers()->where('type', 'discount')->sum('amount');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.statement', [
            'enrollment' => $enrollment,
            'totalFees' => $totalFees,
            'totalPayments' => $totalPayments,
            'totalDiscounts' => $totalDiscounts,
            'balance' => $balance,
            'photoBase64' => $this->getPhotoBase64($learner),
        ]);

        return $pdf->stream('Statement_of_Account_' . str_replace(' ', '_', $learner->full_name) . '.pdf');
    }

    public function emailReceipt(Request $request, Receipt $receipt)
    {
        $receipt->load(['payment.enrollment.learner', 'payment.enrollment.academicYear']);
        $enrollment = $receipt->payment->enrollment;
        $learner = $enrollment->learner;

        // Prefer the finance-assigned receipt_email; fall back to parent emails
        $emails = $learner->receipt_email
            ? [$learner->receipt_email]
            : collect([$learner->mother_email, $learner->father_email])->filter()->unique()->all();

        if (empty($emails)) {
            return redirect()->back()->withErrors([
                'email' => 'No email address configured for this student. Please add a receipt email or parent contact details.'
            ]);
        }

        // Calculate the current balance (from student ledgers)
        $balance = $enrollment->financeLedgers()->sum('amount');

        try {
            // Send Email
            Mail::to($emails)->send(new ParentReceiptMail($receipt, $balance));
        } catch (\Throwable $e) {
            \Log::error('Failed to send receipt email: ' . $e->getMessage());
            return redirect()->back()->withErrors([
                'email' => 'Mail delivery service unreachable (' . $e->getMessage() . '). Receipt generated, but email could not be delivered.'
            ]);
        }

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => $request->user()?->id,
            'event_type' => 'receipt_email_sent',
            'subject_type' => Receipt::class,
            'subject_id' => $receipt->id,
            'before' => null,
            'after' => null,
            'metadata' => [
                'receipt_number' => $receipt->receipt_number,
                'learner_name' => $learner->full_name,
                'sent_to' => implode(', ', $emails),
                'message' => 'Payment receipt #' . $receipt->receipt_number . ' emailed to parent(s): ' . implode(', ', $emails),
            ],
        ]);

        return redirect()->back()->with('success', 'Receipt emailed successfully to: ' . implode(', ', $emails));
    }

    public function showInstallmentPlan(InstallmentPlan $plan)
    {
        $plan->load([
            'enrollment.learner',
            'enrollment.academicYear',
            'enrollment.section'
        ]);

        $totalFees = $plan->enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');

        return Inertia::render('Finance/InstallmentPlan', [
            'plan' => array_merge($plan->toArray(), [
                'learner_name' => $plan->enrollment->learner->full_name,
                'lrn'          => $plan->enrollment->learner->lrn,
                'grade_level'  => $plan->enrollment->level,
                'section'      => $plan->enrollment->section?->name,
                'academic_year'=> $plan->enrollment->academicYear->name,
                'enrollment_id'=> $plan->enrollment_id,
            ]),
            'totalAmount' => $totalFees,
            'installments' => $this->calculateInstallmentStatus($plan),
        ]);
    }

    public function printInstallmentPlan(InstallmentPlan $plan)
    {
        $plan->load(['enrollment.learner', 'enrollment.academicYear', 'enrollment.section']);
        $totalFees = $plan->enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.installment_plan', [
            'plan' => $plan,
            'totalAmount' => $totalFees,
            'installments' => $this->calculateInstallmentStatus($plan),
            'photoBase64' => $this->getPhotoBase64($plan->enrollment->learner),
        ]);

        return $pdf->stream('Installment_Plan_' . str_replace(' ', '_', $plan->enrollment->learner->full_name) . '.pdf');
    }

    public function emailInstallmentPlan(Request $request, InstallmentPlan $plan)
    {
        $plan->load(['enrollment.learner', 'enrollment.academicYear']);
        $learner = $plan->enrollment->learner;

        // Prefer the finance-assigned receipt_email; fall back to parent emails
        $emails = [];
        if ($learner->receipt_email) {
            $emails[] = $learner->receipt_email;
        } elseif ($learner->mother_email) {
            $emails[] = $learner->mother_email;
        } elseif ($learner->father_email) {
            $emails[] = $learner->father_email;
        }

        if (empty($emails)) {
            return redirect()->back()->with('error', 'No email address configured for this learner or parents.');
        }

        $totalFees = $plan->enrollment->financeLedgers()->whereIn('type', ['charge', 'tax'])->sum('amount');

        try {
            // Send Email
            Mail::to($emails)->send(new ParentInstallmentPlanMail($plan, $totalFees));
        } catch (\Throwable $e) {
            \Log::error('Failed to send installment plan email: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Mail delivery service unreachable (' . $e->getMessage() . '). Agreement saved, but email could not be delivered.');
        }

        // Log Audit Event
        AuditEvent::query()->create([
            'actor_id' => $request->user()?->id,
            'event_type' => 'installment_plan_email_sent',
            'subject_type' => InstallmentPlan::class,
            'subject_id' => $plan->id,
            'before' => null,
            'after' => null,
            'metadata' => [
                'learner_name' => $learner->full_name,
                'sent_to' => implode(', ', $emails),
                'message' => 'Installment Plan Agreement emailed to parent(s): ' . implode(', ', $emails),
            ],
        ]);

        return redirect()->back()->with('success', 'Installment plan emailed successfully to: ' . implode(', ', $emails));
    }

    public function calculateInstallmentStatus(InstallmentPlan $plan)
    {
        $startDate = \Carbon\Carbon::parse($plan->start_date);
        $monthlyAmount = (float) $plan->monthly_amount;
        $totalMonths = (int) $plan->total_months;
        
        // Match payments against the 10 monthly installments (excluding initial registration downpayment)
        $payments = $plan->enrollment->financeLedgers()
            ->where('type', 'payment')
            ->where('description', 'not like', '%Registration%')
            ->orderBy('transaction_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($ledger) {
                return [
                    'amount' => abs((float) $ledger->amount),
                    'date' => \Carbon\Carbon::parse($ledger->transaction_date),
                ];
            })->toArray();
            
        $installments = [];
        $totalPaymentsSum = array_sum(array_column($payments, 'amount'));
        
        for ($i = 1; $i <= $totalMonths; $i++) {
            $dueDate = $startDate->copy()->addMonths($i - 1);
            $targetAmount = $monthlyAmount * $i;
            
            $status = 'pending';
            $paidDate = null;
            
            if ($totalPaymentsSum >= ($targetAmount - 0.01)) {
                $sum = 0;
                $completedPayDate = null;
                foreach ($payments as $pay) {
                    $sum += $pay['amount'];
                    if ($sum >= ($targetAmount - 0.01)) {
                        $completedPayDate = $pay['date'];
                        break;
                    }
                }
                
                $paidDate = $completedPayDate ? $completedPayDate->toDateString() : null;
                
                if ($completedPayDate && $completedPayDate->startOfDay()->lte($dueDate->startOfDay())) {
                    $status = 'paid_on_time';
                } else {
                    $status = 'paid_delayed';
                }
                $amountPaidForThis = $monthlyAmount;
            } else {
                $allocatedPaid = max(0, $totalPaymentsSum - ($monthlyAmount * ($i - 1)));
                $amountPaidForThis = min($monthlyAmount, $allocatedPaid);
                
                if ($dueDate->startOfDay()->lt(now()->startOfDay())) {
                    $status = 'overdue';
                } else {
                    $status = 'pending';
                }
            }
            
            $installments[] = [
                'month_index' => $i,
                'due_date' => $dueDate->toDateString(),
                'amount' => $monthlyAmount,
                'amount_paid' => $amountPaidForThis,
                'status' => $status,
                'paid_date' => $paidDate,
            ];
        }
        
        return $installments;
    }

    private function levelSortKey(?string $level): string
    {
        $normalized = strtoupper(trim((string) $level));
        $compact = preg_replace('/[^A-Z0-9]+/', '', $normalized) ?? '';

        if (preg_match('/^(?:L|LEVEL)0*([0-9]+)/', $compact, $matches) === 1) {
            return sprintf('001-%02d-%s', (int) $matches[1], $compact);
        }

        if (preg_match('/^(?:G|GR|GRP|GROUP|GRADE)0*([0-9]+)/', $compact, $matches) === 1) {
            return sprintf('002-%02d-%s', (int) $matches[1], $compact);
        }

        if (preg_match('/^0*([0-9]+)/', $compact, $matches) === 1) {
            return sprintf('003-%02d-%s', (int) $matches[1], $compact);
        }

        return '999-'.$compact;
    }

    public function toggleMode(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'mode' => 'required|string|in:face_to_face,online',
        ]);

        $enrollment->update(['mode' => $validated['mode']]);

        return redirect()->back()->with('success', 'Study mode updated successfully.');
    }

    public function markRegistrationSettled(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'receipt_no' => 'nullable|string|max:100',
        ]);

        $receiptNo = !empty($validated['receipt_no']) ? $validated['receipt_no'] : 'REG-SETTLED-' . rand(1000, 9999);

        $error = \DB::transaction(function () use ($enrollment, $receiptNo) {
            // Lock the enrollment so a double-click or retry cannot record the downpayment twice.
            $locked = Enrollment::query()->whereKey($enrollment->id)->lockForUpdate()->first();
            $regPayment = $enrollment->financeLedgers()->where('type', 'payment')->where('description', 'like', '%Registration%')->first();
            if ($locked->registration_settled) {
                return 'Registration for this learner is already settled' . ($locked->downpayment_receipt_no ? ' (Receipt #' . $locked->downpayment_receipt_no . ')' : '') . '.';
            }

            // Ensure registration fee charge & payment exist
            $regCharge = $enrollment->financeLedgers()->where('type', 'charge')->where('description', 'like', '%Registration Fee%')->first();
            if (!$regCharge) {
                $enrollment->financeLedgers()->create([
                    'type' => 'charge',
                    'description' => 'Registration Fee',
                    'amount' => 500.00,
                    'transaction_date' => now(),
                ]);
            }

            if (!$regPayment) {
                $payment = \App\Models\Payment::create([
                    'enrollment_id' => $enrollment->id,
                    'amount' => 500.00,
                    'payment_method' => 'Cash',
                    'reference_number' => $receiptNo,
                    'status' => 'completed',
                    'transaction_date' => now(),
                    'processed_by' => auth()->id(),
                    'remarks' => 'Registration Downpayment Settlement',
                ]);

                \App\Models\Receipt::create([
                    'payment_id' => $payment->id,
                    'receipt_number' => $receiptNo,
                    'issued_date' => now(),
                    'notes' => 'Registration Fee Downpayment / Tax Invoice',
                ]);

                $enrollment->financeLedgers()->create([
                    'type' => 'payment',
                    'description' => 'Registration Fee Settlement (Receipt: ' . $receiptNo . ')',
                    'amount' => -500.00,
                    'transaction_date' => now(),
                ]);
            }

            $enrollment->update([
                'registration_settled' => true,
                'registration_settled_at' => now(),
                'registration_settled_by' => auth()->id(),
                'downpayment_verified_at' => now(),
                'downpayment_receipt_no' => $receiptNo,
                'status' => 'enrolled',
            ]);

            AuditEvent::create([
                'event_type' => 'registration_settled',
                'subject_type' => Enrollment::class,
                'subject_id' => $enrollment->id,
                'user_id' => auth()->id(),
                'actor_id' => auth()->id(),
                'metadata' => [
                    'receipt_no' => $receiptNo,
                    'settled_at' => now()->toDateTimeString(),
                ],
            ]);

            return null;
        });

        if ($error) {
            return redirect()->back()->withErrors(['receipt_no' => $error]);
        }

        // Auto-assess tuition & mandatory fees and generate 10-month installment plan
        $this->autoAssessAndCreateInstallmentPlan($enrollment);

        return redirect()->back()->with('success', 'Registration marked as Settled & Approved! Student is now enrolled, fees assessed, and 10-Month Installment Plan (inclusive of 5% VAT) generated.');
    }
}
