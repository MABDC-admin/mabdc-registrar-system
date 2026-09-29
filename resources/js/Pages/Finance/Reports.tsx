import React, { useState } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, Link } from '@inertiajs/react';

type Props = {
    collectionsByMethod: Record<string, number>;
    recentPayments: Array<{
        id: number;
        learner_name: string;
        amount: number;
        method: string;
        date: string;
        reference: string | null;
    }>;
    outstandingAccounts: Array<{
        id: number;
        learner_name: string;
        lrn: string | null;
        level: string;
        total_fees: number;
        total_payments: number;
        balance: number;
    }>;
    feeStructures: Array<{
        id: number;
        name: string;
        type: string;
        amount: number;
        is_active: boolean;
    }>;
    stats: {
        total_outstanding: number;
        total_collected: number;
        active_academic_year: string;
    };
};

export default function Reports({
    collectionsByMethod,
    recentPayments,
    outstandingAccounts,
    feeStructures,
    stats,
}: Props) {
    const [activeTab, setActiveTab] = useState<'collections' | 'outstanding' | 'fees'>('collections');

    const fmt = (amount: number) => {
        return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(amount);
    };

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Financial Reports</h2>
                        <p className="text-xs text-slate-400 font-semibold">Collections analytics, aging accounts & balances</p>
                    </div>
                </div>
            }
        >
            <Head title="Finance Reports" />

            <div className="py-8">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* ── Summary Stats ── */}
                    <div className="grid gap-6 sm:grid-cols-3">
                        {/* Active Year */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                            <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">Active School Year</span>
                            <span className="text-xl font-black text-[#002b80] mt-2 block">{stats.active_academic_year}</span>
                        </div>
                        {/* Total Collected */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                            <span className="text-[10px] font-black text-slate-400 block tracking-wider uppercase">Cumulative Collections</span>
                            <span className="text-xl font-black text-emerald-600 mt-2 block">{fmt(stats.total_collected)}</span>
                        </div>
                        {/* Total Outstanding */}
                        <div className="bg-[#fdf2f2] rounded-2xl border border-red-150 p-5 shadow-xs">
                            <span className="text-[10px] font-black text-red-500 block tracking-wider uppercase">Total Outstanding Receivables</span>
                            <span className="text-xl font-black text-red-600 mt-2 block">{fmt(stats.total_outstanding)}</span>
                        </div>
                    </div>

                    {/* ── Tab Bar and Actions ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('collections')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'collections' ? 'bg-[#002b80] text-white' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                Collections Summary
                            </button>
                            <button
                                onClick={() => setActiveTab('outstanding')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'outstanding' ? 'bg-[#002b80] text-white' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                Outstanding aging
                            </button>
                            <button
                                onClick={() => setActiveTab('fees')}
                                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                    activeTab === 'fees' ? 'bg-[#002b80] text-white' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                Fee structure stats
                            </button>
                        </div>

                        <div className="flex gap-2">
                            {activeTab === 'collections' && (
                                <a
                                    href="/finance/reports/export-collections"
                                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#002b80] border-2 border-[#002b80] bg-white hover:bg-green-50 px-4 py-2.5 rounded-xl transition duration-200 uppercase tracking-wider"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Collections PDF
                                </a>
                            )}
                            {activeTab === 'outstanding' && (
                                <a
                                    href="/finance/reports/export-outstanding"
                                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#002b80] border-2 border-[#002b80] bg-white hover:bg-green-50 px-4 py-2.5 rounded-xl transition duration-200 uppercase tracking-wider"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Receivables PDF
                                </a>
                            )}
                        </div>
                    </div>

                    {/* ── Tab Content ── */}
                    {activeTab === 'collections' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Breakdown Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Collections by Method</h3>
                                <div className="space-y-4">
                                    {Object.entries(collectionsByMethod).map(([method, total]) => {
                                        const percentage = stats.total_collected > 0 ? (total / stats.total_collected) * 100 : 0;
                                        return (
                                            <div key={method} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                                    <span>{method}</span>
                                                    <span>{fmt(total)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden lg:col-span-2">
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Recent Collections History</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-[#002b80]">
                                            <tr>
                                                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Student</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Method</th>
                                                <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-widest">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {recentPayments.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-slate-800">{p.learner_name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-xs font-semibold text-slate-500">{p.date}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                            {p.method}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm font-black text-emerald-600">+{fmt(p.amount)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentPayments.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-xs font-bold text-slate-400">
                                                        No recent collections found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'outstanding' && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Aging Accounts with Outstanding Balances</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-[#002b80]">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Student Name</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">LRN</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Level</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-widest">Total Fees</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-widest">Total Paid</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-widest">Outstanding</th>
                                            <th className="px-6 py-3.5 text-center text-xs font-extrabold text-white uppercase tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {outstandingAccounts.map((acc) => (
                                            <tr key={acc.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-extrabold text-slate-800">{acc.learner_name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs font-semibold text-slate-500">{acc.lrn ?? 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center justify-center font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                                                        {acc.level}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold text-slate-600">
                                                    {fmt(acc.total_fees)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold text-slate-650">
                                                    {fmt(acc.total_payments)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-black text-red-600">{fmt(acc.balance)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <Link
                                                        href={route('learner-accounts.show', acc.id)}
                                                        className="text-xs font-extrabold text-[#002b80] hover:underline"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {outstandingAccounts.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-xs font-bold text-slate-400">
                                                    No accounts with outstanding balances.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fees' && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Active Fee Schedules & Assessment Types</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-[#002b80]">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Fee Name</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-widest">Category</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-widest">Scheduled Amount</th>
                                            <th className="px-6 py-3.5 text-center text-xs font-extrabold text-white uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {feeStructures.map((fs) => (
                                            <tr key={fs.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-800">{fs.name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-655">
                                                        {fs.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-black text-slate-800">{fmt(fs.amount)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                        fs.is_active ? 'bg-[#e2f0d9] text-[#385723]' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                        {fs.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </FinanceLayout>
    );
}
