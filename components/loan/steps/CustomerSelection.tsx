'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Building2, Users2, User, ChevronDown, X, CheckCircle } from 'lucide-react';
import { CustomerRecord, LoanFormData } from '@/types/loan.types';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';
import { Staff } from '@/types/staff.types';
import { LoanProduct } from '@/types/loan-product.types';
import { isValidNIC, extractGenderFromNIC } from '@/utils/loan.utils';
import { colors } from '@/themes/colors';

interface CustomerSelectionProps {
    formData: LoanFormData;
    centers: Center[];
    groups: Group[];
    filteredCustomers: CustomerRecord[];
    selectedCustomerRecord?: CustomerRecord | null;
    onNicChange: (value: string, isGuardian?: boolean) => void;
    onCenterChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onCustomerChange: (value: string) => void;
    onFieldChange: (field: keyof LoanFormData, value: string) => void;
    staffs: Staff[];
    loanProducts: LoanProduct[];
    customerActiveLoans?: number[];
    isAutoFilling?: boolean;
    isGuardianAutoFilling?: boolean;
    nicError?: string | null;
    isEditMode?: boolean;
}

export const CustomerSelection: React.FC<CustomerSelectionProps> = ({
    formData,
    centers,
    groups,
    filteredCustomers,
    selectedCustomerRecord,
    onNicChange,
    onCenterChange,
    onGroupChange,
    onCustomerChange,
    onFieldChange,
    staffs,
    loanProducts,
    customerActiveLoans = [],
    isAutoFilling = false,
    isGuardianAutoFilling = false,
    nicError = null,
    isEditMode = false,
}) => {
    const [centerSearch, setCenterSearch] = useState('');
    const [isCenterDropdownOpen, setIsCenterDropdownOpen] = useState(false);
    const centerDropdownRef = useRef<HTMLDivElement>(null);

    const [groupSearch, setGroupSearch] = useState('');
    const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
    const groupDropdownRef = useRef<HTMLDivElement>(null);

    const [productSearch, setProductSearch] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const productDropdownRef = useRef<HTMLDivElement>(null);

    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    const [relationshipSearch, setRelationshipSearch] = useState('');
    const [isRelationshipDropdownOpen, setIsRelationshipDropdownOpen] = useState(false);
    const relationshipDropdownRef = useRef<HTMLDivElement>(null);

    const [witnessSearch, setWitnessSearch] = useState('');
    const [isWitnessDropdownOpen, setIsWitnessDropdownOpen] = useState(false);
    const witnessDropdownRef = useRef<HTMLDivElement>(null);

    const selectedProduct = loanProducts.find(p => p.id === Number(formData.loanProduct));
    const isAlreadyTaken = customerActiveLoans.includes(Number(formData.loanProduct));
    // Skip reloan blocking in edit mode - only block during creation
    const isReloanBlocked = !!(isAlreadyTaken && selectedCustomerRecord?.reloan_eligibility && !selectedCustomerRecord.reloan_eligibility.isEligible && !isEditMode);

    // Filter products based on search
    const filteredProductsList = useMemo(() => {
        if (!productSearch) return loanProducts;
        const query = productSearch.toLowerCase();
        return loanProducts.filter(p =>
            p.product_name.toLowerCase().includes(query)
        );
    }, [loanProducts, productSearch]);

    // Filter customers based on search
    const filteredCustomersList = useMemo(() => {
        if (!customerSearch) return filteredCustomers;
        const query = customerSearch.toLowerCase();
        return filteredCustomers.filter(c =>
            c.displayName.toLowerCase().includes(query) ||
            (c.nic && c.nic.toLowerCase().includes(query))
        );
    }, [filteredCustomers, customerSearch]);

    // Filter centers based on search
    const filteredCentersList = useMemo(() => {
        if (!centerSearch) return centers;
        const query = centerSearch.toLowerCase();
        return centers.filter(c =>
            c.center_name.toLowerCase().includes(query) ||
            (c.CSU_id && c.CSU_id.toLowerCase().includes(query))
        );
    }, [centers, centerSearch]);

    // Filter groups based on search
    const filteredGroupsList = useMemo(() => {
        if (!groupSearch) return groups;
        const query = groupSearch.toLowerCase();
        return groups.filter(g =>
            g.group_name.toLowerCase().includes(query) ||
            (g.group_code && g.group_code.toLowerCase().includes(query))
        );
    }, [groups, groupSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (centerDropdownRef.current && !centerDropdownRef.current.contains(event.target as Node)) {
                setIsCenterDropdownOpen(false);
            }
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
                setIsGroupDropdownOpen(false);
            }
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
                setIsProductDropdownOpen(false);
            }
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setIsCustomerDropdownOpen(false);
            }
            if (relationshipDropdownRef.current && !relationshipDropdownRef.current.contains(event.target as Node)) {
                setIsRelationshipDropdownOpen(false);
            }
            if (witnessDropdownRef.current && !witnessDropdownRef.current.contains(event.target as Node)) {
                setIsWitnessDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCenter = centers.find(c => String(c.id) === String(formData.center));
    const selectedGroup = groups.find(g => String(g.id) === String(formData.group));
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Select Customer</h2>
            </div>

            {/* Product Selection Section */}
            <div className="bg-muted-bg/30 dark:bg-muted-bg/10 rounded-[2rem] border border-border-default p-3 space-y-2 transition-colors">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2.5 text-[11px] font-black text-text-primary/70 uppercase tracking-[0.2em] px-1">
                        <Building2 className="w-4 h-4 text-primary-500" />
                        Select Loan Product *
                    </label>
                    <div className="relative" ref={productDropdownRef}>
                        <div
                            onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                            className={`w-full pl-6 pr-12 py-2.5 bg-input border-2 rounded-2xl focus-within:ring-4 transition-all text-sm font-black tracking-tight cursor-pointer flex items-center justify-between uppercase text-text-primary ${formData.loanProduct ? 'border-primary-500/30' : 'border-border-divider'}`}
                            style={{
                                '--tw-ring-color': `${colors.primary[500]}1A`
                            } as any}
                        >
                            <span className="truncate uppercase">
                                {selectedProduct ? `${selectedProduct.product_name} ${customerActiveLoans.includes(selectedProduct.id) ? '(ACTIVE EXPOSURE)' : ''}` : 'Choose a protocol product'}
                            </span>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isProductDropdownOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                        </div>

                        {isProductDropdownOpen && (
                            <div className="absolute z-[60] w-full mt-3 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-xl">
                                <div className="p-3 border-b border-border-divider/50 bg-muted-bg/30">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Filter products..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-input border border-border-divider/50 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-text-primary"
                                        />
                                        {productSearch && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setProductSearch(''); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors"
                                            >
                                                <X className="w-3 h-3 text-text-muted" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                                    {filteredProductsList.length > 0 ? (
                                        filteredProductsList.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => {
                                                    onFieldChange('loanProduct', String(product.id));
                                                    setIsProductDropdownOpen(false);
                                                    setProductSearch('');
                                                }}
                                                className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all flex flex-col group/item mb-1 ${String(formData.loanProduct) === String(product.id) ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-muted-bg'}`}
                                            >
                                                <span className={`font-black tracking-tight uppercase ${String(formData.loanProduct) === String(product.id) ? 'text-primary-500' : 'text-text-primary'}`}>
                                                    {product.product_name}
                                                </span>
                                                {customerActiveLoans.includes(product.id) && (
                                                    <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest opacity-80">
                                                        ACTIVE EXPOSURE
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-8 text-center">
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">No products matching</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isAlreadyTaken && selectedProduct && (!isEditMode || (isEditMode && formData.loanProduct !== formData.originalLoanProductId)) && (
                    <div className="p-6 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                            <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.2em]">
                                Active {selectedProduct.product_name}  loan detected for this customer.
                            </p>
                        </div>

                        {selectedCustomerRecord?.reloan_eligibility && (
                            <div className="space-y-4 pt-4 border-t border-rose-500/10">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-text-primary opacity-60">
                                        Term Progress: {selectedCustomerRecord.reloan_eligibility.progress}%
                                        <span className="ml-2 text-text-muted">({selectedCustomerRecord.reloan_eligibility.paid_weeks} / {selectedCustomerRecord.reloan_eligibility.total_weeks} Units)</span>
                                    </span>
                                    <span className="text-rose-500">Min. Target: 70%</span>
                                </div>
                                <div className="w-full bg-border-divider/10 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 shadow-lg ${selectedCustomerRecord.reloan_eligibility.isEligible ? 'bg-primary-500' : 'bg-rose-500'}`}
                                        style={{ width: `${selectedCustomerRecord.reloan_eligibility.progress}%` }}
                                    ></div>
                                </div>
                                <p className={`text-[11px] font-bold leading-relaxed px-4 py-3 rounded-xl border ${selectedCustomerRecord.reloan_eligibility.isEligible ? 'bg-primary-500/5 border-primary-500/20 text-primary-600 dark:text-primary-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                    {selectedCustomerRecord.reloan_eligibility.isEligible
                                        ? `Eligible for reloan: Customer has completed ${selectedCustomerRecord.reloan_eligibility.balance?.toLocaleString()} will be liquidated from the new disbursement.`
                                        : `Ineligible for reloan: Customer has only completed. A minimum of 70% (${Math.ceil(selectedCustomerRecord.reloan_eligibility.total_weeks! * 0.7)} weeks) execution is required for renewed portfolio access.`
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Search and Core Filters Section */}
            <div className="bg-card rounded-2xl border border-border-default shadow-sm p-2 space-y-2 transition-colors">
                {/* NIC Search - Main Action */}
                <div className="max-w-2xl mx-auto">
                    <label className="block text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-1 text-center opacity-80">
                        Quick Auto-Fill by NIC
                    </label>
                    <div className="relative group/search">
                        <Search className={`w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isAutoFilling ? 'text-primary-500' : 'text-text-muted'}`} />
                        <input
                            type="text"
                            value={formData.nic ?? ''}
                            onChange={(e) => onNicChange(e.target.value)}
                            placeholder="Type NIC here (e.g. 199XXXXX or 9XXXXXXX)"
                            className={`w-full pl-14 pr-10 py-2 bg-input border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-sm font-black tracking-tight placeholder:text-text-primary/50 text-text-primary ${nicError ? 'border-rose-500/50 bg-rose-500/5 text-rose-500 focus:ring-rose-500/10' : 'border-border-divider focus:border-primary-500/50 focus:ring-primary-500/5 focus:bg-card'}`}
                            style={{
                            } as any}
                        />
                        {isAutoFilling && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                </span>
                            </div>
                        )}
                        {formData.nic && !isAutoFilling && (
                            <button
                                onClick={() => onNicChange('')}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-muted-bg rounded-full text-text-muted transition-colors active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {nicError ? (
                        <div className="mt-2 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-3 justify-center animate-shake">
                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest leading-none">
                                {nicError}
                            </p>
                        </div>
                    ) : (
                        <p className="text-[10px] mt-2 text-text-muted text-center font-black uppercase tracking-[0.2em] opacity-40 animate-pulse">
                            System will automatically detect Center, Group, and Customer data
                        </p>
                    )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border-divider to-transparent opacity-20" />

                {/* Manual Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Center Code Search */}
                    <div className="space-y-0.5">
                        <label className="flex items-center gap-2 text-[10px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                            <Search className="w-3 h-3 text-primary-500" />
                            Center No
                        </label>
                        <input
                            type="text"
                            placeholder="Enter CSU ID"
                            onChange={(e) => {
                                const val = e.target.value.trim();
                                if (val) {
                                    const match = centers.find(c => c.CSU_id?.toLowerCase() === val.toLowerCase() || c.center_name.toLowerCase().includes(val.toLowerCase()));
                                    if (match) {
                                        onCenterChange(String(match.id));
                                    }
                                }
                            }}
                            className="w-full px-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-xs font-black tracking-tight text-text-primary placeholder:text-text-primary/50"
                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                        />
                    </div>

                    {/* Center Selection - Searchable Dropdown */}
                    <div className="space-y-0.5">
                        <label className="flex items-center gap-2 text-[10px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                            <Building2 className="w-3 h-3 text-primary-500" />
                            Select Center *
                        </label>
                        <div className="relative" ref={centerDropdownRef}>
                            <div
                                onClick={() => setIsCenterDropdownOpen(!isCenterDropdownOpen)}
                                className={`w-full pl-4 pr-10 py-2 bg-input border-2 rounded-xl focus-within:ring-4 transition-all text-xs font-black tracking-tight cursor-pointer flex items-center justify-between uppercase text-text-primary ${formData.center ? 'border-primary-500/30' : 'border-border-divider'}`}
                                style={{
                                    '--tw-ring-color': `${colors.primary[500]}1A`
                                } as any}
                            >
                                <span className="truncate">
                                    {selectedCenter ? selectedCenter.center_name : 'Locate Assignment Center'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCenterDropdownOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                            </div>

                            {isCenterDropdownOpen && (
                                <div className="absolute z-50 w-full mt-3 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-xl">
                                    <div className="p-3 border-b border-border-divider/50 bg-muted-bg/30">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Filter centers..."
                                                value={centerSearch}
                                                onChange={(e) => setCenterSearch(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2.5 bg-input border border-border-divider/50 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-text-primary"
                                            />
                                            {centerSearch && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setCenterSearch(''); }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <X className="w-3 h-3 text-text-muted" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5">
                                        {filteredCentersList.length > 0 ? (
                                            filteredCentersList.map((center) => (
                                                <div
                                                    key={center.id}
                                                    onClick={() => {
                                                        onCenterChange(String(center.id));
                                                        setIsCenterDropdownOpen(false);
                                                        setCenterSearch('');
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all flex flex-col group/item mb-1 ${String(formData.center) === String(center.id) ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-muted-bg'}`}
                                                >
                                                    <span className={`font-black tracking-tight ${String(formData.center) === String(center.id) ? 'text-primary-500' : 'text-text-primary'}`}>
                                                        {center.center_name}
                                                    </span>
                                                    {center.CSU_id && (
                                                        <span className="text-[9px] text-text-muted font-black uppercase tracking-widest opacity-60">
                                                            ID: {center.CSU_id}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-12 text-center">
                                                <div className="w-12 h-12 bg-muted-bg rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-40">
                                                    <Search className="w-6 h-6 text-text-muted" />
                                                </div>
                                                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">No centers matching </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Group Selection - Searchable Dropdown */}
                    <div className="space-y-0.5">
                        <label className="flex items-center gap-2 text-[10px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                            <Users2 className="w-3 h-3 text-primary-500" />
                            Select Group *
                        </label>
                        <div className="relative" ref={groupDropdownRef}>
                            <div
                                onClick={() => !(!formData.center) && setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                                className={`w-full pl-4 pr-10 py-2 bg-input border-2 rounded-xl focus-within:ring-4 transition-all text-xs font-black tracking-tight flex items-center justify-between uppercase text-text-primary ${!formData.center ? 'bg-muted/50 cursor-not-allowed border-border-divider/30 opacity-40' : 'cursor-pointer'} ${formData.group ? 'border-primary-500/30' : 'border-border-divider'}`}
                                style={{
                                    '--tw-ring-color': `${colors.primary[500]}1A`
                                } as any}
                            >
                                <span className="truncate">
                                    {selectedGroup ? selectedGroup.group_name : 'Identify Member Squad'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isGroupDropdownOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                            </div>

                            {isGroupDropdownOpen && formData.center && (
                                <div className="absolute z-40 w-full mt-3 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-xl">
                                    <div className="p-3 border-b border-border-divider/50 bg-muted-bg/30">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Filter groups..."
                                                value={groupSearch}
                                                onChange={(e) => setGroupSearch(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2.5 bg-input border border-border-divider/50 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-text-primary"
                                            />
                                            {groupSearch && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setGroupSearch(''); }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted-bg rounded-full transition-colors"
                                                >
                                                    <X className="w-3 h-3 text-text-muted" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5">
                                        {filteredGroupsList.length > 0 ? (
                                            filteredGroupsList.map((group) => (
                                                <div
                                                    key={group.id}
                                                    onClick={() => {
                                                        onGroupChange(String(group.id));
                                                        setIsGroupDropdownOpen(false);
                                                        setGroupSearch('');
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all flex flex-col group/item mb-1 ${String(formData.group) === String(group.id) ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-muted-bg'}`}
                                                >
                                                    <span className={`font-black tracking-tight ${String(formData.group) === String(group.id) ? 'text-primary-500' : 'text-text-primary'}`}>
                                                        {group.group_name}
                                                    </span>
                                                    {group.group_code && (
                                                        <span className="text-[9px] text-text-muted font-black uppercase tracking-widest opacity-60">
                                                            Code: {group.group_code}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-12 text-center">
                                                <div className="w-12 h-12 bg-muted-bg rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-40">
                                                    <Users2 className="w-6 h-6 text-text-muted" />
                                                </div>
                                                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">No groups matching </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div className="space-y-0.5">
                        <label className="flex items-center gap-2 text-[10px] font-black text-text-primary/70 uppercase tracking-widest px-1">
                            <User className="w-3 h-3 text-primary-500" />
                            Select Customer *
                        </label>
                        <div className="relative" ref={customerDropdownRef}>
                            <div
                                onClick={() => formData.center && setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                                className={`w-full pl-4 pr-10 py-2 bg-input border-2 rounded-xl focus-within:ring-4 transition-all text-xs font-black tracking-tight flex items-center justify-between uppercase text-text-primary ${!formData.center ? 'bg-muted/50 cursor-not-allowed border-border-divider/30 opacity-40' : 'cursor-pointer'} ${formData.customer ? 'border-primary-500/30' : 'border-border-divider'}`}
                                style={{
                                    '--tw-ring-color': `${colors.primary[500]}1A`
                                } as any}
                            >
                                <span className="truncate uppercase">
                                    {selectedCustomerRecord ? selectedCustomerRecord.displayName : (formData.group ? 'Squad Members Only' : 'Station Registry')}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCustomerDropdownOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                            </div>

                            {isCustomerDropdownOpen && formData.center && (
                                <div className="absolute z-[60] bottom-full mb-3 w-full bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-xl">
                                    <div className="p-3 border-b border-border-divider/50 bg-muted-bg/30">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Filter customers..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2.5 bg-primary-500/5 border border-border-divider/50 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-text-primary"
                                            />
                                            {customerSearch && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setCustomerSearch(''); }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors"
                                                >
                                                    <X className="w-3 h-3 text-text-muted" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                                        {filteredCustomersList.length > 0 ? (
                                            filteredCustomersList.map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => {
                                                        onCustomerChange(String(customer.id));
                                                        setIsCustomerDropdownOpen(false);
                                                        setCustomerSearch('');
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all flex flex-col group/item mb-1 ${String(formData.customer) === String(customer.id) ? 'bg-primary-500/10 border border-primary-500/20' : 'hover:bg-muted-bg'}`}
                                                >
                                                    <span className={`font-black tracking-tight uppercase ${String(formData.customer) === String(customer.id) ? 'text-primary-500' : 'text-text-primary'}`}>
                                                        {customer.displayName}
                                                    </span>
                                                    {customer.nic && (
                                                        <span className="text-[9px] text-text-muted font-black uppercase tracking-widest opacity-60">
                                                            NIC: {customer.nic}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center">
                                                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">No customers matching</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedCustomerRecord && !isReloanBlocked && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-2">
                    <div
                        className="p-2 border-2 rounded-2xl shadow-2xl relative overflow-hidden group/preview transition-all hover:shadow-primary-500/10"
                        style={{ background: `linear-gradient(135deg, ${colors.primary[500]}10, ${colors.indigo[500]}10)`, borderColor: `${colors.primary[500]}20` } as any}
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-transform duration-1000 group-hover/preview:scale-150" />

                        <div className="relative z-10 flex items-center justify-between border-b pb-1 mb-2 border-border-divider/30">
                            <div>
                                <h3 className="text-base font-black uppercase tracking-tight text-text-primary">Customer Profile</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border ${selectedCustomerRecord.status?.toLowerCase() === 'active' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                Status: {selectedCustomerRecord.status}
                            </span>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-6">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-primary/60">Customer Name</p>
                                <p className="text-sm font-black tracking-tight text-text-primary uppercase">{selectedCustomerRecord.name}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-primary/60">NIC Number</p>
                                <p className="text-sm font-black tracking-tight text-text-primary">{selectedCustomerRecord.nic}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-primary/60">Gender / Age</p>
                                <p className="text-sm font-black tracking-tight text-text-primary uppercase">{selectedCustomerRecord.gender || 'N/A'} / {selectedCustomerRecord.age ?? 'N/A'} YRS</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-primary/60">Contact Number</p>
                                <p className="text-sm font-black tracking-tight text-text-primary">{selectedCustomerRecord.phone || 'N/A'}</p>
                            </div>

                            <div className="md:col-span-2 p-3 bg-card dark:bg-muted-bg/10 rounded-xl border border-border-divider/50 shadow-inner group/fin transition-transform hover:-translate-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-text-primary/80">Financial Review</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40 italic">Monthly Income</p>
                                        <p className="text-base font-black text-primary-500 tracking-tighter">LKR {(selectedCustomerRecord.monthly_income || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40 italic">Loan Exposure</p>
                                        <p className="text-base font-black text-rose-500 tracking-tighter">LKR {(selectedCustomerRecord.activeLoanAmount || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="pt-2 border-t border-border-divider/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-5 bg-primary-500 rounded-full" />
                            <h3 className="text-base font-black text-text-primary uppercase tracking-tight">Financial Assessment</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 bg-primary-500/5 dark:bg-muted-bg/5 p-2 rounded-2xl border border-border-divider/50 shadow-inner">
                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1 italic">Monthly Income (LKR) *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted/40 group-focus-within:text-primary-500 font-black text-xs transition-colors">LKR</div>
                                    <input
                                        type="number"
                                        value={formData.monthly_income ?? ''}
                                        onChange={(e) => onFieldChange('monthly_income', e.target.value)}
                                        disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 transition-all text-sm font-black tracking-tight text-text-primary placeholder:text-text-muted/20 disabled:opacity-40"
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1 italic">Monthly Expenses (LKR) *</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted/40 group-focus-within:text-rose-500 font-black text-xs transition-colors">LKR</div>
                                    <input
                                        type="number"
                                        value={formData.monthly_expenses ?? ''}
                                        onChange={(e) => onFieldChange('monthly_expenses', e.target.value)}
                                        disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 transition-all text-sm font-black tracking-tight text-text-primary placeholder:text-text-muted/20 disabled:opacity-40"
                                        style={{ '--tw-ring-color': `${colors.rose[500]}1A` } as any}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Joint Borrower Section - Hidden for Advance Loans */}
                    {selectedProduct?.product_type !== 'advance_loan' && (
                        <div className="pt-2 border-t border-border-divider/30">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-5 bg-primary-500 rounded-full" />
                                <h3 className="text-base font-black text-text-primary uppercase tracking-tight">Joint Borrower Information</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-x-3 gap-y-2 bg-primary-500/5 dark:bg-muted-bg/5 p-2 rounded-2xl border border-border-divider/50">
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1">Joint Borrower NIC *</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={formData.guardian_nic ?? ''}
                                            onChange={(e) => onNicChange(e.target.value, true)}
                                            onPaste={(e) => e.preventDefault()}
                                            onCopy={(e) => e.preventDefault()}
                                            disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode}
                                            placeholder="Execute registry lookup..."
                                            className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-xs font-black tracking-tight placeholder:text-text-muted/20 disabled:opacity-40 uppercase ${formData.guardian_nic && !isValidNIC(formData.guardian_nic) ? 'border-rose-500/50 bg-rose-500/5 text-rose-500 focus:ring-rose-500/10' :
                                                formData.guardian_nic && extractGenderFromNIC(formData.guardian_nic) !== 'Male' ? 'border-orange-500/50 bg-orange-500/5 text-orange-500' :
                                                    'bg-primary-500/5 border-border-divider/50 focus:border-primary-500/30'
                                                }`}
                                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                            required
                                        />
                                        {isGuardianAutoFilling && (
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                <span className="flex h-3 w-3 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {formData.guardian_nic && isValidNIC(formData.guardian_nic) && (
                                        <div className="flex items-center gap-3 mt-1.5 ml-2">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${extractGenderFromNIC(formData.guardian_nic) === 'Male' ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                Gender: {extractGenderFromNIC(formData.guardian_nic)}
                                            </div>
                                            {extractGenderFromNIC(formData.guardian_nic) !== 'Male' && (
                                                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest animate-pulse">Must be Male</p>
                                            )}
                                            {formData.guardianSource === 'auto' && formData.guardian_name && (
                                                <div className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary-500/10 text-primary-500 border border-primary-500/20">
                                                    ✓ Auto-filled from previous loan
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1">Relationship to Customer *</label>
                                    <div className="relative group/select" ref={relationshipDropdownRef}>
                                        <div
                                            onClick={() => !(isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode) && setIsRelationshipDropdownOpen(!isRelationshipDropdownOpen)}
                                            className={`w-full pl-6 pr-12 py-3 bg-primary-500/5 border-2 rounded-2xl focus-within:ring-4 transition-all text-sm font-black tracking-tight flex items-center justify-between uppercase text-text-primary ${(isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${formData.guardian_relationship ? 'border-primary-500/30' : 'border-border-divider/50'}`}
                                            style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                        >
                                            <span className="truncate">
                                                {formData.guardian_relationship || 'Select Relationship'}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isRelationshipDropdownOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                                        </div>

                                        {isRelationshipDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-2 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                                                    {['Spouse', 'Father', 'Brother', 'Son', 'Other'].map((rel) => (
                                                        <div
                                                            key={rel}
                                                            onClick={() => {
                                                                onFieldChange('guardian_relationship', rel);
                                                                setIsRelationshipDropdownOpen(false);
                                                            }}
                                                            className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all mb-1 font-black tracking-tight ${formData.guardian_relationship === rel ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'hover:bg-muted-bg text-text-primary'}`}
                                                        >
                                                            {rel}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1">Legal Entity Name *</label>
                                    <input
                                        type="text"
                                        value={formData.guardian_name || ''}
                                        onChange={(e) => onFieldChange('guardian_name', e.target.value)}
                                        disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible}
                                        placeholder="Enter Joint Borrower Full Name"
                                        className="w-full px-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 transition-all text-xs font-black tracking-tight text-text-primary placeholder:text-text-muted/20 disabled:opacity-40 uppercase"
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                        required
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1">Date of Birth(Detail from NIC) *</label>
                                    <input
                                        type="text"
                                        value={formData.guardian_dob ?? ''}
                                        placeholder="YYYY-MM-DD"
                                        onChange={(e) => onFieldChange('guardian_dob', e.target.value)}
                                        className="w-full px-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 transition-all text-xs font-black tracking-tight text-text-primary placeholder:text-text-muted/20"
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1">Primary Phone *</label>
                                    <input
                                        type="text"
                                        value={formData.guardian_phone || ''}
                                        onChange={(e) => onFieldChange('guardian_phone', e.target.value)}
                                        disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible}
                                        placeholder="Primary Phone (07XXXXXXXX)"
                                        className={`w-full px-4 py-2 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all text-xs font-black tracking-tight text-text-primary placeholder:text-text-muted/20 disabled:opacity-40 ${formData.guardian_phone && !/^\d{10}$/.test(formData.guardian_phone) ? 'border-rose-500/50 bg-rose-500/5' : 'bg-primary-500/5 border-border-divider/50'}`}
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                        required
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-[0.1em] px-1">Secondary Phone (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.guardian_secondary_phone || ''}
                                        onChange={(e) => onFieldChange('guardian_secondary_phone', e.target.value)}
                                        disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible}
                                        placeholder="Alternative Number"
                                        className="w-full px-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 transition-all text-xs font-black tracking-tight text-text-primary placeholder:text-text-muted/20 disabled:opacity-40"
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-0.5">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em] px-1 opacity-60">Joint Borrower Address *</label>
                                    <textarea
                                        value={formData.guardian_address || ''}
                                        onChange={(e) => onFieldChange('guardian_address', e.target.value)}
                                        disabled={isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible}
                                        placeholder="Enter Permanent Address"
                                        rows={2}
                                        className="w-full px-4 py-2 bg-primary-500/5 border-2 border-border-divider/50 rounded-xl focus:outline-none focus:ring-4 transition-all text-xs font-black tracking-tight text-text-primary placeholder:text-text-muted/20 disabled:opacity-40 uppercase"
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Guarantor Section - Hidden for Advance Loans */}
                    {selectedProduct?.product_type !== 'advance_loan' && (
                        <div className="pt-2 border-t border-border-divider/30">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-primary-500 rounded-full" />
                                    <h3 className="text-base font-black text-text-primary uppercase tracking-tight">Guarantor Information</h3>
                                </div>
                                {!formData.group && (
                                    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                        Manual Entry (No Group Selected)
                                    </span>
                                )}
                            </div>
                            {!formData.group && (
                                <div className="mb-8 p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
                                        <X className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <p className="text-xs text-text-primary font-black uppercase tracking-tight leading-relaxed">
                                        Access Restricted: This customer is not assigned to a group. Guarantors can only be auto-filled from group members. Please assign this customer to a group first to proceed.
                                    </p>
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    { label: 'Primary Guarantor (L1)', name: formData.guarantor1_name, nic: formData.guarantor1_nic, address: formData.guarantor1_address },
                                    { label: 'Secondary Guarantor (L2)', name: formData.guarantor2_name, nic: formData.guarantor2_nic, address: formData.guarantor2_address }
                                ].map((g, idx) => (
                                    <div key={idx} className="p-3 bg-primary-500/5 dark:bg-muted-bg/5 border-2 border-border-divider/50 rounded-2xl space-y-2 shadow-inner relative overflow-hidden group/guarantor">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover/guarantor:scale-150" />
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em] opacity-60 italic">{g.label}</p>
                                        <div className="space-y-3 relative z-10">
                                            <div className="space-y-0.5">
                                                <label className="text-[8px] font-black text-primary-500 uppercase tracking-widest pl-1">Identity Holder</label>
                                                <div className="px-3 py-1.5 bg-card border border-border-divider/50 rounded-lg text-xs font-black text-text-primary tracking-tight shadow-sm uppercase">
                                                    {g.name || 'Protocol Standby...'}
                                                </div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[8px] font-black text-primary-500 uppercase tracking-widest pl-1">Registry Key (NIC)</label>
                                                <div className="px-3 py-1.5 bg-card border border-border-divider/50 rounded-lg text-xs font-black text-text-primary tracking-tight shadow-sm uppercase">
                                                    {g.nic || 'Pending Link...'}
                                                </div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[8px] font-black text-primary-500 uppercase tracking-widest pl-1">Permanent Address</label>
                                                <div className="px-3 py-1 bg-card border border-border-divider/50 rounded-lg text-[10px] font-black text-text-primary tracking-tight shadow-sm uppercase min-h-[2rem] flex items-center">
                                                    {g.address || 'Address not found...'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-border-divider/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-5 bg-primary-500 rounded-full" />
                            <h3 className="text-base font-black text-text-primary uppercase tracking-tight">Institutional Witnesses</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 bg-primary-500/5 dark:bg-muted-bg/5 p-2 rounded-2xl border border-border-divider/50">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.1em] px-1 opacity-60">
                                    Witness 01 (Creator) *
                                </label>
                                <div className="relative group/select">
                                    <div
                                        className="w-full pl-4 pr-10 py-2 bg-primary-500/10 border-2 border-primary-500/30 rounded-xl text-xs font-black text-primary-500 flex items-center justify-between cursor-not-allowed opacity-80 shadow-inner uppercase"
                                    >
                                        <span className="truncate uppercase">
                                            {staffs.find(s => s.staff_id === formData.witness1_id)?.full_name || formData.witness1_id || 'System Synchronizing...'}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-primary-500/50" />
                                    </div>
                                </div>

                                <p className="text-[9px] mt-1.5 px-2 font-black uppercase tracking-[0.2em] italic text-primary-500 flex items-center gap-2">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    ✓ Auto-assigned to loan creator
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-[0.1em] px-1 opacity-60">
                                    Witness 02 (Staff) *
                                </label>
                                <div className="relative group/select" ref={witnessDropdownRef}>
                                    <div
                                        onClick={() => !(isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode) && setIsWitnessDropdownOpen(!isWitnessDropdownOpen)}
                                        className={`w-full pl-6 pr-12 py-3 bg-primary-500/5 border-2 rounded-2xl focus-within:ring-4 transition-all text-sm font-black tracking-tight flex items-center justify-between uppercase text-text-primary ${(isAlreadyTaken && !selectedCustomerRecord.reloan_eligibility?.isEligible && !isEditMode) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${formData.witness2_id ? 'border-primary-500/30' : 'border-border-divider/50'}`}
                                        style={{ '--tw-ring-color': `${colors.primary[500]}1A` } as any}
                                    >
                                        <span className="truncate uppercase">
                                            {staffs.find(s => s.staff_id === formData.witness2_id)?.full_name || 'Locate Secondary Staff'}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isWitnessDropdownOpen ? 'rotate-180 text-primary-500' : 'text-text-muted/40'}`} />
                                    </div>

                                    {isWitnessDropdownOpen && (
                                        <div className="absolute z-50 bottom-full mb-2 w-full bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-xl">
                                            <div className="p-3 border-b border-border-divider/50 bg-primary-500/5">
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" />
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        placeholder="Search staff..."
                                                        value={witnessSearch}
                                                        onChange={(e) => setWitnessSearch(e.target.value)}
                                                        className="w-full pl-10 pr-10 py-2.5 bg-primary-500/5 border border-border-divider/50 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary-500/5 transition-all text-text-primary"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
                                                {staffs.filter(s => s.staff_id !== formData.witness1_id && (!witnessSearch || s.full_name.toLowerCase().includes(witnessSearch.toLowerCase()))).map((staff) => (
                                                    <div
                                                        key={staff.staff_id}
                                                        onClick={() => {
                                                            onFieldChange('witness2_id', staff.staff_id);
                                                            setIsWitnessDropdownOpen(false);
                                                            setWitnessSearch('');
                                                        }}
                                                        className={`px-4 py-3 rounded-xl text-sm cursor-pointer transition-all mb-1 font-black tracking-tight ${formData.witness2_id === staff.staff_id ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'hover:bg-muted-bg text-text-primary'}`}
                                                    >
                                                        <span className="uppercase">{staff.full_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
