<?php

namespace App\Mail;

use App\Models\InstallmentPlan;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ParentInstallmentPlanMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public InstallmentPlan $installmentPlan,
        public $totalAmount
    ) {}

    private function getPhotoPath(): ?string
    {
        $photo = $this->installmentPlan->enrollment?->learner?->primaryPhoto;
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
        $learnerName = $this->installmentPlan->enrollment->learner->full_name;
        return new Envelope(
            from: new \Illuminate\Mail\Mailables\Address('finance@mabdc.org', 'MABDC Finance Dept'),
            subject: 'Approved Installment Payment Plan - ' . $learnerName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.installment_plan',
            with: [
                'photoPath' => $this->getPhotoPath(),
            ],
        );
    }

    public function attachments(): array
    {
        $pdf = Pdf::loadView('pdf.installment_plan', [
            'plan' => $this->installmentPlan,
            'totalAmount' => $this->totalAmount,
            'photoBase64' => $this->getPhotoBase64(),
        ]);

        $learnerName = str_replace(' ', '_', $this->installmentPlan->enrollment->learner->full_name);
        return [
            Attachment::fromData(fn () => $pdf->output(), 'Installment_Plan_' . $learnerName . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
