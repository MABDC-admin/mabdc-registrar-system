<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenRouterService
{
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = env('OPENROUTER_API_KEY', '');
        $this->model = env('OPENROUTER_MODEL', 'google/gemini-flash-1.5');
    }

    /**
     * Send document to OpenRouter to identify details.
     *
     * @param string $base64Data File base64 content
     * @param string $mimeType File MIME type
     * @param string $studentName Full name of the student
     * @param string $expectedDocType Expected Document Type label
     * @return array|null
     */
    public function analyzeDocument(string $base64Data, string $mimeType, string $studentName, string $expectedDocType): ?array
    {
        if (empty($this->apiKey)) {
            Log::error('OpenRouter API key is not configured.');
            return null;
        }

        try {
            $prompt = "You are an AI assistant in a school registrar system. You are verifying a document uploaded for student '$studentName'.\n" .
                      "The expected document type is '$expectedDocType'.\n\n" .
                      "Analyze the uploaded document image or file and return a JSON object with the following fields:\n" .
                      "- document_type: classify as one of ['school_credentials', 'birth_certificate', 'passport', 'visa', 'emirates_id']\n" .
                      "- match_status: boolean (true if the document details/name match the student '$studentName', false otherwise)\n" .
                      "- student_name_on_document: string (extracted name from the document)\n" .
                      "- expires_on: string in format 'YYYY-MM-DD' (if an expiration date is found on the document, e.g. for Emirates ID, Passport, or Visa; otherwise null)\n" .
                      "- notes: short description of what was verified or if there are any discrepancies.\n\n" .
                      "IMPORTANT: Return ONLY valid JSON. Do not wrap in markdown codeblocks.";

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => 'http://localhost:8002',
                'X-Title' => 'MABDC Registrar System',
            ])->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => $this->model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $prompt
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:$mimeType;base64,$base64Data"
                                ]
                            ]
                        ]
                    ]
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

            if ($response->failed()) {
                Log::error('OpenRouter request failed: ' . $response->body());
                return null;
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if ($content) {
                // Strip possible markdown backticks just in case
                $cleanContent = trim(preg_replace('/^```json|```$/', '', trim($content)));
                return json_decode($cleanContent, true);
            }
        } catch (\Exception $e) {
            Log::error('Exception in OpenRouterService: ' . $e->getMessage());
        }

        return null;
    }
}
