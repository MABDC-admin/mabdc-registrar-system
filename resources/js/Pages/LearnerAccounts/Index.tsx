import React, { useState } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, Link, router } from '@inertiajs/react';

const fmt = (n: number | string) =>
    parseFloat(String(n)).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    'Cleared':        { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    'Partially Paid': { bg: 'bg-amber-50 text-amber-800 border-amber-200',     text: 'text-amber-800',   dot: 'bg-amber-500' },
    'Unpaid':         { bg: 'bg-red-50 text-red-800 border-red-200',         text: 'text-red-800',     dot: 'bg-red-500'   },
    'No Assessment':  { bg: 'bg-slate-100 text-slate-700 border-slate-200',  text: 'text-slate-700',   dot: 'bg-slate-400' },
};

const STATUS_PILLS = ['', 'Cleared', 'Partially Paid', 'Unpaid', 'No Assessment'];

function getInitials(name: string) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Index({ enrollments, pendingRegistrations = [], levels = [], filters }: any) {
    const [search, setSearch]           = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [levelFilter, setLevelFilter]   = useState(filters.level || '');
    const [settleModalApp, setSettleModalApp] = useState<any>(null);
    const [receiptNo, setReceiptNo]       = useState('');
    const [isSettling, setIsSettling]     = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('learner-accounts.index'), { search, status: statusFilter, level: levelFilter }, { preserveState: true });
    };

    const handleStatusFilter = (s: string) => {
        setStatusFilter(s);
        router.get(route('learner-accounts.index'), { search, status: s, level: levelFilter }, { preserveState: true });
    };

    const handleLevelFilter = (l: string) => {
        setLevelFilter(l);
        router.get(route('learner-accounts.index'), { search, status: statusFilter, level: l }, { preserveState: true });
    };

    const handleConfirmSettle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!settleModalApp) return;
        setIsSettling(true);
        router.post(
            route('learner-accounts.applications.settle', settleModalApp.id),
            { receipt_no: receiptNo },
            {
                onFinish: () => {
                    setIsSettling(false);
                    setSettleModalApp(null);
                    setReceiptNo('');
                },
            }
        );
    };

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-black text-xl text-slate-900 leading-tight">Learner Accounts</h2>
                        <p className="text-xs text-slate-500 font-semibold">{enrollments.total} total accounts</p>
                    </div>
                </div>
            }
        >
            <Head title="Learner Accounts" />

            <div className="py-6">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-5">

                    {/* ── Pending Registration Settlements High-Contrast Card ── */}
                    {pendingRegistrations && pendingRegistrations.length > 0 && (
                        <div className="bg-[#001746] rounded-2xl shadow-lg p-5 text-white border-2 border-[#ffc000] space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#ffc000] text-[#001746] flex items-center justify-center font-black text-xl shadow-xs">
                                        ₱
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base text-white tracking-wide">
                                            Pending Registration Downpayment Settlements ({pendingRegistrations.length})
                                        </h3>
                                        <p className="text-xs text-slate-200 font-medium">
                                            Newly registered applicants waiting at cashier to settle ₱500 downpayment before Registrar admission
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/90 rounded-xl overflow-hidden border border-slate-700">
                                <table className="w-full text-left text-xs text-white">
                                    <thead className="bg-[#002b80] font-extrabold uppercase text-[10px] text-[#ffc000]">
                                        <tr>
                                            <th className="px-4 py-3">Applicant Name</th>
                                            <th className="px-4 py-3">Classification & Level</th>
                                            <th className="px-4 py-3">Contact / Email</th>
                                            <th className="px-4 py-3">Previous Year Balance</th>
                                            <th className="px-4 py-3">Registered Date</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 font-medium">
                                        {pendingRegistrations.map((app: any) => {
                                            const displayName = app.full_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || `Applicant #${app.id}`;
                                            const hasPrevBalance = (app.previous_balance || 0) > 0;
                                            const isReturning = app.is_returning || app.classification === 'RETURNING';

                                            return (
                                                <tr key={app.id} className="hover:bg-slate-800/60 transition">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-full bg-[#ffc000] text-[#001746] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                                                {getInitials(displayName)}
                                                            </div>
                                                            <span className="font-black text-[#ffc000] text-sm tracking-wide">
                                                                {displayName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-slate-200">
                                                        <div className="flex flex-col">
                                                            <span>{app.level_applied_for}</span>
                                                            <span className={`text-[10px] uppercase font-black tracking-wider ${isReturning ? 'text-amber-400' : 'text-slate-400'}`}>
                                                                {isReturning ? '🔄 RETURNING' : 'NEW APPLICANT'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-300">{app.contact_number} • {app.email || 'No email'}</td>
                                                    <td className="px-4 py-3">
                                                        {hasPrevBalance ? (
                                                            <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/50 text-[11px] font-black px-2.5 py-1 rounded-lg">
                                                                ⚠️ AED {fmt(app.previous_balance)}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[11px] font-black px-2.5 py-1 rounded-lg">
                                                                ✓ Cleared
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-300">{app.created_at}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSettleModalApp(app);
                                                                setReceiptNo(`REG-SETTLED-${Math.floor(1000 + Math.random() * 9000)}`);
                                                            }}
                                                            className="bg-[#ffc000] hover:bg-[#ffe066] text-[#001746] font-black text-xs px-4 py-2 rounded-xl shadow-sm transition transform active:scale-95 inline-flex items-center gap-1.5"
                                                        >
                                                            ✓ Settle ₱500 Registration
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Settle Registration Modal ── */}
                    {settleModalApp && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
                            <div className="bg-[#001746] border-2 border-[#ffc000] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-white animate-in fade-in zoom-in duration-150">
                                <div className="bg-[#002b80] px-6 py-4 flex justify-between items-center border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#ffc000] text-[#001746] font-black flex items-center justify-center">
                                            ₱
                                        </div>
                                        <h3 className="font-black text-base text-white tracking-wide">
                                            Confirm Registration Settlement
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSettleModalApp(null)}
                                        className="text-slate-300 hover:text-white text-xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleConfirmSettle} className="p-6 space-y-4">
                                    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-black text-[#ffc000] uppercase tracking-wider">Applicant Profile</p>
                                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${settleModalApp.is_returning || settleModalApp.classification === 'RETURNING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
                                                {settleModalApp.is_returning || settleModalApp.classification === 'RETURNING' ? '🔄 Returning Learner' : 'New Applicant'}
                                            </span>
                                        </div>
                                        <p className="text-lg font-black text-white">{settleModalApp.full_name || `${settleModalApp.first_name || ''} ${settleModalApp.last_name || ''}`.trim()}</p>
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                                            <div><span className="text-slate-400">Level:</span> <strong className="text-white">{settleModalApp.level_applied_for}</strong></div>
                                            <div><span className="text-slate-400">Phone:</span> <strong className="text-white">{settleModalApp.contact_number || 'N/A'}</strong></div>
                                            <div><span className="text-slate-400">Email:</span> <strong className="text-white">{settleModalApp.email || 'N/A'}</strong></div>
                                        </div>
                                    </div>

                                    {/* Previous Balance Indicator Banner */}
                                    {(settleModalApp.previous_balance || 0) > 0 ? (
                                        <div className="bg-red-950/80 border border-red-500/60 rounded-xl p-3 text-xs text-red-200 space-y-1">
                                            <p className="font-black text-red-300 flex items-center gap-1.5">
                                                <span>⚠️</span> Outstanding Previous Year Balance: AED {fmt(settleModalApp.previous_balance)}
                                            </p>
                                            <p className="text-[11px] text-red-200">
                                                This returning learner has an unpaid balance from previous enrollment. Please notify parent to settle previous arrears along with the ₱500 registration downpayment.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200">
                                            <p className="font-extrabold flex items-center gap-1.5 text-emerald-400">
                                                <span>✓</span> Previous Academic Year Balance: Cleared (No Arrears)
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-black text-[#ffc000] uppercase tracking-wide mb-1">
                                            Cashier Receipt / OR Number (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={receiptNo}
                                            onChange={(e) => setReceiptNo(e.target.value)}
                                            placeholder="e.g. OR-987654"
                                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#ffc000] focus:ring-1 focus:ring-[#ffc000]"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Recorded in Finance audit log & contract metadata.
                                        </p>
                                    </div>

                                    <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200">
                                        <p className="font-extrabold flex items-center gap-1.5 text-emerald-400">
                                            <span>✓</span> ₱500 Registration Downpayment
                                        </p>
                                        <p className="text-[11px] mt-0.5 text-emerald-300">
                                            Marking this applicant as settled allows Registrar to execute contract signing and official admission.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setSettleModalApp(null)}
                                            className="px-4 py-2.5 rounded-xl border border-slate-600 text-xs font-bold text-slate-300 hover:bg-white/5 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSettling}
                                            className="px-5 py-2.5 rounded-xl bg-[#ffc000] hover:bg-[#ffe066] text-[#001746] font-black text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSettling ? 'Processing...' : '✓ Confirm ₱500 Settlement'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ── Filter Bar ── */}
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

                        {/* Status Pills */}
                        <div className="flex flex-wrap gap-2">
                            {STATUS_PILLS.map((s) => {
                                const active = statusFilter === s;
                                const cfg = s ? STATUS_CONFIG[s] : null;
                                return (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusFilter(s)}
                                        className={`text-xs px-4 py-2 rounded-xl font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-2 border ${
                                            active
                                                ? 'bg-[#002b80] text-white border-[#ffc000] shadow-xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {cfg && (
                                            <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#ffc000]' : cfg.dot}`} />
                                        )}
                                        {s === '' ? 'ALL' : s}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: Level + Search */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Level Dropdown */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={levelFilter}
                                    onChange={(e) => handleLevelFilter(e.target.value)}
                                    className="text-xs font-bold rounded-xl border-slate-300 focus:border-[#002b80] focus:ring-[#002b80] bg-white text-slate-700 py-1.5"
                                >
                                    <option value="">All Levels</option>
                                    {levels.map((lvl: string) => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name or LRN..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-3 pr-4 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-[#002b80] focus:ring-1 focus:ring-[#002b80] outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-[#002b80] hover:bg-[#001746] text-[#ffc000] font-black text-xs uppercase px-4 py-1.5 rounded-xl shadow-xs transition"
                                >
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ── Table Card ── */}
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-[#002b80]">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Learner</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-wider">LRN</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Grade</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Academic Year</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-extrabold text-white uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-wider">Outstanding Balance</th>
                                    <th className="px-6 py-3.5 text-right text-xs font-extrabold text-white uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {enrollments.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <p className="font-black text-slate-800 text-sm">No learner accounts found.</p>
                                                <p className="text-xs text-slate-500">Try adjusting the filters or search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {enrollments.data.map((e: any) => {
                                    const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG['No Assessment'];
                                    const balance = parseFloat(e.balance);
                                    const hasBalance = balance > 0;

                                    return (
                                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#002b80]/10 text-[#002b80] flex items-center justify-center font-black text-xs shrink-0">
                                                        {getInitials(e.learner_name || '?')}
                                                    </div>
                                                    <span className="font-extrabold text-xs text-slate-900">{e.learner_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-slate-500">{e.lrn || '—'}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-xs font-bold text-slate-700">{e.grade_level || '—'}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">{e.academic_year || '—'}</td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${cfg.bg}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right font-black text-xs">
                                                <span className={hasBalance ? 'text-red-600' : 'text-slate-800'}>
                                                    AED {fmt(balance)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-right text-xs">
                                                <Link
                                                    href={route('learner-accounts.show', e.id)}
                                                    className="font-black text-[#002b80] hover:underline"
                                                >
                                                    View Ledger &rarr;
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </FinanceLayout>
    );
}
