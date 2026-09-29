import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

function amountToWords(amount: number): string {
    const num = Math.floor(amount);
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const scales = ['', 'THOUSAND', 'MILLION'];

    if (num === 0) return 'ZERO DIRHAMS ONLY';

    function helper(n: number): string {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + helper(n % 100) : '');
    }

    let result = '';
    let scaleIdx = 0;
    let temp = num;

    while (temp > 0) {
        const chunk = temp % 1000;
        if (chunk > 0) {
            const chunkStr = helper(chunk);
            result = chunkStr + (scales[scaleIdx] ? ' ' + scales[scaleIdx] : '') + (result ? ' ' + result : '');
        }
        temp = Math.floor(temp / 1000);
        scaleIdx++;
    }

    return result.trim() + ' DIRHAMS ONLY';
}

export default function Receipt({ receipt }: any) {
    const [sendingEmail, setSendingEmail] = React.useState(false);
    const [emailSent, setEmailSent] = React.useState(false);

    const payment = receipt.payment;
    const enrollment = payment.enrollment;
    const learner = enrollment.learner;

    // Computations for current payment
    const totalAmount = parseFloat(payment.amount || 0);
    const vatIncl = totalAmount * 0.05;
    const totalBeforeVat = totalAmount - vatIncl;

    // Computations for outstanding balance
    const totalBalance = parseFloat(receipt.current_balance || 0);
    const outstandingBeforeVat = totalBalance / 1.05;
    const outstandingVat = totalBalance - outstandingBeforeVat;

    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const handleEmailReceipt = () => {
        const effectiveEmail = learner?.receipt_email ||
            [learner?.mother_email, learner?.father_email].filter(Boolean)[0];
        if (!effectiveEmail) {
            alert('No email configured for this student. Please configure one on the Student Ledger page.');
            return;
        }

        setSendingEmail(true);
        router.post(route('finance.receipt.email', receipt.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setEmailSent(true);
                alert(`Tax Invoice emailed successfully to ${effectiveEmail}!`);
            },
            onFinish: () => setSendingEmail(false),
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 print:p-0 print:bg-white print:min-h-0">
            <Head title={`Tax Invoice - ${receipt.receipt_number}`} />

            {/* Back & Print controls - hidden in print mode */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
                <Link
                    href={route('learner-accounts.show', enrollment.id)}
                    className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                >
                    &larr; Back to Student Ledger
                </Link>
                <div className="flex gap-3">
                    <button
                        onClick={handleEmailReceipt}
                        disabled={sendingEmail}
                        className={`font-extrabold py-2.5 px-6 rounded-2xl shadow-sm transition flex items-center gap-2 border-2 cursor-pointer
                            ${emailSent
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'
                            }
                            disabled:opacity-50
                        `}
                    >
                        {sendingEmail ? (
                            <svg className="animate-spin w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : emailSent ? (
                            <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        )}
                        {emailSent ? 'Invoice Sent ✓ (Resend)' : 'Email Tax Invoice'}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-6 rounded-2xl shadow-sm transition"
                    >
                        Print Tax Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Sheet */}
            <div className="bg-white w-full max-w-4xl p-10 shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 flex flex-col justify-between" style={{ minHeight: '297mm' }}>
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1 max-w-xl">
                            <h1 className="text-3xl font-black tracking-wide text-slate-900 uppercase">Tax Invoice</h1>
                            <h2 className="text-lg font-black text-slate-800 uppercase">M.A. Brain Development Center</h2>
                            <p className="text-xs text-slate-500 leading-tight">
                                MAIN OFFICE: 3rd Floor, Office 303-304, Al Ferdous Tower, Al Salam St., Abu Dhabi, UAE<br />
                                Tel. No. 02-874-3277 | WhatsApp/Mobile: 050-6609942 | 054-3062631 | 056-6019379<br />
                                Email: info@mabraindevcenter.ae
                            </p>
                        </div>
                        <div className="flex flex-col items-end space-y-3">
                            <img src="/images/logo.jpg" alt="Logo" className="w-20 h-20 object-contain" />
                            <div className="text-right">
                                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">TRN: 104022449300003</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-900 my-4"></div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
                        <div className="flex border-b border-slate-200 pb-1.5 items-center">
                            <span className="font-bold text-slate-800 shrink-0 w-28">Invoice No.:</span>
                            <span className="font-semibold text-slate-900 truncate">{receipt.receipt_number}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1.5 items-center">
                            <span className="font-bold text-slate-800 shrink-0 w-28">Invoice Date:</span>
                            <span className="font-semibold text-slate-900">{formatDate(receipt.issued_date)}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1.5 items-center">
                            <span className="font-bold text-slate-800 shrink-0 w-28">Name of Payee:</span>
                            <span className="font-black text-slate-900 uppercase truncate">{learner.full_name}</span>
                        </div>
                        <div className="flex border-b border-slate-200 pb-1.5 items-center">
                            <span className="font-bold text-slate-800 shrink-0 w-48">Mode/Terms of Payment:</span>
                            <span className="font-bold text-slate-955 uppercase">
                                {payment.payment_method}
                                {payment.reference_number && ` (REF: ${payment.reference_number})`}
                            </span>
                        </div>
                    </div>

                    {/* Computations Table */}
                    <div className="border border-slate-900 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-900 text-xs font-bold text-slate-700 uppercase">
                                    <th className="px-4 py-3 border-r border-slate-900">Description</th>
                                    <th className="px-4 py-3 text-center border-r border-slate-900 w-16">Qty</th>
                                    <th className="px-4 py-3 text-right border-r border-slate-900 w-32">Amount (AED)</th>
                                    <th className="px-4 py-3 text-center border-r border-slate-900 w-24">Discount</th>
                                    <th className="px-4 py-3 text-right w-44">Amount Net of Discount (AED)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300 text-xs text-slate-800">
                                <tr className="align-top font-medium">
                                    <td className="px-4 py-3 border-r border-slate-900 leading-normal">
                                        {enrollment.level} - Tuition Payment ({enrollment.academic_year.name})
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-slate-900">1</td>
                                    <td className="px-4 py-3 text-right border-r border-slate-900">{formatter.format(totalBeforeVat)}</td>
                                    <td className="px-4 py-3 text-center border-r border-slate-900">—</td>
                                    <td className="px-4 py-3 text-right font-bold">{formatter.format(totalBeforeVat)}</td>
                                </tr>
                                {/* Empty Spacer Rows matching PDF aesthetics */}
                                <tr className="h-8">
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td></td>
                                </tr>
                                <tr className="h-8">
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td></td>
                                </tr>
                                <tr className="h-8">
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td className="border-r border-slate-900"></td>
                                    <td></td>
                                </tr>
                                <tr className="bg-slate-50 border-t border-slate-900 text-xs font-bold">
                                    <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider border-r border-slate-900">Total</td>
                                    <td className="px-4 py-3 text-right font-black text-sm">{formatter.format(totalBeforeVat)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Breakdown and Amount in Words */}
                    <div className="grid grid-cols-1 md:grid-cols-12 border border-slate-900 rounded-lg overflow-hidden mb-6">
                        <div className="md:col-span-7 p-4 border-r border-slate-900 flex flex-col justify-between bg-white">
                            <div>
                                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider mb-1">Total Amount in Words:</span>
                                <p className="text-xs font-extrabold text-slate-800 italic uppercase leading-relaxed">
                                    {amountToWords(totalAmount)}
                                </p>
                            </div>
                        </div>
                        <div className="md:col-span-5 divide-y divide-slate-900 text-xs">
                            <div className="flex justify-between p-3">
                                <span className="font-bold text-slate-700">Total before VAT</span>
                                <span className="font-bold text-slate-900">{formatter.format(totalBeforeVat)}</span>
                            </div>
                            <div className="flex justify-between p-3">
                                <span className="font-bold text-slate-700">VAT Incl.</span>
                                <span className="font-bold text-slate-900">{formatter.format(vatIncl)}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-slate-50 font-black text-slate-900 text-sm">
                                <span>Total</span>
                                <span>{formatter.format(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Balance Block (Highlighted Yellow) */}
                    <div className="border border-slate-900 rounded-lg overflow-hidden text-xs">
                        <div className="flex justify-between items-center p-3.5 border-b border-slate-900">
                            <span className="font-black text-slate-900 uppercase tracking-wide">Outstanding Balance:</span>
                            <span className="font-bold text-slate-800">{formatter.format(outstandingBeforeVat)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3.5 border-b border-slate-900">
                            <span className="font-black text-slate-900 uppercase tracking-wide">5 % VAT:</span>
                            <span className="font-bold text-slate-800">{formatter.format(outstandingVat)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-yellow-300/90 font-black text-sm">
                            <span className="uppercase text-slate-900">Total Balance:</span>
                            <span className="text-slate-950 text-base">{formatter.format(totalBalance)}</span>
                        </div>
                    </div>
                </div>

                {/* Signature Line */}
                <div className="flex justify-end pt-12">
                    <div className="text-center w-64">
                        <div className="border-b border-slate-800 w-full mb-1"></div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authorized Signatory</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
