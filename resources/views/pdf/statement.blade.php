<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Statement of Account - {{ $enrollment->learner->full_name }}</title>
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
            font-size: 13px;
            line-height: 1.5;
            background: #ffffff;
            padding: 20mm 20mm;
            position: relative;
        }

        /* ── Header ── */
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .title-block h1 {
            font-size: 26px; font-weight: 900; text-transform: uppercase;
            letter-spacing: 0.5px; color: #0f172a; margin-bottom: 4px;
        }
        .title-block h2 {
            font-size: 15px; font-weight: 900; text-transform: uppercase; color: #005f3d; margin-bottom: 4px;
        }
        .title-block p { font-size: 10px; color: #334155; line-height: 1.5; }
        .logo-block { text-align: right; vertical-align: top; }
        .logo-block img { width: 72px; height: 72px; object-fit: contain; display: block; margin-left: auto; margin-bottom: 6px; }
        .logo-block .trn { font-size: 10px; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── Divider ── */
        .divider { border: none; border-top: 2px solid #0f172a; margin: 12px 0; }

        /* ── Info Card ── */
        .info-wrap { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 22px; background: #f8fafc; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-td { padding: 14px 18px; width: 50%; vertical-align: top; }
        .info-td-left { border-right: 1px solid #e2e8f0; }
        .info-sublabel { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .info-name { font-size: 16px; font-weight: 900; color: #005f3d; text-transform: uppercase; margin-bottom: 6px; }
        .info-detail { font-size: 11px; color: #1e293b; line-height: 1.6; }
        .info-detail strong { color: #0f172a; }

        /* ── Status badge ── */
        .status-cleared { color: #166534; font-weight: bold; }
        .status-outstanding { color: #b91c1c; font-weight: bold; }

        /* ── Ledger Table ── */
        .ledger-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-radius: 8px; overflow: hidden; }
        .ledger-table thead tr { background: #005f3d; }
        .ledger-table th {
            color: #ffffff; font-weight: 900; text-transform: uppercase;
            font-size: 10px; letter-spacing: 0.5px; padding: 11px 14px; text-align: left;
        }
        .ledger-table th.text-right { text-align: right; }
        .ledger-table td { padding: 10px 14px; font-size: 11px; border-bottom: 1px solid #f1f5f9; color: #0f172a; }
        .ledger-table tr:nth-child(even) td { background: #fafafa; }
        .ledger-table .text-right { text-align: right; font-weight: bold; }
        .amount-charge { color: #b91c1c; }
        .amount-credit { color: #166534; }

        /* ── Type Badge ── */
        .badge {
            font-size: 9px; font-weight: bold; text-transform: uppercase;
            padding: 3px 7px; border-radius: 4px; display: inline-block;
        }
        .badge-charge   { background: #fee2e2; color: #991b1b; }
        .badge-tax      { background: #ffedd5; color: #9a3412; }
        .badge-payment  { background: #dcfce7; color: #166534; }
        .badge-discount { background: #f0fdf4; color: #14532d; }
        .badge-refund   { background: #fef9c3; color: #854d0e; }
        .badge-transfer { background: #f1f5f9; color: #334155; }

        /* ── Summary Footer ── */
        .summary-wrap { width: 100%; margin-top: 10px; }
        .summary-table { width: 300px; margin-left: auto; border-collapse: collapse; border-radius: 8px; overflow: hidden; }
        .summary-table td { padding: 9px 16px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
        .summary-table .sum-label { color: #475569; font-weight: bold; }
        .summary-table .sum-value { text-align: right; font-weight: bold; color: #0f172a; }
        .summary-table .sum-credit { text-align: right; font-weight: bold; color: #166534; }
        .summary-table .total-row td { background: #005f3d; color: #ffffff; border-bottom: none; font-weight: 900; font-size: 13px; }

        /* ── Page Footer ── */
        .footer {
            margin-top: 10px; text-align: center; font-size: 9px;
            color: #475569; border-top: 1px solid #cbd5e1; padding-top: 12px;
        }

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
            <h1>Statement of Account</h1>
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
                            <div class="info-name">{{ $enrollment->learner->full_name }}</div>
                            <div class="info-detail">
                                <strong>LRN:</strong> {{ $enrollment->learner->lrn ?? 'Unassigned' }}<br>
                                <strong>Grade Level:</strong> {{ $enrollment->level }}<br>
                                <strong>Section:</strong> {{ $enrollment->section?->name ?? 'Unassigned' }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td class="info-td">
                <div class="info-sublabel">Statement Info</div>
                <div class="info-detail" style="margin-top: 4px;">
                    <strong>Academic Year:</strong> {{ $enrollment->academicYear->name }}<br>
                    <strong>Financial Status:</strong>
                    @if($balance <= 0)
                        <span class="status-cleared">CLEARED</span>
                    @else
                        <span class="status-outstanding">OUTSTANDING</span>
                    @endif
                    <br>
                    <strong>Generated On:</strong> {{ now()->format('F d, Y h:i A') }}<br>
                    <strong>Generated By:</strong> {{ auth()->user()?->name ?? 'System Portal' }}
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- ══ LEDGER TABLE ══ --}}
<table class="ledger-table">
    <thead>
        <tr>
            <th style="width:14%;">Date</th>
            <th style="width:14%;">Type</th>
            <th style="width:52%;">Description</th>
            <th class="text-right" style="width:20%;">Amount (AED)</th>
        </tr>
    </thead>
    <tbody>
        @forelse($enrollment->financeLedgers as $ledger)
            <tr>
                <td>{{ $ledger->transaction_date?->format('Y-m-d') ?? $ledger->created_at->format('Y-m-d') }}</td>
                <td>
                    <span class="badge badge-{{ $ledger->type }}">{{ $ledger->type }}</span>
                </td>
                <td>{{ $ledger->description }}</td>
                <td class="text-right {{ $ledger->amount < 0 ? 'amount-credit' : 'amount-charge' }}">
                    {{ $ledger->amount > 0 ? '+' : '' }}{{ number_format($ledger->amount, 2) }}
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="4" style="text-align:center; color:#94a3b8; padding:18px;">
                    No ledger transactions found for this student.
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

{{-- ══ SUMMARY ══ --}}
<div class="summary-wrap">
    <table class="summary-table">
        <tr>
            <td class="sum-label">Total Charges</td>
            <td class="sum-value">{{ number_format($totalFees, 2) }} AED</td>
        </tr>
        <tr>
            <td class="sum-label">Total Discounts</td>
            <td class="sum-credit">-{{ number_format(abs($totalDiscounts), 2) }} AED</td>
        </tr>
        <tr>
            <td class="sum-label">Total Payments</td>
            <td class="sum-credit">-{{ number_format(abs($totalPayments), 2) }} AED</td>
        </tr>
        <tr class="total-row">
            <td>Outstanding Balance</td>
            <td style="text-align:right;">{{ number_format($balance, 2) }} AED</td>
        </tr>
    </table>
</div>

<div class="bottom-block">
    {{-- ══ PAGE FOOTER ══ --}}
    <div class="footer">
        <p>This Statement of Account is computer-generated. No signature is required.</p>
        <p>&copy; {{ date('Y') }} M.A. Brain Development Center. All Rights Reserved.</p>
    </div>
</div>

</body>
</html>
