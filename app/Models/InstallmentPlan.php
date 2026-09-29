<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InstallmentPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'enrollment_id',
        'total_months',
        'monthly_amount',
        'start_date',
    ];

    protected $casts = [
        'start_date' => 'date',
    ];

    public function enrollment()
    {
        return $this->belongsTo(\App\Models\Enrollment::class);
    }
}
