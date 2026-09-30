import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function CommunicationIndex() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Broadcasts &amp; parent notifications
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Parent Communications &amp; Logs
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Communications" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                            <svg
                                className="h-7 w-7 text-gray-700"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-gray-900">
                            Parent Broadcasts &amp; Communication History
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                            Log communication events, email notifications, SMS updates, and official registrar circulars.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('learners.index')}
                                className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                View Contact List in Directory &rarr;
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
