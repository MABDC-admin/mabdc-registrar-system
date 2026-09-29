import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

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
        from: number;
        to: number;
        total: number;
    };
    levels: string[];
    filters: {
        search: string;
        level: string;
    };
};

export default function AcademicRecordsIndex({ activeYear, learners, levels, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [level, setLevel] = useState(filters.level || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('academic-records.index'), { search, level }, { preserveState: true });
    };

    const handleLevelChange = (newLevel: string) => {
        setLevel(newLevel);
        router.get(route('academic-records.index'), { search, level: newLevel }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Records</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            {activeYear ? `Manage grades and report cards for ${activeYear.name}` : 'No active academic year found'}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Academic Records" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-none">
                    
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 p-4">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by Learner Name or LRN..."
                                    className="w-full border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="sm:w-48">
                                <select
                                    className="w-full border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm"
                                    value={level}
                                    onChange={e => handleLevelChange(e.target.value)}
                                >
                                    <option value="">All Levels</option>
                                    {levels.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <PrimaryButton type="submit" className="h-full !bg-emerald-600 hover:!bg-emerald-700">Search</PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Roster */}
                    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-[#002b80]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Learner</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Enrollment</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Grades Status</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {learners.data.length > 0 ? learners.data.map((learner) => (
                                    <tr key={learner.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm mr-4 border border-slate-200">
                                                    {learner.full_name.substring(0,2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{learner.full_name}</div>
                                                    <div className="text-xs text-slate-500 font-medium">LRN: {learner.lrn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 font-bold">{learner.current_level || 'No Level'}</div>
                                            <div className="text-xs text-slate-500">{learner.section || 'No Section'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {learner.has_grades ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Grades Encoded
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    No Grades Yet
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={route('academic-records.show', learner.id)}>
                                                <SecondaryButton className="text-xs">View Report Card</SecondaryButton>
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                                            No learners found matching the filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {learners.total > learners.data.length && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex flex-wrap gap-1">
                                {learners.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                                            link.active 
                                            ? 'bg-emerald-600 text-white border-emerald-600' 
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
