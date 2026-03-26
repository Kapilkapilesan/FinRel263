import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, User, DollarSign, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { colors } from '@/themes/colors';
import { LoanApprovalItem } from '@/types/loan-approval.types';
import { StatusBadge } from './StatusBadge';
import { authService } from '@/services/auth.service';
import { ProgressSteps } from '../shared/ProgressSteps';
import { formatCurrency, getDocumentUrl } from '@/utils/loan.utils';
import { DocumentPreviewModal } from '../../common/DocumentPreviewModal';
import { API_BASE_URL } from '@/services/api.config';

interface ApprovalModalProps {
    loan: LoanApprovalItem;
    onClose: () => void;
    onFirstApproval: (loanId: string, action: 'approve' | 'sendback', reason?: string) => void;
    onSecondApproval: (loanId: string, action: 'approve' | 'sendback', reason?: string) => void;
    isProcessing?: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    loan,
    onClose,
    onFirstApproval,
    onSecondApproval,
    isProcessing = false
}) => {
    const [currentStep, setCurrentStep] = useState<number>(() => {
        if (loan.status === 'Pending 2nd') return 4;
        if (loan.status === 'Pending 1st' || loan.status === 'Sent Back') return 3;
        return 1;
    });

    const [note, setNote] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string } | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    const isManager = authService.hasPermission('loans.approve') && !authService.hasPermission('loans.final_approve');
    const isAdmin = authService.hasPermission('loans.final_approve');
    // Permission-based edit control: allow if user has loans.edit OR (legacy FO pattern)
    const canEditLoan =
        authService.hasPermission('loans.edit') ||
        (authService.hasPermission('loans.create') && !authService.hasPermission('loans.approve'));

    const steps = [
        { number: 1, title: 'Customer Info', description: 'Identity verification', icon: <User className="w-4 h-4" /> },
        { number: 2, title: 'Loan Details', description: 'Financial summary', icon: <DollarSign className="w-4 h-4" /> },
        { number: 3, title: '1st Approval', description: 'Manager level review', icon: <CheckCircle className="w-4 h-4" /> },
        {
            number: 4,
            title: '2nd Approval',
            description: loan.loanAmount >= 200000 ? 'Admin level review' : 'Not Required',
            icon: <ShieldCheck className="w-4 h-4" />
        }
    ];

    const renderStepContent = () => {
        const { rawLoan } = loan;

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {loan.status === 'Sent Back' && loan.rejectionReason && (
                            <div className="bg-primary-500/10 border-2 border-primary-500/20 rounded-2xl p-6 flex items-start gap-4 mb-8">
                                <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-600 shrink-0 border border-primary-500/30">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-primary-600 dark:text-primary-400 text-sm uppercase tracking-wider">Modification Required</p>
                                    <p className="text-sm font-medium text-text-primary mt-1 leading-relaxed">
                                        "{loan.rejectionReason}"
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card border border-border-default rounded-2xl p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                    Customer Profile
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Full Name</span>
                                        <span className="font-bold text-text-primary">{loan.customerName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">NIC Number</span>
                                        <span className="font-bold text-text-primary">{loan.nic}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Center</span>
                                        <span className="font-bold text-text-primary">{loan.loanDetails.center}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Group</span>
                                        <span className="font-bold text-text-primary">{loan.loanDetails.group}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Branch</span>
                                        <span className="font-bold text-text-primary">{loan.loanDetails.branchName || 'Not Assigned'}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-muted-bg/50 -mx-6 px-6 py-2 mt-2">
                                        <span className="text-text-muted font-bold text-xs uppercase tracking-tight">Field Officer</span>
                                        <span className="font-bold text-text-primary text-sm">{loan.staff}</span>
                                    </div>
                                    <div className="flex justify-between items-center -mx-6 px-6 py-2 bg-primary-500/10">
                                        <span className="font-bold text-xs uppercase tracking-tight text-primary-600">Branch Manager</span>
                                        <span className="font-black text-text-primary text-sm">{loan.loanDetails.branchManager}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border-default rounded-2xl p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                    Joint Borrower Info
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center text-right">
                                        <span className="text-text-secondary font-medium text-left">Name</span>
                                        <span className="font-bold text-text-primary">{rawLoan?.guardian_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Phone</span>
                                        <span className="font-bold text-text-primary">{rawLoan?.guardian_phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-text-secondary font-medium shrink-0">Address</span>
                                        <span className="font-bold text-text-primary text-right leading-tight">{rawLoan?.guardian_address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border-default rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                Guarantors Details
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                                <div className="p-4 bg-muted-bg/50 rounded-xl border border-border-divider">
                                    <p className="text-text-muted font-bold text-[10px] uppercase tracking-wider mb-2">Guarantor 01</p>
                                    <p className="font-bold text-text-primary text-base">{rawLoan?.g1_details?.name || 'N/A'}</p>
                                    <p className="text-xs text-text-muted font-medium mt-1">NIC: {rawLoan?.g1_details?.nic || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-muted-bg/50 rounded-xl border border-border-divider">
                                    <p className="text-text-muted font-bold text-[10px] uppercase tracking-wider mb-2">Guarantor 02</p>
                                    <p className="font-bold text-text-primary text-base">{rawLoan?.g2_details?.name || 'N/A'}</p>
                                    <p className="text-xs text-text-muted font-medium mt-1">NIC: {rawLoan?.g2_details?.nic || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border-default rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                Documents & Verification
                            </h3>
                            {rawLoan?.documents && rawLoan.documents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rawLoan.documents.map((doc) => (
                                        <div key={doc.id} className="flex flex-col p-4 bg-muted-bg/30 rounded-xl border border-border-divider group transition-all hover:bg-card hover:shadow-md">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border-divider text-primary-600">
                                                    {doc.type.toLowerCase().includes('photo') ? (
                                                        <User className="w-5 h-5" />
                                                    ) : doc.type.toLowerCase().includes('nic') ? (
                                                        <ShieldCheck className="w-5 h-5" />
                                                    ) : (
                                                        <DollarSign className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-text-primary truncate">{doc.type}</p>
                                                    <p className="text-[10px] text-text-muted font-medium truncate">
                                                        {(doc.file_size / 1024 / 1024).toFixed(2) || 0} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewDoc({
                                                    url: `${API_BASE_URL}/media/loan-documents/${doc.id}`,
                                                    type: doc.type
                                                })}
                                                className="mt-auto py-2 px-4 bg-card border border-border-default text-xs font-bold rounded-lg transition-all text-center text-primary-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 shadow-sm"
                                            >
                                                View Document
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-muted-bg/20 rounded-2xl border-2 border-dashed border-border-divider">
                                    <p className="text-sm text-text-muted font-medium italic">No documents uploaded for this application</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card border border-border-default rounded-2xl p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                    Loan Assessment
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Loan Amount</span>
                                        <span className="font-black text-text-primary text-lg">{formatCurrency(loan.loanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Interest Rate</span>
                                        <span className="font-bold text-text-primary">{loan.loanDetails.interestRate}% Monthly</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Tenure</span>
                                        <span className="font-bold text-text-primary">{loan.loanDetails.tenure} months</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border-default rounded-2xl p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                    Bank Details
                                </h3>
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Bank Name</span>
                                        <span className="font-bold text-text-primary">{rawLoan?.borrower_bank_details?.bank_name || 'Not Provided'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-text-secondary font-medium">Account Number</span>
                                        <span className="font-bold text-text-primary">{rawLoan?.borrower_bank_details?.account_number || 'Not Provided'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl p-6 shadow-xl relative overflow-hidden bg-primary-600 text-white shadow-primary-500/20 border border-primary-500/20">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <ShieldCheck className="w-24 h-24" />
                                </div>
                                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 relative z-10 text-primary-50">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    Disbursement Summary
                                </h3>
                                <div className="space-y-3.5 text-sm relative z-10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary-100">Approved Amount</span>
                                        <span className="font-bold">{formatCurrency(loan.loanAmount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary-100">Deducted Fees</span>
                                        <span className="font-bold">
                                            - {formatCurrency(Number(rawLoan?.service_charge || 0) + Number(rawLoan?.document_charge || 0))}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex justify-between items-end border-primary-400/50">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-primary-200">Net Payable</p>
                                            <p className="text-2xl font-black">
                                                {formatCurrency(loan.loanAmount - (Number(rawLoan?.service_charge || 0) + Number(rawLoan?.document_charge || 0)))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border-default rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                Internal References
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm text-text-secondary">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">Witness 01 (Verified Staff)</p>
                                    <p className="font-bold text-text-primary">{rawLoan?.w1_details?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">Witness 02 (Verified Staff)</p>
                                    <p className="font-bold text-text-primary">{rawLoan?.w2_details?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div >
                );
            case 3:
                return (
                    <div className="space-y-4 py-2 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${loan.firstApproval === 'Approved' ? 'bg-primary-500/10 text-primary-500' : 'bg-primary-500/10 text-primary-500'}`}>
                                {loan.firstApproval === 'Approved' ? <CheckCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-text-primary">1st Level Approval</h3>
                                <p className="text-xs text-text-secondary font-medium">Standard validation required for all loan disbursements</p>
                            </div>
                        </div>

                        {loan.firstApproval === 'Pending' ? (
                            <div className="bg-card border-2 border-dashed border-border-divider rounded-2xl p-5 flex flex-col items-center shadow-sm">
                                {isManager ? (
                                    <div className="space-y-4 w-full">
                                        {/* <div className="p-4 rounded-2xl border flex items-start gap-4 mx-auto max-w-lg bg-primary-500/10 border-primary-500/20">
                                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-primary-600" />
                                            <p className="text-sm leading-relaxed text-text-primary">
                                                By approving this, you confirm that you have verified the customer identity, guarantor availability, and the specified loan terms are accurate.
                                            </p>
                                        </div> */}

                                        {isRejecting ? (
                                            <div className="space-y-4 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
                                                <div>
                                                    <label className="block text-sm font-black text-text-primary mb-2">Rejection Reason / Modification Required</label>
                                                    <textarea
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                        placeholder="Please explain why this is being sent back..."
                                                        className="w-full px-4 py-2 rounded-xl border-2 border-border-divider bg-muted-bg/30 text-text-primary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none h-20 text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setIsRejecting(false);
                                                            setNote('');
                                                        }}
                                                        className="flex-1 py-3.5 bg-muted-bg text-text-secondary font-bold rounded-2xl hover:bg-hover transition-all border border-border-divider"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => onFirstApproval(loan.id, 'sendback', note)}
                                                        disabled={!note.trim() || isProcessing}
                                                        className="flex-1 py-3.5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 disabled:opacity-50 shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {isProcessing ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                <span>Sending...</span>
                                                            </>
                                                        ) : (
                                                            'Submit Rejection'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : isApproving ? (
                                            <div className="space-y-4 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
                                                <div>
                                                    <label className="block text-sm font-black text-text-primary mb-2">Approval Note</label>
                                                    <textarea
                                                        value={note}
                                                        onChange={(e) => setNote(e.target.value)}
                                                        placeholder="Add a note or remarks for this approval (optional)..."
                                                        className="w-full px-4 py-2 rounded-xl border-2 border-border-divider bg-muted-bg/30 text-text-primary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none h-16 text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => {
                                                            setIsApproving(false);
                                                            setNote('');
                                                        }}
                                                        className="flex-1 py-3.5 bg-muted-bg text-text-secondary font-bold rounded-2xl hover:bg-hover transition-all border border-border-divider"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => onFirstApproval(loan.id, 'approve', note)}
                                                        disabled={isProcessing}
                                                        className="flex-1 py-3.5 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {isProcessing ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                <span>Approving...</span>
                                                            </>
                                                        ) : (
                                                            'Confirm & Authorize'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center gap-6">
                                                <button
                                                    onClick={() => {
                                                        setIsRejecting(true);
                                                        setIsApproving(false);
                                                        setNote('');
                                                    }}
                                                    className="group flex items-center gap-3 px-10 py-4 bg-card border-2 border-primary-600 text-primary-600 font-black rounded-2xl hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm"
                                                >
                                                    <XCircle className="w-6 h-6" />
                                                    Send Back
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsApproving(true);
                                                        setIsRejecting(false);
                                                        setNote('');
                                                    }}
                                                    className="flex items-center gap-3 px-12 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-xl shadow-primary-500/30 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-75"
                                                >
                                                    <CheckCircle className="w-6 h-6" />
                                                    Confirm Approval
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 bg-primary-500/10 p-6 rounded-2xl text-primary-600 border border-primary-500/20 max-w-md">
                                        <ShieldCheck className="w-8 h-8 opacity-50" />
                                        <div>
                                            <p className="font-black text-sm uppercase tracking-wider">Access Restricted</p>
                                            <p className="text-xs font-medium mt-1 leading-relaxed italic opacity-80">
                                                Only staff with 'Manager' privileges are authorized to perform this review step.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-primary-500/10 border border-primary-500/20 rounded-3xl p-10 flex flex-col items-center gap-4 shadow-sm shadow-primary-500/5">
                                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-primary-600 dark:text-primary-400 text-xl">1st Level Completed</p>
                                    <p className="text-sm font-medium text-text-secondary mt-1">
                                        Verified by: <span className="font-black text-text-primary">{loan.firstApprovalBy || loan.loanDetails.branchManager || 'Branch Manager'}</span> {loan.firstApprovalDate ? `(${loan.firstApprovalDate})` : ''}
                                    </p>
                                    <p className="text-xs text-primary-500 font-bold mt-2 italic">
                                        Application successfully verified at the branch level.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4 py-4 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-muted-bg/50 text-text-muted">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-text-primary">2nd Level Approval</h3>
                                {loan.loanAmount >= 200000 ? (
                                    <p className="text-sm text-text-secondary font-medium italic">High amount protection: Final administrative sign-off required</p>
                                ) : (
                                    <p className="text-sm text-text-secondary font-medium">Automatic verification bypass for standard loan amounts</p>
                                )}
                            </div>
                        </div>

                        {loan.loanAmount >= 200000 ? (
                            loan.secondApproval === 'Pending' ? (
                                <div className="bg-card border-2 border-dashed border-border-divider rounded-3xl p-10 flex flex-col items-center shadow-sm">
                                    {isAdmin ? (
                                        <div className="space-y-8 w-full">
                                            {/* <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 flex items-start gap-4 mx-auto max-w-lg">
                                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                                <p className="text-sm text-text-primary leading-relaxed font-medium">
                                                    Critical Action: You are performing the final secondary review for a high-value loan (&gt; LKR 200k).
                                                </p>
                                            </div> */}

                                            {isRejecting ? (
                                                <div className="space-y-4 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
                                                    <div>
                                                        <label className="block text-sm font-black text-text-primary mb-2">Rejection Reason / Modification Required</label>
                                                        <textarea
                                                            value={note}
                                                            onChange={(e) => setNote(e.target.value)}
                                                            placeholder="Please explain why this is being sent back..."
                                                            className="w-full px-4 py-3 rounded-2xl border-2 border-border-divider bg-muted-bg/30 text-text-primary focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none h-20 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => {
                                                                setIsRejecting(false);
                                                                setNote('');
                                                            }}
                                                            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => onSecondApproval(loan.id, 'sendback', note)}
                                                            disabled={!note.trim() || isProcessing}
                                                            className="flex-1 py-3.5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 disabled:opacity-50 shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            {isProcessing ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    <span>Processing...</span>
                                                                </>
                                                            ) : (
                                                                'Submit Rejection'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : isApproving ? (
                                                <div className="space-y-4 max-w-lg mx-auto animate-in fade-in slide-in-from-top-4">
                                                    <div>
                                                        <label className="block text-sm font-black text-text-primary mb-2">Final Approval Remarks</label>
                                                        <textarea
                                                            value={note}
                                                            onChange={(e) => setNote(e.target.value)}
                                                            placeholder="Add final remarks for this loan authorization (optional)..."
                                                            className="w-full px-4 py-3 rounded-2xl border-2 border-border-divider bg-muted-bg/30 text-text-primary focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none h-20 text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => {
                                                                setIsApproving(false);
                                                                setNote('');
                                                            }}
                                                            className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => onSecondApproval(loan.id, 'approve', note)}
                                                            disabled={isProcessing}
                                                            className="flex-1 py-3.5 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"
                                                            style={{
                                                                backgroundColor: colors.primary[600],
                                                                boxShadow: `0 20px 25px -5px ${colors.primary[600]}33`
                                                            }}
                                                        >
                                                            {isProcessing ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    <span>Authorizing...</span>
                                                                </>
                                                            ) : (
                                                                'Confirm Final Approval'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center gap-6">
                                                    <button
                                                        onClick={() => {
                                                            setIsRejecting(true);
                                                            setIsApproving(false);
                                                            setNote('');
                                                        }}
                                                        className="group flex items-center gap-3 px-10 py-4 bg-card border-2 border-primary-600 text-primary-600 font-black rounded-2xl hover:bg-primary-600 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                                                    >
                                                        <XCircle className="w-6 h-6" />
                                                        Reject / Back
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsApproving(true);
                                                            setIsRejecting(false);
                                                            setNote('');
                                                        }}
                                                        disabled={isProcessing}
                                                        className="flex items-center gap-3 px-12 py-4 text-white font-black rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-75"
                                                        style={{ backgroundColor: colors.primary[600], boxShadow: `0 20px 25px -5px ${colors.primary[600]}33` }}
                                                    >
                                                        <CheckCircle className="w-6 h-6" />
                                                        Final Approval
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 bg-muted-bg/50 p-6 rounded-2xl text-text-secondary border border-border-divider max-w-md">
                                            <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border-divider shrink-0">
                                                <ShieldCheck className="w-6 h-6 opacity-30" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm uppercase tracking-wider text-text-primary">Admin Only Access</p>
                                                <p className="text-xs font-medium mt-1 leading-relaxed opacity-70">
                                                    Escalated approval stage. Requires Administrative or Executive level overrides.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-3xl p-10 flex flex-col items-center gap-4 shadow-sm border border-primary-500/20 bg-primary-500/10">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-primary-600">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-xl text-center text-primary-900 dark:text-primary-400">Finalized</p>
                                        <p className="text-sm font-medium mt-1 text-primary-700 dark:text-primary-300">
                                            Approved by: <span className="font-black">{loan.secondApprovalBy || 'Administrator'}</span> {loan.secondApprovalDate ? `(${loan.secondApprovalDate})` : ''}
                                        </p>
                                        <p className="text-xs font-bold mt-2 italic max-w-[300px] mx-auto leading-relaxed text-primary-600">
                                            Secondary administrative review complete. Loan is authorized for disbursement.
                                        </p>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="bg-muted-bg/20 border border-border-divider rounded-3xl p-10 flex flex-col items-center gap-4 border-dashed max-w-md mx-auto opacity-60">
                                <AlertCircle className="w-8 h-8 text-text-muted" />
                                <div className="text-center">
                                    <p className="font-bold text-text-muted uppercase tracking-widest text-[10px]">Information Only</p>
                                    <p className="text-sm font-medium text-text-secondary mt-1">
                                        This loan amount does not meet the criteria for secondary administrative approval.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-[2.5rem] max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
                {/* Header Section */}
                <div className="px-8 py-3 border-b border-border-divider bg-table-header flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-primary-500/30">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-text-primary tracking-tight">{loan.contractNo}</h2>
                                <StatusBadge status={loan.status} />
                            </div>
                            <p className="text-sm text-text-secondary flex items-center gap-2 mt-0.5 font-bold">
                                <User className="w-4 h-4 text-primary-500" />
                                {loan.customerName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-card hover:shadow-md text-text-muted hover:text-rose-500 transition-all border border-transparent hover:border-border-divider"
                    >
                        <XCircle className="w-7 h-7" />
                    </button>
                </div>

                {/* Progress Stepper */}
                <div className="px-8 py-1.5 border-b border-border-divider shrink-0 overflow-x-auto bg-card/50">
                    <ProgressSteps steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-card/50 custom-scrollbar">
                    <div className="max-w-3xl mx-auto">
                        {renderStepContent()}
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="px-10 py-4 border-t border-border-divider bg-table-header flex items-center justify-between shrink-0">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-8 py-3 bg-card border border-border-default text-text-secondary font-black rounded-2xl hover:bg-muted-bg disabled:opacity-30 disabled:hover:bg-card transition-all shadow-sm ring-1 ring-black/5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <div className="flex gap-4">
                        {canEditLoan && (loan.status === 'Pending 1st' || loan.status === 'Pending 2nd' || loan.status === 'Sent Back') && (
                            <button
                                onClick={() => window.location.href = `/loans/edit?edit=${loan.id}`}
                                className="flex items-center gap-2 px-8 py-3.5 bg-primary-500/10 border border-primary-500/20 text-primary-600 font-black rounded-2xl hover:bg-primary-500/20 transition-all shadow-sm"
                            >
                                Edit Application
                            </button>
                        )}
                        {currentStep < 4 ? (
                            <button
                                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                                className="flex items-center gap-2 px-10 py-3.5 bg-text-primary text-background font-black rounded-2xl hover:opacity-90 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-xl"
                            >
                                Next Step
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-12 py-3.5 text-white font-black rounded-2xl transition-all ring-4 bg-primary-600 shadow-xl shadow-primary-500/30 ring-primary-500/20"
                            >
                                Close Modal
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {previewDoc && (
                <DocumentPreviewModal
                    url={previewDoc.url}
                    type={previewDoc.type}
                    onClose={() => setPreviewDoc(null)}
                    isSecure={true}
                />
            )}
        </div>
    );
};
