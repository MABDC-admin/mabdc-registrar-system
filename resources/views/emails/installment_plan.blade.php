<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Approved Installment Payment Plan</title>
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
    <div class="container">
        <div class="header">
            <h1>M.A. Brain Development Center</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Finance Department</p>
        </div>
        <div class="content">
            <p>Dear Parent / Guardian,</p>
            <p>An installment payment plan has been approved and configured for your child, <strong>{{ $installmentPlan->enrollment->learner->full_name }}</strong>, for the academic year <strong>{{ $installmentPlan->enrollment->academicYear->name }}</strong>.</p>
            
            <div class="summary-box">
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        @if(!empty($photoPath) && file_exists($photoPath) && isset($message))
                            <td style="width: 65px; vertical-align: top; padding-right: 15px;">
                                <img src="{{ $message->embed($photoPath) }}" style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid #005f3d; object-fit: cover; display: block;" alt="Photo">
                            </td>
                        @endif
                        <td style="vertical-align: top;">
                            <table style="width:100%; border-collapse:collapse;">
                                <tr style="font-size:14px; color:#475569;">
                                    <td style="padding: 3px 0; font-weight:bold;">Student Name:</td>
                                    <td style="padding: 3px 0; text-align:right;">{{ $installmentPlan->enrollment->learner->full_name }}</td>
                                </tr>
                                <tr style="font-size:14px; color:#475569;">
                                    <td style="padding: 3px 0; font-weight:bold;">Grade Level:</td>
                                    <td style="padding: 3px 0; text-align:right;">{{ $installmentPlan->enrollment->level }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <table style="width:100%; border-collapse:collapse; margin-top: 10px;">
                    <tr style="font-size:14px; color:#475569; border-top: 1px dashed #e2e8f0;">
                        <td style="padding: 8px 0; font-weight:bold;">Plan Start Date:</td>
                        <td style="padding: 8px 0; text-align:right;">{{ $installmentPlan->start_date?->format('F d, Y') }}</td>
                    </tr>
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold;">Total Plan Duration:</td>
                        <td style="padding: 5px 0; text-align:right;">{{ $installmentPlan->total_months }} Months</td>
                    </tr>
                    <tr style="font-size:14px; color:#475569;">
                        <td style="padding: 5px 0; font-weight:bold;">Monthly Amount:</td>
                        <td style="padding: 5px 0; text-align:right; font-weight:bold;">{{ number_format($installmentPlan->monthly_amount, 2) }} AED</td>
                    </tr>
                    <tr style="font-size:16px; font-weight:bold; border-top: 1px solid #cbd5e1; color:#005f3d;">
                        <td style="padding: 10px 0;">Total Assessed Amount:</td>
                        <td style="padding: 10px 0; text-align:right;">{{ number_format($totalAmount, 2) }} AED</td>
                    </tr>
                </table>
            </div>

            <p>An official Installment Plan document showing the projected monthly schedule is attached to this email for your reference.</p>
            <p>Please note that installments are due monthly starting on the specified start date. If you have any questions or need further clarification regarding this plan, please contact our Finance Office.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Sheila Mae P. Dadula</strong><br>Finance Officer<br>+971 54 250 5401</p>
        </div>
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>&copy; M.A. Brain Development Center. All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>
