# MABDC Registrar & Finance System - Implementation & Architecture Handbook

> [!IMPORTANT]
> **Notice for AI Agents & Developers**: This handbook serves as the authoritative technical specification and workflow guide for the **MABDC Registrar & Finance System**. All business logic, database relationships, gate checks, and automated integrations detailed herein MUST be preserved during any future maintenance or feature extensions.

---

## 1. System Overview & Tech Stack

The MABDC Registrar & Finance System is an integrated web application powering student admissions, cashier registration settlements, academic enrollments, contract generation, parent communications, and financial ledgers.

### Core Technology Stack:
- **Framework**: Laravel 11 (PHP 8.4 runtime)
- **Frontend Bridge**: Inertia.js 2.0 (Single Page Application UX without client API overhead)
- **UI Framework**: React JS (TypeScript) + Tailwind CSS
- **Database Engine**: PostgreSQL 16
- **PDF Engine**: Barryvdh DomPDF (`resources/views/pdf/contract.blade.php`)
- **Automations**: Laravel Mailables (`EnrollmentContractMail`) & Telegram Bot API (`TelegramService`)

---

## 2. Strict Role Permissions & Module Boundaries

The application uses role-based module scoping defined in `app/Support/RegistrarModules.php` and enforced via `module:{key}` middleware:

1. **Registrar Role (`registrar`)**:
   - Access to Admissions, Learner Management, Enrollment, Classes & Sections, Academic Records, Attendance, Transfers, Certificates, Document Center.
   - **Restricted**: Cannot access Finance ledgers or alter fee structures.

2. **Finance Role (`finance`)**:
   - Access to Finance Dashboard, Learner Accounts, Fee Structures, Batch Assessment, Financial Reports, Audit Trail.
   - **Restricted**: Cannot bypass Registrar admission gates or modify academic grades.

3. **Admin Role (`admin`)**:
   - Full access across all modules, user management, and academic year settings.

---

## 3. The 4-Step Admission & Enrollment Workflow

```
[ Step 1: Registrar ]           [ Step 2: System / Finance ]         [ Step 3: Finance / Cashier ]         [ Step 4: Registrar ]
  Walk-in Registration   ───►  Returning Balance Lookup     ───►  ₱500 Downpayment Settle   ───►  Admit & Contract Gen.
 (Status: Awaiting DP)          (Calculates Prev. Balance)        (Status: Approved Enrollment)        (Generates PDF, Mail, Telegram)
```

### Step 1: Walk-In / Application Registration (Registrar)
- **Action**: Registrar fills out applicant details at `/admissions/create` (`AdmissionController@store`).
- **Data Created**:
  - `AdmissionApplication` record is created.
  - `status` is set to `ApplicationStatus::AwaitingDownpayment->value` (`'awaiting_downpayment'`).
  - `learner_id` is set to `NULL`.
  - `classification` is set to `'NEW'` or `'RETURNING'`.
- **Gate Rule**: At this stage, Registrar **CANNOT** admit the learner. The button on the Admissions page displays `🔒 Awaiting Finance Settlement` and is disabled.

---

### Step 2: Returning Learner Lookup & Previous Balance Verification
- **Automated Trigger**: Executed on application load via `AdmissionApplication::getPreviousBalanceAttribute()`.
- **Lookup Algorithm**:
  1. The system cleans and normalizes the applicant's name (`normalized_name`).
  2. Searches `learners` table for existing student records matching:
     - `normalized_name` OR uppercase `full_name`
     - Parent email fields (`mother_email`, `father_email`, `receipt_email`)
     - Contact fields (`mother_contact_number`, `father_contact_number`)
  3. If a matching `Learner` is found, the system queries all previous `Enrollment` records and calculates the sum of positive balances from `financeLedgers`:
     $$\text{Balance} = \sum (\text{charges} + \text{taxes}) - \sum (\text{payments} + \text{discounts}) + \sum (\text{refunds})$$
- **UI Indicators**:
  - **Returning Applicant with Arrears ($> 0$)**: Displays **`⚠️ AED X,XXX.XX`** (Red alert badge in Pending Registration table and Settle Modal).
  - **Returning Applicant Cleared ($= 0$)**: Displays **`✓ Cleared`** (Emerald badge).
  - **New Applicant**: Displays **`✓ Cleared`** (Slate/Emerald badge).

---

### Step 3: Registration Downpayment Settlement (Finance Cashier)
- **Action**: Parent proceeds to Cashier. Finance opens **Learner Accounts** (`/learner-accounts`) or clicks the **Header Email Alert Icon**.
- **Pending Table**: Lists all applicants where `learner_id IS NULL` and `status = 'awaiting_downpayment'`.
- **Settle Modal Flow**:
  1. Finance clicks **"✓ Settle ₱500 Registration"**.
  2. Modal displays the applicant profile, classification (`RETURNING` vs `NEW`), and previous balance indicator.
  3. Cashier optionally enters an Official Receipt (OR) Number (`receipt_no`, defaults to `REG-SETTLED-XXXX`).
  4. Cashier clicks **"✓ Confirm ₱500 Settlement"** (`LearnerAccountController@settleApplicationRegistration`).
