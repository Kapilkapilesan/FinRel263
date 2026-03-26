'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Save, User, DollarSign, Upload, FileText as FileTextIcon } from 'lucide-react';
import { LoanFormData, Loan } from '@/types/loan.types';
import { useLoanForm } from '@/hooks/loan/useLoanForm';
import { useDraftManager } from '@/hooks/loan/useDraftManager';
import { loanService } from '@/services/loan.service';
import { authService } from '@/services/auth.service';
import { ProgressSteps } from './shared/ProgressSteps';
import { StepNavigation } from './shared/StepNavigation';
import { DraftModal } from './shared/DraftModal';
import { toast } from 'react-toastify';
import { CustomerSelection } from './steps/CustomerSelection';
import { LoanDetails } from './steps/LoanDetails';
import { DocumentUpload } from './steps/DocumentUpload';
import { ReviewSubmit } from './steps/ReviewSubmit';
import { REQUIRED_DOCUMENTS } from '@/constants/loan.constants';
import { useSearchParams } from 'next/navigation';
import { isValidNIC, extractGenderFromNIC } from '@/utils/loan.utils';
import { colors } from '@/themes/colors';
import { ActionConfirmModal } from '../common/ActionConfirmModal';

export function LoanCreation() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStep3Errors, setShowStep3Errors] = useState(false);
    const [showDraftDeleteConfirm, setShowDraftDeleteConfirm] = useState(false);
    const [showManualDraftDeleteConfirm, setShowManualDraftDeleteConfirm] = useState(false);
    const [pendingDraftToDelete, setPendingDraftToDelete] = useState<string | null>(null);
    const [isProductLockedFromStep1, setIsProductLockedFromStep1] = useState(false);

    const {
        formData,
        isDirty,
        setIsDirty,
        centers,
        groups,
        loanProducts,
        staffs,
        filteredCustomers,
        selectedCustomerRecord,
        handleNicChange,
        handleCustomerChange,
        handleCenterChange,
        handleGroupChange,
        updateFormField,
        loadFormData,
        loadFromLoan,
        isAutoFilling,
        isGuardianAutoFilling,
        customerActiveLoans,
        nicError,
        handleDocumentChange
    } = useLoanForm();

    const isReloanBlocked = !!(
        customerActiveLoans.includes(Number(formData.loanProduct)) &&
        selectedCustomerRecord?.reloan_eligibility &&
        !selectedCustomerRecord.reloan_eligibility.isEligible
    );

    // const searchParams = useSearchParams();
    // const editId = searchParams.get('edit');

    // useEffect(() => {
    //     // Edit logic moved to LoanEdit.tsx
    // }, []);

    // Track unsaved changes for browser navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isSubmitting) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, isSubmitting]);

    // Scroll to top when step changes
    useEffect(() => {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep]);

    const handleLoadDraft = useCallback(
        (data: LoanFormData, step: number) => {
            loadFormData(data);
            setCurrentStep(step);
            setIsDirty(false);
        },
        [loadFormData, setIsDirty]
    );

    const {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
        loadedDraftId,
        saveDraft,
        loadDraft,
        deleteDraft,
    } = useDraftManager(
        formData,
        currentStep,
        selectedCustomerRecord?.displayName,
        handleLoadDraft
    );

    const steps = [
        { number: 1, title: 'Select Customer', description: 'Select center, group and customer', icon: <User className="w-4 h-4" style={{ color: colors.primary[600] }} /> },
        { number: 2, title: 'Loan Details', description: 'Enter loan amount and terms', icon: <DollarSign className="w-4 h-4" style={{ color: colors.primary[600] }} /> },
        { number: 3, title: 'Documents', description: 'Upload required documents', icon: <Upload className="w-4 h-4" style={{ color: colors.primary[600] }} /> },
        { number: 4, title: 'Review & Submit', description: 'Review and submit for approval', icon: <FileTextIcon className="w-4 h-4" style={{ color: colors.primary[600] }} /> }
    ];

    const validateStep1 = () => {
        if (!formData.center) return 'Please select a Center.';
        if (!formData.group) return 'Please select a Group.';
        if (!formData.customer) return 'Please select a Customer.';
        if (!selectedCustomerRecord) return 'Invalid Customer selected.';

        const currentProduct = loanProducts.find(p => p.id === Number(formData.loanProduct));
        const isAdvanceLoan = currentProduct?.product_type === 'advance_loan';

        // Skip Joint Borrower (Guardian) validation for Advance Loans
        if (!isAdvanceLoan) {
            if (!formData.guardian_nic) return 'Joint Borrower NIC is required.';
            if (!isValidNIC(formData.guardian_nic)) return 'Invalid Joint Borrower NIC format.';

            const guardianGender = extractGenderFromNIC(formData.guardian_nic);
            if (guardianGender !== 'Male') return 'Joint Borrower must be a male.';

            if (!formData.guardian_name) return 'Joint Borrower Name is required.';
            if (!formData.guardian_relationship) return 'Relationship to Joint Borrower is required.';
            if (!formData.guardian_address) return 'Joint Borrower Address is required.';
            if (!formData.guardian_phone) return 'Joint Borrower Phone is required.';
            if (!/^\d{10}$/.test(formData.guardian_phone)) return 'Joint Borrower Phone must be 10 digits.';
            if (!formData.guardian_dob) return 'Joint Borrower Date of Birth is required.';
        }

        if (!formData.witness1_id) return 'Witness 01 is required.';
        if (!formData.witness2_id) return 'Witness 02 is required.';
        if (formData.witness1_id === formData.witness2_id) return 'Witness 01 and 02 cannot be the same person.';

        if (!formData.monthly_income || Number(formData.monthly_income) <= 0) return 'Please provide a valid Monthly Income.';
        if (!formData.monthly_expenses || Number(formData.monthly_expenses) < 0) return 'Please provide valid Monthly Expenses.';

        return null;
    };

    const validateStep2 = () => {
        if (!formData.loanProduct) return 'Please select a Loan Product.';
        const currentProduct = loanProducts.find(p => p.id === Number(formData.loanProduct));
        const minLimit = currentProduct?.loan_amount || 0;
        // If loan_limited_amount is 0 or null, we treat it as no upper limit effectively (or very high)
        // But if it's set, we respect it.
        const maxLimit = currentProduct?.loan_limited_amount ? currentProduct.loan_limited_amount : Number.MAX_SAFE_INTEGER;
        const displayMaxLimit = currentProduct?.loan_limited_amount ? currentProduct.loan_limited_amount.toLocaleString() : 'Unlimited';

        const reqAmt = Number(formData.requestedAmount);
        if (!formData.requestedAmount || reqAmt <= 0) return 'Valid Requested Amount is required.';
        // Requested amount can be outside product min/max limits

        const appAmt = Number(formData.loanAmount);
        if (!formData.loanAmount || appAmt <= 0) return 'Valid Approved Amount is required.';
        if (appAmt < minLimit || appAmt > maxLimit) {
            return `Approved Amount must be between LKR ${minLimit.toLocaleString()} and LKR ${displayMaxLimit}.`;
        }

        if (appAmt > reqAmt) {
            return 'Approved Amount cannot exceed Requested Amount.';
        }

        if (Number(formData.documentationFee || 0) > Number(formData.loanAmount)) {
            return 'Documentation Fee cannot be greater than the Approved Loan Amount.';
        }

        if (!formData.interestRate || Number(formData.interestRate) < 0) return 'Valid Interest Rate is required.';
        if (!formData.tenure || Number(formData.tenure) <= 0) return 'Valid Tenure is required.';

        // --- 🔒 ADVANCE LOAN VALIDATION ---
        if (currentProduct?.product_type === 'advance_loan') {
            // New customer check (frontend)
            if (!selectedCustomerRecord?.totalLoanCount || selectedCustomerRecord.totalLoanCount === 0) {
                return 'New customers are not eligible for Advance Loans. Customer must have a previous loan history.';
            }

            // Must have an active loan (Requirement: "customer want also have loan or want to already take loan")
            const hasOngoingLoan = customerActiveLoans.length > 0;
            if (!hasOngoingLoan) {
                return 'Advance Loans are only available for customers with an existing active or pending loan.';
            }

            // Bypass guarantor checks below
        } else {
            // Standard Loan Logic: Prevent duplicate active loan of same type UNLESS eligible for reloan
            if (customerActiveLoans.includes(Number(formData.loanProduct))) {
                const isEligible = selectedCustomerRecord?.reloan_eligibility?.isEligible;
                if (!isEligible) {
                    const product = loanProducts.find(p => p.id === Number(formData.loanProduct));
                    return `Customer already has an active ${product?.product_name || 'selected'} loan and is not yet eligible for a reloan (min. 70% payment progress required).`;
                }
            }

            // Standard Loan logic: Ensure guarantors are present
            if (!formData.guarantor1_name || !formData.guarantor1_nic) {
                return 'Guarantor 01 is missing. Ensure the selected group has other active members.';
            }
            if (!formData.guarantor2_name || !formData.guarantor2_nic) {
                return 'Guarantor 02 is missing. Ensure the selected group has at least 3 members.';
            }
        }

        if (!formData.bankName) return 'Bank selection is mandatory.';
        if (!formData.bankBranch) return 'Bank Branch is mandatory.';
        if (!formData.accountNumber) return 'Account Number is mandatory.';

        return null;
    };

    const validateStep3 = () => {
        const missingDocs = (REQUIRED_DOCUMENTS as unknown as string[]).filter((type: string) => {
            const hasNewDoc = !!formData.documents[type];
            const hasExistingDoc = formData.existingDocuments?.some(doc => doc.type === type);
            return !hasNewDoc && !hasExistingDoc;
        });

        if (missingDocs.length > 0) {
            return `The following documents are mandatory: ${missingDocs.join(', ')}`;
        }
        return null;
    };

    const handleStepClick = useCallback((stepNumber: number) => {
        if (stepNumber <= currentStep) {
            setCurrentStep(stepNumber);
            return;
        }

        // Sequentially validate steps when trying to jump forward
        for (let i = 1; i < stepNumber; i++) {
            let error = null;
            if (i === 1) {
                error = validateStep1();
                if (!error) setIsProductLockedFromStep1(!!formData.loanProduct);
            }
            if (i === 2) error = validateStep2();
            if (i === 3) {
                error = validateStep3();
                if (error) setShowStep3Errors(true);
            }

            if (error) {
                toast.warning(`Wait! Please complete Step ${i} first: ${error}`);
                setCurrentStep(i);
                return;
            }
        }

        setCurrentStep(stepNumber);
    }, [currentStep, formData, selectedCustomerRecord]);

    const handleNext = useCallback(() => {
        let error = null;
        if (currentStep === 1) {
            error = validateStep1();
            if (!error) setIsProductLockedFromStep1(!!formData.loanProduct);
        }
        else if (currentStep === 2) error = validateStep2();
        else if (currentStep === 3) {
            error = validateStep3();
            if (error) setShowStep3Errors(true);
        }

        if (error) {
            toast.error(error);
            return;
        }

        if (currentStep === 3 && !error) setShowStep3Errors(false);

        if (currentStep < 4) setCurrentStep(currentStep + 1);
    }, [currentStep, formData, selectedCustomerRecord]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    }, [currentStep]);

    const handleSaveDraft = useCallback(async () => {
        const result = await saveDraft();
        if (result.success) {
            setIsDirty(false); // Reset dirty after explicit save
            toast.success(result.message);
        } else {
            toast.info(result.message);
        }
    }, [saveDraft, setIsDirty]);

    const handleLoadDraftClick = useCallback(
        (draftId: string) => {
            const result = loadDraft(draftId);
            if (result.success) {
                toast.success(result.message);
            }
        },
        [loadDraft]
    );

    const handleDeleteDraft = useCallback(
        (draftId: string) => {
            setPendingDraftToDelete(draftId);
            setShowManualDraftDeleteConfirm(true);
        },
        []
    );

    const handleConfirmManualDraftDelete = async () => {
        if (pendingDraftToDelete) {
            const result = await deleteDraft(pendingDraftToDelete);
            if (result.success) {
                toast.info(result.message);
            }
        }
        setShowManualDraftDeleteConfirm(false);
        setPendingDraftToDelete(null);
    };

    const onDocumentChange = useCallback((type: string, file: File | null) => {
        handleDocumentChange(type, file);
        setShowStep3Errors(false);
    }, [handleDocumentChange]);

    const redirectToDashboard = useCallback(() => {
        const canApprove = authService.hasPermission('loans.approve');
        window.location.href = canApprove ? '/loans/approval' : '/loans';
    }, []);

    const handleConfirmDraftDelete = async () => {
        if (pendingDraftToDelete) {
            await deleteDraft(pendingDraftToDelete);
        }
        redirectToDashboard();
    };

    const handleSubmit = useCallback(async () => {
        // Final sequential validation
        const err1 = validateStep1();
        if (err1) { toast.error(`Step 1: ${err1}`); setCurrentStep(1); return; }

        const err2 = validateStep2();
        if (err2) { toast.error(`Step 2: ${err2}`); setCurrentStep(2); return; }

        const err3 = validateStep3();
        if (err3) { toast.error(`Step 3: ${err3}`); setCurrentStep(3); return; }

        try {
            // Calculate original term count (installments) from tenure in weeks
            // e.g., for 12 Monthly (48 weeks): terms = 12, not 48
            const selectedProd = loanProducts.find(p => p.id === Number(formData.loanProduct));
            const termTypeLower = selectedProd?.term_type?.toLowerCase() || '';
            let weekMultiplier = 1;
            if (termTypeLower.includes('month')) weekMultiplier = 4;
            else if (termTypeLower.includes('bi')) weekMultiplier = 2;
            const originalTerms = Number(formData.tenure) / weekMultiplier;

            const payload = {
                product_id: formData.loanProduct,
                CSU_id: formData.center,
                customer_id: formData.customer,
                group_id: formData.group || null,
                request_amount: Number(formData.requestedAmount),
                approved_amount: Number(formData.loanAmount),
                terms: originalTerms,
                interest_rate: Number(formData.interestRate),
                loan_step: 'New Loan Application',
                service_charge: Number(formData.processingFee || 0),
                document_charge: Number(formData.documentationFee || 0),
                rentalType: formData.rentalType,
                guardian_nic: formData.guardian_nic,
                guardian_name: formData.guardian_name,
                guardian_relationship: formData.guardian_relationship,
                guardian_address: formData.guardian_address,
                guardian_phone: formData.guardian_phone,
                guardian_secondary_phone: formData.guardian_secondary_phone,
                reloan_deduction_amount: Number(formData.reloan_deduction_amount || 0),
                guarantor1_name: formData.guarantor1_name,
                guarantor1_nic: formData.guarantor1_nic,
                guarantor1_address: formData.guarantor1_address,
                guarantor2_name: formData.guarantor2_name,
                guarantor2_nic: formData.guarantor2_nic,
                guarantor2_address: formData.guarantor2_address,
                witness1_id: formData.witness1_id,
                witness2_id: formData.witness2_id,
                bankName: formData.bankName,
                bankId: formData.bankId,
                bankBranch: formData.bankBranch,
                bankBranchId: formData.bankBranchId,
                accountNumber: formData.accountNumber,
                monthly_income: Number(formData.monthly_income),
                monthly_expenses: Number(formData.monthly_expenses),
                guardian_dob: formData.guardian_dob,
                notes: formData.remarks
            };

            setIsSubmitting(true);
            const result = await loanService.createLoan(payload);
            const createdLoanId = result.id;

            // Upload documents if any (filter out non-File entries from loaded drafts)
            const docEntries = Object.entries(formData.documents || {}).filter(([_, file]) => file instanceof File);
            if (docEntries.length > 0) {
                toast.info(`Uploading ${docEntries.length} documents...`);
                await Promise.all(
                    docEntries.map(([type, file]) =>
                        loanService.uploadDocument(createdLoanId, type, file as File)
                    )
                );
            }

            console.log('Loan created:', result);
            toast.success('Loan application submitted for approval successfully!');

            setIsDirty(false);

            if (loadedDraftId) {
                setPendingDraftToDelete(loadedDraftId);
                setShowDraftDeleteConfirm(true);
            } else {
                // Redirect if no draft to delete
                redirectToDashboard();
            }
        } catch (error: any) {
            setIsSubmitting(false);
            console.error('Submission failed:', error);
            toast.error('Failed to submit loan: ' + (error.message || 'Unknown error'));
        }
    }, [formData, loadedDraftId, setIsDirty, redirectToDashboard, validateStep1, validateStep2, validateStep3]);



    return (
        <div className="space-y-4">
            <DraftModal
                isOpen={isDraftModalOpen}
                drafts={drafts}
                onClose={() => setIsDraftModalOpen(false)}
                onLoad={handleLoadDraftClick}
                onDelete={handleDeleteDraft}
            />

            <ActionConfirmModal
                isOpen={showDraftDeleteConfirm}
                onClose={() => {
                    setShowDraftDeleteConfirm(false);
                    redirectToDashboard();
                }}
                onConfirm={async () => {
                    await handleConfirmDraftDelete();
                }}
                title="Application Submitted"
                message="Loan submitted successfully! Do you want to delete the draft used for this application?"
                confirmLabel="Delete Draft"
                variant="success"
            />

            <ActionConfirmModal
                isOpen={showManualDraftDeleteConfirm}
                onClose={() => {
                    setShowManualDraftDeleteConfirm(false);
                    setPendingDraftToDelete(null);
                }}
                onConfirm={async () => {
                    await handleConfirmManualDraftDelete();
                }}
                title="Delete Draft"
                message="Are you sure you want to delete this draft? This action cannot be undone."
                confirmLabel="Delete Permanently"
                variant="danger"
            />

            <div className="flex items-center justify-between flex-wrap gap-5">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">Create New Loan</h1>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60">Fill in the details to create a new loan application</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsDraftModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-card border border-border-default text-text-muted rounded-xl hover:bg-hover hover:text-text-primary transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        <span>View Drafts</span>
                    </button>
                    <button
                        onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:opacity-90 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/10"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Draft</span>
                    </button>
                </div>
            </div>

            <ProgressSteps steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

            <div className="bg-card rounded-[2rem] p-6 border border-border-default shadow-xl transition-colors min-h-[500px]">
                {currentStep === 1 && (
                    <CustomerSelection
                        formData={formData}
                        centers={centers}
                        groups={groups}
                        filteredCustomers={filteredCustomers}
                        selectedCustomerRecord={selectedCustomerRecord}
                        onNicChange={handleNicChange}
                        onCenterChange={handleCenterChange}
                        onGroupChange={handleGroupChange}
                        onCustomerChange={handleCustomerChange}
                        onFieldChange={updateFormField}
                        staffs={staffs}
                        loanProducts={loanProducts}
                        customerActiveLoans={customerActiveLoans}
                        isAutoFilling={isAutoFilling}
                        isGuardianAutoFilling={isGuardianAutoFilling}
                        nicError={nicError}
                    />
                )}

                {currentStep === 2 && (
                    <LoanDetails
                        formData={formData}
                        loanProducts={loanProducts}
                        onFieldChange={updateFormField}
                        customerActiveLoans={customerActiveLoans}
                        isLockedFromStep1={isProductLockedFromStep1}
                    />
                )}

                {currentStep === 3 && (
                    <DocumentUpload
                        formData={formData}
                        onDocumentChange={onDocumentChange}
                        showErrors={showStep3Errors}
                    />
                )}

                {currentStep === 4 && (
                    <ReviewSubmit
                        formData={formData}
                        selectedCustomerRecord={selectedCustomerRecord}
                        staffs={staffs}
                        centers={centers}
                        groups={groups}
                        loanProducts={loanProducts}
                    />
                )}
            </div>

            <StepNavigation
                currentStep={currentStep}
                totalSteps={4}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSubmit={handleSubmit}
                isNextDisabled={currentStep === 1 && isReloanBlocked}
            />
        </div >
    );
}
