<?php

namespace App\Mail;

use App\Models\Enrollment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnrollmentContractMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Enrollment $enrollment,
        public string $pdfData
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "MABDC Student Enrollment Contract - {$this->enrollment->learner?->full_name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: "<p>Dear Parent / Guardian,</p>"
                . "<p>We are pleased to confirm that <strong>{$this->enrollment->learner?->full_name}</strong> has been officially admitted and enrolled for Grade Level <strong>{$this->enrollment->level}</strong> for Academic Year <strong>{$this->enrollment->academicYear?->name}</strong>.</p>"
                . "<p>Attached is your official copy of the <strong>Student Enrollment Contract</strong> for your records.</p>"
                . "<p>Warm regards,<br><strong>Mahardika Al-Islamia Basic Education Center (MABDC)</strong><br>Registrar & Finance Department</p>"
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfData, "Enrollment_Contract_{$this->enrollment->learner_id}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
