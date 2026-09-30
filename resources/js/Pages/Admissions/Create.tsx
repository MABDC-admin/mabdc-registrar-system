import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useEffect, useState } from 'react';

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

type LookupResult = {
    id: number;
    lrn: string | null;
    full_name: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    date_of_birth: string;
    contact_number: string;
    email: string;
    previous_enrollment: {
        academic_year: string;
        level: string;
        section: string | null;
        status: string;
        suggested_next_level: string;
    } | null;
};

export default function AdmissionsCreate({
    activeYear,
    classifications,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        academic_year_id: activeYear?.id || '',
        learner_id: '' as number | string,
        first_name: '',
        last_name: '',
        middle_name: '',
        date_of_birth: '',
        email: '',
        contact_number: '',
        level_applied_for: 'G1',
        classification: classifications[0]?.value || 'new',
    });

    // Lookup states for returning learners
    const [lookupQuery, setLookupQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<LookupResult[]>([]);
    const [selectedLearner, setSelectedLearner] = useState<LookupResult | null>(
        null,
    );

    const isReturning = data.classification.toLowerCase() === 'returning';

    useEffect(() => {
        if (!isReturning) {
            setLookupQuery('');
            setSearchResults([]);
            setSelectedLearner(null);
            setData('learner_id', '');
            return;
        }

        if (lookupQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await axios.get(
                    route('admissions.lookup-learner'),
                    {
                        params: { query: lookupQuery },
                    },
                );
                setSearchResults(response.data);
            } catch (err) {
                console.error('Learner lookup failed', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [lookupQuery, isReturning]);

    const handleSelectLearner = (learner: LookupResult) => {
        setSelectedLearner(learner);
        setSearchResults([]);
        setLookupQuery('');

        setData((prev) => ({
            ...prev,
            learner_id: learner.id,
            first_name: learner.first_name || prev.first_name,
            last_name: learner.last_name || prev.last_name,
            middle_name: learner.middle_name || prev.middle_name,
            date_of_birth: learner.date_of_birth || prev.date_of_birth,
            contact_number: learner.contact_number || prev.contact_number,
            email: learner.email || prev.email,
            level_applied_for:
                learner.previous_enrollment?.suggested_next_level ||
                prev.level_applied_for,
        }));
    };

    const handleClearMatch = () => {
        setSelectedLearner(null);
        setData('learner_id', '');
        setLookupQuery('');
        setSearchResults([]);
    };

    const fillTestData = () => {
        const firstNames = [
            'Juan',
            'Maria',
            'Pedro',
            'Ana',
            'Jose',
            'Clara',
            'Luis',
            'Sofia',
        ];
        const lastNames = [
            'Dela Cruz',
            'Santos',
            'Reyes',
            'Gonzales',
            'Ramos',
            'Mendoza',
            'Torres',
        ];
        const randomFirstName =
            firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLastName =
            lastNames[Math.floor(Math.random() * lastNames.length)];
        const randomPhone =
            '050' + Math.floor(1000000 + Math.random() * 9000000);

        setData({
            academic_year_id: activeYear?.id || '',
            learner_id: '',
            first_name: randomFirstName,
            middle_name: 'A.',
            last_name: randomLastName,
            date_of_birth: '2016-05-15',
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
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Admissions intake
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            New Student Application
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={fillTestData}
                            className="inline-flex h-9 items-center rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                        >
                            ⚡ Fill Sample Data
                        </button>
                        <Link
                            href={route('admissions.index')}
                            className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            &larr; Back to Admissions
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="New Admission" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {!activeYear && (
                        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            <strong>Warning:</strong> No active academic year found. Please configure an active academic year in settings first.
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                    >
                        <div className="p-6 space-y-6">
                            {/* Section 1: Classification & Academic Year */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                    1. Application Classification &amp; Level
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Student Classification *
                                        </span>
                                        <div className="mt-2 grid grid-cols-3 gap-3">
                                            {classifications.map(
                                                (classification) => {
                                                    const isChecked =
                                                        data.classification ===
                                                        classification.value;
                                                    return (
                                                        <label
                                                            key={
                                                                classification.value
                                                            }
                                                            className={`cursor-pointer rounded-md border p-3 text-center transition ${
                                                                isChecked
                                                                    ? 'border-gray-900 bg-gray-900 text-white font-semibold shadow-xs'
                                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="classification"
                                                                value={
                                                                    classification.value
                                                                }
                                                                checked={
                                                                    isChecked
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) =>
                                                                    setData(
                                                                        'classification',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="sr-only"
                                                            />
                                                            <span className="block text-sm">
                                                                {
                                                                    classification.label
                                                                }
                                                            </span>
                                                        </label>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>

                                    {/* RETURNING LEARNER LOOKUP BAR */}
                                    {isReturning && (
                                        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-900">
                                                        🔍 Lookup Previous Year Record by Name or LRN
                                                    </span>
                                                    <p className="mt-0.5 text-xs text-indigo-700">
                                                        Search past learner database to automatically pull previous records, academic year, and personal details.
                                                    </p>
                                                </div>
                                                {selectedLearner && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearMatch}
                                                        className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Clear Selection
                                                    </button>
                                                )}
                                            </div>

                                            {/* Search input */}
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Type name (e.g. Ramos, Pedro) or LRN..."
                                                    value={lookupQuery}
                                                    onChange={(e) =>
                                                        setLookupQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder:text-gray-400"
                                                />
                                                {isSearching && (
                                                    <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                                                        Searching...
                                                    </div>
                                                )}

                                                {/* Autocomplete dropdown results */}
                                                {searchResults.length > 0 && (
                                                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg divide-y divide-gray-100">
                                                        {searchResults.map(
                                                            (learner) => (
                                                                <button
                                                                    key={
                                                                        learner.id
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleSelectLearner(
                                                                            learner,
                                                                        )
                                                                    }
                                                                    className="w-full p-3 text-left transition hover:bg-indigo-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                                                                >
                                                                    <div>
                                                                        <span className="font-semibold text-gray-900 text-sm">
                                                                            {
                                                                                learner.full_name
                                                                            }
                                                                        </span>
                                                                        <p className="text-xs text-gray-500">
                                                                            LRN:{' '}
                                                                            {learner.lrn ||
                                                                                'None'}
                                                                            {learner.date_of_birth
                                                                                ? ` · DOB: ${learner.date_of_birth}`
                                                                                : ''}
                                                                        </p>
                                                                    </div>
                                                                    {learner.previous_enrollment && (
                                                                        <div className="text-left sm:text-right">
                                                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                                                {
                                                                                    learner
                                                                                        .previous_enrollment
                                                                                        .level
                                                                                }{' '}
                                                                                (
                                                                                {
                                                                                    learner
                                                                                        .previous_enrollment
                                                                                        .academic_year
                                                                                }
                                                                                )
                                                                            </span>
                                                                            {learner
                                                                                .previous_enrollment
                                                                                .suggested_next_level && (
                                                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                                                    Next Level:{' '}
                                                                                    <strong>
                                                                                        {
                                                                                            learner
                                                                                                .previous_enrollment
                                                                                                .suggested_next_level
                                                                                        }
                                                                                    </strong>
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                {lookupQuery.trim().length >=
                                                    2 &&
                                                    !isSearching &&
                                                    searchResults.length ===
                                                        0 && (
                                                        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-xs text-gray-500 shadow-md">
                                                            No matching previous year records found.
                                                        </div>
                                                    )}
                                            </div>

                                            {/* Matched badge */}
                                            {selectedLearner && (
                                                <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                                                    <div>
                                                        <span className="font-semibold">
                                                            ✓ Matched Learner Record:
                                                        </span>{' '}
                                                        <strong>
                                                            {
                                                                selectedLearner.full_name
                                                            }
                                                        </strong>{' '}
                                                        (LRN:{' '}
                                                        {selectedLearner.lrn ||
                                                            'N/A'}
                                                        )
                                                        {selectedLearner.previous_enrollment && (
                                                            <p className="mt-0.5 text-emerald-800">
                                                                Previous Enrollment: {selectedLearner.previous_enrollment.level} ({selectedLearner.previous_enrollment.academic_year}) · Suggested Next: {selectedLearner.previous_enrollment.suggested_next_level}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Active Academic Year
                                            </span>
                                            <input
                                                type="text"
                                                value={
                                                    activeYear?.name || 'N/A'
                                                }
                                                disabled
                                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-sm font-semibold text-gray-600 shadow-sm"
                                            />
                                        </div>

                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Grade Level Applied For *
                                            </span>
                                            <select
                                                value={data.level_applied_for}
                                                onChange={(e) =>
                                                    setData(
                                                        'level_applied_for',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                {gradeLevels.map((level) => (
                                                    <option
                                                        key={level.value}
                                                        value={level.value}
                                                    >
                                                        {level.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.level_applied_for && (
                                                <p className="mt-1 text-xs text-rose-600">
                                                    {errors.level_applied_for}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Personal Details */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                                    2. Learner Personal &amp; Contact Details
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="block">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    First Name *
                                                </span>
                                                <input
                                                    type="text"
                                                    value={data.first_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'first_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                                                    placeholder="e.g. Juan"
                                                    required
                                                />
                                            </label>
                                            {errors.first_name && (
                                                <p className="mt-1 text-xs text-rose-600">
                                                    {errors.first_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Middle Name
                                                </span>
                                                <input
                                                    type="text"
                                                    value={data.middle_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'middle_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                                                    placeholder="e.g. Dela"
                                                />
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Last Name *
                                                </span>
                                                <input
                                                    type="text"
                                                    value={data.last_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            'last_name',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase"
                                                    placeholder="e.g. Cruz"
                                                    required
                                                />
                                            </label>
                                            {errors.last_name && (
                                                <p className="mt-1 text-xs text-rose-600">
                                                    {errors.last_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="block">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Date of Birth *
                                                </span>
                                                <input
                                                    type="date"
                                                    value={data.date_of_birth}
                                                    onChange={(e) =>
                                                        setData(
                                                            'date_of_birth',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    required
                                                />
                                            </label>
                                            {errors.date_of_birth && (
                                                <p className="mt-1 text-xs text-rose-600">
                                                    {errors.date_of_birth}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Contact Number *
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={data.contact_number}
                                                    onChange={(e) =>
                                                        setData(
                                                            'contact_number',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="050-123-4567"
                                                    required
                                                />
                                            </label>
                                            {errors.contact_number && (
                                                <p className="mt-1 text-xs text-rose-600">
                                                    {errors.contact_number}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                    Email Address (Optional)
                                                </span>
                                                <input
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) =>
                                                        setData(
                                                            'email',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    placeholder="guardian@example.com"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <Link
                                href={route('admissions.index')}
                                className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !activeYear}
                                className="inline-flex h-9 items-center rounded-md bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                            >
                                {processing
                                    ? 'Saving Application...'
                                    : 'Submit Admission Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