- **Database Updates**:
  - `AdmissionApplication.status` updates to `approved_for_enrollment` (`ApprovedForEnrollment`).
  - Stores metadata: `registration_settled: true`, `registration_settled_at: now()`, `registration_settled_by: user_id`, `downpayment_receipt_no`.
  - Application is automatically cleared from the pending downpayment queue, and the header notification badge count decrements.

---

### Step 4: Official Admission & Contract Generation (Registrar)
- **Action**: Parent returns to Registrar. Registrar checks system (`/admissions`).
- **Gate Check**: The system verifies `status === 'approved_for_enrollment'` or `'registration_settled'`.
- **Admission Execution** (`AdmissionController@enroll`):
  1. **Capacity Check**: Checks current enrolled count for the grade level and session (Morning/Afternoon). Max capacity is **25 learners**. If full ($count \ge 25$), sets `capacity_waitlisted: true`.
  2. **Learner Creation**: Creates official `Learner` record with contact metadata.
  3. **Enrollment Creation**: Creates `Enrollment` record (`status: enrolled`, `registration_settled: true`).
  4. **Application Update**: Sets `AdmissionApplication.learner_id = Learner.id` and `status = 'enrolled'`.
  5. **Dual-Copy PDF Contract**: Renders `pdf.contract` view containing:
     - **Copy 1**: Parent Copy (Official MABDC Enrollment Terms, Downpayment Receipt No, Session Details).
     - **Copy 2**: School / Registrar Copy (Contract signatures block).
  6. **Automated Parent Email**: `EnrollmentContractMail` is dispatched asynchronously to the parent's email with the PDF attached.
  7. **Telegram Channel Alert**: `TelegramService::sendEnrollmentNotification` posts a Markdown alert to the school Telegram channel detailing learner name, LRN, grade level, session, and total active school headcount.
  8. **Redirect**: Redirects to the new learner's profile page (`/learners/{id}`).

---

## 4. Header Notification System (Email Alert Icon)

- **Header Component**: Located in `resources/js/Layouts/AuthenticatedLayout.tsx`.
- **Icon**: Mailbox / Envelope SVG icon replacing the traditional bell icon.
- **Shared Props (`HandleInertiaRequests.php`)**:
  - `pendingRegistrationCount`: Integer count of `AdmissionApplication` records where `learner_id IS NULL` and `status = 'awaiting_downpayment'`.
  - `recentPendingRegistrations`: Array of recent 5 pending applicants with `{ id, full_name, level_applied_for, created_at }`.
- **Badge Behavior**: If `pendingRegistrationCount > 0`, displays a pulsing red badge (`bg-red-600 animate-pulse`). Clicking an applicant item navigates directly to `/learner-accounts`.

---

## 5. Key Database Models & Schemas

### `AdmissionApplication` (`app/Models/AdmissionApplication.php`)
- **Key Columns**: `id`, `uuid`, `academic_year_id`, `learner_id`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `email`, `contact_number`, `level_applied_for`, `classification`, `status`, `metadata`.
- **Appends**: `$appends = ['full_name', 'previous_balance']`.
- **Accessors**:
  - `full_name`: Formats `first_name + middle_name + last_name`.
  - `previous_balance`: Executes cross-reference lookup on `learners` and sums unpaid `financeLedgers`.

### `Learner` (`app/Models/Learner.php`)
- **Key Columns**: `id`, `household_id`, `lrn`, `full_name`, `normalized_name`, `birth_date`, `mother_contact_number`, `mother_email`, `father_contact_number`, `father_email`, `receipt_email`, `metadata`.

### `Enrollment` (`app/Models/Enrollment.php`)
- **Key Columns**: `id`, `academic_year_id`, `learner_id`, `section_id`, `level`, `session`, `status`, `financial_status`, `registration_settled`, `registration_settled_at`, `registration_settled_by`, `downpayment_receipt_no`, `capacity_waitlisted`, `enrolled_on`, `metadata`.

### `FinanceLedger` (`app/Models/FinanceLedger.php`)
- **Key Columns**: `id`, `enrollment_id`, `type` (`charge`, `payment`, `discount`, `refund`, `tax`), `amount`, `description`, `created_at`.

---

## 6. Critical Developer & AI Agent Guidelines

1. **Enum Handling in PHP 8.1+**:
   - `AdmissionApplication::$status` and `::$classification` are cast to Enums (`ApplicationStatus` & `ApplicationClassification`).
   - **ALWAYS** unwrap Enum objects before comparing with raw strings:
     ```php
     $statusVal = is_object($app->status) ? $app->status->value : (string) $app->status;
     ```
2. **PostgreSQL Column Names on `Learner`**:
   - **Do NOT query `email` or `contact_number` directly on `learners` table** (they do not exist).
   - Use `mother_email`, `father_email`, `receipt_email`, `mother_contact_number`, and `father_contact_number`.
3. **Finance Portal Color Palette**:
   - Primary: Deep Royal Blue (`#002b80` / `#001746`).
   - Accent: Gold / Yellow (`#ffc000`).
   - Text: High-contrast white (`#ffffff`) or gold (`#ffc000`) on dark backgrounds.
4. **Server Operations**:
   - Live Host: `denskie@193.181.215.16` (`/var/www/registrar_system`).
   - Always execute `npm run build`, `composer dump-autoload`, and `php artisan cache:clear` upon updating.
