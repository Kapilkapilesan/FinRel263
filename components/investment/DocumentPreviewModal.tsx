'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, UserPlus, FileText } from 'lucide-react';
import { Investment } from '../../types/investment.types';
import { InvestmentAgreementDocument } from './InvestmentAgreementDocument';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment;
}

export function DocumentPreviewModal({ isOpen, onClose, investment }: Props) {
    const [witnesses, setWitnesses] = useState(investment.witnesses && investment.witnesses.length >= 2 ? investment.witnesses : [
        { name: '', nic: '', address: '' },
        { name: '', nic: '', address: '' }
    ]);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const windowUrl = '';
        const windowName = 'PrintWindow';
        const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');

        if (printWindow) {
            printWindow.document.write('<html><head><title>Investment Agreement</title>');
            // Include Tailwind or other styles if needed, but the component has internal style tag
            printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const updateWitness = (index: number, field: string, value: string) => {
        const newWitnesses = [...witnesses];
        newWitnesses[index] = { ...newWitnesses[index], [field]: value };
        setWitnesses(newWitnesses);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] flex flex-col shadow-2xl animate-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-50 rounded-xl">
                            <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Document Preview</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Investment Agreement Generation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Controls Sidebar */}
                    <div className="w-full lg:w-80 border-r border-gray-100 p-6 flex flex-col gap-6 bg-gray-50/30 overflow-y-auto">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <UserPlus className="w-3.5 h-3.5" /> Witness Registry
                            </h3>
                            {witnesses.map((w, i) => (
                                <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest">Witness {i + 1}</p>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={w.name}
                                        onChange={(e) => updateWitness(i, 'name', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="NIC / Identifier"
                                        className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        value={w.nic}
                                        onChange={(e) => updateWitness(i, 'nic', e.target.value)}
                                    />
                                    <textarea
                                        placeholder="Address"
                                        rows={2}
                                        className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border-none rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                                        value={w.address}
                                        onChange={(e) => updateWitness(i, 'address', e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-100">
                            <button
                                onClick={handlePrint}
                                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Printer className="w-5 h-5" />
                                Initiate Print
                            </button>
                        </div>
                    </div>

                    {/* Document Viewport */}
                    <div className="flex-1 bg-gray-100 p-8 overflow-y-auto custom-scrollbar flex justify-center">
                        <div className="bg-white shadow-2xl origin-top transform scale-[0.9] lg:scale-100" ref={printRef}>
                            <InvestmentAgreementDocument investment={investment} witnesses={witnesses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
