"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  TrendingUp,
  BadgeDollarSign,
  Download,
  Plus,
} from "lucide-react";
import { CustomerInvestmentsTable } from "../../components/fund-transactions/CustomerInvestmentsTable";
import { investmentService } from "../../services/investment.service";
import { authService } from "../../services/auth.service";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import BMSLoader from "../../components/common/BMSLoader";
import { colors } from "@/themes/colors";
import {
  filterInvestments,
  calculateInvestmentStats,
} from "@/utils/investment.utils";

export default function InvestmentsListPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    loadInvestments(true);

    const interval = setInterval(() => loadInvestments(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const loadInvestments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await investmentService.getInvestments();
      setInvestments(data);
    } catch (error) {
      console.error(error);
      if (showLoading) toast.error("Failed to load investments");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredInvestments = filterInvestments(
    investments,
    searchTerm,
    statusFilter
  );

  const stats = calculateInvestmentStats(investments);

  return (
    <div className="min-h-screen relative overflow-hidden pb-12 bg-app-background">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${colors.primary[400]}, transparent)` }}
        />
        <div
          className="absolute top-[30%] -right-[15%] w-[40%] h-[40%] rounded-full opacity-10 blur-[140px]"
          style={{ background: `radial-gradient(circle, ${colors.indigo[400]}, transparent)` }}
        />
        <div
          className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${colors.primary[300]}, transparent)` }}
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-3 relative z-10 px-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/80 backdrop-blur-xl p-4 md:px-6 rounded-2xl border border-border-default shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="flex items-center gap-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-3 duration-500"
              style={{
                background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`,
                boxShadow: `0 10px 20px ${colors.primary[600]}30`
              }}
            >
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                Investment <span className="theme-text-primary">Accounts</span>
              </h1>
            </div>
          </div>

          {isMounted && authService.hasPermission("investments.create") && (
            <button
              onClick={() => router.push("/investments/create")}
              className="group relative flex items-center justify-center gap-3 px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-primary-700 hover:shadow-2xl active:scale-95 shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4" />
              Initialize New Asset
            </button>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stat 1 */}
          <div className="bg-card/70 backdrop-blur-xl p-4 md:px-6 rounded-3xl border border-border-default shadow-xl shadow-black/5 dark:shadow-black/20 group hover:scale-[1.02] transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                <BadgeDollarSign className="w-6 h-6 text-primary-500 group-hover:text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 opacity-70">
                  Total Active Principal
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-text-primary tracking-tight">{stats.totalPrincipal.toLocaleString()}</span>
                  <span className="text-xs font-bold text-primary-500">LKR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-card/70 backdrop-blur-xl p-4 md:px-6 rounded-3xl border border-border-default shadow-xl shadow-black/5 dark:shadow-black/20 group hover:scale-[1.02] transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                <TrendingUp className="w-6 h-6 text-primary-500 group-hover:text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 opacity-70">
                  Total Subscriptions
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-text-primary tracking-tight">{stats.totalCount}</span>
                  <span className="text-xs font-bold text-primary-500 italic uppercase">Accounts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="w-5 h-5 text-text-muted absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-primary-600 transition-colors" />
              <input
                type="text"
                placeholder="Search accounts, customers, or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-3.5 bg-input backdrop-blur-xl border-border-default border-[1.5px] rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all shadow-xl shadow-black/5 dark:shadow-black/20 text-text-primary font-bold text-sm placeholder:text-text-muted uppercase tracking-wide"
              />
            </div>

            <div className="relative w-full lg:w-80">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full flex items-center justify-between pl-6 pr-6 py-3.5 bg-input backdrop-blur-xl border-border-default border-[1.5px] rounded-2xl text-text-primary font-extrabold shadow-xl cursor-pointer theme-focus-ring transition-all uppercase tracking-widest text-[10px]"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'ALL' ? 'bg-text-muted' : 'bg-primary-500 animate-pulse'}`} />
                  {statusFilter.replace(/_/g, " ")}
                </div>
                <Filter className={`w-4 h-4 text-text-muted transition-transform duration-300 ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showStatusDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-[90]" 
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-card/95 backdrop-blur-2xl border border-border-default rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 space-y-1">
                      {[
                        { id: "ALL", label: "ALL PORTFOLIO" },
                        { id: "ACTIVE", label: "ACTIVE ONLY" },
                        { id: "PENDING_APPROVAL", label: "PENDING APPROVAL" },
                        { id: "APPROVED_AWAITING_PAYMENT", label: "AWAITING PAYMENT" },
                        { id: "APPROVED_AWAITING_ACTIVATION", label: "AWAITING ACTIVATION" },
                        { id: "CLOSED", label: "CLOSED" },
                        { id: "MATURED", label: "MATURED" },
                        { id: "RENEWED", label: "RENEWED" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setStatusFilter(opt.id);
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all ${
                            statusFilter === opt.id 
                            ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" 
                            : "hover:bg-hover text-text-primary hover:translate-x-1"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              statusFilter === opt.id 
                              ? "bg-white" 
                              : "bg-primary-500 opacity-40 group-hover:opacity-100"
                            }`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {opt.label}
                            </span>
                          </div>
                          {statusFilter === opt.id && (
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-ping" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-card/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 border border-border-default overflow-hidden min-h-[500px]">
            {loading ? (
              <div className="p-32 flex justify-center">
                <BMSLoader message="Analyzing Portfolio Intelligence..." />
              </div>
            ) : (
              <CustomerInvestmentsTable records={filteredInvestments} />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
