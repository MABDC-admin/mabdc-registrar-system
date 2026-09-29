import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

type Learner = {
    id: number;
    full_name: string;
    normalized_name: string;
};

type Enrollment = {
    id: number;
    learner: Learner;
};

type Section = {
    id: number;
    academic_year_id: number;
    level: string;
    name: string;
    session: string;
    teacher_name: string | null;
    enrollments: Enrollment[];
};

type Props = {
    section: Section;
    unassigned: Enrollment[];
};

export default function ClassesShow({ section, unassigned }: Props) {
    
    const handleAssign = (enrollmentId: number) => {
        router.post(route('classes.assign', section.id), {
            enrollment_id: enrollmentId
        }, { preserveScroll: true });
    };

    const handleUnassign = (enrollmentId: number) => {
        router.post(route('classes.unassign', section.id), {
            enrollment_id: enrollmentId
        }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-1">
                            <Link href={route('classes.index')} className="hover:text-emerald-600 transition">Sections</Link>
                            <span>/</span>
                            <span>{section.level}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{section.name} Roster</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm text-sm">
                            <span className="font-medium text-slate-500 mr-2">Capacity:</span>
                            <span className="font-black text-emerald-600">{section.enrollments.length} Assigned</span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${section.name} Roster`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-none">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Left Column: Unassigned Pool */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[800px]">
                            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-900">Unassigned Pool</h3>
                                    <p className="text-xs font-medium text-slate-500">{section.level} students without a section</p>
                                </div>
                                <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                    {unassigned.length}
                                </span>
                            </div>
                            <div className="overflow-y-auto p-2 flex-1 bg-slate-50/50">
                                {unassigned.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-sm font-bold text-slate-500">No unassigned students found.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {unassigned.map(enrollment => (
                                            <li 
                                                key={enrollment.id}
                                                className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                        {enrollment.learner.full_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{enrollment.learner.full_name}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleAssign(enrollment.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold"
                                                >
                                                    Assign &rarr;
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Official Roster */}
                        <div className="bg-white rounded-xl border border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col max-h-[800px]">
                            <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-emerald-900">Official Roster</h3>
                                    <p className="text-xs font-medium text-emerald-700">Adviser: {section.teacher_name || 'TBA'}</p>
                                </div>
                                <span className="bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                    {section.enrollments.length}
                                </span>
                            </div>
                            <div className="overflow-y-auto p-2 flex-1">
                                {section.enrollments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-sm font-bold text-slate-500">This section is currently empty.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {section.enrollments.map(enrollment => (
                                            <li 
                                                key={enrollment.id}
                                                className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm flex items-center justify-between hover:border-rose-200 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-xs">
                                                        {enrollment.learner.full_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{enrollment.learner.full_name}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleUnassign(enrollment.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-md text-xs font-bold"
                                                >
                                                    &larr; Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
