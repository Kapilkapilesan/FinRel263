import React, { useState, useEffect } from 'react';
import { X, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { centerRequestService } from '../../services/center-request.service';
import { centerService } from '../../services/center.service';
import { customerService } from '../../services/customer.service';
import { Customer } from '../../types/customer.types';

interface CenterTransferModalProps {
    customer: Customer;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CenterTransferModal({ customer, onClose, onSuccess }: CenterTransferModalProps) {
    const [loading, setLoading] = useState(false);
    const [centers, setCenters] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        requested_center_id: '',
        reason: ''
    });
    const [error, setError] = useState<string | null>(null);

    const [eligibility, setEligibility] = useState<{ eligible: boolean; message?: string } | null>(null);

    useEffect(() => {
        loadCenters();
        checkEligibility();
    }, []);

    const checkEligibility = async () => {
        // 🔒 GENDER VALIDATION: Centers are for females only
        if (customer.gender === 'Male') {
            setEligibility({ eligible: false, message: "Center transfers are not available for male customers as they cannot be linked to centers." });
            setError("Center transfers restricted to female customers only.");
            return;
        }

        try {
            const result = await customerService.checkTransferEligibility(customer.id);
            setEligibility(result);
            if (!result.eligible) {
                setError(result.message || "Customer is not eligible for transfer");
            }
        } catch (err) {
            console.error("Eligibility check failed", err);
        }
    };

    const loadCenters = async () => {
        try {
            // Fetch ALL centers in the system by using 'all' scope
            const availableCenters = await centerService.getCenters({ scope: 'all' as any });

            // Filter out current center and ensure they are active
            const filtered = availableCenters.filter((c: any) =>
                c.id !== customer.center_id && c.status?.toLowerCase() === 'active'
            );

            setCenters(filtered);
        } catch (err) {
            console.error("Failed to load centers", err);
            toast.error("Failed to load available centers");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.requested_center_id) {
            setError("Please select a new center");
            return;
        }
        if (!formData.reason.trim()) {
            setError("Please provide a reason for the transfer");
            return;
        }

        setLoading(true);
        try {
            await centerRequestService.createRequest({
                customer_id: parseInt(customer.id),
                requested_center_id: parseInt(formData.requested_center_id),
                reason: formData.reason
            });
            toast.success("Center transfer request submitted successfully!");
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to submit request");
            toast.error(err.message || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-lg w-full shadow-2xl border border-border-default overflow-hidden transform transition-all">
                {/* Header */}
                <div className="p-8 border-b border-border-divider/30 flex items-center justify-between bg-card/50 backdrop-blur-xl">
                    <div>
                        <h2 className="text-xl font-black text-text-primary flex items-center gap-3 uppercase tracking-tight">
                            <Building className="w-5 h-5 text-primary-500" />
                            Request Center Transfer
                        </h2>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-1 opacity-40">
                            Transferring <span className="text-primary-500 opacity-100">{customer.full_name}</span> to a new node
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-muted-bg/50 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all text-text-muted border border-border-divider/30">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {error && (
                        <div className="bg-rose-500/10 text-rose-500 border border-rose-500/20 p-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-primary-500/5 p-6 rounded-[1.5rem] border border-primary-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12" />
                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-2 opacity-60">Source Node</span>
                            <div className="font-black text-text-primary text-sm uppercase tracking-tight">
                                {customer.center?.center_name || customer.center_name || 'Unassigned Node'}
                            </div>
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-40">
                                {customer.branch?.branch_name || customer.branch_name}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">Destination Node</label>
                            <select
                                value={formData.requested_center_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, requested_center_id: e.target.value }))}
                                className="w-full p-4 bg-muted-bg/30 border-2 border-border-divider/30 rounded-[1.5rem] focus:border-primary-500 focus:ring-8 focus:ring-primary-500/10 outline-none transition-all text-sm font-bold text-text-primary appearance-none"
                                required
                            >
                                <option value="" className="bg-card">Select a center...</option>
                                {centers.map(center => (
                                    <option key={center.id} value={center.id} className="bg-card">
                                        {center.center_name} (Branch ID: {center.branch_id})
                                    </option>
                                ))}
                            </select>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter ml-1">Only active centers are shown.</p>
                        </div>

                        <div className="space-y-2.5">
                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 opacity-60">Reason for Mutation</label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full p-5 bg-muted-bg/30 border-2 border-border-divider/30 rounded-[1.5rem] focus:border-primary-500 focus:ring-8 focus:ring-primary-500/10 outline-none transition-all min-h-[120px] text-sm font-bold text-text-primary placeholder:text-text-muted/20"
                                placeholder="Explain the context of this Center Transfer..."
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3.5 text-text-muted font-black text-[11px] uppercase tracking-widest hover:bg-muted-bg/50 rounded-[1.2rem] transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || eligibility?.eligible === false}
                            className="px-10 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-black text-[11px] uppercase tracking-widest rounded-[1.2rem] transition-all shadow-2xl shadow-primary-500/40 flex items-center gap-3 disabled:opacity-20 active:scale-95"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : eligibility?.eligible === false ? (
                                <>
                                    <AlertCircle size={18} />
                                    Transfer Blocked
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
