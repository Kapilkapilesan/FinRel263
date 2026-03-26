'use client';

import React, { useState } from 'react';
import {
    X,
    Building2,
    Users,
    UserCircle,
    MapPin,
    Phone,
    Mail,
    Activity,
    Users2,
    Briefcase,
    ChevronRight,
    TrendingUp,
    Shield,
    Calendar,
    ArrowUpRight,
    Info,
    LayoutDashboard
} from 'lucide-react';
import { Branch } from '../../types/branch.types';
import { Staff } from '../../types/staff.types';
import { Customer } from '../../types/customer.types';
import { Loan } from '../../types/loan.types';
import { colors } from '@/themes/colors';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    branch: Branch | null;
}

type TabType = 'overview' | 'staff' | 'customers' | 'loans';

export function BranchDetailModal({ isOpen, onClose, branch }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    if (!isOpen || !branch) return null;

    const stats = [
        { label: 'Total Staff', value: branch.staffs?.length || 0, icon: Users2, color: { color: colors.primary[600] }, bg: { backgroundColor: colors.primary[50] } },
        { label: 'Total Customers', value: branch.customers?.length || 0, icon: Users, color: { color: colors.primary[600] }, bg: { backgroundColor: colors.primary[50] } },
        { label: 'Active Loans', value: branch.loans?.filter(l => l.status.toLowerCase() === 'active').length || 0, icon: Activity, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card rounded-3xl max-w-5xl w-full h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                {/* Header Section */}
                <div className="relative p-8" style={{ background: `linear-gradient(to bottom right, ${colors.primary[600]}, ${colors.primary[800]})` }}>
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all group z-10"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="flex items-start gap-6">
                        <div className="p-5 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-[10px] font-black tracking-widest uppercase font-mono border border-white/10">
                                    {branch.branch_id}
                                </span>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${branch.status.toLowerCase() === 'active'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                    }`}>
                                    <Activity className="w-3 h-3" />
                                    {branch.status}
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight leading-none">
                                {branch.branch_name}
                            </h2>
                            <div className="flex items-center gap-4 text-white/80">
                                {/* <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" style={{ color: colors.primary[200] }} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{branch.location || 'N/A'}</span>
                                </div> */}
                                <div className="h-3 w-px bg-white/20" />
                                <div className="flex items-center gap-1.5">
                                    <UserCircle className="w-4 h-4" style={{ color: colors.primary[200] }} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Manager: {branch.manager_name || 'Not Assigned'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-1 mt-8">
                        {(['overview', 'staff', 'customers', 'loans'] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                style={activeTab === tab ? { color: colors.primary[600] } : {}}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-app-background p-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-6">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="bg-card p-6 rounded-3xl shadow-sm border border-border-default flex items-center gap-5 group hover:shadow-md transition-all">
                                        <div className={`p-4 rounded-2xl transition-colors group-hover:scale-110 duration-300 ${!stat.label.includes('Total') ? stat.bg : ''}`} style={stat.label.includes('Total') ? (stat.bg as React.CSSProperties) : {}}>
                                            <stat.icon className={`w-6 h-6 ${!stat.label.includes('Total') ? stat.color : ''}`} style={stat.label.includes('Total') ? (stat.color as React.CSSProperties) : {}} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-2xl font-black text-text-primary leading-none">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                {/* Contact & Location Info */}
                                <div className="col-span-2 space-y-6">
                                    <div className="bg-card p-8 rounded-3xl shadow-sm border border-border-default">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                                                <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Branch Information</h3>
                                        </div>

                                        <div className="space-y-6">
                                            {[
                                                { label: 'Full Address', value: branch.address || 'N/A', icon: MapPin },
                                                { label: 'Region', value: `${branch.province || ''}, ${branch.district || ''}`, icon: MapPin },
                                                { label: 'Primary Phone', value: branch.phone || 'N/A', icon: Phone },
                                                { label: 'Email Address', value: branch.email || 'N/A', icon: Mail },
                                                { label: 'Postal Code', value: branch.postal_code || 'N/A', icon: Shield },
                                                { label: 'Creation Date', value: branch.created_at ? new Date(branch.created_at).toLocaleDateString() : 'N/A', icon: Calendar },
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className="p-2.5 bg-input rounded-xl h-fit">
                                                        <item.icon className="w-4 h-4 text-text-muted" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-tighter mb-0.5">{item.label}</p>
                                                        <p className="text-sm font-black text-text-primary leading-tight break-words">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions / Current Manager */}
                                <div className="space-y-6">
                                    <div className="p-8 rounded-3xl text-white shadow-xl shadow-blue-100" style={{ backgroundColor: colors.primary[600] }}>
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xs font-black uppercase tracking-widest opacity-70">Current Management</h3>
                                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                                                <Briefcase className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-black">
                                                {branch.manager_name?.[0] || 'M'}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg leading-tight">{branch.manager_name || 'Not Assigned'}</p>
                                                <p className="text-xs font-bold text-white/60 uppercase tracking-wider mt-1">Branch Manager</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && (
                        <div className="bg-card rounded-3xl shadow-sm border border-border-default overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-table-header border-b border-border-divider">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Employee</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Designation</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {branch.staffs?.map((staff: Staff) => (
                                        <tr key={staff.staff_id} className="hover:bg-table-row-hover transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center font-black text-sm capitalize">
                                                        {staff.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-text-primary text-sm">{staff.full_name}</p>
                                                        <p className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-tighter">{staff.staff_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="px-3 py-1 bg-input text-text-muted rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                    {staff.work_info?.designation || 'Staff'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-text-secondary">
                                                {staff.contact_no}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!branch.staffs || branch.staffs.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <Users2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No staff members assigned</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="bg-card rounded-3xl shadow-sm border border-border-default overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-table-header border-b border-border-divider">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">NIC</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {branch.customers?.map((customer: Customer) => (
                                        <tr key={customer.id} className="hover:bg-table-row-hover transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center font-black text-sm capitalize">
                                                        {customer.full_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-text-primary text-sm">{customer.full_name}</p>
                                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{customer.mobile_no_1}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-gray-600 font-mono">
                                                {customer.customer_code}
                                            </td>
                                            <td className="px-8 py-4 text-xs font-bold text-gray-600 truncate max-w-[200px]">
                                                {customer.city}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!branch.customers || branch.customers.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No customers registered</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'loans' && (
                        <div className="bg-card rounded-3xl shadow-sm border border-border-default overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-table-header border-b border-border-divider">
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Loan ID</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-text-muted uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {branch.loans?.map((loan: Loan) => (
                                        <tr key={loan.id} className="hover:bg-table-row-hover transition-colors">
                                            <td className="px-8 py-4">
                                                <span className="font-black text-text-primary text-sm">{loan.loan_id}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="font-black text-text-primary text-sm">LKR {Number(loan.approved_amount).toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${loan.status.toString().toLowerCase() === 'active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-input text-text-muted'
                                                    }`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!branch.loans || branch.loans.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No active loans found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-6 bg-card border-t border-border-divider flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                            <LayoutDashboard className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                            Official Branch System Record of  {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
