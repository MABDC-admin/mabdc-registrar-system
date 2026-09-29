<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_year_id',
        'learner_id',
        'section_id',
        'level',
        'status',
        'financial_status',
        'registration_settled',
        'registration_settled_at',
        'registration_settled_by',
        'session',
        'session_slot_reserved',
        'downpayment_verified_at',
        'downpayment_receipt_no',
        'capacity_waitlisted',
        'enrolled_on',
        'metadata',
        'mode',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_on' => 'date',
            'downpayment_verified_at' => 'datetime',
            'registration_settled_at' => 'datetime',
            'registration_settled' => 'boolean',
            'session_slot_reserved' => 'boolean',
            'capacity_waitlisted' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function registrationSettledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registration_settled_by');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function learner(): BelongsTo
    {
        return $this->belongsTo(Learner::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function documentRequirements(): HasMany
    {
        return $this->hasMany(DocumentRequirement::class);
    }

    public function financeLedgers(): HasMany
    {
        return $this->hasMany(FinanceLedger::class);
    }

    public function installmentPlans(): HasMany
    {
        return $this->hasMany(InstallmentPlan::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function receipts()
    {
        return $this->hasManyThrough(Receipt::class, Payment::class);
    }

    public function scopeActiveYear($query)
    {
        $activeYear = AcademicYear::where('is_active', true)->first();
        if ($activeYear) {
            $query->where('academic_year_id', $activeYear->id);
        }
    }
}
