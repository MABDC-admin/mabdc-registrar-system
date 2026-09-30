import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface Learner {
    id: number;
    lrn: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
}

interface Props {
    learners: Learner[];
}

export default function CertificatesIndex({ learners }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLearner, setSelectedLearner] = useState<Learner | null>(
        null,
    );

    const filteredLearners = learners.filter((learner) => {
        const fullName =
            `${learner.first_name} ${learner.last_name}`.toLowerCase();
        return (
            fullName.includes(searchQuery.toLowerCase()) ||
            learner.lrn.includes(searchQuery)
        );
    });

    const handleGenerate = (type: string) => {
        if (!selectedLearner) return;

        window.open(
            route('certificates.generate', {
                learner_id: selectedLearner.id,
                type: type,
            }),
            '_blank',
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Document issuance
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            Certificates &amp; Transcripts
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Certificates & Transcripts" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Instructions Banner */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">
                            Generate Official Certificates &amp; Transcripts
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Select a learner from the directory on the left, then choose the official certificate template to print or download.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Step 1: Select Student */}
                        <section className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    1. Choose Learner
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Filter and select from active directory records
                                </p>
                            </div>

                            <div className="p-4 space-y-3">
                                <label className="block">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Search Directory
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Name or LRN..."
                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                    />
                                </label>

                                <div className="max-h-80 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
                                    {filteredLearners.map((learner) => {
                                        const isSelected =
                                            selectedLearner?.id === learner.id;
                                        return (
                                            <button
                                                key={learner.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedLearner(learner)
                                                }
                                                className={`w-full text-left p-3 transition flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {learner.first_name}{' '}
                                                        {learner.last_name}
                                                    </span>
                                                    <p className="text-xs text-gray-500">
                                                        LRN: {learner.lrn}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                                                        Selected
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}

                                    {filteredLearners.length === 0 && (
                                        <div className="py-8 text-center text-sm text-gray-400">
                                            No learners found matching query.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Step 2: Available Templates */}
                        <section className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    2. Available Certificate Templates
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {selectedLearner
                                        ? `Issuing for: ${selectedLearner.first_name} ${selectedLearner.last_name}`
                                        : 'Please select a student on the left first'}
                                </p>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Certificate 1: Enrollment */}
                                <div
                                    className={`rounded-lg border p-4 transition ${
                                        selectedLearner
                                            ? 'border-gray-200 bg-white shadow-xs'
                                            : 'border-gray-100 bg-gray-50 opacity-50 pointer-events-none'
                                    }`}
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                Certificate of Enrollment
                                            </h4>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                Official verification of current enrollment status and grade level.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleGenerate('enrollment')
                                            }
                                            disabled={!selectedLearner}
                                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                                        >
                                            Generate &amp; Print
                                        </button>
                                    </div>
                                </div>

                                {/* Certificate 2: Good Moral */}
                                <div
                                    className={`rounded-lg border p-4 transition ${
                                        selectedLearner
                                            ? 'border-gray-200 bg-white shadow-xs'
                                            : 'border-gray-100 bg-gray-50 opacity-50 pointer-events-none'
                                    }`}
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                Certificate of Good Moral Character
                                            </h4>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                Official certification of the student's conduct and disciplinary record.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleGenerate('good_moral')
                                            }
                                            disabled={!selectedLearner}
                                            className="inline-flex h-9 items-center rounded-md bg-gray-900 px-3.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                                        >
                                            Generate &amp; Print
                                        </button>
                                    </div>
                                </div>

                                {!selectedLearner && (
                                    <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-md border border-amber-200">
                                        Please choose a learner from the left panel to activate template generation.
                                    </p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
