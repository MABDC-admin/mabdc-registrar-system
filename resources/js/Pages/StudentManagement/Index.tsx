import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type Props = {
    activeYear: ActiveYear;
    today: string;
    summary: {
        students: number;
        enrollments: number;
        sections: number;
        documents: number;
    };
};

export default function StudentManagementIndex({
    activeYear,
    today,
    summary,
}: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Registrar control
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Student Management
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        Active year:{' '}
                        <span className="font-semibold text-gray-900">
                            {activeYear?.name ?? 'Not configured'}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Student Management" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Header Summary Banner */}
                    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                Overview &amp; Registrar Records
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                High-level summary of learner records, enrollment files, class sections, and document coverage.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                            <CalendarIcon />
                            <span>{today}</span>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            label="Total Students"
                            value={summary.students}
                            helper="All profile records"
                            href={route('learners.index')}
                        />
                        <MetricCard
                            label="Active Enrollments"
                            value={summary.enrollments}
                            helper="Enrolled this year"
                            href={route('enrollments.index')}
                        />
                        <MetricCard
                            label="Class Sections"
                            value={summary.sections}
                            helper="Active sections"
                            href={route('classes.index')}
                        />
                        <MetricCard
                            label="Document Checks"
                            value={summary.documents}
                            helper="Registered files"
                            href={route('learners.index')}
                        />
                    </div>

                    {/* Quick Access & Coverage Grid */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <section className="col-span-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-5 py-4">
                                <h3 className="text-base font-semibold text-gray-900">
                                    Registrar Modules Directory
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Fast shortcuts to active registrar modules and workspaces.
                                </p>
                            </div>
                            <div className="grid divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                                <div className="divide-y divide-gray-200">
                                    <ModuleLink
                                        title="Learner Directory"
                                        description="Search, view profiles, and manage student information."
                                        href={route('learners.index')}
                                    />
                                    <ModuleLink
                                        title="Enrollment Pipeline"
                                        description="Track enrollment status, grade levels, and documents."
                                        href={route('enrollments.index')}
                                    />
                                    <ModuleLink
                                        title="Class & Section Roster"
                                        description="Assign learners to sections and manage advisers."
                                        href={route('classes.index')}
                                    />
                                    <ModuleLink
                                        title="Academic Records"
                                        description="Record quarter grades and generate report cards."
                                        href={route('academic-records.index')}
                                    />
                                </div>
                                <div className="divide-y divide-gray-200">
                                    <ModuleLink
                                        title="Attendance Tracking"
                                        description="Log daily presence, absences, and excuses by section."
                                        href={route('attendance.index')}
                                    />
                                    <ModuleLink
                                        title="Transfers & Withdrawals"
                                        description="Process learner exits and clearance requests."
                                        href={route('transfers.index')}
                                    />
                                    <ModuleLink
                                        title="Batch Promotion & Honors"
                                        description="Roll forward grade levels and compute honors."
                                        href={route('promotions.index')}
                                    />
                                    <ModuleLink
                                        title="Certificates & Transcripts"
                                        description="Issue certificates of enrollment and completion."
                                        href={route('certificates.index')}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Active Year Scope
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    SY {activeYear?.name ?? 'Not configured'}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <ScopeTag label="Learner Profiles" active />
                                    <ScopeTag label="Enrollments" active />
                                    <ScopeTag label="Class Rosters" active />
                                    <ScopeTag label="Academic Records" active />
                                    <ScopeTag label="Attendance" active />
                                    <ScopeTag label="Transfers" active />
                                    <ScopeTag label="Documents" active />
                                    <ScopeTag label="Promotions" active />
                                    <ScopeTag label="Certificates" active />
                                </div>
                            </div>

                            <div className="mt-6 rounded-md bg-gray-50 p-4 text-xs text-gray-600">
                                <p className="font-semibold text-gray-900">Need to switch Academic Year?</p>
                                <p className="mt-1">
                                    Configure active terms and dates under Academic Years settings.
                                </p>
                                <Link
                                    href={route('academic-years.index')}
                                    className="mt-3 inline-block font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                    Manage Academic Years &rarr;
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({
    label,
    value,
    helper,
    href,
}: {
    label: string;
    value: number;
    helper: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow"
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 group-hover:text-indigo-600">
                {value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </Link>
    );
}

function ModuleLink({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="block p-4 transition hover:bg-gray-50"
        >
            <p className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                {title} &rarr;
            </p>
            <p className="mt-1 text-xs text-gray-500">{description}</p>
        </Link>
    );
}

function ScopeTag({ label, active }: { label: string; active?: boolean }) {
    return (
        <span
            className={
                'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ' +
                (active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600')
            }
        >
            {label}
        </span>
    );
}

function CalendarIcon() {
    return (
        <svg
            className="h-4 w-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
        </svg>
    );
}
