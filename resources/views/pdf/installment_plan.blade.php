<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Installment Plan Agreement - {{ $plan->enrollment->learner->full_name }}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.45;
            background: #ffffff;
            padding: 18mm 20mm;
            position: relative;
        }

        /* ── Header ── */
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .title-block h1 {
            font-size: 22px; font-weight: 900; text-transform: uppercase;
            letter-spacing: 0.5px; color: #0f172a; margin-bottom: 4px;
        }
        .title-block h2 {
            font-size: 13px; font-weight: 900; text-transform: uppercase; color: #005f3d; margin-bottom: 4px;
        }
        .title-block p { font-size: 9px; color: #64748b; line-height: 1.5; }
        .logo-block { text-align: right; vertical-align: top; }
        .logo-block img { width: 64px; height: 64px; object-fit: contain; display: block; margin-left: auto; margin-bottom: 6px; }
        .logo-block .trn { font-size: 9px; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── Divider ── */
        .divider { border: none; border-top: 2px solid #0f172a; margin: 12px 0; }

        /* ── Info Card ── */
        .info-wrap { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 22px; background: #f8fafc; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-td { padding: 12px 16px; width: 50%; vertical-align: top; }
        .info-td-left { border-right: 1px solid #e2e8f0; }
        .info-sublabel { font-size: 8px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .info-name { font-size: 14px; font-weight: 900; color: #005f3d; text-transform: uppercase; margin-bottom: 6px; }
        .info-detail { font-size: 10px; color: #475569; line-height: 1.6; }
        .info-detail strong { color: #1e293b; }

        /* ── Schedule Table ── */
        .schedule-wrap { border: 1.5px solid #005f3d; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
        .schedule-table { width: 100%; border-collapse: collapse; }
        .schedule-table thead tr { background: #005f3d; }
        .schedule-table th {
            color: #ffffff; font-weight: 900; text-transform: uppercase;
            font-size: 9px; letter-spacing: 0.5px; padding: 8px 10px; text-align: left;
        }
        .schedule-table th.text-right { text-align: right; }
        .schedule-table td {
            padding: 8px 10px; font-size: 10px;
            border-bottom: 1px solid #cbd5e1;
        }
        .schedule-table tr:last-child td { border-bottom: none; }
        .schedule-table tr:nth-child(even) td { background: #fafafa; }
        .schedule-table .text-right { text-align: right; font-weight: bold; }
        .schedule-table .total-row td {
            border-top: 1.5px solid #005f3d;
            font-weight: 900; background: #f8fafc;
            color: #005f3d;
            font-size: 11px;
        }

        /* ── Signature ── */
        .sig-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .sig-td { width: 35%; text-align: center; vertical-align: bottom; }
        .sig-line { border-bottom: 1px solid #1e293b; height: 28px; }
        .sig-label { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin-top: 3px; }

        /* ── Footer ── */
        .footer { margin-top: 15px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }

        /* ── Bottom Pinned Block ── */
        .bottom-block {
            position: absolute;
            bottom: 24mm;
            left: 20mm;
            right: 20mm;
        }
    </style>
</head>
<body>

{{-- ══ HEADER ══ --}}
<table class="header-table">
    <tr>
        <td class="title-block" style="vertical-align: top;">
            <h1>Installment Agreement</h1>
            <h2>M.A. Brain Development Center</h2>
            <p>
                MAIN OFFICE: 3rd Floor, Office 303-304, Al Ferdous Tower, Al Salam St., Abu Dhabi, UAE<br>
                Tel. No. 02-874-3277 &nbsp;|&nbsp; WhatsApp/Mobile: 050-6609942 | 054-3062631 | 056-6019379<br>
                Email: info@mabraindevcenter.ae
            </p>
        </td>
        <td class="logo-block" style="width: 90px; vertical-align: top;">
            @if(file_exists(public_path('images/logo.jpg')))
                <img src="{{ public_path('images/logo.jpg') }}" alt="Logo">
            @else
                <div style="width:64px;height:64px;border-radius:50%;background:#1e293b;color:#fff;text-align:center;line-height:64px;font-weight:900;font-size:14px;margin-left:auto;margin-bottom:6px;">MAB</div>
            @endif
            <div class="trn">TRN: 104022449300003</div>
        </td>
    </tr>
</table>

<hr class="divider">

{{-- ══ INFO CARD ══ --}}
<div class="info-wrap">
    <table class="info-table">
        <tr>
            <td class="info-td info-td-left" style="vertical-align: top;">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        @if(!empty($photoBase64))
                            <td style="width: 58px; vertical-align: top; padding-right: 12px;">
                                <img src="{{ $photoBase64 }}" style="width: 52px; height: 52px; border-radius: 50%; border: 2px solid #005f3d; object-fit: cover; display: block;" alt="Photo">
                            </td>
                        @endif
                        <td style="vertical-align: top;">
                            <div class="info-sublabel">Learner Details</div>
                            <div class="info-name">{{ $plan->enrollment->learner->full_name }}</div>
                            <div class="info-detail">
                                <strong>LRN:</strong> {{ $plan->enrollment->learner->lrn ?? 'Unassigned' }}<br>
                                <strong>Grade Level:</strong> {{ $plan->enrollment->level }}<br>
                                <strong>Section:</strong> {{ $plan->enrollment->section?->name ?? 'Unassigned' }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td class="info-td">
                <div class="info-sublabel">Installment Plan Details</div>
                <div class="info-detail" style="margin-top: 4px;">
                    <strong>Academic Year:</strong> {{ $plan->enrollment->academicYear->name }}<br>
                    <strong>Total Duration:</strong> {{ $plan->total_months }} Months<br>
                    <strong>Plan Start Date:</strong> {{ $plan->start_date?->format('F d, Y') }}<br>
                    <strong>Monthly Installment:</strong> {{ number_format($plan->monthly_amount, 2) }} AED
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- ══ PROJECTED SCHEDULE ══ --}}
<div class="schedule-wrap">
    <table class="schedule-table">
        <thead>
            <tr>
                <th style="width:25%;">Installment #</th>
                <th style="width:45%;">Due Date</th>
                <th class="text-right" style="width:30%;">Projected Amount (AED)</th>
            </tr>
        </thead>
        <tbody>
            @php
                $startDate = \Carbon\Carbon::parse($plan->start_date);
            @endphp
            @for ($i = 1; $i <= $plan->total_months; $i++)
                @php
                    $dueDate = $i === 1 ? $startDate->copy() : $startDate->copy()->addMonths($i - 1);
                @endphp
                <tr>
                    <td>Month {{ $i }}</td>
                    <td>{{ $dueDate->format('F d, Y') }}</td>
                    <td class="text-right">{{ number_format($plan->monthly_amount, 2) }}</td>
                </tr>
            @endfor
            <tr class="total-row">
                <td colspan="2">Total Plan Amount</td>
                <td class="text-right">{{ number_format($totalAmount, 2) }} AED</td>
            </tr>
        </tbody>
    </table>
</div>

{{-- ══ SIGNATURE & FOOTER BLOCK ══ --}}
<div class="bottom-block">
    <table class="sig-table">
        <tr>
            <td class="sig-td" style="width:45%; text-align:center;">
                <div class="sig-line"></div>
                <div class="sig-label">Parent / Guardian Signature</div>
            </td>
            <td style="width:10%;"></td>
            <td class="sig-td" style="width:45%; text-align:center;">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signatory</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        <p>This Installment Plan Agreement is subject to the general terms and conditions of M.A. Brain Development Center.</p>
        <p>&copy; {{ date('Y') }} M.A. Brain Development Center. All Rights Reserved.</p>
    </div>
</div>

</body>
</html>
