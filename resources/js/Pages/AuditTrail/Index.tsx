import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, router, usePage } from '@inertiajs/react';

interface AuditEvent {
    id: number;
    event_type: string;
    actor_name: string;
    subject_type: string | null;
    subject_id: number | null;
    created_at: string;
    created_at_human: string;
    message: string;
    before: any;
    after: any;
    metadata: any;
}

interface IndexProps {
    events: {
        data: AuditEvent[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search: string;
        event_type: string;
        date: string;
    };
    eventTypes: string[];
}

export default function Index({ events, filters, eventTypes }: IndexProps) {
    const auth = usePage().props.auth;
    const user = auth.user;
    const isFinance = user.role === 'finance';

    const [search, setSearch] = useState(filters.search || '');
    const [eventType, setEventType] = useState(filters.event_type || '');
    const [date, setDate] = useState(filters.date || '');
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

    // Trigger router reload when filters change
    const applyFilters = () => {
        router.get(
            route('audit-trail.index'),
            { search, event_type: eventType, date },
            { preserveState: true, replace: true }
        );
    };

    // Debounced text search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilters();
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const handleFilterChange = (type: string, val: string) => {
        if (type === 'event_type') {
            setEventType(val);
            router.get(
                route('audit-trail.index'),
                { search, event_type: val, date },
                { preserveState: true, replace: true }
            );
        } else if (type === 'date') {
            setDate(val);
            router.get(
                route('audit-trail.index'),
                { search, event_type: eventType, date: val },
                { preserveState: true, replace: true }
            );
        }
    };

    const clearFilters = () => {
        setSearch('');
        setEventType('');
        setDate('');
        router.get(route('audit-trail.index'), {}, { replace: true });
    };

    // Helper to render event badges
    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'payment_recorded':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'charge_applied':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'discount_applied':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'refund_issued':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'installment_plan_created':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'batch_assessment_completed':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'document_requirement_updated':
                return 'bg-teal-50 text-teal-700 border-teal-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const formatEventType = (type: string) => {
        return type
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const content = (
        <>
            <Head title="System Audit Trail" />

            <div className="py-12 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-[#002b80] to-[#008f5d] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
                        <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                        </svg>
                    </div>
                    <div className="relative z-10 space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                            🛡️ Security & Auditing
                        </div>
                        <h1 className="text-3xl font-black tracking-tight" id="audit-trail-title">System Audit Trail</h1>
                        <p className="text-sm md:text-base font-medium text-emerald-100/90 max-w-2xl">
                            Real-time database mutations logging and transaction history records tracking administrative actions across the application.
                        </p>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-1/3 relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            id="audit-search-input"
                            type="text"
                            placeholder="Search actor, event type, or message..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#002b80] focus:ring-1 focus:ring-[#002b80] transition"
                        />
                    </div>

                    <div className="w-full md:w-auto flex flex-wrap md:flex-nowrap gap-3 items-center justify-end">
                        <div className="w-full sm:w-auto">
                            <select
                                id="audit-event-filter"
                                value={eventType}
                                onChange={(e) => handleFilterChange('event_type', e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#002b80] focus:ring-1 focus:ring-[#002b80] transition"
                            >
                                <option value="">All Event Types</option>
                                {eventTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {formatEventType(type)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto">
                            <input
                                id="audit-date-filter"
                                type="date"
                                value={date}
                                onChange={(e) => handleFilterChange('date', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#002b80] focus:ring-1 focus:ring-[#002b80] transition"
                            />
                        </div>

                        {(search || eventType || date) && (
                            <button
                                id="audit-clear-filters"
                                onClick={clearFilters}
                                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Event Type</th>
                                    <th className="px-6 py-4">Message</th>
                                    <th className="px-6 py-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {events.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-400 font-semibold">
                                            No audit trail logs found matching current criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    events.data.map((event) => (
                                        <React.Fragment key={event.id}>
                                            <tr className="hover:bg-slate-50/50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-800">{event.created_at}</div>
                                                    <div className="text-xs font-medium text-slate-400 mt-0.5">{event.created_at_human}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 uppercase">
                                                            {event.actor_name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-700">{event.actor_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getBadgeClass(event.event_type)}`}>
                                                        {formatEventType(event.event_type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <p className="font-semibold text-slate-700 truncate leading-relaxed">{event.message}</p>
                                                    {event.subject_type && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1">
                                                            🏷️ {event.subject_type} #{event.subject_id}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => setExpandedRowId(expandedRowId === event.id ? null : event.id)}
                                                        className="text-[#002b80] hover:text-[#004d31] font-bold text-xs hover:underline flex items-center gap-1 ml-auto"
                                                    >
                                                        {expandedRowId === event.id ? 'Hide Details' : 'View Details'}
                                                        <svg
                                                            className={`w-3.5 h-3.5 transition-transform ${expandedRowId === event.id ? 'rotate-180' : ''}`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2.5}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expandable JSON details */}
                                            {expandedRowId === event.id && (
                                                <tr className="bg-slate-50/70">
                                                    <td colSpan={5} className="px-8 py-5 border-t border-b border-slate-100">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {event.before && Object.keys(event.before).length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Before State</span>
                                                                    <pre className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 overflow-x-auto font-mono max-h-48 leading-relaxed shadow-2xs">
                                                                        {JSON.stringify(event.before, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {event.after && Object.keys(event.after).length > 0 && (
                                                                <div className="space-y-1.5 col-span-1 md:col-span-2">
                                                                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">After / Transaction Data</span>
                                                                    <pre className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 overflow-x-auto font-mono max-h-48 leading-relaxed shadow-2xs">
                                                                        {JSON.stringify(event.after, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                            {(!event.before || Object.keys(event.before).length === 0) && (!event.after || Object.keys(event.after).length === 0) && (
                                                                <div className="space-y-1.5 col-span-2">
                                                                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Metadata Logs</span>
                                                                    <pre className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 overflow-x-auto font-mono max-h-48 leading-relaxed shadow-2xs">
                                                                        {JSON.stringify(event.metadata, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    {events.total > 0 && (
                        <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                            <span className="text-xs font-semibold text-slate-400">
                                Showing <span className="font-bold text-slate-600">{events.from}</span> to <span className="font-bold text-slate-600">{events.to}</span> of <span className="font-bold text-slate-600">{events.total}</span> entries
                            </span>

                            <div className="flex items-center gap-1.5">
                                {events.links.map((link, idx) => {
                                    // Strip raw HTML tags from active link label if present
                                    const cleanLabel = link.label
                                        .replace('&laquo; Previous', '‹')
                                        .replace('Next &raquo;', '›');

                                    const isNumeric = !isNaN(Number(cleanLabel));

                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-3.5 py-1.5 text-slate-300 font-bold text-xs bg-slate-50 border border-slate-100 rounded-lg cursor-not-allowed select-none"
                                            >
                                                {cleanLabel}
                                            </span>
                                        );
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => router.get(link.url, { search, event_type: eventType, date }, { preserveState: true, replace: true })}
                                            className={`px-3.5 py-1.5 rounded-lg border text-xs font-black transition ${
                                                link.active
                                                    ? 'bg-[#002b80] text-white border-[#002b80] shadow-sm'
                                                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            {cleanLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (isFinance) {
        return <FinanceLayout>{content}</FinanceLayout>;
    }

    return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
}
