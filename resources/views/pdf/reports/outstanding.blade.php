<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Outstanding Balances Report</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #334155;
            margin: 0;
            padding: 0;
            font-size: 11px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border-bottom: 2px solid #005f3d;
            padding-bottom: 10px;
        }
        .school-name {
            font-size: 16px;
            font-weight: bold;
            color: #005f3d;
            margin: 0;
        }
        .title-text {
            font-size: 18px;
            font-weight: 900;
            color: #b91c1c;
            margin: 0;
            text-align: right;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .data-table th {
            background-color: #005f3d;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 8.5px;
            padding: 8px 10px;
            text-align: left;
        }
        .data-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .amount-col {
            text-align: right;
            font-weight: bold;
            color: #b91c1c;
        }
        .total-box {
            margin-top: 20px;
            text-align: right;
            font-size: 13px;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td>
                <h1 class="school-name">M.A. Brain Development Center</h1>
                <p style="margin: 3px 0 0 0; color: #64748b; font-size: 9px;">Finance & Collections Department</p>
                <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 8px;">Academic Year: {{ $academic_year }}</p>
            </td>
            <td style="text-align: right; vertical-align: top;">
                <h2 class="title-text">OUTSTANDING BALANCES</h2>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 9px;">Generated: {{ $generated_at }}</p>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">#</th>
                <th style="width: 45%;">Student Name</th>
                <th style="width: 20%;">LRN</th>
                <th style="width: 10%;">Grade</th>
                <th style="width: 15%; text-align: right;">Outstanding Balance</th>
            </tr>
        </thead>
        <tbody>
            @php $totalOutstanding = 0; @endphp
            @forelse($accounts as $index => $acc)
                @php $totalOutstanding += $acc['balance']; @endphp
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td style="font-weight: bold; color: #1e293b;">{{ $acc['learner_name'] }}</td>
                    <td>{{ $acc['lrn'] ?? 'N/A' }}</td>
                    <td>{{ $acc['level'] }}</td>
                    <td class="amount-col">{{ number_format($acc['balance'], 2) }} AED</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">
                        No accounts with outstanding balances found.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="total-box">
        Total Receivables: <span style="color: #b91c1c; font-size: 16px; font-weight: 900;">{{ number_format($totalOutstanding, 2) }} AED</span>
    </div>

</body>
</html>
