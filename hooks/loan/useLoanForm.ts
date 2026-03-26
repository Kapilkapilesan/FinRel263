import { useState, useEffect, useCallback } from 'react';
import { LoanFormData, CustomerRecord, Loan, LOAN_CLOSED_STATUSES } from '@/types/loan.types';
import { LoanProduct } from '@/types/loan-product.types';
import { centerService } from '@/services/center.service';
import { groupService } from '@/services/group.service';
import { customerService } from '@/services/customer.service';
import { loanProductService } from '@/services/loan-product.service';
import { loanService } from '@/services/loan.service';
import { staffService } from '@/services/staff.service';
import { authService } from '@/services/auth.service';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';
import { Staff, User as StaffUser } from '@/types/staff.types';
import { extractBirthdayFromNIC } from '@/utils/loan.utils';

const initialFormData: LoanFormData = {
    center: '',
    group: '',
    customer: '',
    nic: '',
    loanProduct: '',
    loanAmount: '',
    requestedAmount: '',
    interestRate: '',
    rentalType: 'Weekly',
    tenure: '',
    processingFee: '',
    documentationFee: '',
    insuranceFee: '',
    remarks: '',
    status: 'draft',
    guardian_nic: '',
    guardian_name: '',
    guardian_relationship: '',
    guardian_address: '',
    guardian_phone: '',
    guardian_secondary_phone: '',
    guardian_dob: '',
    guarantor1_name: '',
    guarantor1_nic: '',
    guarantor1_address: '',
    guarantor2_name: '',
    guarantor2_nic: '',
    guarantor2_address: '',
    witness1_id: '',
    witness2_id: '',
    bankName: '',
    bankId: '',
    bankBranch: '',
    bankBranchId: '',
    accountNumber: '',
    monthly_income: '',
    monthly_expenses: '',
    reloan_deduction_amount: 0,
    documents: {},
};

