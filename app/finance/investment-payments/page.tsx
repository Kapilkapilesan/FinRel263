"use client";
import React, { useState, useEffect } from "react";
import { Receipt, Search, CreditCard, User, Landmark, Plus } from "lucide-react";
import { investmentService } from "@/services/investment.service";
import { toast } from "react-toastify";
import BMSLoader from "@/components/common/BMSLoader";
import { colors } from "@/themes/colors";
import { useRouter } from "next/navigation";

export default function InvestmentPaymentsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchInvestments();
    }, []);

    const fetchInvestments = async () => {
        try {
            setLoading(true);
            const data = await investmentService.getInvestments();
            // Filter only Active investments that might need payments (interest payouts/renewals etc)
            // Note: This is where the original filter logic was before my changes
            const activeOnes = data.filter((inv: any) => inv.status === 'ACTIVE');
            setInvestments(activeOnes);
        } catch (error) {
            toast.error("Failed to load investments");
        } finally {
            setLoading(false);
        }
    };

    const handleIssueReceipt = (inv: any) => {
        // This was the original placeholder or logic for finance payouts
        toast.info("Finance Payment Terminal: Functionality remains unchanged.");
    };

    const filtered = investments.filter(inv =>
        inv.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/70 backdrop-blur-xl p-8 rounded-3xl border border-border/40 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
                        <Landmark className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">
                            Investment <span className="text-emerald-500">Payments</span>
                        </h1>
                        <p className="text-sm font-semibold text-text-muted mt-1 uppercase tracking-widest">
                            Finance Management Terminal
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative group max-w-2xl">
                <Search className="w-5 h-5 text-text-muted absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search by customer name or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-card border-border/40 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 shadow-lg text-text-primary font-semibold"
                />
            </div>

            <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/30 shadow-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <BMSLoader message="Loading Payment Data..." />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <Receipt className="w-16 h-16 text-text-muted/30 mx-auto" />
                        <p className="text-text-muted font-bold text-lg">No active investments found for payment processing.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-text-muted/5 border-b border-border/20">
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted">Customer</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted">Product</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted">Status</th>
                                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-text-muted">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {filtered.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-text-muted/5 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-text-primary">{inv.customer?.full_name}</div>
                                            <div className="text-[10px] text-text-muted font-bold uppercase tracking-tight">{inv.transaction_id}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-emerald-500">{inv.product?.name}</div>
                                            <div className="text-[10px] text-text-muted font-bold uppercase">LKR {Number(inv.amount).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase">
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => handleIssueReceipt(inv)}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-600 transition-all active:scale-95"
                                            >
                                                <CreditCard className="w-3 h-3" />
                                                Process Payment
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
