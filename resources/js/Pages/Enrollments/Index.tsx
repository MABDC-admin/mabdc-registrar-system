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
                        <p className="ops-kicker">Registrar module</p>
                        <h2 className="ops-title text-3xl leading-tight">
                            Enrollment
                        </h2>
                    </div>
                    <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                        SY {activeYear?.name ?? 'Not configured'}
                    </div>
                </div>
            }
        >
            <Head title="Enrollment" />

            <div className="py-8">
                <div className="mx-auto w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="grid gap-4 md:grid-cols-4">
                        <Metric label="Total enrollments" value={totals.enrollments} />
                        <Metric label="Active learners" value={totals.active} />
                        <Metric label="Grade levels" value={totals.levels} />
                        <Metric label="Sections" value={totals.sections} />
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="ops-panel-soft rounded-xl p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="ops-kicker">Distribution</p>
                                    <h3 className="text-xl font-black text-slate-900">
                                        Enrollment by level
                                    </h3>
                                </div>
                                <Link
                                    href={route('learners.index')}
                                    className="ops-button-secondary rounded-md px-3 py-2 text-sm font-bold"
                                >
                                    Open learners
                                </Link>
                            </div>
                            <div className="mt-6 space-y-4">
                                {byLevel.map((row) => (
                                    <div key={row.level ?? 'unassigned'}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-black text-slate-800">
                                                {row.level ?? 'Unassigned'}
                                            </span>
                                            <span className="font-bold text-slate-500">
                                                {row.total.toLocaleString()} learners
                                            </span>
                                        </div>
                                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-400"
                                                style={{
                                                    width: `${Math.max(8, (row.total / maxLevel) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="ops-panel rounded-xl p-5">
                            <p className="ops-kicker">Compliance</p>
                            <h3 className="text-xl font-black text-slate-900">
                                Document readiness
                            </h3>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <MiniMetric label="OK" value={documentTotals.ok} />
                                <MiniMetric label="Missing" value={documentTotals.missing} warn />
                                <MiniMetric label="Expired" value={documentTotals.expired} warn />
                                <MiniMetric label="Pending" value={documentTotals.pending_review} />
                            </div>
                            <Link
                                href={route('reports.index')}
                                className="ops-button-primary mt-5 inline-flex rounded-md px-4 py-2 text-sm font-black"
                            >
                                View reports
                            </Link>
                        </div>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                        <div className="ops-panel-soft overflow-hidden rounded-xl">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <p className="ops-kicker">Sections</p>
                                <h3 className="text-lg font-black text-slate-900">
                                    Section registry
                                </h3>
                            </div>
                            <div className="max-h-[520px] overflow-auto">
                                {sections.map((section) => (
                                    <div
                                        key={section.id}
                                        className="border-b border-slate-100 px-5 py-4 last:border-b-0"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-black text-slate-900">
                                                    {section.level} - {section.name}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {section.teacher_name ?? 'Teacher not assigned'} ·{' '}
                                                    {section.session ?? 'Session not set'}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                                                {section.learners}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="ops-panel-soft overflow-hidden rounded-xl">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <p className="ops-kicker">Latest activity</p>
                                <h3 className="text-lg font-black text-slate-900">
                                    Recent enrollments
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="ops-table min-w-full text-left text-sm">
                                    <thead className="bg-[#002b80]">
                                        <tr>
                                            <Th>Learner</Th>
                                            <Th>Level</Th>
                                            <Th>Section</Th>
                                            <Th>Status</Th>
                                            <Th>Date</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentEnrollments.map((enrollment) => (
                                            <tr key={enrollment.id}>
                                                <Td>
                                                    <Link
                                                        href={route('academic-records.show', enrollment.learner_id)}
                                                        className="font-black text-green-800 hover:text-green-600"
                                                    >
                                                        {enrollment.learner_name}
                                                    </Link>
                                                    <p className="text-xs text-slate-500">
                                                        LRN {enrollment.lrn ?? 'None'}
                                                    </p>
                                                </Td>
                                                <Td>{enrollment.level ?? 'Unassigned'}</Td>
                                                <Td>
                                                    {enrollment.section ?? 'No section'}
                                                    <p className="text-xs text-slate-500">
                                                        {enrollment.session ?? 'No session'}
                                                    </p>
                                                </Td>
                                                <Td>
                                                    <span className="ops-badge-ok rounded-full px-2 py-1 text-xs font-black">
                                                        {enrollment.status ?? 'No status'}
                                                    </span>
                                                </Td>
                                                <Td>{enrollment.enrolled_on ?? 'Not dated'}</Td>
                                            </tr>
                                        ))}
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
        <div className="ops-panel rounded-xl p-5">
            <p className="ops-kicker">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
                {value.toLocaleString()}
            </p>
        </div>
    );
}

function MiniMetric({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
    return (
        <div className={warn ? 'ops-badge-warn rounded-xl p-4' : 'ops-badge-ok rounded-xl p-4'}>
            <p className="text-xs font-black uppercase">{label}</p>
            <p className="mt-1 text-2xl font-black">{value.toLocaleString()}</p>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-white">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
    return <td className="border-t border-slate-100 px-5 py-4 align-top text-slate-700">{children}</td>;
}
