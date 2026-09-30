<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Student Enrollment Contract - {{ $contract['learner_name'] ?? ($enrollment->learner?->full_name ?? 'Student') }}</title>
    <style>
        @page {
            margin: 20px 25px;
            font-family: DejaVu Sans, sans-serif;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1e293b;
            font-size: 10px;
            line-height: 1.4;
        }
        .page-break {
            page-break-after: always;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #002b80;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .header h1 {
            font-size: 15px;
            color: #002b80;
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header p {
            font-size: 9px;
            color: #64748b;
            margin: 2px 0 0 0;
        }
        .copy-badge {
            display: inline-block;
            background-color: #002b80;
            color: #ffc000;
            font-weight: bold;
            font-size: 9px;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            float: right;
        }
        .section-title {
            font-size: 10.5px;
            font-weight: bold;
            color: #002b80;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 9px;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        table.info-table td {
            padding: 3px 5px;
            vertical-align: top;
            font-size: 9.5px;
        }
        .label {
            font-weight: bold;
            color: #475569;
            width: 25%;
        }
        .value {
            color: #0f172a;
            width: 25%;
        }
        .settlement-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 7px 9px;
            border-radius: 5px;
            margin: 6px 0;
            font-size: 9.5px;
        }
        .settlement-box strong {
            color: #166534;
        }
        .terms {
            font-size: 8.5px;
            color: #334155;
            text-align: justify;
            margin: 8px 0;
        }
        .terms ol {
            padding-left: 15px;
            margin: 4px 0;
        }
        .terms li {
            margin-bottom: 4px;
            line-height: 1.35;
        }
        .special-box {
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            padding: 6px 8px;
            border-radius: 4px;
            margin: 6px 0;
            font-size: 8.5px;
            color: #92400e;
        }
        .signatures {
            margin-top: 20px;
            width: 100%;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            padding: 8px 15px;
        }
        .sig-line {
            border-top: 1px solid #0f172a;
            margin-top: 30px;
            padding-top: 4px;
            font-weight: bold;
            font-size: 9px;
        }
    </style>
</head>
<body>

@php
    $c = $contract ?? [];
    $schoolName = $c['school_name'] ?? 'Mahardika Al-Islamia Basic Education Center';
    $contractTitle = $c['contract_title'] ?? 'Official Student Enrollment Contract & Agreement';
    $academicYearName = $c['academic_year'] ?? ($enrollment->academicYear?->name ?? '2026-2027');
    $learnerName = $c['learner_name'] ?? strtoupper($enrollment->learner?->full_name ?? 'N/A');
    $lrn = $c['lrn'] ?? ($enrollment->learner?->lrn ?? 'N/A');
    $level = $c['level'] ?? ($enrollment->level ?? '');
    $session = $c['session'] ?? ($enrollment->session ?? 'Morning');
    $parentName = $c['parent_name'] ?? ($enrollment->learner?->mother_maiden_name ?: ($enrollment->learner?->father_name ?: 'Parent / Guardian'));
    $contactPhone = $c['contact_phone'] ?? ($enrollment->learner?->mother_contact_number ?: ($enrollment->learner?->father_contact_number ?: 'N/A'));
    $contactEmail = $c['contact_email'] ?? ($enrollment->learner?->mother_email ?: ($enrollment->learner?->father_email ?: ''));
    $downpaymentAmount = $c['downpayment_amount'] ?? '₱500.00';
    $downpaymentRemarks = $c['downpayment_remarks'] ?? 'VAT 5% inclusive credit applied to 10-Month Schedule';
    $receiptNo = $c['receipt_no'] ?? ($enrollment->downpayment_receipt_no ?? 'REG-SETTLED');
    $verifiedDate = $c['verified_date'] ?? ($enrollment->downpayment_verified_at ? $enrollment->downpayment_verified_at->format('F d, Y h:i A') : now()->format('F d, Y'));
    
    $clauses = $c['clauses'] ?? [
        [
            'title' => 'Enrollment Commitment',
            'body' => "The parent/guardian agrees to the official enrollment of the student at MABDC for Academic Year {$academicYearName}."
        ],
        [
            'title' => 'Tuition & Billing',
            'body' => "Tuition fees are structured across a 10-month payment schedule with 5% UAE VAT inclusive. The {$downpaymentAmount} advance downpayment is fully credited toward the student's tuition balance."
        ],
        [
            'title' => 'Session Capacity',
            'body' => "The student is assigned to a reserved session slot capped at a maximum of 25 learners per session."
        ],
        [
            'title' => 'Rules & Compliance',
            'body' => "The student and parent agree to abide by all academic standards, code of conduct, and regulations enforced by MABDC."
        ]
    ];
    $specialProvisions = $c['special_provisions'] ?? '';
    $parentSigLabel = $c['parent_sig_label'] ?? 'Parent / Guardian Signature over Printed Name';
    $schoolSigLabel = $c['school_sig_label'] ?? 'School Registrar Authorized Signature';
    $schoolSignatoryName = $c['school_signatory_name'] ?? 'Office of the Registrar';
    $dateSigned = $c['date_signed'] ?? date('F d, Y');

    $copies = ['PARENT / GUARDIAN COPY', 'SCHOOL / REGISTRAR COPY'];
