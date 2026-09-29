<?php

namespace App\Mail;

use App\Models\Enrollment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ParentStatementMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Enrollment $enrollment,
        public $totalFees,
        public $totalPayments,
        public $totalDiscounts,
        public $balance
    ) {}

    private function getPhotoPath(): ?string
    {
        $photo = $this->enrollment->learner?->primaryPhoto;
        if ($photo && file_exists(storage_path('app/public/' . $photo->filename))) {
            return storage_path('app/public/' . $photo->filename);
        }
        return null;
    }

    private function getPhotoBase64(): ?string
    {
        $photoPath = $this->getPhotoPath();
        if ($photoPath) {
            $type = pathinfo($photoPath, PATHINFO_EXTENSION);
            $data = file_get_contents($photoPath);
            return 'data:image/' . $type . ';base64,' . base64_encode($data);
        }
        return null;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address('finance@mabdc.org', 'MABDC Finance Dept'),
            subject: 'MABDC Learner Statement of Account - ' . $this->enrollment->learner->full_name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.statement',
            with: [
                'photoPath' => $this->getPhotoPath(),
            ]
        );
    }

    public function attachments(): array
    {
        $pdf = Pdf::loadView('pdf.statement', [
            'enrollment' => $this->enrollment,
            'totalFees' => $this->totalFees,
            'totalPayments' => $this->totalPayments,
            'totalDiscounts' => $this->totalDiscounts,
            'balance' => $this->balance,
            'photoBase64' => $this->getPhotoBase64(),
        ]);

        return [
            Attachment::fromData(fn () => $pdf->output(), 'Statement_of_Account.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
