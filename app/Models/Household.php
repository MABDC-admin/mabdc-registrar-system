<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Household extends Model
{
    use HasFactory;

    protected $fillable = [
        'household_code',
        'family_name',
        'primary_contact_name',
        'primary_email',
        'primary_phone',
        'address',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function learners(): HasMany
    {
        return $this->hasMany(Learner::class);
    }

    public function enrollments()
    {
        return $this->hasManyThrough(Enrollment::class, Learner::class);
    }
}
