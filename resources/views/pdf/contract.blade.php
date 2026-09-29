<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Student Enrollment Contract - {{ $enrollment->learner?->full_name }}</title>
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
            font-size: 16px;
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
            font-size: 11px;
            font-weight: bold;
            color: #002b80;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin-top: 10px;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        table.info-table td {
            padding: 4px 6px;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            color: #475569;
            width: 30%;
        }
        .value {
            color: #0f172a;
        }
        .settlement-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 8px;
            border-radius: 6px;
            margin: 8px 0;
        }
        .settlement-box strong {
            color: #166534;
        }
        .terms {
            font-size: 8.5px;
            color: #334155;
            text-align: justify;
            margin: 10px 0;
        }
        .terms ol {
            padding-left: 15px;
            margin: 4px 0;
        }
        .signatures {
            margin-top: 25px;
            width: 100%;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            padding: 10px;
        }
        .sig-line {
            border-top: 1px solid #0f172a;
            margin-top: 35px;
            padding-top: 4px;
            font-weight: bold;
            font-size: 9.5px;
        }
    </style>
</head>
<body>

@php
    $copies = ['PARENT / GUARDIAN COPY', 'SCHOOL / REGISTRAR COPY'];
@endphp

@foreach($copies as $index => $copyTitle)
    <div className="copy-badge">{{ $copyTitle }}</div>
    <div className="header">
        <h1>Mahardika Al-Islamia Basic Education Center</h1>
        <p>Official Student Enrollment Contract & Agreement | SY {{ $enrollment->academicYear?->name ?? '2026-2027' }}</p>
    </div>

    <div className="section-title">1. Student & Academic Information</div>
    <table className="info-table">
        <tr>
            <td className="label">Learner Full Name:</td>
            <td className="value"><strong>{{ strtoupper($enrollment->learner?->full_name) }}</strong></td>
            <td className="label">LRN:</td>
            <td className="value">{{ $enrollment->learner?->lrn ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td className="label">Grade Level:</td>
            <td className="value"><strong>{{ $enrollment->level }}</strong></td>
            <td className="label">Session Slot:</td>
            <td className="value">{{ $enrollment->session ?? 'Morning' }}</td>
        </tr>
        <tr>
            <td className="label">Parent / Guardian:</td>
            <td className="value">{{ $enrollment->learner?->mother_maiden_name ?: ($enrollment->learner?->father_name ?: 'Parent/Guardian') }}</td>
            <td className="label">Contact Phone:</td>
            <td className="value">{{ $enrollment->learner?->mother_contact_number ?: $enrollment->learner?->father_contact_number }}</td>
        </tr>
    </table>

    <div className="section-title">2. Registration Settlement & Financial Verification</div>
    <div className="settlement-box">
        <strong>✓ REGISTRATION SETTLED BY FINANCE DEPARTMENT</strong><br>
        Advance Downpayment Credit: <strong>₱500.00</strong> (VAT 5% inclusive credit applied to 10-Month Schedule)<br>
        Verified On: {{ $enrollment->downpayment_verified_at ? $enrollment->downpayment_verified_at->format('F d, Y h:i A') : now()->format('F d, Y') }} | Receipt #: {{ $enrollment->downpayment_receipt_no ?? 'REG-SETTLED' }}
    </div>

    <div className="section-title">3. Terms & Enrollment Conditions</div>
    <div className="terms">
        <ol>
            <li><strong>Enrollment Commitment:</strong> The parent/guardian agrees to the official enrollment of the student at MABDC for Academic Year {{ $enrollment->academicYear?->name }}.</li>
            <li><strong>Tuition & Billing:</strong> Tuition fees are structured across a 10-month payment schedule. The ₱500 advance downpayment is fully credited toward the student's tuition balance.</li>
            <li><strong>Session Capacity:</strong> The student is assigned to a reserved session slot capped at a maximum of 25 learners per session.</li>
            <li><strong>Rules & Compliance:</strong> The student and parent agree to abide by all academic standards, code of conduct, and regulations enforced by MABDC.</li>
        </ol>
    </div>

    <table className="signatures">
        <tr>
            <td>
                <div className="sig-line">Parent / Guardian Signature over Printed Name</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Date: ________________________</div>
            </td>
            <td>
                <div className="sig-line">School Registrar Authorized Signature</div>
                <div style="font-size: 8px; color: #64748b; margin-top: 2px;">Date: {{ date('F d, Y') }}</div>
            </td>
        </tr>
    </table>

    @if($index === 0)
        <div className="page-break"></div>
    @endif
@endforeach

</body>
</html>
