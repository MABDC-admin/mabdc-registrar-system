import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type AcademicYear = {
    id: number;
    name: string;
    is_active: boolean;
};

type EnrollmentRow = {
    id: number;
    learner_id: number;
    lrn: string;
    name: string;
    gender?: string;
    level: string;
    section: string;
    gpa: number | null;
    honors: string;
    status: string;
};

type Section = {
    id: number;
    name: string;
    level: string;
};

type PromotionIndexProps = {
    activeYear: AcademicYear | null;
    academicYears: AcademicYear[];
    enrollments: EnrollmentRow[];
    levels: string[];
    allSections: Section[];
    selectedLevel: string;
};

export default function PromotionIndex({
    activeYear,
    academicYears,
    enrollments,
    levels,
    allSections,
    selectedLevel,
}: PromotionIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [honorsFilter, setHonorsFilter] = useState('');
    const [targetYearId, setTargetYearId] = useState('');
    const [promoData, setPromoData] = useState<
        Record<
            number,
            {
                target_level: string;
                target_section_id: string;
                status: 'promoted' | 'retained' | 'transferred';
                remarks: string;
            }
        >
    >({});

    const gradeLevels = [
        'Nursery',
        'Kinder',
        'Kindergarten',
        'Pre-School',
        'L1',
        'L2',
        'G1',
        'G2',
        'G3',
        'G4',
        'G5',
        'G6',
        'G7',
        'G8',
        'G9',
        'G10',
        'G11',
        'G12',
    ];

    const getNextLevel = (currentLevel: string): string => {
        const idx = gradeLevels.findIndex(
            (lvl) => lvl.toLowerCase() === currentLevel.toLowerCase(),
        );
        if (idx !== -1 && idx < gradeLevels.length - 1) {
            return gradeLevels[idx + 1];
        }
        return currentLevel;
    };

    // Initialize/sync promotion data when enrollments load
    useEffect(() => {
        const initialPromo: typeof promoData = {};
        enrollments.forEach((en) => {
            initialPromo[en.id] = {
                target_level: getNextLevel(en.level),
                target_section_id: '',
                status: 'promoted',
                remarks: '',
            };
        });
        setPromoData(initialPromo);
    }, [enrollments]);

    const handlePromoChange = (
        enrollmentId: number,
        field: keyof (typeof promoData)[number],
        value: any,
    ) => {
        setPromoData((prev) => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                [field]: value,
            },
        }));
    };

    const form = useForm({
        target_academic_year_id: '',
        promotions: [] as any[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetYearId) {
            alert('Please select a target Academic Year first.');
            return;
        }

        const promotionsPayload = enrollments.map((en) => {
            const data = promoData[en.id];
            return {
                learner_id: en.learner_id,
                enrollment_id: en.id,
                current_level: en.level,
                target_level:
                    data?.status === 'retained'
                        ? en.level
                        : data?.target_level || en.level,
                target_section_id: data?.target_section_id || null,
                status: data?.status || 'promoted',
                remarks: data?.remarks || '',
            };
        });

        form.setData({
            target_academic_year_id: targetYearId,
            promotions: promotionsPayload,
        });
    };

    // React to form data setting changes to auto-submit
    useEffect(() => {
        if (
            form.data.target_academic_year_id &&
            form.data.promotions.length > 0
        ) {
            form.post(route('promotions.store'), {
                onSuccess: () => {
                    alert('Batch promotion completed successfully.');
                },
            });
        }
    }, [form.data]);

    const filteredEnrollments = enrollments.filter((en) => {
        const nameMatch =
            en.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            en.lrn.includes(searchTerm);
        const honorsMatch = honorsFilter ? en.honors === honorsFilter : true;
        return nameMatch && honorsMatch;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Academic advancement
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Batch Promotion &amp; Honors
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
            <Head title="Batch Promotion & Honors" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Target Year & Action Header */}
                    <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                Target Academic Year Configuration
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Select the target school year to roll forward student levels and sections.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            <label className="block sm:w-60">
                                <span className="sr-only">Target Year</span>
                                <select
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={targetYearId}
                                    onChange={(e) =>
                                        setTargetYearId(e.target.value)
                                    }
                                >
                                    <option value="">Select Target Year...</option>
                                    {academicYears
                                        .filter((ay) => ay.id !== activeYear?.id)
                                        .map((ay) => (
                                            <option key={ay.id} value={ay.id}>
                                                {ay.name}
                                            </option>
                                        ))}
                                </select>
                            </label>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={
                                    form.processing ||
                                    filteredEnrollments.length === 0 ||
                                    !targetYearId
                                }
                                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {form.processing ? 'Processing...' : 'Execute Promotion'}
                            </button>
                        </div>
                    </div>

                    {/* Filter & Level Tabs */}
                    <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px_220px]">
                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Search Learner
                            </span>
                            <input
                                type="text"
                                placeholder="Name or LRN"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Level
                            </span>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={selectedLevel || ''}
                                onChange={(e) => {
                                    router.get(
                                        route('promotions.index'),
                                        e.target.value
                                            ? { level: e.target.value }
                                            : {},
                                        { preserveState: true },
                                    );
                                }}
                            >
                                <option value="">All levels</option>
                                {levels.map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Honors Filter
                            </span>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={honorsFilter}
                                onChange={(e) =>
                                    setHonorsFilter(e.target.value)
                                }
                            >
                                <option value="">All categories</option>
                                <option value="With Highest Honors">
                                    With Highest Honors (98+)
                                </option>
                                <option value="With High Honors">
                                    With High Honors (95-97)
                                </option>
                                <option value="With Honors">
                                    With Honors (90-94)
                                </option>
                                <option value="None">No Honors</option>
                            </select>
                        </label>
                    </div>

                    {/* Data Table */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Eligible Learners for Promotion
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Showing {filteredEnrollments.length} candidate record(s)
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <HeaderCell>Learner</HeaderCell>
                                        <HeaderCell>Current Section</HeaderCell>
                                        <HeaderCell>GPA</HeaderCell>
                                        <HeaderCell>Honors</HeaderCell>
                                        <HeaderCell>Target Level &amp; Section</HeaderCell>
                                        <HeaderCell>Action</HeaderCell>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredEnrollments.map((en) => {
                                        const promo = promoData[en.id] || {
                                            target_level: getNextLevel(
                                                en.level,
                                            ),
                                            target_section_id: '',
                                            status: 'promoted',
                                            remarks: '',
                                        };
                                        const nextLevel =
                                            promo.status === 'retained'
                                                ? en.level
                                                : promo.target_level;
                                        const matchingSections =
                                            allSections.filter(
                                                (sec) =>
                                                    sec.level.toLowerCase() ===
                                                    nextLevel.toLowerCase(),
                                            );

                                        return (
                                            <tr
                                                key={en.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <div className="font-semibold text-gray-900">
                                                        {en.name}
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        LRN {en.lrn}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                                                    <span className="font-semibold text-gray-900">
                                                        {en.level}
                                                    </span>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {en.section || 'Unassigned'}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                                                    {en.gpa !== null
                                                        ? en.gpa
                                                        : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    {en.honors !== 'None' ? (
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                                                                en.honors ===
                                                                'With Highest Honors'
                                                                    ? 'bg-amber-50 text-amber-800'
                                                                    : en.honors ===
                                                                      'With High Honors'
                                                                    ? 'bg-blue-50 text-blue-800'
                                                                    : 'bg-emerald-50 text-emerald-800'
                                                            }`}
                                                        >
                                                            {en.honors}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            No Honors
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            disabled={
                                                                promo.status ===
                                                                'retained'
                                                            }
                                                            className="rounded-md border-gray-300 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                                                            value={
                                                                promo.target_level
                                                            }
                                                            onChange={(e) =>
                                                                handlePromoChange(
                                                                    en.id,
                                                                    'target_level',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            {gradeLevels.map(
                                                                (lvl) => (
                                                                    <option
                                                                        key={lvl}
                                                                        value={
                                                                            lvl
                                                                        }
                                                                    >
                                                                        {lvl}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        <select
                                                            className="rounded-md border-gray-300 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                            value={
                                                                promo.target_section_id
                                                            }
                                                            onChange={(e) =>
                                                                handlePromoChange(
                                                                    en.id,
                                                                    'target_section_id',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Select Section...
                                                            </option>
                                                            {matchingSections.map(
                                                                (sec) => (
                                                                    <option
                                                                        key={
                                                                            sec.id
                                                                        }
                                                                        value={
                                                                            sec.id
                                                                        }
                                                                    >
                                                                        {
                                                                            sec.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <select
                                                        className="rounded-md border-gray-300 text-xs font-semibold text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        value={promo.status}
                                                        onChange={(e) =>
                                                            handlePromoChange(
                                                                en.id,
                                                                'status',
                                                                e.target
                                                                    .value,
                                                            )
                                                        }
                                                    >
                                                        <option value="promoted">
                                                            Promote
                                                        </option>
                                                        <option value="retained">
                                                            Retain
                                                        </option>
                                                        <option value="transferred">
                                                            Transfer Out
                                                        </option>
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredEnrollments.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-5 py-10 text-center text-sm text-gray-500"
                                            >
                                                No eligible learners found for this grade level or filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
