import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth }: PageProps) {
    const entryHref = auth.user ? route('dashboard') : route('login');
    const entryLabel = auth.user ? 'Open console' : 'Log in';

    return (
        <>
            <Head title="MABDC Registrar" />

            <main className="ops-screen flex min-h-screen items-center px-6 py-10">
                <div className="ops-shell mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
                    <section className="max-w-4xl">
                        <div className="mb-8 flex items-center gap-4">
                            <ApplicationLogo className="h-16 w-16 fill-current text-teal-300 drop-shadow-[0_0_24px_rgba(45,212,191,0.55)]" />
                            <div>
                                <p className="ops-kicker">MABDC Registrar</p>
                                <p className="text-2xl font-black text-slate-50">
                                    Records Console
                                </p>
                            </div>
                        </div>

                        <p className="ops-kicker">School year 2026-2027</p>
                        <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight text-slate-50 sm:text-6xl">
                            Learner records, document signals, and import review
                            in one command center.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-400">
                            Built for registrar operations: fast lookup, clean
                            escalation signals, workbook import traceability,
                            and role-controlled access.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href={entryHref}
                                className="ops-button-primary rounded-md px-5 py-3 text-sm font-black uppercase tracking-widest"
                            >
                                {entryLabel}
                            </Link>
                            {!auth.user && (
                                <Link
                                    href={route('register')}
                                    className="ops-button-secondary rounded-md px-5 py-3 text-sm font-bold uppercase tracking-widest"
                                >
                                    Register
                                </Link>
                            )}
                        </div>
                    </section>

                    <aside className="ops-panel rounded-lg p-6">
                        <div className="flex items-center justify-between border-b border-teal-400/10 pb-4">
                            <div>
                                <p className="ops-kicker">System state</p>
                                <h2 className="mt-1 text-xl font-black text-slate-50">
                                    Registry online
                                </h2>
                            </div>
                            <span className="h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.9)]" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {[
                                ['Directory', 'Search and level filters'],
                                ['Documents', 'Compliance review queue'],
                                ['Imports', 'Workbook warnings captured'],
                                ['Access', 'Admin and registrar roles'],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 rounded-md border border-slate-700/70 bg-slate-950/60 px-4 py-3"
                                >
                                    <span className="text-xs font-bold uppercase text-slate-500">
                                        {label}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-200">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}
