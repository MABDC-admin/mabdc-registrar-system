<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearnerPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'learner_id',
        'filename',
        'mime_type',
        'bytes',
        'sha256',
        'primary_flag',
        'uploaded_by',
    ];

    protected $casts = [
        'primary_flag' => 'boolean',
    ];

    public function learner(): BelongsTo
    {
        return $this->belongsTo(Learner::class);
    }
}
