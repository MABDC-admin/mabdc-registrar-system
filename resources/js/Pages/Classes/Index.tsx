import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type Section = {
    id: number;
    academic_year_id: number;
    level: string;
    name: string;
    session: string;
    teacher_name: string | null;
    notes: string | null;
    enrollments_count: number;
};

type Learner = {
    id: number;
    full_name: string;
    normalized_name: string;
    gender?: string;
};

type Enrollment = {
    id: number;
    learner: Learner;
    level: string;
    section_id: number | null;
    status: string;
};

type ClassesIndexProps = {
    activeYear: ActiveYear;
    sections: Section[];
    enrollments?: Enrollment[];
};

export default function ClassesIndex({
    activeYear,
    sections,
    enrollments = [],
}: ClassesIndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');

    // Sync state for local optimistic updates during drag/drop
    const [localEnrollments, setLocalEnrollments] =
        useState<Enrollment[]>(enrollments);

    useEffect(() => {
        setLocalEnrollments(enrollments);
    }, [enrollments]);

    // Unique list of grade levels sorted naturally
    const levelOrder: Record<string, number> = {
        NURSERY: 1,
        KINDER: 2,
        KINDERGARTEN: 2,
        'PRE-SCHOOL': 3,
        L1: 4,
        L2: 5,
        G1: 11,
        G2: 12,
        G3: 13,
        G4: 14,
        G5: 15,
        G6: 16,
        G7: 17,
        G8: 18,
        G9: 19,
        G10: 20,
        G11: 21,
        G12: 22,
    };

    const getLevelPriority = (level: string) => {
        const key = level.toUpperCase().trim();
        if (levelOrder[key] !== undefined) return levelOrder[key];
        const matchL = key.match(/^L(\d+)$/);
        if (matchL) {
            return parseInt(matchL[1], 10);
        }
        const matchG = key.match(/^G(\d+)$/);
        if (matchG) {
            return 10 + parseInt(matchG[1], 10);
        }
        return 999;
    };

    const getCardStyle = (gender?: string) => {
        const g = (gender || '').toLowerCase().trim();
        if (g === 'female') {
            return {
                cardBg: 'bg-rose-50 hover:bg-rose-100/70 border-rose-200',
                borderLeft: 'bg-rose-500',
                avatarBg: 'bg-rose-500 text-white',
            };
        }
        if (g === 'male') {
            return {
                cardBg: 'bg-sky-50 hover:bg-sky-100/70 border-sky-200',
                borderLeft: 'bg-sky-600',
                avatarBg: 'bg-sky-600 text-white',
            };
        }
        return {
            cardBg: 'bg-white hover:bg-gray-50 border-gray-200',
            borderLeft: 'bg-gray-400',
            avatarBg: 'bg-gray-600 text-white',
        };
    };

    const uniqueLevels = Array.from(
        new Set([
            ...sections.map((s) => s.level),
            ...enrollments.map((e) => e.level),
        ]),
    )
        .filter(Boolean)
        .sort((a, b) => getLevelPriority(a) - getLevelPriority(b));

    const [selectedLevel, setSelectedLevel] = useState<string>(
        uniqueLevels[0] || '',
    );

    useEffect(() => {
        if (!selectedLevel && uniqueLevels.length > 0) {
            setSelectedLevel(uniqueLevels[0]);
        }
    }, [uniqueLevels, selectedLevel]);

    const { data, setData, post, processing, errors, reset } = useForm({
        academic_year_id: activeYear?.id || '',
        level: '',
        name: '',
        session: 'morning',
        teacher_name: '',
        notes: '',
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('classes.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    // Drag and Drop Handlers
    const [draggedEnrollmentId, setDraggedEnrollmentId] = useState<
        number | null
    >(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedEnrollmentId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id.toString());
    };

    const handleDragOver = (e: React.DragEvent, targetCol: string) => {
        e.preventDefault();
        setDragOverColumn(targetCol);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, targetSectionId: number | null) => {
        e.preventDefault();
        setDragOverColumn(null);

        const enrollmentIdStr =
            e.dataTransfer.getData('text/plain') ||
            draggedEnrollmentId?.toString();
        if (!enrollmentIdStr) return;

        const enrollmentId = parseInt(enrollmentIdStr, 10);
        const enrollment = localEnrollments.find((x) => x.id === enrollmentId);

        if (!enrollment) return;
        if (enrollment.section_id === targetSectionId) return;

        // Optimistic update
        setLocalEnrollments((prev) =>
            prev.map((x) => {
                if (x.id === enrollmentId) {
                    return { ...x, section_id: targetSectionId };
                }
                return x;
            }),
        );

        if (targetSectionId === null) {
            const currentSectionId = enrollment.section_id;
            if (currentSectionId) {
                router.post(
                    route('classes.unassign', currentSectionId),
                    { enrollment_id: enrollmentId },
                    { preserveScroll: true },
                );
            }
        } else {
            router.post(
                route('classes.assign', targetSectionId),
                { enrollment_id: enrollmentId },
                { preserveScroll: true },
            );
        }

        setDraggedEnrollmentId(null);
    };

    const levelSections = sections.filter((s) => s.level === selectedLevel);
    const levelEnrollments = localEnrollments.filter(
        (e) => e.level === selectedLevel,
    );
    const unassignedStudents = levelEnrollments
        .filter((e) => e.section_id === null)
        .sort((a, b) =>
            a.learner.full_name.localeCompare(b.learner.full_name),
        );

    // Global stats
    const totalStudentsCount = localEnrollments.length;
    const sectionedCount = localEnrollments.filter(
        (e) => e.section_id !== null,
    ).length;
    const unsectionedCount = localEnrollments.filter(
        (e) => e.section_id === null,
    ).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Class rosters
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Class &amp; Section Management
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500">
                            Active year:{' '}
                            <span className="font-semibold text-gray-900">
                                {activeYear?.name ?? 'Not configured'}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                            + Create Section
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Class & Section Management" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* View Controls & Stats Bar */}
                    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                                    viewMode === 'grid'
                                        ? 'bg-gray-900 text-white'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Grid View
                            </button>
                            <button
                                onClick={() => setViewMode('board')}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                                    viewMode === 'board'
                                        ? 'bg-gray-900 text-white'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Interactive Board
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600">
                            <span>
                                Total Sections:{' '}
                                <strong className="text-gray-900">
                                    {sections.length}
                                </strong>
                            </span>
                            <span>·</span>
                            <span>
                                Sectioned:{' '}
                                <strong className="text-emerald-700">
                                    {sectionedCount}
                                </strong>{' '}
                                / {totalStudentsCount}
                            </span>
                            <span>·</span>
                            <span>
                                Unassigned Pool:{' '}
                                <strong className="text-amber-800">
                                    {unsectionedCount}
                                </strong>
                            </span>
                        </div>
                    </div>

                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <section className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {sections.map((section) => (
                                    <Link
                                        key={section.id}
                                        href={route('classes.show', section.id)}
                                        className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:shadow"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    {section.level}
                                                </span>
                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold capitalize text-gray-700">
                                                    {section.session.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="mt-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-700">
                                                {section.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Adviser: {section.teacher_name || 'TBA'}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                                            <span className="font-semibold text-gray-700">
                                                {section.enrollments_count} learner(s)
                                            </span>
                                            <span className="font-semibold text-indigo-600 group-hover:text-indigo-800">
                                                Manage Roster &rarr;
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {sections.length === 0 && (
                                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        No sections found
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by creating a new class section for this academic year.
                                    </p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="mt-4 inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                                    >
                                        Create Section
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* BOARD VIEW */}
                    {viewMode === 'board' && (
                        <div className="space-y-4">
                            {/* Grade Selector Tabs */}
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-2">
                                    Level:
                                </span>
                                {uniqueLevels.map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => setSelectedLevel(lvl)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                            selectedLevel === lvl
                                                ? 'bg-gray-900 text-white'
                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>

                            {/* Kanban columns */}
                            <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
                                {/* 1. Unassigned column */}
                                <div
                                    onDragOver={(e) =>
                                        handleDragOver(e, 'unassigned')
                                    }
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, null)}
                                    className={`flex-none w-[340px] rounded-lg border bg-white p-4 shadow-sm flex flex-col max-h-[700px] transition ${
                                        dragOverColumn === 'unassigned'
                                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                Unassigned Pool
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {selectedLevel} unsectioned
                                            </p>
                                        </div>
                                        <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                            {unassignedStudents.length}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                                        {unassignedStudents.map((e) => {
                                            const style = getCardStyle(
                                                e.learner.gender,
                                            );
                                            return (
                                                <div
                                                    key={e.id}
                                                    draggable
                                                    onDragStart={(evt) =>
                                                        handleDragStart(
                                                            evt,
                                                            e.id,
                                                        )
                                                    }
                                                    className={`relative flex items-center justify-between rounded-md border p-2.5 text-xs font-medium cursor-grab active:cursor-grabbing transition shadow-xs ${style.cardBg}`}
                                                >
                                                    <span className="font-semibold text-gray-900 truncate">
                                                        {e.learner.full_name}
                                                    </span>
                                                    <span className="text-gray-400">
                                                        ⋮⋮
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {unassignedStudents.length === 0 && (
                                            <div className="py-8 text-center text-xs text-gray-400">
                                                All learners sectioned
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Section columns */}
                                {levelSections.map((section) => {
                                    const sectionEnrollments =
                                        levelEnrollments
                                            .filter(
                                                (e) =>
                                                    e.section_id === section.id,
                                            )
                                            .sort((a, b) =>
                                                a.learner.full_name.localeCompare(
                                                    b.learner.full_name,
                                                ),
                                            );
                                    const isTargetOver =
                                        dragOverColumn ===
                                        `section-${section.id}`;

                                    return (
                                        <div
                                            key={section.id}
                                            onDragOver={(e) =>
                                                handleDragOver(
                                                    e,
                                                    `section-${section.id}`,
                                                )
                                            }
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) =>
                                                handleDrop(e, section.id)
                                            }
                                            className={`flex-none w-[340px] rounded-lg border bg-white p-4 shadow-sm flex flex-col max-h-[700px] transition ${
                                                isTargetOver
                                                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <div className="border-b border-gray-200 pb-3 mb-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        {section.name}
                                                    </h3>
                                                    <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                                        {sectionEnrollments.length}
                                                    </span>
                                                </div>
                                                <TeacherEditor
                                                    sectionId={section.id}
                                                    initialName={
                                                        section.teacher_name || ''
                                                    }
                                                />
                                            </div>

                                            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                                                {sectionEnrollments.map((e) => {
                                                    const style = getCardStyle(
                                                        e.learner.gender,
                                                    );
                                                    return (
                                                        <div
                                                            key={e.id}
                                                            draggable
                                                            onDragStart={(
                                                                evt,
                                                            ) =>
                                                                handleDragStart(
                                                                    evt,
                                                                    e.id,
                                                                )
                                                            }
                                                            className={`relative flex items-center justify-between rounded-md border p-2.5 text-xs font-medium cursor-grab active:cursor-grabbing transition shadow-xs ${style.cardBg}`}
                                                        >
                                                            <span className="font-semibold text-gray-900 truncate">
                                                                {
                                                                    e.learner
                                                                        .full_name
                                                                }
                                                            </span>
                                                            <span className="text-gray-400">
                                                                ⋮⋮
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {sectionEnrollments.length ===
                                                    0 && (
                                                    <div className="py-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-md">
                                                        Drop learners here
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Section Modal */}
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            >
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Create New Class Section
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="level" value="Grade Level" />
                            <TextInput
                                id="level"
                                className="mt-1 block w-full text-sm"
                                value={data.level}
                                onChange={(e) =>
                                    setData('level', e.target.value)
                                }
                                placeholder="e.g. Grade 1"
                                required
                            />
                            <InputError
                                message={errors.level}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="name" value="Section Name" />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full text-sm"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Diamond"
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="session" value="Session" />
                            <select
                                id="session"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.session}
                                onChange={(e) =>
                                    setData('session', e.target.value)
                                }
                                required
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="full_day">Full Day</option>
                            </select>
                            <InputError
                                message={errors.session}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="teacher_name"
                                value="Adviser Name"
                            />
                            <TextInput
                                id="teacher_name"
                                className="mt-1 block w-full text-sm"
                                value={data.teacher_name}
                                onChange={(e) =>
                                    setData('teacher_name', e.target.value)
                                }
                                placeholder="e.g. Maria Santos"
                            />
                            <InputError
                                message={errors.teacher_name}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancel
                        </SecondaryButton>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                            Create Section
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

function TeacherEditor({
    sectionId,
    initialName,
}: {
    sectionId: number;
    initialName: string;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [savedName, setSavedName] = useState(initialName);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.patch(`/classes/${sectionId}`, {
                teacher_name: name || null,
            });
            setSavedName(name);
            setIsEditing(false);
        } catch {
            setName(savedName);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setName(savedName);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1.5 mt-1.5">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter adviser name..."
                    className="text-xs rounded-md border-gray-300 px-2 py-1 w-full focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={saving}
                />
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                    Save
                </button>
                <button
                    onClick={handleCancel}
                    className="text-xs text-gray-500 hover:text-gray-700"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="mt-1 text-xs text-gray-500 hover:text-indigo-600 text-left block truncate"
        >
            Adviser: <span className="font-medium text-gray-700">{savedName || 'Click to assign'}</span>
        </button>
    );
}
