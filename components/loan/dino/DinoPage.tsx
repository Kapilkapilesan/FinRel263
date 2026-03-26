"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Printer,
    ChevronDown,
    Check,
    X,
    Calendar,
    User,
    Search,
    Loader2,
} from "lucide-react";
import {
    dinoService,
    FieldOfficer,
    DinoCenter,
    CenterCollection,
    CollectionDataResponse,
} from "@/services/dino.service";
import { authService } from "@/services/auth.service";

// ======================== Cash Denomination Config ========================
const DENOMINATIONS = [5000, 1000, 500, 100, 50, 20, 10];

interface DenominationEntry {
    denomination: number;
    count: number;
}

// ======================== Printed Tracking ========================
interface PrintedTracking {
    centers: Record<string, {
        amount: number;
        np_count: number;
        np_amount: number;
        up_count: number;
        up_amount: number;
    }>;
}

// ======================== Component ========================
export default function DinoPage() {
    // ---------- State ----------
    const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
    const [selectedOfficer, setSelectedOfficer] = useState<FieldOfficer | null>(null);
    const [officerDropdownOpen, setOfficerDropdownOpen] = useState(false);
    const [officerSearch, setOfficerSearch] = useState("");

    const [centers, setCenters] = useState<DinoCenter[]>([]);
    const [selectedCenterIds, setSelectedCenterIds] = useState<number[]>([]);
    const [centerDropdownOpen, setCenterDropdownOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split("T")[0];
    });

    const [collectionData, setCollectionData] = useState<CollectionDataResponse | null>(null);
    const [printedData, setPrintedData] = useState<PrintedTracking>({ centers: {} });
    const [loading, setLoading] = useState(false);
    const [loadingOfficers, setLoadingOfficers] = useState(false);
    const [loadingCenters, setLoadingCenters] = useState(false);
    const [isFieldOfficer, setIsFieldOfficer] = useState(false);

    const [denominations, setDenominations] = useState<DenominationEntry[]>(
        DENOMINATIONS.map((d) => ({ denomination: d, count: 0 }))
    );

    const officerRef = useRef<HTMLDivElement>(null);
    const centerRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // ---------- Fetch Field Officers ----------
    useEffect(() => {
        const load = async () => {
            const currentUser = authService.getCurrentUser();
            const hasFoRole = authService.hasRole('field_officer');
            setIsFieldOfficer(hasFoRole);

            if (currentUser && hasFoRole) {
                const mappedOfficer: FieldOfficer = {
                    id: currentUser.id,
                    name: currentUser.full_name || currentUser.name || currentUser.user_name,
                    user_name: currentUser.user_name,
                    staff_id: currentUser.staff_id || ""
                };
                setSelectedOfficer(mappedOfficer);
                setLoadingOfficers(false);
                // We still fetch other officers in case they need to be displayed (though dropdown will be hidden)
                // but we can skip it if we know we won't show it.
                // For now, let's keep it simple.
            }

            setLoadingOfficers(true);
            try {
                const data = await dinoService.getFieldOfficers();
                setFieldOfficers(data);
            } catch {
                console.error("Error loading field officers");
            } finally {
                setLoadingOfficers(false);
            }
        };
        load();
    }, []);

    // ---------- Fetch Centers on officer change ----------
    useEffect(() => {
        if (!selectedOfficer) {
            setCenters([]);
            setSelectedCenterIds([]);
            setCollectionData(null);
            return;
        }
        const load = async () => {
            setLoadingCenters(true);
            try {
                const data = await dinoService.getCenters(selectedOfficer.id);
                setCenters(data);

                // Automatically select all centers by default
                if (data.length > 0) {
                    setSelectedCenterIds(data.map(c => c.id));
                } else {
                    setSelectedCenterIds([]);
                }

                setCollectionData(null);
            } catch {
                console.error("Error loading centers");
            } finally {
                setLoadingCenters(false);
            }
        };
        load();
    }, [selectedOfficer]);

    // ---------- Fetch Collection Data when centers or date change ----------
    const fetchCollectionData = useCallback(async () => {
        if (selectedCenterIds.length === 0) {
            setCollectionData(null);
            return;
        }
        setLoading(true);
        try {
            const data = await dinoService.getCollectionData(selectedCenterIds, selectedDate);
            setCollectionData(data);
        } catch {
            console.error("Error loading collection data");
        } finally {
            setLoading(false);
        }
    }, [selectedCenterIds, selectedDate]);

    useEffect(() => {
        fetchCollectionData();
    }, [fetchCollectionData]);

    // ---------- Load Printed Data ----------
    useEffect(() => {
        if (selectedOfficer && selectedDate) {
            const key = `dino_printed_${selectedOfficer.id}_${selectedDate}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    setPrintedData(JSON.parse(stored));
                } catch {
                    setPrintedData({ centers: {} });
                }
            } else {
                setPrintedData({ centers: {} });
            }
        } else {
            setPrintedData({ centers: {} });
        }
    }, [selectedOfficer, selectedDate]);

    // ---------- Compute Incremental Data ----------
    const incrementalData = useMemo(() => {
        if (!collectionData) return null;

        let total_amount = 0;
        let total_np_count = 0;
        let total_np_amount = 0;
        let total_up_count = 0;
        let total_up_amount = 0;

        const centers = collectionData.centers.map(c => {
            const printed = printedData.centers[c.CSU_id] || { amount: 0, np_count: 0, np_amount: 0, up_count: 0, up_amount: 0 };

            return {
                ...c,
                amount: Math.max(0, c.amount - printed.amount),
                np_count: Math.max(0, c.np_count - (printed.np_count || 0)),
                np_amount: Math.max(0, (c.np_amount || 0) - (printed.np_amount || 0)),
                up_count: Math.max(0, c.up_count - (printed.up_count || 0)),
                up_amount: Math.max(0, (c.up_amount || 0) - (printed.up_amount || 0))
            };
        }).filter(c => c.amount > 0 || c.np_amount > 0 || c.up_amount > 0);

        centers.forEach(c => {
            total_amount += c.amount;
            total_np_count += c.np_count;
            total_np_amount += c.np_amount;
            total_up_count += c.up_count;
            total_up_amount += c.up_amount;
        });

        return {
            centers,
            totals: {
                total_amount,
                total_np_count,
                total_np_amount,
                total_up_count,
                total_up_amount
            }
        };
    }, [collectionData, printedData]);

    // ---------- Close dropdowns on outside click ----------
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (officerRef.current && !officerRef.current.contains(e.target as Node)) {
                setOfficerDropdownOpen(false);
            }
            if (centerRef.current && !centerRef.current.contains(e.target as Node)) {
                setCenterDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ---------- Denomination helpers ----------
    const handleDenominationChange = (index: number, value: string) => {
        const numVal = parseInt(value) || 0;
        setDenominations((prev) => {
            const n = [...prev];
            n[index] = { ...n[index], count: numVal };
            return n;
        });
    };

    const cashTotal = denominations.reduce(
        (sum, d) => sum + d.denomination * d.count,
        0
    );

    const csuAmount = incrementalData?.totals?.total_amount ?? 0;
    const cashBalance = csuAmount - cashTotal;

    // ---------- Center multi-select helpers ----------
    const toggleCenter = (id: number) => {
        setSelectedCenterIds((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const selectAllCenters = () => {
        setSelectedCenterIds(centers.map((c) => c.id));
    };

    const deselectAllCenters = () => {
        setSelectedCenterIds([]);
    };

    // ---------- Print ----------
    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Dino - Collection Statement</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px 40px; color: #000; font-size: 11px; line-height: 1.4; }
                    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .print-user { font-size: 12px; }
                    .print-user span { font-weight: 800; text-decoration: underline; margin-left: 10px; }
                    .date-time { text-align: right; font-size: 11px; color: #555; }

                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
                    .tables-wrapper { display: flex; gap: 0; align-items: flex-start; margin-bottom: 30px; }
                    
                    .print-table th { font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 10px 8px; text-align: left; vertical-align: bottom; }
                    .print-table td { padding: 10px 8px; font-size: 11px; height: 16px; vertical-align: middle; }
                    .print-table .amount-col { text-align: right; font-weight: 700; }
                    
                    /* Visual Split Styling */
                    .print-table td:not(.spacer), .print-table th:not(.spacer) { border-bottom: 1px dotted #999; }
                    .print-table th:not(.spacer) { border-bottom: 1px solid #000; }
                    .print-table .spacer { width: 40px; border: none !important; }
                    
                    .remark-main-header { text-align: center !important; font-size: 11px !important; border-bottom: none !important; padding-bottom: 4px !important; }
                    
                    .footer-total-row td { 
                        font-weight: 900; 
                        padding: 12px 8px; 
                        background: transparent !important;
                        color: #000 !important;
                        font-size: 12px;
                        height: 20px;
                        vertical-align: middle;
                    }
                    .footer-total-row td:not(.spacer) {
                        border-top: 4px double #000; 
                        border-bottom: 4px double #000; 
                    }

                    .deno-section { display: flex; justify-content: space-between; margin-top: 30px; gap: 50px; page-break-inside: avoid; }
                    .deno-table-container { width: 55%; }
                    .deno-table-container h4 { font-size: 13px; margin-bottom: 12px; font-weight: 800; text-transform: uppercase; border-left: 4px solid #333; padding-left: 10px; }
                    .deno-table td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #e2e8f0; }
                    .deno-table .deno-x { text-align: center; color: #666; font-weight: 400; }
                    .deno-table .deno-amount { text-align: right; font-weight: 700; }
                    .deno-total td { font-weight: 800; border-top: 2px solid #333; background-color: #f8fafc; }

                    .summary-container { width: 40%; }
                    .summary-table { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
                    .summary-table td { padding: 8px 12px; font-size: 12px; }
                    .summary-table .label { text-align: left; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; }
                    .summary-table .value { text-align: right; font-weight: 800; font-size: 14px; }
                    .balance-row { background-color: #1e293b; color: #fff; }
                    .balance-row .label { color: #94a3b8; }

                    .signature-section { display: flex; justify-content: space-between; margin-top: 80px; padding: 0 40px; page-break-inside: avoid; }
                    .signature-block { text-align: center; width: 220px; }
                    .signature-line { width: 100%; border-top: 1px solid #000; margin-bottom: 8px; }
                    .signature-label { font-size: 11px; font-weight: 700; text-transform: uppercase; }

                    @media print {
                        body { padding: 10px; }
                        .footer-total-row td { -webkit-print-color-adjust: exact; }
                        .balance-row { -webkit-print-color-adjust: exact; background-color: #1e293b !important; color: #fff !important; }
                    }
                </style>
            </head>
            <body>
                <div class="header" style="border-bottom: none; margin-bottom: 20px;">
                    <div style="font-size: 10px; color: #666;">Print User: <span style="font-weight: 800; color: #000; margin-left: 20px;">${selectedOfficer?.name ?? ""}</span></div>
                    <div class="date-time" style="color: #000; font-weight: 600;">${dateStr} at ${timeStr}</div>
                </div>

                <div class="unified-table-container">
                    <table class="print-table">
                        <thead>
                            <tr style="border-bottom: none;">
                                <th rowspan="2" style="width: 12%;">CSU NO</th>
                                <th rowspan="2" style="width: 28%;">CSU NAME</th>
                                <th rowspan="2" class="amount-col" style="width: 12%;">AMOUNT</th>
                                <th rowspan="2" class="spacer"></th>
                                <th colspan="4" class="remark-main-header" style="height: 20px; border-bottom: 1px solid #000;">Remark</th>
                            </tr>
                            <tr style="border-bottom: 1px solid #000;">
                                <th style="width: 10%; text-align: center;">NO NP</th>
                                <th style="width: 13%; text-align: center;">NP AMOUNT</th>
                                <th style="width: 10%; text-align: center;">NO UP</th>
                                <th style="width: 15%; text-align: center;">UP AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(incrementalData?.centers ?? []).map((c) => `
                                <tr>
                                    <td style="font-weight:600">${c.CSU_id}</td>
                                    <td style="text-transform: uppercase;">${c.center_name}</td>
                                    <td class="amount-col">${formatCurrency(c.amount)}</td>
                                    <td class="spacer"></td>
                                    <td style="text-align: center;">${c.np_count || ""}</td>
                                    <td style="text-align: center;">${c.np_amount ? formatCurrency(c.np_amount) : ""}</td>
                                    <td style="text-align: center;">${c.up_count || ""}</td>
                                    <td style="text-align: center;">${c.up_amount ? formatCurrency(c.up_amount) : ""}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                        <tfoot>
                            <tr class="footer-total-row">
                                <td colspan="2" style="text-align: left; text-transform: uppercase; font-size: 11px;">Total Amount</td>
                                <td class="amount-col">${formatCurrency(csuAmount)}</td>
                                <td class="spacer"></td>
                                <td style="text-align: center;">${incrementalData?.totals?.total_np_count || "0"}</td>
                                <td style="text-align: center;">${formatCurrency(incrementalData?.totals?.total_np_amount ?? 0)}</td>
                                <td style="text-align: center;">${incrementalData?.totals?.total_up_count || "0"}</td>
                                <td style="text-align: center;">${formatCurrency(incrementalData?.totals?.total_up_amount ?? 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="deno-section">
                    <div class="deno-table-container">
                        <h4>Cash Denominations</h4>
                        <table class="deno-table">
                            <tbody>
                                ${denominations.map((d) => `
                                    <tr>
                                        <td style="text-align:right; width: 30%; font-weight: 700;">${formatCurrency(d.denomination)}</td>
                                        <td class="deno-x" style="width: 10%">X</td>
                                        <td style="width: 20%; font-weight: 800; font-size: 13px;">${d.count || 0}</td>
                                        <td class="deno-amount" style="width: 40%">${formatCurrency(d.denomination * d.count)}</td>
                                    </tr>
                                `).join("")}
                                <tr class="deno-total">
                                    <td colspan="3" style="text-align:right; padding: 10px;">TOTAL CASH</td>
                                    <td class="deno-amount" style="font-size: 14px; padding: 10px;">${formatCurrency(cashTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="summary-container">
                        <table class="summary-table">
                            <tbody>
                                <tr>
                                    <td class="label">CSU Collection Total</td>
                                    <td class="value">${formatCurrency(csuAmount)}</td>
                                </tr>
                                <tr>
                                    <td class="label">Physical Cash Total</td>
                                    <td class="value">${formatCurrency(cashTotal)}</td>
                                </tr>
                                <tr class="balance-row">
                                    <td class="label" style="font-size: 11px;">Difference / Balance</td>
                                    <td class="value" style="font-size: 16px;">${formatCurrency(Math.abs(cashBalance))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="signature-section">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-label">Field Officer Signature</div>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-label">Branch Manager Signature</div>
                    </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();

            if (selectedOfficer && selectedDate && incrementalData) {
                const key = `dino_printed_${selectedOfficer.id}_${selectedDate}`;
                const newPrinted = { centers: { ...printedData.centers } };

                incrementalData.centers.forEach(c => {
                    const existing = newPrinted.centers[c.CSU_id] || { amount: 0, np_count: 0, np_amount: 0, up_count: 0, up_amount: 0 };
                    newPrinted.centers[c.CSU_id] = {
                        amount: existing.amount + c.amount,
                        np_count: existing.np_count + c.np_count,
                        np_amount: existing.np_amount + c.np_amount,
                        up_count: existing.up_count + c.up_count,
                        up_amount: existing.up_amount + c.up_amount,
                    };
                });

                localStorage.setItem(key, JSON.stringify(newPrinted));
                setPrintedData(newPrinted);

                setDenominations(DENOMINATIONS.map((d) => ({ denomination: d, count: 0 })));
            }
        }, 500);
    };

    // ---------- Filtered field officers ----------
    const filteredOfficers = fieldOfficers.filter((fo) =>
        fo.name.toLowerCase().includes(officerSearch.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1200px] mx-auto" id="dino-page">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-text-primary">
                    Collection Statement (Dino)
                </h1>
                <button
                    onClick={handlePrint}
                    disabled={!incrementalData || incrementalData.centers.length === 0 || cashTotal !== csuAmount}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <Printer className="w-4 h-4" />
                    Print Dino
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-card rounded-2xl border border-border-default p-5 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Field Officer Dropdown */}
                    <div ref={officerRef}>
                        <label className="flex items-center gap-2 text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                            <User className="w-3.5 h-3.5" />
                            Field Officer
                        </label>
                        <div className="relative">
                            {isFieldOfficer ? (
                                <div className="w-full flex items-center px-4 py-2.5 rounded-xl border border-border-default bg-background text-sm font-semibold text-text-primary">
                                    {selectedOfficer?.name || "Loading..."}
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setOfficerDropdownOpen(!officerDropdownOpen)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border-default bg-background text-sm font-medium hover:border-primary-400 transition-colors text-left"
                                    >
                                        <span className={selectedOfficer ? "text-text-primary" : "text-text-muted"}>
                                            {selectedOfficer?.name ?? "Select Field Officer"}
                                        </span>
                                        {loadingOfficers ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                                        ) : (
                                            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${officerDropdownOpen ? "rotate-180" : ""}`} />
                                        )}
                                    </button>

                                    {officerDropdownOpen && (
                                        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-card border border-border-default rounded-xl shadow-xl">
                                            <div className="p-2 border-b border-border-default sticky top-0 bg-card">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search officer..."
                                                        value={officerSearch}
                                                        onChange={(e) => setOfficerSearch(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-border-default text-sm focus:outline-none focus:border-primary-400"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            {filteredOfficers.map((fo) => (
                                                <button
                                                    key={fo.id}
                                                    onClick={() => {
                                                        setSelectedOfficer(fo);
                                                        setOfficerDropdownOpen(false);
                                                        setOfficerSearch("");
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-hover transition-colors flex items-center justify-between ${selectedOfficer?.id === fo.id ? "bg-primary-500/10 text-primary-600" : "text-text-primary"
                                                        }`}
                                                >
                                                    <span>{fo.name}</span>
                                                    {selectedOfficer?.id === fo.id && <Check className="w-4 h-4 text-primary-600" />}
                                                </button>
                                            ))}
                                            {filteredOfficers.length === 0 && (
                                                <div className="px-4 py-3 text-sm text-text-muted text-center">No officers found</div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5" />
                            Date
                        </label>
                        <div className="w-full flex items-center px-4 py-2.5 rounded-xl border border-border-default bg-background text-sm font-semibold text-text-primary uppercase tracking-wider">
                            {new Date(selectedDate).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    <span className="ml-3 text-text-muted font-medium">Loading collection data...</span>
                </div>
            )}

            {/* Collection Table + Cash Dino */}
            {collectionData && !loading && (
                <div ref={printRef}>
                    {/* Print Header (hidden on screen, shown on print) */}
                    <div className="hidden print:block mb-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm">
                                Print User <strong className="ml-12">{selectedOfficer?.name}</strong>
                            </div>
                            <div className="text-sm text-right">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                {" at "}
                                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </div>
                        </div>
                    </div>

                    {/* Officer + Date Header */}
                    <div className="flex items-center justify-between mb-4 print:hidden">
                        <div className="text-sm text-text-muted">
                            Print User <span className="font-bold text-text-primary ml-2">{selectedOfficer?.name}</span>
                        </div>
                        <div className="text-sm text-text-muted">
                            {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            {" at "}
                            {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                    </div>

                    {/* Unified Collection Table */}
                    <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-lg mb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse" id="dino-unified-table">
                                <thead>
                                    <tr className="bg-table-header">
                                        <th className="px-5 py-4 text-left font-bold text-text-primary text-xs uppercase tracking-wider border-b border-border-default" rowSpan={2}>CSU NO</th>
                                        <th className="px-5 py-4 text-left font-bold text-text-primary text-xs uppercase tracking-wider border-b border-border-default" rowSpan={2}>CSU NAME</th>
                                        <th className="px-5 py-4 text-right font-bold text-text-primary text-xs uppercase tracking-wider border-b border-border-default" rowSpan={2}>AMOUNT</th>
                                        <th className="w-8 bg-background border-none" rowSpan={2}></th>
                                        <th className="px-4 py-2 text-center font-bold text-text-primary text-xs uppercase tracking-wider border-l border-t border-r border-border-default bg-muted-bg rounded-t-xl" colSpan={4}>
                                            <div className="py-2">REMARK SUMMARY</div>
                                        </th>
                                    </tr>
                                    <tr className="bg-table-header border-b border-border-default">
                                        <th className="px-3 py-2.5 text-center font-bold text-text-secondary uppercase border-l border-border-default bg-muted-bg/50">NO NP</th>
                                        <th className="px-3 py-2.5 text-center font-bold text-text-secondary uppercase bg-muted-bg/50">NP AMOUNT</th>
                                        <th className="px-3 py-2.5 text-center font-bold text-text-secondary uppercase border-l border-border-default/50 bg-muted-bg/50">NO UP</th>
                                        <th className="px-3 py-2.5 text-center font-bold text-text-secondary uppercase bg-muted-bg/50 border-r border-border-default">UP AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incrementalData?.centers.map((center, idx) => (
                                        <tr
                                            key={`center_${idx}`}
                                            className={`hover:bg-table-row-hover transition-colors ${idx % 2 === 0 ? "bg-card" : "bg-table-stripe"}`}
                                        >
                                            <td className="px-5 py-4 font-bold text-text-primary whitespace-nowrap border-b border-border-default">{center.CSU_id}</td>
                                            <td className="px-5 py-4 text-text-secondary uppercase font-medium border-b border-border-default">{center.center_name}</td>
                                            <td className="px-5 py-4 text-right font-black text-text-primary text-base border-b border-border-default">
                                                {center.amount > 0 ? formatCurrency(center.amount) : "0.00"}
                                            </td>
                                            <td className="w-8 bg-transparent border-none"></td>
                                            <td className="px-3 py-4 text-center font-bold text-text-primary border-l border-b border-border-default">
                                                {center.np_count || "-"}
                                            </td>
                                            <td className="px-3 py-4 text-center font-bold text-text-primary border-b border-border-default">
                                                {center.np_amount ? formatCurrency(center.np_amount) : "-"}
                                            </td>
                                            <td className="px-3 py-4 text-center font-bold text-text-primary border-l border-b border-border-default/30">
                                                {center.up_count || "-"}
                                            </td>
                                            <td className="px-3 py-4 text-center font-bold text-text-primary border-r border-b border-border-default">
                                                {center.up_amount ? formatCurrency(center.up_amount) : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                    {incrementalData?.centers.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-8 text-center text-text-muted font-medium border-b border-border-default">
                                                No collections due for the selected centers.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-transparent text-primary-900 dark:text-text-primary font-black">
                                        <td className="px-5 py-5 text-right font-bold uppercase text-xs tracking-wider border-t-2 border-b border-slate-400 dark:border-border-default bg-slate-50 dark:bg-card" colSpan={2}>
                                            Total Amount
                                        </td>
                                        <td className="px-5 py-5 text-right text-xl tracking-tight border-t-2 border-b border-slate-400 dark:border-border-default bg-slate-50 dark:bg-card">
                                            {formatCurrency(csuAmount)}
                                        </td>
                                        <td className="w-8 bg-transparent border-none"></td>
                                        <td className="px-3 py-5 text-center border-t-2 border-b border-slate-300 dark:border-border-default bg-card">
                                            {incrementalData?.totals.total_np_count || "0"}
                                        </td>
                                        <td className="px-3 py-5 text-center border-t-2 border-b border-slate-300 dark:border-border-default bg-card">
                                            {formatCurrency(incrementalData?.totals.total_np_amount ?? 0)}
                                        </td>
                                        <td className="px-3 py-5 text-center border-t-2 border-b border-slate-300 dark:border-border-default bg-card">
                                            {incrementalData?.totals.total_up_count || "0"}
                                        </td>
                                        <td className="px-3 py-5 text-center border-t-2 border-b border-slate-300 dark:border-border-default bg-card">
                                            {formatCurrency(incrementalData?.totals.total_up_amount ?? 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Cash Denomination Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cash Dino Input */}
                        <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm">
                            <h3 className="text-center font-bold text-text-primary mb-4 text-sm uppercase tracking-wider">
                                Cash Dino
                            </h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    {denominations.map((d, idx) => (
                                        <tr key={d.denomination} className="border-b border-border-default/50 last:border-0">
                                            <td className="py-2.5 text-right font-medium text-text-primary pr-4 w-24">
                                                {formatCurrency(d.denomination)}
                                            </td>
                                            <td className="py-2.5 text-center text-text-muted w-8">X</td>
                                            <td className="py-2.5 w-24">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={d.count || ""}
                                                    onChange={(e) => handleDenominationChange(idx, e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-border-default bg-background text-sm text-center font-medium focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 transition-all"
                                                    placeholder="0"
                                                    id={`deno - ${d.denomination} `}
                                                />
                                            </td>
                                            <td className="py-2.5 text-right font-medium text-text-primary pl-4 w-32">
                                                {formatCurrency(d.denomination * d.count)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-border-default">
                                        <td className="py-3" colSpan={3}>
                                            <span className="font-bold text-text-primary uppercase text-xs tracking-wider float-right pr-4">
                                                Cash Total
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-bold text-text-primary text-base">
                                            {formatCurrency(cashTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="bg-card rounded-2xl border border-border-default p-5 shadow-sm self-start">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                                    <span className="font-bold text-xs text-primary-700 dark:text-primary-400 uppercase tracking-wider">CSU Amount</span>
                                    <span className="font-bold text-base text-primary-700 dark:text-primary-400">{formatCurrency(csuAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-success-500/10 border border-success-500/20">
                                    <span className="font-bold text-xs text-success-700 dark:text-success-500 uppercase tracking-wider">Cash Amount</span>
                                    <span className="font-bold text-base text-success-700 dark:text-success-500">{formatCurrency(cashTotal)}</span>
                                </div>
                                <div className="h-px bg-border-default my-2"></div>
                                <div className={`flex items-center justify-between py-2.5 px-4 rounded-xl border ${cashBalance === 0
                                    ? "bg-muted-bg border-border-default"
                                    : cashBalance > 0
                                        ? "bg-red-500/10 border-red-500/20"
                                        : "bg-amber-500/10 border-amber-500/20"
                                    }`}>
                                    <span className={`font-bold text-xs uppercase tracking-wider ${cashBalance === 0 ? "text-text-primary" : cashBalance > 0 ? "text-red-500" : "text-amber-500"
                                        }`}>Cash Balance</span>
                                    <span className={`font-bold text-base ${cashBalance === 0 ? "text-text-primary" : cashBalance > 0 ? "text-red-500" : "text-amber-500"
                                        }`}>{formatCurrency(Math.abs(cashBalance))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!collectionData && !loading && selectedOfficer && selectedCenterIds.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted-bg flex items-center justify-center">
                        <svg className="w-8 h-8 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">Select Centers</h3>
                    <p className="text-sm text-text-muted">Choose one or more centers to view collection data</p>
                </div>
            )}

            {!selectedOfficer && !loading && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted-bg flex items-center justify-center">
                        <User className="w-8 h-8 text-text-muted/50" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">Select a Field Officer</h3>
                    <p className="text-sm text-text-muted">Choose a field officer to view their assigned centers</p>
                </div>
            )}
        </div>
    );
}

// ======================== Helpers ========================
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(amount);
}
