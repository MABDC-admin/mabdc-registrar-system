import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

type User = {
    id: number;
    name: string;
    email: string;
};

type TeacherProfile = {
    id: number;
    user_id: number;
    employee_id: string | null;
    department: string;
    specialization: string | null;
    phone: string | null;
    advisory_grade_level: string | null;
    advisory_section: string | null;
    status: 'Active' | 'On Leave' | 'Inactive';
    user: User;
};

type Section = {
    id: number;
    name: string;
    level: string;
};

type TeachersProps = {
    teachers: TeacherProfile[];
    sections: Section[];
    usersWithoutProfile: User[];
};

export default function Teachers({
    teachers,
    sections,
    usersWithoutProfile,
}: TeachersProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] =
        useState<TeacherProfile | null>(null);
    const [linkMode, setLinkMode] = useState<'create' | 'link'>('create');
    const [searchTerm, setSearchTerm] = useState('');

    const createForm = useForm({
        user_id: '',
        name: '',
        email: '',
        employee_id: '',
        department: '',
        specialization: '',
        phone: '',
        advisory_grade_level: '',
        advisory_section: '',
        status: 'Active',
    });

    const editForm = useForm({
        name: '',
        email: '',
        employee_id: '',
        department: '',
        specialization: '',
        phone: '',
        advisory_grade_level: '',
        advisory_section: '',
        status: 'Active',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('teachers.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacher) return;
        editForm.patch(route('teachers.update', selectedTeacher.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedTeacher(null);
            },
        });
    };

    const handleDelete = (teacherId: number) => {
        if (confirm('Are you sure you want to remove this teacher profile?')) {
            useForm().delete(route('teachers.destroy', teacherId));
        }
    };

    const openEditModal = (teacher: TeacherProfile) => {
        setSelectedTeacher(teacher);
        editForm.setData({
            name: teacher.user.name,
            email: teacher.user.email,
            employee_id: teacher.employee_id || '',
            department: teacher.department,
            specialization: teacher.specialization || '',
            phone: teacher.phone || '',
            advisory_grade_level: teacher.advisory_grade_level || '',
            advisory_section: teacher.advisory_section || '',
            status: teacher.status,
        });
        setIsEditModalOpen(true);
    };

    const filteredTeachers = teachers.filter((t) => {
        const query = searchTerm.toLowerCase();
        return (
            t.user.name.toLowerCase().includes(query) ||
            (t.employee_id || '').toLowerCase().includes(query) ||
            t.user.email.toLowerCase().includes(query) ||
            t.department.toLowerCase().includes(query)
        );
    });

    const gradeLevels = [
        'Nursery',
        'Kinder',
        'Kindergarten',
        'Pre-School',
        'L1',
        'L2',
        'G1',
        'G2',
        'G3',
        'G4',
        'G5',
        'G6',
        'G7',
        'G8',
        'G9',
        'G10',
        'G11',
        'G12',
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Faculty directory
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Teachers &amp; Faculty
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                    >
                        + Add Teacher Faculty
                    </button>
                </div>
            }
        >
            <Head title="Teachers Directory" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Search Bar */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Search Faculty
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, ID, or department..."
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* Table View */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Teacher Profiles
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {filteredTeachers.length} faculty record(s)
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <HeaderCell>Employee ID</HeaderCell>
                                        <HeaderCell>Teacher Name</HeaderCell>
                                        <HeaderCell>Department / Specialization</HeaderCell>
                                        <HeaderCell>Advisory Section</HeaderCell>
                                        <HeaderCell>Status</HeaderCell>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredTeachers.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 text-xs font-mono font-medium text-gray-600">
                                                {t.employee_id || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {t.user.name}
                                                </div>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {t.user.email}
                                                    {t.phone ? ` · ${t.phone}` : ''}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                <span className="font-semibold text-gray-900">
                                                    {t.department}
                                                </span>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {t.specialization || 'General'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm">
                                                {t.advisory_grade_level ? (
                                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                                                        {t.advisory_grade_level} -{' '}
                                                        {t.advisory_section ||
                                                            'Unassigned'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        No advisory
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                                                        t.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : t.status ===
                                                              'On Leave'
                                                            ? 'bg-amber-50 text-amber-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(t)
                                                        }
                                                        className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(t.id)
                                                        }
                                                        className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {filteredTeachers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No teacher faculty profiles found matching query.
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
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Add Teacher Faculty Profile
                    </h2>

                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setLinkMode('create')}
                            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md border ${
                                linkMode === 'create'
                                    ? 'bg-gray-900 border-gray-900 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Create New User Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setLinkMode('link')}
                            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md border ${
                                linkMode === 'link'
                                    ? 'bg-gray-900 border-gray-900 text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Link Existing User Account
                        </button>
                    </div>

                    {linkMode === 'create' ? (
                        <div className="space-y-3">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={createForm.errors.name}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="email"
                                    value="Email Address *"
                                />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full text-sm"
                                    value={createForm.data.email}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={createForm.errors.email}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-3">
                            <InputLabel
                                htmlFor="user_id"
                                value="Select User Account"
                            />
                            <select
                                id="user_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={createForm.data.user_id}
                                onChange={(e) =>
                                    createForm.setData(
                                        'user_id',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Select a user...</option>
                                {usersWithoutProfile.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={createForm.errors.user_id}
                                className="mt-1"
                            />
                        </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel
                                htmlFor="employee_id"
                                value="Employee ID"
                            />
                            <TextInput
                                id="employee_id"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.employee_id}
                                onChange={(e) =>
                                    createForm.setData(
                                        'employee_id',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="department"
                                value="Department *"
                            />
                            <TextInput
                                id="department"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.department}
                                onChange={(e) =>
                                    createForm.setData(
                                        'department',
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g. High School"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel
                                htmlFor="specialization"
                                value="Specialization"
                            />
                            <TextInput
                                id="specialization"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.specialization}
                                onChange={(e) =>
                                    createForm.setData(
                                        'specialization',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="phone"
                                value="Phone Contact"
                            />
                            <TextInput
                                id="phone"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.phone}
                                onChange={(e) =>
                                    createForm.setData(
                                        'phone',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                        <div>
                            <InputLabel
                                htmlFor="advisory_grade_level"
                                value="Advisory Grade"
                            />
                            <select
                                id="advisory_grade_level"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={createForm.data.advisory_grade_level}
                                onChange={(e) =>
                                    createForm.setData(
                                        'advisory_grade_level',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">None</option>
                                {gradeLevels.map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="advisory_section"
                                value="Advisory Section"
                            />
                            <TextInput
                                id="advisory_section"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.advisory_section}
                                onChange={(e) =>
                                    createForm.setData(
                                        'advisory_section',
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <select
                                id="status"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={createForm.data.status}
                                onChange={(e) =>
                                    createForm.setData(
                                        'status',
                                        e.target.value as any,
                                    )
                                }
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={createForm.processing}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                        >
                            Add Teacher
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                show={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleEditSubmit} className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Edit Teacher Profile
                    </h2>

                    <div className="space-y-3">
                        <div>
                            <InputLabel htmlFor="edit_name" value="Full Name" />
                            <TextInput
                                id="edit_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.name}
                                onChange={(e) =>
                                    editForm.setData(
                                        'name',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={editForm.errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit_email"
                                value="Email Address"
                            />
                            <TextInput
                                id="edit_email"
                                type="email"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.email}
                                onChange={(e) =>
                                    editForm.setData(
                                        'email',
                                        e.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={editForm.errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel
                                    htmlFor="edit_employee_id"
                                    value="Employee ID"
                                />
                                <TextInput
                                    id="edit_employee_id"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={editForm.data.employee_id}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'employee_id',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="edit_department"
                                    value="Department"
                                />
                                <TextInput
                                    id="edit_department"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={editForm.data.department}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'department',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel
                                    htmlFor="edit_specialization"
                                    value="Specialization"
                                />
                                <TextInput
                                    id="edit_specialization"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={editForm.data.specialization}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'specialization',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="edit_phone"
                                    value="Phone Contact"
                                />
                                <TextInput
                                    id="edit_phone"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={editForm.data.phone}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <InputLabel
                                    htmlFor="edit_advisory_grade_level"
                                    value="Advisory Grade"
                                />
                                <select
                                    id="edit_advisory_grade_level"
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={editForm.data.advisory_grade_level}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'advisory_grade_level',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">None</option>
                                    {gradeLevels.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="edit_advisory_section"
                                    value="Advisory Section"
                                />
                                <TextInput
                                    id="edit_advisory_section"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={editForm.data.advisory_section}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'advisory_section',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_status" value="Status" />
                                <select
                                    id="edit_status"
                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={editForm.data.status}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'status',
                                            e.target.value as any,
                                        )
                                    }
                                >
                                    <option value="Active">Active</option>
                                    <option value="On Leave">On Leave</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                        >
                            Save Changes
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
