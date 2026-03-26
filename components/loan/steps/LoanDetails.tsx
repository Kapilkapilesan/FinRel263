'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, ChevronDown, DollarSign, HandCoins, TrendingUp, LayoutList, Calendar, Landmark, MapPin, Award } from 'lucide-react';
import { LoanFormData } from '@/types/loan.types';
import { LoanProduct } from '@/types/loan-product.types';
import { BANK_VALIDATION_RULES } from '@/constants/loan.constants';
import { colors } from '@/themes/colors';
import { bankService } from '@/services/bank.service';
import { Bank, BankBranch } from '@/types/bank.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface LoanDetailsProps {
    formData: LoanFormData;
    loanProducts: LoanProduct[];
    onFieldChange: (field: keyof LoanFormData, value: string) => void;
    customerActiveLoans?: number[];
    isEditMode?: boolean;
    isLockedFromStep1?: boolean;
}

export const LoanDetails: React.FC<LoanDetailsProps> = ({
    formData,
    loanProducts,
    onFieldChange,
    customerActiveLoans = [],
    isEditMode = false,
    isLockedFromStep1 = false
}) => {
    const selectedProduct = loanProducts.find(p => p.id === Number(formData.loanProduct));

    // Helper: convert term value to weeks based on term_type
    const getWeeksMultiplier = (termType?: string): number => {
        if (!termType) return 1;
        const t = termType.toLowerCase();
        if (t.includes('month')) return 4;       // 1 month ≈ 4 weeks
        if (t.includes('bi')) return 2;           // 1 bi-week = 2 weeks
        return 1;                                  // weekly = 1 week
    };
    const isAlreadyTaken = customerActiveLoans.includes(Number(formData.loanProduct));

    const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
    const [accountMismatch, setAccountMismatch] = useState(false);
    const [isRentalTypeOpen, setIsRentalTypeOpen] = useState(false);
    const rentalTypeRef = useRef<HTMLDivElement>(null);
    const [isLoanProductOpen, setIsLoanProductOpen] = useState(false);
    const loanProductRef = useRef<HTMLDivElement>(null);

    const [banks, setBanks] = useState<Bank[]>([]);
    const [branches, setBranches] = useState<BankBranch[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    // Fetch banks on mount
    useEffect(() => {
        const fetchBanks = async () => {
            setIsLoadingBanks(true);
            try {
                const data = await bankService.getBanks();
                setBanks(data);
            } catch (error) {
                console.error('Failed to fetch banks:', error);
            } finally {
                setIsLoadingBanks(false);
            }
        };
        fetchBanks();
    }, []);

    // Fetch branches when bankId changes
    useEffect(() => {
        const fetchBranches = async () => {
            if (!formData.bankId) {
                setBranches([]);
                return;
            }
            setIsLoadingBranches(true);
            try {
                const data = await bankService.getBankBranches(Number(formData.bankId));
                setBranches(data.branches || []);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            } finally {
                setIsLoadingBranches(false);
            }
        };
        fetchBranches();
    }, [formData.bankId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (rentalTypeRef.current && !rentalTypeRef.current.contains(event.target as Node)) {
                setIsRentalTypeOpen(false);
            }
            if (loanProductRef.current && !loanProductRef.current.contains(event.target as Node)) {
                setIsLoanProductOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleConfirmChange = (val: string) => {
        setConfirmAccountNumber(val);
        setAccountMismatch(val !== formData.accountNumber);
    };

    const getAccountValidationError = () => {
        if (!formData.bankName || !formData.accountNumber) return null;
        const rule = BANK_VALIDATION_RULES[formData.bankName] || BANK_VALIDATION_RULES['Default'];
        if (!rule.regex.test(formData.accountNumber)) {
            return rule.error;
        }
        return null;
    };

    const accountError = getAccountValidationError();

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-5 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Loan Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-primary-500/5 dark:bg-muted-bg/10 rounded-[2rem] border border-border-default p-3 transition-colors">
                <div className="col-span-2 space-y-0.5" ref={loanProductRef}>
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-[0.2em] px-1">
                        <CreditCard className="w-4 h-4 text-primary-500" />
                        Loan Product *
                    </label>
                    <div className="relative group/select">
                            <div
                                onClick={() => !isLockedFromStep1 && setIsLoanProductOpen(!isLoanProductOpen)}
                                className={`w-full pl-6 pr-12 py-2 bg-primary-500/5 border-2 rounded-2xl focus-within:ring-4 transition-all text-sm font-black tracking-tight flex items-center justify-between uppercase ${isLockedFromStep1 ? 'border-primary-500/30 text-text-primary opacity-60 cursor-not-allowed shadow-inner' : 'border-border-divider text-text-muted cursor-pointer'}`}
                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                        >
                            <span className="truncate uppercase">
                                {selectedProduct ? `${selectedProduct.product_name} ${customerActiveLoans.includes(selectedProduct.id) && !isEditMode ? '(ACTIVE)' : ''}` : 'Select a product'}
                            </span>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isLoanProductOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                        </div>
                        {isLoanProductOpen && !isLockedFromStep1 && (
                            <div className="absolute z-50 w-full mt-2 bg-card border border-border-divider/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                                    {loanProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => {
                                                onFieldChange('loanProduct', String(product.id));
                                                setIsLoanProductOpen(false);
                                            }}
                                            className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all mb-1 font-black uppercase ${String(formData.loanProduct) === String(product.id) ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'hover:bg-muted-bg'}`}
                                        >
                                            {product.product_name} {customerActiveLoans.includes(product.id) && !isEditMode ? '(ACTIVE)' : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {isLockedFromStep1 && (
                        <p className="text-[9px] mt-2 px-2 font-black uppercase tracking-widest italic text-primary-500 opacity-60 flex items-center gap-2">
                            ✓ Product Locked from Step 1
                        </p>
                    )}
                    {isAlreadyTaken && selectedProduct && !isEditMode && (
                        <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-pulse">
                            <div className="w-2 h-2 bg-rose-500 rounded-full" />
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                Active {selectedProduct.product_name} loan detected
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-0.5">
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                        <DollarSign className="w-3.5 h-3.5 text-primary-500" />
                        Requested Amount (LKR) *
                    </label>
                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted/40 group-focus-within:text-primary-500 font-black text-sm transition-colors">LKR</div>
                            <input
                                type="number"
                                value={formData.requestedAmount ?? ''}
                                onChange={(e) => onFieldChange('requestedAmount', e.target.value)}
                                className="w-full pl-14 pr-6 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-2xl focus:outline-none focus:ring-4 transition-all text-base font-black tracking-tight text-text-primary placeholder:text-text-muted/20"
                                style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-[10px] text-text-muted/60 mt-1 px-2 font-black uppercase tracking-widest italic opacity-40">
                            Customer requested initial amount
                        </p>
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                        <HandCoins className="w-3.5 h-3.5 text-primary-500" />
                        Approved Amount *
                    </label>
                    <div className="space-y-1">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-text-muted/40 group-focus-within:text-primary-500 font-black text-sm transition-colors">LKR</div>
                            <input
                                type="number"
                                value={formData.loanAmount ?? ''}
                                onChange={(e) => onFieldChange('loanAmount', e.target.value)}
                                className="w-full pl-14 pr-6 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-base font-black tracking-tight text-text-primary placeholder:text-text-muted/20"
                                placeholder="0.00"
                            />
                        </div>
                        <p className="text-[10px] text-text-muted/60 mt-1 px-2 font-black uppercase tracking-widest italic opacity-40">
                            Product Range: LKR {(selectedProduct?.loan_amount || 0).toLocaleString()} - {(selectedProduct?.loan_limited_amount || 500000).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        Interest Rate (%) *
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            value={formData.interestRate ?? ''}
                            readOnly
                            className="w-full px-6 py-2 bg-primary-500/10 border-2 border-border-divider/50 rounded-2xl text-base font-black text-text-primary cursor-not-allowed shadow-inner"
                        />
                        <p className="text-[9px] mt-2 px-2 font-black uppercase tracking-widest italic text-primary-500 opacity-60">
                            {selectedProduct?.product_terms && selectedProduct.product_terms.length > 0 ? 'Linked to selected term' : 'Locked: Loan product default'}
                        </p>
                    </div>
                </div>

                <div className="space-y-0.5" ref={rentalTypeRef}>
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                        <LayoutList className="w-3.5 h-3.5 text-primary-500" />
                        Rental Type *
                    </label>
                    <div className="relative group/select">
                        {selectedProduct?.product_terms && selectedProduct.product_terms.length > 0 ? (
                            <>
                                <div
                                    onClick={() => setIsRentalTypeOpen(!isRentalTypeOpen)}
                                    className={`w-full pl-6 pr-12 py-2 bg-primary-500/5 border-2 rounded-2xl focus-within:ring-4 transition-all text-sm font-black tracking-tight flex items-center justify-between uppercase cursor-pointer ${formData.tenure ? 'border-primary-500/30 text-text-primary' : 'border-border-divider/50 text-text-muted'}`}
                                    style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                >
                                    <span className="truncate uppercase">
                                        {formData.tenure ? `${String(Number(formData.tenure) / getWeeksMultiplier(selectedProduct.term_type))} ${selectedProduct.term_type || 'Months'}` : 'Select Term'}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isRentalTypeOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                                </div>
                                {isRentalTypeOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-card border border-border-divider/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                                            {selectedProduct.product_terms.map((term, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        const selectedTermValue = String(term.term);
                                                        onFieldChange('interestRate', term.interest_rate.toString());

                                                        const multiplier = getWeeksMultiplier(selectedProduct.term_type);
                                                        const tenureWeeks = Number(selectedTermValue) * multiplier;
                                                        onFieldChange('tenure', tenureWeeks.toString());

                                                        const termType = selectedProduct.term_type?.toLowerCase() || '';
                                                        if (termType.includes('month')) {
                                                            onFieldChange('rentalType', 'Monthly');
                                                        } else if (termType.includes('bi')) {
                                                            onFieldChange('rentalType', 'Bi-Weekly');
                                                        } else {
                                                            onFieldChange('rentalType', 'Weekly');
                                                        }
                                                        setIsRentalTypeOpen(false);
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all mb-1 font-black uppercase ${String(formData.tenure) === String(Number(term.term) * getWeeksMultiplier(selectedProduct.term_type)) ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'hover:bg-muted-bg text-text-primary'}`}
                                                >
                                                    {term.term} {selectedProduct.term_type || 'Months'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <input
                                type="text"
                                value={formData.rentalType ?? ''}
                                readOnly
                                className="w-full px-6 py-2 bg-primary-500/10 border-2 border-border-divider/50 rounded-2xl text-base font-black text-text-primary cursor-not-allowed shadow-inner"
                            />
                        )}
                    </div>
                    {selectedProduct?.product_terms && selectedProduct.product_terms.length > 0 && (
                        <p className="text-[9px] text-primary-500 mt-2 px-2 font-black uppercase tracking-widest italic opacity-60">
                            Select term to set interest rate
                        </p>
                    )}
                </div>

                <div className="col-span-2 md:col-span-1 space-y-0.5">
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        Tenure (Weeks) *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.tenure ? `${formData.tenure} Weeks` : ''}
                            readOnly
                            className="w-full px-6 py-2 bg-primary-500/10 border-2 border-border-divider/50 rounded-2xl text-base font-black text-text-primary cursor-not-allowed shadow-inner uppercase"
                            placeholder="Auto-calculated from Rental Type"
                        />
                    </div>
                    <p className="text-[9px] mt-1 px-2 font-black uppercase tracking-widest italic text-primary-500 opacity-60">
                        Auto-calculated from rental type selection
                    </p>
                </div>

                <div className="col-span-2 flex items-center justify-center pt-2 border-t border-dashed border-border-divider/50">
                    <button
                        type="button"
                        onClick={() => {
                            const amount = Number(formData.loanAmount);
                            const interest = Number(formData.interestRate);
                            const tenureWeeks = Number(formData.tenure);
                            if (amount && interest && tenureWeeks) {
                                const total = amount + (amount * (interest / 100));
                                // Divide by number of installments (original term), not weeks
                                const multiplier = getWeeksMultiplier(selectedProduct?.term_type);
                                const installments = tenureWeeks / multiplier;
                                const rental = (total / installments).toFixed(2);
                                onFieldChange('calculated_rental', rental);
                            }
                        }}
                        className={`group relative flex items-center gap-3 px-10 py-2.5 text-white rounded-[2rem] transition-all transform hover:-translate-y-1 active:scale-95 font-black uppercase tracking-[0.2em] text-[11px] overflow-hidden ${!formData.calculated_rental && formData.loanAmount && formData.tenure && formData.interestRate ? 'ring-4 ring-primary-500/20' : ''}`}
                        style={{ backgroundColor: colors.primary[600], boxShadow: `0 20px 40px -12px ${colors.primary[600]}66` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <TrendingUp className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">
                            {formData.calculated_rental ? 'Recalculate Rental' : 'Calculate Rental'}
                        </span>
                    </button>
                </div>

                {formData.calculated_rental && (
                    <div className="col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div
                            className="p-4 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group/rental transition-all hover:shadow-primary-500/20"
                            style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[800]})`, boxShadow: `0 30px 60px -12px ${colors.primary[600]}4D` } as any}
                        >
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform duration-1000 group-hover/rental:scale-150" />
                            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl transition-transform duration-1000 group-hover/rental:scale-150" />

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-2">
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1 ml-1">
                                        {selectedProduct?.term_type ? `${selectedProduct.term_type} Rental` : 'Rental'}
                                    </p>
                                    <h3 className="text-4xl font-black tabular-nums tracking-tighter">
                                        <span className="text-2xl opacity-60 mr-2">LKR</span>
                                        {Number(formData.calculated_rental).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-40 italic">
                                        Calculated amount per {selectedProduct?.term_type?.toLowerCase()?.replace('ly', '') || 'installment'}
                                    </p>
                                </div>
                                <div className="text-center md:text-right bg-black/10 backdrop-blur-md p-3 rounded-[2rem] border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">Total Payable</p>
                                    <p className="text-2xl font-black tabular-nums tracking-tight">
                                        LKR {(Number(formData.loanAmount) + (Number(formData.loanAmount) * (Number(formData.interestRate) / 100))).toLocaleString()}
                                    </p>
                                    <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-primary-400 w-full animate-progress-dna shadow-[0_0_10px_rgba(0,132,209,0.5)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-2 border-t border-border-divider/30">
                <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-1.5 h-5 bg-primary-500 rounded-full" />
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Bank Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-primary-500/5 dark:bg-muted-bg/5 p-3 rounded-[2rem] border border-border-divider/50 shadow-inner">
                    <div className="col-span-2 md:col-span-1">
                        <SearchableSelect
                            label="Bank Name *"
                            options={banks.map(bank => ({
                                id: bank.id,
                                label: bank.bank_name,
                                subLabel: bank.bank_code
                            }))}
                            value={formData.bankId}
                            onChange={(val) => {
                                const bankId = val?.toString() || '';
                                const bankName = banks.find(b => b.id.toString() === bankId)?.bank_name || '';
                                onFieldChange('bankId', bankId);
                                onFieldChange('bankName', bankName);
                                onFieldChange('bankBranch', ''); // Clear branch Name
                                onFieldChange('bankBranchId', ''); // Clear branch ID
                            }}
                            placeholder="Select Bank"
                            searchPlaceholder="Search banks by name or code..."
                            isLoading={isLoadingBanks}
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <SearchableSelect
                            label="Bank Branch *"
                            options={branches.map(branch => ({
                                id: branch.id,
                                label: branch.branch_name,
                                subLabel: branch.branch_code
                            }))}
                            value={formData.bankBranchId}
                            onChange={(val) => {
                                const branchId = val?.toString() || '';
                                const branchName = branches.find(b => b.id.toString() === branchId)?.branch_name || '';
                                onFieldChange('bankBranchId', branchId);
                                onFieldChange('bankBranch', branchName);
                            }}
                            disabled={!formData.bankId}
                            placeholder={!formData.bankId ? 'Select Bank First' : 'Select Branch'}
                            searchPlaceholder="Search branches by name or code..."
                            isLoading={isLoadingBranches}
                        />
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[11px] font-black text-text-primary/70 uppercase tracking-[0.2em] px-1">
                            Account Number *
                        </label>
                        <input
                            type="text"
                            value={formData.accountNumber ?? ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                onFieldChange('accountNumber', val);
                                if (confirmAccountNumber) setAccountMismatch(val !== confirmAccountNumber);
                            }}
                            onPaste={(e) => e.preventDefault()}
                            className={`w-full px-6 py-2 border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm font-black tracking-tight text-text-primary placeholder:text-text-muted/20 ${accountError ? 'border-rose-500/50 bg-rose-500/5' : 'bg-primary-500/5 border-border-divider/50'}`}
                            placeholder="Enter Account Number"
                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                        />
                        {accountError && (
                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1.5 px-1">{accountError}</p>
                        )}
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[11px] font-black text-text-primary/70 uppercase tracking-[0.2em] px-1">
                            Confirm Account Number *
                        </label>
                        <input
                            type="text"
                            value={confirmAccountNumber}
                            onChange={(e) => handleConfirmChange(e.target.value)}
                            onPaste={(e) => e.preventDefault()}
                            className={`w-full px-6 py-2 border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm font-black tracking-tight text-text-primary placeholder:text-text-muted/20 ${accountMismatch ? 'border-rose-500/50 bg-rose-500/5' : 'bg-primary-500/5 border-border-divider/50'}`}
                            placeholder="Confirm Account Number"
                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                        />
                        {accountMismatch && (
                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1.5 px-1 animate-pulse">Account numbers do not match</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-2 border-t border-border-divider/30">
                <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-1.5 h-5 bg-primary-500 rounded-full" />
                    <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Fees & Charges</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-primary-500/5 dark:bg-muted-bg/5 p-3 rounded-[2rem] border border-border-divider/50">
                    <div className="space-y-0.5">
                        <label className="text-[11px] font-black text-text-primary/70 uppercase tracking-[0.2em] px-1">
                            Processing Fee
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={Number(formData.processingFee).toLocaleString()}
                                readOnly
                                className="w-full px-6 py-2 bg-primary-500/10 border-2 border-border-divider/50 rounded-2xl text-base font-black text-text-primary shadow-inner cursor-not-allowed"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {Number(formData.tenure) <= 48 ? '4%' : '6%'}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-[11px] font-black text-text-primary/70 uppercase tracking-[0.2em] px-1">
                            Documentation Fee (LKR)
                        </label>
                        <input
                            type="text"
                            value={formData.documentationFee ?? ''}
                            readOnly
                            className="w-full px-6 py-2 bg-primary-500/10 border-2 border-border-divider/50 rounded-2xl text-base font-black text-text-primary shadow-inner cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Reloan Summary Box */}
                {(formData.reloan_deduction_amount ?? 0) > 0 && (
                    <div className="mt-4 p-4 bg-amber-500/5 dark:bg-amber-500/10 border-2 border-amber-500/20 rounded-[2.5rem] relative overflow-hidden group/summary">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="flex items-center gap-4 mb-1.5">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                            </div>
                            <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] italic">Net Payout Summary</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center group/row">
                                <span className="text-[11px] font-black text-text-muted uppercase tracking-widest opacity-60">Loan Amount</span>
                                <span className="font-black text-text-primary text-sm tabular-nums tracking-tight transition-transform group-hover/row:translate-x-[-4px]">
                                    LKR {Number(formData.loanAmount).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center group/row">
                                <span className="text-[11px] font-black text-rose-500/70 uppercase tracking-widest italic">Total Fees</span>
                                <span className="font-black text-rose-500 text-sm tabular-nums tracking-tight bg-rose-500/10 px-3 py-1 rounded-lg">
                                    - LKR {(Number(formData.processingFee) + Number(formData.documentationFee)).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center group/row">
                                <span className="text-[11px] font-black text-amber-500/70 uppercase tracking-widest italic">Reloan Deduction</span>
                                <span className="font-black text-amber-500 text-sm tabular-nums tracking-tight bg-amber-500/10 px-3 py-1 rounded-lg">
                                    - LKR {Number(formData.reloan_deduction_amount).toLocaleString()}
                                </span>
                            </div>

                            <div className="h-[2px] bg-border-divider/30 my-1.5 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Net Disbursable Cash</p>
                                    <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest italic">Actual amount to be paid</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black tabular-nums tracking-tighter text-primary-500 drop-shadow-[0_0_15px_rgba(0,132,209,0.2)]">
                                        LKR {(Number(formData.loanAmount) - (Number(formData.processingFee) + Number(formData.documentationFee) + Number(formData.reloan_deduction_amount))).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-2 border-t border-border-divider/30">
                <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1.5 h-4 bg-primary-500 rounded-full" />
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">Remarks</h3>
                </div>
                <div className="relative group/textarea">
                    <textarea
                        value={formData.remarks ?? ''}
                        onChange={(e) => onFieldChange('remarks', e.target.value)}
                        rows={1}
                        className="w-full px-5 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-2xl focus:outline-none focus:ring-4 transition-all resize-none text-sm font-black tracking-tight text-text-primary placeholder:text-text-muted/20 uppercase"
                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                        placeholder="Enter any additional remarks..."
                    />
                    <div className="absolute right-4 bottom-3 text-[9px] font-black text-text-muted/40 uppercase tracking-widest italic group-focus-within/textarea:text-primary-500 transition-colors">
                        Remarks (Optional)
                    </div>
                </div>
            </div>
        </div >
    );
};
