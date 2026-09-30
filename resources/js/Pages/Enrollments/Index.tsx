import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

type ActiveYear = {
    id: number;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
} | null;

type LevelRow = {
    level: string | null;
    total: number;
};

type SectionRow = {
    id: number;
    level: string | null;
    name: string;
    session: string | null;
    teacher_name: string | null;
    learners: number;
};

type RecentEnrollment = {
    id: number;
    learner_id: number;
    learner_name: string | null;
    lrn: string | null;
    level: string | null;
    section: string | null;
    session: string | null;
    status: string | null;
    enrolled_on: string | null;
    academic_year: string | null;
};

type Props = {
    activeYear: ActiveYear;
    totals: {
        enrollments: number;
        active: number;
        levels: number;
        sections: number;
    };
    byLevel: LevelRow[];
    sections: SectionRow[];
    documentTotals: {
        ok: number;
        missing: number;
        expired: number;
        pending_review: number;
    };
    recentEnrollments: RecentEnrollment[];
};

export default function EnrollmentsIndex({
    activeYear,
    totals,
    byLevel,
    sections,
    documentTotals,
    recentEnrollments,
}: Props) {
    const maxLevel = Math.max(...byLevel.map((row) => row.total), 1);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Registrar records</p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Enrollment Overview
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        Active year: <span className="text-gray-900">{activeYear?.name ?? 'Not configured'}</span>
                    </div>
                </div>
            }
        >
            <Head title="Enrollment Overview" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Metrics */}
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Metric label="Total enrollments" value={totals.enrollments} />
                        <Metric label="Active learners" value={totals.active} />
                        <Metric label="Grade levels" value={totals.levels} />
                        <Metric label="Class sections" value={totals.sections} />
                    </section>

                    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Level Distribution Card */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Enrollment by grade level
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Active students enrolled across levels
                                    </p>
                                </div>
                                <Link
                                    href={route('learners.index')}
                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Open directory &rarr;
                                </Link>
                            </div>
                            <div className="mt-5 space-y-3.5">
                                {byLevel.map((row) => (
                                    <div key={row.level ?? 'unassigned'}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-900">
                                                {row.level ?? 'Unassigned'}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {row.total.toLocaleString()} learners
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-gray-900"
                                                style={{
                                                    width: `${Math.max(6, (row.total / maxLevel) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Document Readiness Card */}
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="border-b border-gray-200 pb-4">
                                <h3 className="text-base font-semibold text-gray-900">
                                    Document readiness
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Required student records status
                                </p>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <MiniMetric label="Verified OK" value={documentTotals.ok} status="ok" />
                                <MiniMetric label="Missing" value={documentTotals.missing} status="warn" />
                                <MiniMetric label="Expired" value={documentTotals.expired} status="danger" />
                                <MiniMetric label="Pending Review" value={documentTotals.pending_review} status="neutral" />
                            </div>
                            <Link
                                href={route('reports.index')}
                                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                View Detailed Reports
                            </Link>
                        </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
                        {/* Section Registry */}
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">
                                        Section registry
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {sections.length} active class sections
                                    </p>
                                </div>
                                <Link
                                    href={route('classes.index')}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-900"
                                >
                                    Manage &rarr;
                                </Link>
                            </div>
                            <div className="max-h-[500px] overflow-auto divide-y divide-gray-200">
                                {sections.map((section) => (
                                    <div key={section.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {section.level} · {section.name}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {section.teacher_name ?? 'Teacher not assigned'} · {section.session ?? 'Session not set'}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                {section.learners} students
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Enrollments Table */}
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-5 py-4">
                                <h3 className="text-base font-semibold text-gray-900">
                                    Recent enrollments
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Latest learner admission and registration records
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Learner</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Level</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Section</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Enrolled Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {recentEnrollments.map((enrollment) => (
                                            <tr key={enrollment.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <Link
                                                        href={route('academic-records.show', enrollment.learner_id)}
                                                        className="font-semibold text-gray-900 hover:text-indigo-700"
                                                    >
                                                        {enrollment.learner_name}
                                                    </Link>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        LRN {enrollment.lrn ?? 'None'}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                                                    {enrollment.level ?? 'Unassigned'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                    <span>{enrollment.section ?? 'No section'}</span>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {enrollment.session ?? 'No session'}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        {enrollment.status ?? 'Enrolled'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-gray-500">
                                                    {enrollment.enrolled_on ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        {recentEnrollments.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                                                    No enrollment records recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
                {value.toLocaleString()}
            </p>
        </div>
    );
}

function MiniMetric({ label, value, status = 'neutral' }: { label: string; value: number; status?: 'ok' | 'warn' | 'danger' | 'neutral' }) {
    const styles = {
        ok: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        warn: 'bg-amber-50 text-amber-800 border border-amber-200',
        danger: 'bg-rose-50 text-rose-800 border border-rose-200',
        neutral: 'bg-gray-50 text-gray-800 border border-gray-200',
    }[status];

    return (
        <div className={`rounded-lg p-3.5 ${styles}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
            <p className="mt-1 text-xl font-bold">{value.toLocaleString()}</p>
        </div>
    );
}
