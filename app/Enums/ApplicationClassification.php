<?php

namespace App\Enums;

enum ApplicationClassification: string
{
    case New = 'new';
    case Returning = 'returning';
    case Transferee = 'transferee';

    public function label(): string
    {
        return match($this) {
            self::New => 'New',
            self::Returning => 'Returning',
            self::Transferee => 'Transferee',
        };
    }
}
