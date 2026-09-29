<?php

namespace App\Models;

use App\Enums\ApplicationClassification;
use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AdmissionApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'academic_year_id',
        'learner_id',
        'first_name',
        'last_name',
        'middle_name',
        'date_of_birth',
        'email',
        'contact_number',
        'level_applied_for',
        'classification',
        'status',
        'metadata',
    ];

    protected $appends = [
        'full_name',
        'previous_balance',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'classification' => ApplicationClassification::class,
            'status' => ApplicationStatus::class,
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (AdmissionApplication $application) {
            if (empty($application->uuid)) {
                $application->uuid = (string) Str::uuid();
            }
        });
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function learner(): BelongsTo
    {
        return $this->belongsTo(Learner::class);
    }
    
    public function getFullNameAttribute(): string
    {
        $first = trim($this->attributes['first_name'] ?? '');
        $middle = trim($this->attributes['middle_name'] ?? '');
        $last = trim($this->attributes['last_name'] ?? '');

        $parts = array_filter([$first, $middle, $last]);
        $name = implode(' ', $parts);

        return $name !== '' ? $name : ('Applicant #' . ($this->attributes['id'] ?? ''));
    }

    public function getPreviousBalanceAttribute(): float
    {
        $first = trim($this->attributes['first_name'] ?? '');
        $last = trim($this->attributes['last_name'] ?? '');
        $nameClean = preg_replace('/\s+/', ' ', trim(preg_replace('/[^A-Z0-9]+/', ' ', strtoupper("{$first} {$last}"))));

        $email = $this->attributes['email'] ?? null;
        $contactNumber = $this->attributes['contact_number'] ?? null;

        if (empty($nameClean) && empty($email) && empty($contactNumber)) {
            return 0.0;
        }

        $learnerIds = Learner::query()
            ->where(function ($q) use ($nameClean, $email, $contactNumber) {
                if (!empty($nameClean)) {
                    $q->where('normalized_name', 'like', "%{$nameClean}%")
                      ->orWhereRaw("UPPER(full_name) LIKE ?", ["%{$nameClean}%"]);
                }

                if (!empty($email)) {
                    $q->orWhere('mother_email', $email)
                      ->orWhere('father_email', $email)
                      ->orWhere('receipt_email', $email);
                }

                if (!empty($contactNumber)) {
                    $q->orWhere('mother_contact_number', $contactNumber)
                      ->orWhere('father_contact_number', $contactNumber);
                }
            })
            ->pluck('id');

        if ($learnerIds->isEmpty()) {
            return 0.0;
        }

        $previousEnrollments = Enrollment::whereIn('learner_id', $learnerIds)
            ->withSum('financeLedgers as balance', 'amount')
            ->get();

        $totalPreviousBalance = 0.0;
        foreach ($previousEnrollments as $enrollment) {
            $bal = (float) ($enrollment->balance ?? 0);
            if ($bal > 0) {
                $totalPreviousBalance += $bal;
            }
        }

        return $totalPreviousBalance;
    }
}
