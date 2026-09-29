import React from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

interface AcademicYear {
    id: number;
    name: string;
}

export default function Create({ auth, academicYears }: PageProps<{ academicYears: AcademicYear[] }>) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'tuition',
        amount: '',
        academic_year_id: '',
        level: '',
        is_optional: false,
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('finance.fees.store'));
    };

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Create Fee Structure</h2>
                        <p className="text-xs text-slate-400 font-semibold">Define a new assessment category and base price</p>
                    </div>
                </div>
            }
        >
            <Head title="Create Fee Structure" />

            <div className="py-8">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* Fee Name */}
                            <div>
                                <label htmlFor="name" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Fee Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="w-full text-sm border-slate-200 focus:border-[#002b80] focus:ring-[#002b80] rounded-xl shadow-sm transition-all"
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Tuition Fee Term 1"
                                    required
                                />
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Fee Type */}
                                <div>
                                    <label htmlFor="type" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Fee Category</label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={data.type}
                                        className="w-full text-sm border-slate-200 focus:border-[#002b80] focus:ring-[#002b80] rounded-xl shadow-sm transition-all"
                                        onChange={(e) => setData('type', e.target.value)}
                                        required
                                    >
                                        <option value="tuition">Tuition</option>
                                        <option value="registration">Registration</option>
                                        <option value="misc">Miscellaneous</option>
                                        <option value="books">Books</option>
                                        <option value="uniform">Uniform</option>
                                    </select>
                                    <InputError message={errors.type} className="mt-1.5" />
                                </div>

                                {/* Amount */}
                                <div>
                                    <label htmlFor="amount" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Amount (AED)</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold font-mono">
                                            AED
                                        </span>
                                        <input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            name="amount"
                                            value={data.amount}
                                            className="w-full pl-12 text-sm border-slate-200 focus:border-[#002b80] focus:ring-[#002b80] rounded-xl shadow-sm transition-all font-bold"
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.amount} className="mt-1.5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Academic Year */}
                                <div>
                                    <label htmlFor="academic_year_id" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Academic Year (Optional)</label>
                                    <select
                                        id="academic_year_id"
                                        name="academic_year_id"
                                        value={data.academic_year_id}
                                        className="w-full text-sm border-slate-200 focus:border-[#002b80] focus:ring-[#002b80] rounded-xl shadow-sm transition-all"
                                        onChange={(e) => setData('academic_year_id', e.target.value)}
                                    >
                                        <option value="">All Academic Years</option>
                                        {academicYears.map((ay) => (
                                            <option key={ay.id} value={ay.id}>{ay.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.academic_year_id} className="mt-1.5" />
                                </div>

                                {/* Grade Level */}
                                <div>
                                    <label htmlFor="level" className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Grade Level Restriction (Optional)</label>
                                    <select
                                        id="level"
                                        name="level"
                                        value={data.level || ''}
                                        className="w-full text-sm border-slate-200 focus:border-[#002b80] focus:ring-[#002b80] rounded-xl shadow-sm transition-all font-mono"
                                        onChange={(e) => setData('level', e.target.value)}
                                    >
                                        <option value="">All Levels (General Fee)</option>
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
                                    <InputError message={errors.level} className="mt-1.5" />
                                </div>
                            </div>

                            {/* Checkbox cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setData('is_optional', !data.is_optional)}
                                    className={`flex items-center gap-3 p-4 bg-white rounded-xl border text-left cursor-pointer transition-all ${
                                        data.is_optional ? 'border-[#002b80] bg-[#002b80]/5' : 'border-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <span className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                        data.is_optional ? 'bg-[#002b80] border-[#002b80] text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                        {data.is_optional && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </span>
                                    <div>
                                        <p className="font-extrabold text-sm text-slate-800">Optional Fee</p>
                                        <p className="text-slate-400 text-xs mt-0.5">Not mandatory for enrollment</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setData('is_active', !data.is_active)}
                                    className={`flex items-center gap-3 p-4 bg-white rounded-xl border text-left cursor-pointer transition-all ${
                                        data.is_active ? 'border-[#002b80] bg-[#002b80]/5' : 'border-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <span className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                        data.is_active ? 'bg-[#002b80] border-[#002b80] text-white' : 'border-slate-300 bg-white'
                                    }`}>
                                        {data.is_active && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </span>
                                    <div>
                                        <p className="font-extrabold text-sm text-slate-800">Is Active</p>
                                        <p className="text-slate-400 text-xs mt-0.5">Available for batch assessment</p>
                                    </div>
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                                <Link
                                    href={route('finance.fees.index')}
                                    className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-black text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-wider shadow-sm"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-black text-white bg-[#002b80] hover:bg-[#004d31] active:bg-[#003c26] rounded-xl shadow-md hover:shadow-lg transition-all duration-200 uppercase tracking-wider"
                                >
                                    {processing ? 'Creating...' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </FinanceLayout>
    );
}
