import React, { useState } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, useForm, router, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';

interface GradeLevelFee {
    id: number;
    grade_level: string;
    base_tuition: string;
    mode: string;
    total_count: number;
    assessed_count: number;
}

interface AcademicYear {
    id: number;
    name: string;
}

interface SettingsProps {
    fees: GradeLevelFee[];
    academicYears: AcademicYear[];
}

export default function Settings({ fees, academicYears }: SettingsProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        grade_level: '',
        base_tuition: '',
        mode: 'face_to_face',
    });

    const [assessingLevel, setAssessingLevel] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('finance.settings.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleBatchAssess = (fee: GradeLevelFee) => {
        const unassessed = fee.total_count - fee.assessed_count;
        if (unassessed === 0) {
            alert(`All students in ${fee.grade_level} (${fee.mode === 'face_to_face' ? 'Face to Face' : 'Online'}) have already been assessed.`);
            return;
        }
        if (confirm(`Assess tuition + VAT for ${unassessed} unassessed student(s) in ${fee.grade_level} (${fee.mode === 'face_to_face' ? 'Face to Face' : 'Online'})?`)) {
            setAssessingLevel(`${fee.grade_level}-${fee.mode}`);
            router.post(
                route('finance.batch-assess'),
                { grade_level: fee.grade_level, mode: fee.mode },
                { 
                    preserveScroll: true,
                    onFinish: () => setAssessingLevel(null) 
                }
            );
        }
    };

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Finance Settings & Batch Assessment</h2>
                </div>
            }
        >
            <Head title="Finance Settings" />

            <div className="py-10">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* ── Set Grade Level Tuition Form ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#e2f0d9] flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#385723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800">Set Grade Level Tuition</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Define the base tuition fee per grade level used during batch assessment.</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
                                <div className="flex-1">
                                    <InputLabel htmlFor="grade_level" value="Grade Level" />
                                    <select
                                        id="grade_level"
                                        name="grade_level"
                                        value={data.grade_level}
                                        className="mt-1 block w-full border-slate-300 focus:border-[#002b80] focus:ring-[#002b80] rounded-lg shadow-sm text-sm"
                                        onChange={(e) => setData('grade_level', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Grade Level...</option>
                                        <option value="L1">L1 (Nursery / Kindergarten 1)</option>
                                        <option value="L2">L2 (Kindergarten 2)</option>
                                        <option value="G1">Grade 1 (G1)</option>
                                        <option value="G2">Grade 2 (G2)</option>
                                        <option value="G3">Grade 3 (G3)</option>
                                        <option value="G4">Grade 4 (G4)</option>
                                        <option value="G5">Grade 5 (G5)</option>
                                        <option value="G6">Grade 6 (G6)</option>
                                        <option value="G7">Grade 7 (G7)</option>
                                        <option value="G8">Grade 8 (G8)</option>
                                        <option value="G9">Grade 9 (G9)</option>
                                        <option value="G10">Grade 10 (G10)</option>
                                        <option value="G11">Grade 11 (G11)</option>
                                        <option value="G12">Grade 12 (G12)</option>
                                    </select>
                                    <InputError message={errors.grade_level} className="mt-2" />
                                </div>
                                <div className="flex-1">
                                    <InputLabel htmlFor="mode" value="Study Mode" />
                                    <select
                                        id="mode"
                                        name="mode"
                                        value={data.mode}
                                        className="mt-1 block w-full border-slate-300 focus:border-[#002b80] focus:ring-[#002b80] rounded-lg shadow-sm text-sm"
                                        onChange={(e) => setData('mode', e.target.value)}
                                        required
                                    >
                                        <option value="face_to_face">Face to Face</option>
                                        <option value="online">Online</option>
                                    </select>
                                    <InputError message={errors.mode} className="mt-2" />
                                </div>
                                <div className="flex-1">
                                    <InputLabel htmlFor="base_tuition" value="Base Tuition (AED)" />
                                    <TextInput
                                        id="base_tuition"
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 8000"
                                        className="mt-1 block w-full"
                                        value={data.base_tuition}
                                        onChange={(e) => setData('base_tuition', e.target.value)}
                                    />
                                    <InputError message={errors.base_tuition} className="mt-2" />
                                </div>
                                <div className="shrink-0">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#002b80] hover:bg-[#004d31] disabled:opacity-50 text-white font-extrabold text-xs uppercase px-6 py-3 rounded-lg shadow-sm transition flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {processing ? 'Saving...' : 'Save Fee Structure'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ── Configured Fees & Batch Processing ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#e2f0d9] flex items-center justify-center">
                                    <svg className="w-4 h-4 text-[#385723]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Configured Fees & Batch Processing</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Assess base tuition + VAT for all unassessed students per grade level.</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{fees.length} Level{fees.length !== 1 ? 's' : ''} Configured</span>
                        </div>

                        {fees.length === 0 ? (
                            <div className="p-12 flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="font-bold text-slate-500">No grade level fees configured yet.</p>
                                <p className="text-xs text-slate-400">Use the form above to add the first grade level fee structure.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {fees.map((fee) => {
                                    const pct = fee.total_count > 0
                                        ? Math.round((fee.assessed_count / fee.total_count) * 100)
                                        : 0;
                                    const allAssessed = fee.total_count > 0 && fee.assessed_count >= fee.total_count;
                                    const noneAssessed = fee.assessed_count === 0;
                                    const isAssessing = assessingLevel === `${fee.grade_level}-${fee.mode}`;

                                    return (
                                        <div key={fee.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Grade Level Badge */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-[#002b80] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                                                    {fee.grade_level}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-black text-slate-800 text-sm">
                                                            {fee.grade_level} 
                                                            <span className="ml-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                                {fee.mode === 'face_to_face' ? 'Face to Face' : 'Online'}
                                                            </span>
                                                        </span>
                                                        <span className="text-slate-400 text-xs">•</span>
                                                        <span className="text-sm font-bold text-[#002b80]">
                                                            AED {parseFloat(fee.base_tuition).toLocaleString()}
                                                        </span>
                                                        {/* Assessment Status Badge */}
                                                        {allAssessed ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#e2f0d9] text-[#385723]">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                                Fully Assessed
                                                            </span>
                                                        ) : noneAssessed ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                                                                Not Started
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                In Progress
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {fee.total_count > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                                <span>{fee.assessed_count} of {fee.total_count} assessed</span>
                                                                <span>{pct}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                                        allAssessed ? 'bg-[#4caf50]' : pct > 0 ? 'bg-amber-400' : 'bg-slate-300'
                                                                    }`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {fee.total_count === 0 && (
                                                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">No students enrolled in this level</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Batch Assess Button */}
                                            <div className="shrink-0 flex items-center gap-2">
                                                {allAssessed ? (
                                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#e2f0d9] text-[#385723] text-xs font-black uppercase tracking-wide">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        All Assessed
                                                    </div>
                                                ) : (
                                                    <>
                                                        {fee.total_count > 0 && (
                                                            <Link
                                                                href={route('learner-accounts.index', { level: fee.grade_level, status: 'No Assessment' })}
                                                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#002b80] text-[#002b80] hover:bg-green-50 text-xs font-black uppercase tracking-wide transition shadow-sm"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                Single Assess
                                                            </Link>
                                                        )}
                                                        <button
                                                            onClick={() => handleBatchAssess(fee)}
                                                            disabled={isAssessing || fee.total_count === 0}
                                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition shadow-sm
                                                                ${isAssessing || fee.total_count === 0
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-[#002b80] hover:bg-[#004d31] text-white'
                                                                }`}
                                                        >
                                                            {isAssessing ? (
                                                                <>
                                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                    </svg>
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                    </svg>
                                                                    Batch Assess
                                                                    {fee.total_count - fee.assessed_count > 0 && (
                                                                        <span className="bg-white/20 rounded px-1.5 py-0.5 text-[10px] font-black">
                                                                            {fee.total_count - fee.assessed_count}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete the base tuition fee configuration for ${fee.grade_level}?`)) {
                                                            router.delete(route('finance.settings.destroy', fee.id));
                                                        }
                                                    }}
                                                    className="p-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-900 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                                    title="Delete Tuition Configuration"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </FinanceLayout>
    );
}
