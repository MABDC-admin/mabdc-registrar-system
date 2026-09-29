import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

type Learner = {
    id: number;
    full_name: string;
    normalized_name: string;
};

type Section = {
    id: number;
    level: string;
    name: string;
};

type Enrollment = {
    id: number;
    learner: Learner;
    section: Section | null;
    level: string;
    status: string;
    metadata: {
        transfer_date?: string;
        transfer_reason?: string;
    } | null;
};

export default function Transfers({ auth, enrollments, activeEnrollments }: PageProps & { enrollments: Enrollment[], activeEnrollments: Enrollment[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'transferred' | 'withdrawn'>('all');
    
    // Custom searchable selector states
    const [searchStudentTerm, setSearchStudentTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        enrollment_id: '',
        type: 'transferred',
        date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('transfers.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setSearchStudentTerm('');
            }
        });
    };

    // Selected student details
    const selectedStudent = useMemo(() => {
        return activeEnrollments.find(e => e.id.toString() === data.enrollment_id);
    }, [activeEnrollments, data.enrollment_id]);

    // Filter active student list for searchable dropdown selection
    const filteredActiveEnrollments = useMemo(() => {
        if (!searchStudentTerm) return activeEnrollments;
        return activeEnrollments.filter(e => 
            e.learner?.full_name.toLowerCase().includes(searchStudentTerm.toLowerCase())
        );
    }, [activeEnrollments, searchStudentTerm]);

    // Filtered history list
    const filteredEnrollments = useMemo(() => {
        return enrollments.filter(e => {
            const matchesSearch = e.learner?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filterType === 'all' || e.status === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [enrollments, searchTerm, filterType]);

    // KPI Metrics calculation
    const totalTransferred = enrollments.filter(e => e.status === 'transferred').length;
    const totalWithdrawn = enrollments.filter(e => e.status === 'withdrawn').length;
    const totalActiveCount = activeEnrollments.length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                            🔄 Student Movement Workspace
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transfers & Withdrawals</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Track student exits, clear sections, and maintain academic history records.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                        </svg>
                        Process Movement
                    </button>
                </div>
            }
        >
            <Head title="Transfers & Withdrawals" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="mx-auto w-full max-w-none space-y-8">

                    {/* ── Visual KPI Cards ── */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* KPI 1: Active Roster */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 rounded-2xl border border-slate-700/55 p-5 shadow-lg flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-550/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                            <div className="space-y-1 z-10">
                                <span className="text-[9px] font-black text-indigo-400 block tracking-widest uppercase">Active Student Pool</span>
                                <span className="text-3xl font-black text-white block tracking-tight">{totalActiveCount}</span>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* KPI 2: Total Transferred */}
                        <div className="bg-gradient-to-br from-amber-955 via-amber-900 to-amber-950 rounded-2xl border border-amber-800/40 p-5 shadow-lg flex items-center justify-between group hover:border-amber-450 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-550/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                            <div className="space-y-1 z-10">
                                <span className="text-[9px] font-black text-amber-400 block tracking-widest uppercase">Transferred Out</span>
                                <span className="text-3xl font-black text-white block tracking-tight">{totalTransferred}</span>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                        </div>

                        {/* KPI 3: Total Withdrawn */}
                        <div className="bg-gradient-to-br from-rose-955 via-rose-900 to-rose-950 rounded-2xl border border-rose-800/40 p-5 shadow-lg flex items-center justify-between group hover:border-rose-500 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                            <div className="space-y-1 z-10">
                                <span className="text-[9px] font-black text-rose-400 block tracking-widest uppercase">Withdrawn Students</span>
                                <span className="text-3xl font-black text-white block tracking-tight">{totalWithdrawn}</span>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* ── Table & Search Controls ── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                            <div className="relative max-w-md w-full">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by student full name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 w-full rounded-lg border border-slate-200 text-xs font-bold focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 inline-flex items-center shadow-xs">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black transition uppercase tracking-wider ${
                                        filterType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    All History
                                </button>
                                <button
                                    onClick={() => setFilterType('transferred')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black transition uppercase tracking-wider ${
                                        filterType === 'transferred' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Transfers
                                </button>
                                <button
                                    onClick={() => setFilterType('withdrawn')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black transition uppercase tracking-wider ${
                                        filterType === 'withdrawn' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Withdrawals
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 table-fixed">
                                <thead className="bg-[#002b80]">
                                    <tr>
                                        <th className="w-1/3 px-6 py-3.5 text-left text-[10px] font-black text-white uppercase tracking-widest">Student Info</th>
                                        <th className="w-1/6 px-6 py-3.5 text-left text-[10px] font-black text-white uppercase tracking-widest">Exit Type</th>
                                        <th className="w-1/6 px-6 py-3.5 text-left text-[10px] font-black text-white uppercase tracking-widest">Effective Date</th>
                                        <th className="w-1/3 px-6 py-3.5 text-left text-[10px] font-black text-white uppercase tracking-widest">Reason / Description</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredEnrollments.map((enrollment) => {
                                        const initials = enrollment.learner?.full_name
                                            ? enrollment.learner.full_name.split(',').map(n => n.trim()[0]).join('').slice(0, 2).toUpperCase()
                                            : 'ST';
                                        return (
                                            <tr key={enrollment.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${
                                                            enrollment.status === 'transferred' ? 'from-amber-500 to-orange-650' : 'from-rose-500 to-pink-650'
                                                        } text-white font-black text-[10px] flex items-center justify-center shadow-xs`}>
                                                            {initials}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">{enrollment.learner?.full_name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 truncate">Section: {enrollment.section?.name || 'Unassigned'} • {enrollment.level}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 inline-flex text-[9px] font-black rounded-md border ${
                                                        enrollment.status === 'transferred' 
                                                            ? 'bg-amber-50 text-amber-800 border-amber-200/50' 
                                                            : 'bg-rose-50 text-rose-800 border-rose-200/50'
                                                    }`}>
                                                        {enrollment.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                                                    {enrollment.metadata?.transfer_date || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500 break-words">
                                                    {enrollment.metadata?.transfer_reason || 'N/A'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEnrollments.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest bg-slate-50/20">
                                                No transfer or withdrawal logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redesigned Processing Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={submit} className="p-6 space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h3 className="text-md font-black text-slate-850 uppercase tracking-wider flex items-center gap-2">
                            🔄 Process Student Exit / Withdrawal
                        </h3>
                    </div>
                    
                    <div className="grid gap-5">
                        <div className="relative">
                            <InputLabel htmlFor="enrollment_id_search" value="Select Active Student" />
                            <div className="relative">
                                <input
                                    id="enrollment_id_search"
                                    type="text"
                                    placeholder={selectedStudent ? selectedStudent.learner.full_name : "Type student name to search..."}
                                    value={searchStudentTerm}
                                    onChange={(e) => {
                                        setSearchStudentTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="mt-1 block w-full rounded-lg border-slate-200 text-xs font-bold uppercase focus:ring-emerald-500 focus:border-emerald-500 shadow-sm pr-10"
                                />
                                {selectedStudent && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setData('enrollment_id', '');
                                            setSearchStudentTerm('');
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            
                            {isDropdownOpen && (
                                <div className="absolute z-55 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scroll">
                                    {filteredActiveEnrollments.map(enrollment => (
                                        <button
                                            key={enrollment.id}
                                            type="button"
                                            onClick={() => {
                                                setData('enrollment_id', enrollment.id.toString());
                                                setSearchStudentTerm(enrollment.learner.full_name);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors text-xs border-b border-slate-100 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-black text-slate-800 uppercase">{enrollment.learner?.full_name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">Level: {enrollment.level} • Section: {enrollment.section?.name || 'Unassigned'}</p>
                                            </div>
                                            {data.enrollment_id === enrollment.id.toString() && (
                                                <span className="text-emerald-600 font-black">✓</span>
                                            )}
                                        </button>
                                    ))}
                                    {filteredActiveEnrollments.length === 0 && (
                                        <div className="p-4 text-center text-slate-400 text-xs font-black uppercase tracking-wider">
                                            No matching students found.
                                        </div>
                                    )}
                                </div>
                            )}
                            <InputError message={errors.enrollment_id} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="type" value="Movement Type" />
                                <select
                                    id="type"
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-slate-200 text-xs font-black uppercase focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                    required
                                >
                                    <option value="transferred">Transfer Out</option>
                                    <option value="withdrawn">Withdrawal</option>
                                </select>
                                <InputError message={errors.type} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="date" value="Effective Date" />
                                <input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-slate-200 text-xs font-black focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                    required
                                />
                                <InputError message={errors.date} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="reason" value="Reason / Details" />
                            <textarea
                                id="reason"
                                value={data.reason}
                                onChange={e => setData('reason', e.target.value)}
                                className="mt-1 block w-full rounded-lg border-slate-200 text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                                placeholder="Enter specific details regarding transfer/withdrawal..."
                                rows={3}
                                required
                            />
                            <InputError message={errors.reason} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                            Submit Exit
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
