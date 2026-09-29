import React, { useState, useMemo } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, Link, router } from '@inertiajs/react';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number | string) =>
    parseFloat(String(n)).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtK = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
    return n.toFixed(0);
};

function initials(name: string) {
    const p = (name || '').trim().split(' ');
    return p.length === 1 ? p[0][0] : (p[0][0] + p[p.length - 1][0]);
}

// ─── types ───────────────────────────────────────────────────────────────────
interface KPIs {
    total_billed: number;
    total_payments: number;
    total_discounts: number;
    total_refunds: number;
    outstanding: number;
    collection_rate: number;
    overdue_count: number;
    today_collections: number;
    today_count: number;
}
interface Transaction { id: number; type: string; description: string; amount: number; date: string; learner: string; }
interface MonthlyIncome { month: string; total: string; }
interface FinancialHold { id: number; name: string; status: string; level: string; }
interface GradeBreakdown { level: string; count: number; outstanding: number; }
interface Debtor { id: number; name: string; level: string; balance: number; }

const TYPE_CFG: Record<string, { bg: string; text: string; dot: string }> = {
    charge:   { bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-400'    },
    tax:      { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-400' },
    payment:  { bg: 'bg-[#e2f0d9]',  text: 'text-[#385723]',  dot: 'bg-[#4caf50]'  },
    discount: { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400'   },
    refund:   { bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-400' },
};

const STATUS_CFG: Record<string, { bg: string; text: string; dot: string }> = {
    'Cleared':        { bg: 'bg-[#e2f0d9]', text: 'text-[#385723]', dot: 'bg-[#4caf50]' },
    'Partially Paid': { bg: 'bg-amber-50',  text: 'text-amber-700', dot: 'bg-amber-400'  },
    'Unpaid':         { bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500'    },
    'No Assessment':  { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400'  },
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function Index({
    kpis,
    recent_transactions,
    monthly_income,
    financial_holds,
    status_breakdown = {},
    grade_breakdown  = [],
    top_debtors      = [],
}: {
    kpis: KPIs;
    recent_transactions: Transaction[];
    monthly_income: MonthlyIncome[];
    financial_holds: FinancialHold[];
    status_breakdown: Record<string, number>;
    grade_breakdown: GradeBreakdown[];
    top_debtors: Debtor[];
}) {
    const [viewMode, setViewMode] = useState<'standard' | 'powerbi'>('standard');
    const maxMonthly = Math.max(...monthly_income.map(m => parseFloat(m.total)), 1);

    const totalStudents = Object.values(status_breakdown).reduce((a, b) => a + b, 0);
    const cleared   = status_breakdown['Cleared']        ?? 0;
    const partial   = status_breakdown['Partially Paid'] ?? 0;
    const unpaid    = status_breakdown['Unpaid']         ?? 0;
    const noAssess  = status_breakdown['No Assessment']  ?? 0;

    const maxGradeOut = Math.max(...grade_breakdown.map(g => g.outstanding), 1);

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Finance & Collections Dashboard</h2>
                        <p className="text-xs text-slate-400 font-semibold">Real-time financial overview</p>
                    </div>
                </div>
            }
        >
            <Head title="Finance Dashboard" />

            <div className="py-8">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Dashboard Presentation Mode Selector ── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 gap-4 shadow-xs">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                Presentation Mode
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Toggle between the operational Finance Dashboard and Power BI Analytics Presentation.
                            </p>
                        </div>
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 shrink-0 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setViewMode('standard')}
                                className={`flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                    viewMode === 'standard'
                                        ? 'bg-[#002b80] text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                            >
                                🏫 Finance Dashboard
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('powerbi')}
                                className={`flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                    viewMode === 'powerbi'
                                        ? 'bg-[#252423] text-[#f3c200] shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 17H5V10H9V17ZM14 17H10V7H14V17ZM19 17H15V3H19V17ZM21 21H3V19H21V21Z"/>
                                </svg>
                                📊 Power BI Analytics View
                            </button>
                        </div>
                    </div>

                    {viewMode === 'powerbi' ? (
                        <PowerBiFinanceReport 
                            kpis={kpis}
                            recent_transactions={recent_transactions}
                            monthly_income={monthly_income}
                            status_breakdown={status_breakdown}
                            grade_breakdown={grade_breakdown}
                            top_debtors={top_debtors}
                        />
                    ) : (
                        <>
                            {/* ── Row 1: Primary KPI Cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <PrimaryKpi
                            label="Total Billed"
                            value={`AED ${fmt(kpis.total_billed)}`}
                            sub="All charges + VAT"
                            icon={<BilledIcon />}
                            gradient="from-[#002b80] to-[#00a86b]"
                        />
                        <PrimaryKpi
                            label="Total Collected"
                            value={`AED ${fmt(kpis.total_payments)}`}
                            sub="All payments received"
                            icon={<CollectedIcon />}
                            gradient="from-[#1565c0] to-[#1e88e5]"
                        />
                        <PrimaryKpi
                            label="Outstanding"
                            value={`AED ${fmt(kpis.outstanding)}`}
                            sub={`${kpis.overdue_count} accounts unpaid`}
                            icon={<OutstandingIcon />}
                            gradient="from-[#b71c1c] to-[#e53935]"
                        />
                        <PrimaryKpi
                            label="Collection Rate"
                            value={`${kpis.collection_rate}%`}
                            sub="Payments vs billed"
                            icon={<RateIcon />}
                            gradient="from-[#6a1b9a] to-[#9c27b0]"
                            progress={kpis.collection_rate}
                        />
                    </div>

                    {/* ── Row 2: Secondary KPI Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <SecondaryKpi label="Today's Collections" value={`AED ${fmt(kpis.today_collections)}`} sub={`${kpis.today_count} payments today`} color="text-[#002b80]" bgColor="bg-[#e2f0d9]" icon={<TodayIcon />} />
                        <SecondaryKpi label="Discounts Granted"   value={`AED ${fmt(kpis.total_discounts)}`}  sub="Cumulative"                           color="text-[#1565c0]" bgColor="bg-blue-50"     icon={<DiscountIcon />} />
                        <SecondaryKpi label="Refunds Issued"      value={`AED ${fmt(kpis.total_refunds)}`}    sub="Cumulative"                           color="text-purple-700" bgColor="bg-purple-50"  icon={<RefundIcon />} />
                        <SecondaryKpi label="Unassessed Students" value={String(noAssess)}                   sub="No fees loaded yet"                   color="text-slate-600"  bgColor="bg-slate-100"  icon={<UnassessedIcon />} />
                    </div>

                    {/* ── Row 3: Bar Chart + Status Donut ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* Monthly Collections Chart */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Monthly Collections</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Last 12 months · AED</p>
                                </div>
                                <span className="text-xs font-black text-[#002b80] bg-[#e2f0d9] px-3 py-1 rounded-full uppercase tracking-wide">
                                    {monthly_income.length} months
                                </span>
                            </div>
                            {monthly_income.length === 0 ? (
                                <div className="h-44 flex items-center justify-center text-slate-300 text-sm font-semibold">No payment data yet</div>
                            ) : (
                                <div className="flex items-end gap-2 h-44 overflow-x-auto pb-1">
                                    {monthly_income.map((m) => {
                                        const val = parseFloat(m.total);
                                        const h   = Math.max(Math.round((val / maxMonthly) * 100), 2);
                                        const isMax = val === maxMonthly;
                                        return (
                                            <div key={m.month} className="flex flex-col items-center flex-shrink-0 w-14 group cursor-default">
                                                <span className={`text-[10px] font-black mb-1.5 transition-colors ${isMax ? 'text-[#002b80]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                                    {fmtK(val)}
                                                </span>
                                                <div
                                                    className={`w-10 rounded-t-lg transition-all ${isMax ? 'bg-gradient-to-t from-[#002b80] to-[#00a86b]' : 'bg-gradient-to-t from-slate-300 to-slate-200 group-hover:from-[#002b80]/60 group-hover:to-[#00a86b]/60'}`}
                                                    style={{ height: `${h}%`, minHeight: '4px' }}
                                                />
                                                <span className="text-[9px] font-bold text-slate-400 mt-1.5 text-center leading-tight">{m.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Account Status Breakdown */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                            <div className="mb-4">
                                <h3 className="text-base font-black text-slate-800">Account Status</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{totalStudents} enrolled students</p>
                            </div>
                            <div className="flex-1 space-y-3">
                                {[
                                    { label: 'Cleared',        count: cleared,  pct: totalStudents ? Math.round((cleared  / totalStudents) * 100) : 0, bar: 'bg-[#4caf50]' },
                                    { label: 'Partially Paid', count: partial,  pct: totalStudents ? Math.round((partial  / totalStudents) * 100) : 0, bar: 'bg-amber-400'  },
                                    { label: 'Unpaid',         count: unpaid,   pct: totalStudents ? Math.round((unpaid   / totalStudents) * 100) : 0, bar: 'bg-red-500'    },
                                    { label: 'No Assessment',  count: noAssess, pct: totalStudents ? Math.round((noAssess / totalStudents) * 100) : 0, bar: 'bg-slate-300'  },
                                ].map(s => (
                                    <div key={s.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-600">{s.label}</span>
                                            <span className="font-black text-slate-800">{s.count} <span className="text-slate-400 font-semibold">({s.pct}%)</span></span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-2.5 rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href={route('learner-accounts.index')}
                                className="mt-5 flex items-center justify-center gap-1.5 text-xs font-black text-[#002b80] border border-[#002b80] hover:bg-[#002b80] hover:text-white rounded-lg py-2 transition-all uppercase tracking-wide"
                            >
                                View All Accounts
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </Link>
                        </div>
                    </div>

                    {/* ── Row 4: Grade Breakdown + Top Debtors ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Outstanding by Grade Level */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Outstanding by Grade Level</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Levels with unpaid balances</p>
                                </div>
                            </div>
                            {grade_breakdown.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No outstanding balances 🎉</p>
                            ) : (
                                <div className="space-y-3">
                                    {grade_breakdown.map(g => {
                                        const pct = Math.round((g.outstanding / maxGradeOut) * 100);
                                        return (
                                            <div key={g.level} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#002b80] text-white flex items-center justify-center text-xs font-black shrink-0">
                                                    {g.level}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="font-bold text-slate-600">{g.count} student{g.count !== 1 ? 's' : ''}</span>
                                                        <span className="font-black text-red-600">AED {fmt(g.outstanding)}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-700" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Top Debtors */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Top Outstanding Accounts</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Highest unpaid balances</p>
                                </div>
                                <Link
                                    href={route('learner-accounts.index', { status: 'Unpaid' })}
                                    className="text-xs font-black text-[#002b80] hover:underline uppercase tracking-wide"
                                >
                                    View All →
                                </Link>
                            </div>
                            {top_debtors.length === 0 ? (
                                <p className="p-6 text-sm text-slate-400 text-center py-8">No outstanding accounts 🎉</p>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {top_debtors.map((d, i) => (
                                        <div
                                            key={d.id}
                                            onClick={() => router.get(route('learner-accounts.show', d.id))}
                                            className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            <span className="w-5 text-xs font-black text-slate-300">#{i + 1}</span>
                                            <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-black shrink-0">
                                                {initials(d.name || '?')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-extrabold text-slate-800 group-hover:text-[#002b80] transition-colors truncate">{d.name}</p>
                                                <p className="text-xs text-slate-400 font-semibold">{d.level}</p>
                                            </div>
                                            <span className="text-sm font-black text-red-600 shrink-0">AED {fmt(d.balance)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Row 5: Transactions + Financial Holds ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100">
                                <h3 className="text-base font-black text-slate-800">Recent Transactions</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Last 10 ledger entries</p>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recent_transactions.length === 0 && (
                                    <p className="p-6 text-sm text-slate-400 text-center py-8">No transactions yet.</p>
                                )}
                                {recent_transactions.map((t) => {
                                    const cfg = TYPE_CFG[t.type] || TYPE_CFG['charge'];
                                    const isCredit = t.amount < 0;
                                    return (
                                        <div key={t.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/70 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{t.type}</span>
                                                    <p className="text-xs text-slate-500 truncate">{t.description}</p>
                                                </div>
                                                <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">{t.learner}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-sm font-black ${isCredit ? 'text-[#385723]' : 'text-red-600'}`}>
                                                    {isCredit ? '-' : '+'}AED {fmt(Math.abs(t.amount))}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.date}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Financial Holds */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-black text-slate-800">Learners with Financial Holds</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Unpaid or partially paid accounts</p>
                                </div>
                                {financial_holds.length > 0 && (
                                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-black flex items-center justify-center">
                                        {financial_holds.length}
                                    </span>
                                )}
                            </div>
                            <div className="divide-y divide-slate-50">
                                {financial_holds.length === 0 && (
                                    <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                                        <span className="text-3xl">🎉</span>
                                        <p className="text-sm font-bold">No financial holds!</p>
                                    </div>
                                )}
                                {financial_holds.map((h) => {
                                    const cfg = STATUS_CFG[h.status] || STATUS_CFG['No Assessment'];
                                    return (
                                        <div key={h.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                                            <div className="w-9 h-9 rounded-full bg-[#002b80] text-white flex items-center justify-center text-xs font-black shrink-0">
                                                {initials(h.name || '?')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-extrabold text-slate-800 truncate">{h.name}</p>
                                                <p className="text-xs text-slate-400 font-semibold">{h.level}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                {h.status}
                                            </span>
                                        </div>
                                    );
                                })}
                                {financial_holds.length > 0 && (
                                    <div className="px-6 py-3">
                                        <Link
                                            href={route('learner-accounts.index', { status: 'Unpaid' })}
                                            className="text-xs font-black text-[#002b80] hover:underline uppercase tracking-wide"
                                        >
                                            View all outstanding accounts →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Row 6: Quick Nav Links ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <QuickLink href={route('learner-accounts.index')} label="Learner Accounts" sub="View & manage individual student ledgers" gradient="from-[#002b80] to-[#00a86b]" icon={<AccountsIcon />} />
                        <QuickLink href={route('finance.fees.index')}      label="Fee Structures"   sub="Configure tuition & school fee schedules"  gradient="from-[#1565c0] to-[#1e88e5]" icon={<FeesIcon />} />
                        <QuickLink href={route('finance.settings')}        label="Batch Assessment" sub="Assess fees & manage grade level settings"  gradient="from-[#6a1b9a] to-[#9c27b0]" icon={<BatchIcon />} />
                    </div>
                        </>
                    )}
                </div>
            </div>
        </FinanceLayout>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PrimaryKpi({ label, value, sub, icon, gradient, progress }: {
    label: string; value: string; sub: string; icon: React.ReactNode; gradient: string; progress?: number;
}) {
    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-md p-5 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{icon}</div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
                </div>
                <p className="text-2xl font-black leading-tight">{value}</p>
                <p className="text-xs mt-1 opacity-70 font-semibold">{sub}</p>
                {progress !== undefined && (
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 bg-white rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
        </div>
    );
}

function SecondaryKpi({ label, value, sub, color, bgColor, icon }: {
    label: string; value: string; sub: string; color: string; bgColor: string; icon: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>{icon}</div>
            <div className="min-w-0">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-xs font-black text-slate-700 leading-tight">{label}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function QuickLink({ href, label, sub, gradient, icon }: {
    href: string; label: string; sub: string; gradient: string; icon: React.ReactNode;
}) {
    return (
        <Link href={href} className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 flex items-center gap-4 text-white group hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}>
            <div className="w-12 h-12 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors shrink-0">{icon}</div>
            <div>
                <p className="font-black text-sm">{label}</p>
                <p className="text-xs opacity-70 font-semibold mt-0.5">{sub}</p>
            </div>
            <svg className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const ico = (d: string) => (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);
const BilledIcon      = () => ico("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4");
const CollectedIcon   = () => ico("M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z");
const OutstandingIcon = () => ico("M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z");
const RateIcon        = () => ico("M13 7h8m0 0v8m0-8l-8 8-4-4-6 6");
const TodayIcon       = () => (<svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const DiscountIcon    = () => (<svg className="w-5 h-5 text-[#1565c0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>);
const RefundIcon      = () => (<svg className="w-5 h-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>);
const UnassessedIcon  = () => (<svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);
const AccountsIcon    = () => (<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const FeesIcon        = () => (<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const BatchIcon       = () => (<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>);

function PowerBiFinanceReport({
    kpis,
    recent_transactions,
    monthly_income,
    status_breakdown,
    grade_breakdown,
    top_debtors,
}: {
    kpis: KPIs;
    recent_transactions: Transaction[];
    monthly_income: MonthlyIncome[];
    status_breakdown: Record<string, number>;
    grade_breakdown: GradeBreakdown[];
    top_debtors: Debtor[];
}) {
    const [activeTab, setActiveTab] = useState<'revenue' | 'ledger'>('revenue');
    const [levelFilter, setLevelFilter] = useState<'all' | 'kinder' | 'primary' | 'secondary'>('all');

    const filteredGradeBreakdown = useMemo(() => {
        return grade_breakdown.filter(item => {
            const compact = item.level.toUpperCase();
            if (levelFilter === 'kinder') return compact.startsWith('L');
            if (levelFilter === 'primary') {
                return compact.startsWith('G') && ['1','2','3','4','5','6'].includes(compact.replace('G', ''));
            }
            if (levelFilter === 'secondary') {
                return compact.startsWith('G') && ['7','8','9','10','11','12'].includes(compact.replace('G', ''));
            }
            return true;
        });
    }, [grade_breakdown, levelFilter]);

    const filteredDebtors = useMemo(() => {
        return top_debtors.filter(item => {
            const compact = item.level.toUpperCase();
            if (levelFilter === 'kinder') return compact.startsWith('L');
            if (levelFilter === 'primary') {
                return compact.startsWith('G') && ['1','2','3','4','5','6'].includes(compact.replace('G', ''));
            }
            if (levelFilter === 'secondary') {
                return compact.startsWith('G') && ['7','8','9','10','11','12'].includes(compact.replace('G', ''));
            }
            return true;
        });
    }, [top_debtors, levelFilter]);

    const outstandingFiltered = useMemo(() => {
        return filteredGradeBreakdown.reduce((sum, item) => sum + item.outstanding, 0);
    }, [filteredGradeBreakdown]);

    const totalStudentsFiltered = useMemo(() => {
        return filteredGradeBreakdown.reduce((sum, item) => sum + item.count, 0);
    }, [filteredGradeBreakdown]);

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="bg-[#f3f2f1] text-[#252423] border border-[#eaeaea] shadow-md rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] font-sans">
            {/* Left Nav Pane - Power BI Yellow Theme */}
            <div className="w-full md:w-64 bg-[#252423] text-white p-6 flex flex-col justify-between border-r border-[#eaeaea] shrink-0">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#f3c200] text-[#252423] w-8 h-8 rounded font-black text-sm flex items-center justify-center shadow-sm">
                            Pb
                        </div>
                        <div>
                            <h3 className="font-black text-sm tracking-wider uppercase leading-none text-white">Power BI</h3>
                            <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">Finance Analytics</p>
                        </div>
                    </div>

                    {/* Slicers Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Slicers</h4>
                        
                        {/* Filter 1 */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-300">Grade Level Group</label>
                            <select 
                                value={levelFilter}
                                onChange={e => setLevelFilter(e.target.value as any)}
                                className="w-full bg-[#3b3a39] border border-slate-700 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:ring-1 focus:ring-[#f3c200] focus:border-[#f3c200] outline-none"
                            >
                                <option value="all">All Grades</option>
                                <option value="kinder">L1 / L2 (Kindergarten)</option>
                                <option value="primary">Grade 1 - 6 (Primary)</option>
                                <option value="secondary">Grade 7 - 12 (Secondary)</option>
                            </select>
                        </div>

                        {/* Filter 2 */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-300">Report Status</label>
                            <div className="bg-[#3b3a39] border border-slate-700 rounded-lg text-xs py-2 px-3 text-slate-300 font-semibold">
                                Live Financial Sync
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend Pane */}
                <div className="mt-8 pt-4 border-t border-slate-800 space-y-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Visual Palette</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-300">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#118d95]" /> Teal</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fd625e]" /> Coral</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f2c811]" /> Amber</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8ad4eb]" /> Sky</div>
                    </div>
                </div>
            </div>

            {/* Main Report Area */}
            <div className="flex-1 flex flex-col bg-[#f3f2f1]">
                {/* Top Title/Toolbar */}
                <div className="bg-white px-6 py-4 border-b border-[#eaeaea] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="text-base font-extrabold text-[#252423]">Institutional Collections & Debts Report</h2>
                        <p className="text-[11px] font-semibold text-slate-500">Interactive Power BI financial visual canvas</p>
                    </div>
                    <div className="bg-[#f3f2f1] text-[10px] font-extrabold text-slate-600 px-3 py-1 rounded border border-slate-200">
                        Refresh Status: Live
                    </div>
                </div>

                {/* Report Canvas Content */}
                <div className="flex-1 p-6 space-y-6">
                    {/* Visual Card Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-[#eaeaea] p-4 text-center rounded-lg relative overflow-hidden shadow-xs hover:shadow-sm transition">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#118d95]" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Billed</span>
                            <span className="text-xl font-light text-[#252423] tracking-tight block truncate">
                                AED {formatCurrency(kpis.total_billed)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">All ledger charges + VAT</span>
                        </div>

                        <div className="bg-white border border-[#eaeaea] p-4 text-center rounded-lg relative overflow-hidden shadow-xs hover:shadow-sm transition">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#3b3a39]" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Collected</span>
                            <span className="text-xl font-light text-[#252423] tracking-tight block truncate">
                                AED {formatCurrency(kpis.total_payments)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Collection rate: {kpis.collection_rate}%</span>
                        </div>

                        <div className="bg-white border border-[#eaeaea] p-4 text-center rounded-lg relative overflow-hidden shadow-xs hover:shadow-sm transition">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#fd625e]" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Outstanding Balance</span>
                            <span className="text-xl font-light text-[#252423] tracking-tight block truncate">
                                AED {formatCurrency(outstandingFiltered)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Filtered Grade Groups</span>
                        </div>

                        <div className="bg-white border border-[#eaeaea] p-4 text-center rounded-lg relative overflow-hidden shadow-xs hover:shadow-sm transition">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#f2c811]" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Active Students</span>
                            <span className="text-xl font-light text-[#252423] tracking-tight block">
                                {totalStudentsFiltered}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-1">Assessments structured</span>
                        </div>
                    </div>

                    {/* Navigation Tab Bar */}
                    <div className="border-b border-[#eaeaea] flex gap-2">
                        <button 
                            onClick={() => setActiveTab('revenue')}
                            className={`pb-2 px-4 text-xs font-bold transition-all relative ${
                                activeTab === 'revenue'
                                    ? 'text-[#252423] border-b-2 border-[#118d95]'
                                    : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            Monthly Collections & Top Debtors
                        </button>
                        <button 
                            onClick={() => setActiveTab('ledger')}
                            className={`pb-2 px-4 text-xs font-bold transition-all relative ${
                                activeTab === 'ledger'
                                    ? 'text-[#252423] border-b-2 border-[#118d95]'
                                    : 'text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            Ledger & Grade Outstanding
                        </button>
                    </div>

                    {/* Visualizations Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeTab === 'revenue' ? (
                            <>
                                {/* Monthly income chart visual */}
                                <div className="bg-white border border-[#eaeaea] rounded-lg p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-[#eaeaea] pb-2">
                                        <h4 className="text-xs font-extrabold text-slate-800 uppercase">Column Chart: Monthly Inflows</h4>
                                        <span className="text-[10px] text-slate-400">Power BI Column Chart</span>
                                    </div>
                                    <div className="flex items-end justify-between h-[200px] pt-4 px-2">
                                        {monthly_income.map((m) => {
                                            const maxVal = Math.max(...monthly_income.map(mi => parseFloat(mi.total)), 1);
                                            const pct = (parseFloat(m.total) / maxVal) * 100;
                                            return (
                                                <div key={m.month} className="flex flex-col items-center gap-2 flex-1">
                                                    <span className="text-[8px] font-black text-slate-500 rotate-[-45deg] translate-y-[-10px] block">
                                                        {(parseFloat(m.total)/1000).toFixed(0)}k
                                                    </span>
                                                    <div className="w-8 bg-[#118d95] rounded-t-sm transition-all hover:bg-[#0e747b]" style={{ height: `${pct}%`, minHeight: '4px' }} />
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block mt-1">{m.month.substring(0,3)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Debtors Grid */}
                                <div className="bg-white border border-[#eaeaea] rounded-lg p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-[#eaeaea] pb-2">
                                        <h4 className="text-xs font-extrabold text-slate-800 uppercase">Top Debtors Table Visual</h4>
                                        <span className="text-[10px] text-slate-400">Power BI Grid</span>
                                    </div>
                                    <div className="overflow-x-auto h-[200px] scrollbar-thin">
                                        <table className="min-w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#eaeaea] bg-slate-50 text-slate-500 font-bold">
                                                    <th className="px-4 py-2">Student Name</th>
                                                    <th className="px-4 py-2">Grade</th>
                                                    <th className="px-4 py-2 text-right">Outstanding</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#eaeaea] font-semibold text-slate-700">
                                                {filteredDebtors.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-2 font-black text-slate-800 uppercase">{item.name}</td>
                                                        <td className="px-4 py-2 font-bold text-slate-500 uppercase">{item.level}</td>
                                                        <td className="px-4 py-2 text-right text-rose-600 font-black">AED {formatCurrency(item.balance)}</td>
                                                    </tr>
                                                ))}
                                                {filteredDebtors.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-bold uppercase">
                                                            No outstanding debtors matching grade slicer
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Status Breakdown Donut Visual */}
                                <div className="bg-white border border-[#eaeaea] rounded-lg p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-[#eaeaea] pb-2">
                                        <h4 className="text-xs font-extrabold text-slate-800 uppercase">Ledger Status Breakdown</h4>
                                        <span className="text-[10px] text-slate-400">Compliance Visual</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                                        {/* SVG Donut */}
                                        <div className="relative w-36 h-36">
                                            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f2f1" strokeWidth="14" />
                                                
                                                <circle 
                                                    cx="50" cy="50" r="40" fill="none" stroke="#118d95" strokeWidth="14" 
                                                    strokeDasharray={`${(status_breakdown['Cleared'] || 0) * 251 / Math.max(totalStudentsFiltered, 1)} 251`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-light text-slate-800">Status</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate</span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="text-xs space-y-2.5 w-full sm:w-auto">
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded bg-[#118d95]" />
                                                    <span className="font-semibold text-slate-600">Cleared</span>
                                                </div>
                                                <span className="font-black text-slate-800">{status_breakdown['Cleared'] || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded bg-[#f2c811]" />
                                                    <span className="font-semibold text-slate-600">Partially Paid</span>
                                                </div>
                                                <span className="font-black text-slate-800">{status_breakdown['Partially Paid'] || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded bg-[#fd625e]" />
                                                    <span className="font-semibold text-slate-600">Unpaid</span>
                                                </div>
                                                <span className="font-black text-slate-800">{status_breakdown['Unpaid'] || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Grade Outstanding Balances */}
                                <div className="bg-white border border-[#eaeaea] rounded-lg p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-[#eaeaea] pb-2">
                                        <h4 className="text-xs font-extrabold text-slate-800 uppercase">Outstanding Balance by Grade Level</h4>
                                        <span className="text-[10px] text-slate-400">Bar Visual</span>
                                    </div>
                                    <div className="space-y-3.5 h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                                        {filteredGradeBreakdown.map((item) => {
                                            const maxVal = Math.max(...grade_breakdown.map(g => g.outstanding), 1);
                                            const percentage = Math.round((item.outstanding / maxVal) * 100);
                                            return (
                                                <div key={item.level} className="flex items-center gap-4">
                                                    <div className="w-12 text-xs font-black text-slate-700 uppercase">{item.level}</div>
                                                    <div className="flex-1 bg-slate-100 h-5 rounded overflow-hidden relative border border-slate-200">
                                                        <div 
                                                            className="bg-[#fd625e] h-full transition-all duration-500" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                        <span className="absolute inset-y-0 left-2 flex items-center text-[9px] font-black text-[#252423] drop-shadow-xs">
                                                            AED {formatCurrency(item.outstanding)} ({percentage}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {filteredGradeBreakdown.length === 0 && (
                                            <p className="text-center text-xs font-bold text-slate-400 uppercase py-8">
                                                No levels matching selected grade group.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Navigation Bar (Workbook Tabs style in Power BI) */}
                <div className="bg-[#252423] text-white px-4 py-2 flex items-center justify-start gap-4 text-xs font-bold border-t border-slate-700">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest">Active Page:</span>
                    <button 
                        onClick={() => setActiveTab('revenue')}
                        className={`px-3 py-1 rounded transition-all ${
                            activeTab === 'revenue'
                                ? 'bg-white text-[#252423]'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        Revenue & Income
                    </button>
                    <button 
                        onClick={() => setActiveTab('ledger')}
                        className={`px-3 py-1 rounded transition-all ${
                            activeTab === 'ledger'
                                ? 'bg-white text-[#252423]'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        Ledger Distribution
                    </button>
                </div>
            </div>
        </div>
    );
}
