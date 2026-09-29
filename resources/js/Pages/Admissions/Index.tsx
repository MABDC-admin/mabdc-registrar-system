import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';

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
        const config = {
            'inquiry': 'bg-slate-100 text-slate-700 border-slate-200',
            'application_started': 'bg-blue-50 text-blue-700 border-blue-200',
            'awaiting_downpayment': 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
            'for_document_review': 'bg-amber-50 text-amber-700 border-amber-200',
            'incomplete_requirements': 'bg-rose-50 text-rose-700 border-rose-200',
            'for_assessment': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'approved_for_enrollment': 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
            'registration_settled': 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
            'waitlisted': 'bg-orange-50 text-orange-700 border-orange-200',
            'rejected': 'bg-red-50 text-red-700 border-red-200',
        }[status] || 'bg-slate-50 text-slate-700 border-slate-200';
        
        const label = statuses.find(s => s.value === status)?.label ?? status;

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${config}`}>
                {status === 'awaiting_downpayment' ? '🔒 Awaiting Finance Settlement' : label}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admissions & Applications</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Manage prospective learners and enrollment pipeline.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('admissions.create')} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#002b80] px-4 text-xs font-black text-white shadow-xs hover:bg-[#001746] transition">
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            New Walk-in Application
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Admissions Pipeline" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-none">
                    
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                            <p className="text-sm font-bold text-slate-500">Total Applicants</p>
                            <p className="text-3xl font-black text-slate-900 mt-1">{applications.filter(a => !a.learner_id).length}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-amber-500">
                            <p className="text-sm font-bold text-slate-500">🔒 Awaiting Finance Settlement</p>
                            <p className="text-3xl font-black text-amber-600 mt-1">{applications.filter(a => a.status === 'awaiting_downpayment' && !a.learner_id).length}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-emerald-500">
                            <p className="text-sm font-bold text-slate-500">✓ Settled & Ready for Registrar</p>
                            <p className="text-3xl font-black text-emerald-600 mt-1">{applications.filter(a => (a.status === 'approved_for_enrollment' || a.status === 'registration_settled') && !a.learner_id).length}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-[#002b80]">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Applicant Name</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Contact Details</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Grade Level</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Approval & Settlement Status</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Registrar Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {applications.map((app) => {
                                        const firstInitial = (app.first_name || 'A')[0] || 'A';
                                        const lastInitial = (app.last_name || 'P')[0] || 'P';
                                        const displayName = app.full_name || `${app.first_name || ''} ${app.last_name || ''}`.trim() || `Applicant #${app.id}`;
                                        const isFinanceOrAdmin = (usePage().props.auth.user.role === 'finance' || usePage().props.auth.user.role === 'admin');

                                        return (
                                            <tr key={app.id} className={`hover:bg-slate-50 transition-colors ${app.learner_id ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#002b80]/10 flex items-center justify-center font-black text-[#002b80] text-sm border border-[#002b80]/20">
                                                            {firstInitial}{lastInitial}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-extrabold text-slate-900">{displayName}</div>
                                                            <div className="text-xs text-slate-500 font-semibold">{(app.classification || 'NEW').toUpperCase()} • App #{app.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-slate-700">{app.contact_number ?? 'No phone'}</div>
                                                    <div className="text-xs text-slate-500">{app.email ?? 'No email'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-700">{app.level_applied_for ?? 'Unassigned'}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {app.learner_id ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-800 text-white border-slate-900">
                                                            Enrolled Student
                                                        </span>
                                                    ) : (
                                                        <StatusBadge status={app.status} />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {app.learner_id ? (
                                                        <Link href={route('learners.show', app.learner_id)} className="text-[#002b80] hover:underline font-bold text-xs">
                                                            View Profile &rarr;
                                                        </Link>
                                                    ) : (
                                                        (app.status === 'approved_for_enrollment' || app.status === 'registration_settled') ? (
                                                            <button 
                                                                onClick={() => handleEnroll(app.id)}
                                                                className="inline-flex items-center px-3.5 py-2 border border-transparent text-xs font-black rounded-xl shadow-xs text-white bg-[#002b80] hover:bg-[#001746] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002b80] transition"
                                                            >
                                                                ✓ Admit & Generate Contract
                                                            </button>
                                                        ) : isFinanceOrAdmin ? (
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm(`Mark ₱500 registration settled for ${displayName}?`)) {
                                                                        router.post(route('learner-accounts.applications.settle', app.id));
                                                                    }
                                                                }}
                                                                className="inline-flex items-center px-3.5 py-2 border border-transparent text-xs font-black rounded-xl shadow-xs text-[#001746] bg-[#ffc000] hover:bg-[#ffe066] transition"
                                                            >
                                                                ✓ Settle ₱500 Registration
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                disabled
                                                                title="Finance must mark Registration as Settled before Registrar can admit learner"
                                                                className="inline-flex items-center px-3.5 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-400 bg-slate-100 cursor-not-allowed"
                                                            >
                                                                🔒 Awaiting Finance Settlement
                                                            </button>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    
                                    {applications.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <h3 className="text-sm font-black text-slate-900">No applications found</h3>
                                                <p className="mt-1 text-sm text-slate-500">New registered applicants will appear here.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
