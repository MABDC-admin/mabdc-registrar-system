import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { FormEvent, useState } from 'react';

type Grade = {
    id?: number;
    subject: string;
    q1: number | string | null;
    q2: number | string | null;
    q3: number | string | null;
    q4: number | string | null;
    final_grade: number | string | null;
    remarks: string;
};

type Enrollment = {
    id: number;
    level: string;
    section: string | null;
    session: string | null;
    status: string;
    academic_year: string | null;
    grades: Grade[];
};

type Learner = {
    id: number;
    lrn: string;
    full_name: string;
    enrollments: Enrollment[];
};

export default function AcademicRecordsShow({ learner }: { learner: Learner }) {
    // Pick the latest enrollment
    const activeEnrollment = learner.enrollments[0];
    
    // Initialize form with existing grades or empty state
    const { data, setData, post, processing, recentlySuccessful, isDirty } = useForm({
        grades: activeEnrollment?.grades.length > 0 ? activeEnrollment.grades : [
            { subject: 'Mathematics', q1: '', q2: '', q3: '', q4: '', final_grade: '', remarks: '' },
            { subject: 'Science', q1: '', q2: '', q3: '', q4: '', final_grade: '', remarks: '' },
            { subject: 'English', q1: '', q2: '', q3: '', q4: '', final_grade: '', remarks: '' },
        ] as Grade[]
    });

    const addSubject = () => {
        setData('grades', [...data.grades, { subject: '', q1: '', q2: '', q3: '', q4: '', final_grade: '', remarks: '' }]);
    };

    const updateGrade = (index: number, field: keyof Grade, value: string) => {
        const newGrades = [...data.grades];
        
        if (field === 'subject' || field === 'remarks') {
            (newGrades[index][field] as string) = value;
        } else {
            (newGrades[index][field] as string | number | null) = value === '' ? '' : Number(value);
            
            // Auto calculate final grade if all quarters are filled
            const grade = newGrades[index];
            if (grade.q1 !== '' && grade.q2 !== '' && grade.q3 !== '' && grade.q4 !== '') {
                const total = Number(grade.q1) + Number(grade.q2) + Number(grade.q3) + Number(grade.q4);
                grade.final_grade = (total / 4).toFixed(2);
            } else {
                grade.final_grade = '';
            }
        }
        
        setData('grades', newGrades);
    };

    const removeSubject = (index: number) => {
        const newGrades = data.grades.filter((_, i) => i !== index);
        setData('grades', newGrades);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('grades.store', activeEnrollment.id), {
            preserveScroll: true
        });
    };

    if (!activeEnrollment) {
        return (
            <AuthenticatedLayout>
                <div className="p-8 text-center text-slate-500">This learner has no enrollments.</div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('academic-records.index')} className="p-2 rounded-full hover:bg-slate-200 transition bg-slate-100">
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{learner.full_name}'s Report Card</h1>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                {activeEnrollment.level} • {activeEnrollment.section} ({activeEnrollment.academic_year})
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Report Card - ${learner.full_name}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        
                        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Academic Subjects</h3>
                                <p className="text-sm text-slate-500 font-medium">Input grades for each grading period. Final grades calculate automatically.</p>
                            </div>
                            <SecondaryButton type="button" onClick={addSubject} className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Subject
                            </SecondaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-[#002b80]">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/4">Subject</th>
                                        <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-24">Q1</th>
                                        <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-24">Q2</th>
                                        <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-24">Q3</th>
                                        <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-24">Q4</th>
                                        <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider bg-[#004d31] w-28 border-l border-r border-[#002b80]/20">Final</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                                        <th scope="col" className="px-3 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {data.grades.map((grade, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <input 
                                                    type="text" 
                                                    className="block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm rounded-lg font-bold text-slate-700" 
                                                    placeholder="e.g. Mathematics"
                                                    value={grade.subject}
                                                    onChange={e => updateGrade(index, 'subject', e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input type="number" min="0" max="100" step="0.01" className="block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm rounded-lg text-center font-medium" placeholder="-" value={grade.q1 ?? ''} onChange={e => updateGrade(index, 'q1', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input type="number" min="0" max="100" step="0.01" className="block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm rounded-lg text-center font-medium" placeholder="-" value={grade.q2 ?? ''} onChange={e => updateGrade(index, 'q2', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input type="number" min="0" max="100" step="0.01" className="block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm rounded-lg text-center font-medium" placeholder="-" value={grade.q3 ?? ''} onChange={e => updateGrade(index, 'q3', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input type="number" min="0" max="100" step="0.01" className="block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm rounded-lg text-center font-medium" placeholder="-" value={grade.q4 ?? ''} onChange={e => updateGrade(index, 'q4', e.target.value)} />
                                            </td>
                                            <td className="px-2 py-3 bg-indigo-50/30 border-l border-r border-indigo-50">
                                                <input type="number" min="0" max="100" step="0.01" className="block w-full border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm rounded-lg text-center font-black text-indigo-700 bg-white" placeholder="-" value={grade.final_grade ?? ''} onChange={e => updateGrade(index, 'final_grade', e.target.value)} />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input type="text" className="block w-full border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm rounded-lg text-slate-500" placeholder="Optional notes..." value={grade.remarks ?? ''} onChange={e => updateGrade(index, 'remarks', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button type="button" onClick={() => removeSubject(index)} className="text-slate-400 hover:text-rose-600 transition p-1">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.grades.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                                                No subjects added. Click "Add Subject" to begin tracking grades.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                {recentlySuccessful && <span className="text-sm font-bold text-emerald-600">Report card saved perfectly! ✓</span>}
                            </div>
                            <PrimaryButton disabled={processing || !isDirty} className="!bg-emerald-600 hover:!bg-emerald-700 shadow-md">
                                {processing ? 'Saving Report Card...' : 'Save Report Card'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
