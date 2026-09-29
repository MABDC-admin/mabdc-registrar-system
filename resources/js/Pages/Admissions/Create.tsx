import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Props = {
    activeYear: {
        id: number;
        name: string;
    } | null;
    classifications: {
        value: string;
        label: string;
    }[];
};

export default function AdmissionsCreate({ activeYear, classifications }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        academic_year_id: activeYear?.id || '',
        first_name: '',
        last_name: '',
        middle_name: '',
        date_of_birth: '',
        email: '',
        contact_number: '',
        level_applied_for: 'G1',
        classification: classifications[0]?.value || 'new',
    });

    const fillTestData = () => {
        const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Clara', 'Luis', 'Sofia'];
        const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Gonzales', 'Ramos', 'Mendoza', 'Torres'];
        const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const randomPhone = '0917' + Math.floor(1000000 + Math.random() * 9000000);
        
        setData({
            academic_year_id: activeYear?.id || '',
            first_name: randomFirstName,
            middle_name: 'A.',
            last_name: randomLastName,
            date_of_birth: '2015-05-15',
            email: `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase().replace(' ', '')}@example.com`,
            contact_number: randomPhone,
            level_applied_for: 'G1',
            classification: classifications[0]?.value || 'new',
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admissions.store'));
    };

    const gradeLevels = [
        { value: 'L1', label: 'L1 (Nursery / Kindergarten 1)' },
        { value: 'L2', label: 'L2 (Kindergarten 2)' },
        { value: 'G1', label: 'Grade 1 (G1)' },
        { value: 'G2', label: 'Grade 2 (G2)' },
        { value: 'G3', label: 'Grade 3 (G3)' },
        { value: 'G4', label: 'Grade 4 (G4)' },
        { value: 'G5', label: 'Grade 5 (G5)' },
        { value: 'G6', label: 'Grade 6 (G6)' },
        { value: 'G7', label: 'Grade 7 (G7)' },
        { value: 'G8', label: 'Grade 8 (G8)' },
        { value: 'G9', label: 'Grade 9 (G9)' },
        { value: 'G10', label: 'Grade 10 (G10)' },
        { value: 'G11', label: 'Grade 11 (G11)' },
        { value: 'G12', label: 'Grade 12 (G12)' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manual Admission</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">Record a walk-in application into the system.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fillTestData}
                            className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-bold rounded-lg shadow-sm text-amber-800 bg-amber-50 hover:bg-amber-100 transition"
                        >
                            ⚡ Fill Test Data
                        </button>
                        <Link href={route('admissions.index')} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition">
                            &larr; Back to Admissions
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="New Admission" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <form onSubmit={submit} className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-6 sm:p-8 space-y-8">
                            
                            {!activeYear && (
                                <div className="bg-rose-50 text-rose-700 p-4 rounded-lg font-semibold text-sm">
                                    Warning: No active academic year found. Please configure an academic year first.
                                </div>
                            )}

                            {/* Section 1: Academic Info */}
                            <div>
                                <h2 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2 mb-4">Application Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Academic Year</label>
                                        <input 
                                            type="text" 
                                            value={activeYear?.name || 'N/A'} 
                                            disabled 
                                            className="mt-1 block w-full bg-slate-100 border-slate-300 rounded-lg shadow-sm text-slate-500 sm:text-sm font-semibold"
                                        />
                                        {errors.academic_year_id && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.academic_year_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Level Applied For <span className="text-rose-500">*</span></label>
                                        <select
                                            value={data.level_applied_for}
                                            onChange={e => setData('level_applied_for', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold"
                                        >
                                            {gradeLevels.map(level => (
                                                <option key={level.value} value={level.value}>{level.label}</option>
                                            ))}
                                        </select>
                                        {errors.level_applied_for && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.level_applied_for}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700">Student Classification <span className="text-rose-500">*</span></label>
                                        <div className="mt-2 grid grid-cols-3 gap-3">
                                            {classifications.map((classification) => (
                                                <label 
                                                    key={classification.value} 
                                                    className={`
                                                        cursor-pointer border rounded-lg p-3 text-center transition-all
                                                        ${data.classification === classification.value 
                                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm' 
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                                        }
                                                    `}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        name="classification" 
                                                        value={classification.value}
                                                        checked={data.classification === classification.value}
                                                        onChange={e => setData('classification', e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="block text-sm font-bold">{classification.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.classification && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.classification}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Personal Details */}
                            <div>
                                <h2 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-2 mb-4">Applicant Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">First Name <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold uppercase placeholder:normal-case placeholder:text-slate-400"
                                            placeholder="e.g. Juan"
                                            required
                                        />
                                        {errors.first_name && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Middle Name</label>
                                        <input
                                            type="text"
                                            value={data.middle_name}
                                            onChange={e => setData('middle_name', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold uppercase placeholder:normal-case placeholder:text-slate-400"
                                            placeholder="e.g. Dela"
                                        />
                                        {errors.middle_name && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.middle_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Last Name <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold uppercase placeholder:normal-case placeholder:text-slate-400"
                                            placeholder="e.g. Cruz"
                                            required
                                        />
                                        {errors.last_name && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.last_name}</p>}
                                    </div>
                                    
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700">Date of Birth <span className="text-rose-500">*</span></label>
                                        <input
                                            type="date"
                                            value={data.date_of_birth}
                                            onChange={e => setData('date_of_birth', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold"
                                            required
                                        />
                                        {errors.date_of_birth && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.date_of_birth}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700">Contact Number <span className="text-rose-500">*</span></label>
                                        <input
                                            type="tel"
                                            value={data.contact_number}
                                            onChange={e => setData('contact_number', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold"
                                            placeholder="0917-123-4567"
                                            required
                                        />
                                        {errors.contact_number && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.contact_number}</p>}
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700">Email Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="mt-1 block w-full border-slate-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm font-semibold"
                                            placeholder="juan@example.com"
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.email}</p>}
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end border-t border-slate-200 gap-3">
                            <Link 
                                href={route('admissions.index')} 
                                className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !activeYear}
                                className="inline-flex justify-center rounded-lg border border-transparent bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {processing ? 'Submitting...' : 'Admit Student'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
