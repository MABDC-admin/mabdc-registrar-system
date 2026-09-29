import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
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

export default function Teachers({ teachers, sections, usersWithoutProfile }: TeachersProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
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

    const filteredTeachers = teachers.filter(t => {
        const query = searchTerm.toLowerCase();
        return (
            t.user.name.toLowerCase().includes(query) ||
            (t.employee_id || '').toLowerCase().includes(query) ||
            t.user.email.toLowerCase().includes(query) ||
            t.department.toLowerCase().includes(query)
        );
    });

    const gradeLevels = [
        'Nursery', 'Kinder', 'Kindergarten', 'Pre-School',
        'L1', 'L2', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 py-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                        Module
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                        Faculty Directory & Advisory
                    </h2>
                </div>
            }
        >
            <Head title="Faculty Directory" />

            <div className="py-8 bg-slate-50 min-h-[calc(100vh-81px)]">
                <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <input
                                type="text"
                                placeholder="Search teacher name, ID, or department..."
                                className="w-full px-4 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500"
                        >
                            ➕ Add Teacher Faculty
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee ID</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Teacher Info</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department & Specialization</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Advisory Assignment</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.length > 0 ? (
                                    filteredTeachers.map((t) => (
                                        <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                                            <td className="p-4 text-sm font-medium text-slate-600">{t.employee_id || 'N/A'}</td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-slate-900">{t.user.name}</div>
                                                <div className="text-xs text-slate-500">{t.user.email}</div>
                                                {t.phone && <div className="text-xs text-slate-400 mt-0.5">{t.phone}</div>}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-semibold text-slate-800">{t.department}</div>
                                                {t.specialization && <div className="text-xs text-slate-500">{t.specialization}</div>}
                                            </td>
                                            <td className="p-4">
                                                {t.advisory_grade_level ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {t.advisory_grade_level} - {t.advisory_section || 'No Section'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-semibold italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                    t.status === 'Active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : t.status === 'On Leave'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(t)}
                                                        className="text-emerald-600 hover:text-emerald-700 font-bold text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="text-rose-600 hover:text-rose-700 font-bold text-xs"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-sm text-slate-500">
                                            No teacher faculty profiles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>

            {/* Create Modal */}
            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="lg">
                <form onSubmit={handleCreateSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Add Teacher Faculty Profile</h2>

                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setLinkMode('create')}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl border ${
                                linkMode === 'create'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Create New User Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setLinkMode('link')}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl border ${
                                linkMode === 'link'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Link Existing Teacher User
                        </button>
                    </div>

                    {linkMode === 'create' ? (
                        <>
                            <div className="mb-4">
                                <InputLabel htmlFor="name" value="Full Name" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                />
                                <InputError message={createForm.errors.name} className="mt-2" />
                            </div>
                            <div className="mb-4">
                                <InputLabel htmlFor="email" value="Email Address" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                />
                                <InputError message={createForm.errors.email} className="mt-2" />
                            </div>
                        </>
                    ) : (
                        <div className="mb-4">
                            <InputLabel htmlFor="user_id" value="Select User Account" />
                            <select
                                id="user_id"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                value={createForm.data.user_id}
                                onChange={(e) => createForm.setData('user_id', e.target.value)}
                            >
                                <option value="">Select a user...</option>
                                {usersWithoutProfile.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            <InputError message={createForm.errors.user_id} className="mt-2" />
                        </div>
                    )}

                    <div className="mb-4">
                        <InputLabel htmlFor="employee_id" value="Employee ID (Optional)" />
                        <TextInput
                            id="employee_id"
                            type="text"
                            className="mt-1 block w-full"
                            value={createForm.data.employee_id}
                            onChange={(e) => createForm.setData('employee_id', e.target.value)}
                        />
                        <InputError message={createForm.errors.employee_id} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="department" value="Department" />
                        <TextInput
                            id="department"
                            type="text"
                            className="mt-1 block w-full"
                            value={createForm.data.department}
                            onChange={(e) => createForm.setData('department', e.target.value)}
                            placeholder="e.g. High School, Elementary, Senior High"
                        />
                        <InputError message={createForm.errors.department} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <InputLabel htmlFor="specialization" value="Specialization" />
                            <TextInput
                                id="specialization"
                                type="text"
                                className="mt-1 block w-full"
                                value={createForm.data.specialization}
                                onChange={(e) => createForm.setData('specialization', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="phone" value="Phone / Contact" />
                            <TextInput
                                id="phone"
                                type="text"
                                className="mt-1 block w-full"
                                value={createForm.data.phone}
                                onChange={(e) => createForm.setData('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <InputLabel htmlFor="advisory_grade_level" value="Advisory Grade" />
                            <select
                                id="advisory_grade_level"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                value={createForm.data.advisory_grade_level}
                                onChange={(e) => createForm.setData('advisory_grade_level', e.target.value)}
                            >
                                <option value="">None</option>
                                {gradeLevels.map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="advisory_section" value="Advisory Section" />
                            <TextInput
                                id="advisory_section"
                                type="text"
                                className="mt-1 block w-full"
                                value={createForm.data.advisory_section}
                                onChange={(e) => createForm.setData('advisory_section', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <select
                                id="status"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                value={createForm.data.status}
                                onChange={(e) => createForm.setData('status', e.target.value)}
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton type="submit" disabled={createForm.processing}>Add Teacher</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="lg">
                <form onSubmit={handleEditSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Teacher Profile</h2>

                    <div className="mb-4">
                        <InputLabel htmlFor="edit_name" value="Full Name" />
                        <TextInput
                            id="edit_name"
                            type="text"
                            className="mt-1 block w-full"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                        />
                        <InputError message={editForm.errors.name} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="edit_email" value="Email Address" />
                        <TextInput
                            id="edit_email"
                            type="email"
                            className="mt-1 block w-full"
                            value={editForm.data.email}
                            onChange={(e) => editForm.setData('email', e.target.value)}
                        />
                        <InputError message={editForm.errors.email} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="edit_employee_id" value="Employee ID (Optional)" />
                        <TextInput
                            id="edit_employee_id"
                            type="text"
                            className="mt-1 block w-full"
                            value={editForm.data.employee_id}
                            onChange={(e) => editForm.setData('employee_id', e.target.value)}
                        />
                        <InputError message={editForm.errors.employee_id} className="mt-2" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="edit_department" value="Department" />
                        <TextInput
                            id="edit_department"
                            type="text"
                            className="mt-1 block w-full"
                            value={editForm.data.department}
                            onChange={(e) => editForm.setData('department', e.target.value)}
                        />
                        <InputError message={editForm.errors.department} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <InputLabel htmlFor="edit_specialization" value="Specialization" />
                            <TextInput
                                id="edit_specialization"
                                type="text"
                                className="mt-1 block w-full"
                                value={editForm.data.specialization}
                                onChange={(e) => editForm.setData('specialization', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_phone" value="Phone / Contact" />
                            <TextInput
                                id="edit_phone"
                                type="text"
                                className="mt-1 block w-full"
                                value={editForm.data.phone}
                                onChange={(e) => editForm.setData('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <InputLabel htmlFor="edit_advisory_grade_level" value="Advisory Grade" />
                            <select
                                id="edit_advisory_grade_level"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                value={editForm.data.advisory_grade_level}
                                onChange={(e) => editForm.setData('advisory_grade_level', e.target.value)}
                            >
                                <option value="">None</option>
                                {gradeLevels.map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_advisory_section" value="Advisory Section" />
                            <TextInput
                                id="edit_advisory_section"
                                type="text"
                                className="mt-1 block w-full"
                                value={editForm.data.advisory_section}
                                onChange={(e) => editForm.setData('advisory_section', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_status" value="Status" />
                            <select
                                id="edit_status"
                                className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm"
                                value={editForm.data.status}
                                onChange={(e) => editForm.setData('status', e.target.value)}
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton type="submit" disabled={editForm.processing}>Save Changes</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
