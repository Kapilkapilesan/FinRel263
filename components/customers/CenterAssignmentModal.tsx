import React, { useState, useEffect } from "react";
import { X, Search, CheckCircle2, Building, MapPin, UserPlus } from "lucide-react";
import { Customer } from "../../types/customer.types";
import { customerService } from "../../services/customer.service";
import { toast } from "react-toastify";

interface CenterAssignmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CenterAssignmentModal({ onClose, onSuccess }: CenterAssignmentModalProps) {
    const [loading, setLoading] = useState(false);
    const [constants, setConstants] = useState<any>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [targetBranchId, setTargetBranchId] = useState<number | undefined>();
    const [targetCenterId, setTargetCenterId] = useState<number | undefined>();
    const [filteredCenters, setFilteredCenters] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [consts, unassigned] = await Promise.all([
                customerService.getConstants(),
                customerService.getCustomers({ center_id: 'unassigned', gender: 'Female' })
            ]);
            setConstants(consts);
            setCustomers(unassigned);
            setFilteredCustomers(unassigned);
        } catch (error) {
            toast.error("Failed to load unassigned customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = customers.filter(c =>
            c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (targetBranchId) {
            filtered = filtered.filter(c => c.branch_id === targetBranchId);
        }

        setFilteredCustomers(filtered);
        // Clear selection if customers are filtered out
        setSelectedIds(prev => prev.filter(id => filtered.some(c => c.id === id as any)));
    }, [searchTerm, customers, targetBranchId]);

    const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const branchId = parseInt(e.target.value);
        setTargetBranchId(branchId);
        setTargetCenterId(undefined);
        if (constants?.centers) {
            setFilteredCenters(constants.centers.filter((c: any) => c.branch_id === branchId && c.status === 'active'));
        }
    };

    const toggleSelection = (id: any) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredCustomers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCustomers.map(c => c.id as unknown as number));
        }
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            toast.warning("Please select at least one customer");
            return;
        }

        // 🔒 SAFETY GENDER CHECK
        const maleCustomers = filteredCustomers.filter(c => selectedIds.includes(c.id as any) && c.gender === 'Male');
        if (maleCustomers.length > 0) {
            toast.error(`Restriction: ${maleCustomers.length} male nodes detected. Centers are for female nodes only.`);
            return;
        }

        if (!targetBranchId || !targetCenterId) {
            toast.warning("Please select a Branch and Center");
            return;
        }

        setLoading(true);
        try {
            await customerService.assignToCenter({
                customer_ids: selectedIds,
                branch_id: targetBranchId,
                center_id: targetCenterId
            });
            toast.success("Customers assigned successfully");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Assignment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-500">
            <div className="bg-card rounded-[3rem] max-w-4xl w-full shadow-2xl border border-border-default flex flex-col h-full max-h-[90vh] overflow-hidden transform transition-all">
                {/* Header */}
                <div className="p-10 border-b border-border-divider/30 flex items-center justify-between bg-card/50 backdrop-blur-xl">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary tracking-tighter flex items-center gap-4 uppercase">
                            <UserPlus className="text-primary-500" />
                            Identity Registry Hub
                        </h2>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mt-1 opacity-40">Sequential assignment of unlinked nodes to service sectors</p>
                    </div>
                    <button onClick={onClose} className="p-4 bg-muted-bg/50 hover:bg-rose-500/10 hover:text-rose-500 rounded-[1.5rem] transition-all text-text-muted border border-border-divider/30">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Customer Selection */}
                    <div className="flex-1 p-8 border-r border-border-divider/30 flex flex-col gap-6">
                        <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40 group-focus-within/search:text-primary-500 group-focus-within/search:opacity-100 transition-all" size={18} />
                            <input
                                type="text"
                                placeholder="Search unlinked nodes..."
                                className="w-full pl-12 pr-5 py-4 bg-muted-bg/30 border-2 border-border-divider/30 rounded-2xl text-sm font-bold text-text-primary focus:border-primary-500 focus:ring-8 focus:ring-primary-500/10 outline-none transition-all placeholder:text-text-muted/20 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2 opacity-60">
                            <span>{selectedIds.length} Nodes Active</span>
                            <button onClick={handleSelectAll} className="text-primary-500 hover:opacity-80 transition-opacity">
                                {selectedIds.length === filteredCustomers.length ? "Global Deselect" : "Global Select"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {filteredCustomers.length === 0 ? (
                                <div className="text-center py-20 flex flex-col items-center gap-4 opacity-20">
                                    <Search size={48} />
                                    <p className="text-[11px] font-black uppercase tracking-widest">No matching nodes isolated</p>
                                </div>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <div
                                        key={customer.id}
                                        onClick={() => toggleSelection(customer.id)}
                                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between active:scale-95 group/item ${selectedIds.includes(customer.id as unknown as number)
                                            ? "border-primary-500 bg-primary-500/10"
                                            : "border-border-divider/30 bg-muted-bg/10 hover:border-primary-500/30 hover:bg-muted-bg/30"
                                            }`}
                                    >
                                        <div>
                                            <p className="text-sm font-black text-text-primary uppercase tracking-tight group-hover/item:text-primary-500 transition-colors">{customer.full_name}</p>
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-40 mt-1">{customer.customer_code}</p>
                                        </div>
                                        {selectedIds.includes(customer.id as unknown as number) ? (
                                            <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                                                <CheckCircle2 className="text-white" size={14} />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-border-divider/30 group-hover/item:border-primary-500/30 transition-all" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Target Assignment */}
                    <div className="w-full md:w-[350px] p-10 bg-muted-bg/20 flex flex-col gap-8">
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] opacity-40">Command Targets</h3>

                        <div className="space-y-6">
                            <div className="space-y-3 group/select">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1 opacity-60 group-focus-within/select:text-primary-500 group-focus-within/select:opacity-100 transition-all">
                                    <MapPin size={12} /> Target Branch
                                </label>
                                <select
                                    className="w-full p-4 bg-card border-2 border-border-divider/30 rounded-2xl text-sm font-bold text-text-primary focus:border-primary-500 focus:ring-8 focus:ring-primary-500/10 outline-none transition-all appearance-none"
                                    onChange={handleBranchChange}
                                    value={targetBranchId}
                                >
                                    <option value="" className="text-text-muted">Select Branch</option>
                                    {constants?.branches?.map((b: any) => (
                                        <option key={b.id} value={b.id} className="text-text-primary">{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3 group/select">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 ml-1 opacity-60 group-focus-within/select:text-primary-500 group-focus-within/select:opacity-100 transition-all">
                                    <Building size={12} /> Target Center
                                </label>
                                <select
                                    className="w-full p-4 bg-card border-2 border-border-divider/30 rounded-2xl text-sm font-bold text-text-primary focus:border-primary-500 focus:ring-8 focus:ring-primary-500/10 outline-none transition-all appearance-none disabled:opacity-20"
                                    disabled={!targetBranchId}
                                    onChange={(e) => setTargetCenterId(parseInt(e.target.value))}
                                    value={targetCenterId}
                                >
                                    <option value="" className="text-text-muted">Select Center</option>
                                    {filteredCenters.map((c: any) => (
                                        <option key={c.id} value={c.id} className="text-text-primary">{c.center_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 border-t border-border-divider/30">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || selectedIds.length === 0 || !targetCenterId}
                                className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary-500/40 active:scale-95 disabled:opacity-20 disabled:grayscale"
                            >
                                {loading ? "Encrypting..." : "Initialize Link"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
