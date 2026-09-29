<?php

namespace App\Mail\Transport;

use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;
use Illuminate\Support\Facades\Http;

class MabdcApiTransport extends AbstractTransport
{
    public function __construct(
        private string $apiKey,
        private string $apiUrl = 'https://api-mail.mabdc.com/v1/emails',
        private string $fromAddress = 'noreply@mabdc.org',
        private string $fromName = 'MABDC School',
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        // Resolve "To" addresses
        $to = collect($email->getTo())
            ->map(fn (Address $a) => $a->getAddress())
            ->filter()
            ->values()
            ->all();

        // Build CC / BCC if present
        $cc = collect($email->getCc())
            ->map(fn (Address $a) => $a->getAddress())
            ->filter()
            ->values()
            ->all();

        // Build from field
        $fromName    = $email->getFrom()[0]?->getName() ?: $this->fromName;
        $fromAddress = $email->getFrom()[0]?->getAddress() ?: $this->fromAddress;

        // Override if from domain is wrong — API only accepts @mabdc.org senders
        if (!str_ends_with($fromAddress, '@mabdc.org')) {
            $fromAddress = $this->fromAddress;
        }

        $from = $fromName ? "{$fromName} <{$fromAddress}>" : $fromAddress;

        // Gather attachments
        $attachments = [];
        foreach ($email->getAttachments() as $attachment) {
            $attachments[] = [
                'filename' => $attachment->getPreparedHeaders()->getHeaderParameter('Content-Disposition', 'filename'),
                'content'  => base64_encode($attachment->getBody()),
            ];
        }

        $payload = [
            'from'    => $from,
            'to'      => $to,
            'subject' => $email->getSubject(),
            'html'    => $email->getHtmlBody() ?? $email->getTextBody(),
        ];

        if (!empty($cc)) {
            $payload['cc'] = $cc;
        }

        if (!empty($attachments)) {
            $payload['attachments'] = $attachments;
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(15)
            ->post($this->apiUrl, $payload);

        if ($response->failed()) {
            throw new \RuntimeException(
                'MABDC Mail API error (' . $response->status() . '): ' . $response->body()
            );
        }
    }

    public function __toString(): string
    {
        return 'mabdc-api';
    }
}
