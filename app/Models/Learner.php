<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Learner extends Model
{
    use HasFactory;

    protected $fillable = [
        'household_id',
        'lrn',
        'full_name',
        'normalized_name',
        'birth_date',
        'gender',
        'mother_contact_number',
        'mother_maiden_name',
        'mother_email',
        'father_contact_number',
        'father_name',
        'father_email',
        'receipt_email',
        'philippine_address',
        'uae_address',
        'previous_school',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'metadata' => 'array',
        ];
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(LearnerPhoto::class);
    }

    public function primaryPhoto()
    {
        return $this->hasOne(LearnerPhoto::class)->where('primary_flag', true);
    }
}
