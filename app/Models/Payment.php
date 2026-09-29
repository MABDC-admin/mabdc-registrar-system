<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'amount',
        'payment_method',
        'reference_number',
        'status',
        'transaction_date',
        'processed_by',
        'remarks',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function receipt()
    {
        return $this->hasOne(Receipt::class);
    }
}
