import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useRef } from 'react';
import axios from 'axios';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type EnrollmentSummary = {
    id: number;
    level: string;
    status: string;
    academic_year: string | null;
} | null;

type DocumentSummary = {
    ok: number;
    missing: number;
    expired: number;
    pending_review: number;
    total: number;
};

type DocumentRequirement = {
    id: number;
    document_type: string;
    label: string;
    status: string;
    verified_at: string | null;
    expires_on: string | null;
    notes: string | null;
    metadata?: {
        file_path?: string;
        file_name?: string;
        mime_type?: string;
    } | null;
};

const documentStatuses = [
    { value: 'submitted', label: 'Submitted' },
    { value: 'pending_verification', label: 'Pending verification' },
    { value: 'verified', label: 'Verified' },
    { value: 'missing', label: 'Missing' },
    { value: 'not_applicable', label: 'Not applicable' },
];

type LearnerProfile = {
    id: number;
    lrn: string | null;
    full_name: string;
    photo_url?: string | null;
    birth_date: string | null;
    gender: string | null;
    mother_contact_number: string | null;
    mother_maiden_name: string | null;
    father_contact_number: string | null;
    father_name: string | null;
    philippine_address: string | null;
    uae_address: string | null;
    previous_school: string | null;
    current_enrollment: EnrollmentSummary;
    document_summary: DocumentSummary;
    document_requirements: DocumentRequirement[];
    metadata: {
        preferred_name?: string;
        nationality?: string;
        place_of_birth?: string;
        enrollment_type?: string;
        date_admitted?: string;
        mother?: {
            email?: string;
            occupation?: string;
            employer?: string;
            relationship?: string;
            authorized_pickup?: boolean;
        };
        father?: {
            email?: string;
            occupation?: string;
            employer?: string;
            authorized_pickup?: boolean;
        };
        primary_guardian?: {
            full_name?: string;
            relationship?: string;
            primary_contact?: string;
            alternate_contact?: string;
            email?: string;
            lives_with_learner?: boolean;
        };
        emergency_contact?: {
            name?: string;
            relationship?: string;
            primary_phone?: string;
            alternate_phone?: string;
            pickup_authorization?: boolean;
            preferred_hospital?: string;
        };
        academic?: {
            program?: string;
            section?: string;
            adviser?: string;
            session?: string;
            classroom?: string;
            curriculum?: string;
            previous_level_completed?: string;
            date_of_transfer?: string;
            general_remarks?: string;
            promotion_status?: string;
        };
        contact_preferences?: {
            primary_mobile?: string;
            whatsapp_number?: string;
            primary_email?: string;
            preferred_contact_person?: string;
            preferred_communication_method?: string;
            language?: string;
            announcements_permission?: boolean;
            portal_status?: string;
        };
        access?: {
            facial_id?: string;
            rfid?: string;
            authorized_pickup_persons?: string;
            transportation_arrangement?: string;
        };
        audit?: {
            created_at?: string;
            created_by?: string;
            last_updated?: string;
            updated_by?: string;
            last_verification_date?: string;
            completeness_percentage?: number;
            archived?: boolean;
        };
    } | null;
};

type Props = {
    activeYear: ActiveYear;
    learner: LearnerProfile;
};

type TabName = 'Overview' | 'Personal Details' | 'Family and Guardians' | 'Academic Information' | 'Enrollment Requirements' | 'Attendance' | 'Documents' | 'Assessments' | 'Activities and Clubs' | 'Notes and History';

