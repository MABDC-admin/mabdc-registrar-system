import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

interface HouseholdLearner {
    id: number;
    full_name: string;
    lrn: string;
}

interface Household {
    id: number;
    household_code: string;
    family_name: string;
    primary_contact_name: string | null;
    primary_email: string | null;
    primary_phone: string | null;
    learners_count: number;
    learners: HouseholdLearner[];
}

interface IndexProps {
    households: {
        data: Household[];
        links: any[];
    };
    filters: {
        search?: string;
    };
}

export default function HouseholdsIndex({
    households,
    filters,
}: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const createForm = useForm({
        family_name: '',
        primary_contact_name: '',
        primary_email: '',
        primary_phone: '',
        address: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('households.index'),
            { search },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        router.get(route('households.index'), {}, { replace: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('households.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Family &amp; sibling grouping
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Household Accounts
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        + Create Household
                    </button>
                </div>
            }
        >
            <Head title="Household Accounts" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]"
                    >
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Search Household
                            </span>
                            <input
                                type="text"
                                placeholder="Family surname, code, or contact name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </label>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    {/* Table Card */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Registered Family Units
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {households.data.length} household account(s)
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <HeaderCell>Code</HeaderCell>
                                        <HeaderCell>Family Name</HeaderCell>
                                        <HeaderCell>Primary Contact</HeaderCell>
                                        <HeaderCell>Email / Phone</HeaderCell>
                                        <HeaderCell>Linked Learners</HeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {households.data.map((hh) => (
                                        <tr
                                            key={hh.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-gray-900">
                                                {hh.household_code}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                                                {hh.family_name} Family
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                {hh.primary_contact_name || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                                {hh.primary_email || hh.primary_phone ? (
                                                    <div>
                                                        <p>{hh.primary_email || '—'}</p>
                                                        {hh.primary_phone && (
                                                            <p className="text-xs text-gray-500">
                                                                {hh.primary_phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {hh.learners.map((l) => (
                                                        <span
                                                            key={l.id}
                                                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                                                        >
                                                            {l.full_name}
                                                        </span>
                                                    ))}
                                                    {hh.learners.length === 0 && (
                                                        <span className="text-xs text-gray-400">
                                                            No linked learners
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {households.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No household accounts registered yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            >
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Register Family / Household Unit
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="family_name"
                                value="Family Surname *"
                            />
                            <TextInput
                                id="family_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                required
                                placeholder="e.g. Dela Cruz"
                                value={createForm.data.family_name}
                                onChange={(e) =>
                                    createForm.setData(
                                        'family_name',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={createForm.errors.family_name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="primary_contact_name"
                                value="Primary Guardian Contact"
                            />
                            <TextInput
                                id="primary_contact_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                placeholder="e.g. Maria Dela Cruz"
                                value={createForm.data.primary_contact_name}
                                onChange={(e) =>
                                    createForm.setData(
                                        'primary_contact_name',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel
                                    htmlFor="primary_email"
                                    value="Email Address"
                                />
                                <TextInput
                                    id="primary_email"
                                    type="email"
                                    className="mt-1 block w-full text-sm"
                                    placeholder="guardian@example.com"
                                    value={createForm.data.primary_email}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'primary_email',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="primary_phone"
                                    value="Contact Phone"
                                />
                                <TextInput
                                    id="primary_phone"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    placeholder="+971 50 xxx xxxx"
                                    value={createForm.data.primary_phone}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'primary_phone',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                        >
                            Save Household
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
