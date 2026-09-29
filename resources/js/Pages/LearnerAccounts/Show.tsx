import React, { useState, useEffect } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';

export default function Show({ enrollment, emailedReceiptIds = [], statementSent = false, installmentEmailed = false, pendingPastBalance = 0, activePlanInstallments = null }: any) {
    const getStatusColors = (status: string) => {
        switch (status) {
            case 'paid_on_time':
                return {
                    bg: 'bg-emerald-50/70 border-emerald-200',
                    iconBg: 'bg-emerald-100 text-emerald-800',
                    label: 'Paid (On Time)'
                };
            case 'paid_delayed':
                return {
                    bg: 'bg-amber-50/70 border-amber-200',
                    iconBg: 'bg-amber-100 text-amber-800',
                    label: 'Paid Late'
                };
            case 'overdue':
                return {
                    bg: 'bg-rose-50 border-rose-200 animate-pulse',
                    iconBg: 'bg-rose-100 text-rose-800',
                    label: 'Overdue'
                };
            case 'pending':
            default:
                return {
                    bg: 'bg-white border-slate-200',
                    iconBg: 'bg-slate-100 text-slate-500',
                    label: 'Pending'
                };
        }
    };

    const [actionType, setActionType] = useState<'charge' | 'payment' | 'discount' | 'installment' | 'refund' | 'assess' | 'edit-ledger' | null>(null);
    const [editingLedgerId, setEditingLedgerId] = useState<number | null>(null);
    const [showInstallments, setShowInstallments] = useState<boolean>(false);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [sendingReceiptEmailId, setSendingReceiptEmailId] = useState<number | null>(null);
    const [editingReceiptEmail, setEditingReceiptEmail] = useState(false);
    const [receiptEmailValue, setReceiptEmailValue] = useState(enrollment.receipt_email || '');
    const [savingReceiptEmail, setSavingReceiptEmail] = useState(false);
    const [sendingInstallmentPlan, setSendingInstallmentPlan] = useState(false);

    useEffect(() => {
        setReceiptEmailValue(enrollment.receipt_email || '');
    }, [enrollment.receipt_email]);

    const handleEmailReceipt = (receiptId: number) => {
        const effectiveEmail = enrollment.receipt_email ||
            [enrollment.learner?.mother_email, enrollment.learner?.father_email].filter(Boolean)[0];
        if (!effectiveEmail) {
            alert('No email configured for this student. Please add a Receipt Email below.');
            return;
        }

        setSendingReceiptEmailId(receiptId);
        router.post(route('finance.receipt.email', receiptId), {}, {
            preserveScroll: true,
            onFinish: () => setSendingReceiptEmailId(null),
        });
    };

    const handleEmailStatement = () => {
        const effectiveEmail = enrollment.receipt_email ||
            [enrollment.learner?.mother_email, enrollment.learner?.father_email].filter(Boolean)[0];
        if (!effectiveEmail) {
            alert('No email configured for this student. Please add a Receipt Email below.');
            return;
        }
        
        setSendingEmail(true);
        router.post(route('learner-accounts.email-statement', enrollment.id), {}, {
            preserveScroll: true,
            onFinish: () => setSendingEmail(false),
        });
    };

    const handleEmailInstallmentPlan = (planId: number) => {
        const effectiveEmail = enrollment.receipt_email ||
            [enrollment.learner?.mother_email, enrollment.learner?.father_email].filter(Boolean)[0];
        if (!effectiveEmail) {
            alert('No email configured for this student. Please add a Receipt Email below.');
            return;
        }

        setSendingInstallmentPlan(true);
        router.post(route('learner-accounts.installment.email', planId), {}, {
            preserveScroll: true,
            onFinish: () => setSendingInstallmentPlan(false),
        });
    };

    const handleSaveReceiptEmail = () => {
        setSavingReceiptEmail(true);
        router.patch(route('learner-accounts.update-receipt-email', enrollment.id), {
            receipt_email: receiptEmailValue || null,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setSavingReceiptEmail(false);
                setEditingReceiptEmail(false);
            },
        });
    };

    const handleToggleMode = (newMode: string) => {
        if (confirm(`Change study mode to ${newMode === 'face_to_face' ? 'Face to Face' : 'Online'}? (Note: If this student has already been assessed, you may need to manually adjust or re-assess their ledger.)`)) {
            router.post(route('learner-accounts.toggle-mode', enrollment.id), {
                mode: newMode
            }, {
                preserveScroll: true
            });
        }
    };

    // Form for generic actions
    const { data, setData, post, put, processing, errors, reset } = useForm({
        amount: '',
        description: '', // for charges
        method: 'Cash', // for payments
        receipt_number: '', // for payments
        reference_number: '', // for payments (optional)
        type: 'Employee Discount (50%)', // for discounts
        discount_mode: 'fixed', // for discounts: 'fixed' or 'percent'
        percent: '', // for discounts
        transaction_date: new Date().toISOString().split('T')[0],
        total_months: '9', // for installments
        start_date: new Date().toISOString().split('T')[0], // for installments
        reason: '', // for refunds
        mode: '', // study mode selector
        apply_vat: true, // for charges: toggle 5% VAT
    });

    const closeModal = () => {
        setActionType(null);
        setEditingLedgerId(null);
        reset();
    };

    const submitAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (actionType === 'edit-ledger' && editingLedgerId) {
            put(route('learner-accounts.ledgers.update', [enrollment.id, editingLedgerId]), {
                onSuccess: () => closeModal(),
            });
            return;
        }
        let routeName = `learner-accounts.${actionType}`;
        if (actionType === 'installment') {
            routeName = 'learner-accounts.installment.store';
        } else if (actionType === 'assess') {
            routeName = 'learner-accounts.assess-tuition';
        }
        post(route(routeName, enrollment.id), {
            onSuccess: () => closeModal(),
        });
    };

    const handleEditLedger = (ledger: any) => {
        setEditingLedgerId(ledger.id);
        setData({
            ...data,
            amount: Math.abs(parseFloat(ledger.amount)).toString(),
            description: ledger.description,
            transaction_date: ledger.transaction_date.split('T')[0],
        });
        setActionType('edit-ledger');
    };

    const handleDeleteLedger = (ledgerId: number) => {
        if (confirm('Are you sure you want to delete this ledger entry? This action cannot be undone.')) {
            router.delete(route('learner-accounts.ledgers.destroy', [enrollment.id, ledgerId]));
        }
    };

    const getReceiptId = (item: any) => {
        const match = item.description.match(/Receipt:\s*([^|)]+)/);
        if (match && enrollment.receipts) {
            const rcptNum = match[1].trim();
            const receipt = enrollment.receipts.find((r: any) => r.receipt_number.trim() === rcptNum);
            return receipt ? receipt.id : null;
        }
        return null;
    };


    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Student Ledger</h2>
                        <p className="text-xs text-slate-400 font-semibold">Statement of account &amp; transactions</p>
                    </div>
                </div>
            }
        >
            <Head title={`Ledger - ${enrollment.learner_name}`} />

            <div className="py-12">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="mb-4">
                        <Link href={route('learner-accounts.index')} className="text-[#002b80] hover:underline font-bold flex items-center gap-1">&larr; Back to Learner Accounts</Link>
                    </div>

                    {pendingPastBalance !== 0 && (
                        <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-xs ${
                            pendingPastBalance > 0 
                                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                                pendingPastBalance > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm uppercase tracking-wider">
                                    {pendingPastBalance > 0 ? 'Previous Balance Outstanding' : 'Previous Overpayment Credit Available'}
                                </h4>
                                <p className="text-xs mt-1 font-semibold leading-relaxed">
                                    {pendingPastBalance > 0 
                                        ? `This learner has an unpaid balance of AED ${Math.abs(pendingPastBalance).toLocaleString(undefined, {minimumFractionDigits: 2})} from previous academic years.` 
                                        : `This learner has an overpayment credit of AED ${Math.abs(pendingPastBalance).toLocaleString(undefined, {minimumFractionDigits: 2})} from previous academic years.`
                                    }
                                    {enrollment.financial_status === 'No Assessment' && (
                                        <span className="block mt-1.5 font-bold">
                                            This balance will be carried forward automatically when you click the "Assess Tuition Fee" button below.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Summary Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col xl:flex-row gap-6 items-center justify-between border-l-[6px] border-[#002b80]">
                        {/* Student profile info */}
                        <div className="flex items-center gap-5 w-full xl:w-auto">
                            <div className="w-36 h-36 rounded-full bg-green-50 border-4 border-[#002b80]/20 flex items-center justify-center text-5xl font-black text-[#002b80] shrink-0 overflow-hidden shadow-md">
                                {enrollment.photo_url ? (
                                    <img src={enrollment.photo_url} alt={enrollment.learner_name} className="h-full w-full object-cover" />
                                ) : (
                                    enrollment.learner_name?.charAt(0)
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{enrollment.learner_name}</h3>
                                <p className="text-sm font-semibold text-slate-500">
                                    {enrollment.academic_year} &bull; {enrollment.grade_level} &bull; LRN: <span className="font-bold text-slate-700">{enrollment.lrn}</span>
                                </p>
                                <div className="pt-1.5 flex items-center gap-3">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border
                                        ${enrollment.financial_status === 'Cleared' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : enrollment.financial_status === 'Partially Paid'
                                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                : enrollment.financial_status === 'Unpaid'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}
                                    >
                                        Status: {enrollment.financial_status}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                        <span>Mode:</span>
                                        <select
                                            value={enrollment.mode || 'face_to_face'}
                                            onChange={(e) => handleToggleMode(e.target.value)}
                                            className="bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded px-2 py-0.5 focus:ring-[#002b80] focus:border-[#002b80] h-7"
                                        >
                                            <option value="face_to_face">Face to Face</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Four side-by-side financial status cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full xl:w-auto">
                            {/* Gross Fees */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-[#e2f0d9] flex items-center justify-center text-[#385723] shrink-0">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.659-1.591V7.5a2.25 2.25 0 00-2.25-2.25h-3.167c-.597 0-1.17-.237-1.591-.659l-1.135-1.135a2.25 2.25 0 00-3.182 0L7.674 4.591a2.25 2.25 0 01-1.591.659H2.916a2.25 2.25 0 00-2.25 2.25v3.167c0 .597-.237 1.17-.659 1.591l-1.135 1.135a2.25 2.25 0 000 3.182l1.135 1.135c.422.422.659.994.659 1.591v3.167a2.25 2.25 0 002.25 2.25h3.167c.597 0 1.17.237 1.591.659l1.135 1.135a2.25 2.25 0 003.182 0l1.135-1.135a2.25 2.25 0 011.591-.659h3.167a2.25 2.25 0 002.25-2.25v-3.167c0-.597.237-1.17.659-1.591l1.135-1.135a2.25 2.25 0 000-3.182z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-xs font-black text-slate-400 block tracking-wider uppercase">Gross Fees</span>
                                    <span className="text-xl font-black text-slate-800">AED {parseFloat(enrollment.total_fees || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Discounts */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-[#e2f0d9] flex items-center justify-center text-[#385723] shrink-0">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.42 1.42 0 002.008 0l4.437-4.437a1.42 1.42 0 000-2.008L10.16 3.659A2.25 2.25 0 009.568 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-xs font-black text-slate-400 block tracking-wider uppercase">Discounts</span>
                                    <span className="text-xl font-black text-slate-800">AED {parseFloat(enrollment.total_discounts || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Payments */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-[#e2f0d9] flex items-center justify-center text-[#385723] shrink-0">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-xs font-black text-slate-400 block tracking-wider uppercase">Payments</span>
                                    <span className="text-xl font-black text-slate-800">AED {parseFloat(enrollment.total_payments || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Outstanding Balance */}
                            <div className="bg-[#fdf2f2] rounded-xl border border-[#f8b4b4] p-5 flex items-center gap-4 shadow-xs">
                                <div className="w-12 h-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#9b1c1c] shrink-0">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-xs font-black text-red-500 block tracking-wider uppercase">Outstanding Balance</span>
                                    <span className="text-xl font-black text-red-600">AED {parseFloat(enrollment.balance).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipt Email Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-green-50 border border-[#002b80]/20 flex items-center justify-center text-[#002b80]">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Receipt Email</span>
                        </div>

                        {editingReceiptEmail ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="email"
                                    value={receiptEmailValue}
                                    onChange={e => setReceiptEmailValue(e.target.value)}
                                    placeholder="e.g. parent@email.com"
                                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002b80]/40 focus:border-[#002b80]"
                                />
                                <button
                                    onClick={handleSaveReceiptEmail}
                                    disabled={savingReceiptEmail}
                                    className="bg-[#002b80] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-[#004d31] disabled:opacity-60 transition"
                                >
                                    {savingReceiptEmail ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                    onClick={() => { setEditingReceiptEmail(false); setReceiptEmailValue(enrollment.receipt_email || ''); }}
                                    className="text-slate-500 hover:text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 flex-1">
                                {enrollment.receipt_email ? (
                                    <span className="text-sm font-semibold text-slate-800">{enrollment.receipt_email}</span>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">No receipt email set — will use parent contacts</span>
                                )}
                                <button
                                    onClick={() => setEditingReceiptEmail(true)}
                                    className="ml-auto text-xs text-[#002b80] font-bold border border-[#002b80]/30 px-3 py-1 rounded-lg hover:bg-green-50 transition"
                                >
                                    {enrollment.receipt_email ? 'Edit' : '+ Add Email'}
                                </button>
                            </div>
                        )}
                    </div>


                    <div className="flex flex-wrap gap-3 items-center">
                        {!enrollment.registration_settled ? (
                            <button 
                                onClick={() => {
                                    if (confirm('Mark this learner registration as Settled & Approved? Parent will be instructed to proceed to Registrar for contract signing & final admission.')) {
                                        router.post(route('learner-accounts.mark-registration-settled', enrollment.id));
                                    }
                                }}
                                className="bg-[#002b80] hover:bg-[#001746] text-[#ffc000] font-black text-xs uppercase px-5 py-3 rounded-xl shadow-xs transition flex items-center gap-2 border border-[#ffc000]"
                            >
                                <svg className="w-4 h-4 text-[#ffc000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ✓ Mark Registration Settled & Approved
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs px-4 py-2.5 rounded-xl">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Registration Settled & Approved by Finance
                            </span>
                        )}
                        {enrollment.financial_status === 'No Assessment' && (
                            <button 
                                onClick={() => {
                                    setData('mode', enrollment.mode || 'face_to_face');
                                    setActionType('assess');
                                }} 
                                className="bg-[#002b80] hover:bg-[#004d31] text-white font-extrabold text-xs uppercase px-5 py-3 rounded-lg shadow-sm transition flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Assess Tuition Fee
                            </button>
                        )}
                        
                        <button 
                            onClick={() => setActionType('payment')} 
                            className="bg-[#002b80] hover:bg-[#004d31] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase px-5 py-3 rounded-lg shadow-sm transition flex items-center gap-2"
                            disabled={parseFloat(enrollment.balance) <= 0}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Record Payment
                        </button>

                        <button 
                            onClick={() => setActionType('discount')}
                            className="bg-white border-2 border-[#002b80] text-[#002b80] hover:bg-green-50 font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={parseFloat(enrollment.balance) <= 0 || enrollment.financial_status === 'Cleared'}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Apply Discount
                        </button>

                        <button 
                            onClick={() => setActionType('refund')} 
                            className="bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                            Issue Refund
                        </button>

                        <button 
                            onClick={() => setActionType('installment')}
                            className="bg-white border-2 border-[#002b80] text-[#002b80] hover:bg-green-50 font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Generate Installment Plan
                        </button>

                        <button 
                            onClick={() => setActionType('charge')}
                            className="bg-white border-2 border-[#002b80] text-[#002b80] hover:bg-green-50 font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Custom Charge
                        </button>

                        <button 
                            onClick={handleEmailStatement}
                            disabled={sendingEmail}
                            className={`font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg transition flex items-center gap-2 border-2
                                ${statementSent 
                                    ? 'bg-[#e2f0d9] border-[#c5e0b4] text-[#385723] hover:bg-[#c5e0b4]' 
                                    : 'bg-white border-[#002b80] text-[#002b80] hover:bg-green-50'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {sendingEmail ? (
                                <svg className="animate-spin w-4 h-4 text-[#002b80]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            )}
                            {sendingEmail 
                                ? 'Sending...' 
                                : statementSent 
                                    ? 'Statement Sent ✓ (Click to Resend)' 
                                    : 'Email Statement to Parent'
                            }
                        </button>

                        <a 
                            href={route('learner-accounts.print-statement', enrollment.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border-2 border-slate-700 text-slate-700 hover:bg-slate-50 font-extrabold text-xs uppercase px-5 py-2.5 rounded-lg transition flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Statement
                        </a>
                    </div>

                    {/* Installment Plan Summary Block */}
                    {enrollment.installment_plans && enrollment.installment_plans.length > 0 && (() => {
                        const plan = enrollment.installment_plans[enrollment.installment_plans.length - 1];
                        return (
                            <div className="bg-[#f4f7fa] border border-[#e2e8f0] rounded-2xl p-5 space-y-4">
                                {/* Top Header Bar */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-3.5">
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <div className="flex items-center gap-2 text-[#002b80]">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm font-black uppercase tracking-wider">Active Installment Plan</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-700">
                                            <p>Term: <span className="font-extrabold text-[#002b80]">{plan.total_months} Months</span></p>
                                            <span className="text-slate-300">•</span>
                                            <p>Monthly Amount: <span className="font-extrabold text-[#002b80]">AED {parseFloat(plan.monthly_amount).toLocaleString()}</span></p>
                                            <span className="text-slate-300">•</span>
                                            <p>Start Date: <span className="font-bold text-slate-800">{new Date(plan.start_date).toLocaleDateString()}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <a 
                                            href={route('learner-accounts.installment.print', plan.id)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-white border border-[#002b80]/30 text-[#002b80] hover:bg-green-50 font-extrabold text-xs uppercase px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Print Plan
                                        </a>

                                        <button 
                                            onClick={() => handleEmailInstallmentPlan(plan.id)}
                                            disabled={sendingInstallmentPlan}
                                            className={`font-extrabold text-xs uppercase px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 border shadow-xs
                                                ${installmentEmailed 
                                                    ? 'bg-[#e2f0d9] border-[#c5e0b4] text-[#385723] hover:bg-[#c5e0b4]' 
                                                    : 'bg-[#002b80] border-[#002b80] text-white hover:bg-[#004d31]'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {sendingInstallmentPlan ? (
                                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            {sendingInstallmentPlan 
                                                ? 'Sending...' 
                                                : installmentEmailed 
                                                    ? 'Plan Emailed ✓ (Resend)' 
                                                    : 'Email Plan'
                                            }
                                        </button>
                                    </div>
                                </div>

                                {/* Full-Width Projected Schedule - 1 Single Horizontal Row Across Entire Page Width */}
                                <div className="w-full">
                                    <span className="text-xs font-black text-[#002b80] uppercase tracking-wider block mb-2">Projected Schedule & Payment Status</span>
                                    <div className="flex flex-row flex-nowrap overflow-x-auto gap-2.5 pb-2 scrollbar-thin">
                                        {activePlanInstallments ? (
                                            activePlanInstallments.map((inst: any) => {
                                                const colors = getStatusColors(inst.status);
                                                return (
                                                    <div key={inst.month_index} className={`flex-1 min-w-[130px] p-2.5 rounded-xl border shadow-2xs flex items-center gap-2.5 transition-all ${colors.bg}`}>
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colors.iconBg}`}>
                                                            {inst.status === 'paid_on_time' || inst.status === 'paid_delayed' ? (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            ) : inst.status === 'overdue' ? (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] leading-tight space-y-0.5">
                                                            <span className="font-black text-slate-800 block whitespace-nowrap">Month {inst.month_index}</span>
                                                            <span className="text-slate-400 font-semibold text-[10px] block whitespace-nowrap">{new Date(inst.due_date).toLocaleDateString()}</span>
                                                            <span className="font-extrabold text-[#002b80] block text-[11px] whitespace-nowrap">
                                                                AED {parseFloat(inst.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            Array.from({ length: plan.total_months }).map((_, i) => {
                                                const d = new Date(plan.start_date);
                                                d.setMonth(d.getMonth() + i);
                                                return (
                                                    <div key={i} className="flex-1 min-w-[130px] bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-[#e2f0d9] text-[#385723] flex items-center justify-center shrink-0">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="text-[11px] leading-tight space-y-0.5">
                                                            <span className="font-black text-slate-800 block whitespace-nowrap">Month {i + 1}</span>
                                                            <span className="text-slate-400 font-semibold text-[10px] block whitespace-nowrap">{d.toLocaleDateString()}</span>
                                                            <span className="font-extrabold text-[#002b80] block text-[11px] whitespace-nowrap">AED {parseFloat(plan.monthly_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Ledger Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-[#002b80]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-4 text-right text-xs font-extrabold text-white uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-center text-xs font-extrabold text-white uppercase tracking-wider">Receipt Email</th>
                                    <th className="px-6 py-4 text-right text-xs font-extrabold text-white uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {enrollment.ledgers.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(item.transaction_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-black rounded-md uppercase tracking-wide
                                                ${item.type === 'payment' || item.type === 'discount' ? 'bg-[#e2f0d9] text-[#385723]' : 'bg-[#fce4d6] text-[#c65911]'}
                                            `}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">{item.description}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-black
                                            ${item.type === 'payment' || item.type === 'discount' ? 'text-green-600' : 'text-red-600'}
                                        `}>
                                            {item.type === 'payment' || item.type === 'discount' ? '-' : '+'}
                                            {Math.abs(parseFloat(item.amount)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {item.type === 'payment' && getReceiptId(item) ? (() => {
                                                const rcptId = getReceiptId(item);
                                                const isSent = emailedReceiptIds.includes(rcptId);
                                                const isSendingThis = sendingReceiptEmailId === rcptId;
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEmailReceipt(rcptId)}
                                                        disabled={isSendingThis}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-xs border cursor-pointer
                                                            ${isSent
                                                                ? 'bg-[#e2f0d9] text-[#385723] border-[#c5e0b4] hover:bg-[#c5e0b4]'
                                                                : 'bg-white text-[#002b80] border-[#002b80] hover:bg-[#002b80]/5'
                                                            }
                                                        `}
                                                        title={isSent ? "Email sent! Click to resend" : "Email receipt to parent"}
                                                    >
                                                        {isSendingThis ? (
                                                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                        {isSent && <span className="font-extrabold text-[#385723] text-[10px]">SENT ✓</span>}
                                                    </button>
                                                );
                                            })() : (
                                                <span className="text-slate-300 font-bold text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">

                                                {/* ── Print Receipt (first, only for payment rows with a receipt) ── */}
                                                {item.type === 'payment' && getReceiptId(item) ? (
                                                    <a
                                                        href={route('finance.receipt', getReceiptId(item))}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Print Receipt"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#e2f0d9] text-[#002b80] hover:bg-[#002b80] hover:text-white transition-all shadow-sm"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                        </svg>
                                                    </a>
                                                ) : (
                                                    /* placeholder keeps alignment */
                                                    <span className="w-8 h-8" />
                                                )}

                                                {/* ── 3-dot Kebab Menu ── */}
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all"
                                                        title="More actions"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="5"  r="1.5" />
                                                            <circle cx="12" cy="12" r="1.5" />
                                                            <circle cx="12" cy="19" r="1.5" />
                                                        </svg>
                                                    </button>

                                                    {/* Dropdown */}
                                                    {openMenuId === item.id && (
                                                        <>
                                                            {/* Backdrop to close on outside click */}
                                                            <div
                                                                className="fixed inset-0 z-10"
                                                                onClick={() => setOpenMenuId(null)}
                                                            />
                                                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden py-1">
                                                                {/* Edit */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setOpenMenuId(null); handleEditLedger(item); }}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-[#002b80] transition-colors text-left"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Edit Entry
                                                                </button>

                                                                {/* Divider */}
                                                                <div className="my-1 border-t border-slate-100" />

                                                                {/* Delete */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setOpenMenuId(null); handleDeleteLedger(item.id); }}
                                                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {enrollment.ledgers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No transactions recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>

            {/* Action Modal */}
            <Modal show={actionType !== null} onClose={closeModal}>
                <form onSubmit={submitAction} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 capitalize mb-4">
                        {actionType?.replace('-', ' ')}
                    </h2>

                    <div className="space-y-4">
                        {/* Transaction Date - Applies to all except installment and assess */}
                        {actionType !== 'installment' && actionType !== 'assess' && (
                            <div>
                                <InputLabel htmlFor="transaction_date" value="Date" />
                                <TextInput
                                    id="transaction_date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.transaction_date}
                                    onChange={(e) => setData('transaction_date', e.target.value)}
                                />
                                <InputError message={errors.transaction_date} className="mt-2" />
                            </div>
                        )}

                        {actionType === 'assess' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to manually assess tuition and mandatory fees for this student? This will generate the base charges and VAT on their ledger.
                                </p>
                                <div>
                                    <InputLabel htmlFor="mode" value="Study Mode" />
                                    <select
                                        id="mode"
                                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm mt-1 block w-full text-slate-900 font-bold"
                                        value={data.mode || enrollment.mode || 'face_to_face'}
                                        onChange={(e) => setData('mode', e.target.value)}
                                        required
                                    >
                                        <option value="face_to_face">Face to Face</option>
                                        <option value="online">Online</option>
                                    </select>
                                    <InputError message={errors.mode} className="mt-2" />
                                </div>
                            </div>
                        )}

                        {/* Amount - Applies to Charge, Payment, Refund, and Fixed Discount */}
                        {((['charge', 'payment', 'refund', 'edit-ledger'].includes(actionType || '')) || (actionType === 'discount' && data.discount_mode === 'fixed')) && (
                            <div>
                                <InputLabel htmlFor="amount" value="Amount (AED)" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    required
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>
                        )}

                        {/* Specific Fields */}
                        {(actionType === 'charge' || actionType === 'edit-ledger') && (
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="description" value="Description" />
                                    <TextInput
                                        id="description"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>
                                {actionType === 'charge' && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <input
                                            type="checkbox"
                                            id="apply_vat"
                                            checked={data.apply_vat}
                                            onChange={(e) => setData('apply_vat', e.target.checked)}
                                            className="rounded border-slate-300 text-[#002b80] focus:ring-[#002b80] h-4 w-4"
                                        />
                                        <label htmlFor="apply_vat" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                            Apply 5% UAE VAT {data.amount && !isNaN(parseFloat(data.amount)) ? `(+ AED ${(parseFloat(data.amount) * 0.05).toFixed(2)})` : ''}
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        {actionType === 'payment' && (
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="receipt_number" value="Invoice / Receipt Number" />
                                    <TextInput
                                        id="receipt_number"
                                        type="text"
                                        className="mt-1 block w-full text-slate-900"
                                        value={data.receipt_number}
                                        onChange={(e) => setData('receipt_number', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.receipt_number} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="method" value="Payment Method" />
                                    <select
                                        id="method"
                                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm mt-1 block w-full text-slate-900"
                                        value={data.method}
                                        onChange={(e) => setData('method', e.target.value)}
                                    >
                                        <option>Cash</option>
                                        <option>Credit Card</option>
                                        <option>Bank Transfer</option>
                                        <option>Cheque</option>
                                    </select>
                                    <InputError message={errors.method} className="mt-2" />
                                </div>
                                {data.method !== 'Cash' && (
                                    <div>
                                        <InputLabel htmlFor="reference_number" value="Reference Number (Optional)" />
                                        <TextInput
                                            id="reference_number"
                                            type="text"
                                            className="mt-1 block w-full text-slate-900"
                                            value={data.reference_number || ''}
                                            onChange={(e) => setData('reference_number', e.target.value)}
                                            placeholder="e.g. Bank ref, check number, transaction ID"
                                        />
                                        <p className="text-xs text-slate-400 font-semibold mt-1">
                                            Please enter the bank transaction ID, transfer reference, check number, or card approval code.
                                        </p>
                                        <InputError message={(errors as any).reference_number} className="mt-2" />
                                    </div>
                                )}
                            </div>
                        )}

                        {actionType === 'discount' && (
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="discount_mode" value="Discount Mode" />
                                    <select
                                        id="discount_mode"
                                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm mt-1 block w-full"
                                        value={data.discount_mode}
                                        onChange={(e) => setData('discount_mode', e.target.value)}
                                    >
                                        <option value="fixed">Fixed Amount (AED)</option>
                                        <option value="percent">Percentage (%)</option>
                                    </select>
                                    <InputError message={(errors as any).discount_mode} className="mt-2" />
                                </div>

                                {data.discount_mode === 'percent' && (
                                    <div>
                                        <InputLabel htmlFor="percent" value="Percentage (%)" />
                                        <TextInput
                                            id="percent"
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="100"
                                            className="mt-1 block w-full"
                                            value={data.percent}
                                            onChange={(e) => setData('percent', e.target.value)}
                                            required
                                        />
                                        <InputError message={(errors as any).percent} className="mt-2" />
                                        {data.percent && !isNaN(parseFloat(data.percent)) && (
                                            <p className="mt-1.5 text-sm font-semibold text-emerald-600">
                                                Calculated Discount: AED {((parseFloat(data.percent) / 100) * parseFloat(enrollment.total_fees || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <InputLabel htmlFor="type" value="Discount Type" />
                                    <select
                                        id="type"
                                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm mt-1 block w-full"
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                    >
                                        <option>Employee Discount (50%)</option>
                                        <option>Sibling Discount</option>
                                        <option>Loyalty Discount</option>
                                        <option>Regular Discount</option>
                                        <option>Full Payment Discount</option>
                                        <option>Custom Override</option>
                                    </select>
                                    <InputError message={errors.type} className="mt-2" />
                                </div>
                            </div>
                        )}

                        {actionType === 'refund' && (
                            <div>
                                <InputLabel htmlFor="reason" value="Reason for Refund" />
                                <TextInput
                                    id="reason"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="e.g. Overpayment, Withdrawal"
                                    required
                                />
                                <InputError message={(errors as any).reason} className="mt-2" />
                            </div>
                        )}

                        {actionType === 'installment' && (
                            <>
                                <div>
                                    <InputLabel htmlFor="total_months" value="Number of Months" />
                                    <TextInput
                                        id="total_months"
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="mt-1 block w-full"
                                        value={data.total_months}
                                        onChange={(e) => setData('total_months', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.total_months} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="start_date" value="First Payment Date" />
                                    <TextInput
                                        id="start_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} className="mt-2" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processing}>
                            Submit {actionType}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </FinanceLayout>
    );
}
