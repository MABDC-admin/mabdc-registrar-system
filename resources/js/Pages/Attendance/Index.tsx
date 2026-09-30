import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type Section = {
    id: number;
    level: string;
    name: string;
    session: string;
    teacher_name: string | null;
};

type RosterEntry = {
    learner_id: number;
    full_name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks: string;
};

type Props = {
    activeYear: { id: number; name: string } | null;
    sections: Section[];
    filters: {
        date: string;
        section_id: string | null;
    };
    selectedSection: Section | null;
    roster: RosterEntry[];
};

export default function AttendanceIndex({
    activeYear,
    sections,
    filters,
    selectedSection,
    roster,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedSectionId, setSelectedSectionId] = useState(
        filters.section_id || '',
    );

    const { data, setData, post, processing, isDirty, recentlySuccessful } =
        useForm({
            section_id: filters.section_id || '',
            date: filters.date,
            attendances: roster || [],
        });

    useEffect(() => {
        setData('attendances', roster);
    }, [roster]);

    const handleFilterChange = (sectionId: string, date: string) => {
        if (!sectionId) return;
        router.get(
            route('attendance.index'),
            {
                section_id: sectionId,
                date: date,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleStatusChange = (
        learnerId: number,
        status: 'present' | 'absent' | 'late' | 'excused',
    ) => {
        const newAttendances = data.attendances.map((a) =>
            a.learner_id === learnerId ? { ...a, status } : a,
        );
        setData('attendances', newAttendances);
    };

    const setAllStatus = (
        status: 'present' | 'absent' | 'late' | 'excused',
    ) => {
        const newAttendances = data.attendances.map((a) => ({ ...a, status }));
        setData('attendances', newAttendances);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('attendance.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Daily roll call
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Attendance Tracking
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
            <Head title="Attendance Tracking" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Filter Card */}
                    <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2">
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Class Section
                            </span>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={selectedSectionId}
                                onChange={(e) => {
                                    setSelectedSectionId(e.target.value);
                                    handleFilterChange(
                                        e.target.value,
                                        selectedDate,
                                    );
                                }}
                            >
                                <option value="">-- Choose a Section --</option>
                                {sections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.level} - {sec.name} (
                                        {sec.session.replace('_', ' ')})
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Attendance Date
                            </span>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    handleFilterChange(
                                        selectedSectionId,
                                        e.target.value,
                                    );
                                }}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </label>
                    </div>

                    {selectedSection ? (
                        <form
                            onSubmit={submit}
                            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                        >
                            <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">
                                        {selectedSection.level} - {selectedSection.name}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Adviser: {selectedSection.teacher_name || 'Unassigned'} · Date: {selectedDate}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAllStatus('present')}
                                        className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                                    >
                                        Mark All Present
                                    </button>
                                </div>
                            </div>

                            {roster.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-500">
                                    No learners are currently assigned to this section.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <HeaderCell>Learner</HeaderCell>
                                                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-80">
                                                    Attendance Status
                                                </th>
                                                <HeaderCell>Remarks</HeaderCell>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {data.attendances.map((entry, index) => (
                                                <tr
                                                    key={entry.learner_id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        <span className="font-semibold text-gray-900">
                                                            {entry.full_name}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-center">
                                                        <div className="inline-flex rounded-md shadow-xs" role="group">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        entry.learner_id,
                                                                        'present',
                                                                    )
                                                                }
                                                                className={`rounded-l-md px-3 py-1 text-xs font-semibold border ${
                                                                    entry.status === 'present'
                                                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        entry.learner_id,
                                                                        'absent',
                                                                    )
                                                                }
                                                                className={`border-t border-b px-3 py-1 text-xs font-semibold ${
                                                                    entry.status === 'absent'
                                                                        ? 'bg-rose-600 border-rose-600 text-white'
                                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                Absent
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        entry.learner_id,
                                                                        'late',
                                                                    )
                                                                }
                                                                className={`border-t border-b border-l px-3 py-1 text-xs font-semibold ${
                                                                    entry.status === 'late'
                                                                        ? 'bg-amber-600 border-amber-600 text-white'
                                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                Late
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        entry.learner_id,
                                                                        'excused',
                                                                    )
                                                                }
                                                                className={`rounded-r-md border border-l-0 px-3 py-1 text-xs font-semibold ${
                                                                    entry.status === 'excused'
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                Excused
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <input
                                                            type="text"
                                                            placeholder="Optional remarks..."
                                                            className="block w-full rounded-md border-gray-300 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                            value={entry.remarks}
                                                            onChange={(e) => {
                                                                const newAttendances = [
                                                                    ...data.attendances,
                                                                ];
                                                                newAttendances[index].remarks =
                                                                    e.target.value;
                                                                setData(
                                                                    'attendances',
                                                                    newAttendances,
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
                                        <div>
                                            {recentlySuccessful && (
                                                <span className="text-xs font-semibold text-emerald-700">
                                                    Attendance recorded successfully! ✓
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing || !isDirty}
                                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                                        >
                                            {processing ? 'Saving...' : 'Save Attendance'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900">
                                Select a class section
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Choose a class section from the dropdown above to load the learner roster and record attendance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}
