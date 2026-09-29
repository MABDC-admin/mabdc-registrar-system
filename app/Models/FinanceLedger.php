<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinanceLedger extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'type',
        'description',
        'amount',
        'transaction_date',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    public function enrollment()
    {
        return $this->belongsTo(\App\Models\Enrollment::class);
    }
}