export const useLoanForm = () => {
    const [formData, setFormData] = useState<LoanFormData>(initialFormData);
    const [isDirty, setIsDirty] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [centers, setCenters] = useState<Center[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
    const [customerActiveLoans, setCustomerActiveLoans] = useState<number[]>([]);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [selectedCustomerRecord, setSelectedCustomerRecord] = useState<CustomerRecord | null>(null);
    const [nicError, setNicError] = useState<string | null>(null);
    const [isGuardianAutoFilling, setIsGuardianAutoFilling] = useState(false);

    // Initial load: centers and products
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [centersData, productsData, staffData] = await Promise.all([
                    centerService.getCenters({ scope: 'branch' }).catch(() => []),
                    loanProductService.getLoanProductsList().catch(() => []),
                    staffService.getWitnessCandidates().catch(() => [])
                ]);

                setCenters(centersData || []);
                const filteredProducts = (productsData || []).filter((p: any) => p.product_type === 'micro_loan' || p.product_type === 'advance_loan' || !p.product_type);
                setLoanProducts(filteredProducts);

                const currentUser = authService.getCurrentUser();
                setStaffs(staffData || []);

                // Set Witness 01 as the creator (current user)
                if (currentUser?.staff_id) {
                    setFormData(prev => ({ ...prev, witness1_id: currentUser.staff_id || '' }));
                } else if (currentUser?.user_name) {
                    setFormData(prev => ({ ...prev, witness1_id: currentUser.user_name }));
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        loadInitialData();
    }, []);

    // Load groups when center changes
    useEffect(() => {
        const loadGroups = async () => {
            if (formData.center) {
                try {
                    const centerGroups = await groupService.getGroupsByCenter(String(formData.center), { scope: 'branch' });
                    setGroups(centerGroups);
                } catch (error) {
                    console.error("Failed to load groups", error);
                    setGroups([]);
                }
            } else {
                setGroups([]);
            }
        };
        loadGroups();
    }, [formData.center]);

    // Load customers when center or group changes (Requirement: Center-wide fetch)
    useEffect(() => {
        const loadCustomers = async () => {
            if (formData.center) {
                try {
                    const filters: any = { center_id: formData.center };
                    if (formData.group) filters.grp_id = formData.group;

                    const groupCustomers = await customerService.getCustomers(filters);
                    const centerName = centers.find(c => c.id.toString() === formData.center)?.center_name || formData.center;
                    const groupName = formData.group ? (groups.find(g => g.id.toString() === formData.group)?.group_name || formData.group) : 'All Center';

                    const mappedCustomers: CustomerRecord[] = groupCustomers.map(c => ({
                        id: c.id.toString(),
                        name: c.full_name,
                        displayName: `${c.full_name} - ${c.customer_code}`,
                        nic: c.customer_code || '',
                        center: centerName,
                        group: groupName,
                        groupId: c.grp_id?.toString(),
                        status: c.status || 'Active',
                        previousLoans: 'N/A',
                        monthly_income: c.monthly_income,
                        gender: c.gender,
                        age: c.age,
                        phone: c.mobile_no_1,
                        address: [c.address_line_1, c.address_line_2, c.city].filter(Boolean).join(', '),
                        profileImage: c.customer_profile_image,
                        nicImage: c.nic_copy_image
                    }));
                    setCustomers(mappedCustomers);
                } catch (error) {
                    console.error("Failed to load customers", error);
                    setCustomers([]);
                }
            } else {
                setCustomers([]);
            }
        };
        loadCustomers();
    }, [formData.group, formData.center, centers, groups]);

    // Update selected customer record and auto-fill guarantors
    useEffect(() => {
        if (formData.customer) {
            const customer = customers.find(c => c.id === formData.customer);
            setSelectedCustomerRecord(customer || null);

            if (customer) {
                // Fetch full customer details to get loan history
                customerService.getCustomer(customer.id).then(fullCustomer => {
                    if (fullCustomer) {
                        const allLoans = fullCustomer.loans || [];
                        const activeLoans = allLoans.filter((l: any) => !(LOAN_CLOSED_STATUSES as readonly string[]).includes(l.status));

                        setSelectedCustomerRecord(prev => {
                            if (!prev) return null;
                            const enriched: CustomerRecord = {
                                ...prev,
                                branch: fullCustomer.branch_name || (fullCustomer.branch?.branch_name),
                                center: fullCustomer.center_name || (fullCustomer.center?.center_name) || prev?.center,
                                group: fullCustomer.group_name || (fullCustomer.group?.group_name) || prev?.group,
                                previousLoans: `${allLoans.length} Total (${activeLoans.length} Active)`,
                                totalLoanCount: allLoans.length,
                                activeLoanAmount: activeLoans.reduce((sum: number, l: any) => sum + Number(l.outstanding_amount || 0), 0),
                                monthly_income: fullCustomer.monthly_income,
                                gender: fullCustomer.gender,
                                age: fullCustomer.age,
                                phone: fullCustomer.mobile_no_1,
                                // Calculate 70% eligibility for the most recent active loan
                                reloan_eligibility: activeLoans.length > 0 ? (() => {
                                    const latest = activeLoans[0];

                                    // 🟢 Prioritize Backend exact calculation (Term-based)
                                    if (latest.reloan_eligibility) {
                                        return latest.reloan_eligibility;
                                    }

                                    // 🟡 Fallback to frontend calculation (Amount-based)
                                    const principal = Number(latest.approved_amount);
                                    const interestRate = Number(latest.interest_rate) / 100;
                                    // Use full_amount if available, otherwise calculate
                                    const totalAmount = Number(latest.full_amount) > 0
                                        ? Number(latest.full_amount)
                                        : principal + (principal * interestRate);
                                    const currentOutstanding = Number(latest.outstanding_amount);

                                    // Total paid is difference between total debt and current balance
                                    const paid = Math.max(0, totalAmount - currentOutstanding);
                                    const progress = totalAmount > 0 ? (paid / totalAmount) : 0;

                                    return {
                                        isEligible: progress >= 0.70,
                                        progress: Math.min(100, Math.round(progress * 100)),
                                        balance: currentOutstanding,
                                        paid_weeks: 0, // Placeholder for fallback
                                        total_weeks: Number(latest.terms)
                                    };
                                })() : undefined
                            };

                            if (enriched.reloan_eligibility?.isEligible) {
                                setFormData(prevForm => ({ ...prevForm, reloan_deduction_amount: enriched.reloan_eligibility?.balance }));
                            } else {
                                setFormData(prevForm => ({ ...prevForm, reloan_deduction_amount: 0 }));
                            }

                            return enriched;
                        });

                        const activeProductIds = activeLoans.map((l: any) => l.product_id);
                        setCustomerActiveLoans(activeProductIds);

                        // Auto-populate profile documents into existing documents
                        const profileDocs: any[] = [];
                        if (fullCustomer.nic_copy_image) {
                            profileDocs.push({
                                id: `profile-nic-${fullCustomer.id}`,
                                type: 'NIC Copy',
                                url: fullCustomer.nic_copy_image,
                                file_name: 'NIC Copy from Profile',
                                is_from_profile: true
                            });
                        }
                        if (fullCustomer.customer_profile_image) {
                            profileDocs.push({
                                id: `profile-photo-${fullCustomer.id}`,
                                type: 'Customer Photo',
                                url: fullCustomer.customer_profile_image,
                                file_name: 'Profile Photo from Profile',
                                is_from_profile: true
                            });
                        }

                        if (profileDocs.length > 0) {
                            setFormData(prev => ({
                                ...prev,
                                // Also ensure NIC is synced here if missing
                                ...((!prev.nic && customer.nic) ? { nic: customer.nic } : {}),
                                existingDocuments: [
                                    ...(prev.existingDocuments || []).filter(d => !(d as any).is_from_profile),
                                    ...profileDocs
                                ]
                            }));
                        } else if (!formData.nic && customer.nic) {
                            // Sync NIC even if no profile docs
                            setFormData(prev => ({ ...prev, nic: customer.nic }));
                        }
                    }
                }).catch(err => console.error("Failed to fetch customer loan history", err));

                // Sync NIC immediately from the local record if available
                if (!formData.nic && customer.nic) {
                    setFormData(prev => ({ ...prev, nic: customer.nic }));
                }

                // Requirement: Guarantors must be from the same group
                const otherGroupMembers = customer.groupId ? customers.filter(c =>
                    c.id !== customer.id &&
                    c.groupId === customer.groupId
                ) : [];

                if (otherGroupMembers.length >= 2) {
                    setFormData(prev => ({
                        ...prev,
                        guarantor1_name: otherGroupMembers[0].name,
                        guarantor1_nic: otherGroupMembers[0].nic,
                        guarantor1_address: otherGroupMembers[0].address || '',
                        guarantor2_name: otherGroupMembers[1].name,
                        guarantor2_nic: otherGroupMembers[1].nic,
                        guarantor2_address: otherGroupMembers[1].address || '',
                    }));
                } else if (otherGroupMembers.length === 1) {
                    setFormData(prev => ({
                        ...prev,
                        guarantor1_name: otherGroupMembers[0].name,
                        guarantor1_nic: otherGroupMembers[0].nic,
                        guarantor1_address: otherGroupMembers[0].address || '',
                        guarantor2_name: '',
                        guarantor2_nic: '',
                        guarantor2_address: '',
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        guarantor1_name: '',
                        guarantor1_nic: '',
                        guarantor1_address: '',
                        guarantor2_name: '',
                        guarantor2_nic: '',
                        guarantor2_address: '',
                    }));
                }
            }
        } else {
            setSelectedCustomerRecord(null);
            setCustomerActiveLoans([]);
            setFormData(prev => ({
                ...prev,
                guarantor1_name: '',
                guarantor1_nic: '',
                guarantor1_address: '',
                guarantor2_name: '',
                guarantor2_nic: '',
                guarantor2_address: '',
                reloan_deduction_amount: 0
            }));
        }
    }, [formData.customer, customers]);

    const handleNicChange = useCallback(async (value: string, isGuardian: boolean = false) => {
        // Only allow digits and V, X characters, limit to 12
        const nicValue = value.replace(/[^0-9vVxX]/g, '').trim().toUpperCase().substring(0, 12);

        if (isGuardian) {
            setFormData(prev => {
                const newData = { ...prev, guardian_nic: nicValue };
                // Auto-extract DOB from NIC
                const dob = extractBirthdayFromNIC(nicValue);
                if (dob) {
                    newData.guardian_dob = dob;
                }
                return newData;
            });

            // 🆕 Dynamic handling of joint borrower details
            if (nicValue.length >= 9) {
                setIsGuardianAutoFilling(true);
                try {
                    const result = await loanService.lookupJointBorrower(nicValue);
                    if (result.found && result.data) {
                        setFormData(prev => ({
                            ...prev,
                            // Only update if the NIC hasn't changed while we were fetching
                            ...(prev.guardian_nic === nicValue ? {
                                guardian_name: result.data!.guardian_name || '',
                                guardian_relationship: result.data!.guardian_relationship || '',
                                guardian_address: result.data!.guardian_address || '',
                                guardian_phone: result.data!.guardian_phone || '',
                                guardian_secondary_phone: result.data!.guardian_secondary_phone || '',
                                guardianSource: 'auto'
                            } : {})
                        }));
                    } else {
                        // NIC not found - clear previous auto-fill but don't clear manual input if user is already typing
                        setFormData(prev => ({
                            ...prev,
                            ...(prev.guardian_nic === nicValue ? {
                                guardian_name: '',
                                guardian_relationship: '',
                                guardian_address: '',
                                guardian_phone: '',
                                guardian_secondary_phone: '',
                                guardianSource: 'manual'
                            } : {})
                        }));
                    }
                } catch (error) {
                    console.error('Failed to lookup joint borrower:', error);
                } finally {
                    setIsGuardianAutoFilling(false);
                }
            } else if (nicValue.length === 0) {
                // Clear all guardian fields if NIC is cleared
                setFormData(prev => ({
                    ...prev,
                    guardian_name: '',
                    guardian_relationship: '',
                    guardian_address: '',
                    guardian_phone: '',
                    guardian_secondary_phone: '',
                    guardian_dob: '',
                    guardianSource: 'manual'
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, nic: nicValue }));
            // Clear error when user changes NIC
            if (nicError) setNicError(null);
        }
        setIsDirty(true);
    }, [nicError]);

    // Auto-fill form when NIC is entered
    useEffect(() => {
        const fetchCustomerByNIC = async () => {
            const searchNic = formData.nic?.trim().toUpperCase();
            if (!searchNic) {
                setNicError(null);
                // Reset form data if NIC is cleared manually
                if (isAutoFilling || formData.customer) {
                    setFormData(prev => ({
                        ...prev,
                        center: '',
                        group: '',
                        customer: '',
                        guardian_nic: '',
                        guardian_name: '',
                        guardian_relationship: '',
                        guardian_address: '',
                        guardian_phone: '',
                        guardian_secondary_phone: '',
                        guardian_dob: '',
                        guarantor1_name: '',
                        guarantor1_nic: '',
                        guarantor1_address: '',
                        guarantor2_name: '',
                        guarantor2_nic: '',
                        guarantor2_address: '',
                        reloan_deduction_amount: 0
                    }));
                    setSelectedCustomerRecord(null);
                    setCustomerActiveLoans([]);
                }
                return;
            }

            // Only search if it looks like a valid NIC format (9+ chars)
            if (searchNic.length < 9) return;

            try {
                setIsAutoFilling(true);
                const foundCustomers = await customerService.globalSearch(searchNic);

                const exactMatch = foundCustomers.find(c => c.customer_code.toUpperCase() === searchNic);
                const customer = exactMatch || (foundCustomers.length === 1 ? foundCustomers[0] : null);

                if (customer) {
                    if (customer.is_out_of_scope) {
                        setNicError(`Customer Found in ${customer.branch_name || 'anothers branch'}. Transfer required.`);
                        setFormData(prev => ({
                            ...prev,
                            center: '',
                            group: '',
                            customer: '',
                            nic: customer.customer_code,
                        }));
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            center: customer.center_id?.toString() || prev.center,
                            group: customer.grp_id?.toString() || prev.group,
                            customer: customer.id.toString(),
                            nic: customer.customer_code,
                        }));
                        setNicError(null);
                    }
                } else if (searchNic.length === 10 || searchNic.length === 12) {
                    // Validate basic format before saying "not found"
                    const isValid = /^([0-9]{9}[V|X]|[0-9]{12})$/.test(searchNic);
                    if (!isValid) {
                        setNicError(`Invalid NIC format: ${searchNic}`);
                    } else {
                        setNicError(`No customer found with NIC: ${searchNic}`);
                    }
                }
            } catch (error) {
                console.error("NIC auto-fill search failed", error);
            } finally {
                setIsAutoFilling(false);
            }
        };

        const timer = setTimeout(fetchCustomerByNIC, 300);
        return () => clearTimeout(timer);
    }, [formData.nic]);

    const handleCustomerChange = useCallback((customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData((prev) => ({
            ...prev,
            customer: customerId,
            nic: customer?.nic || prev.nic
        }));
        setIsDirty(true);
    }, [customers]);

    const handleCenterChange = useCallback((centerId: any) => {
        const center = String(centerId);
        setFormData((prev) => ({
            ...prev,
            center,
            group: '',
            customer: '',
            nic: '',
            guarantor1_name: '',
            guarantor1_nic: '',
            guarantor1_address: '',
            guarantor2_name: '',
            guarantor2_nic: '',
            guarantor2_address: '',
            reloan_deduction_amount: 0
        }));
        setSelectedCustomerRecord(null);
        setCustomerActiveLoans([]);
        setIsDirty(true);
    }, []);

    const handleGroupChange = useCallback((groupId: any) => {
        const group = String(groupId);
        setFormData((prev) => ({
            ...prev,
            group,
            customer: '',
            nic: '',
            guarantor1_name: '',
            guarantor1_nic: '',
            guarantor1_address: '',
            guarantor2_name: '',
            guarantor2_nic: '',
            guarantor2_address: '',
            reloan_deduction_amount: 0
        }));
        setSelectedCustomerRecord(null);
        setCustomerActiveLoans([]);
        setIsDirty(true);
    }, []);

    const updateFormField = useCallback((field: keyof LoanFormData, value: string) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };

            // If any guardian field is manually updated, set source to manual
            if (field.toString().startsWith('guardian_') && field !== 'guardian_nic') {
                newData.guardianSource = 'manual';
            }

            // Product selection auto-fill
            if (field === 'loanProduct') {
                const product = loanProducts.find(p => p.id.toString() === value);
                if (product) {
                    // Always reset to product defaults when selecting a product
                    newData.loanAmount = '';
                    newData.requestedAmount = '';
                    newData.documentationFee = (product.document_fees || 0).toString();

                    // Standardize rentalType for backend validation
                    if (product.term_type?.toLowerCase().includes('month')) {
                        newData.rentalType = 'Monthly';
                    } else if (product.term_type?.toLowerCase().includes('bi')) {
                        newData.rentalType = 'Bi-Weekly';
                    } else {
                        newData.rentalType = 'Weekly';
                    }

                    // Use first term's interest rate and auto-calculate tenure in weeks
                    if (product.product_terms && product.product_terms.length > 0) {
                        const firstTerm = product.product_terms[0];
                        // Calculate weeks multiplier based on term_type
                        const termTypeLower = product.term_type?.toLowerCase() || '';
                        let multiplier = 1; // Weekly
                        if (termTypeLower.includes('month')) multiplier = 4;
                        else if (termTypeLower.includes('bi')) multiplier = 2;
                        const tenureWeeks = firstTerm.term * multiplier;
                        newData.tenure = tenureWeeks.toString();
                        newData.interestRate = firstTerm.interest_rate.toString();
                    } else {
                        newData.interestRate = product.interest_rate.toString();
                        newData.tenure = product.loan_term?.toString() || '';
                    }

                    // Clear calculated rental
                    // @ts-ignore
                    newData.calculated_rental = '';

                    // Basic fee calculation based on new defaults
                    const t = parseInt(newData.tenure);
                    const amount = Number(newData.loanAmount);
                    if (t > 0 && t <= 48) newData.processingFee = (amount * 0.04).toFixed(2);
                    else if (t > 48) newData.processingFee = (amount * 0.06).toFixed(2);
                    else newData.processingFee = '0';
                } else {
                    // Clear product specific fields
                    newData.loanAmount = '';
                    newData.requestedAmount = '';
                    newData.interestRate = '';
                    newData.tenure = '';
                    newData.rentalType = 'Weekly';
                    newData.processingFee = '';
                    newData.documentationFee = '';
                    // @ts-ignore
                    newData.calculated_rental = '';
                }
            }

            // Tenure validation logic (Requirement 8)
            if (field === 'tenure' || field === 'loanAmount') {
                const tenure = parseInt(newData.tenure);
                const amount = Number(newData.loanAmount);

                // If tenure changed, also update the interest rate from product terms
                if (field === 'tenure') {
                    const product = loanProducts.find(p => p.id.toString() === newData.loanProduct);
                    if (product && product.product_terms) {
                        const termMatch = product.product_terms.find(t => t.term.toString() === newData.tenure);
                        if (termMatch) {
                            newData.interestRate = termMatch.interest_rate.toString();
                        }
                    }
                }

                if (tenure > 0 && tenure <= 48) newData.processingFee = (amount * 0.04).toFixed(2);
                else if (tenure > 48) newData.processingFee = (amount * 0.06).toFixed(2);
                else newData.processingFee = '0';
            }

            // Clear rental calculation if inputs change
            if (['loanAmount', 'tenure', 'interestRate', 'loanProduct'].includes(field)) {
                // @ts-ignore
                newData.calculated_rental = '';
            }

            return newData;
        });
        setIsDirty(true);
    }, [loanProducts]);

    const handleDocumentChange = useCallback((type: string, file: File | null) => {
        setFormData((prev) => ({
            ...prev,
            documents: {
                ...prev.documents,
                [type]: file
            }
        }));
        setIsDirty(true);
    }, []);

    const loadFormData = useCallback((data: LoanFormData) => {
        setFormData(data);
        setIsDirty(false);
    }, []);

    const loadFromLoan = useCallback((loan: Loan) => {
        setFormData({
            center: loan.center?.id.toString() || '',
            group: (loan as any).group_id?.toString() || '',
            customer: loan.customer_id.toString(),
            nic: loan.customer?.customer_code || '',
            loanProduct: (loan as any).product_id?.toString() || '',
            originalLoanProductId: (loan as any).product_id?.toString() || '',
            loanAmount: loan.approved_amount.toString(),
            requestedAmount: loan.request_amount?.toString() || loan.approved_amount.toString(),
            interestRate: loan.interest_rate.toString(),
            rentalType: (loan.term_type || loan.product?.term_type)?.toLowerCase().includes('month') ? 'Monthly' :
                (loan.term_type || loan.product?.term_type)?.toLowerCase().includes('bi') ? 'Bi-Weekly' : 'Weekly',
            tenure: loan.terms.toString(),
            processingFee: loan.service_charge?.toString() || '',
            documentationFee: loan.document_charge?.toString() || '',
            insuranceFee: '',
            remarks: loan.notes || loan.loan_step || '',
            status: 'draft',
            guardian_nic: loan.guardian_nic || '',
            guardian_name: loan.guardian_name || '',
            guardian_relationship: loan.guardian_relationship || '',
            guardian_address: loan.guardian_address || '',
            guardian_phone: loan.guardian_phone || '',
            guardian_secondary_phone: loan.guardian_secondary_phone || '',
            guardian_dob: loan.guardian_dob || '',
            guarantor1_name: loan.g1_details?.name || '',
            guarantor1_nic: loan.g1_details?.nic || '',
            guarantor1_address: loan.g1_details?.address || '',
            guarantor2_name: loan.g2_details?.name || '',
            guarantor2_nic: loan.g2_details?.nic || '',
            guarantor2_address: loan.g2_details?.address || '',
            witness1_id: loan.w1_details?.staff_id || '',
            witness2_id: loan.w2_details?.staff_id || '',
            bankName: loan.borrower_bank_details?.bank_name || '',
            bankId: loan.bank_id?.toString() || loan.borrower_bank_details?.bank_id?.toString() || '',
            bankBranch: loan.borrower_bank_details?.branch || '',
            bankBranchId: loan.bank_branch_id?.toString() || loan.borrower_bank_details?.branch_id?.toString() || '',
            accountNumber: loan.borrower_bank_details?.account_number || '',
            monthly_income: loan.monthly_income?.toString() || '',
            monthly_expenses: loan.monthly_expenses?.toString() || '',
            documents: {},
            existingDocuments: loan.documents || []
        });
        setIsDirty(false);
    }, []);

    return {
        formData,
        isDirty,
        setIsDirty,
        centers,
        groups,
        loanProducts,
        staffs,
        filteredCustomers: customers,
        selectedCustomerRecord,
        handleNicChange,
        handleCustomerChange,
        handleCenterChange,
        handleGroupChange,
        updateFormField,
        handleDocumentChange,
        loadFormData,
        loadFromLoan,
        isAutoFilling,
        isGuardianAutoFilling,
        customerActiveLoans,
        nicError
    };
};
