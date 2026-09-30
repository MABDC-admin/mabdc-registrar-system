import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

type Learner = {
    id: number;
    full_name: string;
    normalized_name: string;
};

type Section = {
    id: number;
    level: string;
    name: string;
};

type Enrollment = {
    id: number;
    learner: Learner;
    section: Section | null;
    level: string;
    status: string;
    metadata: {
        transfer_date?: string;
        transfer_reason?: string;
    } | null;
};

export default function Transfers({
    auth,
    enrollments,
    activeEnrollments,
}: PageProps & {
    enrollments: Enrollment[];
    activeEnrollments: Enrollment[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<
        'all' | 'transferred' | 'withdrawn'
    >('all');

    const [searchStudentTerm, setSearchStudentTerm] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        enrollment_id: '',
        type: 'transferred',
        date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('transfers.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setSearchStudentTerm('');
            },
        });
    };

    const filteredEnrollments = useMemo(() => {
        return enrollments.filter((e) => {
            const matchesSearch = e.learner?.full_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesFilter =
                filterType === 'all' || e.status === filterType;
            return matchesSearch && matchesFilter;
        });
    }, [enrollments, searchTerm, filterType]);

    const totalTransferred = enrollments.filter(
        (e) => e.status === 'transferred',
    ).length;
    const totalWithdrawn = enrollments.filter(
        (e) => e.status === 'withdrawn',
    ).length;
    const totalActiveCount = activeEnrollments.length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Student clearance &amp; exits
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Transfers &amp; Withdrawals
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        + Process Exit / Transfer
                    </button>
                </div>
            }
        >
            <Head title="Transfers & Withdrawals" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* KPI Metric Summary */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Active Learner Pool
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-gray-900">
                                {totalActiveCount}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Transferred Out
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-amber-700">
                                {totalTransferred}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Withdrawn Records
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-rose-700">
                                {totalWithdrawn}
                            </p>
                        </div>
                    </div>

                    {/* Filter Card */}
                    <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_200px]">
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Search Learner
                            </span>
                            <input
                                type="text"
                                placeholder="Student name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Exit Type
                            </span>
                            <select
                                value={filterType}
                                onChange={(e) =>
                                    setFilterType(
                                        e.target.value as
                                            | 'all'
                                            | 'transferred'
                                            | 'withdrawn',
                                    )
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="all">All Movements</option>
                                <option value="transferred">Transfers</option>
                                <option value="withdrawn">Withdrawals</option>
                            </select>
                        </label>
                    </div>

                    {/* Table View */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Movement History Records
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {filteredEnrollments.length} record(s)
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <HeaderCell>Learner</HeaderCell>
                                        <HeaderCell>Level &amp; Section</HeaderCell>
                                        <HeaderCell>Exit Type</HeaderCell>
                                        <HeaderCell>Date</HeaderCell>
                                        <HeaderCell>Reason / Remarks</HeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredEnrollments.map((enrollment) => (
                                        <tr
                                            key={enrollment.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                                                {enrollment.learner?.full_name}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                <span className="font-semibold text-gray-900">
                                                    {enrollment.level}
                                                </span>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {enrollment.section?.name ||
                                                        'Unassigned'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                                                        enrollment.status ===
                                                        'transferred'
                                                            ? 'bg-amber-50 text-amber-800'
                                                            : 'bg-rose-50 text-rose-700'
                                                    }`}
                                                >
                                                    {enrollment.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                {enrollment.metadata
                                                    ?.transfer_date || '—'}
                                            </td>
                                            <td className="max-w-xs truncate px-5 py-4 text-sm text-gray-500">
                                                {enrollment.metadata
                                                    ?.transfer_reason ||
                                                    'No reason specified'}
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredEnrollments.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No transfer or withdrawal records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal for Processing Transfers/Withdrawals */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Process Student Exit / Movement
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="enrollment_id"
                                value="Select Active Student"
                            />
                            <select
                                id="enrollment_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.enrollment_id}
                                onChange={(e) =>
                                    setData('enrollment_id', e.target.value)
                                }
                                required
                            >
                                <option value="">-- Choose Student --</option>
                                {activeEnrollments.map((en) => (
                                    <option key={en.id} value={en.id}>
                                        {en.learner?.full_name} ({en.level} -{' '}
                                        {en.section?.name || 'No Section'})
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.enrollment_id}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel
                                    htmlFor="type"
                                    value="Movement Type"
                                />
                                <select
                                    id="type"
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.type}
                                    onChange={(e) =>
                                        setData('type', e.target.value)
                                    }
                                    required
                                >
                                    <option value="transferred">
                                        Transferred Out
                                    </option>
                                    <option value="withdrawn">
                                        Withdrawn / Dropped
                                    </option>
                                </select>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="date"
                                    value="Effective Date"
                                />
                                <input
                                    type="date"
                                    id="date"
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.date}
                                    onChange={(e) =>
                                        setData('date', e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="reason"
                                value="Reason / Notes"
                            />
                            <textarea
                                id="reason"
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="e.g. Relocating back to Philippines / Transferring to another UAE school"
                                value={data.reason}
                                onChange={(e) =>
                                    setData('reason', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                        >
                            Confirm Movement
                        </button>
                    </div>
                </form>
            </Modal>
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
