'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { LoanProduct, LoanProductFormData } from '../../types/loan-product.types';
import { colors } from '../../themes/colors';
import { SearchableSelect } from '../common/SearchableSelect';

interface LoanProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: LoanProductFormData) => void;
    initialData?: LoanProduct | null;
}

// Local interface to handle input state where fields can be empty strings
interface LocalFormData {
    product_code: string;
    product_name: string;
    product_type: 'micro_loan' | 'investor_loan' | 'staff_loan' | 'advance_loan';
    gender_type: 'male' | 'female' | 'both';
    product_details: string;
    term_type: string;

    min_amount: string | number;
    max_amount: string | number;
    document_fees: string | number;
    product_terms: { term: string | number; interest_rate: string | number }[];
    customer_age_limited: string | number;
    customer_monthly_income: string | number;
    guarantor_monthly_income: string | number;
}

const defaultFormData: LocalFormData = {
    product_code: '',
    product_name: '',
    product_type: 'micro_loan',
    gender_type: 'both',
    product_details: '',
    term_type: 'Monthly',

    min_amount: '',
    max_amount: '',
    document_fees: '',
    product_terms: [{ term: '', interest_rate: '' }],
    customer_age_limited: 18,
    customer_monthly_income: '',
    guarantor_monthly_income: '',
};

