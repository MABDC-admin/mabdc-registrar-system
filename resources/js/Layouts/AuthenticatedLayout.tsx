import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

type NavItem = {
    moduleKey: string;
    label: string;
    href: string;
    active: boolean;
    icon: ReactNode;
    children?: NavSubItem[];
    adminOnly?: boolean;
    soon?: boolean;
    chevron?: boolean;
    method?: 'post';
    as?: 'button';
};

type NavSubItem = {
    label: string;
    href?: string;
    active: boolean;
    soon?: boolean;
    requiredModuleKey?: string;
};

export default function Authenticated({
    header,
    children,
    sidebar,
    hideSidebar = false,
}: PropsWithChildren<{ header?: ReactNode; sidebar?: ReactNode; hideSidebar?: boolean }>) {
    const auth = usePage().props.auth;
    const user = auth.user;
    const modulePermissions = auth.modulePermissions ?? {};
    const isAdmin = user.role === 'admin';
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        if (route().current('learner-accounts.*') || route().current('finance.*')) {
            router.get(route('learner-accounts.index'), { search: searchQuery });
        } else {
            router.get(route('learners.index'), { search: searchQuery });
        }
    };

    const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({});

    const navItems: NavItem[] = ([
        ...(isAdmin ? [{
            moduleKey: 'admin',
            label: 'Admin Control Center',
            href: route('admin.index'),
            active: route().current('admin.*'),
            icon: (
                <svg className="w-5 h-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            adminOnly: true,
        }] : []),
        {
            moduleKey: 'dashboard',
            label: 'Registrar Dashboard',
            href: route('dashboard'),
            active: route().current('dashboard'),
            icon: <DashboardIcon />,
        },
        {
            moduleKey: 'student_management',
            label: 'Learner Management',
            href: route('learners.index'),
            active: route().current('learners.*'),
            icon: <LearnerIcon />,
        },
        {
            moduleKey: 'student_management',
            label: 'Family & Households',
            href: route('households.index'),
            active: route().current('households.*'),
            icon: <LearnerIcon />,
        },
        {
            moduleKey: 'student_management',
            label: 'Faculty Directory',
            href: route('teachers.index'),
            active: route().current('teachers.*'),
            icon: <LearnerIcon />,
        },
        {
            moduleKey: 'admission',
            label: 'Admission & Application',
            href: route('admissions.index'),
            active: route().current('admissions.*'),
            icon: <AdmissionIcon />,
        },
        {
            moduleKey: 'enrollment',
            label: 'Enrollment Management',
            href: route('enrollments.index'),
            active: route().current('enrollments.*'),
            icon: <EnrollmentIcon />,
        },
        {
            moduleKey: 'enrollment',
            label: 'Batch Promotion',
            href: route('promotions.index'),
            active: route().current('promotions.*'),
            icon: <RecordsIcon />,
        },
        {
            moduleKey: 'document_center',
            label: 'Documents & Requirements',
            href: route('imports.index'),
            active: route().current('imports.*'),
            icon: <DocumentsIcon />,
        },
        {
            moduleKey: 'class_section',
            label: 'Class & Section Management',
            href: route('classes.index'),
            active: route().current('classes.*'),
            icon: <ClassIcon />,
        },
        {
            moduleKey: 'academic_records',
            label: 'Academic Records',
            href: route('academic-records.index'),
            active: route().current('academic-records.*'),
            icon: <RecordsIcon />,
        },
        {
            moduleKey: 'attendance',
            label: 'Attendance Records',
            href: route('attendance.index'),
            active: route().current('attendance.*'),
            icon: <AttendanceIcon />,
        },
        {
            moduleKey: 'transfer_withdrawal',
            label: 'Transfer & Withdrawal',
            href: route('transfers.index'),
            active: route().current('transfers.*'),
            icon: <TransferIcon />,
        },
        {
            moduleKey: 'certificates',
            label: 'Certificates & Documents',
            href: route('certificates.index'),
            active: route().current('certificates.*'),
            icon: <CertificatesIcon />,
        },
        {
            moduleKey: 'finance',
            label: 'Finance Dashboard',
            href: route('finance.index'),
            active: route().current('finance.*'),
            icon: <FinanceIcon />,
        },
        {
            moduleKey: 'learner_accounts',
            label: 'Learner Accounts',
            href: route('learner-accounts.index'),
            active: route().current('learner-accounts.*'),
            icon: <LedgerIcon />,
        },
        {
            moduleKey: 'reports',
            label: 'Reports & Analytics',
            href: route('reports.index'),
            active: route().current('reports.*'),
            icon: <ReportsIcon />,
        },
        {
            moduleKey: 'academic_years',
            label: 'Academic Years',
            href: isAdmin ? route('academic-years.index') : '#',
            active: route().current('academic-years.*'),
            icon: <AcademicYearIcon />,
            adminOnly: true,
        },
        {
            moduleKey: 'staff_management',
            label: 'Staff Management',
            href: isAdmin ? route('users.index') : '#',
            active: route().current('users.*'),
            icon: <SecurityIcon />,
            adminOnly: true,
        },
        {
            moduleKey: 'audit_trail',
            label: 'Audit Trail',
            href: route('audit-trail.index'),
            active: route().current('audit-trail.*'),
            icon: (
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    ] as NavItem[]).filter((item) => {
        if (item.adminOnly && !isAdmin) {
            return false;
        }
        if (item.moduleKey === 'admin') {
            return isAdmin;
        }
        return modulePermissions[item.moduleKey] ?? false;
    });

    return (
        <div className="ops-screen bg-slate-50 selection:bg-[#002b80] selection:text-white">
            <div className={(hideSidebar && !sidebar) ? "ops-shell" : "ops-shell lg:grid lg:grid-cols-[240px_minmax(0,1fr)]"}>
                {sidebar ? (
                    sidebar
                ) : !hideSidebar ? (
                    <aside className="ops-sidebar hidden sticky top-0 h-screen overflow-y-auto bg-[#002b80] border-r border-[#001d60] px-3 py-4 text-slate-200 shadow-2xl lg:block no-scrollbar">
                        <Link href="/" className="flex items-center gap-2.5 px-1.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 shadow-xs backdrop-blur-md shrink-0">
                                <ApplicationLogo className="h-6 w-6 fill-current text-[#ffc000] drop-shadow-xs" />
                            </div>
                            <div className="tracking-tight text-white min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-[#ffc000] text-slate-950 px-1 py-0.5 rounded shadow-2xs">
                                        MABDC
                                    </span>
                                </div>
                                <p className="text-[11px] font-black leading-tight text-white uppercase tracking-wider truncate">
                                    REGISTRAR SYSTEM
                                </p>
                            </div>
                        </Link>

                        <nav className="mt-6 space-y-1">
                            {navItems.map((item) => (
                                <SidebarEntry
                                    key={item.label}
                                    item={item}
                                    open={openNavGroups[item.moduleKey] ?? item.active}
                                    onToggle={() =>
                                        setOpenNavGroups((current) => ({
                                            ...current,
                                            [item.moduleKey]:
                                                !(current[item.moduleKey] ??
                                                    item.active),
                                        }))
                                    }
                                />
                            ))}
                        </nav>

                        <div className="mt-6 mb-4 rounded-xl border border-white/10 bg-[#001d60]/80 p-3 shadow-md backdrop-blur-xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#ffc000]">
                                Active Session
                            </p>
                            <p className="mt-0.5 text-xs font-black text-white truncate">{user.name}</p>
                            <p className="mt-0.5 text-[10px] font-extrabold text-blue-200/80 uppercase tracking-widest truncate">
                                {user.role}
                            </p>
                        </div>

                        <div className="mb-4">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-extrabold text-red-300 hover:bg-red-500/20 hover:text-white transition duration-200"
                            >
                                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center">
                                    <LogoutIcon />
                                </span>
                                <span className="min-w-0 flex-1 truncate">Logout</span>
                            </Link>
                        </div>
                    </aside>
                ) : null}

                <section className="min-h-screen bg-slate-50">
                    <div className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
                        <div className="flex min-h-[3.75rem] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm lg:hidden"
                            >
                                Menu
                            </button>

                             <div className="min-w-0 flex-1 flex items-center gap-4">
                                 {header}
                                 
                                 {/* Global Learner Search Bar */}
                                 <form onSubmit={handleSearchSubmit} className="hidden md:block max-w-xs w-full ml-6">
                                     <div className="relative">
                                         <input
                                             type="text"
                                             value={searchQuery}
                                             onChange={(e) => setSearchQuery(e.target.value)}
                                             placeholder="Search learners..."
                                             className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002b80] focus:border-[#002b80] transition-all"
                                         />
                                         <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                             </svg>
                                         </span>
                                     </div>
                                 </form>
                             </div>

                             <div className="hidden items-center gap-5 sm:flex">
                                 {/* Activated Registration Alerts Email Icon Dropdown */}
                                 <Dropdown>
                                     <Dropdown.Trigger>
                                         <button
                                             type="button"
                                             title="New Registrar Registrations"
                                             className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#002b80] focus:outline-none"
                                         >
                                             {/* Email / Mailbox Icon */}
                                             <svg
                                                 className="h-5 w-5"
                                                 viewBox="0 0 24 24"
                                                 fill="none"
                                                 stroke="currentColor"
                                                 strokeWidth="2.2"
                                                 strokeLinecap="round"
                                                 strokeLinejoin="round"
                                             >
                                                 <rect width="20" height="16" x="2" y="4" rx="2" />
                                                 <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                             </svg>
                                             {((usePage().props.pendingRegistrationCount as number) || 0) > 0 && (
                                                 <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white shadow-xs animate-pulse">
                                                     {usePage().props.pendingRegistrationCount as number}
                                                 </span>
                                             )}
                                         </button>
                                     </Dropdown.Trigger>
                                     <Dropdown.Content align="right" width="80" contentClasses="py-0 bg-white ring-1 ring-black/5 rounded-2xl overflow-hidden shadow-2xl">
                                         <div className="border-b border-slate-100 px-4 py-3 bg-[#002b80] text-white flex justify-between items-center">
                                             <div className="flex items-center gap-2">
                                                 <svg className="w-4 h-4 text-[#ffc000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                 </svg>
                                                 <p className="text-[11px] font-black uppercase tracking-wider text-white">
                                                     Registrar Registrations
                                                 </p>
                                             </div>
                                             {((usePage().props.pendingRegistrationCount as number) || 0) > 0 && (
                                                 <span className="bg-[#ffc000] text-[#001746] text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                                     {usePage().props.pendingRegistrationCount as number} Pending
                                                 </span>
                                             )}
                                         </div>

                                         <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 min-w-[300px]">
                                             {(!usePage().props.recentPendingRegistrations || (usePage().props.recentPendingRegistrations as any[]).length === 0) ? (
                                                 <div className="px-4 py-8 text-center text-xs text-slate-500 font-semibold space-y-2">
                                                     <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-black text-sm">
                                                         ✓
                                                     </div>
                                                     <p className="text-slate-600 font-bold">No pending registrations awaiting settlement.</p>
                                                     <p className="text-[10px] text-slate-400">All new registrar walk-in applicants have been settled or processed.</p>
                                                 </div>
                                             ) : (
                                                 ((usePage().props.recentPendingRegistrations as any[]) || []).map((app: any) => (
                                                     <Link
                                                         key={app.id}
                                                         href={route('learner-accounts.index')}
                                                         className="block px-4 py-3 hover:bg-amber-50/50 transition text-left group"
                                                     >
                                                         <div className="flex justify-between items-start gap-2">
                                                             <div>
                                                                 <p className="text-xs font-black text-[#002b80] group-hover:text-blue-700 transition">
                                                                     {app.full_name}
                                                                 </p>
                                                                 <p className="text-[11px] font-extrabold text-slate-600 mt-0.5">
                                                                     {app.level_applied_for}
                                                                 </p>
                                                             </div>
                                                             <span className="shrink-0 bg-amber-100 text-amber-900 border border-amber-300/60 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                                                 ₱500 Downpayment
                                                             </span>
                                                         </div>
                                                         <p className="mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                                             Registered {app.created_at}
                                                         </p>
                                                     </Link>
                                                 ))
                                             )}
                                         </div>

                                         <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 text-center">
                                             <Link
                                                 href={route('learner-accounts.index')}
                                                 className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#002b80] hover:text-blue-700 uppercase tracking-wider transition"
                                             >
                                                 <span>Open Learner Accounts Cashier</span>
                                                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                 </svg>
                                             </Link>
                                         </div>
                                     </Dropdown.Content>
                                 </Dropdown>
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-slate-50"
                                        >
                                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white shadow-glow">
                                                {user.name
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </span>
                                            <span>
                                                <span className="block text-sm font-black text-slate-900">
                                                    {user.name}
                                                </span>
                                                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    {user.role}
                                                </span>
                                            </span>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile Settings
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {showingNavigationDropdown && (
                            <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
                                <div className="grid gap-2">
                                    {navItems.map((item) => (
                                        <MobileNavEntry
                                            key={item.label}
                                            item={item}
                                            open={
                                                openNavGroups[item.moduleKey] ??
                                                item.active
                                            }
                                            onToggle={() =>
                                                setOpenNavGroups((current) => ({
                                                    ...current,
                                                    [item.moduleKey]:
                                                        !(current[
                                                            item.moduleKey
                                                        ] ?? item.active),
                                                }))
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <main>{children}</main>
                </section>
            </div>
        </div>
    );
}

function SidebarEntry({
    item,
    open,
    onToggle,
}: {
    item: NavItem;
    open: boolean;
    onToggle: () => void;
}) {
    if (item.children?.length) {
        return (
            <div>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className={
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-bold transition duration-200 ' +
                        (item.active
                            ? 'bg-[#001746] text-white border-l-4 border-[#ffc000] shadow-2xs font-extrabold'
                            : 'text-slate-200/80 hover:bg-white/10 hover:text-white')
                    }
                >
                    <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center ${item.active ? 'text-[#ffc000]' : ''}`}>
                        {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <ChevronDisclosureIcon open={open} />
                </button>

                {open && <SidebarSubNav items={item.children} />}
            </div>
        );
    }

    return <SidebarLink item={item} />;
}

function SidebarLink({ item }: { item: NavItem }) {
    const content = (
        <>
            <span className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center ${item.active ? 'text-[#ffc000]' : ''}`}>
                {item.icon}
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.soon && (
                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-200 ring-1 ring-white/20">
                    Soon
                </span>
            )}
            {item.chevron && (
                <span className="text-blue-200">
                    <ChevronRightIcon />
                </span>
            )}
        </>
    );

    return (
        <Link
            href={item.href}
            method={item.method}
            as={item.as}
            className={
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-bold transition duration-200 ' +
                (item.active
                    ? 'bg-[#001746] text-white border-l-4 border-[#ffc000] shadow-2xs font-extrabold'
                    : 'text-slate-200/80 hover:bg-white/10 hover:text-white')
            }
        >
            {content}
        </Link>
    );
}

function SidebarSubNav({ items }: { items: NavSubItem[] }) {
    return (
        <div className="ml-8 mt-3 space-y-1 border-l-2 border-white/5 pl-3">
            {items.map((item) =>
                item.soon || !item.href ? (
                    <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-green-100/70"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-green-100/50" />
                        <span className="min-w-0 flex-1 truncate">
                            {item.label}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide ring-1 ring-white/10">
                            Soon
                        </span>
                    </div>
                ) : (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition duration-200 ' +
                            (item.active
                                ? 'bg-amber-500/15 text-amber-200 shadow-sm ring-1 ring-amber-500/30'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200')
                        }
                    >
                        <span
                            className={
                                'h-1.5 w-1.5 rounded-full transition-colors ' +
                                (item.active ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-600 group-hover:bg-slate-400')
                            }
                        />
                        <span className="min-w-0 flex-1 truncate">
                            {item.label}
                        </span>
                    </Link>
                ),
            )}
        </div>
    );
}

function MobileNavEntry({
    item,
    open,
    onToggle,
}: {
    item: NavItem;
    open: boolean;
    onToggle: () => void;
}) {
    if (item.children?.length) {
        return (
            <div className="rounded-xl bg-slate-50">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className={
                        'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black ' +
                        (item.active
                            ? 'bg-green-600 text-white'
                            : 'text-slate-700')
                    }
                >
                    {item.icon}
                    <span className="min-w-0 flex-1 truncate">
                        {item.label}
                    </span>
                    <ChevronDisclosureIcon open={open} />
                </button>

                {open && (
                    <div className="grid gap-1 px-3 pb-3 pt-2">
                        {item.children.map((child) =>
                            child.soon || !child.href ? (
                                <div
                                    key={child.label}
                                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-400"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                    <span className="min-w-0 flex-1 truncate">
                                        {child.label}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] uppercase tracking-wide text-slate-500">
                                        Soon
                                    </span>
                                </div>
                            ) : (
                                <Link
                                    key={child.label}
                                    href={child.href}
                                    className={
                                        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ' +
                                        (child.active
                                            ? 'bg-green-100 text-green-900'
                                            : 'bg-white text-slate-700')
                                    }
                                >
                                    <span
                                        className={
                                            'h-1.5 w-1.5 rounded-full ' +
                                            (child.active
                                                ? 'bg-green-700'
                                                : 'bg-slate-300')
                                        }
                                    />
                                    <span className="min-w-0 flex-1 truncate">
                                        {child.label}
                                    </span>
                                </Link>
                            ),
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            method={item.method}
            as={item.as}
            className={
                'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-black ' +
                (item.active
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-50 text-slate-700')
            }
        >
            {item.icon}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.soon && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-green-800">
                    Soon
                </span>
            )}
            {item.chevron && (
                <span className="text-green-700">
                    <ChevronRightIcon />
                </span>
            )}
        </Link>
    );
}

function ChevronDisclosureIcon({ open }: { open: boolean }) {
    return (
        <svg
            className={
                'h-4 w-4 shrink-0 transition-transform ' +
                (open ? 'rotate-90' : '')
            }
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

function IconShell({ children }: PropsWithChildren) {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </svg>
    );
}

// === NEW ICONS FOR 12 MODULES ===

function DashboardIcon() {
    return (
        <IconShell>
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </IconShell>
    );
}

function LearnerIcon() {
    return (
        <IconShell>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </IconShell>
    );
}

function AdmissionIcon() {
    return (
        <IconShell>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 14h6" />
            <path d="M9 10h6" />
        </IconShell>
    );
}

function EnrollmentIcon() {
    return (
        <IconShell>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="m9 15 2 2 4-4" />
        </IconShell>
    );
}

function DocumentsIcon() {
    return (
        <IconShell>
            <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M3 15h6" />
            <path d="M3 18h6" />
        </IconShell>
    );
}

function ClassIcon() {
    return (
        <IconShell>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2" />
            <rect x="9" y="5" width="8" height="4" rx="1" />
        </IconShell>
    );
}

function RecordsIcon() {
    return (
        <IconShell>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </IconShell>
    );
}

function AttendanceIcon() {
    return (
        <IconShell>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="m9 16 2 2 4-4" />
        </IconShell>
    );
}

function TransferIcon() {
    return (
        <IconShell>
            <path d="M16 3h5v5" />
            <path d="M8 3H3v5" />
            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
            <path d="m15 9 6-6" />
        </IconShell>
    );
}

function CertificatesIcon() {
    return (
        <IconShell>
            <path d="M12 15V3" />
            <path d="M8 7h8" />
            <path d="M6 11h12" />
            <circle cx="12" cy="19" r="2" />
        </IconShell>
    );
}

function ReportsIcon() {
    return (
        <IconShell>
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
        </IconShell>
    );
}

function SecurityIcon() {
    return (
        <IconShell>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </IconShell>
    );
}

function AcademicYearIcon() {
    return (
        <IconShell>
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
        </IconShell>
    );
}

function LogoutIcon() {
    return (
        <IconShell>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </IconShell>
    );
}

function ChevronRightIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}


function FinanceIcon() {
    return (
        <IconShell>
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </IconShell>
    );
}

function LedgerIcon() {
    return (
        <IconShell>
            <path d="M4 2h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
            <path d="M8 6h8M8 10h8M8 14h5" />
        </IconShell>
    );
}
