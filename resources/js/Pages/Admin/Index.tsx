import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({
    usersCount,
    usersBreakdown,
    auditEventsCount,
    recentAuditEvents,
    activeYearName,
    totalAcademicYears,
    diagnostics,
}: any) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
                            🛡️ System Admin Control Center
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Administrative Overview
                        </h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Manage system users, access roles, academic configurations, and diagnostics.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="System Admin Dashboard" />

            <div className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-none space-y-8">
                    
                    {/* KPI Summary Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System Users</span>
                                <span className="text-2xl font-black text-slate-800 block mt-0.5">{usersCount}</span>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {usersBreakdown.admin} admins • {usersBreakdown.registrar} registrars
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Academic Year</span>
                                <span className="text-2xl font-black text-slate-800 block mt-0.5">{activeYearName}</span>
                                <span className="text-[10px] font-bold text-slate-500">
                                    {totalAcademicYears} years configured
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logs & Audits</span>
                                <span className="text-2xl font-black text-slate-800 block mt-0.5">{auditEventsCount.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-slate-500">Events registered</span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">System OS</span>
                                <span className="text-2xl font-black text-slate-800 block mt-0.5 truncate max-w-[150px]">{diagnostics.server_os}</span>
                                <span className="text-[10px] font-bold text-slate-500">PHP {diagnostics.php_version}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Dashboard Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Modules Quick Access */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                                <span className="text-sm font-black text-slate-850 uppercase tracking-wider">Administration Modules</span>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <QuickLink 
                                    href={route('users.index')} 
                                    title="User Management" 
                                    sub="Manage staff details, create registrar logins, and configure role assignments." 
                                    emoji="👤" 
                                    color="bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-700"
                                />
                                <QuickLink 
                                    href={route('roles.index')} 
                                    title="Access Roles & Permissions" 
                                    sub="Configure Spatie module permissions and user operational access levels." 
                                    emoji="🔑" 
                                    color="bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-700"
                                />
                                <QuickLink 
                                    href={route('academic-years.index')} 
                                    title="School Academic Years" 
                                    sub="Set active years, create terms, and activate historical sections." 
                                    emoji="🏫" 
                                    color="bg-emerald-50 border-emerald-100 hover:border-emerald-300 text-emerald-700"
                                />
                                <QuickLink 
                                    href={route('audit-trail.index')} 
                                    title="System Audit Trail" 
                                    sub="Investigate system activity logs, Excel imports, and operational changes." 
                                    emoji="📋" 
                                    color="bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-700"
                                />
                            </div>
                        </div>

                        {/* Diagnostics Visuals */}
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                            <div>
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                                    <span className="text-sm font-black text-slate-850 uppercase tracking-wider">Server Diagnostics</span>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* CPU LOAD */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-500 uppercase tracking-wider">CPU Load average</span>
                                            <span className="text-slate-800 font-extrabold">{diagnostics.cpu_load}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    parseFloat(diagnostics.cpu_load) > 0.8 ? 'bg-red-500' : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${Math.min(parseFloat(diagnostics.cpu_load) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* RAM MEMORY */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-500 uppercase tracking-wider">Memory Allocation</span>
                                            <span className="text-slate-800 font-extrabold">{diagnostics.memory_used}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    parseInt(diagnostics.memory_used) > 80 ? 'bg-red-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: diagnostics.memory_used }}
                                            />
                                        </div>
                                    </div>

                                    {/* DISK FREE */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Storage Capacity</span>
                                        <span className="text-xs font-extrabold text-slate-700 block">{diagnostics.disk_free} available</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center text-[10px] font-extrabold text-slate-500">
                                <span>PHP VERSION: {diagnostics.php_version}</span>
                                <span>LARAVEL: {diagnostics.laravel_version}</span>
                            </div>
                        </div>
                    </div>

                    {/* Audit Logs Grid */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-sm font-black text-slate-850 uppercase tracking-wider">Recent Security & Audit Logs</span>
                            <Link href={route('audit-trail.index')} className="text-xs font-black text-indigo-600 hover:text-indigo-900 uppercase tracking-wider">
                                View Full Log →
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                                        <th className="px-6 py-3.5">Timestamp</th>
                                        <th className="px-6 py-3.5">Actor</th>
                                        <th className="px-6 py-3.5">Action</th>
                                        <th className="px-6 py-3.5">Scope</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                                    {recentAuditEvents.map((event: any) => (
                                        <tr key={event.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400">{event.created_at}</td>
                                            <td className="px-6 py-4 font-black text-slate-800 uppercase">{event.actor_name}</td>
                                            <td className="px-6 py-4 text-slate-650">{event.message}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-indigo-700 uppercase">
                                                <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                                    {event.subject_type || 'SYSTEM'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentAuditEvents.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                                                No audit logs recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function QuickLink({ href, title, sub, emoji, color }: any) {
    return (
        <Link 
            href={href} 
            className={`border rounded-xl p-5 block transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer ${color}`}
        >
            <div className="flex items-center gap-3 mb-2.5">
                <span className="text-xl shrink-0">{emoji}</span>
                <h4 className="font-black text-sm uppercase tracking-wider">{title}</h4>
            </div>
            <p className="text-xs leading-relaxed opacity-85 font-medium">{sub}</p>
        </Link>
    );
}