export function LoanProductForm({ isOpen, onClose, onSave, initialData }: LoanProductFormProps) {
    const [formData, setFormData] = useState<LocalFormData>(defaultFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                product_code: initialData.product_code || '',
                product_name: initialData.product_name,
                product_type: initialData.product_type,
                gender_type: initialData.gender_type,
                product_details: initialData.product_details || '',
                term_type: initialData.term_type,

                min_amount: initialData.min_amount || initialData.loan_amount || '',
                max_amount: initialData.max_amount || initialData.loan_limited_amount || '',
                document_fees: initialData.document_fees !== null && initialData.document_fees !== undefined ? initialData.document_fees : '',
                product_terms: initialData.product_terms && initialData.product_terms.length > 0
                    ? initialData.product_terms.map(t => ({ term: t.term, interest_rate: t.interest_rate }))
                    : [{ term: initialData.loan_term || '', interest_rate: initialData.interest_rate || '' }],
                customer_age_limited: initialData.customer_age_limited !== null ? initialData.customer_age_limited : '',
                customer_monthly_income: initialData.customer_monthly_income !== null ? initialData.customer_monthly_income : '',
                guarantor_monthly_income: initialData.guarantor_monthly_income !== null ? initialData.guarantor_monthly_income : '',
            });
        } else {
            setFormData(defaultFormData);
        }
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
        if (!formData.product_code.trim()) {
            newErrors.product_code = 'Product code is required';
        } else if (!/^[A-Z]{2,4}$/.test(formData.product_code.toUpperCase())) {
            newErrors.product_code = 'Product code must be 2-4 letters (A-Z)';
        }
        if (!formData.term_type) newErrors.term_type = 'Term type is required';
        if (!formData.product_type) newErrors.product_type = 'Product type is required';
        if (!formData.gender_type) newErrors.gender_type = 'Gender type is required';

        const MAX_AMOUNT = 999999999; // 999 million limit to prevent DB overflow

        const minAmount = Number(formData.min_amount);
        if (formData.min_amount === '' || minAmount <= 0) {
            newErrors.min_amount = 'Min amount must be greater than 0';
        } else if (minAmount > MAX_AMOUNT) {
            newErrors.min_amount = 'Min amount cannot exceed 999,999,999';
        }

        const maxAmount = Number(formData.max_amount);
        if (formData.max_amount === '' || maxAmount <= 0) {
            newErrors.max_amount = 'Max amount must be greater than 0';
        } else if (maxAmount > MAX_AMOUNT) {
            newErrors.max_amount = 'Max amount cannot exceed 999,999,999';
        } else if (minAmount > maxAmount) {
            newErrors.max_amount = 'Max amount must be greater than or equal to Min amount';
        }

        // Validate income fields for overflow
        if (Number(formData.customer_monthly_income) > MAX_AMOUNT) {
            newErrors.customer_monthly_income = 'Income cannot exceed 999,999,999';
        }
        if (Number(formData.guarantor_monthly_income) > MAX_AMOUNT) {
            newErrors.guarantor_monthly_income = 'Income cannot exceed 999,999,999';
        }

        if (formData.document_fees === '' || Number(formData.document_fees) < 0) {
            newErrors.document_fees = 'Document fees are required';
        }

        // Validate terms
        if (formData.product_terms.length === 0) {
            newErrors.terms = 'At least one term and interest rate is required';
        } else {
            formData.product_terms.forEach((term, index) => {
                if (!term.term || Number(term.term) <= 0) {
                    newErrors[`term_${index}`] = 'Term is required';
                }
                if (term.interest_rate === '' || Number(term.interest_rate) < 0) {
                    newErrors[`interest_${index}`] = 'Interest is required';
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddTerm = () => {
        setFormData({
            ...formData,
            product_terms: [...formData.product_terms, { term: '', interest_rate: '' }]
        });
    };

    const handleRemoveTerm = (index: number) => {
        const newTerms = [...formData.product_terms];
        newTerms.splice(index, 1);
        setFormData({
            ...formData,
            product_terms: newTerms
        });
    };

    const handleTermChange = (index: number, field: 'term' | 'interest_rate', value: string) => {
        const newTerms = [...formData.product_terms];
        newTerms[index] = { ...newTerms[index], [field]: value };
        setFormData({
            ...formData,
            product_terms: newTerms
        });
    };

    const handleSubmit = () => {
        if (validate()) {
            const payload: LoanProductFormData = {
                product_code: formData.product_code,
                product_name: formData.product_name,
                product_type: formData.product_type,
                gender_type: formData.gender_type,
                gender: formData.gender_type,
                product_details: formData.product_details,
                term_type: formData.term_type,

                min_amount: Number(formData.min_amount),
                max_amount: Number(formData.max_amount),
                document_fees: Number(formData.document_fees),
                product_terms: formData.product_terms.map(t => ({
                    term: Number(t.term),
                    interest_rate: Number(t.interest_rate)
                })),
                // Map first term to legacy fields for backward compatibility if needed by API
                interest_rate: Number(formData.product_terms[0]?.interest_rate || 0),
                loan_term: Number(formData.product_terms[0]?.term || 0),
                loan_amount: Number(formData.min_amount), // Legacy mapping
                loan_limited_amount: Number(formData.max_amount), // Legacy mapping

                customer_age_limited: formData.customer_age_limited !== '' ? Number(formData.customer_age_limited) : undefined,
                customer_monthly_income: formData.customer_monthly_income !== '' ? Number(formData.customer_monthly_income) : undefined,
                guarantor_monthly_income: formData.guarantor_monthly_income !== '' ? Number(formData.guarantor_monthly_income) : undefined,
            };
            onSave(payload);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-border-default flex flex-col transform scale-100 transition-all my-8">
                {/* Header */}
                <div
                    className="p-6 border-b border-border-divider flex items-center justify-between rounded-t-[2.5rem]"
                    style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[500]}, ${colors.indigo[600]})` }}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight uppercase leading-none">
                                {initialData ? 'Update Scheme' : 'Initialize Scheme'}
                            </h2>
                            <p className="text-white/70 text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Credit Architecture & Governance</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all group active:scale-90">
                        <X className="w-4 h-4 text-white transition-all group-hover:rotate-90" />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar max-h-[75vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Code & Name */}
                        <div className="grid grid-cols-4 gap-4 md:col-span-2">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Product Code *</label>
                                <input
                                    type="text"
                                    value={formData.product_code}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase().slice(0, 4).replace(/[^A-Z]/g, '');
                                        setFormData({ ...formData, product_code: val });
                                    }}
                                    disabled={!!initialData}
                                    className={`w-full px-4 py-3 bg-muted-bg/30 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary uppercase ${errors.product_code ? 'border-rose-500' : 'border-border-divider'} ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="MF"
                                    maxLength={4}
                                />
                                {errors.product_code && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.product_code}</p>}
                            </div>
                            <div className="col-span-3">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    value={formData.product_name}
                                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                    className={`w-full px-4 py-3 bg-muted-bg/30 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary uppercase ${errors.product_name ? 'border-rose-500' : 'border-border-divider'}`}
                                    placeholder="e.g. Micro Business Loan"
                                />
                                {errors.product_name && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.product_name}</p>}
                            </div>
                        </div>

                        <div>
                            <SearchableSelect
                                label="Product Type *"
                                placeholder="Select Product Type"
                                value={formData.product_type}
                                options={[
                                    { id: 'micro_loan', label: 'Micro Loan' },
                                    { id: 'investor_loan', label: 'Investor Loan' },
                                    { id: 'staff_loan', label: 'Staff Loan' },
                                    { id: 'advance_loan', label: 'Advance Loan' },
                                ]}
                                onChange={(val) => setFormData({ ...formData, product_type: val as any })}
                            />
                        </div>

                        <div>
                            <SearchableSelect
                                label="Gender Type *"
                                placeholder="Select Gender Type"
                                value={formData.gender_type}
                                options={[
                                    { id: 'female', label: 'Female Only' },
                                    { id: 'male', label: 'Male Only' },
                                    { id: 'both', label: 'Both (Male & Female)' },
                                ]}
                                onChange={(val) => setFormData({ ...formData, gender_type: val as any })}
                            />
                        </div>

                        <div>
                            <SearchableSelect
                                label="Term Type *"
                                placeholder="Select Term Type"
                                value={formData.term_type}
                                options={[
                                    { id: 'Weekly', label: 'Weekly' },
                                    { id: 'Bi-Weekly', label: 'Bi-Weekly' },
                                    { id: 'Monthly', label: 'Monthly' },
                                ]}
                                onChange={(val) => setFormData({ ...formData, term_type: val as string })}
                            />
                        </div>



                        {/* Loan Amounts (Min/Max) */}
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Loan Min Amount *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.min_amount}
                                onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    setFormData({ ...formData, min_amount: e.target.value === '' ? '' : val });
                                }}
                                className={`w-full px-4 py-3 bg-muted-bg/30 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary ${errors.min_amount ? 'border-rose-500' : 'border-border-divider'}`}
                                placeholder="Min Amount"
                            />
                            {errors.min_amount && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.min_amount}</p>}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Loan Max Amount *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.max_amount}
                                onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    setFormData({ ...formData, max_amount: e.target.value === '' ? '' : val });
                                }}
                                className={`w-full px-4 py-3 bg-muted-bg/30 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary ${errors.max_amount ? 'border-rose-500' : 'border-border-divider'}`}
                                placeholder="Max Amount"
                            />
                            {errors.max_amount && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.max_amount}</p>}
                        </div>

                        {/* Document Fees */}
                        <div>
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Document Fees *</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.document_fees}
                                onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    setFormData({ ...formData, document_fees: e.target.value === '' ? '' : val });
                                }}
                                className={`w-full px-4 py-3 bg-muted-bg/30 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary ${errors.document_fees ? 'border-rose-500' : 'border-border-divider'}`}
                                placeholder="Document Fees"
                            />
                            {errors.document_fees && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.document_fees}</p>}
                        </div>

                        {/* Terms and Interests Dynamic List */}
                        <div className="md:col-span-2 bg-muted-bg/40 rounded-[2rem] p-8 border border-border-divider/50 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-6">
                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest">Terms & Interest Rates</label>
                                <button
                                    type="button"
                                    onClick={handleAddTerm}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary-500/10 border border-primary-500/20 rounded-xl text-[10px] font-black text-primary-500 uppercase tracking-widest hover:bg-primary-500/20 transition-all active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Term
                                </button>
                            </div>

                            {errors.terms && <p className="text-rose-500 text-[10px] mb-4 font-bold">{errors.terms}</p>}

                            <div className="space-y-4">
                                {formData.product_terms.map((term, index) => (
                                    <div key={index} className="flex gap-6 items-start group/term">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={term.term}
                                                    onChange={(e) => {
                                                        const val = Math.max(1, parseInt(e.target.value) || 0);
                                                        handleTermChange(index, 'term', e.target.value === '' ? '' : val.toString());
                                                    }}
                                                    className={`w-full px-4 py-3 bg-card border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all text-text-primary ${errors[`term_${index}`] ? 'border-rose-500' : 'border-border-divider'}`}
                                                    placeholder="Term"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase tracking-widest pointer-events-none opacity-40">
                                                    {formData.term_type}s
                                                </span>
                                            </div>
                                            {errors[`term_${index}`] && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors[`term_${index}`]}</p>}
                                        </div>

                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={term.interest_rate}
                                                    onChange={(e) => {
                                                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                                                        handleTermChange(index, 'interest_rate', e.target.value === '' ? '' : val.toString());
                                                    }}
                                                    className={`w-full px-4 py-3 bg-card border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all text-text-primary ${errors[`interest_${index}`] ? 'border-rose-500' : 'border-border-divider'}`}
                                                    placeholder="Interest Rate"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase tracking-widest pointer-events-none opacity-40">
                                                    %
                                                </span>
                                            </div>
                                            {errors[`interest_${index}`] && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors[`interest_${index}`]}</p>}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTerm(index)}
                                            disabled={formData.product_terms.length === 1}
                                            className={`p-3 rounded-xl transition-all ${formData.product_terms.length === 1 ? 'opacity-20 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-500/10 active:scale-95'}`}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Constraints */}
                        {formData.product_type === 'micro_loan' && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border-divider">
                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Min Customer Age</label>
                                    <input
                                        type="number"
                                        min="18"
                                        value={formData.customer_age_limited}
                                        onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setFormData({ ...formData, customer_age_limited: e.target.value === '' ? '' : val });
                                        }}
                                        className="w-full px-4 py-3 bg-muted-bg/30 border border-border-divider rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Min Monthly Income</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.customer_monthly_income}
                                        onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setFormData({ ...formData, customer_monthly_income: e.target.value === '' ? '' : val });
                                        }}
                                        className={`w-full px-4 py-3 bg-muted-bg/30 border ${errors.customer_monthly_income ? 'border-rose-500' : 'border-border-divider'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary`}
                                    />
                                    {errors.customer_monthly_income && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.customer_monthly_income}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Min Guarantor Income</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.guarantor_monthly_income}
                                        onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setFormData({ ...formData, guarantor_monthly_income: e.target.value === '' ? '' : val });
                                        }}
                                        className={`w-full px-4 py-3 bg-muted-bg/30 border ${errors.guarantor_monthly_income ? 'border-rose-500' : 'border-border-divider'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary`}
                                    />
                                    {errors.guarantor_monthly_income && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.guarantor_monthly_income}</p>}
                                </div>
                            </div>
                        )}

                        {/* Product Details */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Product Details</label>
                            <textarea
                                value={formData.product_details}
                                onChange={(e) => setFormData({ ...formData, product_details: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-muted-bg/30 border border-border-divider rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm transition-all text-text-primary uppercase"
                                placeholder="Describe the loan product..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-divider flex gap-4 justify-end bg-muted-bg/30 backdrop-blur-3xl sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-transparent border border-border-divider rounded-xl hover:bg-muted transition-all font-black text-[9px] uppercase tracking-[0.25em] text-text-secondary active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-12 py-4 bg-primary-600 text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 shadow-2xl shadow-primary-500/40 hover:bg-primary-500 hover:shadow-primary-500/60"
                    >
                        {initialData ? 'Update' : 'Create Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}
