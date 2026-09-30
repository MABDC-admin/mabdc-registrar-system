import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

type Clause = {
    title: string;
    body: string;
};

type ContractData = {
    school_name: string;
    contract_title: string;
    academic_year: string;
    learner_name: string;
    lrn: string;
    level: string;
    session: string;
    parent_name: string;
    contact_phone: string;
    contact_email: string;
    downpayment_amount: string;
    downpayment_remarks: string;
    receipt_no: string;
    verified_date: string;
    clauses: Clause[];
    special_provisions: string;
    parent_sig_label: string;
    school_sig_label: string;
    school_signatory_name: string;
    date_signed: string;
};

type Props = {
    enrollment: {
        id: number;
        level: string;
        session: string;
        learner_id: number;
        learner?: {
            id: number;
            full_name: string;
            lrn: string | null;
        };
        academic_year?: {
            id: number;
            name: string;
        };
    };
    contract: ContractData;
};

export default function ContractEdit({ enrollment, contract }: Props) {
    const [previewCopy, setPreviewCopy] = useState<'PARENT' | 'SCHOOL'>('PARENT');
    const [activeSection, setActiveSection] = useState<'all' | 'general' | 'student' | 'finance' | 'clauses' | 'signatories'>('all');

    const { data, setData, post, processing, isDirty } = useForm<{
        contract: ContractData;
        action?: string;
    }>({
        contract: {
            school_name: contract.school_name || 'Mahardika Al-Islamia Basic Education Center',
            contract_title: contract.contract_title || 'Official Student Enrollment Contract & Agreement',
            academic_year: contract.academic_year || enrollment.academic_year?.name || '2026-2027',
            learner_name: contract.learner_name || enrollment.learner?.full_name || '',
            lrn: contract.lrn || enrollment.learner?.lrn || 'N/A',
            level: contract.level || enrollment.level || '',
            session: contract.session || enrollment.session || 'Morning',
            parent_name: contract.parent_name || 'Parent / Guardian',
            contact_phone: contract.contact_phone || '',
            contact_email: contract.contact_email || '',
            downpayment_amount: contract.downpayment_amount || '₱500.00',
            downpayment_remarks: contract.downpayment_remarks || 'VAT 5% inclusive credit applied to 10-Month Schedule',
            receipt_no: contract.receipt_no || 'REG-SETTLED',
            verified_date: contract.verified_date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            clauses: contract.clauses && contract.clauses.length > 0 ? contract.clauses : [
                {
                    title: 'Enrollment Commitment',
                    body: `The parent/guardian agrees to the official enrollment of the student at MABDC for Academic Year ${contract.academic_year || enrollment.academic_year?.name || '2026-2027'}.`
                },
                {
                    title: 'Tuition & Billing',
                    body: "Tuition fees are structured across a 10-month payment schedule with 5% UAE VAT inclusive. The ₱500 advance downpayment is fully credited toward the student's tuition balance."
                },
                {
                    title: 'Session Capacity',
                    body: 'The student is assigned to a reserved session slot capped at a maximum of 25 learners per session.'
                },
                {
                    title: 'Rules & Compliance',
                    body: 'The student and parent agree to abide by all academic standards, code of conduct, and regulations enforced by MABDC.'
                }
            ],
            special_provisions: contract.special_provisions || '',
            parent_sig_label: contract.parent_sig_label || 'Parent / Guardian Signature over Printed Name',
            school_sig_label: contract.school_sig_label || 'School Registrar Authorized Signature',
            school_signatory_name: contract.school_signatory_name || 'Office of the Registrar',
            date_signed: contract.date_signed || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        }
    });

    const updateField = (field: keyof ContractData, value: any) => {
        setData('contract', {
            ...data.contract,
            [field]: value,
        });
    };

    const handleClauseChange = (index: number, field: keyof Clause, value: string) => {
        const updatedClauses = [...data.contract.clauses];
        updatedClauses[index] = {
            ...updatedClauses[index],
            [field]: value,
        };
        updateField('clauses', updatedClauses);
    };

    const addClause = () => {
        const updatedClauses = [
            ...data.contract.clauses,
            {
                title: `Condition ${data.contract.clauses.length + 1}`,
                body: 'Enter clause terms, agreements, or requirements here...',
            }
        ];
        updateField('clauses', updatedClauses);
    };

    const removeClause = (index: number) => {
        if (confirm('Are you sure you want to remove this clause?')) {
            const updatedClauses = data.contract.clauses.filter((_, i) => i !== index);
            updateField('clauses', updatedClauses);
        }
    };

    const handleSave = (e: React.FormEvent, download: boolean = false) => {
        e.preventDefault();
        if (download) {
            // Submit form with download action to trigger PDF response
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('enrollments.contract.update', enrollment.id);
            
            // CSRF Token
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            if (csrfToken) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = '_token';
                tokenInput.value = csrfToken;
                form.appendChild(tokenInput);
            }

            // Action
            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            actionInput.value = 'download';
            form.appendChild(actionInput);

            // Contract Payload fields
            const appendField = (key: string, val: any) => {
                if (Array.isArray(val)) {
                    val.forEach((item, idx) => {
                        Object.keys(item).forEach(k => {
                            const inp = document.createElement('input');
                            inp.type = 'hidden';
                            inp.name = `contract[${key}][${idx}][${k}]`;
                            inp.value = item[k];
                            form.appendChild(inp);
                        });
                    });
                } else {
                    const inp = document.createElement('input');
                    inp.type = 'hidden';
                    inp.name = `contract[${key}]`;
                    inp.value = val ?? '';
                    form.appendChild(inp);
                }
            };

            Object.keys(data.contract).forEach(key => {
                appendField(key, (data.contract as any)[key]);
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } else {
            post(route('enrollments.contract.update', enrollment.id), {
                preserveScroll: true,
            });
        }
    };

    const resetDefaults = () => {
        if (confirm('Reset all contract fields to original institutional template defaults?')) {
            setData('contract', {
                school_name: 'Mahardika Al-Islamia Basic Education Center',
                contract_title: 'Official Student Enrollment Contract & Agreement',
                academic_year: enrollment.academic_year?.name || '2026-2027',
                learner_name: enrollment.learner?.full_name || '',
                lrn: enrollment.learner?.lrn || 'N/A',
                level: enrollment.level || '',
                session: enrollment.session || 'Morning',
                parent_name: 'Parent / Guardian',
                contact_phone: '',
                contact_email: '',
                downpayment_amount: '₱500.00',
                downpayment_remarks: 'VAT 5% inclusive credit applied to 10-Month Schedule',
                receipt_no: 'REG-SETTLED',
                verified_date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                clauses: [
                    {
                        title: 'Enrollment Commitment',
                        body: `The parent/guardian agrees to the official enrollment of the student at MABDC for Academic Year ${enrollment.academic_year?.name || '2026-2027'}.`
                    },
                    {
                        title: 'Tuition & Billing',
                        body: "Tuition fees are structured across a 10-month payment schedule with 5% UAE VAT inclusive. The ₱500 advance downpayment is fully credited toward the student's tuition balance."
                    },
                    {
                        title: 'Session Capacity',
                        body: 'The student is assigned to a reserved session slot capped at a maximum of 25 learners per session.'
                    },
                    {
                        title: 'Rules & Compliance',
                        body: 'The student and parent agree to abide by all academic standards, code of conduct, and regulations enforced by MABDC.'
                    }
                ],
                special_provisions: '',
                parent_sig_label: 'Parent / Guardian Signature over Printed Name',
                school_sig_label: 'School Registrar Authorized Signature',
                school_signatory_name: 'Office of the Registrar',
                date_signed: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                            <Link href={route('admissions.index')} className="hover:text-slate-900 transition">Admissions Pipeline</Link>
                            <span>/</span>
                            <span className="text-slate-900 font-extrabold">Edit Contract</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>📜 Student Enrollment Contract Editor</span>
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                            Customize agreement terms, financial verification, clauses, and signatories for <strong className="text-slate-800">{data.contract.learner_name}</strong>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={resetDefaults}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95"
                        >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                            </svg>
                            Reset Defaults
                        </button>

                        <a
                            href={route('enrollments.contract.preview', enrollment.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-800 shadow-xs hover:bg-slate-50 transition active:scale-95"
                        >
                            <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Print / Preview PDF
                        </a>

                        <button
                            type="button"
                            disabled={processing}
                            onClick={(e) => handleSave(e, false)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#002b80] px-4 py-2 text-xs font-black text-white shadow-md hover:bg-[#001746] transition active:scale-95 disabled:opacity-50"
                        >
                            <svg className="w-3.5 h-3.5 text-[#ffc000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {processing ? 'Saving...' : 'Save Contract'}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => handleSave(e, true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 text-xs font-black text-white shadow-md hover:from-emerald-700 hover:to-teal-800 transition active:scale-95"
                        >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Save & Download PDF
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Edit Contract - ${data.contract.learner_name}`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">

                {/* Status Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-[#002b80] text-[#ffc000] font-black text-sm flex items-center justify-center shrink-0">
                            📜
                        </span>
                        <div>
                            <p className="text-xs font-extrabold text-[#002b80]">
                                Customizing Official Enrollment Contract (Dual-Copy Parent & School Agreement)
                            </p>
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                                All edits made below update in real-time in the live document preview on the right and will be reflected on generated PDFs.
                            </p>
                        </div>
                    </div>
                    {isDirty && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full ring-1 ring-amber-300 animate-pulse">
                            Unsaved Changes
                        </span>
                    )}
                </div>

                {/* Main 2-Column Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Column: Form Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Section Filter Pills */}
                        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                            {[
                                { id: 'all', label: 'All Sections' },
                                { id: 'general', label: '🏫 School Info' },
                                { id: 'student', label: '👤 Learner & Parent' },
                                { id: 'finance', label: '💰 Settlement' },
                                { id: 'clauses', label: '📜 Terms & Clauses' },
                                { id: 'signatories', label: '✍️ Signatories' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveSection(tab.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                                        activeSection === tab.id
                                            ? 'bg-[#002b80] text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 1. School & Header Details */}
                        {(activeSection === 'all' || activeSection === 'general') && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#002b80] flex items-center gap-2">
                                        <span>🏫</span> 1. School Header & Contract Title
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">Header Branding</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            School Institution Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.contract.school_name}
                                            onChange={(e) => updateField('school_name', e.target.value)}
                                            className="w-full text-xs font-bold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Contract Document Title
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.contract_title}
                                                onChange={(e) => updateField('contract_title', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Academic School Year
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.academic_year}
                                                onChange={(e) => updateField('academic_year', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Learner & Academic Details */}
                        {(activeSection === 'all' || activeSection === 'student') && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#002b80] flex items-center gap-2">
                                        <span>👤</span> 2. Learner & Parent/Guardian Details
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">Student Identity</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Learner Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.learner_name}
                                                onChange={(e) => updateField('learner_name', e.target.value)}
                                                className="w-full text-xs font-bold uppercase rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Learner Reference Number (LRN)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.lrn}
                                                onChange={(e) => updateField('lrn', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Grade Level
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.level}
                                                onChange={(e) => updateField('level', e.target.value)}
                                                className="w-full text-xs font-bold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Session Slot
                                            </label>
                                            <select
                                                value={data.contract.session}
                                                onChange={(e) => updateField('session', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            >
                                                <option value="Morning">Morning Session</option>
                                                <option value="Afternoon">Afternoon Session</option>
                                                <option value="Full Day">Full Day Session</option>
                                                <option value="Online">Online / Distance Learning</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Parent / Guardian Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.parent_name}
                                                onChange={(e) => updateField('parent_name', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Contact Phone Number
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.contact_phone}
                                                onChange={(e) => updateField('contact_phone', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Parent Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={data.contract.contact_email}
                                                onChange={(e) => updateField('contact_email', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Downpayment & Verification */}
                        {(activeSection === 'all' || activeSection === 'finance') && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#002b80] flex items-center gap-2">
                                        <span>💰</span> 3. Registration Downpayment & Financial Verification
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">Cashier Verification</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Advance Downpayment Amount
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.downpayment_amount}
                                                onChange={(e) => updateField('downpayment_amount', e.target.value)}
                                                className="w-full text-xs font-bold text-emerald-800 rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Official Receipt # / Reference
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.receipt_no}
                                                onChange={(e) => updateField('receipt_no', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Verification Timestamp / Date
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.verified_date}
                                                onChange={(e) => updateField('verified_date', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Downpayment Credit Statement Remarks
                                        </label>
                                        <input
                                            type="text"
                                            value={data.contract.downpayment_remarks}
                                            onChange={(e) => updateField('downpayment_remarks', e.target.value)}
                                            className="w-full text-xs font-medium rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Terms & Clauses Editor */}
                        {(activeSection === 'all' || activeSection === 'clauses') && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#002b80] flex items-center gap-2">
                                        <span>📜</span> 4. Contract Terms & Enrollment Conditions
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addClause}
                                        className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                                    >
                                        + Add New Clause
                                    </button>
                                </div>

                                <div className="p-5 space-y-4">
                                    {data.contract.clauses.map((clause, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#002b80] text-white text-[10px] font-black">
                                                        {idx + 1}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={clause.title}
                                                        onChange={(e) => handleClauseChange(idx, 'title', e.target.value)}
                                                        placeholder="Clause Title (e.g. Tuition & Billing)"
                                                        className="flex-1 text-xs font-bold rounded-lg border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeClause(idx)}
                                                    className="text-slate-400 hover:text-rose-600 transition p-1"
                                                    title="Delete this clause"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div>
                                                <textarea
                                                    rows={2}
                                                    value={clause.body}
                                                    onChange={(e) => handleClauseChange(idx, 'body', e.target.value)}
                                                    placeholder="Clause terms and legal agreements..."
                                                    className="w-full text-xs font-normal text-slate-700 rounded-lg border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Special Provisions */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Special Provisions / Additional Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.contract.special_provisions}
                                            onChange={(e) => updateField('special_provisions', e.target.value)}
                                            placeholder="e.g. Approved 10% Sibling Discount; Special Learning Support Arrangement; etc."
                                            className="w-full text-xs font-medium text-slate-700 rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. Signatories */}
                        {(activeSection === 'all' || activeSection === 'signatories') && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#002b80] flex items-center gap-2">
                                        <span>✍️</span> 5. Contract Signatories & Execution Date
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">Authorized Signatures</span>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Parent / Guardian Signature Label
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.parent_sig_label}
                                                onChange={(e) => updateField('parent_sig_label', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                School Registrar Signature Label
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.school_sig_label}
                                                onChange={(e) => updateField('school_sig_label', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                School Signatory Name / Office
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.school_signatory_name}
                                                onChange={(e) => updateField('school_signatory_name', e.target.value)}
                                                placeholder="e.g. Office of the Registrar"
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Date Signed
                                            </label>
                                            <input
                                                type="text"
                                                value={data.contract.date_signed}
                                                onChange={(e) => updateField('date_signed', e.target.value)}
                                                className="w-full text-xs font-semibold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Submit Bar */}
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                            <Link
                                href={route('admissions.index')}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                                Back to Admissions
                            </Link>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={(e) => handleSave(e, false)}
                                className="px-5 py-2.5 rounded-xl bg-[#002b80] text-xs font-black text-white hover:bg-[#001746] shadow-md transition disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : '💾 Save Contract Changes'}
                            </button>
                            
                            <button
                                type="button"
                                onClick={(e) => handleSave(e, true)}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-xs font-black text-white shadow-md hover:from-emerald-700 hover:to-teal-800 transition"
                            >
                                📄 Save & Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Live PDF Document Preview (5 cols) */}
                    <div className="lg:col-span-5 sticky top-6 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
                            {/* Preview Toolbar */}
                            <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-sm">👁️</span>
                                    <span className="text-xs font-black uppercase tracking-wider">Live Document Preview</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewCopy('PARENT')}
                                        className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wide transition ${
                                            previewCopy === 'PARENT' ? 'bg-[#002b80] text-[#ffc000]' : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        Parent Copy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewCopy('SCHOOL')}
                                        className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wide transition ${
                                            previewCopy === 'SCHOOL' ? 'bg-[#002b80] text-[#ffc000]' : 'text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        School Copy
                                    </button>
                                </div>
                            </div>

                            {/* Simulated Paper Sheet */}
                            <div className="p-6 bg-white text-slate-900 font-sans text-[11px] leading-relaxed max-h-[750px] overflow-y-auto space-y-3.5 border-t border-slate-200">
                                
                                {/* Badge & Header */}
                                <div className="flex justify-end">
                                    <span className="inline-block bg-[#002b80] text-[#ffc000] font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase">
                                        {previewCopy === 'PARENT' ? 'PARENT / GUARDIAN COPY' : 'SCHOOL / REGISTRAR COPY'}
                                    </span>
                                </div>

                                <div className="text-center border-b-2 border-[#002b80] pb-2">
                                    <h2 className="text-sm font-black text-[#002b80] uppercase tracking-tight">
                                        {data.contract.school_name}
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                        {data.contract.contract_title} | SY {data.contract.academic_year}
                                    </p>
                                </div>

                                {/* Section 1 */}
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#002b80] border-b border-slate-200 pb-0.5 mb-1.5">
                                        1. Student & Academic Information
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                                        <div>
                                            <span className="font-bold text-slate-500">Learner Name: </span>
                                            <strong className="text-slate-900 font-black">{data.contract.learner_name || '—'}</strong>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500">LRN: </span>
                                            <span className="text-slate-800 font-semibold">{data.contract.lrn || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500">Grade Level: </span>
                                            <strong className="text-slate-900 font-black">{data.contract.level || '—'}</strong>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500">Session Slot: </span>
                                            <span className="text-slate-800 font-semibold">{data.contract.session || 'Morning'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500">Parent/Guardian: </span>
                                            <span className="text-slate-800 font-semibold">{data.contract.parent_name || '—'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-500">Contact: </span>
                                            <span className="text-slate-800 font-semibold">{data.contract.contact_phone || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2 */}
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#002b80] border-b border-slate-200 pb-0.5 mb-1.5">
                                        2. Registration Settlement & Financial Verification
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[9.5px] space-y-0.5">
                                        <p className="font-black text-emerald-900 flex items-center gap-1">
                                            <span>✓</span> REGISTRATION SETTLED BY FINANCE DEPARTMENT
                                        </p>
                                        <p className="text-emerald-800">
                                            Advance Downpayment Credit: <strong>{data.contract.downpayment_amount}</strong> ({data.contract.downpayment_remarks})
                                        </p>
                                        <p className="text-emerald-700 text-[9px]">
                                            Verified On: {data.contract.verified_date} | Receipt #: {data.contract.receipt_no}
                                        </p>
                                    </div>
                                </div>

                                {/* Section 3 */}
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-[#002b80] border-b border-slate-200 pb-0.5 mb-1.5">
                                        3. Terms & Enrollment Conditions
                                    </div>
                                    <ol className="list-decimal pl-4 space-y-1.5 text-[9.5px] text-slate-700">
                                        {data.contract.clauses.map((clause, idx) => (
                                            <li key={idx} className="leading-snug">
                                                <strong>{clause.title}:</strong> {clause.body}
                                            </li>
                                        ))}
                                    </ol>

                                    {data.contract.special_provisions && (
                                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[9.5px] text-amber-900">
                                            <strong>Special Provisions:</strong> {data.contract.special_provisions}
                                        </div>
                                    )}
                                </div>

                                {/* Section 4 Signatures */}
                                <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="border-t border-slate-900 pt-1 mt-6 text-[9.5px] font-bold text-slate-900">
                                            {data.contract.parent_sig_label}
                                        </div>
                                        <p className="text-[8.5px] text-slate-500 mt-0.5">Date: ____________________</p>
                                    </div>
                                    <div>
                                        <div className="border-t border-slate-900 pt-1 mt-6 text-[9.5px] font-bold text-slate-900">
                                            {data.contract.school_sig_label}
                                        </div>
                                        <p className="text-[8.5px] text-slate-500 mt-0.5">
                                            {data.contract.school_signatory_name ? `${data.contract.school_signatory_name} • ` : ''}Date: {data.contract.date_signed}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </AuthenticatedLayout>
    );
}
