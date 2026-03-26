'use client'

import { Building2, MapPin, Phone, Users, ChevronRight, Hash, SignalHigh, Info } from 'lucide-react';
import { BranchSummary } from '@/types/dashboard.types';
import { colors } from '@/themes/colors';

interface BranchListProps {
    branches: BranchSummary[];
    onBranchClick: (branchId: number) => void;
    searchQuery: string;
}

export default function BranchList({ branches, onBranchClick, searchQuery }: BranchListProps) {
    const filteredBranches = branches.filter(branch =>
        branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.branch_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.manager_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 gap-4">
            {filteredBranches.map((branch) => (
                <div
                    key={branch.id}
                    onClick={() => onBranchClick(branch.id)}
                    className="group relative bg-card rounded-[0.5rem] border border-border-default p-4 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-1"
                >
                    {/* Background Visual Depth */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-700" />

                    <div className="relative z-10">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})`,
                                        boxShadow: `0 8px 16px ${colors.primary[500]}25`
                                    }}
                                >
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-black text-text-primary tracking-tight uppercase group-hover:text-primary-600 transition-colors">
                                            {branch.branch_name}
                                        </h3>
                                        <div className="px-2 py-0.5 bg-input rounded-md border border-border-default flex items-center gap-1.5 opacity-60">
                                            <Hash className="w-2.5 h-2.5 text-text-muted" />
                                            <span className="text-[9px] font-black text-text-muted tracking-widest">{branch.branch_code}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-primary-500/50" />
                                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none mt-0.5">
                                            {branch.location}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-500/10 rounded-full border border-primary-100/50 dark:border-primary-500/20">
                                    <SignalHigh className="w-3 h-3 text-primary-500 dark:text-primary-400" />
                                    <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Active Status</span>
                                </div>
                                <div className="w-1 h-3 rounded-full bg-border-divider group-hover:bg-primary-400 group-hover:h-8 transition-all duration-700" />
                            </div>
                        </div>

                        {/* Mid Section - Managerial Details */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-input p-3 rounded-xl border border-border-default group-hover:bg-card transition-colors">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Users className="w-3 h-3 text-primary-400" />
                                    Management Header
                                </p>
                                <p className="text-sm font-black text-text-primary tracking-tight">{branch.manager_name}</p>
                            </div>
                            <div className="bg-input p-3 rounded-xl border border-border-default group-hover:bg-card transition-colors">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-primary-400" />
                                    Direct Registry
                                </p>
                                <p className="text-sm font-black text-text-primary tracking-tight font-mono">{branch.phone || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Metrics Section */}
                        <div className="flex items-center justify-between pt-4 border-t border-border-divider">
                            <div className="flex gap-6 items-center">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Entity Personnel</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-black text-text-primary tabular-nums">{branch.total_staff}</span>
                                        <span className="text-[9px] font-bold text-text-muted uppercase">Staff</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-border-divider" />
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Lobby Queue</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-lg font-black text-orange-600 dark:text-orange-400 tabular-nums">{branch.pending_requests_count}</span>
                                        <span className="text-[9px] font-bold text-orange-400 dark:text-orange-300 uppercase">Alerts</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest">Protocol</span>
                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">View Performance</span>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-primary-600 shadow-sm border border-border-default group-hover:border-primary-600 group-hover:translate-x-1"
                                >
                                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {filteredBranches.length === 0 && (
                <div className="lg:col-span-2 py-32 flex flex-col items-center justify-center bg-card rounded-[3rem] border border-border-default shadow-sm border-dashed">
                    <div className="p-8 bg-input rounded-full mb-6">
                        <Building2 className="w-16 h-16 text-text-muted" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">No matching branches</h3>
                        <p className="text-sm text-text-muted font-medium mt-2">The specified entity could not be located in the current registry.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
