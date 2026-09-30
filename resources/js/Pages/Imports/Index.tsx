import InputError from '@/Components/InputError';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type ActiveYear = {
    id: number;
    name: string;
} | null;

type ImportWarning = {
    row: number | null;
    code: string;
    message: string;
};

type ImportBatch = {
    id: number;
    original_filename: string;
    source_sheet: string;
    total_rows: number;
    imported_rows: number;
    skipped_rows: number;
    warning_count: number;
    warnings: ImportWarning[] | null;
    status: string;
    created_at: string;
    finished_at: string | null;
} | null;

type Props = {
    activeYear: ActiveYear;
    expectedColumns: string[];
    latestBatch: ImportBatch;
};

export default function ImportsIndex({
    activeYear,
    expectedColumns,
    latestBatch,
}: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        workbook: File | null;
    }>({
        workbook: null,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('imports.store'), {
            forceFormData: true,
            onSuccess: () => reset('workbook'),
        });
    };

    const warnings = latestBatch?.warnings ?? [];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Batch data migration
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-900">
                            MABDC Masterlist Import
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
            <Head title="Masterlist Import" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Upload Form Card */}
                        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <h3 className="text-base font-semibold text-gray-900">
                                    Upload Current Masterlist
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Use the master spreadsheet file (XLSX). The importer parses learner details, enrollment statuses, and maps document requirements.
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-5 p-6">
                                <label className="block">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Choose XLSX Workbook
                                    </span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="mt-2 block w-full rounded-md border border-gray-300 text-sm text-gray-700 shadow-sm file:mr-4 file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-gray-700"
                                        onChange={(event) =>
                                            setData(
                                                'workbook',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                                <InputError message={errors.workbook} />

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing || !data.workbook}
                                        className="inline-flex h-9 items-center rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40"
                                    >
                                        {processing
                                            ? 'Importing...'
                                            : 'Upload & Process Masterlist'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => reset('workbook')}
                                        disabled={processing}
                                        className="inline-flex h-9 items-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Latest Batch Sidebar */}
                        <aside className="overflow-hidden rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-3">
                                Latest Import Summary
                            </h3>

                            {latestBatch ? (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                            {latestBatch.original_filename}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Sheet: {latestBatch.source_sheet} · Status: {latestBatch.status}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 rounded-md bg-gray-50 p-3 text-center">
                                        <div>
                                            <p className="text-xs text-gray-500">Imported</p>
                                            <p className="text-lg font-semibold text-emerald-700">
                                                {latestBatch.imported_rows}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Skipped</p>
                                            <p className="text-lg font-semibold text-gray-700">
                                                {latestBatch.skipped_rows}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Warnings</p>
                                            <p className={`text-lg font-semibold ${
                                                latestBatch.warning_count > 0 ? 'text-amber-700' : 'text-gray-700'
                                            }`}>
                                                {latestBatch.warning_count}
                                            </p>
                                        </div>
                                    </div>

                                    {warnings.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Warning Details
                                            </p>
                                            <div className="max-h-40 overflow-y-auto space-y-1.5 text-xs text-amber-900">
                                                {warnings.slice(0, 5).map((w, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-md bg-amber-50 p-2 border border-amber-200"
                                                    >
                                                        <span className="font-semibold">
                                                            {w.row ? `Row ${w.row}: ` : ''}
                                                        </span>
                                                        {w.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-gray-400">
                                    No import batches executed yet.
                                </p>
                            )}
                        </aside>
                    </div>

                    {/* Expected Columns Reference */}
                    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-base font-semibold text-gray-900">
                                Expected Column Header Mappings
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                The uploaded master sheet must contain these column names in the header row.
                            </p>
                        </div>
                        <div className="grid gap-2 p-6 sm:grid-cols-2 lg:grid-cols-3">
                            {expectedColumns.map((column) => (
                                <div
                                    key={column}
                                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    {column}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
