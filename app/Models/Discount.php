<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'enrollment_id',
        'name',
        'type',
        'amount_type',
        'value',
        'status',
        'approved_by_id',
    ];

    protected $casts = [
        'value' => 'decimal:2',
    ];

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }
}
