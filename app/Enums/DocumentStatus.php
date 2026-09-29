<?php

namespace App\Enums;

enum DocumentStatus: string
{
    case Ok = 'ok';
    case Submitted = 'submitted';
    case PendingVerification = 'pending_verification';
    case Verified = 'verified';
    case Missing = 'missing';
    case Expired = 'expired';
    case PendingReview = 'pending_review';
    case NotApplicable = 'not_applicable';
}
