'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, TrendingUp, UserCheck, ShieldAlert, Clock, Wallet, BarChart3, Tag, Plus, CheckCircle2, Info, AlertCircle, Search, ChevronRight, User, DollarSign, Save, Calendar, Landmark } from 'lucide-react';
import { toast } from 'react-toastify';
import { investmentService } from '@/services/investment.service';
import { Nominee, Witness } from '@/types/investment.types';
import { InvestmentProduct, InterestRateTier } from '@/types/investment-product.types';
import { customerService } from '@/services/customer.service';
import { Customer } from '@/types/customer.types';
import { staffService } from '@/services/staff.service';
import { Staff } from '@/types/staff.types';
import { authService } from '@/services/auth.service';
import { colors } from '@/themes/colors';
import { validateInvestmentForm, validateInvestmentAmount, findTierByTerm } from '@/utils/investment.utils';
import { bankService } from '@/services/bank.service';
import { Bank, BankBranch } from '@/types/bank.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { BANK_VALIDATION_RULES } from '@/constants/loan.constants';
import { ProgressSteps } from '@/components/loan/shared/ProgressSteps';
import { StepNavigation } from '@/components/loan/shared/StepNavigation';

export function InvestmentCreate() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState<InvestmentProduct[]>([]);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [formData, setFormData] = useState({
        product_id: '',
        customer_id: '',
        amount: '',
        policy_term: '',
        start_date: new Date().toISOString().split('T')[0],
        nominees: [] as Nominee[],
        witnesses: [
            { staff_id: '', name: '', nic: '', address: '' },
            { staff_id: '', name: '', nic: '', address: '' }
        ] as Witness[],
        negotiation_rate: '0',
        payout_type: 'MATURITY',
        bank_details: {
            bank_id: '',
            bank_name: '',
            branch_id: '',
            branch: '',
            account_number: '',
            holder_name: ''
        }
    });

    const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
    const [accountMismatch, setAccountMismatch] = useState(false);

    const [banks, setBanks] = useState<Bank[]>([]);
    const [branches, setBranches] = useState<BankBranch[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
    const [selectedTier, setSelectedTier] = useState<InterestRateTier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showTermDropdown, setShowTermDropdown] = useState(false);

    const steps = [
        { number: 1, title: 'Investor Selection', description: 'Search and select customer', icon: <User className="w-4 h-4" style={{ color: colors.primary[600] }} /> },
        { number: 2, title: 'Investment Details', description: 'Product, terms and amount', icon: <DollarSign className="w-4 h-4" style={{ color: colors.primary[600] }} /> },
        { number: 3, title: 'Relationships', description: 'Nominees and witnesses', icon: <UserCheck className="w-4 h-4" style={{ color: colors.primary[600] }} /> },
        { number: 4, title: 'Target Disbursement', description: 'Bank account details', icon: <Landmark className="w-4 h-4" style={{ color: colors.primary[600] }} /> }
    ];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [productsRes, staffRes] = await Promise.all([
                    investmentService.getProducts(),
                    staffService.getWitnessCandidates().catch(() => [])
                ]);
                setProducts(productsRes);
                setStaffs(staffRes || []);

                // Optionally, pre-fill Witness 1 with the current user, just like Loan creation
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    const currentStaffId = currentUser.staff_id || currentUser.user_name;
                    const matchedStaff = (staffRes || []).find((s: Staff) => s.staff_id === currentStaffId);
                    if (matchedStaff) {
                        setFormData(prev => {
                            const newWitnesses = [...prev.witnesses];
                            if (newWitnesses.length > 0) {
                                newWitnesses[0] = {
                                    staff_id: matchedStaff.staff_id,
                                    name: matchedStaff.full_name,
                                    nic: matchedStaff.nic,
                                    address: matchedStaff.address
                                };
                            }
                            return { ...prev, witnesses: newWitnesses };
                        });
                    }
                }
            } catch (error) {
                toast.error('Failed to load initial data');
            }
        };
        fetchInitialData();
    }, []);

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

    // Fetch branches when bank_id changes
    useEffect(() => {
        const fetchBranches = async () => {
            if (!formData.bank_details.bank_id) {
                setBranches([]);
                return;
            }
            setIsLoadingBranches(true);
            try {
                const data = await bankService.getBankBranches(Number(formData.bank_details.bank_id));
                setBranches(data.branches || []);
            } catch (error) {
                console.error('Failed to fetch branches:', error);
            } finally {
                setIsLoadingBranches(false);
            }
        };
        fetchBranches();
    }, [formData.bank_details.bank_id]);

    useEffect(() => {
        // Set searching to true immediately when typing starts (if >= 3 chars)
        if (searchTerm.trim().length >= 3) {
            setIsSearching(true);
        } else {
            setIsSearching(false);
            setCustomers([]);
        }

        const delayDebounceFn = setTimeout(async () => {
            const trimmedTerm = searchTerm.trim();
            if (trimmedTerm.length >= 3) {
                try {
                    const results = await customerService.globalSearch(trimmedTerm);
                    setCustomers(results);
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setIsSearching(false);
                }
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const filteredCustomers = customers; // Already filtered by API

    const handleCustomerSelect = (customer: Customer) => {
        // Investments can be created for any customer regardless of branch/scope
        setSelectedCustomer(customer);
        setFormData(prev => ({
            ...prev,
            customer_id: String(customer.id),
            bank_details: {
                ...prev.bank_details,
                holder_name: customer.full_name
            }
        }));
        setSearchTerm('');
        setIsSearching(false);
    };

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === Number(productId));
        setSelectedProduct(product || null);
        setSelectedTier(null);
        setFormData(prev => ({ ...prev, product_id: productId, policy_term: '' }));
    };

    const handleTermChange = (termMonths: string) => {
        if (!selectedProduct) return;
        const tier = findTierByTerm(Number(termMonths), selectedProduct);
        setSelectedTier(tier || null);
        setFormData(prev => ({ ...prev, policy_term: termMonths }));
    };

    const addNominee = () => {
        setFormData(prev => ({
            ...prev,
            nominees: [...prev.nominees, { name: '', id_type: 'NIC', nic: '', relationship: '' }]
        }));
    };

    const updateBankDetail = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            bank_details: {
                ...prev.bank_details,
                [field]: value
            }
        }));
    };

    const handleConfirmChange = (val: string) => {
        setConfirmAccountNumber(val);
        setAccountMismatch(val !== formData.bank_details.account_number);
    };

    const getAccountValidationError = () => {
        if (!formData.bank_details.bank_name || !formData.bank_details.account_number) return null;
        const rule = BANK_VALIDATION_RULES[formData.bank_details.bank_name] || BANK_VALIDATION_RULES['Default'];
        if (!rule.regex.test(formData.bank_details.account_number)) {
            return rule.error;
        }
        return null;
    };

    const accountError = getAccountValidationError();

    const removeNominee = (index: number) => {
        setFormData(prev => ({
            ...prev,
            nominees: prev.nominees.filter((_, i) => i !== index)
        }));
    };

    const updateNominee = (index: number, field: keyof Nominee, value: string) => {
        const newNominees = [...formData.nominees];
        newNominees[index] = { ...newNominees[index], [field]: value };
        setFormData(prev => ({ ...prev, nominees: newNominees }));
    };

    const updateWitness = (index: number, field: keyof Witness, value: string) => {
        const newWitnesses = [...formData.witnesses];
        newWitnesses[index] = { ...newWitnesses[index], [field]: value };
        setFormData(prev => ({ ...prev, witnesses: newWitnesses }));
    };

    const addWitness = () => {
        setFormData(prev => ({
            ...prev,
            witnesses: [...prev.witnesses, { staff_id: '', name: '', nic: '', address: '' }]
        }));
    };

    const removeWitness = (index: number) => {
        if (formData.witnesses.length <= 2) {
            toast.warn('At least two witnesses are recommended for legal documents');
        }
        setFormData(prev => ({
            ...prev,
            witnesses: prev.witnesses.filter((_, i) => i !== index)
        }));
    };

    const validateStep1 = () => {
        if (!selectedCustomer) return 'Please select an Investor.';
        return null;
    };

    const validateStep2 = () => {
        if (!formData.product_id) return 'Please select an Investment Product.';
        if (!formData.policy_term) return 'Please select a Policy Term.';
        if (!formData.amount || Number(formData.amount) <= 0) return 'Please enter a valid Investment Amount.';
        
        if (selectedProduct) {
            const amountValidation = validateInvestmentAmount(Number(formData.amount), selectedProduct);
            if (!amountValidation.isValid) return amountValidation.message;
        }
        return null;
    };

    const validateStep3 = () => {
        for (let i = 0; i < formData.witnesses.length; i++) {
            if (!formData.witnesses[i].staff_id) {
                return `Please select Staff for Witness ${i + 1}`;
            }
        }
        return null;
    };

    const validateStep4 = () => {
        if (!formData.bank_details.bank_id) return 'Financial Institution is required.';
        if (!formData.bank_details.holder_name) return 'Account Holder Name is required.';
        if (!formData.bank_details.account_number) return 'Account Number is required.';
        if (accountError) return accountError;
        if (accountMismatch || confirmAccountNumber !== formData.bank_details.account_number) {
            return 'Account numbers do not match.';
        }
        return null;
    };

    const handleStepClick = (stepNumber: number) => {
        if (stepNumber <= currentStep) {
            setCurrentStep(stepNumber);
            return;
        }

        for (let i = 1; i < stepNumber; i++) {
            let error = null;
            if (i === 1) error = validateStep1();
            if (i === 2) error = validateStep2();
            if (i === 3) error = validateStep3();

            if (error) {
                toast.warning(`Please complete Step ${i} first: ${error}`);
                setCurrentStep(i);
                return;
            }
        }
        setCurrentStep(stepNumber);
    };

    const handleNext = () => {
        let error = null;
        if (currentStep === 1) error = validateStep1();
        else if (currentStep === 2) error = validateStep2();
        else if (currentStep === 3) error = validateStep3();

        if (error) {
            toast.error(error);
            return;
        }
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setIsLoading(true);

        const err1 = validateStep1();
        if (err1) { toast.error(`Step 1: ${err1}`); setCurrentStep(1); setIsLoading(false); return; }

        const err2 = validateStep2();
        if (err2) { toast.error(`Step 2: ${err2}`); setCurrentStep(2); setIsLoading(false); return; }

        const err3 = validateStep3();
        if (err3) { toast.error(`Step 3: ${err3}`); setCurrentStep(3); setIsLoading(false); return; }

        const err4 = validateStep4();
        if (err4) { toast.error(`Step 4: ${err4}`); setCurrentStep(4); setIsLoading(false); return; }

        const validation = validateInvestmentForm(formData);
        if (!validation.isValid) {
            toast.error(validation.errors[0]);
            setIsLoading(false);
            return;
        }

        try {
            await investmentService.createInvestment({
                product_id: formData.product_id,
                customer_id: formData.customer_id,
                amount: formData.amount,
                policy_term: formData.policy_term,
                start_date: formData.start_date,
                nominees: formData.nominees,
                witnesses: formData.witnesses,
                negotiation_rate: formData.negotiation_rate,
                payout_type: formData.payout_type,
                bank_details: formData.bank_details
            });
            toast.success('Investment created successfully');
            // Redirect to list view
            router.push('/investments');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create investment');
        } finally {
            setIsLoading(false);
        }
    };

    const dynamicStyles = `
        .theme-text-primary { color: ${colors.primary[600]}; }
        .theme-text-primary-dark { color: ${colors.primary[700]}; }
        .theme-bg-primary-light { background-color: ${colors.primary[50]}; }
        .theme-bg-primary-soft { background-color: ${colors.primary[100]}; }
        .theme-border-primary-light { border-color: ${colors.primary[100]}; }
        
        .theme-hover-bg-primary-light:hover { background-color: ${colors.primary[50]}; }
        .theme-hover-text-primary:hover { color: ${colors.primary[700]}; }
        
        .theme-focus-within-text-primary:focus-within { color: ${colors.primary[500]}; }
        
        .theme-focus-ring:focus { 
            --tw-ring-color: ${colors.primary[500]}1a; 
            --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
            --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color);
            box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
            border-color: ${colors.primary[300]};
        }
        
        .theme-group-hover-text-primary:hover { color: ${colors.primary[700]}; }
        .group:hover .theme-group-hover-text-primary { color: ${colors.primary[700]}; }
        
        .theme-shadow-glow { box-shadow: 0 10px 15px -3px ${colors.primary[500]}0d; }
    `;

    return (
        <div className="min-h-screen relative overflow-hidden pb-12 bg-app-background">
            <style>{dynamicStyles}</style>
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] rounded-full opacity-15 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
                />
            </div>

            <div className="max-w-7xl mx-auto space-y-6 relative z-10 px-4 md:px-8 pt-10 animate-in fade-in duration-700">
                <div className="flex items-center gap-5">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-105 duration-500"
                        style={{
                            background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                            boxShadow: `0 15px 30px ${colors.primary[600]}40`
                        }}
                    >
                        <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tight">Create New Investment</h1>
                    </div>
                </div>

                <ProgressSteps steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

                <div className="bg-card rounded-[2rem] p-6 border border-border-default shadow-xl transition-colors mt-6">
                    {currentStep === 1 && (
                        <div className="relative z-50 bg-card/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default">
                        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-muted-bg">
                                <User className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                            Investor Selection
                        </h2>
                        {!selectedCustomer ? (
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted theme-focus-within-text-primary transition-colors">
                                    <Search className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-6 py-3.5 rounded-xl border-border-default border-[1.5px] outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 bg-input font-semibold text-sm text-text-primary theme-focus-ring uppercase placeholder:text-text-muted"
                                    placeholder="Search by Name or NIC (Min 3 chars)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {isSearching && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.primary[600], borderTopColor: 'transparent' }}></div>
                                    </div>
                                )}
                                {searchTerm.length >= 3 && customers.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-card border border-border-divider rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-80 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="px-4 py-2 mb-1">
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Found Customers</span>
                                        </div>
                                        {customers.map(customer => (
                                            <button
                                                key={customer.id} type="button"
                                                className="w-full text-left px-4 py-3.5 hover:bg-hover rounded-2xl flex items-center justify-between group transition-all"
                                                onClick={() => handleCustomerSelect(customer)}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold transition-colors text-sm ${customer.is_out_of_scope ? 'text-text-secondary' : 'text-text-primary theme-group-hover-text-primary'}`}>
                                                            {customer.full_name}
                                                        </span>
                                                        {customer.is_out_of_scope && (
                                                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100/50">
                                                                Other Branch
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                                                            NIC: {customer.customer_code} {customer.is_out_of_scope && `• ${customer.branch_name || 'Other Branch'}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-full transition-all transform scale-90 group-hover:scale-100 ${customer.is_out_of_scope ? 'opacity-80 theme-bg-primary-soft theme-text-primary' : 'opacity-0 group-hover:opacity-100 theme-bg-primary-soft theme-text-primary'}`}>
                                                    <Plus className="w-3.5 h-3.5" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searchTerm.length >= 3 && customers.length === 0 && !isSearching && (
                                    <div className="absolute z-50 w-full mt-2 bg-card border border-border-divider rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 rounded-full bg-muted-bg text-text-muted">
                                                <Search className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <p className="font-black text-text-primary tracking-tight text-sm uppercase">No Results Found</p>
                                                <p className="text-[10px] text-text-muted mt-1 font-bold">No customers match "{searchTerm}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-5 rounded-2xl flex items-center justify-between border-border-default border-[1.5px] transition-all animate-in zoom-in-95 bg-hover shadow-lg shadow-black/5 dark:shadow-black/20 theme-shadow-glow">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl theme-bg-primary-soft flex items-center justify-center theme-text-primary">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-black text-text-primary tracking-tight">
                                            {selectedCustomer.full_name}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest theme-text-primary px-2 py-0.5 bg-card rounded-md border border-primary-100">
                                                NIC: {selectedCustomer.customer_code}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-border-default" />
                                                Phone: {selectedCustomer.mobile_no_1 || 'N/A'}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-border-default" />
                                                Branch: {selectedCustomer.branch?.branch_code || 'Central'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCustomer(null)}
                                    className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-card theme-text-primary theme-border-primary-light border hover:shadow-md"
                                >
                                    Change Customer
                                </button>
                            </div>
                        )}
                    </div>
                    )}

                    {currentStep === 2 && (
                        <div className="relative z-40 bg-card/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default">
                        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-muted-bg">
                                <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                            Investment Configuration
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Select Investment Product</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowProductDropdown(!showProductDropdown)}
                                        className="w-full px-5 py-3.5 rounded-xl border-border-default border-[1.5px] outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 bg-input font-bold text-text-primary text-sm flex items-center justify-between theme-focus-ring uppercase"
                                    >
                                        <span>{selectedProduct ? selectedProduct.name : 'Select Investment Product'}</span>
                                        <ChevronRight className={`w-4 h-4 text-text-muted transition-transform duration-300 ${showProductDropdown ? 'rotate-90' : ''}`} />
                                    </button>

                                    {showProductDropdown && (
                                        <div className="absolute z-[100] w-full mt-2 bg-card border border-border-divider rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {products.length > 0 ? products.map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleProductChange(String(p.id));
                                                        setShowProductDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 rounded-xl transition-all hover:bg-hover hover:text-text-primary font-bold text-sm text-text-secondary"
                                                >
                                                    {p.name}
                                                </button>
                                            )) : (
                                                <div className="px-4 py-3 text-xs text-text-muted font-bold italic uppercase tracking-widest text-center">No products found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedProduct && (
                                <div className="col-span-2 space-y-3">
                                    <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Choose Interest Payout Method</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'MATURITY', label: 'At Maturity', sub: 'Lump sum at end', icon: Calendar },
                                            { id: 'MONTHLY', label: 'Monthly Interest', sub: 'Regular monthly income', icon: Info }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, payout_type: opt.id as any }))}
                                                className="flex items-center gap-4 p-4 rounded-xl border-[1.5px] transition-all text-left group"
                                                style={{
                                                    borderColor: formData.payout_type === opt.id ? colors.primary[400] : 'var(--border-default)',
                                                    backgroundColor: formData.payout_type === opt.id ? colors.primary[50] + '33' : 'var(--card-bg)',
                                                    boxShadow: formData.payout_type === opt.id ? `0 8px 16px ${colors.primary[500]}10` : 'none'
                                                }}
                                            >
                                                <div
                                                    className="p-2.5 rounded-lg transition-all"
                                                    style={{
                                                        backgroundColor: formData.payout_type === opt.id ? colors.primary[600] : 'var(--muted-bg)',
                                                        color: formData.payout_type === opt.id ? colors.white : 'var(--text-muted)'
                                                    }}
                                                >
                                                    <opt.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-xs tracking-tight uppercase" style={{ color: formData.payout_type === opt.id ? colors.primary[700] : 'var(--text-primary)' }}>{opt.label}</p>
                                                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-0.5">{opt.sub}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProduct && (
                                <>
                                    <div>
                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Available Terms (Months)</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowTermDropdown(!showTermDropdown)}
                                                className="w-full px-5 py-3.5 rounded-xl border-border-default border-[1.5px] outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 bg-input font-bold text-text-primary text-sm flex items-center justify-between theme-focus-ring uppercase"
                                            >
                                                <span>{formData.policy_term ? `${formData.policy_term} Months` : 'Select Term'}</span>
                                                <ChevronRight className={`w-4 h-4 text-text-muted transition-transform duration-300 ${showTermDropdown ? 'rotate-90' : ''}`} />
                                            </button>

                                            {showTermDropdown && (
                                                <div className="absolute z-[100] w-full mt-2 bg-card border border-border-divider rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {selectedProduct.interest_rates_json.map(tier => (
                                                        <button
                                                            key={tier.term_months}
                                                            type="button"
                                                            onClick={() => {
                                                                handleTermChange(String(tier.term_months));
                                                                setShowTermDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 rounded-xl transition-all hover:bg-hover hover:text-text-primary font-bold text-sm text-text-secondary uppercase"
                                                        >
                                                            {tier.term_months} Months
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Start Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full px-5 py-3.5 rounded-xl border-border-default border-[1.5px] outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 bg-muted-bg/50 font-bold text-text-primary text-sm cursor-not-allowed opacity-80"
                                                value={formData.start_date}
                                                disabled
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    {/* Snapshot Rates Card */}
                                    <div className="col-span-2 p-5 bg-muted-bg/50 rounded-2xl border border-border-default grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div
                                            className="flex flex-col p-3 rounded-xl transition-all border border-transparent shadow-sm"
                                            style={{
                                                backgroundColor: formData.payout_type === 'MONTHLY' ? colors.primary[600] : 'var(--card-bg)',
                                                borderColor: formData.payout_type === 'MONTHLY' ? 'transparent' : 'var(--border-divider)'
                                            }}
                                        >
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${formData.payout_type === 'MONTHLY' ? 'text-white/60' : 'text-text-muted'}`}>Monthly Rate</span>
                                            <span className={`font-black tracking-tighter ${formData.payout_type === 'MONTHLY' ? 'text-white text-xl' : 'text-text-primary text-lg'}`}>{selectedTier?.interest_monthly ?? '--'}%</span>
                                        </div>
                                        <div
                                            className="flex flex-col p-3 rounded-xl transition-all border border-transparent shadow-sm"
                                            style={{
                                                backgroundColor: formData.payout_type === 'MATURITY' ? colors.primary[600] : 'var(--card-bg)',
                                                borderColor: formData.payout_type === 'MATURITY' ? 'transparent' : 'var(--border-divider)'
                                            }}
                                        >
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${formData.payout_type === 'MATURITY' ? 'text-white/60' : 'text-text-muted'}`}>Maturity Rate</span>
                                            <span className={`font-black tracking-tighter ${formData.payout_type === 'MATURITY' ? 'text-white text-xl' : 'text-text-primary text-lg'}`}>{selectedTier?.interest_maturity ?? '--'}%</span>
                                        </div>
                                        <div className="flex flex-col p-3 bg-card rounded-xl border border-border-divider shadow-sm">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Break Monthly</span>
                                            <span className="font-black text-lg tracking-tighter text-indigo-500">{selectedTier?.breakdown_monthly ?? '--'}%</span>
                                        </div>
                                        <div className="flex flex-col p-3 bg-card rounded-xl border border-border-divider shadow-sm">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Break Maturity</span>
                                            <span className="font-black text-lg tracking-tighter text-indigo-500">{selectedTier?.breakdown_maturity ?? '--'}%</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Investment Amount (LKR)</label>
                                        <input
                                            type="number"
                                            min={selectedProduct.min_amount}
                                            max={selectedProduct.max_amount}
                                            className="w-full px-5 py-3.5 rounded-xl border-border-default border-[1.5px] outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 bg-input font-black text-text-primary text-sm theme-focus-ring placeholder:text-text-muted"
                                            placeholder="Min amount required..."
                                            value={formData.amount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        />
                                        <div className="flex items-center gap-3 mt-2 ml-1">
                                            <p className="text-[8px] text-text-muted font-black uppercase tracking-tight">Min: LKR {selectedProduct.min_amount.toLocaleString()}</p>
                                            <span className="text-border-default">•</span>
                                            <p className="text-[8px] text-text-muted font-black uppercase tracking-tight">Max: LKR {selectedProduct.max_amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 ml-1">Negotiation Rate (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01"
                                                className="w-full px-5 py-3.5 rounded-xl border-border-default border-[1.5px] outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 bg-input font-black text-text-primary text-sm theme-focus-ring"
                                                value={formData.negotiation_rate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, negotiation_rate: e.target.value }))}
                                            />
                                            <TrendingUp className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 opacity-50" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    )}

                    {currentStep === 3 && (
                    <div className="space-y-4">
                        <div className="relative z-30 bg-card/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-muted-bg">
                                    <User className="w-3.5 h-3.5 text-text-muted" />
                                </div>
                                Nominees
                            </h2>
                            <button
                                type="button"
                                onClick={addNominee}
                                className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-hover theme-text-primary hover:shadow-sm"
                            >
                                <Plus className="w-3 h-3" /> Add Nominee
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.nominees.length === 0 ? (
                                <div className="py-8 text-center border-2 border-dashed border-border-divider rounded-2xl">
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">No nominees added yet</p>
                                </div>
                            ) : (
                                formData.nominees.map((nominee, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 bg-muted-bg/50 p-4 rounded-xl border border-border-default shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Full Name <span className="text-red-400">*</span></label>
                                                <input type="text" placeholder="Enter full name" className="w-full px-4 py-2.5 rounded-lg border-border-default border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none uppercase bg-input text-text-primary placeholder:text-text-muted" value={nominee.name} onChange={e => updateNominee(idx, 'name', e.target.value)} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">ID Type <span className="text-red-400">*</span></label>
                                                <select
                                                    className="w-full px-4 py-2.5 rounded-lg border-border-default border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none bg-input text-text-primary cursor-pointer uppercase"
                                                    value={nominee.id_type}
                                                    onChange={e => updateNominee(idx, 'id_type', e.target.value as any)}
                                                >
                                                    <option value="NIC">NIC Number</option>
                                                    <option value="BC">Birth Certificate</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">
                                                    {nominee.id_type === 'BC' ? 'BC Number' : 'NIC Number'} <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={nominee.id_type === 'BC' ? "Enter BC number" : "Enter NIC number"}
                                                    className="w-full px-4 py-2.5 rounded-lg border-border-default border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none uppercase bg-input text-text-primary placeholder:text-text-muted"
                                                    value={nominee.nic}
                                                    onChange={e => updateNominee(idx, 'nic', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Relationship <span className="text-red-400">*</span></label>
                                                    <select
                                                        className="w-full px-4 py-2.5 rounded-lg border-border-default border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none bg-input text-text-primary cursor-pointer uppercase"
                                                        value={nominee.relationship}
                                                        onChange={e => updateNominee(idx, 'relationship', e.target.value)}
                                                    >
                                                        <option value="">Select Relationship</option>
                                                        <option value="Spouse">Spouse</option>
                                                        <option value="Child">Child</option>
                                                        <option value="Parent">Parent</option>
                                                        <option value="Sibling">Sibling</option>
                                                        <option value="Grandchild">Grandchild</option>
                                                        <option value="Grandparent">Grandparent</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                                <button type="button" onClick={() => removeNominee(idx)} className="mt-5 p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors rounded-lg group">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Witness Registry */}
                    <div className="relative z-20 bg-card/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-muted-bg">
                                    <UserCheck className="w-3.5 h-3.5 text-text-muted" />
                                </div>
                                Witness Registry
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {formData.witnesses.map((witness, idx) => (
                                <div key={idx} className="bg-muted-bg/50 p-4 rounded-xl border border-border-default shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest">
                                            {idx === 0 ? 'Witness 01 (Creator)' : `Witness ${idx + 1}`}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">
                                                {idx === 0 ? 'Select Witness 01 (Creator)' : 'Select Staff'} <span className="text-red-400">*</span>
                                            </label>
                                            <SearchableSelect
                                                options={staffs.filter(s => !formData.witnesses.some((w, wIdx) => wIdx !== idx && w.staff_id === s.staff_id)).map(staff => ({
                                                    id: staff.staff_id,
                                                    label: staff.full_name,
                                                    subLabel: staff.staff_id
                                                }))}
                                                value={witness.staff_id || undefined}
                                                onChange={val => {
                                                    const staffId = val?.toString();
                                                    const staff = staffs.find(s => s.staff_id === staffId);
                                                    if (staff) {
                                                        const newWitnesses = [...formData.witnesses];
                                                        newWitnesses[idx] = {
                                                            staff_id: staff.staff_id,
                                                            name: staff.full_name,
                                                            nic: staff.nic,
                                                            address: staff.address || ''
                                                        };
                                                        setFormData(prev => ({ ...prev, witnesses: newWitnesses }));
                                                    } else {
                                                        const newWitnesses = [...formData.witnesses];
                                                        newWitnesses[idx] = { staff_id: '', name: '', nic: '', address: '' };
                                                        setFormData(prev => ({ ...prev, witnesses: newWitnesses }));
                                                    }
                                                }}
                                                disabled={idx === 0}
                                                placeholder={idx === 0 ? (witness.staff_id || 'System Synchronizing...') : 'Select Staff Witness'}
                                                searchPlaceholder="Search staff by name or ID..."
                                            />
                                        </div>
                                        {witness.staff_id && (
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 p-3 bg-muted-bg rounded-xl border border-border-divider">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">
                                                    NIC: {witness.nic || (staffs.find(s => s.staff_id === witness.staff_id)?.nic) || 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-border-divider" />
                                                    Address: {witness.address || (staffs.find(s => s.staff_id === witness.staff_id)?.address) || 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    </div>
                    )}

                    {currentStep === 4 && (
                        <div className="relative z-10 bg-card/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default">
                        <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-muted-bg">
                                <Landmark className="w-3.5 h-3.5 text-text-muted" />
                            </div>
                            Target Disbursement Account
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-2 md:col-span-1">
                                <SearchableSelect
                                    label="Financial Institution *"
                                    options={banks.map(bank => ({
                                        id: bank.id,
                                        label: bank.bank_name,
                                        subLabel: bank.bank_code
                                    }))}
                                    value={formData.bank_details.bank_id}
                                    onChange={(val) => {
                                        const bankId = val?.toString() || '';
                                        const bankName = banks.find(b => b.id.toString() === bankId)?.bank_name || '';
                                        setFormData(prev => ({
                                            ...prev,
                                            bank_details: {
                                                ...prev.bank_details,
                                                bank_id: bankId,
                                                bank_name: bankName,
                                                branch_id: '',
                                                branch: ''
                                            }
                                        }));
                                    }}
                                    placeholder="Select Bank"
                                    searchPlaceholder="Search banks by name or code..."
                                    isLoading={isLoadingBanks}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <SearchableSelect
                                    label="Branch Name"
                                    options={branches.map(branch => ({
                                        id: branch.id,
                                        label: branch.branch_name,
                                        subLabel: branch.branch_code
                                    }))}
                                    value={formData.bank_details.branch_id}
                                    onChange={(val) => {
                                        const branchId = val?.toString() || '';
                                        const branchName = branches.find(b => b.id.toString() === branchId)?.branch_name || '';
                                        setFormData(prev => ({
                                            ...prev,
                                            bank_details: {
                                                ...prev.bank_details,
                                                branch_id: branchId,
                                                branch: branchName
                                            }
                                        }));
                                    }}
                                    disabled={!formData.bank_details.bank_id}
                                    placeholder={!formData.bank_details.bank_id ? 'Select Bank First' : 'Select Branch'}
                                    searchPlaceholder="Search branches by name or code..."
                                    isLoading={isLoadingBranches}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Account Holder Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter holder name"
                                    className="w-full px-4 py-3 rounded-xl border-border-default border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none bg-input text-text-primary uppercase placeholder:text-text-muted"
                                    value={formData.bank_details.holder_name}
                                    onChange={e => updateBankDetail('holder_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Account Number <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter account number"
                                    className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none uppercase transition-all ${accountError ? 'border-rose-500/50 bg-rose-500/5' : 'border-border-default bg-input text-text-primary placeholder:text-text-muted'}`}
                                    value={formData.bank_details.account_number}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        updateBankDetail('account_number', val);
                                        if (confirmAccountNumber) setAccountMismatch(val !== confirmAccountNumber);
                                    }}
                                    onPaste={(e) => e.preventDefault()}
                                    required
                                />
                                {accountError && (
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1.5 px-1">{accountError}</p>
                                )}
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1.5 ml-1">Confirm Account Number <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    placeholder="RE-ENTER account number"
                                    className={`w-full px-4 py-3 rounded-xl border-[1.5px] text-xs font-bold shadow-sm theme-focus-ring outline-none uppercase transition-all ${accountMismatch ? 'border-rose-500/50 bg-rose-500/5' : 'border-border-default bg-input text-text-primary placeholder:text-text-muted'}`}
                                    value={confirmAccountNumber}
                                    onChange={e => handleConfirmChange(e.target.value.replace(/\D/g, ''))}
                                    onPaste={(e) => e.preventDefault()}
                                    required
                                />
                                {accountMismatch && (
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1.5 px-1 animate-pulse">Account numbers do not match</p>
                                )}
                            </div>
                        </div>
                    </div>

                    )}
                </div>

                <StepNavigation
                    currentStep={currentStep}
                    totalSteps={4}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
