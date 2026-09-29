<?php

namespace App\Http\Controllers;

use App\Models\Learner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    /**
     * Display a listing of available certificates.
     */
    public function index(Request $request)
    {
        $learners = Learner::select('id', 'first_name', 'last_name', 'middle_name', 'lrn')->get();
        return Inertia::render('Certificates/Index', [
            'learners' => $learners,
        ]);
    }

    /**
     * Generate the requested certificate.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'learner_id' => 'required|exists:learners,id',
            'type' => 'required|in:enrollment,good_moral',
        ]);

        $learner = Learner::findOrFail($request->learner_id);
        $type = $request->type;
        $date = now()->format('F j, Y');

        $data = [
            'learner' => $learner,
            'type' => $type,
            'date' => $date,
        ];

        // Using a standard view to display the certificate for printing
        return view('certificates.template', $data);
    }
}
