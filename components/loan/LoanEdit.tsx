'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FileText as FileTextIcon, User, DollarSign, Upload, Save } from 'lucide-react';
import { useLoanForm } from '@/hooks/loan/useLoanForm';
import { loanService } from '@/services/loan.service';
import { authService } from '@/services/auth.service';
import { ProgressSteps } from './shared/ProgressSteps';
import { StepNavigation } from './shared/StepNavigation';
import { toast } from 'react-toastify';
import { CustomerSelection } from './steps/CustomerSelection';
import { LoanDetails } from './steps/LoanDetails';
import { DocumentUpload } from './steps/DocumentUpload';
import { ReviewSubmit } from './steps/ReviewSubmit';
import { useSearchParams, useRouter } from 'next/navigation';
import { isValidNIC, extractGenderFromNIC } from '@/utils/loan.utils';

export function LoanEdit() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProductLockedFromStep1, setIsProductLockedFromStep1] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

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
        loadFromLoan,
        isAutoFilling,
        isGuardianAutoFilling,
        customerActiveLoans,
        handleDocumentChange,
        nicError
    } = useLoanForm();

    // Load loan data for editing
    useEffect(() => {
        if (editId) {
            const fetchAndLoad = async () => {
                try {
                    const loan = await loanService.getLoanById(editId);
                    loadFromLoan(loan);
                    setIsDirty(false);
                } catch (err) {
                    console.error('Failed to load loan for editing:', err);
                    toast.error('Failed to load loan details.');
                }
            };
            fetchAndLoad();
        } else {
            toast.error('No loan ID provided for editing.');
            router.push('/loans/create');
        }
    }, [editId, loadFromLoan, setIsDirty, router]);

    // Track unsaved changes
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

    const steps = [
        { number: 1, title: 'Select Customer', description: 'Modify customer details if needed', icon: <User className="w-4 h-4" /> },
        { number: 2, title: 'Loan Details', description: 'Update loan amount and terms', icon: <DollarSign className="w-4 h-4" /> },
        { number: 3, title: 'Documents', description: 'Update required documents', icon: <Upload className="w-4 h-4" /> },
        { number: 4, title: 'Review & Submit', description: 'Review and resubmit for approval', icon: <FileTextIcon className="w-4 h-4" /> }
    ];

    const validateStep1 = () => {
        if (!formData.center) return 'Please select a Center.';
        if (!formData.group) return 'Please select a Group.';
        if (!formData.customer) return 'Please select a Customer.';
        if (!selectedCustomerRecord) return 'Invalid Customer selected.';

        if (!formData.guardian_nic) return 'Joint Borrower NIC is required.';
        if (!isValidNIC(formData.guardian_nic)) return 'Invalid Joint Borrower NIC format.';

        const guardianGender = extractGenderFromNIC(formData.guardian_nic);
        if (guardianGender !== 'Male') return 'Joint Borrower must be a male.';

        if (!formData.guardian_name) return 'Joint Borrower Name is required.';
        if (!formData.guardian_address) return 'Joint Borrower Address is required.';
        if (!formData.guardian_phone) return 'Joint Borrower Phone is required.';
        if (!/^\d{10}$/.test(formData.guardian_phone)) return 'Joint Borrower Phone must be 10 digits.';
        if (!formData.guardian_dob) return 'Joint Borrower Date of Birth is required.';
        if (!formData.guardian_relationship) return 'Joint Borrower Relationship is required.';

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
        const maxLimit = currentProduct?.loan_limited_amount || 500000;

        const reqAmt = Number(formData.requestedAmount);
        if (!formData.requestedAmount || reqAmt <= 0) return 'Valid Requested Amount is required.';
        // Requested amount can be outside product min/max limits

        const appAmt = Number(formData.loanAmount);
        if (!formData.loanAmount || appAmt <= 0) return 'Valid Approved Amount is required.';
        if (appAmt < minLimit || appAmt > maxLimit) {
            return `Approved Amount must be between LKR ${minLimit.toLocaleString()} and LKR ${maxLimit.toLocaleString()}.`;
        }

        if (appAmt > reqAmt) {
            return 'Approved Amount cannot exceed Requested Amount.';
        }

        if (Number(formData.documentationFee || 0) > Number(formData.loanAmount)) {
            return 'Documentation Fee cannot be greater than the Approved Loan Amount.';
        }

        if (!formData.interestRate || Number(formData.interestRate) < 0) return 'Valid Interest Rate is required.';
        if (!formData.tenure || Number(formData.tenure) <= 0) return 'Valid Tenure is required.';

        if (!formData.guarantor1_name || !formData.guarantor1_nic) {
            return 'Guarantor 01 is missing.';
        }
        if (!formData.guarantor2_name || !formData.guarantor2_nic) {
            return 'Guarantor 02 is missing.';
        }

        if (!formData.bankName) return 'Bank selection is mandatory.';
        if (!formData.bankBranch) return 'Bank Branch is mandatory.';
        if (!formData.accountNumber) return 'Account Number is mandatory.';

        return null;
    };

    const handleStepClick = useCallback((stepNumber: number) => {
        if (stepNumber <= currentStep) {
            setCurrentStep(stepNumber);
            return;
        }

        for (let i = 1; i < stepNumber; i++) {
            let error = null;
            if (i === 1) {
                error = validateStep1();
                if (!error) setIsProductLockedFromStep1(!!formData.loanProduct);
            }
            if (i === 2) error = validateStep2();

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
            const REQUIRED_DOCUMENTS = ['NIC Copy', 'Guardian NIC', 'Bank Statement'];
            const missingDocs = REQUIRED_DOCUMENTS.filter((type: string) => {
                const hasNewDoc = !!formData.documents[type];
                const hasExistingDoc = formData.existingDocuments?.some(doc => doc.type === type);
                return !hasNewDoc && !hasExistingDoc;
            });
            if (missingDocs.length > 0) {
                error = `The following documents are mandatory: ${missingDocs.join(', ')}`;
            }
        }

        if (error) {
            toast.error(error);
            return;
        }

        if (currentStep < 4) setCurrentStep(currentStep + 1);
    }, [currentStep, formData, selectedCustomerRecord]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    }, [currentStep]);

    const handleSubmit = useCallback(async () => {
        const err1 = validateStep1();
        if (err1) { toast.error(`Step 1: ${err1}`); setCurrentStep(1); return; }

        const err2 = validateStep2();
        if (err2) { toast.error(`Step 2: ${err2}`); setCurrentStep(2); return; }

        try {
            // Calculate original term count (installments) from tenure in weeks
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
                loan_step: 'Resubmitted Loan Application',
                service_charge: Number(formData.processingFee || 0),
                document_charge: Number(formData.documentationFee || 0),
                rentalType: formData.rentalType,
                guardian_nic: formData.guardian_nic,
                guardian_name: formData.guardian_name,
                guardian_address: formData.guardian_address,
                guardian_phone: formData.guardian_phone,
                guardian_relationship: formData.guardian_relationship,
                guardian_secondary_phone: formData.guardian_secondary_phone,
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
                reloan_deduction_amount: Number(formData.reloan_deduction_amount || 0),
                monthly_income: Number(formData.monthly_income),
                monthly_expenses: Number(formData.monthly_expenses),
                guardian_dob: formData.guardian_dob,
                notes: formData.remarks,
                edit_id: editId || undefined
            };

            setIsSubmitting(true);
            const result = await loanService.createLoan(payload);
            const loanId = result.id || editId;

            if (!loanId) {
                throw new Error('Valid Loan ID not found.');
            }

            // Upload documents if any new ones picked
            const docEntries = Object.entries(formData.documents || {}).filter(([_, file]) => !!file);
            if (docEntries.length > 0) {
                toast.info(`Uploading ${docEntries.length} new documents...`);
                await Promise.all(
                    docEntries.map(([type, file]) =>
                        loanService.uploadDocument(loanId, type, file as File)
                    )
                );
            }

            console.log('Loan updated:', result);
            toast.success('Loan application updated and resubmitted successfully!');

            setIsDirty(false);

            // Redirect based on permissions
            const canApprove = authService.hasPermission('loans.approve');
            window.location.href = canApprove ? '/loans/approval' : '/loans/sent-back';
        } catch (error: any) {
            setIsSubmitting(false);
            console.error('Submission failed:', error);
            toast.error('Failed to update loan: ' + (error.message || 'Unknown error'));
        }
    }, [formData, editId, setIsDirty]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Loan Application</h1>
                    <p className="text-sm text-gray-500 mt-1">Modify and resubmit the returned loan application</p>
                </div>
            </div>

            <ProgressSteps steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

            <div className="bg-white rounded-lg p-6 border border-gray-200">
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
                        isEditMode={true}
                    />
                )}

                {currentStep === 2 && (
                    <LoanDetails
                        formData={formData}
                        loanProducts={loanProducts}
                        onFieldChange={updateFormField}
                        customerActiveLoans={customerActiveLoans}
                        isEditMode={true}
                        isLockedFromStep1={isProductLockedFromStep1}
                    />
                )}

                {currentStep === 3 && (
                    <DocumentUpload
                        formData={formData}
                        onDocumentChange={handleDocumentChange}
                    />
                )}

                {currentStep === 4 && (
                    <ReviewSubmit
                        formData={formData}
                        selectedCustomerRecord={selectedCustomerRecord}
                        staffs={staffs}
                        centers={centers}
                        groups={groups}
                        isEditMode={true}
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
            />
        </div>
    );
}