export default function LearnersShow({ activeYear, learner }: Props) {
    const [activeTab, setActiveTab] = useState<TabName>('Overview');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const initials = learner.full_name
        .split(/[\s,]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.slice(0, 1).toUpperCase())
        .join('');

    const totalRequirements = learner.document_requirements.length;
    const verifiedRequirements = learner.document_requirements.filter(d => d.status === 'verified').length;
    const compliancePercent = totalRequirements > 0 ? Math.round((verifiedRequirements / totalRequirements) * 100) : 0;
    
    // Status color mapping for the banner
    const enrollmentStatus = learner.current_enrollment?.status ?? 'Unknown';
    const isEnrolled = enrollmentStatus.toLowerCase() === 'enrolled' || enrollmentStatus.toLowerCase() === 'active';

    const tabs: TabName[] = [
        'Overview', 'Personal Details', 'Family and Guardians', 'Academic Information', 
        'Enrollment Requirements', 'Attendance', 'Documents', 'Assessments', 
        'Activities and Clubs', 'Notes and History'
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center text-xs font-semibold text-slate-500 gap-2">
                    <Link href={route('dashboard')} className="hover:text-slate-900 transition-colors">Home</Link>
                    <span>/</span>
                    <Link href={route('learners.index')} className="hover:text-slate-900 transition-colors">Learners</Link>
                    <span>/</span>
                    <span className="text-slate-900">{learner.full_name}</span>
                </div>
            }
        >
            <Head title={`Learner: ${learner.full_name}`} />

            <div className="bg-slate-50 min-h-[calc(100vh-81px)]">
                {/* Top Banner */}
                <div className="bg-emerald-900 text-white px-4 py-8 sm:px-6 lg:px-8">
                    <div className="w-full flex flex-col md:flex-row md:items-start justify-between gap-6">
                        {/* Avatar & Info */}
                        <div className="flex items-start gap-5">
                            {/* Avatar */}
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-800 border border-emerald-700/50 shadow-inner overflow-hidden">
                                {learner.photo_url ? (
                                    <img src={learner.photo_url} alt={learner.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold tracking-widest text-emerald-200">{initials}</span>
                                )}
                            </div>
                            
                            {/* Profile Header */}
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold tracking-tight">{learner.full_name}</h1>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isEnrolled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            {isEnrolled ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <circle cx="12" cy="12" r="10" />}
                                        </svg>
                                        {enrollmentStatus}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded-md">ID: {learner.id}</span>
                                </div>
                                <p className="mt-1 flex items-center gap-2 text-sm text-emerald-100/70 font-medium">
                                    <span>LRN-{learner.lrn ?? 'Pending'}</span>
                                    <span>&middot;</span>
                                    <span>{learner.current_enrollment?.level ?? 'No Grade Level'} {learner.metadata?.academic?.section ? ` - ${learner.metadata.academic.section}` : ''}</span>
                                    <span>&middot;</span>
                                    <span>{learner.metadata?.academic?.program ?? 'Regular Program'}</span>
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-emerald-100/80 font-medium">
                                    <span className="flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {learner.uae_address ?? 'No UAE Address'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsEditModalOpen(true)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-bold text-amber-950 transition hover:bg-amber-300">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
                    <div className="w-full px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
                        <nav className="flex space-x-6 min-w-max" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition-colors ${
                                        activeTab === tab
                                            ? 'border-emerald-500 text-emerald-600'
                                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="w-full px-4 py-8 sm:px-6 lg:px-8 max-w-none mx-auto">
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Column 1 */}
                            <div className="lg:col-span-8 space-y-6">
                                <Widget title="Quick Profile summary" icon={<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Age" value={learner.birth_date ? `${new Date().getFullYear() - new Date(learner.birth_date).getFullYear()} years old` : 'Not recorded'} />
                                        <DetailRow label="Primary Contact" value={learner.metadata?.contact_preferences?.preferred_contact_person ?? 'Not set'} />
                                        <DetailRow label="Primary Phone" value={learner.metadata?.contact_preferences?.primary_mobile ?? 'Not set'} />
                                    </dl>
                                </Widget>
                            </div>

                            {/* Column 2 */}
                            <div className="lg:col-span-4 space-y-6">
                                <Widget title="Enrollment Checklist" icon={<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}>
                                    <div className="text-center py-4">
                                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-8 border-emerald-100 mb-4">
                                            <span className="text-2xl font-black text-emerald-600">{compliancePercent}%</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">{verifiedRequirements} of {totalRequirements} requirements verified</p>
                                    </div>
                                    <button onClick={() => setActiveTab('Enrollment Requirements')} className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                                        Review Requirements
                                    </button>
                                </Widget>
                            </div>
                        </div>
                    )}

                    {/* TAB: PERSONAL DETAILS */}
                    {activeTab === 'Personal Details' && (
                        <div className="space-y-6">
                            <Widget title="Identity Information">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Full legal name" value={learner.full_name} />
                                        <DetailRow label="Preferred name/nickname" value={learner.metadata?.preferred_name ?? 'Not recorded'} />
                                        <DetailRow label="Internal Learner ID" value={learner.id.toString()} />
                                        <DetailRow label="LRN" value={learner.lrn ?? 'Not recorded'} />
                                    </dl>
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Date of birth" value={learner.birth_date ?? 'Not recorded'} />
                                        <DetailRow label="Place of birth" value={learner.metadata?.place_of_birth ?? 'Not recorded'} />
                                        <DetailRow label="Gender" value={learner.gender === 'M' ? 'Male' : (learner.gender === 'F' ? 'Female' : 'Not recorded')} />
                                        <DetailRow label="Nationality" value={learner.metadata?.nationality ?? 'Not recorded'} />
                                    </dl>
                                </div>
                            </Widget>
                            <Widget title="Addresses">
                                <dl className="divide-y divide-slate-100 text-sm">
                                    <DetailRow label="UAE Address" value={learner.uae_address ?? 'Not recorded'} />
                                    <DetailRow label="Philippine Address" value={learner.philippine_address ?? 'Not recorded'} />
                                </dl>
                            </Widget>
                            <Widget title="Contact & Communication Preferences">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Primary mobile number" value={learner.metadata?.contact_preferences?.primary_mobile ?? 'Not recorded'} />
                                        <DetailRow label="WhatsApp number" value={learner.metadata?.contact_preferences?.whatsapp_number ?? 'Not recorded'} />
                                        <DetailRow label="Primary email address" value={learner.metadata?.contact_preferences?.primary_email ?? 'Not recorded'} />
                                    </dl>
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Preferred contact person" value={learner.metadata?.contact_preferences?.preferred_contact_person ?? 'Not recorded'} />
                                        <DetailRow label="Preferred communication method" value={learner.metadata?.contact_preferences?.preferred_communication_method ?? 'Not recorded'} />
                                        <DetailRow label="Language used for communication" value={learner.metadata?.contact_preferences?.language ?? 'Not recorded'} />
                                        <DetailRow label="Permission to receive school announcements" value={learner.metadata?.contact_preferences?.announcements_permission ? 'Yes' : 'No'} />
                                    </dl>
                                </div>
                            </Widget>
                        </div>
                    )}

                    {/* TAB: FAMILY AND GUARDIANS */}
                    {activeTab === 'Family and Guardians' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Widget title="Mother's Information">
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Full name" value={learner.mother_maiden_name ?? 'Not recorded'} />
                                        <DetailRow label="Mobile number" value={learner.mother_contact_number ?? 'Not recorded'} />
                                        <DetailRow label="Email address" value={learner.metadata?.mother?.email ?? 'Not recorded'} />
                                        <DetailRow label="Occupation" value={learner.metadata?.mother?.occupation ?? 'Not recorded'} />
                                        <DetailRow label="Employer" value={learner.metadata?.mother?.employer ?? 'Not recorded'} />
                                        <DetailRow label="Authorized for pickup" value={learner.metadata?.mother?.authorized_pickup ? 'Yes' : 'No'} />
                                    </dl>
                                </Widget>
                                <Widget title="Father's Information">
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Full name" value={learner.father_name ?? 'Not recorded'} />
                                        <DetailRow label="Mobile number" value={learner.father_contact_number ?? 'Not recorded'} />
                                        <DetailRow label="Email address" value={learner.metadata?.father?.email ?? 'Not recorded'} />
                                        <DetailRow label="Occupation" value={learner.metadata?.father?.occupation ?? 'Not recorded'} />
                                        <DetailRow label="Employer" value={learner.metadata?.father?.employer ?? 'Not recorded'} />
                                        <DetailRow label="Authorized for pickup" value={learner.metadata?.father?.authorized_pickup ? 'Yes' : 'No'} />
                                    </dl>
                                </Widget>
                            </div>
                            <Widget title="Primary Guardian">
                                <dl className="divide-y divide-slate-100 text-sm">
                                    <DetailRow label="Full name" value={learner.metadata?.primary_guardian?.full_name ?? 'Not recorded'} />
                                    <DetailRow label="Relationship" value={learner.metadata?.primary_guardian?.relationship ?? 'Not recorded'} />
                                    <DetailRow label="Primary contact number" value={learner.metadata?.primary_guardian?.primary_contact ?? 'Not recorded'} />
                                    <DetailRow label="Email address" value={learner.metadata?.primary_guardian?.email ?? 'Not recorded'} />
                                    <DetailRow label="Lives with learner" value={learner.metadata?.primary_guardian?.lives_with_learner ? 'Yes' : 'No'} />
                                </dl>
                            </Widget>
                            <Widget title="Emergency Contact">
                                <dl className="divide-y divide-slate-100 text-sm">
                                    <DetailRow label="Emergency contact person" value={learner.metadata?.emergency_contact?.name ?? 'Not recorded'} />
                                    <DetailRow label="Relationship to learner" value={learner.metadata?.emergency_contact?.relationship ?? 'Not recorded'} />
                                    <DetailRow label="Primary phone number" value={learner.metadata?.emergency_contact?.primary_phone ?? 'Not recorded'} />
                                    <DetailRow label="Pickup authorization" value={learner.metadata?.emergency_contact?.pickup_authorization ? 'Yes' : 'No'} />
                                    <DetailRow label="Preferred hospital or clinic" value={learner.metadata?.emergency_contact?.preferred_hospital ?? 'Not recorded'} />
                                </dl>
                            </Widget>
                        </div>
                    )}

                    {/* TAB: ACADEMIC INFORMATION */}
                    {activeTab === 'Academic Information' && (
                        <div className="space-y-6">
                            <Widget title="Current Enrollment Details">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Enrollment type" value={learner.metadata?.enrollment_type ?? 'New'} />
                                        <DetailRow label="Date admitted" value={learner.metadata?.date_admitted ?? 'Not recorded'} />
                                        <DetailRow label="Academic year" value={activeYear?.name ?? 'Not recorded'} />
                                        <DetailRow label="Learner status" value={learner.current_enrollment?.status ?? 'Unknown'} />
                                    </dl>
                                    <dl className="divide-y divide-slate-100 text-sm">
                                        <DetailRow label="Program" value={learner.metadata?.academic?.program ?? 'Regular'} />
                                        <DetailRow label="Current level" value={learner.current_enrollment?.level ?? 'Unassigned'} />
                                        <DetailRow label="Section" value={learner.metadata?.academic?.section ?? 'Unassigned'} />
                                        <DetailRow label="Adviser or facilitator" value={learner.metadata?.academic?.adviser ?? 'Not recorded'} />
                                        <DetailRow label="Session" value={learner.metadata?.academic?.session ?? 'Not recorded'} />
                                        <DetailRow label="Classroom" value={learner.metadata?.academic?.classroom ?? 'Not recorded'} />
                                        <DetailRow label="Curriculum or learning track" value={learner.metadata?.academic?.curriculum ?? 'Not recorded'} />
                                    </dl>
                                </div>
                            </Widget>
                            <Widget title="Academic History">
                                <dl className="divide-y divide-slate-100 text-sm">
                                    <DetailRow label="Previous level completed" value={learner.metadata?.academic?.previous_level_completed ?? 'Not recorded'} />
                                    <DetailRow label="Previous school" value={learner.previous_school ?? 'Not recorded'} />
                                    <DetailRow label="Date of transfer" value={learner.metadata?.academic?.date_of_transfer ?? 'Not recorded'} />
                                    <DetailRow label="Promotion or retention status" value={learner.metadata?.academic?.promotion_status ?? 'Not recorded'} />
                                    <DetailRow label="General remarks" value={learner.metadata?.academic?.general_remarks ?? 'None'} />
                                </dl>
                            </Widget>
                        </div>
                    )}

                    {/* TAB: ENROLLMENT REQUIREMENTS */}
                    {activeTab === 'Enrollment Requirements' && (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-900">
                                    Document Requirements Checklist
                                </h3>
                                <span className="text-sm font-bold text-slate-500">
                                    {verifiedRequirements} of {totalRequirements} Verified ({compliancePercent}%)
                                </span>
                            </div>
                            
                            <div className="divide-y divide-slate-100 p-2">
                                {learner.document_requirements.length > 0 ? (
                                    learner.document_requirements.map((document) => (
                                        <DocumentRequirementForm
                                            key={document.id}
                                            learnerId={learner.id}
                                            document={document}
                                        />
                                    ))
                                ) : (
                                    <p className="p-8 text-center text-sm text-slate-500">No document requirements found for this enrollment.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* UNDER CONSTRUCTION TABS */}
                    {['Attendance', 'Documents', 'Assessments', 'Activities and Clubs', 'Notes and History'].includes(activeTab) && (
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-16 text-center">
                            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{activeTab} module</h3>
                            <p className="text-slate-500">This section is currently under construction and will be available in the next release.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <EditProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                learner={learner} 
            />
        </AuthenticatedLayout>
    );
}

function Widget({ title, icon, children }: { title: string, icon?: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    {icon}
                    {title}
                </h3>
            </div>
            <div className="p-6 flex-1">
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-3.5">
            <dt className="text-slate-500 font-medium">{label}</dt>
            <dd className="text-slate-900 font-bold text-right max-w-[60%] truncate" title={value}>{value}</dd>
        </div>
    );
}

function DocumentRequirementForm({ learnerId, document }: { learnerId: number; document: DocumentRequirement; }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [aiResult, setAiResult] = useState<{
        document_type?: string;
        match_status?: boolean;
        student_name_on_document?: string;
        expires_on?: string | null;
        notes?: string;
    } | null>(null);

    const { data, setData, post, patch, processing, errors, isDirty } = useForm({
        status: document.status,
        expires_on: document.expires_on ?? '',
        notes: document.notes ?? '',
        file: null as File | null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setData('file', file);

        // Auto-run AI Analysis if it is an image
        if (file.type.startsWith('image/')) {
            setAnalyzing(true);
            setAiResult(null);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(
                    route('learners.documents.analyze', [learnerId, document.id]),
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                
                const result = response.data;
                setAiResult(result);
                
                // If match is found, propose values to form
                if (result.match_status) {
                    setData((old) => ({
                        ...old,
                        expires_on: result.expires_on || '',
                        status: 'verified',
                        notes: result.notes || '',
                    }));
                } else {
                    setData('notes', `AI WARNING: Name on document (${result.student_name_on_document}) may not match student.`);
                }
            } catch (err) {
                console.error(err);
                alert('AI OCR Analysis failed. You can still upload the file manually.');
            } finally {
                setAnalyzing(false);
            }
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        
        if (selectedFile) {
            // Use POST multipart upload route if a file is present
            post(route('learners.documents.upload', [learnerId, document.id]), {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedFile(null);
                    setAiResult(null);
                }
            });
        } else {
            // Standard update patch
            patch(route('learners.documents.update', [learnerId, document.id]), {
                preserveScroll: true
            });
        }
    };

    const statusAccentBorder = {
        verified: 'border-l-emerald-500',
        submitted: 'border-l-blue-400',
        pending_verification: 'border-l-amber-400',
        missing: 'border-l-rose-500',
        not_applicable: 'border-l-slate-400',
    }[document.status] || 'border-l-slate-300';

    return (
        <div className="flex flex-col gap-2">
            <form
                onSubmit={submit}
                className={`border-l-4 py-3 px-4 grid gap-4 ${statusAccentBorder} md:grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_auto] items-center text-sm hover:bg-slate-50/50 transition-colors`}
            >
                <div className="min-w-0">
                    <p className="font-bold text-slate-800 leading-tight truncate" title={document.label}>
                        {document.label}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                        <StatusBadge status={document.status} />
                        {document.metadata?.file_path && (
                            <a
                                href={`/storage/${document.metadata.file_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-0.5"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View File
                            </a>
                        )}
                    </div>
                </div>

                <div className="min-w-0">
                    <select
                        value={data.status}
                        onChange={(event) => setData('status', event.target.value)}
                        className="block w-full rounded-md border-slate-200 bg-white py-1.5 px-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                    >
                        {documentStatuses.map((status) => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                </div>

                <div className="min-w-0">
                    <input
                        type="date"
                        value={data.expires_on}
                        onChange={(event) => setData('expires_on', event.target.value)}
                        className="block w-full rounded-md border-slate-200 bg-white py-1.5 px-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                </div>

                <div className="min-w-0">
                    <input
                        type="text"
                        value={data.notes}
                        onChange={(event) => setData('notes', event.target.value)}
                        placeholder="Remarks..."
                        className="block w-full rounded-md border-slate-200 bg-white py-1.5 px-2.5 text-xs font-bold text-slate-800 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 placeholder:text-slate-300"
                    />
                </div>

                {/* Upload File Input */}
                <div className="min-w-0 flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={analyzing}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${
                            selectedFile
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {selectedFile ? 'Change File' : 'Upload'}
                    </button>
                    {selectedFile && (
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]" title={selectedFile.name}>
                            {selectedFile.name}
                        </span>
                    )}
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={processing || (!isDirty && !selectedFile) || analyzing}
                        className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
                    >
                        Save
                    </button>
                </div>
            </form>

            {/* AI Review Banner */}
            {analyzing && (
                <div className="mx-4 mb-2 p-3 bg-slate-50 border border-slate-150 rounded-lg flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
                    <svg className="w-4 h-4 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Gemini AI is doing OCR & verifying details...</span>
                </div>
            )}

            {aiResult && (
                <div className={`mx-4 mb-2 p-3 border rounded-lg text-xs leading-relaxed ${
                    aiResult.match_status
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50/60 border-rose-200 text-rose-800'
                }`}>
                    <div className="flex items-center gap-1.5 font-black mb-1">
                        {aiResult.match_status ? (
                            <>
                                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>AI MATCH SUCCESSFUL</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>AI VERIFICATION ALERT</span>
                            </>
                        )}
                    </div>
                    <p className="font-semibold">{aiResult.notes}</p>
                    <div className="flex gap-4 mt-2 font-bold text-[11px] text-slate-500">
                        <span>Extracted Name: <strong className="text-slate-800">{aiResult.student_name_on_document || 'None'}</strong></span>
                        {aiResult.expires_on && (
                            <span>Expiration: <strong className="text-slate-800">{aiResult.expires_on}</strong></span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = {
        verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        submitted: 'bg-blue-50 text-blue-700 border-blue-100',
        pending_verification: 'bg-amber-50 text-amber-700 border-amber-100',
        missing: 'bg-rose-50 text-rose-700 border-rose-100',
        not_applicable: 'bg-slate-100 text-slate-600 border-slate-200',
    }[status] || 'bg-slate-50 text-slate-700 border-slate-100';

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${config}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
                status === 'verified' ? 'bg-emerald-500' :
                status === 'submitted' ? 'bg-blue-500' :
                status === 'pending_verification' ? 'bg-amber-500' : 
                status === 'missing' ? 'bg-rose-500' : 'bg-slate-400'
            }`}></span>
            {status.replaceAll('_', ' ')}
        </span>
    );
}

function EditProfileModal({ isOpen, onClose, learner }: { isOpen: boolean; onClose: () => void; learner: LearnerProfile }) {
    const { data, setData, put, processing, errors } = useForm({
        full_name: learner.full_name,
        lrn: learner.lrn ?? '',
        birth_date: learner.birth_date ?? '',
        gender: learner.gender ?? '',
        mother_maiden_name: learner.mother_maiden_name ?? '',
        mother_contact_number: learner.mother_contact_number ?? '',
        father_name: learner.father_name ?? '',
        father_contact_number: learner.father_contact_number ?? '',
        philippine_address: learner.philippine_address ?? '',
        uae_address: learner.uae_address ?? '',
        previous_school: learner.previous_school ?? '',
        metadata: {
            preferred_name: learner.metadata?.preferred_name ?? '',
            nationality: learner.metadata?.nationality ?? '',
            place_of_birth: learner.metadata?.place_of_birth ?? '',
            mother: {
                email: learner.metadata?.mother?.email ?? '',
                occupation: learner.metadata?.mother?.occupation ?? '',
                employer: learner.metadata?.mother?.employer ?? '',
                authorized_pickup: learner.metadata?.mother?.authorized_pickup ?? false,
            },
            father: {
                email: learner.metadata?.father?.email ?? '',
                occupation: learner.metadata?.father?.occupation ?? '',
                employer: learner.metadata?.father?.employer ?? '',
                authorized_pickup: learner.metadata?.father?.authorized_pickup ?? false,
            },
            primary_guardian: {
                full_name: learner.metadata?.primary_guardian?.full_name ?? '',
                relationship: learner.metadata?.primary_guardian?.relationship ?? '',
                primary_contact: learner.metadata?.primary_guardian?.primary_contact ?? '',
                email: learner.metadata?.primary_guardian?.email ?? '',
                lives_with_learner: learner.metadata?.primary_guardian?.lives_with_learner ?? false,
            },
            academic: {
                program: learner.metadata?.academic?.program ?? '',
                section: learner.metadata?.academic?.section ?? '',
            }
        }
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('learners.update', learner.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const updateMeta = (section: 'mother' | 'father' | 'primary_guardian' | 'academic' | 'root', field: string, value: any) => {
        setData('metadata', {
            ...data.metadata,
            ...(section === 'root' ? { [field]: value } : {
                [section]: {
                    ...(data.metadata[section as keyof typeof data.metadata] as Record<string, any>),
                    [field]: value
                }
            })
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="flex flex-col h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <h2 className="text-xl font-black text-slate-900">Edit Learner Profile</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="space-y-8 max-w-2xl mx-auto">
                        
                        {/* Section: Personal Information */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-emerald-50/50 px-5 py-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Personal Information</h3>
                            </div>
                            <div className="p-5 grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Legal Name</label>
                                    <input type="text" value={data.full_name} onChange={e => setData('full_name', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Preferred Name</label>
                                    <input type="text" value={data.metadata.preferred_name} onChange={e => updateMeta('root', 'preferred_name', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">LRN</label>
                                    <input type="text" value={data.lrn} onChange={e => setData('lrn', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth</label>
                                    <input type="date" value={data.birth_date} onChange={e => setData('birth_date', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gender</label>
                                    <select value={data.gender} onChange={e => setData('gender', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold">
                                        <option value="">Select...</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nationality</label>
                                    <input type="text" value={data.metadata.nationality} onChange={e => updateMeta('root', 'nationality', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Place of Birth</label>
                                    <input type="text" value={data.metadata.place_of_birth} onChange={e => updateMeta('root', 'place_of_birth', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                            </div>
                        </section>
                        
                        {/* Section: Academic */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-emerald-50/50 px-5 py-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Academic Track</h3>
                            </div>
                            <div className="p-5 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Program</label>
                                    <input type="text" value={data.metadata.academic?.program} onChange={e => updateMeta('academic', 'program', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Section</label>
                                    <input type="text" value={data.metadata.academic?.section} onChange={e => updateMeta('academic', 'section', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                            </div>
                        </section>

                        {/* Section: Mother */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-emerald-50/50 px-5 py-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Mother's Details</h3>
                            </div>
                            <div className="p-5 grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                                    <input type="text" value={data.mother_maiden_name} onChange={e => setData('mother_maiden_name', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number</label>
                                    <input type="text" value={data.mother_contact_number} onChange={e => setData('mother_contact_number', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                                    <input type="email" value={data.metadata.mother?.email} onChange={e => updateMeta('mother', 'email', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Occupation</label>
                                    <input type="text" value={data.metadata.mother?.occupation} onChange={e => updateMeta('mother', 'occupation', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Employer</label>
                                    <input type="text" value={data.metadata.mother?.employer} onChange={e => updateMeta('mother', 'employer', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div className="sm:col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="m_pickup" checked={data.metadata.mother?.authorized_pickup} onChange={e => updateMeta('mother', 'authorized_pickup', e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
                                    <label htmlFor="m_pickup" className="text-sm font-semibold text-slate-700">Authorized for student pickup</label>
                                </div>
                            </div>
                        </section>

                        {/* Section: Father */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-emerald-50/50 px-5 py-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Father's Details</h3>
                            </div>
                            <div className="p-5 grid gap-5 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                                    <input type="text" value={data.father_name} onChange={e => setData('father_name', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number</label>
                                    <input type="text" value={data.father_contact_number} onChange={e => setData('father_contact_number', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                                    <input type="email" value={data.metadata.father?.email} onChange={e => updateMeta('father', 'email', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Occupation</label>
                                    <input type="text" value={data.metadata.father?.occupation} onChange={e => updateMeta('father', 'occupation', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Employer</label>
                                    <input type="text" value={data.metadata.father?.employer} onChange={e => updateMeta('father', 'employer', e.target.value)} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold" />
                                </div>
                                <div className="sm:col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="f_pickup" checked={data.metadata.father?.authorized_pickup} onChange={e => updateMeta('father', 'authorized_pickup', e.target.checked)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
                                    <label htmlFor="f_pickup" className="text-sm font-semibold text-slate-700">Authorized for student pickup</label>
                                </div>
                            </div>
                        </section>

                        {/* Section: Addresses */}
                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-emerald-50/50 px-5 py-3 border-b border-slate-100">
                                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider">Addresses</h3>
                            </div>
                            <div className="p-5 grid gap-5 sm:grid-cols-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">UAE Address</label>
                                    <textarea value={data.uae_address} onChange={e => setData('uae_address', e.target.value)} rows={3} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold"></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Philippine Address</label>
                                    <textarea value={data.philippine_address} onChange={e => setData('philippine_address', e.target.value)} rows={3} className="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold"></textarea>
                                </div>
                            </div>
                        </section>

                    </div>
                </form>
                
                <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={submit} disabled={processing} className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
