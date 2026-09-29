import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function InstallmentPlan({ plan, totalAmount, installments = [] }: any) {
    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const renderStatusBadge = (status: string, paidDate: string | null) => {
        switch (status) {
            case 'paid_on_time':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Paid (On Time)
                    </span>
                );
            case 'paid_delayed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Paid Late {paidDate ? `(${formatDate(paidDate)})` : ''}
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        Overdue
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                        Pending
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 print:p-0 print:bg-white print:min-h-0">
            <Head title={`Installment Plan - ${plan.learner_name}`} />

            {/* Back & Print controls - hidden in print mode */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
                <Link
                    href={route('learner-accounts.show', plan.enrollment_id)}
                    className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                >
                    &larr; Back to Student Ledger
                </Link>
                <button
                    onClick={() => window.print()}
                    className="bg-[#002b80] hover:bg-[#004d31] text-white font-extrabold py-2.5 px-6 rounded-2xl shadow-sm transition"
                >
                    Print Installment Plan
                </button>
            </div>

            {/* Plan Sheet */}
            <div className="bg-white w-full max-w-4xl p-10 shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 flex flex-col justify-between" style={{ minHeight: '297mm' }}>
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1 max-w-xl">
                            <h1 className="text-3xl font-black tracking-wide text-slate-900 uppercase">Installment Agreement</h1>
                            <h2 className="text-lg font-black text-[#002b80] uppercase">M.A. Brain Development Center</h2>
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

                    <div className="border-t-2 border-slate-900 my-4"></div>

                    {/* Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                        <div>
                            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider mb-1">Learner Details</span>
                            <h3 className="text-lg font-extrabold text-[#002b80] uppercase mb-2">{plan.learner_name}</h3>
                            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                                <div><strong>LRN:</strong> {plan.lrn || 'Unassigned'}</div>
                                <div><strong>Grade Level:</strong> {plan.grade_level}</div>
                                <div><strong>Section:</strong> {plan.section || 'Unassigned'}</div>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider mb-1">Installment Plan Details</span>
                            <div className="text-xs text-slate-600 space-y-1 leading-relaxed mt-2">
                                <div><strong>Academic Year:</strong> {plan.academic_year}</div>
                                <div><strong>Total Duration:</strong> {plan.total_months} Months</div>
                                <div><strong>Plan Start Date:</strong> {formatDate(plan.start_date)}</div>
                                <div><strong>Monthly Installment:</strong> {formatter.format(plan.monthly_amount)} AED</div>
                            </div>
                        </div>
                    </div>

                    {/* Projected Schedule Table */}
                    <div className="border border-[#002b80] rounded-xl overflow-hidden mb-8">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#002b80] text-xs font-bold text-white uppercase">
                                    <th className="px-5 py-3.5">Installment #</th>
                                    <th className="px-5 py-3.5">Due Date</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Payment Progress (AED)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                                {installments.map((inst: any) => (
                                    <tr key={inst.month_index} className="hover:bg-slate-50/50 transition">
                                        <td className="px-5 py-3.5 font-bold">Month {inst.month_index}</td>
                                        <td className="px-5 py-3.5">{formatDate(inst.due_date)}</td>
                                        <td className="px-5 py-3.5">{renderStatusBadge(inst.status, inst.paid_date)}</td>
                                        <td className="px-5 py-3.5 text-right font-black">
                                            {inst.amount_paid < inst.amount ? (
                                                <span className="text-slate-500 font-normal mr-2">
                                                    ({formatter.format(inst.amount_paid)} paid)
                                                </span>
                                            ) : null}
                                            {formatter.format(inst.amount)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-black text-sm text-[#002b80]">
                                    <td colSpan={3} className="px-5 py-4 text-left uppercase tracking-wider">Total Plan Amount</td>
                                    <td className="px-5 py-4 text-right">{formatter.format(totalAmount)} AED</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between pt-16">
                    <div className="text-center w-64">
                        <div className="border-b border-slate-800 w-full mb-1"></div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Parent / Guardian Signature</span>
                    </div>
                    <div className="text-center w-64">
                        <div className="border-b border-slate-800 w-full mb-1"></div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Authorized Signatory</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
