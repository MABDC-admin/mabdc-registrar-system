import React, { useState } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';

interface FeeStructure {
    id: number;
    name: string;
    type: string;
    amount: number;
    academic_year_id: number | null;
    level: string | null;
    is_optional: boolean;
    is_active: boolean;
    academic_year?: {
        id: number;
        name: string;
    };
}

interface Learner {
    id: number;
    name: string;
    lrn: string;
}

const TYPE_BADGES: Record<string, { bg: string; text: string }> = {
    tuition:      { bg: 'bg-[#e2f0d9]', text: 'text-[#385723]' },
    registration: { bg: 'bg-blue-50',    text: 'text-blue-700' },
    misc:         { bg: 'bg-purple-50',  text: 'text-purple-700' },
    books:        { bg: 'bg-amber-50',   text: 'text-amber-700' },
    uniform:      { bg: 'bg-cyan-50',    text: 'text-cyan-700' },
};

export default function Index({ auth, fees }: PageProps<{ fees: FeeStructure[] }>) {
    const [assigningFee, setAssigningFee] = useState<FeeStructure | null>(null);
    const [learners, setLearners] = useState<Learner[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleOpenAssign = (fee: FeeStructure) => {
        setAssigningFee(fee);
        setLoading(true);
        setLearners([]);
        setSelectedIds([]);
        setSearchQuery('');
        
        fetch(route('finance.fees.learners', fee.id))
            .then(res => res.json())
            .then(data => {
                setLearners(data);
                setSelectedIds(data.map((l: any) => l.id)); // select all by default
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCloseModal = () => {
        setAssigningFee(null);
    };

    const filteredLearners = learners.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.lrn.includes(searchQuery)
    );

    const toggleSelectAll = () => {
        const allFilteredSelected = filteredLearners.every(l => selectedIds.includes(l.id));
        if (allFilteredSelected) {
            const filteredIds = filteredLearners.map(l => l.id);
            setSelectedIds(selectedIds.filter(id => !filteredIds.includes(id)));
        } else {
            const newIds = [...selectedIds];
            filteredLearners.forEach(l => {
                if (!newIds.includes(l.id)) {
                    newIds.push(l.id);
                }
            });
            setSelectedIds(newIds);
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleAssignSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0) return;
        setSubmitting(true);
        router.post(route('finance.fees.assign', assigningFee!.id), {
            enrollment_ids: selectedIds
        }, {
            onSuccess: () => {
                setAssigningFee(null);
                setSubmitting(false);
            },
            onError: () => {
                setSubmitting(false);
            }
        });
    };

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Fee Structures</h2>
                        <p className="text-xs text-slate-400 font-semibold">Tuition & assessment schedule profiles</p>
                    </div>
                </div>
            }
        >
            <Head title="Fee Structures" />

            <div className="py-8">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    <div className="flex justify-end">
                        <Link href={route('finance.fees.create')}>
                            <button className="inline-flex items-center justify-center gap-2 text-xs font-black text-white bg-[#002b80] hover:bg-[#004d31] active:bg-[#003c26] rounded-xl px-4 py-3 shadow-md hover:shadow-lg transition-all duration-200 uppercase tracking-wider">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Create Fee Structure
                            </button>
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-[#002b80]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-widest">Fee Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-widest">Category Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-extrabold text-white uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-widest">Academic Year</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-widest">Grade Level</th>
                                        <th className="px-6 py-4 text-left text-xs font-extrabold text-white uppercase tracking-widest">Status / Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-extrabold text-white uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {fees.map((fee) => {
                                        const typeCfg = TYPE_BADGES[fee.type] || { bg: 'bg-slate-50 text-slate-700' };
                                        return (
                                            <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-extrabold text-slate-800 group-hover:text-[#002b80] transition-colors">{fee.name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${typeCfg.bg} ${typeCfg.text}`}>
                                                        {fee.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-black text-slate-800">
                                                        {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(fee.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {fee.academic_year?.name || 'Global Year'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center justify-center font-mono text-xs font-black px-2 py-1 bg-slate-100 rounded-md text-slate-700">
                                                        {fee.level || 'ALL'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                        fee.is_active ? 'bg-[#e2f0d9] text-[#385723]' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${fee.is_active ? 'bg-[#4caf50]' : 'bg-red-500'}`} />
                                                        {fee.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {fee.is_optional && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700">
                                                            Optional
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {fee.is_active && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenAssign(fee)}
                                                                className="h-8 rounded-lg px-3 inline-flex items-center justify-center gap-1.5 text-xs font-black bg-[#e2f0d9] text-[#385723] hover:bg-[#385723] hover:text-white transition-all shadow-sm uppercase tracking-wide"
                                                                title="Assign to learners"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                                </svg>
                                                                Assign
                                                            </button>
                                                        )}
                                                        <Link href={route('finance.fees.edit', fee.id)}>
                                                            <button
                                                                className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-[#002b80] bg-slate-100 hover:bg-[#002b80]/10 transition-colors"
                                                                title="Edit structure"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {fees.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                                    <span className="text-4xl">📋</span>
                                                    <p className="text-sm font-bold">No fee structures configured yet</p>
                                                    <p className="text-xs">Create tuition or other fees using the button above.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assign Selection Modal */}
            <Modal show={assigningFee !== null} onClose={handleCloseModal}>
                {assigningFee && (
                    <form onSubmit={handleAssignSubmit} className="p-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <h2 className="text-base font-black text-slate-800">
                                    Assign Fee: {assigningFee.name}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    Grade: <span className="font-bold text-slate-600">{assigningFee.level || 'All Levels'}</span> • Amount: <span className="font-bold text-slate-600">AED {assigningFee.amount}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 font-bold animate-pulse">
                                <svg className="w-8 h-8 text-[#002b80] animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                                    <path strokeLinecap="round" d="M12 2v4" />
                                </svg>
                                Fetching students...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Search input */}
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search by name or LRN..."
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border-slate-200 focus:border-[#002b80] focus:ring-[#002b80] rounded-xl shadow-sm transition-all placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-xs">
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-2 font-black text-[#002b80] hover:text-[#004d31] transition-colors"
                                    >
                                        <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                            filteredLearners.length > 0 && filteredLearners.every(l => selectedIds.includes(l.id))
                                                ? 'bg-[#002b80] border-[#002b80] text-white'
                                                : 'border-slate-300 bg-white'
                                        }`}>
                                            {filteredLearners.length > 0 && filteredLearners.every(l => selectedIds.includes(l.id)) && (
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        Select All ({filteredLearners.length})
                                    </button>
                                    <span className="font-bold text-slate-500">{selectedIds.length} of {learners.length} selected</span>
                                </div>

                                {/* Checklist scrollbox */}
                                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 shadow-inner no-scrollbar">
                                    {filteredLearners.map(learner => {
                                        const isSelected = selectedIds.includes(learner.id);
                                        return (
                                            <button
                                                type="button"
                                                key={learner.id}
                                                onClick={() => toggleSelect(learner.id)}
                                                className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl border cursor-pointer transition-all text-left ${
                                                    isSelected ? 'border-[#002b80] bg-[#002b80]/5' : 'border-slate-100 hover:border-[#002b80]/30 hover:bg-slate-50/50'
                                                }`}
                                            >
                                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                                    isSelected ? 'bg-[#002b80] border-[#002b80] text-white' : 'border-slate-300 bg-white'
                                                }`}>
                                                    {isSelected && (
                                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-extrabold text-sm text-slate-800 truncate">{learner.name}</p>
                                                    <p className="text-slate-400 text-xs font-mono mt-0.5">LRN: {learner.lrn}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {filteredLearners.length === 0 && (
                                        <div className="text-center py-8 text-slate-400">
                                            No learners found matching the search.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <SecondaryButton type="button" onClick={handleCloseModal}>
                                Cancel
                            </SecondaryButton>
                            <button
                                type="submit"
                                disabled={selectedIds.length === 0 || submitting || loading}
                                className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-black text-white bg-[#002b80] hover:bg-[#004d31] active:bg-[#003c26] rounded-xl shadow-sm transition-all uppercase tracking-wider disabled:opacity-50"
                            >
                                {submitting ? 'Assigning...' : `ASSIGN (${selectedIds.length})`}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </FinanceLayout>
    );
}
