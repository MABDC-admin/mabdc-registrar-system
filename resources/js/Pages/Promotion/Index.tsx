import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

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

export default function Index({
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
        'Nursery', 'Kinder', 'Kindergarten', 'Pre-School',
        'L1', 'L2', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'
    ];

    const getNextLevel = (currentLevel: string): string => {
        const idx = gradeLevels.findIndex(lvl => lvl.toLowerCase() === currentLevel.toLowerCase());
        if (idx !== -1 && idx < gradeLevels.length - 1) {
            return gradeLevels[idx + 1];
        }
        return currentLevel;
    };

    // Initialize/sync promotion data when enrollments load
    useEffect(() => {
        const initialPromo: typeof promoData = {};
        enrollments.forEach(en => {
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
        value: any
    ) => {
        setPromoData(prev => ({
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

        const promotionsPayload = enrollments.map(en => {
            const data = promoData[en.id];
            return {
                learner_id: en.learner_id,
                enrollment_id: en.id,
                current_level: en.level,
                target_level: data?.status === 'retained' ? en.level : data?.target_level || en.level,
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
        if (form.data.target_academic_year_id && form.data.promotions.length > 0) {
            form.post(route('promotions.store'), {
                onSuccess: () => {
                    alert('Batch promotion completed successfully.');
                },
            });
        }
    }, [form.data]);

    const filteredEnrollments = enrollments.filter(en => {
        const nameMatch = en.name.toLowerCase().includes(searchTerm.toLowerCase()) || en.lrn.includes(searchTerm);
        const honorsMatch = honorsFilter ? en.honors === honorsFilter : true;
        return nameMatch && honorsMatch;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 py-1">
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                        Module
                    </p>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">
                        Batch Promotion & Honors
                    </h2>
                </div>
            }
        >
            <Head title="Student Promotion" />

            <div className="py-8 bg-slate-50 min-h-[calc(100vh-81px)]">
                <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Active Year Card */}
                    {activeYear && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex justify-between items-center shadow-sm">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Current Academic Year</span>
                                <h3 className="text-lg font-bold text-emerald-950">{activeYear.name}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-700">Target Year:</label>
                                <select
                                    className="rounded-xl border-slate-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    value={targetYearId}
                                    onChange={(e) => setTargetYearId(e.target.value)}
                                >
                                    <option value="">Select Target Year...</option>
                                    {academicYears.filter(ay => ay.id !== activeYear.id).map(ay => (
                                        <option key={ay.id} value={ay.id}>{ay.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Grade Level Tabs */}
                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => router.get(route('promotions.index'), {}, { preserveState: true })}
                            className={`px-4 py-2 text-sm font-bold rounded-2xl transition border ${
                                !selectedLevel
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            All Levels
                        </button>
                        {levels.map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => router.get(route('promotions.index'), { level: lvl }, { preserveState: true })}
                                className={`px-4 py-2 text-sm font-bold rounded-2xl transition border ${
                                    selectedLevel === lvl
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>

                    {/* Filters Row */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-3 w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search by name or LRN..."
                                className="w-full sm:w-80 px-4 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <select
                                className="rounded-xl border-slate-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                value={honorsFilter}
                                onChange={(e) => setHonorsFilter(e.target.value)}
                            >
                                <option value="">All Honors Categories</option>
                                <option value="With Highest Honors">🥇 With Highest Honors (98+)</option>
                                <option value="With High Honors">🥈 With High Honors (95-97)</option>
                                <option value="With Honors">🥉 With Honors (90-94)</option>
                                <option value="None">No Honors</option>
                            </select>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={form.processing || filteredEnrollments.length === 0}
                            className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                        >
                            🚀 Execute Roll-Forward Promotion
                        </button>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Learner Name &amp; LRN</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Current Grade &amp; Section</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">GPA</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">DepEd Academic Honors</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Target Grade Level &amp; Section</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Promotion Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEnrollments.length > 0 ? (
                                    filteredEnrollments.map((en) => {
                                        const promo = promoData[en.id] || {
                                            target_level: getNextLevel(en.level),
                                            target_section_id: '',
                                            status: 'promoted',
                                            remarks: '',
                                        };
                                        const nextLevel = promo.status === 'retained' ? en.level : promo.target_level;
                                        const matchingSections = allSections.filter(sec => sec.level.toLowerCase() === nextLevel.toLowerCase());

                                        return (
                                            <tr key={en.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-slate-900">{en.name}</div>
                                                    <div className="text-xs text-slate-500">LRN: {en.lrn}</div>
                                                </td>
                                                <td className="p-4 text-sm font-semibold text-slate-600">
                                                    {en.level} - {en.section}
                                                </td>
                                                <td className="p-4 text-sm font-bold text-center text-slate-700">
                                                    {en.gpa !== null ? en.gpa : 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    {en.honors !== 'None' ? (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                            en.honors === 'With Highest Honors'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : en.honors === 'With High Honors'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}>
                                                            {en.honors === 'With Highest Honors' ? '🥇' : en.honors === 'With High Honors' ? '🥈' : '🥉'} {en.honors}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-semibold italic">No Honors</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <select
                                                            disabled={promo.status === 'retained'}
                                                            className="rounded-xl border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                                                            value={promo.target_level}
                                                            onChange={(e) => handlePromoChange(en.id, 'target_level', e.target.value)}
                                                        >
                                                            {gradeLevels.map(lvl => (
                                                                <option key={lvl} value={lvl}>{lvl}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            className="rounded-xl border-slate-200 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                                                            value={promo.target_section_id}
                                                            onChange={(e) => handlePromoChange(en.id, 'target_section_id', e.target.value)}
                                                        >
                                                            <option value="">Select Section...</option>
                                                            {matchingSections.map(sec => (
                                                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 focus:ring-emerald-500 focus:border-emerald-500"
                                                        value={promo.status}
                                                        onChange={(e) => handlePromoChange(en.id, 'status', e.target.value)}
                                                    >
                                                        <option value="promoted" className="text-emerald-600 font-bold">Promote</option>
                                                        <option value="retained" className="text-amber-600 font-bold">Retain</option>
                                                        <option value="transferred" className="text-rose-600 font-bold">Transfer Out</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-sm text-slate-500">
                                            No eligible learners found for this grade level.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
