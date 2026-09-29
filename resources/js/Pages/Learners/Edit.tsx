import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type EnrollmentSummary = {
    id: number;
    level: string;
    status: string;
    academic_year: string | null;
} | null;

type Learner = {
    id: number;
    lrn: string | null;
    full_name: string;
    birth_date: string | null;
    gender: string | null;
    mother_maiden_name: string | null;
    mother_contact_number: string | null;
    mother_email: string | null;
    father_name: string | null;
    father_contact_number: string | null;
    father_email: string | null;
    uae_address: string | null;
    philippine_address: string | null;
    previous_school: string | null;
    current_enrollment: EnrollmentSummary;
};

type Props = {
    activeYear: ActiveYear;
    learner: Learner;
};

export default function EditLearner({ activeYear, learner }: Props) {
    const { data, setData, patch, processing, errors, isDirty } = useForm({
        lrn: learner.lrn ?? '',
        full_name: learner.full_name,
        birth_date: learner.birth_date ?? '',
        gender: learner.gender ?? '',
        mother_maiden_name: learner.mother_maiden_name ?? '',
        mother_contact_number: learner.mother_contact_number ?? '',
        mother_email: learner.mother_email ?? '',
        father_name: learner.father_name ?? '',
        father_contact_number: learner.father_contact_number ?? '',
        father_email: learner.father_email ?? '',
        philippine_address: learner.philippine_address ?? '',
        uae_address: learner.uae_address ?? '',
        previous_school: learner.previous_school ?? '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('learners.update', learner.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="ops-kicker">Registrar edit</p>
                        <h2 className="ops-title text-3xl leading-tight">
                            Edit learner record
                        </h2>
                    </div>
                    <Link
                        href={route('learners.show', learner.id)}
                        className="ops-button-secondary inline-flex items-center rounded-md px-4 py-2 text-sm font-black"
                    >
                        Back to profile
                    </Link>
                </div>
            }
        >
            <Head title={`Edit ${learner.full_name}`} />

            <div className="py-8">
                <div className="mx-auto w-full max-w-none space-y-5 px-4 sm:px-6 lg:px-8">
                    <section className="grid gap-4 lg:grid-cols-3">
                        <StatusCard
                            label="Active year"
                            value={activeYear?.name ?? 'Not configured'}
                        />
                        <StatusCard
                            label="Level"
                            value={
                                learner.current_enrollment?.level ??
                                'Unassigned'
                            }
                        />
                        <StatusCard
                            label="Status"
                            value={
                                learner.current_enrollment?.status ??
                                'No status'
                            }
                        />
                    </section>

                    <form
                        onSubmit={submit}
                        className="ops-panel overflow-hidden rounded-xl"
                    >
                        <div className="border-b border-slate-200 bg-gradient-to-r from-white via-green-50/80 to-white px-5 py-5">
                            <p className="ops-kicker">Learner identity</p>
                            <h3 className="mt-1 text-lg font-black text-slate-950">
                                {learner.full_name}
                            </h3>
                        </div>

                        <div className="grid gap-5 p-5 lg:grid-cols-2">
                            <Field
                                label="LRN"
                                value={data.lrn}
                                error={errors.lrn}
                                onChange={(value) => setData('lrn', value)}
                            />
                            <Field
                                label="Full name"
                                value={data.full_name}
                                error={errors.full_name}
                                onChange={(value) =>
                                    setData('full_name', value)
                                }
                                required
                            />
                            <Field
                                label="Birth date"
                                type="date"
                                value={data.birth_date}
                                error={errors.birth_date}
                                onChange={(value) =>
                                    setData('birth_date', value)
                                }
                            />
                            <Field
                                label="Gender"
                                value={data.gender}
                                error={errors.gender}
                                onChange={(value) => setData('gender', value)}
                            />
                            <Field
                                label="Mother"
                                value={data.mother_maiden_name}
                                error={errors.mother_maiden_name}
                                onChange={(value) =>
                                    setData('mother_maiden_name', value)
                                }
                            />
                            <Field
                                label="Mother contact"
                                value={data.mother_contact_number}
                                error={errors.mother_contact_number}
                                onChange={(value) =>
                                    setData('mother_contact_number', value)
                                }
                            />
                            <Field
                                label="Mother email"
                                type="email"
                                value={data.mother_email}
                                error={errors.mother_email}
                                onChange={(value) =>
                                    setData('mother_email', value)
                                }
                            />
                            <Field
                                label="Father"
                                value={data.father_name}
                                error={errors.father_name}
                                onChange={(value) =>
                                    setData('father_name', value)
                                }
                            />
                            <Field
                                label="Father contact"
                                value={data.father_contact_number}
                                error={errors.father_contact_number}
                                onChange={(value) =>
                                    setData('father_contact_number', value)
                                }
                            />
                            <Field
                                label="Father email"
                                type="email"
                                value={data.father_email}
                                error={errors.father_email}
                                onChange={(value) =>
                                    setData('father_email', value)
                                }
                            />
                            <Field
                                label="Previous school"
                                value={data.previous_school}
                                error={errors.previous_school}
                                onChange={(value) =>
                                    setData('previous_school', value)
                                }
                            />
                            <TextArea
                                label="UAE address"
                                value={data.uae_address}
                                error={errors.uae_address}
                                onChange={(value) =>
                                    setData('uae_address', value)
                                }
                            />
                            <TextArea
                                label="Philippine address"
                                value={data.philippine_address}
                                error={errors.philippine_address}
                                onChange={(value) =>
                                    setData('philippine_address', value)
                                }
                                wide
                            />
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            <Link
                                href={route('learners.index')}
                                className="ops-button-secondary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-black"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="ops-button-primary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatusCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="ops-panel-soft rounded-xl p-4">
            <p className="ops-kicker">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
        </div>
    );
}

function Field({
    label,
    value,
    error,
    onChange,
    type = 'text',
    required = false,
}: {
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="ops-kicker">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                className="ops-control mt-1 block w-full rounded-md text-sm shadow-sm"
            />
            <InputError message={error} className="mt-2" />
        </label>
    );
}

function TextArea({
    label,
    value,
    error,
    onChange,
    wide = false,
}: {
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
    wide?: boolean;
}) {
    return (
        <label className={'block ' + (wide ? 'lg:col-span-2' : '')}>
            <span className="ops-kicker">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={4}
                className="ops-control mt-1 block w-full rounded-md text-sm shadow-sm"
            />
            <InputError message={error} className="mt-2" />
        </label>
    );
}
