import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type LevelRow = {
    level: string | null;
    learners: number;
};

type StatusRow = {
    status: string | null;
    learners: number;
};

type ExportLink = {
    title: string;
    description: string;
    href: string;
};

type Props = {
    activeYear: ActiveYear;
    summary: {
        learners: number;
        enrollments: number;
        levels: number;
        documents: number;
    };
    byLevel: LevelRow[];
    byStatus: StatusRow[];
    documentTotals: {
        ok: number;
        missing: number;
        expired: number;
        pending_review: number;
    };
    exports: ExportLink[];
};

export default function ReportsIndex({
    activeYear,
    summary,
    byLevel,
    byStatus,
    documentTotals,
    exports,
}: Props) {
    const maxLevel = Math.max(...byLevel.map((row) => row.learners), 1);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="ops-kicker">Registrar module</p>
                        <h2 className="ops-title text-3xl leading-tight">
                            Reports
                        </h2>
                    </div>
                    <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
                        SY {activeYear?.name ?? 'Not configured'}
                    </div>
                </div>
            }
        >
            <Head title="Reports" />

            <div className="py-8">
                <div className="mx-auto w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="grid gap-4 md:grid-cols-4">
                        <Metric label="Learners" value={summary.learners} />
                        <Metric label="Enrollments" value={summary.enrollments} />
                        <Metric label="Levels" value={summary.levels} />
                        <Metric label="Documents" value={summary.documents} />
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="ops-panel-soft rounded-xl p-5">
                            <p className="ops-kicker">Exports</p>
                            <h3 className="text-xl font-black text-slate-900">
                                Download registrar reports
                            </h3>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                {exports.map((report) => (
                                    <a
                                        key={report.title}
                                        href={report.href}
                                        className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-green-200 hover:bg-green-50"
                                    >
                                        <p className="text-lg font-black text-slate-950">
                                            {report.title}
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {report.description}
                                        </p>
                                        <span className="ops-button-primary mt-5 inline-flex rounded-md px-4 py-2 text-sm font-black">
                                            Download CSV
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="ops-panel rounded-xl p-5">
                            <p className="ops-kicker">Document status</p>
                            <h3 className="text-xl font-black text-slate-900">
                                Compliance snapshot
                            </h3>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <MiniMetric label="OK" value={documentTotals.ok} />
                                <MiniMetric label="Missing" value={documentTotals.missing} warn />
                                <MiniMetric label="Expired" value={documentTotals.expired} warn />
                                <MiniMetric label="Pending" value={documentTotals.pending_review} />
                            </div>
                            <Link
                                href={route('academic-records.index')}
                                className="ops-button-secondary mt-5 inline-flex rounded-md px-4 py-2 text-sm font-bold"
                            >
                                Review records
                            </Link>
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="ops-panel-soft rounded-xl p-5">
                            <p className="ops-kicker">Enrollment report</p>
                            <h3 className="text-xl font-black text-slate-900">
                                Learners by level
                            </h3>
                            <div className="mt-6 space-y-4">
                                {byLevel.map((row) => (
                                    <div key={row.level ?? 'unassigned'}>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-black text-slate-800">
                                                {row.level ?? 'Unassigned'}
                                            </span>
                                            <span className="font-bold text-slate-500">
                                                {row.learners.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-green-600"
                                                style={{
                                                    width: `${Math.max(8, (row.learners / maxLevel) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="ops-panel-soft rounded-xl p-5">
                            <p className="ops-kicker">Status report</p>
                            <h3 className="text-xl font-black text-slate-900">
                                Enrollment status
                            </h3>
                            <div className="mt-5 divide-y divide-slate-100">
                                {byStatus.map((row) => (
                                    <div
                                        key={row.status ?? 'none'}
                                        className="flex items-center justify-between py-4"
                                    >
                                        <span className="font-black capitalize text-slate-800">
                                            {row.status ?? 'No status'}
                                        </span>
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-800">
                                            {row.learners.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
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
