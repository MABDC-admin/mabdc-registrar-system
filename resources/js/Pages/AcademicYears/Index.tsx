import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
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
    const isFinance = auth.user.role === 'finance';
    const Layout = isFinance ? FinanceLayout : AuthenticatedLayout;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [yearToEdit, setYearToEdit] = useState<AcademicYear | null>(null);
    const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

    return (
        <Layout
            header={
                <div className="flex flex-col gap-1 py-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                        Administration
                    </p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            Academic Years
                        </h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 hover:shadow"
                        >
                            + Add New Year
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Academic Years Management" />

            <div className="py-8 bg-slate-50 min-h-[calc(100vh-81px)]">
                <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-200 px-8 py-6 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    School Years
                                </h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Manage academic calendars and set the active school year.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#002b80] text-white">
                                    <tr className="text-left text-xs font-bold uppercase tracking-wider">
                                        <th className="px-8 py-4">Academic Year</th>
                                        <th className="px-8 py-4">Duration</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
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
                                            <td colSpan={4} className="px-8 py-12 text-center text-slate-500 font-medium">
                                                No academic years found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

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
        <tr className="transition hover:bg-slate-50/50 group">
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black shadow-inner shrink-0 ${year.is_active ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {year.name.substring(0, 4)}
                    </div>
                    <div>
                        <p className="font-black text-slate-900 text-base">{year.name}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="text-sm font-semibold text-slate-700">
                    {year.starts_on ? new Date(year.starts_on).toLocaleDateString() : 'N/A'} 
                    {' - '} 
                    {year.ends_on ? new Date(year.ends_on).toLocaleDateString() : 'N/A'}
                </div>
            </td>
            <td className="px-8 py-5">
                {year.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Year
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider border border-slate-200">
                        Inactive
                    </span>
                )}
            </td>
            <td className="px-8 py-5 align-top text-right">
                <div className="flex justify-end gap-2 pt-1">
                    {!year.is_active && (
                        <button
                            onClick={activate}
                            disabled={processing}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50"
                        >
                            {processing ? 'Activating...' : 'Set Active'}
                        </button>
                    )}
                    
                    <button
                        onClick={onEdit}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                    >
                        Edit
                    </button>
                    
                    <button
                        onClick={onDelete}
                        disabled={year.is_active}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-red-200 text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={year.is_active ? "Cannot delete active year" : "Delete Year"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

// -------------------------------------------------------------
// Modals
// -------------------------------------------------------------

function CreateYearModal({ show, onClose }: { show: boolean, onClose: () => void }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
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
                <h2 className="text-lg font-black text-slate-900">Add Academic Year</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Create a new school year block. (e.g. 2026-2027)
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="create_name" value="Name (YYYY-YYYY)" />
                        <TextInput
                            id="create_name"
                            placeholder="2026-2027"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="create_starts_on" value="Start Date (Optional)" />
                        <TextInput
                            id="create_starts_on"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.starts_on}
                            onChange={(e) => setData('starts_on', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.starts_on} />
                    </div>

                    <div>
                        <InputLabel htmlFor="create_ends_on" value="End Date (Optional)" />
                        <TextInput
                            id="create_ends_on"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.ends_on}
                            onChange={(e) => setData('ends_on', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.ends_on} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-emerald-500 focus:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Creating...' : 'Create Year'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function EditYearModal({ year, onClose }: { year: AcademicYear | null, onClose: () => void }) {
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        starts_on: '',
        ends_on: '',
    });

    useEffect(() => {
        if (year) {
            setData({
                name: year.name,
                starts_on: year.starts_on ? new Date(year.starts_on).toISOString().split('T')[0] : '',
                ends_on: year.ends_on ? new Date(year.ends_on).toISOString().split('T')[0] : '',
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
                <h2 className="text-lg font-black text-slate-900">Edit Academic Year</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Update details for {year?.name}.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="edit_name" value="Name (YYYY-YYYY)" />
                        <TextInput
                            id="edit_name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="edit_starts_on" value="Start Date" />
                        <TextInput
                            id="edit_starts_on"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.starts_on}
                            onChange={(e) => setData('starts_on', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.starts_on} />
                    </div>

                    <div>
                        <InputLabel htmlFor="edit_ends_on" value="End Date" />
                        <TextInput
                            id="edit_ends_on"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.ends_on}
                            onChange={(e) => setData('ends_on', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.ends_on} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-emerald-500 focus:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function DeleteYearModal({ year, onClose }: { year: AcademicYear | null, onClose: () => void }) {
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
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Delete Academic Year</h2>
                    </div>
                </div>
                
                <div className="mt-4">
                    <p className="text-sm text-slate-500">
                        Are you sure you want to delete the academic year <strong>{year?.name}</strong>? This action cannot be undone.
                    </p>
                    
                    {(errors as any).message && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm font-bold text-red-600">{(errors as any).message}</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-red-500 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Deleting...' : 'Delete Year'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
