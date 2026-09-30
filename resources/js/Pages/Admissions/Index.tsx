import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type ApplicationStatusOption = {
    value: string;
    label: string;
};

type AdmissionApplication = {
    id: number;
    uuid: string;
    full_name: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    email: string | null;
    contact_number: string | null;
    level_applied_for: string | null;
    classification: string;
    status: string;
    created_at: string;
    learner_id: number | null;
};

type Props = {
    activeYear: ActiveYear;
    applications: AdmissionApplication[];
    statuses: ApplicationStatusOption[];
};

export default function AdmissionsIndex({ activeYear, applications, statuses }: Props) {
    const handleEnroll = (applicationId: number) => {
        if (confirm('Are you sure you want to officially admit and enroll this applicant? This will generate their official Enrollment Contract PDF (2 copies), auto-send parent email, and alert the Telegram Bot.')) {
            router.post(route('admissions.enroll', applicationId));
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const config: Record<string, string> = {
            'inquiry': 'bg-gray-100 text-gray-700',
            'application_started': 'bg-blue-50 text-blue-700',
            'awaiting_downpayment': 'bg-amber-50 text-amber-800 font-semibold',
            'for_document_review': 'bg-amber-50 text-amber-700',
            'incomplete_requirements': 'bg-rose-50 text-rose-700',
            'for_assessment': 'bg-indigo-50 text-indigo-700',
            'approved_for_enrollment': 'bg-emerald-50 text-emerald-700 font-semibold',
            'registration_settled': 'bg-emerald-50 text-emerald-700 font-semibold',
            'waitlisted': 'bg-orange-50 text-orange-700',
            'rejected': 'bg-red-50 text-red-700',
        };

        const badgeClass = config[status] || 'bg-gray-100 text-gray-700';
        const label = statuses.find(s => s.value === status)?.label ?? status;

        return (
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
                {status === 'awaiting_downpayment' ? 'Awaiting Settlement' : label}
            </span>
        );
    };

    const pendingCount = applications.filter(a => !a.learner_id).length;
    const awaitingDownpaymentCount = applications.filter(a => a.status === 'awaiting_downpayment' && !a.learner_id).length;
    const readyCount = applications.filter(a => (a.status === 'approved_for_enrollment' || a.status === 'registration_settled') && !a.learner_id).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Registrar records</p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Admissions & Applications
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500">
                            Active year: <span className="text-gray-900">{activeYear?.name ?? 'Not configured'}</span>
                        </div>
                        <Link
                            href={route('admissions.create')}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3.5 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                            + New Walk-in
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Admissions Pipeline" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Applicants</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{pendingCount}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Awaiting Downpayment</p>
                            <p className="mt-1 text-2xl font-semibold text-amber-700">{awaitingDownpaymentCount}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Settled & Ready to Admit</p>
                            <p className="mt-1 text-2xl font-semibold text-emerald-700">{readyCount}</p>
                        </div>
                    </div>

                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Admissions pipeline
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {applications.length} applicant records
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Applicant</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Grade Level</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Contacts</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {applications.map((app) => {
                                        const displayName = app.full_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || `Applicant #${app.id}`;
                                        const isFinanceOrAdmin = (usePage().props.auth.user.role === 'finance' || usePage().props.auth.user.role === 'admin');

                                        return (
                                            <tr key={app.id} className={`hover:bg-gray-50 ${app.learner_id ? 'opacity-60 bg-gray-50/50' : ''}`}>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <span className="font-semibold text-gray-900">{displayName}</span>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {(app.classification || 'NEW').toUpperCase()} · App #{app.id}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                    <span className="font-semibold">{app.level_applied_for ?? 'Unassigned'}</span>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                    <p>{app.contact_number ?? 'No phone'}</p>
                                                    <p className="mt-1 text-xs text-gray-500">{app.email ?? 'No email'}</p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    {app.learner_id ? (
                                                        <span className="inline-flex items-center rounded-md bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
                                                            Enrolled Student
                                                        </span>
                                                    ) : (
                                                        <StatusBadge status={app.status} />
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm">
                                                    {app.learner_id ? (
                                                        <Link href={route('learners.show', app.learner_id)} className="font-semibold text-indigo-600 hover:text-indigo-900">
                                                            View Profile &rarr;
                                                        </Link>
                                                    ) : (
                                                        (app.status === 'approved_for_enrollment' || app.status === 'registration_settled') ? (
                                                            <button
                                                                onClick={() => handleEnroll(app.id)}
                                                                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                                                            >
                                                                ✓ Admit & Generate Contract
                                                            </button>
                                                        ) : isFinanceOrAdmin ? (
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`Mark AED 500 registration settled for ${displayName}?`)) {
                                                                        router.post(route('learner-accounts.applications.settle', app.id));
                                                                    }
                                                                }}
                                                                className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                                                            >
                                                                ✓ Settle Downpayment
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">
                                                                Awaiting Downpayment
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {applications.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                                                No applicant records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
