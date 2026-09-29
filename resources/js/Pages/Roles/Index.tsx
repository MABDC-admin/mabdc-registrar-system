import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    permissions: Permission[];
};

type User = {
    id: number;
    name: string;
    email: string;
    roles: Role[];
};

type Props = {
    roles: Role[];
    permissions: Permission[];
    users: User[];
};

export default function RolesIndex({ roles, permissions, users }: Props) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 py-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                        Administration
                    </p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            Roles & Permissions
                        </h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-indigo-500 hover:shadow"
                        >
                            + Add New Role
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Roles & Permissions" />

            <div className="py-8 bg-slate-50 min-h-[calc(100vh-81px)]">
                <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Roles Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-200 px-8 py-6 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    System Roles
                                </h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Manage roles and their associated module permissions.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#002b80] text-white">
                                    <tr className="text-left text-xs font-bold uppercase tracking-wider">
                                        <th className="px-8 py-4">Role Name</th>
                                        <th className="px-8 py-4">Permissions</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {roles.map((role) => (
                                        <tr key={role.id} className="transition hover:bg-slate-50/50 group">
                                            <td className="px-8 py-5">
                                                <p className="font-black text-slate-900 text-base capitalize">{role.name}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {role.permissions.map(p => (
                                                        <span key={p.id} className="px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border-slate-200">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                    {role.permissions.length === 0 && <span className="text-sm text-slate-400 italic">No permissions</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 align-top text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setRoleToEdit(role)}
                                                        className="inline-flex h-8 items-center justify-center rounded-lg bg-white border border-slate-200 px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setRoleToDelete(role)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-red-200 text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-300"
                                                        title="Delete Role"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Users Roles Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="border-b border-slate-200 px-8 py-6 bg-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    User Roles Assignment
                                </h3>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Assign Spatie roles to system users.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#002b80] text-white">
                                    <tr className="text-left text-xs font-bold uppercase tracking-wider">
                                        <th className="px-8 py-4">User</th>
                                        <th className="px-8 py-4">Assigned Roles</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {users.map((user) => (
                                        <tr key={user.id} className="transition hover:bg-slate-50/50 group">
                                            <td className="px-8 py-5">
                                                <p className="font-black text-slate-900 text-base">{user.name}</p>
                                                <p className="text-sm font-medium text-slate-500">{user.email}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {user.roles.map(r => (
                                                        <span key={r.id} className="px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border-indigo-200">
                                                            {r.name}
                                                        </span>
                                                    ))}
                                                    {user.roles.length === 0 && <span className="text-sm text-slate-400 italic">No roles assigned</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 align-top text-right">
                                                <button
                                                    onClick={() => setUserToEdit(user)}
                                                    className="inline-flex h-8 items-center justify-center rounded-lg bg-white border border-slate-200 px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                                                >
                                                    Manage Roles
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            <CreateRoleModal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                permissions={permissions}
            />

            <EditRoleModal
                role={roleToEdit}
                onClose={() => setRoleToEdit(null)}
                permissions={permissions}
            />

            <DeleteRoleModal
                role={roleToDelete}
                onClose={() => setRoleToDelete(null)}
            />

            <AssignUserRoleModal
                user={userToEdit}
                onClose={() => setUserToEdit(null)}
                roles={roles}
            />
        </AuthenticatedLayout>
    );
}

// -------------------------------------------------------------
// Modals
// -------------------------------------------------------------

function CreateRoleModal({ show, onClose, permissions }: { show: boolean, onClose: () => void, permissions: Permission[] }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('roles.store'), {
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

    const togglePermission = (name: string) => {
        if (data.permissions.includes(name)) {
            setData('permissions', data.permissions.filter(p => p !== name));
        } else {
            setData('permissions', [...data.permissions, name]);
        }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-black text-slate-900">Add New Role</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Create a new system role and assign permissions.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="create_name" value="Role Name" />
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
                        <InputLabel value="Permissions" />
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={data.permissions.includes(permission.name)}
                                        onChange={() => togglePermission(permission.name)}
                                    />
                                    <span className="text-sm text-slate-700">{permission.name}</span>
                                </label>
                            ))}
                            {permissions.length === 0 && <span className="text-sm text-slate-500">No permissions found in the database.</span>}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Creating...' : 'Create Role'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function EditRoleModal({ role, onClose, permissions }: { role: Role | null, onClose: () => void, permissions: Permission[] }) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        permissions: [] as string[],
    });

    useEffect(() => {
        if (role) {
            setData({
                name: role.name,
                permissions: role.permissions.map(p => p.name),
            });
        }
    }, [role]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!role) return;
        
        put(route('roles.update', role.id), {
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

    const togglePermission = (name: string) => {
        if (data.permissions.includes(name)) {
            setData('permissions', data.permissions.filter(p => p !== name));
        } else {
            setData('permissions', [...data.permissions, name]);
        }
    };

    return (
        <Modal show={!!role} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-black text-slate-900">Edit Role</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Update role name and permissions.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <InputLabel htmlFor="edit_name" value="Role Name" />
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
                        <InputLabel value="Permissions" />
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                            {permissions.map(permission => (
                                <label key={permission.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={data.permissions.includes(permission.name)}
                                        onChange={() => togglePermission(permission.name)}
                                    />
                                    <span className="text-sm text-slate-700">{permission.name}</span>
                                </label>
                            ))}
                            {permissions.length === 0 && <span className="text-sm text-slate-500">No permissions found.</span>}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function DeleteRoleModal({ role, onClose }: { role: Role | null, onClose: () => void }) {
    const { delete: destroy, processing, errors, clearErrors } = useForm();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!role) return;
        
        destroy(route('roles.destroy', role.id), {
            onSuccess: () => onClose(),
        });
    };

    const handleClose = () => {
        clearErrors();
        onClose();
    };

    return (
        <Modal show={!!role} onClose={handleClose} maxWidth="sm">
            <form onSubmit={submit} className="p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Delete Role</h2>
                    </div>
                </div>
                
                <div className="mt-4">
                    <p className="text-sm text-slate-500">
                        Are you sure you want to delete the <strong>{role?.name}</strong> role? This will remove the role from any users assigned to it.
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
                        className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Deleting...' : 'Delete Role'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function AssignUserRoleModal({ user, onClose, roles }: { user: User | null, onClose: () => void, roles: Role[] }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        roles: [] as string[],
    });

    useEffect(() => {
        if (user) {
            setData('roles', user.roles.map(r => r.name));
        }
    }, [user]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!user) return;
        
        post(route('users.roles.assign', user.id), {
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

    const toggleRole = (name: string) => {
        if (data.roles.includes(name)) {
            setData('roles', data.roles.filter(r => r !== name));
        } else {
            setData('roles', [...data.roles, name]);
        }
    };

    return (
        <Modal show={!!user} onClose={handleClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-black text-slate-900">Manage Roles for {user?.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Assign system roles to this user.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <div className="mt-2 space-y-2">
                            {roles.map(role => (
                                <label key={role.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                        checked={data.roles.includes(role.name)}
                                        onChange={() => toggleRole(role.name)}
                                    />
                                    <span className="text-sm font-semibold text-slate-700 capitalize">{role.name}</span>
                                </label>
                            ))}
                            {roles.length === 0 && <span className="text-sm text-slate-500">No roles available.</span>}
                        </div>
                    </div>
                    
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
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Assignments'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
