import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface HouseholdLearner {
    id: number;
    full_name: string;
    lrn: string;
}

interface Household {
    id: number;
    household_code: string;
    family_name: string;
    primary_contact_name: string | null;
    primary_email: string | null;
    primary_phone: string | null;
    learners_count: number;
    learners: HouseholdLearner[];
}

interface IndexProps {
    households: {
        data: Household[];
        links: any[];
    };
    filters: {
        search?: string;
    };
}

export default function Index({ households, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const createForm = useForm({
        family_name: '',
        primary_contact_name: '',
        primary_email: '',
        primary_phone: '',
        address: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('households.index'), { search }, { preserveState: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('households.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-extrabold text-white tracking-tight">Family & Household Accounts</h2>
                    <p className="text-[11px] text-slate-300">Group learners under household units for sibling management & combined accounting</p>
                </div>
            }
        >
            <Head title="Households & Sibling Accounts" />

            <div className="p-4 max-w-7xl mx-auto space-y-4">
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl shadow-xs border border-slate-100">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Search family name, code, contact..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="text-[11px] px-3 py-1.5 border border-slate-200 rounded-xl w-64 focus:ring-1 focus:ring-[#002b80] focus:border-[#002b80]"
                        />
                        <button
                            type="submit"
                            className="bg-[#002b80] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-[#001746] transition-all"
                        >
                            Filter
                        </button>
                    </form>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#002b80] text-[#ffc000] text-[11px] font-black px-4 py-2 rounded-xl shadow-xs hover:bg-[#001746] transition-all"
                    >
                        + Create Household
                    </button>
                </div>

                {/* Household Cards / Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-2.5">Code</th>
                                <th className="px-4 py-2.5">Family Name</th>
                                <th className="px-4 py-2.5">Primary Contact</th>
                                <th className="px-4 py-2.5">Email / Phone</th>
                                <th className="px-4 py-2.5">Linked Learners</th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {households.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                                        No households found. Create one to link sibling accounts.
                                    </td>
                                </tr>
                            ) : (
                                households.data.map((hh) => (
                                    <tr key={hh.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2 font-black text-[#002b80]">{hh.household_code}</td>
                                        <td className="px-4 py-2 font-bold text-slate-900">{hh.family_name} Family</td>
                                        <td className="px-4 py-2">{hh.primary_contact_name || '—'}</td>
                                        <td className="px-4 py-2 text-slate-500">
                                            {hh.primary_email || hh.primary_phone ? (
                                                <>
                                                    {hh.primary_email}
                                                    {hh.primary_phone && <span className="block text-[10px] text-slate-400">{hh.primary_phone}</span>}
                                                </>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {hh.learners.map((l) => (
                                                    <span key={l.id} className="bg-blue-50 text-[#002b80] font-bold text-[10px] px-2 py-0.5 rounded-md border border-blue-100">
                                                        {l.full_name}
                                                    </span>
                                                ))}
                                                {hh.learners.length === 0 && (
                                                    <span className="text-slate-400 text-[10px] italic">No learners linked</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button className="text-[#002b80] font-extrabold hover:underline text-[11px]">
                                                Manage Family
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-xs font-black text-[#002b80]">Create Household / Family Unit</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Family Surname *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dela Cruz"
                                    value={createForm.data.family_name}
                                    onChange={(e) => createForm.setData('family_name', e.target.value)}
                                    className="w-full text-[11px] px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#002b80]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Primary Guardian Contact</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Maria Dela Cruz"
                                    value={createForm.data.primary_contact_name}
                                    onChange={(e) => createForm.setData('primary_contact_name', e.target.value)}
                                    className="w-full text-[11px] px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#002b80]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={createForm.data.primary_email}
                                        onChange={(e) => createForm.setData('primary_email', e.target.value)}
                                        className="w-full text-[11px] px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#002b80]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Phone</label>
                                    <input
                                        type="text"
                                        placeholder="+971 50 xxx xxxx"
                                        value={createForm.data.primary_phone}
                                        onChange={(e) => createForm.setData('primary_phone', e.target.value)}
                                        className="w-full text-[11px] px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#002b80]"
                                    />
                                </div>
                            </div>
                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-4 py-1.5 text-[11px] font-black text-white bg-[#002b80] hover:bg-[#001746] rounded-xl shadow-xs"
                                >
                                    Save Household
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
