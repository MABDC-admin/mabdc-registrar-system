import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function StudentIdIndex() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Student credentials
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Student ID &amp; QR Cards
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Student ID & QR" />

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
                                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09l2.846.813-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-gray-900">
                            Student ID &amp; QR Code Generation
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                            Bulk generation and printing of standardized student ID cards, barcodes, and emergency contact badges.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('learners.index')}
                                className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                Browse Learners to Generate IDs &rarr;
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
