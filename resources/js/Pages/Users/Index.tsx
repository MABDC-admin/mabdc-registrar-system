import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

type Props = {
    users: ManagedUser[];
    roles: string[];
};

export default function UsersIndex({ users, roles }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
    const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 py-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                        Administration
                    </p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            Staff Management
                        </h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 hover:shadow"
                        >
                            + Add New Staff
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Staff Management" />

            <div className="py-8 bg-slate-50 min-h-[calc(100vh-81px)]">
                <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-200 px-8 py-6 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Account Access
                                </h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Manage permissions and system roles for staff members.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#002b80] text-white">
                                    <tr className="text-left text-xs font-bold uppercase tracking-wider">
                                        <th className="px-8 py-4">Staff Member</th>
                                        <th className="px-8 py-4">Role & Access Level</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {users.map((user) => (
                                        <UserRoleRow
                                            key={user.id}
                                            user={user}
                                            roles={roles}
                                            onEdit={() => setUserToEdit(user)}
                                            onDelete={() => setUserToDelete(user)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            <CreateUserModal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                roles={roles}
            />

            <EditUserModal
                user={userToEdit}
                onClose={() => setUserToEdit(null)}
                roles={roles}
            />

            <DeleteUserModal
                user={userToDelete}
                onClose={() => setUserToDelete(null)}
            />
        </AuthenticatedLayout>
    );
}

function UserRoleRow({
    user,
    roles,
    onEdit,
    onDelete,
}: {
    user: ManagedUser;
    roles: string[];
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { data, setData, patch, processing, errors, isDirty, reset } = useForm({
        role: user.role,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('users.role.update', user.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const getBadgeColor = (role: string) => {
        switch(role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'registrar': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <tr className="transition hover:bg-slate-50/50 group">
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 text-lg font-black shadow-inner shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <p className="font-black text-slate-900 text-base">{user.name}</p>
                            <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${getBadgeColor(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5 align-top">
                <div className="w-full max-w-xs">
                    <select
                        value={data.role}
                        onChange={(event) =>
                            setData('role', event.target.value)
                        }
                        className="block w-full rounded-xl border-slate-300 py-2.5 pl-4 pr-10 text-sm font-bold text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 transition cursor-pointer bg-slate-50 hover:bg-white"
                    >
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                        {roleDescription(data.role)}
                    </p>
                    {errors.role && (
                        <p className="mt-1 text-xs font-bold text-red-500">
                            {errors.role}
                        </p>
                    )}
                </div>
            </td>
            <td className="px-8 py-5 align-top text-right">
                <div className="flex justify-end gap-2 pt-1">
                    <Transition
                        show={isDirty}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1 scale-95"
                        enterTo="opacity-100 translate-y-0 scale-100"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0 scale-100"
                        leaveTo="opacity-0 translate-y-1 scale-95"
                    >
                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Saving...' : 'Save Role'}
                        </button>
                    </Transition>
                    
                    {!isDirty && (
                        <>
                            <button
                                onClick={onEdit}
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                            >
                                Edit
                            </button>
                            <button
                                onClick={onDelete}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-red-200 text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-300"
                                title="Delete User"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

function roleDescription(role: string) {
    if (role === 'admin') {
        return 'Full system access including user management.';
    }

    if (role === 'registrar') {
        return 'Access to student records and enrollments.';
    }

    return 'Basic access. Cannot modify registrar records.';
}

// -------------------------------------------------------------
// Modals
// -------------------------------------------------------------

function CreateUserModal({ show, onClose, roles }: { show: boolean, onClose: () => void, roles: string[] }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('users.store'), {
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
                <h2 className="text-lg font-black text-slate-900">Add New Staff</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Create a new account for a staff member and assign them a role.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="create_name" value="Name" />
                        <TextInput
                            id="create_name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="create_email" value="Email" />
                        <TextInput
                            id="create_email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="create_password" value="Password" />
                        <TextInput
                            id="create_password"
                            type="password"
                            className="mt-1 block w-full"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.password} />
                    </div>

                    <div>
                        <InputLabel htmlFor="create_role" value="Role" />
                        <select
                            id="create_role"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={errors.role} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-emerald-500 focus:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Creating...' : 'Create Staff'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function EditUserModal({ user, onClose, roles }: { user: ManagedUser | null, onClose: () => void, roles: string[] }) {
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        if (user) {
            setData({
                name: user.name,
                email: user.email,
                password: '',
            });
        }
    }, [user]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!user) return;
        
        patch(route('users.update', user.id), {
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
        <Modal show={!!user} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-black text-slate-900">Edit Staff Member</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Update profile details for {user?.name}.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="edit_name" value="Name" />
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
                        <InputLabel htmlFor="edit_email" value="Email" />
                        <TextInput
                            id="edit_email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="edit_password" value="New Password (Optional)" />
                        <TextInput
                            id="edit_password"
                            type="password"
                            className="mt-1 block w-full"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        <p className="mt-1 text-xs text-slate-400">Leave blank to keep current password.</p>
                        <InputError className="mt-2" message={errors.password} />
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

function DeleteUserModal({ user, onClose }: { user: ManagedUser | null, onClose: () => void }) {
    const { delete: destroy, processing, errors, clearErrors } = useForm();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!user) return;
        
        destroy(route('users.destroy', user.id), {
            onSuccess: () => onClose(),
        });
    };

    const handleClose = () => {
        clearErrors();
        onClose();
    };

    return (
        <Modal show={!!user} onClose={handleClose} maxWidth="sm">
            <form onSubmit={submit} className="p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Delete Staff Member</h2>
                    </div>
                </div>
                
                <div className="mt-4">
                    <p className="text-sm text-slate-500">
                        Are you sure you want to delete the account for <strong>{user?.name}</strong>? This action cannot be undone and will immediately revoke their access to the system.
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
                        {processing ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
