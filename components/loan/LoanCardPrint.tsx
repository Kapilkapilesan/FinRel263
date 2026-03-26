'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loan } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { Printer, RotateCcw, Eye, EyeOff, History, X, Maximize2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface LoanCardPrintProps {
    loan: Loan;
}

interface CardData {
    front: {
        group_number: string;
        branch: string;
        center_number: string;
        center_name: string;
        customer_name: string;
        customer_id: string;
        loan_date: string;
        nic: string;
    };
    back: {
        contract_number: string;
        date: string;
        approved_amount: string;
        interest_amount: string;
        full_amount: string;
        term_duration: string;
        installment: string;
        product_type: string;
    };
    print_count: number;
    loan_id: string;
}

export function LoanCardPrint({ loan }: LoanCardPrintProps) {
    const [cardData, setCardData] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showStencil, setShowStencil] = useState(true);
    const [printCount, setPrintCount] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [printHistory, setPrintHistory] = useState<any[]>([]);
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
    const [showFullPreview, setShowFullPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchCardData();
    }, [loan.id]);

    const fetchCardData = async () => {
        try {
            setLoading(true);
            const data = await loanService.getCardData(loan.id);
            setCardData(data);
            setPrintCount(data.print_count);
        } catch (err: any) {
            toast.error(err.message || 'Failed to load card data');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async (side: 'front' | 'back' | 'full') => {
        if (!cardData) return;

        try {
            // Record the print
            const result = await loanService.recordCardPrint(loan.id, side);
            setPrintCount(result.total_prints);

            // Trigger browser print
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.error('Popup blocked. Please allow popups for printing.');
                return;
            }

            const frontHTML = side === 'back' ? '' : generateFrontHTML(cardData);
            const backHTML = side === 'front' ? '' : generateBackHTML(cardData);

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Loan Card - ${cardData.loan_id}</title>
                    <style>
                        @page {
                            size: A4 landscape;
                            margin: 0;
                        }
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: Arial, sans-serif;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .page {
                            width: 297mm;
                            height: 210mm;
                            position: relative;
                            page-break-after: always;
                            overflow: hidden;
                        }
                        .page:last-child {
                            page-break-after: avoid;
                        }
                        .data-value {
                            position: absolute;
                            font-size: 11pt;
                            font-weight: bold;
                            color: #000;
                            white-space: nowrap;
                        }
                        .data-value-small {
                            position: absolute;
                            font-size: 9pt;
                            font-weight: bold;
                            color: #000;
                            white-space: nowrap;
                        }
                        .staff-block {
                            position: absolute;
                            font-size: 9pt;
                            font-weight: bold;
                            color: #000;
                            line-height: 1.6;
                        }
                        .group-box {
                            position: absolute;
                            font-size: 10pt;
                            font-weight: bold;
                            color: #000;
                            padding: 2px 6px;
                            border: 1.5px solid #000;
                        }
                        @media screen {
                            .page {
                                border: 1px dashed #ccc;
                                margin: 10px auto;
                                background: #fff;
                            }
                        }
                    </style>
                </head>
                <body>
                    ${frontHTML}
                    ${backHTML}
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                window.close();
                            }, 300);
                        };
                    <\/script>
                </body>
                </html>
            `);
            printWindow.document.close();

            toast.success(printCount > 0 ? 'Card reprinted!' : 'Card printed!');
        } catch (err: any) {
            toast.error(err.message || 'Print failed');
        }
    };

    const generateFrontHTML = (data: CardData): string => {
        const f = data.front;
        const groupNo = f.group_number.replace(/.*Group\s*/i, '');
        return `
            <div class="page">
                <!-- Group Number - Top Right Box -->
                <div class="group-box" style="top: 14mm; right: 22mm; min-width: 40mm; text-align: center;">Group No : ${groupNo}</div>
                
                <!-- Right side fields - Precise mm mapping for card_front.pdf -->
                <div class="data-value" style="top: 89mm; left: 177mm;">${f.branch}</div>
                
                <!-- சேவை நிலையத்தின் இலக்கம் (Center No) -->
                <div class="data-value" style="top: 103mm; left: 177mm;">${f.center_number}</div>
                <div class="data-value" style="top: 117mm; left: 177mm;">${f.center_name}</div>
                <div class="data-value" style="top: 131mm; left: 177mm;">${f.customer_name}</div>
                <div class="data-value" style="top: 145mm; left: 177mm;">${f.customer_id}</div>
                <div class="data-value" style="top: 159mm; left: 177mm;">${f.loan_date}</div>
                <div class="data-value" style="top: 173mm; left: 177mm;">${f.nic}</div>
                
                <!-- Fixed Staff Contacts - Bottom Left -->
                <div class="staff-block" style="bottom: 27mm; left: 30mm;">
                    <div style="display: flex; gap: 20px;"><span style="display:inline-block; width:160px;">G.MATHIVARMAN</span><span>074 200 54 21</span></div>
                    <div style="display: flex; gap: 20px;"><span style="display:inline-block; width:160px;">J.SABESKANTH</span><span>074 200 54 22</span></div>
                    <div style="display: flex; gap: 20px;"><span style="display:inline-block; width:160px;">K.B.PRIYATHARSHAN</span><span>074 200 54 23</span></div>
                </div>
            </div>
        `;
    };

    const generateBackHTML = (data: CardData): string => {
        const b = data.back;
        return `
            <div class="page">
                <div class="data-value-small" style="top: 12mm; left: 3mm; width: 30mm; text-align: center;">${b.contract_number}</div>
                <div class="data-value-small" style="top: 12mm; left: 40mm; width: 30mm; text-align: center;">${b.date}</div>
                <div class="data-value-small" style="top: 12mm; left: 75mm; width: 30mm; text-align: center;">${b.approved_amount}</div>
                <div class="data-value-small" style="top: 12mm; left: 115mm; width: 30mm; text-align: center;">${b.interest_amount}</div>
                <div class="data-value-small" style="top: 12mm; left: 150mm; width: 34mm; text-align: center;">${b.full_amount}</div>
                <div class="data-value-small" style="top: 12mm; left: 190mm; width: 31mm; text-align: center;">${b.installment}</div>
                <div class="data-value-small" style="top: 12mm; left: 227mm; width: 31mm; text-align: center;">${b.term_duration}</div>
                <div class="data-value-small" style="top: 12mm; left: 265mm; width: 31mm; text-align: center;">${b.installment}</div>
            </div>
        `;
    };

    const loadHistory = async () => {
        try {
            const prints = await loanService.getCardPrints(loan.id);
            setPrintHistory(prints);
            setShowHistory(true);
        } catch (err: any) {
            toast.error('Failed to load print history');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!cardData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <p className="text-sm font-bold">Failed to load card data</p>
                <button onClick={fetchCardData} className="mt-4 text-primary-500 text-xs font-bold uppercase tracking-widest">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-black text-text-primary tracking-tight">Loan Card</h3>
                    {printCount > 0 && (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                            Printed {printCount}x
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* History */}
                    <button
                        onClick={loadHistory}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted-bg/50 text-text-muted border border-border-divider hover:bg-hover transition-all"
                    >
                        <History size={14} />
                        History
                    </button>

                    {/* Print Buttons */}
                    <button
                        onClick={() => handlePrint('front')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                    >
                        <Printer size={14} />
                        Front
                    </button>

                    <button
                        onClick={() => handlePrint('back')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                    >
                        <Printer size={14} />
                        Back
                    </button>

                    <button
                        onClick={() => handlePrint('full')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white shadow-xl shadow-primary-500/30 hover:bg-primary-500 transition-all"
                    >
                        {printCount > 0 ? <RotateCcw size={14} /> : <Printer size={14} />}
                        {printCount > 0 ? 'Reprint Both' : 'Print Both'}
                    </button>
                </div>
            </div>

            {/* Side Tabs + Stencil Toggle + Full Preview Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center bg-muted-bg/50 p-1 rounded-2xl border border-border-divider/50 w-fit shadow-inner">
                    <button
                        onClick={() => setActiveSide('front')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSide === 'front'
                            ? 'bg-card text-primary-600 shadow-lg border border-border-divider/50'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        Card Front
                    </button>
                    <button
                        onClick={() => setActiveSide('back')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSide === 'back'
                            ? 'bg-card text-primary-600 shadow-lg border border-border-divider/50'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                    >
                        Card Back
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Stencil Toggle */}
                    <button
                        onClick={() => setShowStencil(!showStencil)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${showStencil
                            ? 'bg-primary-500/10 text-primary-600 border-primary-500/20'
                            : 'bg-muted-bg/50 text-text-muted border-border-divider hover:bg-hover'
                            }`}
                    >
                        {showStencil ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showStencil ? 'Hide Stencil' : 'Show Stencil'}
                    </button>

                    {/* Full Preview Button */}
                    <button
                        onClick={() => setShowFullPreview(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                    >
                        <Maximize2 size={14} />
                        Full A4 Preview
                    </button>
                </div>
            </div>

            {/* Inline Preview Area (scaled down to fit) */}
            <div className="relative bg-white rounded-3xl border border-border-default/30 shadow-xl overflow-hidden" style={{ aspectRatio: '297/210' }}>
                {/* Stencil Background */}
                {showStencil && (
                    <div className="absolute inset-0 pointer-events-none">
                        <img
                            src={activeSide === 'front' ? '/stencils/front_stencil.png' : '/stencils/back_stencil.png'}
                            alt="stencil"
                            className="w-full h-full object-contain opacity-50"
                        />
                    </div>
                )}

                {/* Data Overlay Preview - uses mm units inside a scaled container */}
                <div ref={printRef} className="absolute inset-0 flex items-center justify-center">
                    <div style={{
                        width: '297mm',
                        height: '210mm',
                        position: 'relative',
                        transform: 'scale(var(--preview-scale, 0.35))',
                        transformOrigin: 'center center',
                        fontFamily: 'Arial, sans-serif',
                    }} className="a4-preview-container">
                        {activeSide === 'front' ? (
                            <FrontPreviewMM data={cardData} />
                        ) : (
                            <BackPreviewMM data={cardData} />
                        )}
                    </div>
                </div>

                {/* Click hint */}
                <button
                    onClick={() => setShowFullPreview(true)}
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-black/80 transition-all backdrop-blur-sm"
                >
                    <Maximize2 size={12} />
                    Click for Full Size
                </button>
            </div>

            {/* Data Summary Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Data */}
                <div className="bg-card rounded-2xl border border-border-default/30 p-6 space-y-4">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Front Side Data</h4>
                    <div className="space-y-3">
                        {[
                            ['Group No', cardData.front.group_number],
                            ['Branch', cardData.front.branch],
                            ['Center No', cardData.front.center_number],
                            ['Center Name', cardData.front.center_name],
                            ['Customer Name', cardData.front.customer_name],
                            ['Customer ID', cardData.front.customer_id],
                            ['Loan Date', cardData.front.loan_date],
                            ['NIC', cardData.front.nic],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-1.5 border-b border-border-divider/30 last:border-0">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
                                <span className="text-xs font-black text-text-primary">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back Data */}
                <div className="bg-card rounded-2xl border border-border-default/30 p-6 space-y-4">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Back Side Data</h4>
                    <div className="space-y-3">
                        {[
                            ['Contract No', cardData.back.contract_number],
                            ['Date', cardData.back.date],
                            ['Approved Amount', cardData.back.approved_amount],
                            ['Interest Amount', cardData.back.interest_amount],
                            ['Full Amount', cardData.back.full_amount],
                            ['Term', cardData.back.term_duration],
                            ['Installment', cardData.back.installment],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-1.5 border-b border-border-divider/30 last:border-0">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
                                <span className="text-xs font-black text-text-primary">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* FULL A4 LANDSCAPE PREVIEW POPUP */}
            {/* ========================================== */}
            {showFullPreview && (
                <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#1a1a2e' }}>
                    {/* Top Bar */}
                    <div className="flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <h3 className="text-white text-sm font-black tracking-tight">
                                A4 Landscape Preview — {activeSide === 'front' ? 'CARD FRONT' : 'CARD BACK'}
                            </h3>
                            <span className="text-white/40 text-[10px] font-bold">297mm × 210mm</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Side Toggle */}
                            <div className="flex items-center bg-white/10 p-0.5 rounded-lg">
                                <button
                                    onClick={() => setActiveSide('front')}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeSide === 'front'
                                        ? 'bg-white text-black'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    Front
                                </button>
                                <button
                                    onClick={() => setActiveSide('back')}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeSide === 'back'
                                        ? 'bg-white text-black'
                                        : 'text-white/60 hover:text-white'
                                        }`}
                                >
                                    Back
                                </button>
                            </div>

                            {/* Stencil Toggle */}
                            <button
                                onClick={() => setShowStencil(!showStencil)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showStencil
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-white/10 text-white/60 border border-white/10 hover:text-white'
                                    }`}
                            >
                                {showStencil ? <EyeOff size={12} /> : <Eye size={12} />}
                                Stencil
                            </button>

                            {/* Close */}
                            <button
                                onClick={() => setShowFullPreview(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* A4 Preview Container - Scrollable, starting from TOP to prevent clipping */}
                    <div className="flex-1 overflow-auto flex items-start justify-center p-12">
                        <div
                            style={{
                                width: '297mm',
                                height: '210mm',
                                position: 'relative',
                                background: '#fff',
                                boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                                borderRadius: '4px',
                                flexShrink: 0,
                            }}
                        >
                            {/* Stencil Background - actual size */}
                            {showStencil && (
                                <img
                                    src={activeSide === 'front' ? '/stencils/front_stencil.png' : '/stencils/back_stencil.png'}
                                    alt="stencil"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'fill',
                                        opacity: 0.5,
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}

                            {/* Data Overlay - using actual mm positioning */}
                            {activeSide === 'front' ? (
                                <FrontPreviewMM data={cardData} />
                            ) : (
                                <BackPreviewMM data={cardData} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Print History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowHistory(false)} />
                    <div className="relative bg-card rounded-3xl border border-border-default/50 shadow-2xl p-8 w-full max-w-lg max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-text-primary">Print History</h3>
                            <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-muted-bg/50 text-text-muted hover:text-rose-500 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {printHistory.length === 0 ? (
                            <p className="text-center py-8 text-text-muted text-sm">No prints recorded yet</p>
                        ) : (
                            <div className="space-y-3">
                                {printHistory.map((print: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between py-3 px-4 bg-muted-bg/30 rounded-xl border border-border-divider/30">
                                        <div>
                                            <p className="text-xs font-black text-text-primary">
                                                Print #{print.print_number}
                                                {print.is_reprint && (
                                                    <span className="ml-2 text-[9px] text-amber-500 font-bold uppercase">Reprint</span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-text-muted mt-0.5">
                                                {print.print_type.toUpperCase()} • {new Date(print.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-text-muted font-bold">
                                            {print.printer?.user_name || 'Unknown'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// MM-BASED PREVIEW COMPONENTS 
// These use actual mm units so the preview matches
// the physical A4 landscape card exactly.
// ============================================

function FrontPreviewMM({ data }: { data: CardData }) {
    const f = data.front;
    const groupNo = f.group_number.replace(/.*Group\s*/i, '');
    return (
        <>
            {/* Group Number - Top Right Box --> */}
            <div style={{
                position: 'absolute',
                top: '12mm',
                right: '8mm',
                fontSize: '10pt',
                fontWeight: 'bold',
                color: '#000',
                padding: '2px 6px',
                border: '1.5px solid #000',
                borderTopLeftRadius: '5px',
                borderBottomRightRadius: '5px',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
                minWidth: '30mm',
                textAlign: 'center',
            }}>
                Group No : {groupNo}
            </div>

            {/* கிளை (Branch) */}
            <div style={{
                position: 'absolute',
                top: '86mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.branch}
            </div>

            {/* சேவை நிலையத்தின் இலக்கம் (Center No) */}
            <div style={{
                position: 'absolute',
                top: '100mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.center_number}
            </div>

            {/* சேவை நிலையத்தின் பெயர் (Center Name) */}
            <div style={{
                position: 'absolute',
                top: '113mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.center_name}
            </div>

            {/* வாடிக்கையாளர் பெயர் (Customer Name) */}
            <div style={{
                position: 'absolute',
                top: '127mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.customer_name}
            </div>

            {/* வாடிக்கையாளர் இலக்கம் (Customer ID) */}
            <div style={{
                position: 'absolute',
                top: '140mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.customer_id}
            </div>

            {/* கடன் வழங்கிய திகதி (Loan Date) */}
            <div style={{
                position: 'absolute',
                top: '153mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.loan_date}
            </div>

            {/* தே.அ.அ இலக்கம் (NIC) */}
            <div style={{
                position: 'absolute',
                top: '165mm',
                left: '240mm',
                fontSize: '11pt',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                whiteSpace: 'nowrap',
            }}>
                {f.nic}
            </div>

            {/* Staff Contacts - Bottom Left */}
            <div style={{
                position: 'absolute',
                bottom: '17mm',
                left: '30mm',
                fontSize: '9pt',
                fontWeight: 'bold',
                color: '#000',
                lineHeight: '1.6',
                fontFamily: 'Arial, sans-serif',
            }}>
                <div style={{ display: 'flex', gap: '20px' }}><span style={{ display: 'inline-block', width: '160px' }}>G.MATHIVARMAN</span><span>074 200 54 21</span></div>
                <div style={{ display: 'flex', gap: '20px' }}><span style={{ display: 'inline-block', width: '160px' }}>J.SABESKANTH</span><span>074 200 54 22</span></div>
                <div style={{ display: 'flex', gap: '20px' }}><span style={{ display: 'inline-block', width: '160px' }}>K.B.PRIYATHARSHAN</span><span>074 200 54 23</span></div>
            </div>
        </>
    );
}

function BackPreviewMM({ data }: { data: CardData }) {
    const b = data.back;
    const cellStyle: React.CSSProperties = {
        position: 'absolute',
        fontSize: '9pt',
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Arial, sans-serif',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const labelStyle: React.CSSProperties = {
        ...cellStyle,
        fontSize: '7.5pt',
        color: '#333',
    };

    return (
        <>
            {/* ஒப்பந்த இலக்கம் (Contract Number) */}
            <div style={{ ...cellStyle, top: '12mm', left: '3mm', width: '30mm' }}>{b.contract_number}</div>

            {/* பெற்றுக்கொண்ட திகதி (Date Received) */}
            <div style={{ ...cellStyle, top: '12mm', left: '40mm', width: '30mm' }}>{b.date}</div>

            {/* பெற்றுக்கொண்ட தொகை (Approved Amount) */}
            <div style={{ ...cellStyle, top: '12mm', left: '75mm', width: '30mm' }}>{b.approved_amount}</div>

            {/* வட்டி (Interest Amount) */}
            <div style={{ ...cellStyle, top: '12mm', left: '115mm', width: '30mm' }}>{b.interest_amount}</div>

            {/* வட்டியுடன் முழுத் தொகை (Total Loan Amount) */}
            <div style={{ ...cellStyle, top: '12mm', left: '150mm', width: '34mm' }}>{b.full_amount}</div>

            {/* வாராந்த தவணைக் கட்டணம் (Weekly Installment) */}
            <div style={{ ...cellStyle, top: '12mm', left: '190mm', width: '31mm' }}>{b.installment}</div>

            {/* கால எல்லை (Term) */}
            <div style={{ ...cellStyle, top: '12mm', left: '227mm', width: '31mm' }}>{b.term_duration}</div>

            {/* வாராந்த தவணைக் கட்டணம் - 2nd copy */}
            <div style={{ ...cellStyle, top: '12mm', left: '265mm', width: '31mm' }}>{b.installment}</div>
        </>
    );
}
