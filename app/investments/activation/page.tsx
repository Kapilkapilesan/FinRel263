"use client";
import React, { useState, useEffect } from "react";
import { Zap, Search, ShieldCheck, FileText, ArrowRight, Clock, Landmark } from "lucide-react";
import { investmentService } from "@/services/investment.service";
import { toast } from "react-toastify";
import BMSLoader from "@/components/common/BMSLoader";
import { InvestmentActivationTable } from "@/components/investment/InvestmentActivationTable";
import { colors } from "@/themes/colors";

export default function InvestmentActivationPage() {
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activatingId, setActivatingId] = useState<number | null>(null);
    const [receiptNumber, setReceiptNumber] = useState("");

    useEffect(() => {
        loadAwaitingActivation();
    }, []);

    const loadAwaitingActivation = async () => {
        try {
            setLoading(true);
            const all = await investmentService.getInvestments();
            const awaiting = all.filter((inv: any) => inv.status === 'APPROVED_AWAITING_ACTIVATION');
            setInvestments(awaiting);
        } catch (error) {
            toast.error("Failed to load investments awaiting activation");
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id: number) => {
        if (!receiptNumber) {
            toast.warn("Please enter the official receipt number");
            return;
        }

        try {
            setActivatingId(id);
            await investmentService.activateInvestment(id, receiptNumber);
            toast.success("Investment activated successfully! Document printing enabled.");
            setReceiptNumber("");
            setActivatingId(null);
            loadAwaitingActivation();
        } catch (error: any) {
            toast.error(error.message || "Activation failed. Verify receipt number.");
            setActivatingId(null);
        }
    };

    const filtered = investments.filter(inv =>
        inv.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dynamicStyles = `
        .theme-text-primary { color: ${colors.primary[600]}; }
        .theme-bg-primary-light { background-color: ${colors.primary[50]}; }
        .theme-bg-primary-soft { background-color: ${colors.primary[100]}; }
        .theme-border-primary-light { border-color: ${colors.primary[100]}; }
        .theme-focus-ring:focus { 
            --tw-ring-color: ${colors.primary[500]}1a; 
            box-shadow: 0 0 0 4px var(--tw-ring-color);
            border-color: ${colors.primary[300]};
        }
    `;

    return (
        <div className="min-h-screen relative overflow-hidden pb-12 bg-app-background">
            <style>{dynamicStyles}</style>

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
                />
            </div>

            <div className="max-w-7xl mx-auto space-y-6 relative z-10 px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/80 backdrop-blur-xl p-6 rounded-2xl border border-border-default shadow-xl shadow-black/5 dark:shadow-black/20">
                    <div className="flex items-center gap-6">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-3 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <Zap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black theme-text-primary tracking-tight">
                                Branch Activation Port
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-muted-bg px-4 py-2 rounded-xl border border-border-divider flex flex-col items-end">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Awaiting</span>
                            <span className="text-xl font-black text-text-primary">{investments.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Panel: List */}
                    <div className="flex-[1.5] space-y-8">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="w-5 h-5 text-text-muted absolute left-5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:theme-text-primary" />
                            <input
                                type="text"
                                placeholder="Locate by customer or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-3.5 bg-input backdrop-blur-xl border-border-default border-[1.5px] rounded-2xl outline-none transition-all shadow-lg shadow-black/5 dark:shadow-black/20 text-text-primary font-bold theme-focus-ring text-sm uppercase placeholder:text-text-muted"
                            />
                        </div>

                        {/* Queue Container */}
                        <div className="bg-card/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-border-default overflow-hidden min-h-[500px] flex flex-col">
                            <InvestmentActivationTable 
                                records={filtered}
                                selectedId={activatingId}
                                onSelect={setActivatingId}
                                isLoading={loading}
                            />
                        </div>
                    </div>

                    {/* Right Panel: Activation Console */}
                    <div className="flex-1">
                        <div className={`sticky top-8 p-8 rounded-3xl border transition-all duration-500 shadow-2xl relative overflow-hidden ${activatingId ? 'bg-card border-border-default opacity-100 translate-y-0' : 'bg-card/40 border-border-divider opacity-50 translate-y-4 pointer-events-none'}`}>
                            {/* Decorative element */}
                            {activatingId && (
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                    <Zap className="w-32 h-32 theme-text-primary" />
                                </div>
                            )}

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-text-primary tracking-tight">Activation Console</h2>
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mt-0.5">Physical Receipt Verification</p>
                                    </div>
                                </div>

                                {activatingId ? (
                                    <div className="space-y-6">
                                        <div className="bg-muted-bg/50 rounded-2xl p-6 border border-border-divider space-y-4">
                                            <div className="flex flex-col gap-1 border-b border-border-divider pb-4">
                                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Investor Reference</span>
                                                <span className="text-sm font-black text-text-primary uppercase">{investments.find(i => i.id === activatingId)?.customer?.full_name}</span>
                                            </div>

                                            {investments.find(i => i.id === activatingId)?.bank_details && (
                                                <div className="space-y-2 border-b border-border-divider pb-4">
                                                    <span className="text-[9px] font-black theme-text-primary uppercase tracking-widest flex items-center gap-1.5">
                                                        <Landmark className="w-3 h-3" /> Disbursement Target
                                                    </span>
                                                    <div className="bg-muted-bg p-3 rounded-xl border border-border-divider">
                                                        <p className="text-[10px] font-black text-text-primary uppercase leading-tight">
                                                            {investments.find(i => i.id === activatingId)?.bank_details.bank_name}
                                                        </p>
                                                        <p className="text-[11px] font-mono font-bold text-primary-600 mt-0.5 tracking-wider">
                                                            {investments.find(i => i.id === activatingId)?.bank_details.account_number}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4 pt-2">
                                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Official Receipt Number</label>
                                                <div className="relative">
                                                    <FileText className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        type="text"
                                                        placeholder="OFFICIAL RECEIPT NO"
                                                        value={receiptNumber}
                                                        onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                                                        className="w-full pl-12 pr-4 py-4 bg-input border-border-divider border rounded-xl font-black text-sm tracking-[0.1em] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 outline-none transition-all shadow-sm text-text-primary placeholder:text-text-muted"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => handleActivate(activatingId)}
                                                    className="w-full py-5 bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/30 hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-3"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                    Finalize Activation
                                                </button>
                                            </div>
                                        </div>

                                        {/* <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 animate-pulse" />
                                            <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                                                Confirming activation will notify the customer and authorize document printing for this investment.
                                            </p>
                                        </div> */}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-muted-bg/50 rounded-2xl border border-dashed border-border-divider">
                                        <Clock className="w-10 h-10 text-border-divider mx-auto mb-4" />
                                        <p className="text-xs font-black text-text-muted uppercase tracking-widest px-8 leading-relaxed">
                                            Select an asset from the queue to begin verification
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
