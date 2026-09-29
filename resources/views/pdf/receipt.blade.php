<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tax Invoice - {{ $receipt->receipt_number }}</title>
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
            font-size: 13px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 4px;
        }
        .title-block p { font-size: 9px; color: #64748b; line-height: 1.5; }
        .logo-block { text-align: right; vertical-align: top; }
        .logo-block img { width: 64px; height: 64px; object-fit: contain; display: block; margin-left: auto; margin-bottom: 6px; }
        .logo-block .trn { font-size: 9px; font-weight: bold; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }

        /* ── Divider ── */
        .divider { border: none; border-top: 2px solid #0f172a; margin: 12px 0; }

        /* ── Metadata Grid ── */
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-cell { width: 50%; padding: 5px 0; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        .meta-cell-inner { display: inline; }
        .meta-label { font-weight: bold; color: #1e293b; }
        .meta-value { font-weight: 600; color: #0f172a; }
        .meta-name { font-weight: 900; color: #0f172a; text-transform: uppercase; }

        /* ── Items Table ── */
        .items-wrap { border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table thead tr { background: #f1f5f9; border-bottom: 1.5px solid #0f172a; }
        .items-table th {
            font-size: 9px; font-weight: bold; text-transform: uppercase; color: #374151;
            padding: 7px 10px; text-align: left; border-right: 1.5px solid #0f172a;
        }
        .items-table th:last-child { border-right: none; }
        .items-table td {
            padding: 7px 10px; font-size: 10px;
            border-bottom: 1px solid #cbd5e1; border-right: 1.5px solid #0f172a;
            vertical-align: top;
        }
        .items-table td:last-child { border-right: none; }
        .items-table .spacer-row td { height: 20px; border-bottom: 1px solid #e2e8f0; }
        .items-table .total-row td {
            border-top: 1.5px solid #0f172a; border-bottom: none;
            font-weight: bold; background: #f8fafc;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* ── Breakdown: Words + Summary ── */
        .breakdown-wrap { border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 18px; }
        .breakdown-table { width: 100%; border-collapse: collapse; }
        .words-td {
            width: 57%; padding: 12px; border-right: 1.5px solid #0f172a;
            vertical-align: top;
        }
        .words-label { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
        .words-text { font-size: 10px; font-weight: bold; font-style: italic; text-transform: uppercase; color: #1e293b; line-height: 1.4; }
        .summary-td { width: 43%; vertical-align: top; }
        .summary-inner { width: 100%; border-collapse: collapse; }
        .summary-inner td { padding: 7px 12px; font-size: 10px; font-weight: bold; border-bottom: 1px solid #0f172a; }
        .summary-inner .total-final td { border-bottom: none; background: #f8fafc; font-weight: 900; font-size: 12px; }

        /* ── Outstanding Balance ── */
        .outstanding-wrap { border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
        .outstanding-table { width: 100%; border-collapse: collapse; }
        .outstanding-table td { padding: 8px 14px; font-size: 10px; font-weight: bold; border-bottom: 1px solid #0f172a; color: #0f172a; }
        .outstanding-table .yellow-row td { background: #fef08a; border-bottom: none; font-weight: 900; font-size: 12px; }

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

@php
    $payment      = $receipt->payment;
    $enrollment   = $payment->enrollment;
    $learner      = $enrollment->learner;
    $totalAmount  = (float)($payment->amount ?? 0);
    $vatIncl      = $totalAmount * 0.05;
    $totalBeforeVat = $totalAmount - $vatIncl;

    $totalBalance        = (float)($current_balance ?? 0);
    $outstandingBeforeVat = $totalBalance > 0 ? $totalBalance / 1.05 : 0;
    $outstandingVat       = $totalBalance - $outstandingBeforeVat;

    if (!function_exists('amount_to_words_pdf')) {
        function amount_to_words_pdf($amount) {
            $num = (int) floor($amount);
            $ones   = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN',
                       'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
            $tens   = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
            $scales = ['', 'THOUSAND', 'MILLION'];
            if ($num === 0) return 'ZERO DIRHAMS ONLY';
            $helper = function($n) use ($ones, $tens, &$helper) {
                if ($n < 20) return $ones[$n];
                if ($n < 100) return $tens[(int)floor($n / 10)] . ($n % 10 ? ' ' . $ones[$n % 10] : '');
                return $ones[(int)floor($n / 100)] . ' HUNDRED' . ($n % 100 ? ' ' . $helper($n % 100) : '');
            };
            $result = ''; $si = 0; $temp = $num;
            while ($temp > 0) {
                $chunk = $temp % 1000;
                if ($chunk) $result = $helper($chunk) . ($scales[$si] ? ' ' . $scales[$si] : '') . ($result ? ' ' . $result : '');
                $temp = (int)floor($temp / 1000); $si++;
            }
            return trim($result) . ' DIRHAMS ONLY';
        }
    }
@endphp

{{-- ══ HEADER ══ --}}
<table class="header-table">
    <tr>
        <td class="title-block" style="vertical-align: top;">
            <h1>Tax Invoice</h1>
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

{{-- ══ METADATA ══ --}}
<table class="meta-table">
    <tr>
        <td class="meta-cell" style="padding-right: 20px;">
            <span class="meta-label" style="display:inline-block;width:105px;">Invoice No.:</span>
            <span class="meta-value">{{ $receipt->receipt_number }}</span>
        </td>
        <td class="meta-cell">
            <span class="meta-label" style="display:inline-block;width:120px;">Invoice Date:</span>
            <span class="meta-value">{{ \Carbon\Carbon::parse($receipt->issued_date)->format('m/d/Y') }}</span>
        </td>
    </tr>
    <tr>
        <td class="meta-cell" style="padding-right: 20px;">
            <span class="meta-label" style="display:inline-block;width:105px;">Name of Payee:</span>
            <span class="meta-name">{{ $learner->full_name }}</span>
        </td>
        <td class="meta-cell">
            <span class="meta-label" style="display:inline-block;width:120px;">Mode/Terms of Payment:</span>
            <span class="meta-value" style="text-transform:uppercase;">
                {{ $payment->payment_method }}
                @if(!empty($payment->reference_number))
                    (REF: {{ $payment->reference_number }})
                @endif
            </span>
        </td>
    </tr>
</table>

{{-- ══ ITEMS TABLE ══ --}}
<div class="items-wrap">
    <table class="items-table">
        <thead>
            <tr>
                <th style="width:42%;">Description</th>
                <th style="width:10%; text-align:center;">Qty</th>
                <th style="width:17%; text-align:right;">Amount (AED)</th>
                <th style="width:12%; text-align:center;">Discount</th>
                <th style="width:19%; text-align:right;">Amount Net of Discount (AED)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $enrollment->level }} - Tuition Payment ({{ $enrollment->academicYear->name }})</td>
                <td class="text-center">1</td>
                <td class="text-right">{{ number_format($totalBeforeVat, 2) }}</td>
                <td class="text-center">—</td>
                <td class="text-right" style="font-weight:bold;">{{ number_format($totalBeforeVat, 2) }}</td>
            </tr>
            <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td></tr>
            <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td></tr>
            <tr class="spacer-row"><td></td><td></td><td></td><td></td><td></td></tr>
            <tr class="total-row">
                <td colspan="4" class="text-right" style="font-size:9px;text-transform:uppercase;letter-spacing:0.5px;">Total</td>
                <td class="text-right" style="font-size:12px;">{{ number_format($totalBeforeVat, 2) }}</td>
            </tr>
        </tbody>
    </table>
</div>

{{-- ══ BREAKDOWN: WORDS + SUMMARY ══ --}}
<div class="breakdown-wrap">
    <table class="breakdown-table">
        <tr>
            <td class="words-td">
                <span class="words-label">Total Amount in Words:</span>
                <p class="words-text">{{ amount_to_words_pdf($totalAmount) }}</p>
            </td>
            <td class="summary-td">
                <table class="summary-inner">
                    <tr>
                        <td style="color:#475569;">Total before VAT</td>
                        <td class="text-right" style="color:#1e293b;">{{ number_format($totalBeforeVat, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="color:#475569;">VAT Incl. (5%)</td>
                        <td class="text-right" style="color:#1e293b;">{{ number_format($vatIncl, 2) }}</td>
                    </tr>
                    <tr class="total-final">
                        <td>Total</td>
                        <td class="text-right">{{ number_format($totalAmount, 2) }} AED</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>

{{-- ══ OUTSTANDING BALANCE ══ --}}
<div class="outstanding-wrap">
    <table class="outstanding-table">
        <tr>
            <td style="width:65%; color:#0f172a; text-transform:uppercase; letter-spacing:0.3px;">Outstanding Balance:</td>
            <td class="text-right" style="width:35%;">{{ number_format($outstandingBeforeVat, 2) }}</td>
        </tr>
        <tr>
            <td style="text-transform:uppercase; letter-spacing:0.3px;">5% VAT:</td>
            <td class="text-right">{{ number_format($outstandingVat, 2) }}</td>
        </tr>
        <tr class="yellow-row">
            <td style="text-transform:uppercase; letter-spacing:0.5px;">Total Balance:</td>
            <td class="text-right" style="font-size:13px;">{{ number_format($totalBalance, 2) }} AED</td>
        </tr>
    </table>
</div>

<div class="bottom-block">
    {{-- ══ SIGNATURE ══ --}}
    <table class="sig-table">
        <tr>
            <td style="width:65%;"></td>
            <td class="sig-td">
                <div class="sig-line"></div>
                <div class="sig-label">Authorized Signatory</div>
            </td>
        </tr>
    </table>

    {{-- ══ FOOTER ══ --}}
    <div class="footer">
        <p>This Tax Invoice / Receipt is computer-generated. No signature is required.</p>
        <p>&copy; {{ date('Y') }} M.A. Brain Development Center. All Rights Reserved.</p>
    </div>
</div>

</body>
</html>
