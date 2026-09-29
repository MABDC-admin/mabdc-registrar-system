import React, { ReactNode } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link, usePage } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

interface FinanceLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

// ─── Finance sub-navigation items ────────────────────────────────────────────
function useFinanceNavItems() {
    return [
        {
            label: 'Overview Dashboard',
            href: route('finance.index'),
            active: route().current('finance.index'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            label: 'Learner Accounts',
            href: route('learner-accounts.index'),
            active: route().current('learner-accounts.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        {
            label: 'Fee Structures',
            href: route('finance.fees.index'),
            active: route().current('finance.fees.*') || route().current('finance.fees'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            label: 'Batch Assessment',
            href: route('finance.settings'),
            active: route().current('finance.settings'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            label: 'Reports',
            href: route('finance.reports.index'),
            active: route().current('finance.reports.*') || route().current('finance.reports.index'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            label: 'Audit Trail',
            href: route('audit-trail.index'),
            active: route().current('audit-trail.*') || route().current('audit-trail'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            moduleKey: 'audit_trail',
        },
        {
            label: 'Academic Years',
            href: route('academic-years.index'),
            active: route().current('academic-years.*'),
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M8 14h.01" />
                    <path d="M12 14h.01" />
                    <path d="M16 14h.01" />
                    <path d="M8 18h.01" />
                    <path d="M12 18h.01" />
                    <path d="M16 18h.01" />
                </svg>
            ),
            moduleKey: 'academic_years',
        },
    ];
}

export default function FinanceLayout({ header, children }: FinanceLayoutProps) {
    const auth = usePage().props.auth;
    const user = auth.user;
    const modulePermissions: any = auth.modulePermissions ?? {};

    const navItems = useFinanceNavItems().filter(item => {
        if (item.moduleKey) {
            return modulePermissions[item.moduleKey] ?? false;
        }
        return true;
    });

    const financeSidebar = (
        <aside className="ops-sidebar hidden sticky top-0 h-screen overflow-y-auto bg-[#002b80] border-r border-[#001d60] px-3 py-4 text-slate-200 shadow-2xl lg:block no-scrollbar">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-2.5 px-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-xs backdrop-blur-md shrink-0">
                    <ApplicationLogo className="h-6 w-6 fill-current text-[#ffc000] drop-shadow-xs" />
                </div>
                <div className="tracking-tight text-white min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#ffc000] text-slate-950 px-1 py-0.5 rounded shadow-2xs">
                            FINANCE
                        </span>
                    </div>
                    <p className="text-[11px] font-black leading-tight text-white uppercase tracking-wider truncate">
                        PORTAL SYSTEM
                    </p>
                </div>
            </Link>

            {/* Nav Items */}
            <nav className="mt-6 space-y-1">
                {/* Module navigation links */}
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={[
                            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-bold transition duration-200',
                            item.active
                                ? 'bg-[#001746] text-white border-l-4 border-[#ffc000] shadow-2xs font-extrabold'
                                : 'text-slate-200/80 hover:bg-white/10 hover:text-white',
                        ].join(' ')}
                    >
                        <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center ${item.active ? 'text-[#ffc000]' : ''}`}>
                            {item.icon}
                        </span>
                        <span className="min-w-0 flex-1 truncate leading-tight">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Profile Information & Logout */}
            <div className="mt-6 mb-4">
                <div className="rounded-xl border border-white/10 bg-[#001d60]/80 p-3 shadow-md backdrop-blur-xl mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#ffc000]">
                        Finance Session
                    </p>
                    <p className="mt-0.5 text-xs font-black text-white truncate">{user.name}</p>
                    <p className="mt-0.5 text-[10px] font-extrabold text-blue-200/80 uppercase tracking-widest truncate">
                        {user.role}
                    </p>
                </div>

                <div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-extrabold text-red-300 hover:bg-red-500/20 hover:text-white transition duration-200"
                    >
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
                            </svg>
                        </span>
                        <span className="min-w-0 flex-1 truncate">Logout</span>
                    </Link>
                </div>
            </div>
        </aside>
    );

    return (
        <AuthenticatedLayout header={header} sidebar={financeSidebar}>
            {children}
        </AuthenticatedLayout>
    );
}
