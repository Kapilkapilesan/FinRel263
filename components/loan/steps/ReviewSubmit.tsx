'use client';

import React, { useState } from 'react';
import { CheckCircle, Eye, X } from 'lucide-react';
import { DocumentPreviewModal } from '../../common/DocumentPreviewModal';
import { LoanFormData, CustomerRecord } from '@/types/loan.types';
import { Staff } from '@/types/staff.types';
import { Center } from '@/types/center.types';
import { Group } from '@/types/group.types';
import { LoanProduct } from '@/types/loan-product.types';
import { calculateTotalFees, calculateNetDisbursement, formatCurrency, getDocumentUrl } from '@/utils/loan.utils';
import { colors } from '@/themes/colors';
import { API_BASE_URL } from '@/services/api.config';

interface ReviewSubmitProps {
    formData: LoanFormData;
    selectedCustomerRecord?: CustomerRecord | null;
    staffs: Staff[];
    centers?: Center[];
    groups?: Group[];
    loanProducts: LoanProduct[];
    isEditMode?: boolean;
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ formData, selectedCustomerRecord, staffs, centers = [], groups = [], loanProducts = [], isEditMode = false }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<string>('');
    const [isSecure, setIsSecure] = useState<boolean>(false);

    React.useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const totalFees = calculateTotalFees(formData);
    const netDisbursement = calculateNetDisbursement(formData);

    const getStaffName = (id: string) => {
        const staff = staffs.find(s => s.staff_id === id);
        return staff ? staff.full_name : id || 'Not selected';
    };

    const getCenterName = (id: string) => {
        const center = centers.find(c => String(c.id) === String(id));
        return center ? center.center_name : id || 'Not selected';
    };

    const getGroupName = (id: string) => {
        const group = groups.find(g => String(g.id) === String(id));
        return group ? group.group_name : id || 'Not selected';
    };

    const openPreview = (type: string, file: File | null, doc: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewType(type);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
            setIsSecure(false);
        } else if (doc) {
            const docId = doc.id;
            if (!docId) {
                setPreviewUrl(getDocumentUrl(doc.url || doc.file_path));
                setIsSecure(false);
                return;
            }

            let endpoint = `${API_BASE_URL}/media/loan-documents/${docId}`;
            if (doc.is_from_profile) {
                const typeParam = type.toLowerCase().includes('nic') ? 'nic' : 'profile';
                endpoint = `${API_BASE_URL}/media/customers/${formData.customer}?type=${typeParam}`;
            }
            setPreviewUrl(endpoint);
            setIsSecure(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Review & Submit</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors">
                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Customer Information
                    </h3>
                    <div className="space-y-1 text-sm font-black tracking-tight">
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Center</span>
                            <span className="text-text-primary uppercase">{getCenterName(formData.center)}</span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Group</span>
                            <span className="text-text-primary uppercase">{getGroupName(formData.group)}</span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">NIC</span>
                            <span className="text-text-primary uppercase">{formData.nic || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Customer</span>
                            <span className="text-text-primary uppercase">
                                {selectedCustomerRecord?.name || 'Not selected'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border-divider/30 pt-2 mt-2">
                            <span className="text-[11px] text-primary-500/80 uppercase tracking-widest">Monthly Income</span>
                            <span className="text-primary-500 font-black">LKR {Number(formData.monthly_income || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] text-rose-500/80 uppercase tracking-widest">Monthly Expenses</span>
                            <span className="text-rose-500 font-black">LKR {Number(formData.monthly_expenses || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors">
                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Loan Details
                    </h3>
                    <div className="space-y-1 text-sm font-black tracking-tight">
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Requested Amount</span>
                            <span className="text-text-primary">
                                {formatCurrency(Number(formData.requestedAmount || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Approved Amount</span>
                            <span className="text-text-primary">
                                {formatCurrency(Number(formData.loanAmount || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Interest Rate</span>
                            <span className="text-text-primary">{formData.interestRate || '0'}%</span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Tenure</span>
                            <span className="text-text-primary uppercase">
                                {formData.tenure || '0'} {formData.rentalType === 'Monthly' ? 'Months' : formData.rentalType === 'Bi-Weekly' ? 'Bi-Weekly Periods' : 'Weeks'}
                            </span>
                        </div>
                        {formData.calculated_rental && (
                            <div className="flex justify-between items-center pt-2 border-t border-border-divider/30 mt-2 relative group/rental overflow-hidden rounded-xl p-2 bg-primary-500/5">
                                <span className="text-[11px] font-black text-primary-500 uppercase tracking-widest">
                                    {formData.rentalType} Rental
                                </span>
                                <span className="text-lg font-black text-primary-500 tabular-nums">
                                    {formatCurrency(Number(formData.calculated_rental))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors">
                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Fees & Charges
                    </h3>
                    <div className="space-y-1 text-sm font-black tracking-tight">
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Processing Fee</span>
                            <span className="text-text-primary">
                                {formatCurrency(Number(formData.processingFee || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center group/item">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Documentation Fee</span>
                            <span className="text-text-primary">
                                {formatCurrency(Number(formData.documentationFee || 0))}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl p-5 relative overflow-hidden group/summary shadow-2xl transition-all hover:shadow-primary-500/10"
                    style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[800]})` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transition-transform duration-1000 group-hover/summary:scale-150" />
                    <h3 className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                        Total Summary
                    </h3>
                    <div className="space-y-1 text-sm font-black tracking-tight text-white/90">
                        <div className="flex justify-between items-center opacity-70">
                            <span className="text-[10px] uppercase tracking-widest">Loan Amount</span>
                            <span className="tabular-nums">{formatCurrency(Number(formData.loanAmount || 0))}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-70">
                            <span className="text-[10px] uppercase tracking-widest">Total Fees</span>
                            <span className="tabular-nums">- {formatCurrency(totalFees)}</span>
                        </div>
                        {Number(formData.reloan_deduction_amount ?? 0) > 0 && (
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/10">
                                <span className="text-[10px] uppercase tracking-widest italic text-amber-300">Reloan Deduction</span>
                                <span className="tabular-nums text-amber-300">({formatCurrency(Number(formData.reloan_deduction_amount))})</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-white/20 mt-3 flex flex-col gap-1">
                            <div className="flex justify-between items-end">
                                <span className="text-[11px] uppercase tracking-[0.2em] mb-1">Net Disbursable Cash</span>
                                <span className="text-2xl font-black tabular-nums tracking-tighter text-white drop-shadow-md">
                                    {formatCurrency(Number(formData.loanAmount) - totalFees - Number(formData.reloan_deduction_amount || 0))}
                                </span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-primary-400 w-full animate-progress-dna shadow-[0_0_10px_rgba(0,132,209,0.5)]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors col-span-2">
                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Bank Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-black tracking-tight">
                        <div className="flex justify-between items-center group/item hover:bg-muted-bg/10 p-2 rounded-xl transition-colors">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Bank Name</span>
                            <span className="text-text-primary px-3 py-1 bg-card rounded-lg border border-border-divider/30 uppercase">{formData.bankName || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between items-center group/item hover:bg-muted-bg/10 p-2 rounded-xl transition-colors">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Branch</span>
                            <span className="text-text-primary px-3 py-1 bg-card rounded-lg border border-border-divider/30 uppercase">{formData.bankBranch || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between items-center group/item hover:bg-muted-bg/10 p-2 rounded-xl transition-colors">
                            <span className="text-[11px] text-text-primary/70 uppercase tracking-widest">Account Number</span>
                            <span className="text-text-primary font-mono bg-black/5 dark:bg-white/5 px-3 py-1 rounded-lg border border-border-divider/30">{formData.accountNumber || 'Not provided'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors col-span-2">
                    <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Guarantors & Witnesses
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm font-black tracking-tight">
                        <div className="space-y-2">
                            {/* Hide or show placeholders for Advance Loans */}
                            {formData.loanProduct && loanProducts?.find(p => p.id === Number(formData.loanProduct))?.product_type === 'advance_loan' ? (
                                <div className="p-8 bg-primary-500/5 rounded-[2rem] border-2 border-dashed border-primary-500/20 flex flex-col items-center justify-center text-center gap-3">
                                    <CheckCircle className="w-8 h-8 text-primary-500/40" />
                                    <div>
                                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">Guarantors Not Required</p>
                                        <p className="text-[9px] text-text-muted/40 font-black uppercase tracking-widest italic leading-relaxed">
                                            Bypassed for Advance Loan type
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-2.5 bg-card rounded-2xl border border-border-divider/30 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-text-muted/60 uppercase tracking-widest">Guarantor 01</span>
                                            <span className="text-text-primary uppercase">{formData.guarantor1_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-start pt-2 border-t border-border-divider/10">
                                            <span className="text-[9px] text-text-muted/40 uppercase tracking-widest">Address</span>
                                            <span className="text-text-primary text-[10px] uppercase text-right max-w-[200px] leading-relaxed">{formData.guarantor1_address || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="p-2.5 bg-card rounded-2xl border border-border-divider/30 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-text-muted/60 uppercase tracking-widest">Guarantor 02</span>
                                            <span className="text-text-primary uppercase">{formData.guarantor2_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-start pt-2 border-t border-border-divider/10">
                                            <span className="text-[9px] text-text-muted/40 uppercase tracking-widest">Address</span>
                                            <span className="text-text-primary text-[10px] uppercase text-right max-w-[200px] leading-relaxed">{formData.guarantor2_address || 'N/A'}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2.5 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                                <span className="text-[10px] text-primary-500 uppercase tracking-widest">Witness 01 (Staff)</span>
                                <span className="text-text-primary uppercase">{getStaffName(formData.witness1_id)}</span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                                <span className="text-[10px] text-primary-500 uppercase tracking-widest">Witness 02 (Staff)</span>
                                <span className="text-text-primary uppercase">{getStaffName(formData.witness2_id)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors col-span-2">
                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Joint Borrower Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm font-black tracking-tight">
                        <div className="p-2 bg-card rounded-xl border border-border-divider/30 flex flex-col gap-0.5">
                            <span className="text-[9px] text-text-primary/80 uppercase tracking-widest font-black">Name</span>
                            <span className="text-text-primary text-sm uppercase">{formData.guardian_name || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-card rounded-xl border border-border-divider/30 flex flex-col gap-0.5">
                            <span className="text-[9px] text-text-primary/80 uppercase tracking-widest font-black">Relationship</span>
                            <span className="text-text-primary text-sm uppercase">{formData.guardian_relationship || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-card rounded-xl border border-border-divider/30 flex flex-col gap-0.5">
                            <span className="text-[9px] text-text-primary/80 uppercase tracking-widest font-black">NIC</span>
                            <span className="text-text-primary text-sm font-mono uppercase">{formData.guardian_nic || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-card rounded-xl border border-border-divider/30 flex flex-col gap-0.5">
                            <span className="text-[9px] text-text-primary/80 uppercase tracking-widest font-black">Primary Phone</span>
                            <span className="text-text-primary text-sm font-mono">{formData.guardian_phone || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-card rounded-xl border border-border-divider/30 flex flex-col gap-0.5">
                            <span className="text-[9px] text-text-primary/80 uppercase tracking-widest font-black">Secondary Phone</span>
                            <span className="text-text-primary text-sm font-mono">{formData.guardian_secondary_phone || 'N/A'}</span>
                        </div>
                        <div className="p-2 bg-card rounded-xl border border-border-divider/30 flex flex-col gap-0.5 lg:col-span-1">
                            <span className="text-[9px] text-text-primary/80 uppercase tracking-widest font-black">Address</span>
                            <span className="text-text-primary text-xs uppercase leading-relaxed">{formData.guardian_address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-primary-500/5 dark:bg-muted-bg/5 border border-border-divider/50 rounded-2xl p-3 shadow-inner transition-colors col-span-2">
                    <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        Uploaded Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {/* Newly Uploaded Documents */}
                        {Object.entries(formData.documents || {}).map(([type, file]) => (
                            file && (
                                <button
                                    key={`new-${type}`}
                                    type="button"
                                    onClick={(e) => openPreview(type, file, null, e)}
                                    className="group flex items-center justify-between gap-3 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 p-2.5 rounded-2xl transition-all active:scale-95"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shrink-0" />
                                        <div className="flex flex-col items-start transition-transform group-hover:translate-x-1">
                                            <span className="text-[9px] text-primary-500/60 font-black uppercase tracking-widest shrink-0">{type}</span>
                                            <span className="text-text-primary text-[11px] font-black truncate max-w-[120px]">{file.name}</span>
                                        </div>
                                    </div>
                                    <Eye className="w-4 h-4 text-primary-500/40 group-hover:text-primary-500 transition-colors shrink-0" />
                                </button>
                            )
                        ))}

                        {/* Existing Documents */}
                        {formData.existingDocuments?.map((doc: any) => (
                            <button
                                key={`existing-${doc.id}`}
                                type="button"
                                onClick={(e) => openPreview(doc.document_type || doc.type, null, doc, e)}
                                className="group flex items-center justify-between gap-3 bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20 p-2.5 rounded-2xl transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                                    <div className="flex flex-col items-start transition-transform group-hover:translate-x-1">
                                        <span className="text-[9px] text-primary-500/60 font-black uppercase tracking-widest shrink-0">{doc.document_type || doc.type}</span>
                                        <span className="text-text-primary text-[11px] font-black truncate max-w-[120px]">{doc.file_name || 'View Document'}</span>
                                    </div>
                                </div>
                                <Eye className="w-4 h-4 text-primary-500/40 group-hover:text-primary-500 transition-colors shrink-0" />
                            </button>
                        ))}

                        {Object.values(formData.documents || {}).filter(f => !!f).length === 0 &&
                            (!formData.existingDocuments || formData.existingDocuments.length === 0) && (
                                <div className="text-[10px] text-text-muted/40 font-black uppercase tracking-[0.2em] italic col-span-full py-8 text-center bg-card rounded-[2rem] border border-dashed border-border-divider/50 flex flex-col items-center gap-3">
                                    <X className="w-6 h-6 opacity-20" />
                                    No documents attached to this application
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <DocumentPreviewModal
                    url={previewUrl}
                    type={previewType}
                    onClose={() => setPreviewUrl(null)}
                    isSecure={isSecure}
                />
            )}

            <div className="bg-primary-500/5 dark:bg-primary-500/10 border border-primary-500/20 rounded-[1.5rem] p-3.5 mt-2 relative overflow-hidden group/footer shadow-lg transition-all hover:shadow-primary-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                <div className="flex gap-4 items-center relative z-10">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center border border-primary-500/30 shadow-inner group-hover/footer:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[13px] font-black text-primary-500 uppercase tracking-widest leading-none">Ready to {isEditMode ? 'Resubmit' : 'Submit'}</p>
                        <p className="text-[9px] text-text-muted/60 font-black uppercase tracking-widest italic">
                            {isEditMode ? 'Resubmission' : 'Final Submission'}
                        </p>
                        <p className="text-[9px] text-text-muted/40 font-medium leading-relaxed max-w-xl">
                            Please review all information carefully. Once {isEditMode ? 'resubmitted' : 'submitted'}, the loan application will be sent for approval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
