<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeLevelFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'grade_level',
        'base_tuition',
        'mode',
    ];
}
