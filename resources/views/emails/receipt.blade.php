<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #334155;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #005f3d;
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 30px 25px;
        }
        .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    @php
        $payment = $receipt->payment;
        $enrollment = $payment->enrollment;
        $learner = $enrollment->learner;
        $totalAmount = (float)($payment->amount ?? 0);
    @endphp
    <div class="container">
        <div class="header">
            <h1>M.A. Brain Development Center</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Finance Department</p>
        </div>
        <div class="content">
            <p>Dear Parent / Guardian,</p>
            <p>Thank you for your payment. We have successfully recorded the payment for your child, <strong>{{ $learner->full_name }}</strong>, and issued the official receipt.</p>
            
            <div class="summary-box">
                <table style="width:100%; border-collapse:collapse; margin-bottom: 10px;">
                    <tr>
                        @if(!empty($photoPath) && file_exists($photoPath) && isset($message))
                            <td style="width: 65px; vertical-align: top; padding-right: 15px;">
                                <img src="{{ $message->embed($photoPath) }}" style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid #005f3d; object-fit: cover; display: block;" alt="Photo">
                            </td>
                        @endif
                        <td style="vertical-align: top;">
                            <table style="width:100%; border-collapse:collapse;">
                                <tr style="font-size:14px; color:#475569;">
                                    <td style="padding: 2px 0; font-weight:bold;">Student Name:</td>
                                    <td style="padding: 2px 0; text-align:right;">{{ $learner->full_name }}</td>
                                </tr>
                                <tr style="font-size:14px; color:#475569;">
                                    <td style="padding: 2px 0; font-weight:bold;">Grade Level:</td>
                                    <td style="padding: 2px 0; text-align:right;">{{ $enrollment->level }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table style="width:100%; border-collapse:collapse;">
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold;">Receipt Number:</td>
                        <td style="padding: 5px 0; text-align:right; font-weight:bold; color:#005f3d;">{{ $receipt->receipt_number }}</td>
                    </tr>
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold;">Payment Date:</td>
                        <td style="padding: 5px 0; text-align:right;">{{ \Carbon\Carbon::parse($receipt->issued_date)->format('F d, Y') }}</td>
                    </tr>
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold;">Payment Method:</td>
                        <td style="padding: 5px 0; text-align:right; text-transform:uppercase;">{{ $payment->payment_method }}</td>
                    </tr>
                    @if(!empty($payment->reference_number))
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold;">Reference Number:</td>
                        <td style="padding: 5px 0; text-align:right;">{{ $payment->reference_number }}</td>
                    </tr>
                    @endif
                    <tr style="font-size:14px; color:#475569; border-top: 1px dashed #e2e8f0; padding-top: 5px;">
                        <td style="padding: 8px 0; font-weight:bold; color:#166534;">Amount Paid:</td>
                        <td style="padding: 8px 0; text-align:right; font-weight:bold; color:#166534;">{{ number_format($totalAmount, 2) }} AED</td>
                    </tr>
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold; color:#b91c1c;">Remaining Balance:</td>
                        <td style="padding: 5px 0; text-align:right; font-weight:bold; color:#b91c1c;">{{ number_format($current_balance, 2) }} AED</td>
                    </tr>
                </table>
            </div>

            <p>An official PDF copy of your Tax Invoice / Payment Receipt is attached to this email for your records.</p>
            <p>If you have any questions or require further assistance, please feel free to contact our Finance Office directly.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Sheila Mae P. Dadula</strong><br>Finance Officer<br>+971 54 250 5401</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>&copy; M.A. Brain Development Center. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>
