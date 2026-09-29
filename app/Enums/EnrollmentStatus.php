<?php

namespace App\Enums;

enum EnrollmentStatus: string
{
    case Inquiry = 'inquiry';
    case Registered = 'registered';
    case AwaitingDownpayment = 'awaiting_downpayment';
    case DownpaymentPaid = 'downpayment_paid';
    case ReadyForAdmission = 'ready_for_admission';
    case ContractSigned = 'contract_signed';
    case Admitted = 'admitted';
    case Enrolled = 'enrolled';
    case Withdrawn = 'withdrawn';
    case TransferredOut = 'transferred_out';

    public function label(): string
    {
        return match($this) {
            self::Inquiry => 'Inquiry',
            self::Registered => 'Registered',
            self::AwaitingDownpayment => 'Awaiting Downpayment',
            self::DownpaymentPaid => 'Downpayment Paid (Slot Reserved)',
            self::ReadyForAdmission => 'Ready for Admission',
            self::ContractSigned => 'Contract Signed',
            self::Admitted => 'Admitted',
            self::Enrolled => 'Enrolled',
            self::Withdrawn => 'Withdrawn',
            self::TransferredOut => 'Transferred Out',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Inquiry => 'slate',
            self::Registered => 'blue',
            self::AwaitingDownpayment => 'amber',
            self::DownpaymentPaid => 'emerald',
            self::ReadyForAdmission => 'indigo',
            self::ContractSigned => 'purple',
            self::Admitted => 'cyan',
            self::Enrolled => 'green',
            self::Withdrawn => 'rose',
            self::TransferredOut => 'red',
        };
    }
}
