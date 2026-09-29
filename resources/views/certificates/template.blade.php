<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate - {{ $learner->first_name }} {{ $learner->last_name }}</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            padding: 40px;
            color: #333;
            background-color: #fff;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 10px solid #1a365d;
            padding: 50px;
            position: relative;
        }
        .header {
            text-align: center;
            margin-bottom: 50px;
        }
        .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #1a365d;
            text-transform: uppercase;
            margin: 0 0 10px 0;
        }
        .school-address {
            font-size: 14px;
            margin: 0;
        }
        .title {
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            margin: 40px 0;
            text-transform: uppercase;
            color: #2d3748;
        }
        .content {
            font-size: 18px;
            line-height: 2;
            text-align: justify;
            margin-bottom: 50px;
        }
        .student-name {
            font-weight: bold;
            font-size: 22px;
            text-transform: uppercase;
            text-decoration: underline;
        }
        .footer {
            margin-top: 100px;
            display: flex;
            justify-content: space-between;
        }
        .signature-line {
            width: 250px;
            border-top: 1px solid #333;
            text-align: center;
            padding-top: 10px;
        }
        .date {
            margin-bottom: 50px;
        }
        @media print {
            body {
                padding: 0;
            }
            .container {
                border: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="container">
        <div class="header">
            <h1 class="school-name">Global International School</h1>
            <p class="school-address">123 Education Boulevard, Knowledge City, 12345</p>
        </div>

        @if($type === 'enrollment')
            <div class="title">Certificate of Enrollment</div>
            <div class="content">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                <p>This is to certify that <span class="student-name">{{ $learner->first_name }} {{ $learner->middle_name }} {{ $learner->last_name }}</span> (LRN: {{ $learner->lrn }}) is officially enrolled in this institution for the current academic year.</p>
                <p>This certification is issued upon the request of the interested party for whatever legal purpose it may serve.</p>
            </div>
        @elseif($type === 'good_moral')
            <div class="title">Certificate of Good Moral Character</div>
            <div class="content">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                <p>This is to certify that <span class="student-name">{{ $learner->first_name }} {{ $learner->middle_name }} {{ $learner->last_name }}</span> (LRN: {{ $learner->lrn }}) is a student of this institution.</p>
                <p>During their stay in this school, they have shown good moral character and have not been subjected to any disciplinary action for violation of school rules and regulations.</p>
                <p>This certification is being issued upon their request for whatever legal purpose it may serve.</p>
            </div>
        @endif

        <div class="date">
            <p>Given this <strong>{{ $date }}</strong>.</p>
        </div>

        <div class="footer">
            <div style="flex-grow: 1;"></div>
            <div class="signature-line">
                <strong>School Registrar</strong><br>
                Authorized Signature
            </div>
        </div>
    </div>
</body>
</html>
