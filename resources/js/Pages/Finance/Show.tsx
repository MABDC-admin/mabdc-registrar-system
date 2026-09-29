import React, { useState } from 'react';
import FinanceLayout from '@/Layouts/FinanceLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputError from '@/Components/InputError';

export default function Show({ enrollment }: any) {
    const [actionType, setActionType] = useState<'charge' | 'payment' | 'discount' | 'installment' | 'refund' | null>(null);

    // Form for generic actions
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        description: '', // for charges
        method: 'Cash', // for payments
        type: 'Employee Discount (50%)', // for discounts
        transaction_date: new Date().toISOString().split('T')[0],
        total_months: '9', // for installments
        start_date: new Date().toISOString().split('T')[0], // for installments
        reason: '', // for refunds
    });

    const closeModal = () => {
        setActionType(null);
        reset();
    };

    const submitAction = (e: React.FormEvent) => {
        e.preventDefault();
        const routeName = `finance.${actionType}`;
        post(route(routeName, enrollment.id), {
            onSuccess: () => closeModal(),
        });
    };

    return (
        <FinanceLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#002b80]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#002b80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl text-slate-800 leading-tight">Student Ledger</h2>
                        <p className="text-xs text-slate-400 font-semibold">Statement of account &amp; transactions</p>
                    </div>
                </div>
            }
        >
            <Head title={`Ledger - ${enrollment.learner_name}`} />

            <div className="py-12">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="mb-4">
                        <Link href={route('finance.index')} className="text-indigo-600 hover:text-indigo-900">&larr; Back to Finance Dashboard</Link>
                    </div>

                    {/* Summary Header */}
                    <div className="bg-white p-6 shadow sm:rounded-lg flex justify-between items-center border-l-4 border-indigo-500">
                        <div className="flex items-center gap-4">
                            {enrollment.photo_url && (
                                <div className="w-36 h-36 rounded-full bg-slate-100 border-4 border-slate-200 overflow-hidden shrink-0 shadow-md">
                                    <img src={enrollment.photo_url} alt={enrollment.learner_name} className="h-full w-full object-cover" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{enrollment.learner_name}</h3>
                                <p className="text-gray-500">{enrollment.academic_year} • {enrollment.grade_level} • LRN: {enrollment.lrn}</p>
                                <span className={`mt-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                    Status: {enrollment.financial_status}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-8 text-right">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Fees</p>
                                <p className="text-xl font-bold text-gray-700">AED {parseFloat(enrollment.total_fees || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Discounts</p>
                                <p className="text-xl font-bold text-gray-700">AED {parseFloat(enrollment.total_discounts || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Payments</p>
                                <p className="text-xl font-bold text-gray-700">AED {parseFloat(enrollment.total_payments || 0).toLocaleString()}</p>
                            </div>
                            <div className="pl-6 border-l border-gray-200">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Outstanding Balance</p>
                                <p className={`text-4xl font-black ${parseFloat(enrollment.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    AED {parseFloat(enrollment.balance).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <PrimaryButton onClick={() => setActionType('payment')} className="bg-green-600 hover:bg-green-500">
                            Record Payment
                        </PrimaryButton>
                        <SecondaryButton onClick={() => setActionType('discount')}>
                            Apply Discount
                        </SecondaryButton>
                        <SecondaryButton onClick={() => setActionType('refund')} className="text-orange-700 border-orange-300 hover:bg-orange-50">
                            Issue Refund
                        </SecondaryButton>
                        <SecondaryButton onClick={() => setActionType('installment')}>
                            Generate Installment Plan
                        </SecondaryButton>
                        <SecondaryButton onClick={() => setActionType('charge')}>
                            Add Custom Charge
                        </SecondaryButton>
                    </div>

                    {/* Installment Plan Summary */}
                    {enrollment.installment_plans && enrollment.installment_plans.length > 0 && (() => {
                        const plan = enrollment.installment_plans[enrollment.installment_plans.length - 1];
                        return (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                <div className="flex justify-between items-start">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">Active Installment Plan</h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>Target: <strong>{plan.total_months} Months</strong></p>
                                            <p>Monthly Amount: <strong>AED {parseFloat(plan.monthly_amount).toLocaleString()}</strong></p>
                                            <p>Start Date: {new Date(plan.start_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 ml-3 min-w-0">
                                        <h4 className="text-xs font-semibold text-blue-800 uppercase mb-2">Projected Schedule</h4>
                                        <div className="flex flex-row flex-nowrap overflow-x-auto gap-2 pb-2 scrollbar-thin">
                                            {Array.from({ length: plan.total_months }).map((_, i) => {
                                                const d = new Date(plan.start_date);
                                                d.setMonth(d.getMonth() + i);
                                                return (
                                                    <div key={i} className="shrink-0 min-w-[125px] bg-white p-2 rounded-lg border border-blue-200 shadow-2xs text-xs text-blue-900">
                                                        <span className="font-bold block whitespace-nowrap">Month {i + 1}</span>
                                                        <span className="text-[10px] text-slate-500 block whitespace-nowrap">{d.toLocaleDateString()}</span>
                                                        <span className="font-extrabold text-[#002b80] block whitespace-nowrap">AED {parseFloat(plan.monthly_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Ledger Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#002b80]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {enrollment.ledgers.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.transaction_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${item.type === 'charge' || item.type === 'tax' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                                            `}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${parseFloat(item.amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {parseFloat(item.amount) > 0 ? '+' : ''}{parseFloat(item.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {enrollment.ledgers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No transactions recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>

            {/* Action Modal */}
            <Modal show={actionType !== null} onClose={closeModal}>
                <form onSubmit={submitAction} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 capitalize mb-4">
                        {actionType?.replace('-', ' ')}
                    </h2>

                    <div className="space-y-4">
                        {/* Transaction Date - Applies to all except installment */}
                        {actionType !== 'installment' && (
                            <div>
                                <InputLabel htmlFor="transaction_date" value="Date" />
                                <TextInput
                                    id="transaction_date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.transaction_date}
                                    onChange={(e) => setData('transaction_date', e.target.value)}
                                />
                                <InputError message={errors.transaction_date} className="mt-2" />
                            </div>
                        )}

                        {/* Amount - Applies to Charge, Payment, Discount, Refund */}
                        {['charge', 'payment', 'discount', 'refund'].includes(actionType || '') && (
                            <div>
                                <InputLabel htmlFor="amount" value="Amount (AED)" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    required
                                />
                                <InputError message={errors.amount} className="mt-2" />
                            </div>
                        )}

                        {/* Specific Fields */}
                        {actionType === 'charge' && (
                            <div>
                                <InputLabel htmlFor="description" value="Description" />
                                <TextInput
                                    id="description"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    required
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        )}

                        {actionType === 'payment' && (
                            <div>
                                <InputLabel htmlFor="method" value="Payment Method" />
                                <select
                                    id="method"
                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm mt-1 block w-full"
                                    value={data.method}
                                    onChange={(e) => setData('method', e.target.value)}
                                >
                                    <option>Cash</option>
                                    <option>Credit Card</option>
                                    <option>Bank Transfer</option>
                                    <option>Cheque</option>
                                </select>
                                <InputError message={errors.method} className="mt-2" />
                            </div>
                        )}

                        {actionType === 'discount' && (
                            <div>
                                <InputLabel htmlFor="type" value="Discount Type" />
                                <select
                                    id="type"
                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm mt-1 block w-full"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                >
                                    <option>Employee Discount (50%)</option>
                                    <option>Sibling Discount</option>
                                    <option>Loyalty Discount</option>
                                    <option>Regular Discount</option>
                                    <option>Full Payment Discount</option>
                                    <option>Custom Override</option>
                                </select>
                                <InputError message={errors.type} className="mt-2" />
                            </div>
                        )}

                        {actionType === 'refund' && (
                            <div>
                                <InputLabel htmlFor="reason" value="Reason for Refund" />
                                <TextInput
                                    id="reason"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    placeholder="e.g. Overpayment, Withdrawal"
                                    required
                                />
                                <InputError message={(errors as any).reason} className="mt-2" />
                            </div>
                        )}

                        {actionType === 'installment' && (
                            <>
                                <div>
                                    <InputLabel htmlFor="total_months" value="Number of Months" />
                                    <TextInput
                                        id="total_months"
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="mt-1 block w-full"
                                        value={data.total_months}
                                        onChange={(e) => setData('total_months', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.total_months} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="start_date" value="First Payment Date" />
                                    <TextInput
                                        id="start_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} className="mt-2" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <PrimaryButton className="ml-3" disabled={processing}>
                            Submit {actionType}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </FinanceLayout>
    );
}
