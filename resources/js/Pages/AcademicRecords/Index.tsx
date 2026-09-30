import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type Learner = {
    id: number;
    lrn: string;
    full_name: string;
    current_level: string | null;
    section: string | null;
    status: string | null;
    academic_year: string | null;
    has_grades: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    activeYear: { id: number; name: string } | null;
    learners: {
        data: Learner[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
    };
    levels: string[];
    filters: {
        search: string;
        level: string;
    };
};

export default function AcademicRecordsIndex({
    activeYear,
    learners,
    levels,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [level, setLevel] = useState(filters.level || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('academic-records.index'),
            { search, level },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setLevel('');
        router.get(route('academic-records.index'), {}, { replace: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Grades &amp; transcripts
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Academic Records
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        Active year:{' '}
                        <span className="font-semibold text-gray-900">
                            {activeYear?.name ?? 'Not configured'}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Academic Records" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Filters Form */}
                    <form
                        onSubmit={handleSearch}
                        className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_auto]"
                    >
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Search Learner
                            </span>
                            <input
                                type="text"
                                placeholder="Name or LRN"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Grade Level
                            </span>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="">All levels</option>
                                {levels.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                            >
                                Apply
                            </button>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        </div>
                    </form>

                    {/* Table View */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Learner Academic Records
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {learners.from ?? 0}-
                                    {learners.to ?? 0} of {learners.total} records
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <HeaderCell>Learner</HeaderCell>
                                        <HeaderCell>Level &amp; Section</HeaderCell>
                                        <HeaderCell>Grades Status</HeaderCell>
                                        <HeaderCell>Action</HeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {learners.data.map((learner) => (
                                        <tr
                                            key={learner.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <Link
                                                    href={route(
                                                        'academic-records.show',
                                                        learner.id,
                                                    )}
                                                    className="font-semibold text-gray-900 hover:text-indigo-700"
                                                >
                                                    {learner.full_name}
                                                </Link>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    LRN {learner.lrn}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                <span className="font-semibold text-gray-900">
                                                    {learner.current_level ||
                                                        'No Level'}
                                                </span>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {learner.section ||
                                                        'Unassigned'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4">
                                                {learner.has_grades ? (
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        Grades Encoded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                                        Pending Encoding
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-sm">
                                                <Link
                                                    href={route(
                                                        'academic-records.show',
                                                        learner.id,
                                                    )}
                                                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    View Report Card &rarr;
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}

                                    {learners.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No learners found matching the filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {learners.links.length > 3 && (
                            <div className="flex flex-wrap gap-2 border-t border-gray-200 px-5 py-4">
                                {learners.links.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={
                                            'rounded-md border px-3 py-1 text-sm ' +
                                            (link.active
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50') +
                                            (!link.url
                                                ? ' pointer-events-none opacity-40'
                                                : '')
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            {children}
        </th>
    );
}
