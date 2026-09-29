# MABDC Registrar & Finance System — Backend Code Wiki & Architecture Reference

> **Document Classification**: Technical Architecture & Backend Specification  
> **Scope**: Backend Subsystems (Registrar & Finance), Database Schema, Data Models, Controllers, Enums, Business Logic, Access Control, Security, and Services. *(UI components excluded by specification).*

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema & Data Models](#2-database-schema--data-models)
3. [Core Enums & Domain Types](#3-core-enums--domain-types)
4. [Registrar Subsystem Backend](#4-registrar-subsystem-backend)
   - [4.1 Admissions Pipeline & Application Lifecycle](#41-admissions-pipeline--application-lifecycle)
   - [4.2 Student & Household Management](#42-student--household-management)
   - [4.3 Enrollments, Sections & Capacity Tracking](#43-enrollments-sections--capacity-tracking)
   - [4.4 Academic Records, Attendance & Grading](#44-academic-records-attendance--grading)
   - [4.5 Transfers, Withdrawals & Certificate Generation](#45-transfers-withdrawals--certificate-generation)
   - [4.6 Teacher Management & Secure Onboarding](#46-teacher-management--secure-onboarding)
5. [Finance Subsystem Backend](#5-finance-subsystem-backend)
   - [5.1 Financial Ledger Architecture & Immutability](#51-financial-ledger-architecture--immutability)
   - [5.2 Learner Accounts & Cashier Operations](#52-learner-accounts--cashier-operations)
   - [5.3 Fee Structures, Assessments & Dynamic Matrices](#53-fee-structures-assessments--dynamic-matrices)
   - [5.4 Installment Plans, Payments & Official Receipts](#54-installment-plans-payments--official-receipts)
   - [5.5 Financial Reporting & Arrears Analytics](#55-financial-reporting--arrears-analytics)
   - [5.6 Automated Communications & PDF Engine](#56-automated-communications--pdf-engine)
6. [Cross-Cutting Security & Access Control](#6-cross-cutting-security--access-control)
   - [6.1 Role-Based Access Control (RBAC) & Module Permissions](#61-role-based-access-control-rbac--module-permissions)
   - [6.2 Audit Trail & Change Logging](#62-audit-trail--change-logging)
   - [6.3 External API Services & Transports](#63-external-api-services--transports)
7. [Complete Route & Endpoint Reference Matrix](#7-complete-route--endpoint-reference-matrix)

---

## 1. System Architecture Overview

The **MABDC Registrar & Finance System** is built on the Laravel framework (PHP 8.4+ / PostgreSQL 16). It operates as a modular, monolithic service powering two distinct administrative domains:
1. **Registrar Domain**: Manages the complete student lifecycle from pre-admission, document vetting, class scheduling, and grading, to promotions, transfers, and official certifications.
2. **Finance Domain**: Manages fee structures, tuition assessment, installment schedules, cashier point-of-sale collections, refund processing, accounts receivable, and automated financial statements.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HTTP Request Pipeline                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Routing (routes/web.php) ──► Auth & RBAC Middleware (EnsureModuleEnabled)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌──────────────────────────┐            ┌──────────────────────────┐
    │   Registrar Subsystem    │            │    Finance Subsystem     │
    ├──────────────────────────┤            ├──────────────────────────┤
    │ - AdmissionController    │            │ - FinanceController      │
    │ - LearnerController      │            │ - LearnerAccountCtrl     │
    │ - HouseholdController    │            │ - FeeStructureController │
    │ - SectionController      │            │ - FinanceReportCtrl      │
    │ - EnrollmentController   │            │ - MabdcApiTransport      │
    │ - TeacherProfileCtrl     │            │ - Transaction Locks      │
    └────────────┬─────────────┘            └────────────┬─────────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │   PostgreSQL 16 Data Storage    │
                    │ - Transactions & Row Locking    │
                    │ - Immutable Financial Ledgers   │
                    │ - Audit Event Delta Snapshots   │
                    └─────────────────────────────────┘
```

---

## 2. Database Schema & Data Models

### 2.1 Core Entities & Relationships

| Model | Table | Primary Key | Key Foreign Keys | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `User` | `users` | `id` (bigint) | — | System authentication, roles (`admin`, `registrar`, `finance`, `user`). |
| `TeacherProfile` | `teacher_profiles` | `id` (bigint) | `user_id` | Extended profile metadata, assigned classes, and credentials for faculty. |
| `Household` | `households` | `id` (bigint) | — | Groups related siblings and shared parent billing contacts. |
| `Learner` | `learners` | `id` (bigint) | `household_id` | Master student identity, LRN, UAE/PH addresses, normalized search tokens. |
| `LearnerPhoto` | `learner_photos` | `id` (bigint) | `learner_id` | Image assets for student records with `primary_flag`. |
| `AcademicYear` | `academic_years` | `id` (bigint) | — | School year definitions (e.g., `2026-2027`), active year singleton flag. |
| `Section` | `sections` | `id` (bigint) | `academic_year_id`, `adviser_id` | Classroom sections, session times, room allocations, capacity limits. |
| `AdmissionApplication` | `admission_applications` | `id` (bigint) | `academic_year_id`, `learner_id` | Pre-enrollment applications, status state machine, balance lookups. |
| `Enrollment` | `enrollments` | `id` (bigint) | `academic_year_id`, `learner_id`, `section_id`, `registration_settled_by` | Official student enrollment per academic term, financial & session status. |
| `DocumentRequirement` | `document_requirements` | `id` (bigint) | `enrollment_id` | Checklist and status (`submitted`, `missing`, etc.) of DepEd/school docs. |
| `Grade` | `grades` | `id` (bigint) | `enrollment_id` | Quarter/term academic grades per subject. |
| `Attendance` | `attendances` | `id` (bigint) | `enrollment_id` | Daily or monthly attendance logs (`present`, `absent`, `late`, `excused`). |
| `FinanceLedger` | `finance_ledgers` | `id` (bigint) | `enrollment_id` | Double-entry-style immutable transaction ledger (`charge`, `payment`, `refund`, `discount`). |
| `InstallmentPlan` | `installment_plans` | `id` (bigint) | `enrollment_id` | Scheduled payment breakdowns, due dates, installment status. |
| `Payment` | `payments` | `id` (bigint) | `enrollment_id`, `installment_plan_id`, `received_by` | Raw cashier payment record. |
| `Receipt` | `receipts` | `id` (bigint) | `payment_id`, `enrollment_id` | Generated Official Receipt (OR) document record with sequential OR numbers. |
| `FeeStructure` | `fee_structures` | `id` (bigint) | `academic_year_id` | Base fee definitions (tuition, laboratory, miscellaneous, grad fee). |
| `GradeLevelFee` | `grade_level_fees` | `id` (bigint) | `academic_year_id` | Fee breakdown matrix per grade level and study mode (`Regular`, `Online`, `Hybrid`). |
| `Discount` | `discounts` | `id` (bigint) | `enrollment_id` | Sibling, academic, or hardship tuition discounts. |
| `AuditEvent` | `audit_events` | `id` (bigint) | `actor_id`, polymorphic `subject_type`/`subject_id` | Detailed mutation audit trail with JSON `before`/`after` snapshots. |
| `RoleModulePermission` | `role_module_permissions`| `id` (bigint) | — | Dynamic RBAC matrix mapping roles to accessible system modules. |

---

## 3. Core Enums & Domain Types

### 3.1 `ApplicationStatus` (`App\Enums\ApplicationStatus`)
Represents the strict lifecycle state machine of an admission application:
- `submitted` — Initial online/walk-in submission.
- `under_review` — Document verification by registrar staff.
- `entrance_exam_scheduled` — Scheduled for academic entrance test.
- `entrance_exam_passed` / `entrance_exam_failed` — Assessment outcomes.
- `interview_scheduled` / `interview_completed` — Guidance/Principal interview status.
- `approved_for_enrollment` — Fully vetted; ready for registration settlement & contract.
- `enrolled` — Transformed into an active `Enrollment` record.
- `rejected` / `waitlisted` / `cancelled` — Terminal or holding states.

### 3.2 `ApplicationClassification` (`App\Enums\ApplicationClassification`)
- `NEW` — First-time student entering the institution.
- `RETURNING` — Former student returning for a new school year; triggers previous arrears check.
- `TRANSFEREE` — Student transferring from another school mid-year or between levels.

### 3.3 `EnrollmentStatus` (`App\Enums\EnrollmentStatus`)
- `pending` — Awaiting registration fee settlement or downpayment confirmation.
- `enrolled` — Officially matriculated student with assigned class section and active ledger.
- `waitlisted` — Awaiting section capacity vacancy.
- `dropped` / `transferred` / `graduated` — Concluded enrollment states.

---

## 4. Registrar Subsystem Backend

### 4.1 Admissions Pipeline & Application Lifecycle

```
               ┌───────────────────────┐
               │   Application Created │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │     Under Review      │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │ Approved for Enrolment│
               └───────────┬───────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
  [Settle ₱500 Registration]    [Direct Admission & Contract]
            │                             │
            ▼                             ▼
  ┌───────────────────┐         ┌───────────────────┐
  │ Active Enrollment │◄────────┤ Contract Generated│
  │  & Ledger Created │         │  (Official Status)│
  └───────────────────┘         └───────────────────┘
```

#### Key Logic in `AdmissionController`:
1. **Status Transition Validation**:
   Status updates validate strictly against `ApplicationStatus` enum values (`Rule::enum(ApplicationStatus::class)`).
2. **PHP 8.1+ Enum Object Unwrapping**:
   All status comparisons safely unwrap enum instances before evaluation:
   ```php
   $statusVal = is_object($application->status) ? $application->status->value : (string) $application->status;
   if ($statusVal === ApplicationStatus::APPROVED_FOR_ENROLLMENT->value) { ... }
   ```
3. **Returning Student Balance Lookup (`AdmissionApplication::getPreviousBalanceAttribute`)**:
   When an applicant is processed, the system automatically checks for prior unpaid arrears across historical academic years:
   ```php
   $learnerIds = Learner::query()
       ->where('normalized_name', 'like', "%{$nameClean}%")
       ->orWhere('mother_email', $email)
       ->orWhere('father_email', $email)
       ->orWhere('receipt_email', $email)
       ->orWhere('mother_contact_number', $contactNumber)
       ->orWhere('father_contact_number', $contactNumber)
       ->pluck('id');

   $previousEnrollments = Enrollment::whereIn('learner_id', $learnerIds)
       ->withSum('financeLedgers as balance', 'amount')
       ->get();
   ```
4. **Admission to Enrollment Conversion (`AdmissionController::enroll`)**:
   - Converts the approved application into an active `Enrollment`.
   - Links or creates the `Learner` master profile.
   - Populates standard DepEd `DocumentRequirement` checklists.
   - Generates the formal Enrollment Contract PDF.

---

### 4.2 Student & Household Management

#### 1. Identity Normalization (`App\Actions\Registrar\NormalizeStudentRow`):
Standardizes naming conventions to prevent duplicate learner creation during Excel imports and manual registration:
- Strips accents, punctuation, and non-alphanumeric noise.
- Normalizes uppercase full names (`"SOTTO, DENNIS JR."` -> `"DENNIS SOTTO JR"`).

#### 2. Household & Sibling Linkage (`HouseholdController`):
- Groups siblings under a unified `Household` record.
- Allows the finance cashier to send consolidated billing statements to a shared `receipt_email`.
- Calculates multi-child discount eligibility.

---

### 4.3 Enrollments, Sections & Capacity Tracking

#### 1. Section Allocation & Capacity Rules:
- `SectionController` validates maximum student caps per section (`max_capacity`).
- When a section reaches capacity, subsequent enrollments are flagged with `capacity_waitlisted = true`.

#### 2. Student Promotions (`PromotionController`):
- Executes batch promotion from Grade Level $N \to N+1$ upon academic year rollover.
- Carries forward academic records and creates unassigned enrollments for the new active school year.

---

### 4.4 Academic Records, Attendance & Grading

- **`AcademicRecordController`**: Aggregates multi-year transcripts, general averages, and Form 137 / SF10 records.
- **`AttendanceController`**: Records daily/monthly presence, lates, and unexcused absences.
- **`BehaviorController` / `HealthRecordController`**: Tracks disciplinary infractions, medical history, immunizations, and clinic visits.

---

### 4.5 Transfers, Withdrawals & Certificate Generation

- **`TransferWithdrawalController`**: Handles student clearance workflows, release of Form 138 (Report Card), Certificate of Good Moral Character, and honorable dismissal.
- **`CertificateController`**: Generates high-resolution PDF certificates of Enrollment, Completion, Graduation, and Good Moral Character using dynamic Blade templates.

---

### 4.6 Teacher Management & Secure Onboarding

- **`TeacherProfileController`**: Manages faculty records, advisory section assignments, and subject teacher mappings.
- **Random Password Generation**:
  New teacher accounts are initialized with a cryptographically secure random password (`Str::random(16)`), triggering an onboarding password-reset email to verify faculty identity securely.

---

## 5. Finance Subsystem Backend

```
                                  Finance Ledger Architecture
                                 ─────────────────────────────
                ┌─────────────────────────────────────────────────────────────┐
                │                        Enrollment                           │
                └──────────────────────────────┬──────────────────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
           ┌───────────────────────────┐                 ┌───────────────────────────┐
           │     Charges & Debits      │                 │     Credits & Payments    │
           ├───────────────────────────┤                 ├───────────────────────────┤
           │ • charge (Tuition, Lab)   │                 │ • payment (Cash, Card)    │
           │ • tax (VAT, Surcharges)   │                 │ • discount (Scholarship)  │
           │                           │                 │ • refund (Disbursement)   │
           └───────────────────────────┘                 └───────────────────────────┘
```

### 5.1 Financial Ledger Architecture & Immutability

The system implements an accounting ledger (`FinanceLedger`) associated with an `Enrollment`.

$$\text{Outstanding Balance} = \sum(\text{charge} + \text{tax}) - \sum\text{payment} - \sum\text{discount} - \sum\text{refund}$$

#### Immutability & Audit Safeguards:
1. **Payments Cannot Be Edited or Deleted**: Direct modification or deletion of payment rows is strictly forbidden in the controllers:
   ```php
   if ($ledger->type === 'payment') {
       return back()->with('error', 'Payment ledger entries cannot be edited or deleted. Please issue a refund to correct.');
   }
   ```
2. **Audit Logging**: Any update or deletion of charges/discounts automatically logs an `AuditEvent` with pre- and post-mutation payloads.

---

### 5.2 Learner Accounts & Cashier Operations

#### 1. Concurrency Protection & Transaction Row Locking (`LearnerAccountController`):
To prevent race conditions where concurrent payment requests overpay or bypass balances, payments acquire a pessimistic row lock (`lockForUpdate()`):
```php
DB::transaction(function () use ($enrollment, $request) {
    $locked = Enrollment::where('id', $enrollment->id)->lockForUpdate()->first();
    
    // Balance recalculation inside lock
    $outstanding = FinanceLedger::where('enrollment_id', $locked->id)->sum('amount');
    
    // Payment execution & ledger entry creation
    ...
});
```

#### 2. Registration Fee Settlement (`settleApplicationRegistration` / `markRegistrationSettled`):
- Records ₱500 / AED registration fee payment.
- Marks `registration_settled = true`, `registration_settled_at = now()`, `registration_settled_by = auth()->id()`.
- Unblocks the applicant in the Admissions pipeline for final contract generation.

---

### 5.3 Fee Structures, Assessments & Dynamic Matrices

- **`FeeStructureController`**: Defines standard tuition rates, miscellaneous fees, and mode-based multipliers (`Regular`, `Online`, `Hybrid`).
- **Tuition Assessment Engine (`assessTuition`)**:
  Calculates tuition based on grade-level matrix (`GradeLevelFee`), creates corresponding `charge` ledger entries, and updates `financial_status` (`Unpaid`, `Partially Paid`, `Cleared`).
- **Validation Caps**:
  - **Refunds**: Capped strictly at $\text{Total Paid} - \text{Prior Refunds}$.
  - **Discounts**: Capped strictly at the current outstanding balance.

---

### 5.4 Installment Plans, Payments & Official Receipts

- **`InstallmentPlan` Generation**: Divides assessed balance into structured milestone terms (e.g., Downpayment, Term 1, Term 2, Term 3, Monthly).
- **Official Receipt Generation (`Receipt`)**:
  - Assigns unique, sequential Official Receipt Numbers (OR #).
  - Captures payment breakdown, payment method (Cash, Bank Transfer, POS, Online), cashier user ID, and timestamp.

---

### 5.5 Financial Reporting & Arrears Analytics

`FinanceReportController` & `FinanceController::index` generate real-time KPIs:
- **Total Billed**: $\sum(\text{charge} + \text{tax})$.
- **Total Collected**: $\sum(\text{payment})$.
- **Collection Efficiency**: $(\text{Total Collected} / \text{Total Billed}) \times 100\%$.
- **Outstanding Arrears & Aging Debtors**: Grouped by grade level and individual learner.
- **Exportable PDF Reports**: Outstanding Balances Report & Daily Cashier Collections Summary.

---

### 5.6 Automated Communications & PDF Engine

- **PDF Generation**: Powered by Laravel DomPDF / Blade views:
  - `resources/views/pdf/statement.blade.php` — Statement of Account (SOA).
  - `resources/views/pdf/receipt.blade.php` — Official Receipt (OR).
  - `resources/views/pdf/installment_plan.blade.php` — Installment Agreement.
  - `resources/views/pdf/contract.blade.php` — Enrollment Contract.
- **Email Delivery**:
  - `ParentStatementMail`, `ParentReceiptMail`, `ParentInstallmentPlanMail`, `EnrollmentContractMail`.
  - Dispatches PDFs directly as email attachments to `learner.receipt_email` or parent emails.

---

## 6. Cross-Cutting Security & Access Control

### 6.1 Role-Based Access Control (RBAC) & Module Permissions

The application implements a dual-layer security model:
1. **User Role Layer**: `User::$role` (`admin`, `registrar`, `finance`, `user`).
2. **Dynamic Module Layer (`RoleModulePermission` & `EnsureModuleEnabled` Middleware)**:
   - Grants granular toggles per module key (`admission`, `enrollment`, `finance`, `learner_accounts`, `student_management`, etc.).

```php
// Enforced in routes/web.php
Route::post('/learner-accounts/{enrollment}/payment', [LearnerAccountController::class, 'storePayment'])
    ->middleware('module:learner_accounts');
```

```php
// Write-route security checks prevent unauthorized privilege escalation
Route::patch('/admissions/{application}/status', [AdmissionController::class, 'updateStatus'])
    ->middleware('module:admission');
```

---

### 6.2 Audit Trail & Change Logging

The `AuditEvent` model captures detailed operational history:
- `actor_id` — ID of the authenticated user performing the action.
- `event_type` — `create`, `update`, `delete`, `status_change`, `payment_received`, `refund_issued`.
- `subject_type` / `subject_id` — Polymorphic target (e.g., `App\Models\FinanceLedger`, `App\Models\Learner`).
- `before` / `after` — JSON snapshots capturing exact mutated fields.

---

### 6.3 External API Services & Transports

- **`App\Mail\Transport\MabdcApiTransport`**: Custom Symfony Mailer transport for school-specific HTTP email API integration.
- **`App\Services\TelegramService`**: Sends operational alerts (critical errors, payment logs, admissions count) to staff Telegram channels.
- **`App\Services\OpenRouterService`**: Provides backend AI assistant capabilities for text formatting and summarization.

---

## 7. Complete Route & Endpoint Reference Matrix

### 7.1 Registrar & Student Management Endpoints

| HTTP Verb | URI Pattern | Action / Controller | Middleware Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/admissions` | `AdmissionController@index` | `auth`, `role:registrar,admin,finance` |
| `GET` | `/admissions/create` | `AdmissionController@create` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/admissions` | `AdmissionController@store` | `auth`, `module:admission` |
| `PATCH` | `/admissions/{application}/status` | `AdmissionController@updateStatus` | `auth`, `module:admission` |
| `POST` | `/admissions/{application}/enroll` | `AdmissionController@enroll` | `auth`, `module:admission` |
| `GET` | `/enrollments` | `EnrollmentController` | `auth`, `module:enrollment` |
| `GET` | `/enrollments/{enrollment}/contract`| `AdmissionController@downloadContract`| `auth`, `role:registrar,admin,finance` |
| `GET` | `/learners` | `LearnerController@index` | `auth`, `role:registrar,admin,finance` |
| `GET` | `/learners/{learner}` | `LearnerController@show` | `auth`, `role:registrar,admin,finance` |
| `GET` | `/learners/{learner}/edit` | `LearnerController@edit` | `auth`, `role:registrar,admin,finance` |
| `PATCH` | `/learners/{learner}` | `LearnerController@update` | `auth`, `module:student_management` |
| `PATCH` | `/learners/{learner}/disable` | `LearnerController@disable` | `auth`, `module:student_management` |
| `DELETE` | `/learners/{learner}` | `LearnerController@destroy` | `auth`, `module:student_management` |
| `GET` | `/households` | `HouseholdController@index` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/households` | `HouseholdController@store` | `auth`, `module:student_management` |
| `POST` | `/households/{household}/link` | `HouseholdController@linkLearner` | `auth`, `module:student_management` |
| `DELETE`| `/households/{household}/unlink/{learner}` | `HouseholdController@unlinkLearner` | `auth`, `module:student_management` |
| `GET` | `/classes` | `SectionController@index` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/classes` | `SectionController@store` | `auth`, `module:class_section` |
| `PATCH` | `/classes/{section}` | `SectionController@update` | `auth`, `module:class_section` |
| `POST` | `/classes/{section}/assign` | `SectionController@assign` | `auth`, `module:class_section` |
| `POST` | `/classes/{section}/unassign` | `SectionController@unassign` | `auth`, `module:class_section` |
| `GET` | `/promotions` | `PromotionController@index` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/promotions` | `PromotionController@store` | `auth`, `module:enrollment` |
| `GET` | `/attendance` | `AttendanceController@index` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/attendance` | `AttendanceController@store` | `auth`, `module:attendance` |
| `GET` | `/transfers` | `TransferWithdrawalController@index` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/transfers` | `TransferWithdrawalController@store` | `auth`, `module:transfer_withdrawal` |
| `GET` | `/certificates` | `CertificateController@index` | `auth`, `role:registrar,admin,finance` |
| `GET` | `/certificates/generate` | `CertificateController@generate` | `auth`, `role:registrar,admin,finance` |
| `GET` | `/teachers` | `TeacherProfileController@index` | `auth`, `role:registrar,admin,finance` |

---

### 7.2 Finance & Cashier Endpoints

| HTTP Verb | URI Pattern | Action / Controller | Middleware Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/finance` | `FinanceController@index` | `auth`, `module:finance` |
| `GET` | `/finance/show/{enrollment}` | `FinanceController@show` | `auth`, `module:finance` |
| `POST` | `/finance/{enrollment}/charge` | `FinanceController@storeCharge` | `auth`, `module:finance` |
| `POST` | `/finance/{enrollment}/payment` | `FinanceController@storePayment` | `auth`, `module:finance` |
| `POST` | `/finance/{enrollment}/discount` | `FinanceController@storeDiscount` | `auth`, `module:finance` |
| `POST` | `/finance/{enrollment}/refund` | `FinanceController@storeRefund` | `auth`, `module:finance` |
| `POST` | `/finance/{enrollment}/installment` | `FinanceController@storeInstallmentPlan` | `auth`, `module:finance` |
| `GET` | `/receipts/{receipt}` | `FinanceController@showReceipt` | `auth`, `module:finance` |
| `POST` | `/receipts/{receipt}/email` | `LearnerAccountController@emailReceipt` | `auth`, `module:finance` |
| `GET` | `/learner-accounts` | `LearnerAccountController@index` | `auth`, `module:learner_accounts` |
| `GET` | `/learner-accounts/{enrollment}` | `LearnerAccountController@show` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/payment` | `LearnerAccountController@storePayment` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/charge` | `LearnerAccountController@storeCharge` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/discount`| `LearnerAccountController@storeDiscount`| `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/refund` | `LearnerAccountController@storeRefund` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/assess-tuition` | `LearnerAccountController@assessTuition` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/installment-plan` | `LearnerAccountController@storeInstallmentPlan` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/email-statement` | `LearnerAccountController@emailStatement` | `auth`, `module:learner_accounts` |
| `GET` | `/learner-accounts/{enrollment}/print-statement` | `LearnerAccountController@printStatement` | `auth`, `module:learner_accounts` |
| `PATCH` | `/learner-accounts/{enrollment}/update-receipt-email` | `LearnerAccountController@updateReceiptEmail` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/{enrollment}/mark-registration-settled` | `LearnerAccountController@markRegistrationSettled` | `auth`, `module:learner_accounts` |
| `POST` | `/learner-accounts/applications/{application}/settle` | `LearnerAccountController@settleApplicationRegistration` | `auth`, `module:learner_accounts` |
| `PUT` | `/learner-accounts/{enrollment}/ledgers/{ledger}` | `LearnerAccountController@updateLedger` | `auth`, `module:learner_accounts` |
| `DELETE`| `/learner-accounts/{enrollment}/ledgers/{ledger}` | `LearnerAccountController@destroyLedger` | `auth`, `module:learner_accounts` |
| `GET` | `/finance/fees` | `FeeStructureController@index` | `auth`, `module:finance` |
| `POST` | `/finance/fees` | `FeeStructureController@store` | `auth`, `module:finance` |
| `PATCH` | `/finance/fees/{feeStructure}` | `FeeStructureController@update` | `auth`, `module:finance` |
| `DELETE`| `/finance/fees/{fee}` | `FeeStructureController@destroy` | `auth`, `module:finance` |
| `GET` | `/finance/reports` | `FinanceReportController@index` | `auth`, `module:finance` |
| `GET` | `/finance/reports/export-outstanding` | `FinanceReportController@exportOutstandingPdf` | `auth`, `module:finance` |
| `GET` | `/finance/reports/export-collections` | `FinanceReportController@exportCollectionsPdf` | `auth`, `module:finance` |

---

### 7.3 Administration & System Endpoints

| HTTP Verb | URI Pattern | Action / Controller | Middleware Protection |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | `DashboardController` | `auth`, `verified`, `role:registrar,admin,finance` |
| `GET` | `/audit-trail` | `AuditTrailController@index` | `auth`, `module:audit_trail` |
| `GET` | `/users` | `UserManagementController@index` | `auth`, `role:admin` |
| `PATCH` | `/users/{user}/role` | `UserManagementController@updateRole` | `auth`, `role:admin` |
| `PATCH` | `/roles/{role}/modules/{moduleKey}` | `UserManagementController@updateModulePermission` | `auth`, `role:admin` |
| `GET` | `/roles` | `RoleController@index` | `auth`, `role:admin` |
| `POST` | `/roles` | `RoleController@store` | `auth`, `role:admin` |
| `PUT` | `/roles/{role}` | `RoleController@update` | `auth`, `role:admin` |
| `DELETE`| `/roles/{role}` | `RoleController@destroy` | `auth`, `role:admin` |
| `GET` | `/academic-years` | `AcademicYearController@index` | `auth`, `role:registrar,admin,finance` |
| `POST` | `/academic-years` | `AcademicYearController@store` | `auth`, `role:admin` |
| `PATCH` | `/academic-years/{academicYear}` | `AcademicYearController@update` | `auth`, `role:admin` |
| `POST` | `/academic-years/{academicYear}/activate` | `AcademicYearController@activate` | `auth`, `role:admin` |
