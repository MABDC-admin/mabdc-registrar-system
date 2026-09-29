import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Index() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 py-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                        Module
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                        Health Records
                    </h2>
                </div>
            }
        >
            <Head title="Health Records" />

            <div className="py-8 bg-slate-50 min-h-[calc(100vh-81px)]">
                <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                            <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456zM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z" />
                            </svg>
                        </div>
                        <h3 className="mt-6 text-xl font-black text-slate-900">Health Records Module Activated</h3>
                        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                            Maintain confidential student medical and health information.
                        </p>
                        <div className="mt-8">
                            <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500">
                                Configure Module
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
