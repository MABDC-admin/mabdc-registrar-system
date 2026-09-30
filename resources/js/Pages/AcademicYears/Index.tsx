import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

type AcademicYear = {
    id: number;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    is_active: boolean;
    created_at: string;
};

type Props = {
    academicYears: AcademicYear[];
};

export default function AcademicYearsIndex({ academicYears }: Props) {
    const { auth } = usePage().props as any;
    const isFinance = auth?.user?.role === 'finance';
    const Layout = isFinance ? FinanceLayout : AuthenticatedLayout;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [yearToEdit, setYearToEdit] = useState<AcademicYear | null>(null);
    const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

    return (
        <Layout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Academic terms configuration
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Academic Years
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        + Add Academic Year
                    </button>
                </div>
            }
        >
            <Head title="Academic Years Management" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Table Card */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    School Year Calendars
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Configure active terms, operational dates, and term roll-forward statuses.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <HeaderCell>School Year</HeaderCell>
                                        <HeaderCell>Calendar Duration</HeaderCell>
                                        <HeaderCell>Status</HeaderCell>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {academicYears.map((year) => (
                                        <AcademicYearRow
                                            key={year.id}
                                            year={year}
                                            onEdit={() => setYearToEdit(year)}
                                            onDelete={() => setYearToDelete(year)}
                                        />
                                    ))}
                                    {academicYears.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No academic years configured yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            <CreateYearModal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <EditYearModal
                year={yearToEdit}
                onClose={() => setYearToEdit(null)}
            />

            <DeleteYearModal
                year={yearToDelete}
                onClose={() => setYearToDelete(null)}
            />
        </Layout>
    );
}

function AcademicYearRow({
    year,
    onEdit,
    onDelete,
}: {
    year: AcademicYear;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { post, processing } = useForm();

    const activate = () => {
        post(route('academic-years.activate', year.id), {
            preserveScroll: true,
        });
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-5 py-4">
                <span className="font-semibold text-gray-900">
                    {year.name}
                </span>
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                {year.starts_on
                    ? new Date(year.starts_on).toLocaleDateString()
                    : 'Not set'}{' '}
                —{' '}
                {year.ends_on
                    ? new Date(year.ends_on).toLocaleDateString()
                    : 'Not set'}
            </td>
            <td className="whitespace-nowrap px-5 py-4">
                {year.is_active ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Active Year
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        Inactive
                    </span>
                )}
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium">
                <div className="flex justify-end items-center gap-2">
                    {!year.is_active && (
                        <button
                            onClick={activate}
                            disabled={processing}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                        >
                            Set Active
                        </button>
                    )}
                    <button
                        onClick={onEdit}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Edit
                    </button>
                    {!year.is_active && (
                        <button
                            onClick={onDelete}
                            className="rounded-md border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}

function CreateYearModal({
    show,
    onClose,
}: {
    show: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            starts_on: '',
            ends_on: '',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('academic-years.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                    Add Academic Year
                </h2>

                <div className="space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="create_name"
                            value="Year Name (e.g. 2026-2027)"
                        />
                        <TextInput
                            id="create_name"
                            placeholder="2026-2027"
                            className="mt-1 block w-full text-sm"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError className="mt-1" message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel
                                htmlFor="create_starts_on"
                                value="Start Date"
                            />
                            <TextInput
                                id="create_starts_on"
                                type="date"
                                className="mt-1 block w-full text-sm"
                                value={data.starts_on}
                                onChange={(e) =>
                                    setData('starts_on', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="create_ends_on"
                                value="End Date"
                            />
                            <TextInput
                                id="create_ends_on"
                                type="date"
                                className="mt-1 block w-full text-sm"
                                value={data.ends_on}
                                onChange={(e) =>
                                    setData('ends_on', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                    >
                        Create Year
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function EditYearModal({
    year,
    onClose,
}: {
    year: AcademicYear | null;
    onClose: () => void;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            starts_on: '',
            ends_on: '',
        });

    useEffect(() => {
        if (year) {
            setData({
                name: year.name,
                starts_on: year.starts_on
                    ? new Date(year.starts_on).toISOString().split('T')[0]
                    : '',
                ends_on: year.ends_on
                    ? new Date(year.ends_on).toISOString().split('T')[0]
                    : '',
            });
        }
    }, [year]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!year) return;

        patch(route('academic-years.update', year.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    return (
        <Modal show={!!year} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                    Edit Academic Year
                </h2>

                <div className="space-y-4">
                    <div>
                        <InputLabel
                            htmlFor="edit_name"
                            value="Year Name"
                        />
                        <TextInput
                            id="edit_name"
                            className="mt-1 block w-full text-sm"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError className="mt-1" message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel
                                htmlFor="edit_starts_on"
                                value="Start Date"
                            />
                            <TextInput
                                id="edit_starts_on"
                                type="date"
                                className="mt-1 block w-full text-sm"
                                value={data.starts_on}
                                onChange={(e) =>
                                    setData('starts_on', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit_ends_on"
                                value="End Date"
                            />
                            <TextInput
                                id="edit_ends_on"
                                type="date"
                                className="mt-1 block w-full text-sm"
                                value={data.ends_on}
                                onChange={(e) =>
                                    setData('ends_on', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function DeleteYearModal({
    year,
    onClose,
}: {
    year: AcademicYear | null;
    onClose: () => void;
}) {
    const { delete: destroy, processing, errors, clearErrors } = useForm();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!year) return;

        destroy(route('academic-years.destroy', year.id), {
            onSuccess: () => onClose(),
        });
    };

    const handleClose = () => {
        clearErrors();
        onClose();
    };

    return (
        <Modal show={!!year} onClose={handleClose} maxWidth="sm">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                    Delete Academic Year
                </h2>
                <p className="text-sm text-gray-500">
                    Are you sure you want to delete <strong>{year?.name}</strong>? This action cannot be undone.
                </p>

                {(errors as any).message && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-md">
                        <p className="text-xs font-semibold text-rose-700">
                            {(errors as any).message}
                        </p>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-9 items-center rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
                    >
                        Delete Year
                    </button>
                </div>
            </form>
        </Modal>
    );
}
