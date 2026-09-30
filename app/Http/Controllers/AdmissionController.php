<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationClassification;
use App\Enums\ApplicationStatus;
use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\Learner;
use App\Models\Enrollment;
use App\Models\Receipt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);

        $applications = AdmissionApplication::query()
            ->when($activeYear, fn ($q) => $q->where('academic_year_id', $activeYear->id))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($app) use ($activeYear) {
                $first = trim($app->first_name ?? '');
                $middle = trim($app->middle_name ?? '');
                $last = trim($app->last_name ?? '');
                $parts = array_filter([$first, $middle, $last]);
                $fullName = count($parts) > 0 ? implode(' ', $parts) : ($app->full_name ?: "Applicant #{$app->id}");

                $enrollment = null;
                $receipt = null;

                if ($app->learner_id && $activeYear) {
                    $enrollment = Enrollment::where('learner_id', $app->learner_id)
                        ->where('academic_year_id', $activeYear->id)
                        ->with('receipts')
                        ->first();

                    if ($enrollment) {
                        $receipt = $enrollment->receipts->sortByDesc('id')->first();
                    }
                }

                $meta = $app->metadata ?? [];
                $receiptNo = $meta['downpayment_receipt_no'] ?? ($receipt ? $receipt->receipt_number : null);

                $statusVal = is_object($app->status) ? $app->status->value : (string) $app->status;

                return [
                    'id' => $app->id,
                    'uuid' => $app->uuid ?? (string) $app->id,
                    'full_name' => $fullName,
                    'first_name' => $first,
                    'last_name' => $last,
                    'middle_name' => $middle,
                    'date_of_birth' => $app->date_of_birth ? (is_string($app->date_of_birth) ? $app->date_of_birth : $app->date_of_birth->toDateString()) : null,
                    'email' => $app->email,
                    'contact_number' => $app->contact_number,
                    'level_applied_for' => $app->level_applied_for,
                    'classification' => is_object($app->classification) ? $app->classification->value : (string) $app->classification,
                    'status' => $statusVal,
                    'created_at' => $app->created_at?->toDateTimeString(),
                    'learner_id' => $app->learner_id,
                    'enrollment_id' => $enrollment ? $enrollment->id : null,
                    'receipt_id' => $receipt ? $receipt->id : null,
                    'receipt_no' => $receiptNo,
                    'is_enrolled' => ($statusVal === 'enrolled' || $app->learner_id !== null),
                ];
            });

        $statuses = collect(ApplicationStatus::cases())->map(fn ($status) => [
            'value' => $status->value,
            'label' => $status->label(),
        ]);

        return Inertia::render('Admissions/Index', [
            'activeYear' => $activeYear,
            'applications' => $applications,
            'statuses' => $statuses,
        ]);
    }

    public function create(): Response
    {
        $activeYear = AcademicYear::query()
            ->where('is_active', true)
            ->first(['id', 'name']);

        $classifications = collect(ApplicationClassification::cases())->map(fn ($classification) => [
            'value' => $classification->value,
            'label' => $classification->label(),
        ]);

        return Inertia::render('Admissions/Create', [
            'activeYear' => $activeYear,
            'classifications' => $classifications,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'level_applied_for' => ['required', 'string', 'max:50'],
            'classification' => ['required', 'string'],
        ]);

        AdmissionApplication::create([
            'academic_year_id' => $validated['academic_year_id'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'],
            'date_of_birth' => $validated['date_of_birth'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'],
            'level_applied_for' => $validated['level_applied_for'],
            'classification' => $validated['classification'],
            'status' => ApplicationStatus::AwaitingDownpayment->value,
        ]);

        return redirect()->route('admissions.index')->with('success', 'Student registered successfully! Applicant must now proceed to Finance for ₱500 Downpayment settlement.');
    }

    public function update(Request $request, AdmissionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date'],
            'email' => ['nullable', 'email', 'max:255'],
            'contact_number' => ['required', 'string', 'max:20'],
            'level_applied_for' => ['required', 'string', 'max:50'],
            'classification' => ['required', 'string'],
            'status' => ['nullable', 'string'],
        ]);

        $application->update($validated);

        return redirect()->back()->with('success', "Application #{$application->id} updated successfully.");
    }

    public function destroy(AdmissionApplication $application): RedirectResponse
    {
        $name = $application->full_name;
        $application->delete();

        return redirect()->back()->with('success', "Application for '{$name}' was deleted successfully.");
    }

    public function updateStatus(Request $request, AdmissionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string'],
        ]);

        $application->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Application status updated.');
    }

    public function enroll(Request $request, AdmissionApplication $application): RedirectResponse
    {
        if ($application->learner_id) {
            return redirect()->back()->with('error', 'Applicant is already enrolled.');
        }

        // Check if Finance has marked Registration as Settled / Approved
        $existingEnrollment = Enrollment::where('academic_year_id', $application->academic_year_id)
            ->whereHas('learner', fn ($q) => $q->where('normalized_name', preg_replace('/\s+/', ' ', trim(preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($application->full_name))))))
            ->first();

        $statusVal = is_object($application->status) ? $application->status->value : (string) $application->status;
        $classVal  = is_object($application->classification) ? $application->classification->value : (string) $application->classification;

        $isSettled = ($statusVal === 'registration_settled' || $statusVal === 'approved_for_enrollment' || ($existingEnrollment && $existingEnrollment->registration_settled));

        if (!$isSettled && auth()->user()->role !== 'admin') {
            return redirect()->back()->with('error', 'Cannot admit learner. Finance must first mark Registration as Settled / Approved before Registrar can proceed with Admission.');
        }

        // Capacity Check (Max 25 per level/session)
        $session = $request->input('session', 'Morning');
        $enrolledCount = Enrollment::where('academic_year_id', $application->academic_year_id)
            ->where('level', $application->level_applied_for)
            ->where(fn ($q) => $q->where('session', $session)->orWhereNull('session'))
            ->whereIn('status', ['enrolled', 'admitted'])
            ->count();

        $isWaitlisted = ($enrolledCount >= 25);

        $learner = Learner::create([
            'full_name' => $application->full_name,
            'normalized_name' => preg_replace('/\s+/', ' ', trim(preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($application->full_name)))),
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

        $enrollment = Enrollment::create([
            'academic_year_id' => $application->academic_year_id,
            'learner_id' => $learner->id,
            'level' => $application->level_applied_for,
            'session' => $session,
            'status' => 'enrolled',
            'registration_settled' => true,
            'registration_settled_at' => now(),
            'session_slot_reserved' => !$isWaitlisted,
            'capacity_waitlisted' => $isWaitlisted,
            'enrolled_on' => now(),
            'metadata' => [],
        ]);

        $application->update([
            'learner_id' => $learner->id,
            'status' => 'enrolled',
        ]);

        // 1. Generate Contract PDF (Dual copies: Parent & School)
        try {
            $defaultContract = $this->getDefaultContractData($enrollment);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', [
                'enrollment' => $enrollment,
                'contract' => $defaultContract,
            ]);
            $pdfData = $pdf->output();

            // 2. Auto-send Email to Parent if email is present
            if (!empty($application->email)) {
                \Illuminate\Support\Facades\Mail::to($application->email)->send(new \App\Mail\EnrollmentContractMail($enrollment, $pdfData));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed sending enrollment contract email: " . $e->getMessage());
        }

        return redirect()->route('learners.show', $learner->id)->with('success', 'Learner successfully admitted & officially enrolled! Contract PDF generated.');
    }

    public function getDefaultContractData(Enrollment $enrollment): array
    {
        $learner = $enrollment->learner;
        $academicYear = $enrollment->academicYear;
        $parentName = $learner?->mother_maiden_name ?: ($learner?->father_name ?: 'Parent / Guardian');
        $contactPhone = $learner?->mother_contact_number ?: ($learner?->father_contact_number ?: '');
        $contactEmail = $learner?->mother_email ?: ($learner?->father_email ?: '');
        $downpaymentDate = $enrollment->downpayment_verified_at ? $enrollment->downpayment_verified_at->format('F d, Y h:i A') : now()->format('F d, Y');
        $receiptNo = $enrollment->downpayment_receipt_no ?? 'REG-SETTLED';

        return [
            'school_name' => 'Mahardika Al-Islamia Basic Education Center',
            'contract_title' => 'Official Student Enrollment Contract & Agreement',
            'academic_year' => $academicYear?->name ?? '2026-2027',
            'learner_name' => strtoupper($learner?->full_name ?? ''),
            'lrn' => $learner?->lrn ?? 'N/A',
            'level' => $enrollment->level ?? '',
            'session' => $enrollment->session ?? 'Morning',
            'parent_name' => $parentName,
            'contact_phone' => $contactPhone,
            'contact_email' => $contactEmail,
            'downpayment_amount' => '₱500.00',
            'downpayment_remarks' => 'VAT 5% inclusive credit applied to 10-Month Schedule',
            'receipt_no' => $receiptNo,
            'verified_date' => $downpaymentDate,
            'clauses' => [
                [
                    'title' => 'Enrollment Commitment',
                    'body' => "The parent/guardian agrees to the official enrollment of the student at MABDC for Academic Year " . ($academicYear?->name ?? '2026-2027') . ".",
                ],
                [
                    'title' => 'Tuition & Billing',
                    'body' => "Tuition fees are structured across a 10-month payment schedule with 5% UAE VAT inclusive. The ₱500 advance downpayment is fully credited toward the student's tuition balance.",
                ],
                [
                    'title' => 'Session Capacity',
                    'body' => "The student is assigned to a reserved session slot capped at a maximum of 25 learners per session.",
                ],
                [
                    'title' => 'Rules & Compliance',
                    'body' => "The student and parent agree to abide by all academic standards, code of conduct, and regulations enforced by MABDC.",
                ],
            ],
            'special_provisions' => '',
            'parent_sig_label' => 'Parent / Guardian Signature over Printed Name',
            'school_sig_label' => 'School Registrar Authorized Signature',
            'school_signatory_name' => 'Office of the Registrar',
            'date_signed' => date('F d, Y'),
        ];
    }

    public function editContract(Enrollment $enrollment): Response
    {
        $enrollment->load(['learner', 'academicYear', 'section']);
        
        $savedContract = $enrollment->metadata['contract'] ?? [];
        $defaultContract = $this->getDefaultContractData($enrollment);
        $contract = array_merge($defaultContract, $savedContract);

        return Inertia::render('Admissions/ContractEdit', [
            'enrollment' => $enrollment,
            'contract' => $contract,
        ]);
    }

    public function updateContract(Request $request, Enrollment $enrollment)
    {
        $validated = $request->validate([
            'contract' => ['required', 'array'],
            'contract.school_name' => ['required', 'string', 'max:255'],
            'contract.contract_title' => ['required', 'string', 'max:255'],
            'contract.academic_year' => ['nullable', 'string', 'max:255'],
            'contract.learner_name' => ['required', 'string', 'max:255'],
            'contract.lrn' => ['nullable', 'string', 'max:50'],
            'contract.level' => ['required', 'string', 'max:50'],
            'contract.session' => ['nullable', 'string', 'max:50'],
            'contract.parent_name' => ['nullable', 'string', 'max:255'],
            'contract.contact_phone' => ['nullable', 'string', 'max:50'],
            'contract.contact_email' => ['nullable', 'string', 'max:255'],
            'contract.downpayment_amount' => ['nullable', 'string', 'max:100'],
            'contract.downpayment_remarks' => ['nullable', 'string', 'max:500'],
            'contract.receipt_no' => ['nullable', 'string', 'max:100'],
            'contract.verified_date' => ['nullable', 'string', 'max:100'],
            'contract.clauses' => ['nullable', 'array'],
            'contract.special_provisions' => ['nullable', 'string'],
            'contract.parent_sig_label' => ['nullable', 'string', 'max:255'],
            'contract.school_sig_label' => ['nullable', 'string', 'max:255'],
            'contract.school_signatory_name' => ['nullable', 'string', 'max:255'],
            'contract.date_signed' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string'],
        ]);

        $meta = $enrollment->metadata ?? [];
        $meta['contract'] = $validated['contract'];
        $enrollment->update(['metadata' => $meta]);

        if ($request->input('action') === 'download') {
            return $this->downloadContract($enrollment);
        }

        return redirect()->back()->with('success', 'Enrollment Contract customized & updated successfully!');
    }

    public function downloadContract(Enrollment $enrollment)
    {
        $enrollment->load(['learner', 'academicYear']);
        $savedContract = $enrollment->metadata['contract'] ?? [];
        $defaultContract = $this->getDefaultContractData($enrollment);
        $contract = array_merge($defaultContract, $savedContract);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', [
            'enrollment' => $enrollment,
            'contract' => $contract,
        ]);
        
        $filename = 'MABDC_Contract_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $contract['learner_name']) . '.pdf';
        return $pdf->download($filename);
    }

    public function previewContract(Enrollment $enrollment)
    {
        $enrollment->load(['learner', 'academicYear']);
        $savedContract = $enrollment->metadata['contract'] ?? [];
        $defaultContract = $this->getDefaultContractData($enrollment);
        $contract = array_merge($defaultContract, $savedContract);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', [
            'enrollment' => $enrollment,
            'contract' => $contract,
        ]);

        $filename = 'MABDC_Contract_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $contract['learner_name']) . '.pdf';
        return $pdf->stream($filename);
    }
}