@endphp

@foreach($copies as $index => $copyTitle)
    <div class="copy-badge">{{ $copyTitle }}</div>
    <div class="header">
        <h1>{{ $schoolName }}</h1>
        <p>{{ $contractTitle }} | SY {{ $academicYearName }}</p>
    </div>

    <div class="section-title">1. Student & Academic Information</div>
    <table class="info-table">
        <tr>
            <td class="label">Learner Full Name:</td>
            <td class="value"><strong>{{ strtoupper($learnerName) }}</strong></td>
            <td class="label">LRN:</td>
            <td class="value">{{ $lrn }}</td>
        </tr>
        <tr>
            <td class="label">Grade Level:</td>
            <td class="value"><strong>{{ $level }}</strong></td>
            <td class="label">Session Slot:</td>
            <td class="value">{{ $session }}</td>
        </tr>
        <tr>
            <td class="label">Parent / Guardian:</td>
            <td class="value">{{ $parentName }}</td>
            <td class="label">Contact Phone:</td>
            <td class="value">{{ $contactPhone }}</td>
        </tr>
    </table>

    <div class="section-title">2. Registration Settlement & Financial Verification</div>
    <div class="settlement-box">
        <strong>✓ REGISTRATION SETTLED BY FINANCE DEPARTMENT</strong><br>
        Advance Downpayment Credit: <strong>{{ $downpaymentAmount }}</strong> ({{ $downpaymentRemarks }})<br>
        Verified On: {{ $verifiedDate }} | Receipt #: {{ $receiptNo }}
    </div>

    <div class="section-title">3. Terms & Enrollment Conditions</div>
    <div class="terms">
        <ol>
            @foreach($clauses as $clause)
                <li><strong>{{ $clause['title'] ?? 'Condition' }}:</strong> {{ $clause['body'] ?? '' }}</li>
            @endforeach
        </ol>
    </div>

    @if(!empty($specialProvisions))
        <div class="special-box">
            <strong>Special Provisions / Notes:</strong> {{ $specialProvisions }}
        </div>
    @endif

    <table class="signatures">
        <tr>
            <td>
                <div class="sig-line">{{ $parentSigLabel }}</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Date: ________________________</div>
            </td>
            <td>
                <div class="sig-line">{{ $schoolSigLabel }}</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
                    {{ !empty($schoolSignatoryName) ? $schoolSignatoryName . ' • ' : '' }}Date: {{ $dateSigned }}
                </div>
            </td>
        </tr>
    </table>

    @if($index === 0)
        <div class="page-break"></div>
    @endif
@endforeach

</body>
</html>
