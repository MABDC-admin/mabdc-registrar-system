import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

type Learner = {
    id: number;
    full_name: string;
    normalized_name: string;
};

type Enrollment = {
    id: number;
    learner: Learner;
};

type Section = {
    id: number;
    academic_year_id: number;
    level: string;
    name: string;
    session: string;
    teacher_name: string | null;
    enrollments: Enrollment[];
};

type Props = {
    section: Section;
    unassigned: Enrollment[];
};

export default function ClassesShow({ section, unassigned }: Props) {
    const handleAssign = (enrollmentId: number) => {
        router.post(
            route('classes.assign', section.id),
            { enrollment_id: enrollmentId },
            { preserveScroll: true },
        );
    };

    const handleUnassign = (enrollmentId: number) => {
        router.post(
            route('classes.unassign', section.id),
            { enrollment_id: enrollmentId },
            { preserveScroll: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Link
                                href={route('classes.index')}
                                className="hover:text-indigo-600"
                            >
                                Classes &amp; Sections
                            </Link>
                            <span>/</span>
                            <span>{section.level}</span>
                        </div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Section {section.name} Roster
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        Assigned learners:{' '}
                        <span className="font-semibold text-gray-900">
                            {section.enrollments.length}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title={`Section ${section.name} Roster`} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Section Summary Bar */}
                    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Section Details
                            </span>
                            <div className="mt-1 flex items-center gap-3 text-sm">
                                <span className="font-semibold text-gray-900">
                                    {section.level} - {section.name}
                                </span>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600 capitalize">
                                    Session: {section.session.replace('_', ' ')}
                                </span>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600">
                                    Adviser: {section.teacher_name || 'Unassigned'}
                                </span>
                            </div>
                        </div>
                        <Link
                            href={route('classes.index')}
                            className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            &larr; Back to Sections
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column: Unassigned Pool */}
                        <section className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm max-h-[700px]">
                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Unassigned Pool
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {section.level} learners without a section
                                    </p>
                                </div>
                                <span className="rounded-md bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                    {unassigned.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {unassigned.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-400">
                                        No unassigned learners found.
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {unassigned.map((enrollment) => (
                                            <li
                                                key={enrollment.id}
                                                className="group flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm transition hover:bg-gray-50"
                                            >
                                                <span className="font-semibold text-gray-900">
                                                    {enrollment.learner.full_name}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleAssign(
                                                            enrollment.id,
                                                        )
                                                    }
                                                    className="rounded-md bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                                                >
                                                    Assign &rarr;
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>

                        {/* Right Column: Official Roster */}
                        <section className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm max-h-[700px]">
                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Official Section Roster
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Adviser: {section.teacher_name || 'TBA'}
                                    </p>
                                </div>
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    {section.enrollments.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {section.enrollments.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-400">
                                        This section is currently empty.
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {section.enrollments.map((enrollment) => (
                                            <li
                                                key={enrollment.id}
                                                className="group flex items-center justify-between rounded-md border border-gray-200 p-3 text-sm transition hover:bg-gray-50"
                                            >
                                                <span className="font-semibold text-gray-900">
                                                    {enrollment.learner.full_name}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleUnassign(
                                                            enrollment.id,
                                                        )
                                                    }
                                                    className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                                >
                                                    &larr; Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
