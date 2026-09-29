import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="ops-kicker">Registrar module</p>
                        <h2 className="ops-title text-3xl leading-tight">
                            Student Management
                        </h2>
                    </div>
                    <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-sm font-black text-green-800">
                        SY {activeYear?.name ?? 'Not configured'}
                    </div>
                </div>
            }
        >
            <Head title="Student Management" />

            <div className="py-8">
                <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8">
                    <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="text-4xl font-black leading-tight text-green-950 md:text-5xl">
                                Student Management
                            </h1>
                            <p className="mt-4 max-w-2xl text-lg font-semibold text-slate-500">
                                Registrar snapshot for learner records, enrollment files, class sections, and document coverage.
                            </p>
                        </div>
                        <div className="inline-flex w-fit items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-black text-green-800 shadow-sm">
                            <CalendarIcon />
                            {today}
                        </div>
                    </section>

                    <section className="mt-8 grid gap-4 md:grid-cols-4">
                        <SummaryCard label="Students" value={summary.students} />
                        <SummaryCard label="Enrollments" value={summary.enrollments} />
                        <SummaryCard label="Sections" value={summary.sections} />
                        <SummaryCard label="Documents" value={summary.documents} />
                    </section>

                    <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="ops-panel rounded-xl p-5">
                            <p className="ops-kicker">Record control</p>
                            <h3 className="mt-2 text-2xl font-black text-green-950">
                                SY {activeYear?.name ?? 'Not configured'}
                            </h3>
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <ControlMetric
                                    label="Profile records"
                                    value={summary.students}
                                />
                                <ControlMetric
                                    label="Enrollment files"
                                    value={summary.enrollments}
                                />
                                <ControlMetric
                                    label="Class sections"
                                    value={summary.sections}
                                />
                                <ControlMetric
                                    label="Document checks"
                                    value={summary.documents}
                                />
                            </div>
                        </div>

                        <div className="ops-panel-soft rounded-xl p-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-600/20">
                                <CheckIcon />
                            </div>
                            <p className="ops-kicker mt-5">Coverage</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <ScopePill label="Profiles" />
                                <ScopePill label="Enrollment" />
                                <ScopePill label="Attendance" muted />
                                <ScopePill label="Academic records" />
                                <ScopePill label="Sections" />
                                <ScopePill label="Guardians" />
                                <ScopePill label="Student ID" muted />
                                <ScopePill label="Health" muted />
                                <ScopePill label="Discipline" muted />
                                <ScopePill label="Documents" />
                                <ScopePill label="Promotion" muted />
                                <ScopePill label="Analytics" />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
            <p className="ops-kicker">{label}</p>
            <p className="mt-2 text-2xl font-black text-green-950">
                {value.toLocaleString()}
            </p>
        </div>
    );
}

function ControlMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-2xl font-black text-green-950">
                {value.toLocaleString()}
            </p>
        </div>
    );
}

function ScopePill({ label, muted = false }: { label: string; muted?: boolean }) {
    return (
        <span
            className={
                'rounded-full px-3 py-1 text-xs font-black ' +
                (muted
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-green-100 text-green-800')
            }
        >
            {label}
        </span>
    );
}

function CalendarIcon() {
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
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg
            className="h-9 w-9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 12 5 5L20 7" />
        </svg>
    );
}
