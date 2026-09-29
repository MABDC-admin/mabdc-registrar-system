import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
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

export default function ClassesIndex({ activeYear, sections, enrollments = [] }: ClassesIndexProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');
    
    // Sync state for local optimistic updates during drag/drop
    const [localEnrollments, setLocalEnrollments] = useState<Enrollment[]>(enrollments);
    
    useEffect(() => {
        setLocalEnrollments(enrollments);
    }, [enrollments]);

    // Unique list of grade levels sorted naturally
    const levelOrder: Record<string, number> = {
        'NURSERY': 1,
        'KINDER': 2,
        'KINDERGARTEN': 2,
        'PRE-SCHOOL': 3,
        'L1': 4,       // Level 1
        'L2': 5,       // Level 2
        'G1': 11,      // Grade 1
        'G2': 12,      // Grade 2
        'G3': 13,      // Grade 3
        'G4': 14,
        'G5': 15,
        'G6': 16,
        'G7': 17,
        'G8': 18,
        'G9': 19,
        'G10': 20,
        'G11': 21,
        'G12': 22,
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
                cardBg: 'bg-[#fff0f3] hover:bg-[#ffe0e6] border-[#ffccd5] hover:border-[#ffb3c1]',
                borderLeft: 'bg-[#ff4d6d]',
                avatarBg: 'from-[#ff758f] to-[#ff4d6d]',
                hoverBorder: 'hover:border-[#ff758f]'
            };
        }
        if (g === 'male') {
            return {
                cardBg: 'bg-[#f0f9ff] hover:bg-[#e0f2fe] border-[#bae6fd] hover:border-[#7dd3fc]',
                borderLeft: 'bg-[#0284c7]',
                avatarBg: 'from-[#38bdf8] to-[#0284c7]',
                hoverBorder: 'hover:border-[#38bdf8]'
            };
        }
        return {
            cardBg: 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-350',
            borderLeft: 'bg-slate-400 group-hover:bg-slate-550',
            avatarBg: 'from-slate-500 to-slate-600',
            hoverBorder: 'hover:border-slate-350'
        };
    };

    const getSectionStyle = (session: string, isTargetOver: boolean) => {
        const s = session.toLowerCase().trim();
        if (s === 'morning') {
            return {
                container: isTargetOver 
                    ? 'border-amber-500 bg-amber-50/20 ring-4 ring-amber-500/10 scale-[1.01]' 
                    : 'border-amber-200/50 bg-amber-50/5 shadow-sm hover:shadow-md hover:border-amber-300/80',
                badge: 'bg-amber-100/70 text-amber-800 border-amber-200/50',
                headerText: 'text-amber-950',
                dropBg: 'bg-amber-50/30 border-amber-200/40',
                countBadge: 'bg-amber-100 text-amber-900 border-amber-200/50 border'
            };
        }
        if (s === 'afternoon') {
            return {
                container: isTargetOver 
                    ? 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/10 scale-[1.01]' 
                    : 'border-indigo-200/50 bg-indigo-50/5 shadow-sm hover:shadow-md hover:border-indigo-300/80',
                badge: 'bg-indigo-100/70 text-indigo-800 border-indigo-200/50',
                headerText: 'text-indigo-950',
                dropBg: 'bg-indigo-50/30 border-indigo-200/40',
                countBadge: 'bg-indigo-100 text-indigo-900 border-indigo-200/50 border'
            };
        }
        return {
            container: isTargetOver 
                ? 'border-emerald-500 bg-emerald-50/20 ring-4 ring-emerald-500/10 scale-[1.01]' 
                : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-350',
            badge: 'bg-emerald-100/70 text-emerald-850 border-emerald-200/50',
            headerText: 'text-slate-900',
            dropBg: 'bg-slate-50/50 border-slate-200/80',
            countBadge: 'bg-emerald-100 text-emerald-900 border-emerald-200/50 border'
        };
    };

    const uniqueLevels = Array.from(new Set([
        ...sections.map(s => s.level),
        ...enrollments.map(e => e.level)
    ])).filter(Boolean).sort((a, b) => getLevelPriority(a) - getLevelPriority(b));

    const [selectedLevel, setSelectedLevel] = useState<string>(uniqueLevels[0] || '');

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
            }
        });
    };

    // ── Drag and Drop Handlers ──
    const [draggedEnrollmentId, setDraggedEnrollmentId] = useState<number | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null); // 'unassigned' or 'section-{id}'

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
        
        const enrollmentIdStr = e.dataTransfer.getData('text/plain') || draggedEnrollmentId?.toString();
        if (!enrollmentIdStr) return;
        
        const enrollmentId = parseInt(enrollmentIdStr, 10);
        const enrollment = localEnrollments.find(x => x.id === enrollmentId);
        
        if (!enrollment) return;
        if (enrollment.section_id === targetSectionId) return; // Dropped on same column

        // 1. Optimistic Update (Immediate feedback in UI)
        setLocalEnrollments(prev => prev.map(x => {
            if (x.id === enrollmentId) {
                return { ...x, section_id: targetSectionId };
            }
            return x;
        }));

        // 2. Perform backend mutation
        if (targetSectionId === null) {
            // Unassign from current section
            const currentSectionId = enrollment.section_id;
            if (currentSectionId) {
                router.post(route('classes.unassign', currentSectionId), {
                    enrollment_id: enrollmentId
                }, { preserveScroll: true });
            }
        } else {
            // Assign to new section
            router.post(route('classes.assign', targetSectionId), {
                enrollment_id: enrollmentId
            }, { preserveScroll: true });
        }

        setDraggedEnrollmentId(null);
    };

    // Filtered data for the board columns and KPI calculations
    const levelSections = sections.filter(s => s.level === selectedLevel);
    const levelEnrollments = localEnrollments.filter(e => e.level === selectedLevel);
    const unassignedStudents = levelEnrollments
        .filter(e => e.section_id === null)
        .sort((a, b) => a.learner.full_name.localeCompare(b.learner.full_name));

    // Global Stats for active year
    const totalStudentsCount = localEnrollments.length;
    const sectionedCount = localEnrollments.filter(e => e.section_id !== null).length;
    const unsectionedCount = localEnrollments.filter(e => e.section_id === null).length;
    const sectioningRate = totalStudentsCount > 0 ? Math.round((sectionedCount / totalStudentsCount) * 100) : 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                            🏫 Registrar Workspace
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class & Section Management</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            {activeYear ? `Managing classes and active student sectioning for ${activeYear.name}` : 'No active academic year found.'}
                        </p>
                    </div>
                    
                    {activeYear && (
                        <div className="flex items-center gap-3">
                            {/* Toggle Controls */}
                            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-250 inline-flex items-center shadow-xs">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 rounded-md text-xs font-black transition flex items-center gap-1.5 ${
                                        viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-855'
                                    }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                                    Grid View
                                </button>
                                <button 
                                    onClick={() => setViewMode('board')}
                                    className={`px-4 py-2 rounded-md text-xs font-black transition flex items-center gap-1.5 ${
                                        viewMode === 'board' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-855'
                                    }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                                    Interactive Board
                                </button>
                            </div>

                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all"
                            >
                                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                Create Section
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Class & Section Management" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="mx-auto w-full max-w-none space-y-8">
                    
                    {/* ── Visual KPI Cards ── */}
                    {activeYear && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Card 1: Total Sections */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 rounded-2xl border border-slate-700/55 p-5 shadow-lg flex items-center justify-between group hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-550/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                                <div className="space-y-1 z-10">
                                    <span className="text-[9px] font-black text-indigo-400 block tracking-widest uppercase">Total Class Sections</span>
                                    <span className="text-3xl font-black text-white block tracking-tight">{sections.length}</span>
                                </div>
                                <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                            </div>
                            
                            {/* Card 2: Sectioned Students */}
                            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-2xl border border-emerald-800/40 p-5 shadow-lg flex items-center justify-between group hover:border-emerald-450 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                                <div className="space-y-1 z-10">
                                    <span className="text-[9px] font-black text-emerald-400 block tracking-widest uppercase">Sectioned Students</span>
                                    <span className="text-3xl font-black text-white block tracking-tight">{sectionedCount} <span className="text-xs font-medium text-emerald-300/60">/ {totalStudentsCount}</span></span>
                                </div>
                                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            </div>

                            {/* Card 3: Unsectioned Pool */}
                            <div className="bg-gradient-to-br from-rose-950 via-rose-900 to-rose-955 rounded-2xl border border-rose-800/40 p-5 shadow-lg flex items-center justify-between group hover:border-rose-500 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                                <div className="space-y-1 z-10">
                                    <span className="text-[9px] font-black text-rose-400 block tracking-widest uppercase">Unsectioned Pool</span>
                                    <span className="text-3xl font-black text-white block tracking-tight">{unsectionedCount}</span>
                                </div>
                                <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                            </div>

                            {/* Card 4: Sectioning Rate */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 rounded-2xl border border-slate-700/55 p-5 shadow-lg flex flex-col justify-between group hover:border-teal-500/50 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-5 -mt-5"></div>
                                <div className="flex justify-between items-center mb-2.5 z-10">
                                    <span className="text-[9px] font-black text-teal-400 tracking-widest uppercase">Sectioning Rate</span>
                                    <span className="text-base font-black text-white">{sectioningRate}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-450 h-full rounded-full transition-all duration-500" style={{ width: `${sectioningRate}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── GRID VIEW ── */}
                    {viewMode === 'grid' && (
                        <>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {sections.map((section) => (
                                    <Link 
                                        key={section.id} 
                                        href={route('classes.show', section.id)}
                                        className="block group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-emerald-500 hover:scale-[1.01] transition-all duration-200"
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{section.level}</p>
                                                    <h3 className="text-lg font-black text-slate-900 mt-1.5 group-hover:text-emerald-700 transition-colors">{section.name}</h3>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.8 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    section.session === 'morning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    section.session === 'afternoon' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {section.session.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="mt-6 flex items-center justify-between text-sm">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Adviser</span>
                                                    <span className="font-bold text-slate-700">{section.teacher_name || 'TBA'}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Students</span>
                                                    <span className="font-black text-emerald-600 text-lg leading-tight">{section.enrollments_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-between items-center group-hover:bg-emerald-50/50 transition-colors">
                                            <span className="text-xs font-black text-slate-500 group-hover:text-emerald-600 tracking-wider uppercase">Manage Roster &rarr;</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {sections.length === 0 && (
                                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto">
                                    <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <h3 className="text-base font-black text-slate-900">No sections found</h3>
                                    <p className="mt-1 text-sm text-slate-500">Get started by creating a new section for this academic year.</p>
                                    <div className="mt-6">
                                        <PrimaryButton onClick={() => setIsCreateModalOpen(true)}>
                                            Create Section
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── PREMIUM BOARD VIEW ── */}
                    {viewMode === 'board' && (
                        <div className="space-y-6">
                            {/* Grade Selector Row */}
                            <div className="flex items-center gap-4 pb-5 border-b border-slate-200 w-full">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex-none">Grade Level Filter:</span>
                                <div className="flex items-center gap-2 w-[80%] flex-nowrap min-w-0">
                                    {uniqueLevels.map(level => (
                                        <button 
                                            key={level}
                                            onClick={() => setSelectedLevel(level)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 text-center ${
                                                selectedLevel === level 
                                                    ? 'bg-[#002b80] text-white shadow-md scale-[1.03]' 
                                                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-350 shadow-sm'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                                {uniqueLevels.length === 0 && (
                                    <span className="text-sm font-medium text-slate-500">No student enrollments found.</span>
                                )}
                                <style dangerouslySetInnerHTML={{__html: `
                                    .custom-scroll::-webkit-scrollbar {
                                        width: 5px;
                                        height: 5px;
                                    }
                                    .custom-scroll::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                    .custom-scroll::-webkit-scrollbar-thumb {
                                        background: #cbd5e1;
                                        border-radius: 4px;
                                    }
                                    .custom-scroll::-webkit-scrollbar-thumb:hover {
                                        background: #94a3b8;
                                    }
                                `}} />
                            </div>

                            {/* Kanban Board Container */}
                            <div className="flex gap-6 overflow-x-auto pb-6 min-h-[600px] items-start custom-scroll">
                                
                                {/* 1. UNASSIGNED POOL COLUMN */}
                                <div 
                                    onDragOver={(e) => handleDragOver(e, 'unassigned')}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, null)}
                                    className={`flex-none w-[420px] bg-slate-50/70 rounded-2xl border p-5 flex flex-col max-h-[750px] transition-all duration-200 ${
                                        dragOverColumn === 'unassigned' 
                                            ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10' 
                                            : 'border-slate-200 shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/60">
                                        <div>
                                            <h3 className="font-black text-slate-800 text-sm tracking-tight">Unassigned Pool</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Movable Learners</p>
                                        </div>
                                        <span className="bg-slate-200 text-slate-700 px-3 py-0.8 rounded-full text-xs font-black">
                                    {unassignedStudents.length}
                                        </span>
                                    </div>

                                    {/* Drop Area */}
                                    <div className="flex-1 space-y-1 min-h-[300px] pr-1.5">
                                        {unassignedStudents.map(e => {
                                            const names = e.learner.full_name.split(',');
                                            const lastName = names[0]?.trim() || '';
                                            const firstNames = names[1]?.trim() || '';
                                            const initials = ((firstNames[0] || '') + (lastName[0] || '')).toUpperCase();
                                            
                                            const style = getCardStyle(e.learner.gender);

                                            return (
                                                <div 
                                                    key={e.id}
                                                    draggable
                                                    onDragStart={(evt) => handleDragStart(evt, e.id)}
                                                    className={`${style.cardBg} border py-1.5 px-3 rounded-lg cursor-grab active:cursor-grabbing transition-all select-none group relative overflow-hidden flex items-center justify-between`}
                                                >
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.borderLeft} transition-all`}></div>
                                                    
                                                    <div className="flex items-center gap-2.5 pl-1 min-w-0">
                                                        <div className={`flex-none h-6 w-6 rounded-md bg-gradient-to-br ${style.avatarBg} text-white flex items-center justify-center font-black text-[9px] shadow-sm`}>
                                                            {initials}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-black text-slate-800 tracking-tight leading-none uppercase whitespace-nowrap truncate">{e.learner.full_name}</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-slate-300 group-hover:text-emerald-500 transition-colors pr-1 flex-none">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8.5 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-10 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {unassignedStudents.length === 0 && (
                                            <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-white/50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All students sectioned!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. SECTIONS COLUMNS */}
                                {levelSections.map(section => {
                                    const sectionEnrollments = levelEnrollments
                                        .filter(e => e.section_id === section.id)
                                        .sort((a, b) => a.learner.full_name.localeCompare(b.learner.full_name));
                                    const isTargetOver = dragOverColumn === `section-${section.id}`;
                                    
                                    const style = getSectionStyle(section.session, isTargetOver);

                                    return (
                                        <div 
                                            key={section.id}
                                            onDragOver={(e) => handleDragOver(e, `section-${section.id}`)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, section.id)}
                                            className={`flex-none w-[480px] rounded-2xl border p-5 flex flex-col transition-all duration-200 relative overflow-hidden ${style.container}`}
                                        >
                                            {/* Deco: Left-side gradient ribbon */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b ${
                                                section.session === 'morning' ? 'from-amber-400 via-orange-500 to-rose-500' :
                                                section.session === 'afternoon' ? 'from-indigo-400 via-purple-500 to-fuchsia-500' :
                                                'from-emerald-400 via-teal-500 to-cyan-500'
                                            }`} />

                                            {/* Deco: Top-right corner geometric orb */}
                                            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] pointer-events-none ${
                                                section.session === 'morning' ? 'bg-amber-500' :
                                                section.session === 'afternoon' ? 'bg-indigo-500' :
                                                'bg-emerald-500'
                                            }`} />
                                            <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full opacity-[0.05] pointer-events-none border-2 ${
                                                section.session === 'morning' ? 'border-amber-400' :
                                                section.session === 'afternoon' ? 'border-indigo-400' :
                                                'border-emerald-400'
                                            }`} />

                                            {/* Deco: Bottom-left diagonal stripes */}
                                            <div className="absolute -bottom-6 -left-6 w-20 h-20 opacity-[0.04] pointer-events-none"
                                                style={{
                                                    backgroundImage: `repeating-linear-gradient(
                                                        45deg,
                                                        ${section.session === 'morning' ? '#f59e0b' : section.session === 'afternoon' ? '#6366f1' : '#10b981'},
                                                        ${section.session === 'morning' ? '#f59e0b' : section.session === 'afternoon' ? '#6366f1' : '#10b981'} 2px,
                                                        transparent 2px,
                                                        transparent 8px
                                                    )`
                                                }}
                                            />

                                            {/* Deco: Bottom-right session icon badge */}
                                            <div className={`absolute bottom-3 right-3 opacity-[0.06] pointer-events-none select-none`}>
                                                {section.session === 'morning' ? (
                                                    <svg className="w-14 h-14 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm11.394-5.834a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                                    </svg>
                                                ) : section.session === 'afternoon' ? (
                                                    <svg className="w-14 h-14 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-14 h-14 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                                                        <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                                                        <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                                                    </svg>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-150/40 relative z-10">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`font-black text-sm tracking-tight uppercase ${style.headerText}`}>Section {section.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${style.badge}`}>
                                                            {section.session}
                                                        </span>
                                                    </div>
                                                    {/* Inline Editable Teacher */}
                                                    <TeacherEditor sectionId={section.id} initialName={section.teacher_name || ''} />
                                                </div>
                                                <span className={`${style.countBadge} px-2.5 py-0.5 rounded-full text-xs font-black flex-none ml-2`}>
                                                    {sectionEnrollments.length}
                                                </span>
                                            </div>

                                            {/* Drop Area */}
                                            <div className={`flex-1 space-y-1 p-2 rounded-xl border border-dashed pr-1.5 ${style.dropBg}`}>
                                                {sectionEnrollments.map(e => {
                                                    const names = e.learner.full_name.split(',');
                                                    const lastName = names[0]?.trim() || '';
                                                    const firstNames = names[1]?.trim() || '';
                                                    const initials = ((firstNames[0] || '') + (lastName[0] || '')).toUpperCase();

                                                    const style = getCardStyle(e.learner.gender);

                                                    return (
                                                        <div 
                                                            key={e.id}
                                                            draggable
                                                            onDragStart={(evt) => handleDragStart(evt, e.id)}
                                                            className={`${style.cardBg} border p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all select-none group relative overflow-hidden flex items-center justify-between`}
                                                        >
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.borderLeft} transition-all`}></div>
                                                            
                                                            <div className="flex items-center gap-2.5 pl-1 min-w-0">
                                                                <div className={`flex-none h-6 w-6 rounded-md bg-gradient-to-br ${style.avatarBg} text-white flex items-center justify-center font-black text-[9px] shadow-sm`}>
                                                                    {initials}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[11px] font-black text-slate-800 tracking-tight leading-none uppercase whitespace-nowrap truncate">{e.learner.full_name}</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-slate-350 pr-1 flex-none">
                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M8.5 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-10 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {sectionEnrollments.length === 0 && (
                                                    <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-white/40">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drag here</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {levelSections.length === 0 && (
                                    <div className="flex-1 text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl max-w-xl mx-auto">
                                        <p className="text-sm font-bold text-slate-500">No sections created for {selectedLevel} yet.</p>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <form onSubmit={submitCreate} className="p-6">
                    <h2 className="text-lg font-black text-slate-900 mb-6">Create New Section</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <InputLabel htmlFor="level" value="Grade Level" />
                            <TextInput
                                id="level"
                                className="mt-1 block w-full"
                                value={data.level}
                                onChange={(e) => setData('level', e.target.value)}
                                placeholder="e.g. Grade 1"
                                required
                            />
                            <InputError message={errors.level} className="mt-2" />
                        </div>
                        <div className="col-span-1">
                            <InputLabel htmlFor="name" value="Section Name" />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Apollo"
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="col-span-1">
                            <InputLabel htmlFor="session" value="Session" />
                            <select
                                id="session"
                                className="mt-1 block w-full border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.session}
                                onChange={(e) => setData('session', e.target.value)}
                                required
                            >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="full_day">Full Day</option>
                            </select>
                            <InputError message={errors.session} className="mt-2" />
                        </div>

                        <div className="col-span-1">
                            <InputLabel htmlFor="teacher_name" value="Adviser / Teacher Name" />
                            <TextInput
                                id="teacher_name"
                                className="mt-1 block w-full"
                                value={data.teacher_name}
                                onChange={(e) => setData('teacher_name', e.target.value)}
                                placeholder="e.g. John Doe"
                            />
                            <InputError message={errors.teacher_name} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsCreateModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={processing}>Create Section</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

function TeacherEditor({ sectionId, initialName }: { sectionId: number; initialName: string }) {
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
            await axios.patch(`/classes/${sectionId}`, { teacher_name: name || null });
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
                    className="text-[11px] font-bold rounded-md border-slate-200 px-2 py-1 w-full focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={saving}
                />
                <button onClick={handleSave} disabled={saving} className="text-emerald-600 hover:text-emerald-800 flex-none" title="Save">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
                <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 flex-none" title="Cancel">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors group cursor-pointer"
            title="Click to edit adviser"
        >
            <svg className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="truncate max-w-[180px]">Adviser: {savedName || 'Click to assign'}</span>
        </button>
    );
}
