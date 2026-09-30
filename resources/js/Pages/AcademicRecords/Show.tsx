import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

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

export default function AcademicRecordsShow({
    learner,
}: {
    learner: Learner;
}) {
    const activeEnrollment = learner.enrollments[0];

    const { data, setData, post, processing, recentlySuccessful, isDirty } =
        useForm({
            grades:
                activeEnrollment?.grades.length > 0
                    ? activeEnrollment.grades
                    : ([
                          {
                              subject: 'Mathematics',
                              q1: '',
                              q2: '',
                              q3: '',
                              q4: '',
                              final_grade: '',
                              remarks: '',
                          },
                          {
                              subject: 'Science',
                              q1: '',
                              q2: '',
                              q3: '',
                              q4: '',
                              final_grade: '',
                              remarks: '',
                          },
                          {
                              subject: 'English',
                              q1: '',
                              q2: '',
                              q3: '',
                              q4: '',
                              final_grade: '',
                              remarks: '',
                          },
                      ] as Grade[]),
        });

    const addSubject = () => {
        setData('grades', [
            ...data.grades,
            {
                subject: '',
                q1: '',
                q2: '',
                q3: '',
                q4: '',
                final_grade: '',
                remarks: '',
            },
        ]);
    };

    const updateGrade = (
        index: number,
        field: keyof Grade,
        value: string,
    ) => {
        const newGrades = [...data.grades];

        if (field === 'subject' || field === 'remarks') {
            (newGrades[index][field] as string) = value;
        } else {
            (newGrades[index][field] as string | number | null) =
                value === '' ? '' : Number(value);

            const grade = newGrades[index];
            if (
                grade.q1 !== '' &&
                grade.q2 !== '' &&
                grade.q3 !== '' &&
                grade.q4 !== ''
            ) {
                const total =
                    Number(grade.q1) +
                    Number(grade.q2) +
                    Number(grade.q3) +
                    Number(grade.q4);
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
            preserveScroll: true,
        });
    };

    if (!activeEnrollment) {
        return (
            <AuthenticatedLayout>
                <div className="py-12 text-center text-sm text-gray-500">
                    This learner has no active enrollments.
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Link
                                href={route('academic-records.index')}
                                className="hover:text-indigo-600"
                            >
                                Academic Records
                            </Link>
                            <span>/</span>
                            <span>{learner.full_name}</span>
                        </div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Report Card &amp; Grades
                        </h2>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        Level:{' '}
                        <span className="font-semibold text-gray-900">
                            {activeEnrollment.level}
                        </span>{' '}
                        · Section:{' '}
                        <span className="font-semibold text-gray-900">
                            {activeEnrollment.section || 'Unassigned'}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title={`Report Card - ${learner.full_name}`} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Learner Info Header Bar */}
                    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Learner Profile
                            </span>
                            <div className="mt-1 flex items-center gap-3 text-sm">
                                <span className="font-semibold text-gray-900">
                                    {learner.full_name}
                                </span>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600">
                                    LRN: {learner.lrn}
                                </span>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600">
                                    SY: {activeEnrollment.academic_year || 'Current'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={addSubject}
                                className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                + Add Subject
                            </button>
                            <Link
                                href={route('academic-records.index')}
                                className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Back to List
                            </Link>
                        </div>
                    </div>

                    {/* Report Card Form */}
                    <form
                        onSubmit={submit}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Subject Grades Entry
                            </h3>
                            {recentlySuccessful && (
                                <span className="text-xs font-semibold text-emerald-700">
                                    Grades saved successfully! ✓
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Subject
                                        </th>
                                        <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-24">
                                            Q1
                                        </th>
                                        <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-24">
                                            Q2
                                        </th>
                                        <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-24">
                                            Q3
                                        </th>
                                        <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-24">
                                            Q4
                                        </th>
                                        <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-900 bg-gray-100 w-24">
                                            Final
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Remarks
                                        </th>
                                        <th className="px-3 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {data.grades.map((grade, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-5 py-3">
                                                <input
                                                    type="text"
                                                    className="block w-full rounded-md border-gray-300 text-sm font-semibold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="e.g. Mathematics"
                                                    value={grade.subject}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'subject',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="block w-full rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="-"
                                                    value={grade.q1 ?? ''}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'q1',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="block w-full rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="-"
                                                    value={grade.q2 ?? ''}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'q2',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="block w-full rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="-"
                                                    value={grade.q3 ?? ''}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'q3',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="block w-full rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="-"
                                                    value={grade.q4 ?? ''}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'q4',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-3 bg-gray-50">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="block w-full rounded-md border-gray-300 bg-white text-center text-sm font-semibold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="-"
                                                    value={
                                                        grade.final_grade ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'final_grade',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-5 py-3">
                                                <input
                                                    type="text"
                                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="Optional remarks..."
                                                    value={grade.remarks ?? ''}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            index,
                                                            'remarks',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeSubject(index)
                                                    }
                                                    className="text-gray-400 hover:text-rose-600"
                                                    title="Delete subject"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {data.grades.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No subjects added. Click "+ Add Subject" to begin.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
                            <button
                                type="button"
                                onClick={addSubject}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                + Add Another Subject
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                            >
                                {processing ? 'Saving...' : 'Save Report Card'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
