'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    UserPlus,
    Users,
    Calendar,
    Building2,
    ShieldCheck,
    ArrowRight,
    Search,
    Filter,
    X,
    ChevronDown,
    RefreshCw,
    Info,
    Zap,
    TrendingUp,
    Award,
    Pen,
    ArrowUpRight,
    Activity,
    Sparkles,
    Scale,
    Target
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    temporaryPromotionService,
    TemporaryPromotion,
    TemporaryPromotionStats,
    StaffForPromotion,
    RoleOption,
    BranchOption,
    CreateTemporaryPromotionData
} from '../../services/temporaryPromotion.service';
import BMSLoader from '../../components/common/BMSLoader';
import { colors } from '@/themes/colors';

type FilterStatus = 'all' | 'Active' | 'Completed' | 'Cancelled';

export default function TemporaryPromotionPage() {
    // State for promotions list
    const [promotions, setPromotions] = useState<TemporaryPromotion[]>([]);
    const [stats, setStats] = useState<TemporaryPromotionStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [staffList, setStaffList] = useState<StaffForPromotion[]>([]);
    const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<StaffForPromotion | null>(null);
    const [formData, setFormData] = useState<CreateTemporaryPromotionData>({
        user_id: 0,
        target_role_id: 0,
        target_branch_id: null,
        start_date: '',
        end_date: '',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Dropdown state
    const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
    const [staffFilter, setStaffFilter] = useState('');
    const staffRef = useRef<HTMLDivElement>(null);

    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState('');
    const roleRef = useRef<HTMLDivElement>(null);

    const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
    const [branchFilter, setBranchFilter] = useState('');
    const branchRef = useRef<HTMLDivElement>(null);

    // Handle outside clicks
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (staffRef.current && !staffRef.current.contains(event.target as Node)) {
                setStaffDropdownOpen(false);
            }
            if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
                setRoleDropdownOpen(false);
            }
            if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
                setBranchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cancel modal state
    const [cancelModal, setCancelModal] = useState<{ open: boolean; promotion: TemporaryPromotion | null }>({
        open: false,
        promotion: null
    });
    const [completeModal, setCompleteModal] = useState<{ open: boolean; promotion: TemporaryPromotion | null }>({
        open: false,
        promotion: null
    });
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [completing, setCompleting] = useState<number | null>(null);

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [promotionsData, statsData, staffData, branchesData] = await Promise.all([
                temporaryPromotionService.getAll(),
                temporaryPromotionService.getStats(),
                temporaryPromotionService.getAvailableStaff(),
                temporaryPromotionService.getBranches()
            ]);
            setPromotions(promotionsData);
            setStats(statsData);
            setStaffList(staffData);
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = (promotion: TemporaryPromotion) => {
        setCompleteModal({ open: true, promotion });
    };

    const confirmComplete = async () => {
        if (!completeModal.promotion) return;

        try {
            setCompleting(completeModal.promotion.id);
            await temporaryPromotionService.complete(completeModal.promotion.id);
            toast.success('Protocol finalized');
            setCompleteModal({ open: false, promotion: null });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to complete mission');
        } finally {
            setCompleting(null);
        }
    };

    const handleStaffSelect = async (staffId: string) => {
        const staff = staffList.find(s => s.staff_id === staffId);
        if (staff) {
            setSelectedStaff(staff);
            setFormData(prev => ({
                ...prev,
                user_id: staff.user_id,
                target_role_id: 0,
                target_branch_id: null
            }));

            try {
                const roles = await temporaryPromotionService.getAvailableRoles();
                setAvailableRoles(roles);
            } catch (error) {
                console.error('Error fetching roles:', error);
            }
        }
    };

    const handleEdit = (promotion: TemporaryPromotion) => {
        setEditId(promotion.id);

        const staff: StaffForPromotion = {
            staff_id: promotion.staff_id,
            staff_name: promotion.staff_name,
            user_id: promotion.user_id,
            branch_id: promotion.original_branch_id,
            branch_name: promotion.original_branch_name,
            current_role_id: promotion.original_role_id,
            current_role_name: promotion.original_role_name,
            current_role_hierarchy: 0,
            has_active_temp_promotion: true
        };

        setStaffList(prev => {
            if (prev.find(s => s.staff_id === staff.staff_id)) return prev;
            return [...prev, staff];
        });

        setSelectedStaff(staff);

        setFormData({
            user_id: promotion.user_id,
            target_role_id: promotion.target_role_id,
            target_branch_id: promotion.target_branch_id,
            start_date: formatDateForInput(promotion.start_date),
            end_date: formatDateForInput(promotion.end_date),
            reason: promotion.reason
        });

        const currentTargetRole: RoleOption = {
            id: promotion.target_role_id,
            name: promotion.target_role_name,
            display_name: promotion.target_role_name,
            level: '',
            hierarchy: 0
        };
        setAvailableRoles([currentTargetRole]);

        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.user_id || !formData.target_role_id) {
            toast.error('Required fields missing');
            return;
        }

        try {
            setSubmitting(true);

            if (editId) {
                await temporaryPromotionService.update(editId, formData);
                toast.success('Assignment updated');
            } else {
                await temporaryPromotionService.create(formData);
                toast.success('Protocol initiated');
            }

            setShowForm(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Execution failed');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditId(null);
        setSelectedStaff(null);
        setAvailableRoles([]);
        setFormData({
            user_id: 0,
            target_role_id: 0,
            target_branch_id: null,
            start_date: '',
            end_date: '',
            reason: ''
        });
    };

    const handleCancel = async () => {
        if (!cancelModal.promotion || cancelReason.length < 5) {
            toast.error('Cancellation reason required');
            return;
        }

        try {
            setCancelling(true);
            await temporaryPromotionService.cancel(cancelModal.promotion.id, cancelReason);
            toast.success('Protocol terminated');
            setCancelModal({ open: false, promotion: null });
            setCancelReason('');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Abort failed');
        } finally {
            setCancelling(false);
        }
    };

    const filteredPromotions = promotions.filter(p => {
        if (filterStatus !== 'all' && p.status !== filterStatus) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                p.staff_name.toLowerCase().includes(query) ||
                p.staff_id.toLowerCase().includes(query) ||
                p.target_role_name.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100/50 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                        Active
                    </span>
                );
            case 'Completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                        <CheckCircle2 size={12} />
                        Completed
                    </span>
                );
            case 'Cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                        <XCircle size={12} />
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) return match[1];
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-app-background">
                <BMSLoader message="Accessing Records..." size="large" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-[1500px] mx-auto min-h-screen relative overflow-hidden bg-app-background">

            {/* Ambient Lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.05] blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
            </div>

            {/* Premium Grounded Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border-default group">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${colors.indigo[500]}, ${colors.primary[600]})` }} />

                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                        style={{ background: `linear-gradient(135deg, ${colors.indigo[600]}, ${colors.primary[700]})` }}>
                        <Zap size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                            Tactical Promotions
                        </h1>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                            Temporary Role Elevation Protocol
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="group/btn relative px-6 py-3.5 bg-gray-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-x-2.5 overflow-hidden"
                >
                    <UserPlus size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">New Assignment</span>
                </button>
            </div>

            {/* Grounded Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Currently Active', value: stats.currently_active, icon: Clock, color: colors.primary[500] },
                        { label: 'Completed Log', value: stats.completed, icon: CheckCircle2, color: colors.primary[500] },
                        { label: 'Cancelled Log', value: stats.cancelled, icon: XCircle, color: colors.danger[500] },
                        { label: 'Registry History', value: stats.total, icon: Award, color: colors.indigo[500] }
                    ].map((stat, i) => (
                        <div key={i} className="bg-card/90 backdrop-blur-xl rounded-2xl p-5 border border-border-default shadow-md hover:shadow-lg transition-all border-l-4"
                            style={{ borderLeftColor: stat.color }}>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-text-muted font-bold text-[9px] uppercase tracking-widest">
                                        <stat.icon size={12} style={{ color: stat.color }} />
                                        {stat.label}
                                    </div>
                                    <div className="text-3xl font-black text-text-primary tracking-tighter">
                                        {stat.value}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column - Priority Focus */}
                <div className="lg:col-span-4 space-y-6">
                    <h2 className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 ml-2">
                        <Activity size={14} className="animate-pulse" />
                        Priority Focus
                    </h2>

                    <div className="space-y-4">
                        {promotions.filter(p => p.status === 'Active').slice(0, 3).map((promotion) => (
                            <div
                                key={promotion.id}
                                className="group relative overflow-hidden rounded-[2rem] p-6 text-white shadow-xl transition-all hover:scale-[1.02]"
                                style={{ background: `linear-gradient(135deg, ${colors.indigo[600]}, ${colors.primary[600]})` }}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Award size={80} />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-lg font-black border border-white/20">
                                            {promotion.staff_name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="px-2.5 py-1 bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                            DEPLOYED
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black tracking-tight uppercase mb-1">{promotion.staff_name}</h3>
                                        <div className="flex items-center gap-2.5 font-bold text-[9px] uppercase tracking-widest opacity-80">
                                            <span>{promotion.original_role_name}</span>
                                            <ArrowRight size={10} />
                                            <span className="bg-white/20 px-2 py-0.5 rounded-md text-white">{promotion.target_role_name}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
                                        <span>EXPIRING {formatDate(promotion.end_date)}</span>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-white"></div>
                                            <div className="w-1 h-1 rounded-full bg-white/50"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {promotions.filter(p => p.status === 'Active').length === 0 && (
                            <div className="p-12 border-2 border-dashed border-border-default bg-card/50 rounded-2xl text-center opacity-40">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted">Historical Log Terminal</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Registry Terminal */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="bg-card/50 backdrop-blur-xl p-1 rounded-2xl border border-border-default shadow-md inline-flex gap-1">
                            {(['all', 'Active', 'Completed'] as FilterStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    {status === 'all' ? 'All Registry' : status}
                                </button>
                            ))}
                        </div>

                        <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Search Protocol Registry..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-72 pl-10 pr-6 py-3 bg-card border border-border-default rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-card/70 backdrop-blur-xl rounded-[2rem] border border-border-default shadow-xl overflow-hidden relative">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-table-header">
                                    <tr className="border-b border-border-divider">
                                        <th className="pl-10 pr-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Asset Registry</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Elevation Path</th>
                                        <th className="px-4 py-6 text-[9px] font-black text-text-muted uppercase tracking-widest">Mission Window</th>
                                        <th className="px-10 py-6 text-center text-[9px] font-black text-text-muted uppercase tracking-widest">Decision Board</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-divider">
                                    {filteredPromotions.map((promotion) => (
                                        <tr key={promotion.id} className="group hover:bg-hover transition-colors">
                                            <td className="pl-10 pr-4 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-input flex items-center justify-center border border-border-default group-hover:scale-105 transition-transform">
                                                        <span className="text-xs font-black text-text-muted group-hover:text-primary-500 uppercase">{promotion.staff_name.charAt(0)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{promotion.staff_name}</p>
                                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{promotion.staff_id}</p>
                                                        <div className="pt-1.5">{getStatusBadge(promotion.status)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-8">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-text-muted uppercase line-through">{promotion.original_role_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <ArrowUpRight size={12} className="text-primary-500" />
                                                        <span className="text-[11px] font-black text-text-primary uppercase">{promotion.target_role_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-8">
                                                <div className="flex items-center gap-2 bg-input px-3 py-1.5 rounded-lg border border-border-default w-fit">
                                                    <Calendar size={12} className="text-text-muted" />
                                                    <p className="text-[10px] font-bold text-text-secondary uppercase tabular-nums">
                                                        {formatDate(promotion.end_date)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {promotion.status === 'Active' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleComplete(promotion)}
                                                                disabled={completing === promotion.id}
                                                                className="px-4 py-2 bg-primary-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2"
                                                            >
                                                                {completing === promotion.id ? (
                                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : <CheckCircle2 size={12} />}
                                                                Finalize
                                                            </button>
                                                            <button onClick={() => handleEdit(promotion)} className="p-2 text-text-muted hover:text-primary-600 transition-colors"><Pen size={18} /></button>
                                                            <button onClick={() => setCancelModal({ open: true, promotion })} className="p-2 text-text-muted hover:text-rose-500 transition-colors"><X size={18} /></button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-text-muted uppercase opacity-40">Archived Registry</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Protocol Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-border-divider flex items-center justify-between relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500" />
                            <div>
                                <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                                    {editId ? 'Modify Parameters' : 'Initiate Sector Deployment'}
                                </h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Protocol Registry Log Entry</p>
                            </div>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="w-10 h-10 bg-input rounded-xl flex items-center justify-center text-text-muted hover:text-rose-500 transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Target Asset</label>
                                    <div className="relative" ref={staffRef}>
                                        <button
                                            type="button"
                                            onClick={() => { setStaffDropdownOpen(!staffDropdownOpen); setStaffFilter(''); }}
                                            disabled={!!editId}
                                            className="w-full flex items-center justify-between px-5 py-3.5 bg-input border border-border-default rounded-xl text-[11px] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 outline-none disabled:opacity-50 shadow-sm cursor-pointer transition-all"
                                        >
                                            <span className={selectedStaff ? 'text-text-primary' : 'text-text-muted'}>
                                                {selectedStaff ? `${selectedStaff.staff_name} (${selectedStaff.staff_id})` : 'Select Asset Registry Entry...'}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${staffDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {staffDropdownOpen && (
                                            <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                <div className="px-4 py-3 border-b border-border-divider">
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl border border-border-divider">
                                                        <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={staffFilter}
                                                            onChange={e => setStaffFilter(e.target.value)}
                                                            placeholder="FILTER STAFF..."
                                                            className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                                    {staffList
                                                        .filter(s =>
                                                            (!s.has_active_temp_promotion || (selectedStaff?.staff_id === s.staff_id)) &&
                                                            (s.staff_name.toLowerCase().includes(staffFilter.toLowerCase()) ||
                                                                s.staff_id.toLowerCase().includes(staffFilter.toLowerCase()))
                                                        )
                                                        .map(s => (
                                                            <button
                                                                key={s.staff_id}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleStaffSelect(s.staff_id);
                                                                    setStaffDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${selectedStaff?.staff_id === s.staff_id ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                            >
                                                                {s.staff_name} ({s.staff_id})
                                                            </button>
                                                        ))
                                                    }
                                                    {staffList.filter(s =>
                                                        (!s.has_active_temp_promotion || (selectedStaff?.staff_id === s.staff_id)) &&
                                                        (s.staff_name.toLowerCase().includes(staffFilter.toLowerCase()) ||
                                                            s.staff_id.toLowerCase().includes(staffFilter.toLowerCase()))
                                                    ).length === 0 && (
                                                            <div className="px-5 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                                No staff found
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Target Designation</label>
                                    <div className="relative" ref={roleRef}>
                                        <button
                                            type="button"
                                            onClick={() => { setRoleDropdownOpen(!roleDropdownOpen); setRoleFilter(''); }}
                                            className="w-full flex items-center justify-between px-5 py-3.5 bg-input border border-border-default rounded-xl text-[11px] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 outline-none shadow-sm cursor-pointer transition-all"
                                        >
                                            <span className={formData.target_role_id ? 'text-text-primary' : 'text-text-muted'}>
                                                {formData.target_role_id
                                                    ? (availableRoles.find(r => r.id === formData.target_role_id)?.display_name || availableRoles.find(r => r.id === formData.target_role_id)?.name)
                                                    : 'Select Mission Role...'}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {roleDropdownOpen && (
                                            <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                <div className="px-4 py-3 border-b border-border-divider">
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl border border-border-divider">
                                                        <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={roleFilter}
                                                            onChange={e => setRoleFilter(e.target.value)}
                                                            placeholder="FILTER ROLES..."
                                                            className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                                    {availableRoles
                                                        .filter(r => 
                                                            (r.display_name || r.name).toLowerCase().includes(roleFilter.toLowerCase()) &&
                                                            r.id !== selectedStaff?.current_role_id
                                                        )
                                                        .map(r => (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, target_role_id: Number(r.id) }));
                                                                    setRoleDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${formData.target_role_id === r.id ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                            >
                                                                {r.display_name || r.name}
                                                            </button>
                                                        ))
                                                    }
                                                    {availableRoles.filter(r => (r.display_name || r.name).toLowerCase().includes(roleFilter.toLowerCase())).length === 0 && (
                                                        <div className="px-5 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                            No roles found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Sector Assignment</label>
                                    <div className="relative" ref={branchRef}>
                                        <button
                                            type="button"
                                            onClick={() => { setBranchDropdownOpen(!branchDropdownOpen); setBranchFilter(''); }}
                                            className="w-full flex items-center justify-between px-5 py-3.5 bg-input border border-border-default rounded-xl text-[11px] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 outline-none shadow-sm cursor-pointer transition-all"
                                        >
                                            <span className={formData.target_branch_id ? 'text-text-primary' : 'text-text-muted'}>
                                                {formData.target_branch_id
                                                    ? branches.find(b => b.id === formData.target_branch_id)?.name
                                                    : 'Remain in Primary Sector'}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${branchDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {branchDropdownOpen && (
                                            <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                <div className="px-4 py-3 border-b border-border-divider">
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl border border-border-divider">
                                                        <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={branchFilter}
                                                            onChange={e => setBranchFilter(e.target.value)}
                                                            placeholder="FILTER BRANCHES..."
                                                            className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, target_branch_id: null }));
                                                            setBranchDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${formData.target_branch_id === null ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                    >
                                                        Remain in Primary Sector
                                                    </button>
                                                    {branches
                                                        .filter(b => b.name.toLowerCase().includes(branchFilter.toLowerCase()))
                                                        .map(b => (
                                                            <button
                                                                key={b.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData(prev => ({ ...prev, target_branch_id: Number(b.id) }));
                                                                    setBranchDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${formData.target_branch_id === b.id ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                            >
                                                                {b.name}
                                                            </button>
                                                        ))
                                                    }
                                                    {branches.filter(b => b.name.toLowerCase().includes(branchFilter.toLowerCase())).length === 0 && (
                                                        <div className="px-5 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                            No branches found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Launch Date</label>
                                    <input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-5 py-3.5 bg-input border border-border-default rounded-xl text-[11px] font-bold text-text-primary outline-none shadow-sm" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Terminal Date</label>
                                    <input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} className="w-full px-5 py-3.5 bg-input border border-border-default rounded-xl text-[11px] font-bold text-text-primary outline-none shadow-sm" required />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Mission Rationale</label>
                                    <textarea value={formData.reason} onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))} rows={4} className="w-full px-5 py-4 bg-input border border-border-default rounded-xl text-xs font-semibold text-text-primary outline-none resize-none shadow-sm placeholder:text-text-muted" required />
                                </div>
                            </div>
                        </form>

                        <div className="p-8 border-t border-border-divider bg-input/30 flex items-center justify-between">
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[9px] font-black text-text-muted uppercase tracking-widest">Abort Protocol</button>
                            <button onClick={handleSubmit} disabled={submitting} className="px-10 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50">
                                {submitting ? 'EXECUTING...' : 'CONFIRM ASSIGNMENT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decision Modals */}
            {(cancelModal.open || completeModal.open) && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card rounded-[1.5rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                        <div className={`p-8 ${cancelModal.open ? 'bg-rose-500/10' : 'bg-primary-500/10'}`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${cancelModal.open ? 'bg-rose-600' : 'bg-primary-600'}`}>
                                    {cancelModal.open ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <h3 className="text-xl font-black text-text-primary tracking-tight uppercase leading-none">
                                    {cancelModal.open ? 'Terminal Abort' : 'Finalize Mission'}
                                </h3>
                            </div>
                            <div className="bg-card rounded-xl p-5 border border-border-default shadow-sm text-center">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Target Asset Redirect</p>
                                <p className="text-lg font-black text-text-primary uppercase">{(cancelModal.promotion || completeModal.promotion)?.staff_name}</p>
                            </div>

                            {cancelModal.open && (
                                <div className="mt-6 space-y-2 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[9px] font-black text-rose-600 tracking-widest ml-1 uppercase">Cancellation Rationale</label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        rows={3}
                                        placeholder="Min. 5 characters required for terminal abort..."
                                        className="w-full px-5 py-4 bg-white/50 dark:bg-black/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs font-semibold text-text-primary px-5 py-4 outline-none resize-none shadow-sm focus:ring-4 focus:ring-rose-500/5 transition-all"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-8 flex gap-3">
                            <button
                                onClick={() => {
                                    setCancelModal({ open: false, promotion: null });
                                    setCompleteModal({ open: false, promotion: null });
                                    setCancelReason('');
                                }}
                                className="flex-1 px-6 py-4 bg-input text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-hover hover:text-text-primary transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={cancelModal.open ? handleCancel : confirmComplete}
                                disabled={cancelling || (cancelModal.open && cancelReason.length < 5)}
                                className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${cancelModal.open ? 'bg-rose-600' : 'bg-primary-600'} disabled:opacity-50 transition-all active:scale-95`}
                            >
                                {cancelling ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        EXECUTING...
                                    </div>
                                ) : 'CONFIRM'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
