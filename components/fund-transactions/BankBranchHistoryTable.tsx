import React, { useState } from 'react';
import { 
    Building2, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Calendar, 
    Search,
    Filter,
    FileText,
    User,
    ShieldCheck,
    MoreVertical
} from 'lucide-react';
import { BankBranchActivity } from '../../services/bankBranch.service';
import { format } from 'date-fns';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { API_BASE_URL } from '../../services/api.config';

interface BankBranchHistoryTableProps {
    records: BankBranchActivity[];
}

export const BankBranchHistoryTable: React.FC<BankBranchHistoryTableProps> = ({ records }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
    const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string } | null>(null);

    const filteredRecords = records.filter(record => {
        const matchesSearch = 
            record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.branch?.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.creator?.staff?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = filterType === 'all' || record.type === filterType;
        
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Table Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 pb-2">
                <div className="relative group flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by description, ref, branch or staff..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-primary-500 focus:bg-card outline-none transition-all text-sm font-medium shadow-inner"
                    />
                </div>
                
                <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-2xl border border-border-default/50 self-end md:self-auto">
                    {(['all', 'deposit', 'withdrawal'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type 
                                ? 'bg-card text-primary-600 shadow-sm border border-border-default' 
                                : 'text-text-muted hover:text-text-primary'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-card rounded-[2rem] border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-default bg-muted/5">
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Transaction</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Branch & Staff</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em]">Description</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] text-right">Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted tracking-[0.2em] text-center">Status</th>
                                <th className="px-6 py-5 text-right w-16 text-text-muted"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/50">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Building2 size={48} />
                                            <p className="font-black text-sm uppercase tracking-widest">No matching activities found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-primary-500/[0.02] transition-colors group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                                                    record.type === 'deposit' 
                                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                                        : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                    {record.type === 'deposit' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-text-primary uppercase tracking-tight">
                                                        {format(new Date(record.date), 'MMM dd, yyyy')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-70">
                                                        ID: #{record.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-text-primary uppercase">{record.branch?.branch_name}</span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase">
                                                    <User size={10} />
                                                    {record.creator?.staff?.full_name || record.creator?.name || 'Automated'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5 max-w-xs">
                                                <span className="text-xs text-text-secondary font-medium leading-relaxed line-clamp-1">{record.description || 'No description'}</span>
                                                {record.receipt_number && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/50 w-fit">
                                                        <FileText size={10} className="text-text-muted" />
                                                        <span className="text-[9px] font-black text-text-muted uppercase">Ref: {record.receipt_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right whitespace-nowrap">
                                            <div className="flex flex-col items-end">
                                                <span className="text-base font-black text-primary-500 tracking-tight">
                                                    LKR {Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className="text-[9px] font-bold text-text-muted uppercase opacity-40">Truncation Value</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center whitespace-nowrap">
                                            <span className={`
                                                uppercase text-[9px] font-black tracking-widest px-3 py-1 rounded-full border-none shadow-sm inline-block
                                                ${record.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                  record.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 
                                                  'bg-amber-500/10 text-amber-500'}
                                            `}>
                                                {record.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {record.document_path && (
                                                    <button 
                                                        onClick={() => setPreviewDoc({
                                                            url: `${API_BASE_URL.replace('/api', '')}/storage/${record.document_path}`,
                                                            type: record.type === 'deposit' ? 'Bank Deposit Receipt' : 'Bank Withdrawal Document'
                                                        })}
                                                        className="p-2 rounded-xl bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                                                        title="View Attachment"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                )}
                                                <button className="p-2 rounded-xl bg-muted/30 text-text-muted hover:bg-muted/50 transition-all shadow-sm">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Legend / Summary */}
            <div className="flex items-center justify-between px-8 py-4 bg-primary-500/[0.03] rounded-3xl border border-primary-500/10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Deposits: {filteredRecords.filter(r => r.type === 'deposit').length}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Withdrawals: {filteredRecords.filter(r => r.type === 'withdrawal').length}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-text-primary uppercase tracking-tight">Total Volume:</span>
                    <span className="text-sm font-black text-primary-600 tracking-tight">
                        LKR {filteredRecords.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
            {/* Document Preview Modal */}
            {previewDoc && (
                <DocumentPreviewModal 
                    url={previewDoc.url}
                    type={previewDoc.type}
                    onClose={() => setPreviewDoc(null)}
                />
            )}
        </div>
    );
};
