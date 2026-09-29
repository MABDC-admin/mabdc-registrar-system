import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

type Section = {
    id: number;
    level: string;
    name: string;
    session: string;
    teacher_name: string | null;
};

type RosterEntry = {
    learner_id: number;
    full_name: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks: string;
};

type Props = {
    activeYear: { id: number; name: string } | null;
    sections: Section[];
    filters: {
        date: string;
        section_id: string | null;
    };
    selectedSection: Section | null;
    roster: RosterEntry[];
};

export default function AttendanceIndex({ activeYear, sections, filters, selectedSection, roster }: Props) {
    
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedSectionId, setSelectedSectionId] = useState(filters.section_id || '');

    const { data, setData, post, processing, isDirty } = useForm({
        section_id: filters.section_id || '',
        date: filters.date,
        attendances: roster || [],
    });

    useEffect(() => {
        setData('attendances', roster);
    }, [roster]);

    const handleFilterChange = (sectionId: string, date: string) => {
        if (!sectionId) return;
        router.get(route('attendance.index'), {
            section_id: sectionId,
            date: date
        }, { preserveState: true, preserveScroll: true });
    };

    const handleStatusChange = (learnerId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
        const newAttendances = data.attendances.map(a => 
            a.learner_id === learnerId ? { ...a, status } : a
        );
        setData('attendances', newAttendances);
    };

    const setAllStatus = (status: 'present' | 'absent' | 'late' | 'excused') => {
        const newAttendances = data.attendances.map(a => ({ ...a, status }));
        setData('attendances', newAttendances);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('attendance.store'), {
            preserveScroll: true
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Tracking</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Record and manage daily attendance by section.</p>
                    </div>
                </div>
            }
        >
            <Head title="Attendance Tracking" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-none">
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Select Section</label>
                                <select 
                                    className="block w-full border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm"
                                    value={selectedSectionId}
                                    onChange={(e) => {
                                        setSelectedSectionId(e.target.value);
                                        handleFilterChange(e.target.value, selectedDate);
                                    }}
                                >
                                    <option value="">-- Choose a Section --</option>
                                    {sections.map(sec => (
                                        <option key={sec.id} value={sec.id}>
                                            {sec.level} - {sec.name} ({sec.session.replace('_', ' ').toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    className="block w-full border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        handleFilterChange(selectedSectionId, e.target.value);
                                    }}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                    </div>

                    {selectedSection ? (
                        <form onSubmit={submit} className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200 overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">{selectedSection.level} - {selectedSection.name}</h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Adviser: {selectedSection.teacher_name || 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setAllStatus('present')}
                                        className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition"
                                    >
                                        Mark All Present
                                    </button>
                                </div>
                            </div>
                            
                            {roster.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-sm font-bold text-slate-500">No students are currently enrolled in this section.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-[#002b80]">
                                            <tr>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Learner Name</th>
                                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-64">Attendance Status</th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {data.attendances.map((entry, index) => (
                                                <tr key={entry.learner_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs mr-3">
                                                                {entry.full_name.substring(0,2).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900">{entry.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="inline-flex shadow-sm rounded-md" role="group">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(entry.learner_id, 'present')}
                                                                className={`px-3 py-1.5 text-xs font-bold border rounded-l-lg transition-colors ${
                                                                    entry.status === 'present' 
                                                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(entry.learner_id, 'absent')}
                                                                className={`px-3 py-1.5 text-xs font-bold border-t border-b transition-colors ${
                                                                    entry.status === 'absent' 
                                                                    ? 'bg-rose-600 text-white border-rose-600' 
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                Absent
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(entry.learner_id, 'late')}
                                                                className={`px-3 py-1.5 text-xs font-bold border-t border-b border-l transition-colors ${
                                                                    entry.status === 'late' 
                                                                    ? 'bg-amber-500 text-white border-amber-500' 
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                Late
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStatusChange(entry.learner_id, 'excused')}
                                                                className={`px-3 py-1.5 text-xs font-bold border rounded-r-lg border-l-0 transition-colors ${
                                                                    entry.status === 'excused' 
                                                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                Excused
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Optional notes..." 
                                                            className="block w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm py-1.5"
                                                            value={entry.remarks}
                                                            onChange={(e) => {
                                                                const newAttendances = [...data.attendances];
                                                                newAttendances[index].remarks = e.target.value;
                                                                setData('attendances', newAttendances);
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                                        <PrimaryButton disabled={processing || !isDirty} className="!bg-emerald-600 hover:!bg-emerald-700">
                                            {processing ? 'Saving...' : 'Save Attendance'}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
                            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-base font-black text-slate-900">Select a section to take attendance</h3>
                            <p className="mt-1 text-sm text-slate-500">Choose a section from the dropdown above to load the class roster.</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
