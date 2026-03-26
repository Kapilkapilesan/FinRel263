"use client";
import React, { useState, useEffect } from "react";
import { AlertTriangle, Search, Lock, Unlock, FileText, CheckCircle, ShieldCheck, X, Loader2 } from "lucide-react";
import { investmentService } from "@/services/investment.service";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";
import BMSLoader from "@/components/common/BMSLoader";
import { colors } from "@/themes/colors";
import { typography } from "@/themes/typography";
import { useRouter } from "next/navigation";

export default function InvestmentReprintRequestsPage() {
    const [investments, setInvestments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });
    const router = useRouter();

    useEffect(() => {
        const checkAccess = async () => {
            const hierarchy = authService.getHighestHierarchy();
            if (hierarchy >= 100) {
                toast.error("Unauthorized Access. Redirecting to dashboard...");
                setTimeout(() => router.push('/dashboard'), 2000);
                return;
            }
            loadLockedInvestments();
        };
        checkAccess();
    }, []);

    const loadLockedInvestments = async () => {
        try {
            setLoading(true);
            const all = await investmentService.getInvestments();
            // Only show assets that have an active reprint request
            const locked = all.filter((inv: any) => inv.reprint_requested === true);
            setInvestments(locked);
        } catch (error) {
            toast.error("Failed to load locked investments");
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = (id: number) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmAuthorization = async () => {
        if (!confirmModal.id) return;
        try {
            setIsAuthorizing(true);
            await investmentService.approveReprint(confirmModal.id);
            toast.success("Reprint authorized. Staff can now print one copy.");
            setConfirmModal({ isOpen: false, id: null });
            loadLockedInvestments();
        } catch (error: any) {
            toast.error(error.message || "Authorization failed");
        } finally {
            setIsAuthorizing(false);
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
        <div className={`min-h-screen relative overflow-hidden pb-12 ${typography.fontFamily}`} style={{ backgroundColor: colors.surface.background }}>
            <style>{dynamicStyles}</style>

            {/* Ambient Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
                />
                <div
                    className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[600]}, transparent)` }}
                />
            </div>

            <div className="max-w-7xl mx-auto space-y-8 relative z-10 px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-white shadow-xl shadow-gray-200/50">
                    <div className="flex items-center gap-6">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-3 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                                boxShadow: `0 10px 20px ${colors.primary[600]}30`
                            }}
                        >
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className={`text-3xl ${typography.weight.black} theme-text-primary tracking-tight`}>
                                Security <span className="theme-text-primary">Reprint Control</span>
                            </h1>
                        </div>
                    </div>

                    {/* <div className="flex gap-4">
                        <div className="theme-bg-primary-light px-5 py-3 rounded-2xl border theme-border-primary-light flex flex-col items-end shadow-sm">
                            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest opacity-60">Pending Requests</span>
                            <span className="text-2xl font-black theme-text-primary leading-tight">{investments.length}</span>
                        </div>
                    </div> */}
                </div>

                {/* Search Bar */}
                <div className="relative group max-w-2xl">
                    <Search className="w-5 h-5 text-gray-400 absolute left-6 top-1/2 -translate-y-1/2 transition-colors group-focus-within:theme-text-primary" />
                    <input
                        type="text"
                        placeholder="Search by ID or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white/80 backdrop-blur-xl border-white border-[1.5px] rounded-2xl outline-none transition-all shadow-xl shadow-gray-200/10 text-gray-700 font-bold theme-focus-ring text-sm uppercase tracking-wide"
                    />
                </div>

                {/* List Container */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-32 flex justify-center">
                            <BMSLoader message="Verifying Integrity Keys..." />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-24 text-center space-y-6">
                            <div className="w-20 h-20 bg-primary-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-primary-100">
                                <ShieldCheck className="w-10 h-10 text-primary-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black theme-text-primary uppercase">System Secure</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">No reprint authorizations required</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="theme-bg-primary-light border-b theme-border-primary-light/50">
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Asset / Reference</th>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Print Metrics</th>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Security Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center whitespace-nowrap">Access Authorization</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-primary-50/50 transition-all group cursor-default">
                                            <td className="px-10 py-8">
                                                <div className="font-black theme-text-primary text-sm group-hover:theme-text-primary transition-colors">{inv.customer?.full_name}</div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60 truncate max-w-[180px]">{inv.transaction_id}</div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-2">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-xl border border-primary-100 w-fit">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{inv.print_count} EXECUTED</span>
                                                    </div>
                                                    {inv.reprint_reason && (
                                                        <div className="text-[9px] font-bold text-gray-500 italic bg-gray-50 px-3 py-2 rounded-xl border border-dashed border-gray-200 leading-relaxed max-w-xs">
                                                            "{inv.reprint_reason}"
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                {inv.is_reprint_authorized ? (
                                                    <div className="flex items-center gap-2.5 text-emerald-500 animate-in fade-in slide-in-from-left-2">
                                                        <ShieldCheck className="w-4 h-4 shadow-sm" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Authorized</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2.5 text-primary-500 opacity-60">
                                                        <Lock className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Locked Out</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleAuthorize(inv.id)}
                                                        disabled={inv.is_reprint_authorized}
                                                        className={`group relative flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${inv.is_reprint_authorized ? 'bg-gray-50 text-gray-300 cursor-not-allowed shadow-none border border-gray-100' : 'bg-primary-600 text-white shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-600/30'}`}
                                                    >
                                                        {inv.is_reprint_authorized ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <Unlock className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                                        )}
                                                        {inv.is_reprint_authorized ? 'Reprint Enabled' : 'Authorize Release'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Information Footer */}
                {/* <div className="flex items-center gap-5 p-6 bg-primary-50 rounded-2xl border border-primary-100 border-dashed shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-primary-500" />
                    </div>
                    <p className="text-[10px] font-bold text-primary-800 uppercase tracking-wide leading-loose">
                        Reprint authorization is a <span className="font-black theme-text-primary">Single-use Transactional Release</span>.
                        The security layer will <span className="underline">Automatically Re-engage</span> immediately following the execution of the next print command.
                    </p>
                </div> */}
            </div>

            {/* Premium Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Close Button */}
                        <button
                            onClick={() => setConfirmModal({ isOpen: false, id: null })}
                            className="absolute top-8 right-8 p-3 rounded-2xl hover:bg-black/5 transition-all text-gray-400 hover:text-gray-900 z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="p-12">
                            <div className="flex flex-col items-center text-center mb-10">
                                <div
                                    className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl transform rotate-3 transition-transform hover:rotate-0 duration-500"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                                        boxShadow: `0 20px 40px ${colors.primary[500]}40`
                                    }}
                                >
                                    <ShieldCheck className="w-12 h-12 text-white" />
                                </div>

                                <h2 className="text-3xl font-black theme-text-primary tracking-tight mb-3">
                                    Confirm <span className="text-primary-600">Authorization</span>
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                                    Investment Ledger Reprint Authorization
                                </p>
                            </div>

                            {/* <div className="bg-primary-50/50 dark:bg-gray-900/30 rounded-[2rem] p-8 mb-10 border border-primary-100/50 dark:border-gray-800">
                                <p className="text-sm font-bold text-primary-800 leading-relaxed text-center">
                                    Authorize a one-time reprint for this investment ledger? This action will be journaled.
                                </p>
                            </div> */}

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setConfirmModal({ isOpen: false, id: null })}
                                    className="flex-1 px-8 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-50 transition-all hover:text-gray-600 shadow-sm"
                                >
                                    Abeyance
                                </button>
                                <button
                                    onClick={confirmAuthorization}
                                    disabled={isAuthorizing}
                                    className="flex-[1.5] relative group overflow-hidden px-8 py-5 rounded-2xl transition-all active:scale-95 shadow-xl bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20 disabled:opacity-50"
                                >
                                    <div className="relative flex items-center justify-center gap-3">
                                        {isAuthorizing ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                                        )}
                                        <span className="text-white font-black uppercase text-[10px] tracking-widest">
                                            Confirm Auth
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
