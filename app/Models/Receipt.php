<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'receipt_number',
        'issued_date',
        'notes',
    ];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
