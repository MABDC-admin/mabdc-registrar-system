import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function UnderConstruction({ module }: { module: string }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center text-xs font-semibold text-slate-500 gap-2">
                    <Link href={route('dashboard')} className="hover:text-slate-900 transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-slate-900">{module}</span>
                </div>
            }
        >
            <Head title={module} />

            <div className="flex min-h-[calc(100vh-81px)] flex-col items-center justify-center p-8 text-center bg-slate-50">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner mb-6">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{module}</h1>
                <p className="mt-3 text-lg font-medium text-slate-500 max-w-lg">
                    This module is currently under development. The core framework is in place and the interface will be deployed soon.
                </p>
                <Link
                    href={route('dashboard')}
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                    Return to Dashboard
                </Link>
            </div>
        </AuthenticatedLayout>
    );
}
