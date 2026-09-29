import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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
                        <p className="ops-kicker">
                            Registrar imports
                        </p>
                        <h2 className="ops-title text-3xl leading-tight">
                            MABDC Workbook Import
                        </h2>
                    </div>
                    <div className="rounded-md border border-teal-400/20 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-400">
                        Active year{' '}
                        <span className="text-teal-200">
                            {activeYear?.name ?? 'Not configured'}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Workbook Import" />

            <div className="py-8">
                <div className="mx-auto w-full max-w-none space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="ops-panel rounded-lg">
                            <div className="border-b border-teal-400/10 px-6 py-4">
                                <h3 className="text-base font-bold text-slate-100">
                                    Upload current masterlist
                                </h3>
                                <p className="mt-1 text-sm text-slate-400">
                                    Use the master sheet named MABDC 2026-2027.
                                    The importer preserves duplicate LRN
                                    conflicts as separate learner records and
                                    reports them for review.
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-5 p-6">
                                <label className="block">
                                    <span className="text-sm font-bold text-slate-300">
                                        XLSX workbook
                                    </span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="ops-control mt-2 block w-full rounded-md border text-sm file:mr-4 file:border-0 file:bg-teal-300 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950 hover:file:bg-teal-200 focus:outline-none"
                                        onChange={(event) =>
                                            setData(
                                                'workbook',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                                <InputError message={errors.workbook} />

                                <div className="flex flex-wrap items-center gap-3">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={processing || !data.workbook}
                                    >
                                        Import Workbook
                                    </PrimaryButton>
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => reset('workbook')}
                                        disabled={processing}
                                    >
                                        Clear
                                    </SecondaryButton>
                                </div>
                            </form>
                        </section>

                        <aside className="ops-panel-soft rounded-lg">
                            <div className="border-b border-teal-400/10 px-5 py-4">
                                <h3 className="text-base font-bold text-slate-100">
                                    Latest import
                                </h3>
                            </div>
                            {latestBatch ? (
                                <div className="space-y-5 p-5">
                                    <div>
                                        <p className="truncate text-sm font-bold text-slate-100">
                                            {latestBatch.original_filename}
                                        </p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                                            {latestBatch.source_sheet} ·{' '}
                                            {latestBatch.status}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <Metric
                                            label="Imported"
                                            value={latestBatch.imported_rows}
                                        />
                                        <Metric
                                            label="Skipped"
                                            value={latestBatch.skipped_rows}
                                        />
                                        <Metric
                                            label="Warnings"
                                            value={latestBatch.warning_count}
                                            tone={
                                                latestBatch.warning_count > 0
                                                    ? 'warn'
                                                    : 'default'
                                            }
                                        />
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-slate-100">
                                            Warning sample
                                        </h4>
                                        <div className="mt-3 space-y-2">
                                            {warnings.slice(0, 5).map(
                                                (warning, index) => (
                                                    <div
                                                        key={`${warning.code}-${warning.row}-${index}`}
                                                        className="rounded-md border border-amber-300/30 bg-amber-400/10 px-3 py-2"
                                                    >
                                                        <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
                                                            {warning.row
                                                                ? `Row ${warning.row}`
                                                                : 'Workbook'}{' '}
                                                            · {warning.code}
                                                        </p>
                                                        <p className="mt-1 text-sm text-amber-100">
                                                            {warning.message}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                            {warnings.length === 0 && (
                                                <p className="text-sm text-slate-400">
                                                    No warnings recorded.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-5 text-sm text-slate-400">
                                    No workbook has been imported yet.
                                </div>
                            )}
                        </aside>
                    </div>

                    <section className="ops-panel-soft rounded-lg">
                        <div className="border-b border-teal-400/10 px-6 py-4">
                            <h3 className="text-base font-bold text-slate-100">
                                Expected master sheet columns
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Headers are trimmed during import, but the sheet
                                should keep these fields in the first row.
                            </p>
                        </div>
                        <div className="grid gap-2 p-6 sm:grid-cols-2 lg:grid-cols-3">
                            {expectedColumns.map((column) => (
                                <div
                                    key={column}
                                    className="flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-950/50 px-3 py-2 text-sm font-medium text-slate-300"
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

function Metric({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: number;
    tone?: 'default' | 'warn';
}) {
    return (
        <div className="rounded-md border border-slate-700/70 bg-slate-950/70 p-3">
            <p
                className={
                    'text-2xl font-black ' +
                    (tone === 'warn' ? 'text-amber-300' : 'text-slate-50')
                }
            >
                {value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </p>
        </div>
    );
}
