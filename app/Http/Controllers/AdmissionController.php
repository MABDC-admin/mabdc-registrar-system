<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationClassification;
use App\Enums\ApplicationStatus;
use App\Models\AcademicYear;
use App\Models\AdmissionApplication;
use App\Models\Learner;
use App\Models\Enrollment;
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
            ->get();

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

    public function updateStatus(Request $request, AdmissionApplication $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', \Illuminate\Validation\Rule::enum(\App\Enums\ApplicationStatus::class)],
        ]);

        $application->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back();
    }

    public function enroll(Request $request, AdmissionApplication $application): RedirectResponse
    {
        if ($application->learner_id) {
            return redirect()->back()->with('error', 'Applicant is already enrolled.');
        }

        // Strict Gate: Check if Finance has marked Registration as Settled / Approved
        $existingEnrollment = Enrollment::where('academic_year_id', $application->academic_year_id)
            ->whereHas('learner', fn ($q) => $q->where('normalized_name', preg_replace('/\s+/', ' ', trim(preg_replace('/[^A-Z0-9]+/', ' ', strtoupper($application->full_name))))))
            ->first();

        $statusVal = is_object($application->status) ? $application->status->value : (string) $application->status;
        $classVal  = is_object($application->classification) ? $application->classification->value : (string) $application->classification;

        // Check if application is marked as registration settled
        $isSettled = ($statusVal === 'registration_settled' || $statusVal === 'approved_for_enrollment' || ($existingEnrollment && $existingEnrollment->registration_settled));

        if (!$isSettled) {
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
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', ['enrollment' => $enrollment]);
        $pdfData = $pdf->output();

        // 2. Auto-send Email to Parent if email is present
        if (!empty($application->email)) {
            try {
                \Illuminate\Support\Facades\Mail::to($application->email)->send(new \App\Mail\EnrollmentContractMail($enrollment, $pdfData));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed sending enrollment contract email: " . $e->getMessage());
            }
        }

        // 3. Auto-send Telegram Bot Alert
        \App\Services\TelegramService::sendEnrollmentNotification($enrollment);

        return redirect()->route('learners.show', $learner->id)->with('success', 'Learner successfully admitted & enrolled! Contract PDF generated, parent emailed, and Telegram notification sent.');
    }

    public function downloadContract(Enrollment $enrollment)
    {
        $enrollment->load(['learner', 'academicYear']);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.contract', ['enrollment' => $enrollment]);
        return $pdf->download("MABDC_Contract_{$enrollment->learner_id}.pdf");
    }
}
