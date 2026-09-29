import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { 
    FileText, 
    Download, 
    Search,
    BookOpen,
    Award
} from 'lucide-react';

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
    const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

    const filteredLearners = learners.filter(learner => {
        const fullName = `${learner.first_name} ${learner.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase()) || learner.lrn.includes(searchQuery);
    });

    const handleGenerate = (type: string) => {
        if (!selectedLearner) return;
        
        // Open the generated certificate in a new tab for printing
        window.open(route('certificates.generate', {
            learner_id: selectedLearner.id,
            type: type
        }), '_blank');
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Certificates & Documents</h2>}
        >
            <Head title="Certificates" />

            <div className="py-12">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Main Content */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Official Documents</h3>
                            <p className="text-sm text-gray-500">
                                Select a student and the type of document you wish to generate. The document will open in a new tab for printing.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Student Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    1. Select Student
                                </label>
                                <div className="relative mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by name or LRN..."
                                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="border rounded-md max-h-64 overflow-y-auto">
                                    {filteredLearners.length > 0 ? (
                                        <ul className="divide-y divide-gray-200">
                                            {filteredLearners.map(learner => (
                                                <li 
                                                    key={learner.id}
                                                    className={`p-3 cursor-pointer hover:bg-gray-50 flex flex-col ${selectedLearner?.id === learner.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                                    onClick={() => setSelectedLearner(learner)}
                                                >
                                                    <span className="font-medium text-gray-900">
                                                        {learner.first_name} {learner.last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">LRN: {learner.lrn}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-4 text-sm text-gray-500 text-center">
                                            No students found.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Document Types */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    2. Select Document Type
                                </label>
                                
                                <div className="space-y-4">
                                    {/* Certificate of Enrollment */}
                                    <div className={`border rounded-lg p-4 transition-colors ${!selectedLearner ? 'opacity-50 pointer-events-none' : 'hover:border-blue-300'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Certificate of Enrollment</h4>
                                                    <p className="text-sm text-gray-500">Official proof of current enrollment status.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleGenerate('enrollment')}
                                                disabled={!selectedLearner}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <Download className="h-4 w-4" />
                                                Generate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Certificate of Good Moral Character */}
                                    <div className={`border rounded-lg p-4 transition-colors ${!selectedLearner ? 'opacity-50 pointer-events-none' : 'hover:border-blue-300'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Good Moral Character</h4>
                                                    <p className="text-sm text-gray-500">Certification of student's good conduct.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleGenerate('good_moral')}
                                                disabled={!selectedLearner}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <Download className="h-4 w-4" />
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {!selectedLearner && (
                                    <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                                        Please select a student first to generate documents.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
