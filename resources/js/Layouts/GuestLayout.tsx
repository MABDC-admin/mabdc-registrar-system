import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    const isFinance = typeof window !== 'undefined' && window.location.hostname.includes('finance');

    return (
        <div className="ops-screen flex min-h-screen flex-col items-center justify-center px-4 py-8">
            <div className="ops-shell w-full max-w-md">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="h-14 w-14 fill-current text-teal-300 drop-shadow-[0_0_20px_rgba(45,212,191,0.5)]" />
                        <div>
                            <p className="ops-kicker">{isFinance ? 'MABDC Finance' : 'MABDC Registrar'}</p>
                            <p className="text-lg font-black ops-title">
                                {isFinance ? 'Ledger Console' : 'Records Console'}
                            </p>
                        </div>
                    </Link>
                    <div className="h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.9)]" />
                </div>

                <div className="ops-panel overflow-hidden rounded-lg px-6 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
