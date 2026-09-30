import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function HealthRecordIndex() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Medical &amp; clinic files
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Health Records &amp; Medical Files
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Health Records" />

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
                                    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-gray-900">
                            Student Health &amp; Clinic Records
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                            Confidential medical history, vaccination records, allergies, and emergency clinic incident tracking.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('learners.index')}
                                className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                View Learner Records &rarr;
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
