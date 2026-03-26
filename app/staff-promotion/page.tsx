'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    TrendingUp,
    DollarSign,
    History,
    Send,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ChevronRight,
    User,
    Briefcase,
    Calendar,
    ArrowUpRight,
    FileText,
    Lightbulb,
    Target,
    Activity,
    Award,
    Sparkles,
    ShieldCheck,
    Search,
    ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    promotionService,
    salaryIncrementService,
    Role,
    PromotionRequest,
    SalaryIncrementRequest
} from '../../services/promotion.service';
import { authService, User as AuthUser } from '../../services/auth.service';
import { colors } from '@/themes/colors';

type TabType = 'promotion' | 'salary-increment';

export default function StaffPromotionPage() {
    const [activeTab, setActiveTab] = useState<TabType>('promotion');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    const canViewPromotion = authService.hasPermission('promotions.view') || authService.hasPermission('promotions.create');
    const canViewIncrement = authService.hasPermission('salary_increments.view') || authService.hasPermission('salary_increments.create');

    useEffect(() => {
        if (!canViewPromotion && canViewIncrement && activeTab === 'promotion') {
            setActiveTab('salary-increment');
        }
    }, [canViewPromotion, canViewIncrement]);

    // Promotion state
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [currentRole, setCurrentRole] = useState<Role | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [promotionReason, setPromotionReason] = useState('');
    const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
    const [gradeFilter, setGradeFilter] = useState('');
    const gradeDropdownRef = useRef<HTMLDivElement>(null);

    // Close grade dropdown on outside click
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(e.target as Node)) {
                setGradeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);
    const [promotionHistory, setPromotionHistory] = useState<PromotionRequest[]>([]);
    const [showPromotionHistory, setShowPromotionHistory] = useState(false);

    // Salary Increment state
    const [currentSalary, setCurrentSalary] = useState<number>(0);
    const [currentRoleDisplay, setCurrentRoleDisplay] = useState<string>('');
    const [department, setDepartment] = useState<string>('');
    const [requestedAmount, setRequestedAmount] = useState<string>('');
    const [incrementReason, setIncrementReason] = useState('');
    const [incrementHistory, setSalaryIncrementHistory] = useState<SalaryIncrementRequest[]>([]);
    const [showIncrementHistory, setShowIncrementHistory] = useState(false);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        fetchCurrentSalary();
        if (activeTab === 'promotion') {
            fetchAvailableRoles();
        }
    }, [activeTab]);

    const fetchAvailableRoles = async () => {
        try {
            setLoading(true);
            const { roles, current_role } = await promotionService.getAvailableRoles();
            setAvailableRoles(roles);
            setCurrentRole(current_role);
        } catch (error) {
            console.error('Error fetching roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentSalary = async () => {
        try {
            setLoading(true);
            const data = await salaryIncrementService.getCurrentSalary();
            setCurrentSalary(Number(data.current_salary));
            setCurrentRoleDisplay(data.role_display || '');
            setDepartment(data.department || '');
        } catch (error) {
            console.error('Error fetching salary:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPromotionHistory = async () => {
        try {
            setLoading(true);
            const history = await promotionService.getMyHistory();
            setPromotionHistory(history);
            setShowPromotionHistory(true);
        } catch (error) {
            console.error('Error fetching promotion history:', error);
            toast.error('Failed to load promotion history');
        } finally {
            setLoading(false);
        }
    };

    const fetchIncrementHistory = async () => {
        try {
            setLoading(true);
            const history = await salaryIncrementService.getMyHistory();
            setSalaryIncrementHistory(history);
            setShowIncrementHistory(true);
        } catch (error) {
            console.error('Error fetching increment history:', error);
            toast.error('Failed to load increment history');
        } finally {
            setLoading(false);
        }
    };

    const handlePromotionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRoleId) {
            toast.error('Please select a role to request promotion');
            return;
        }

        if (promotionReason.length < 10) {
            toast.error('Please provide a detailed reason (at least 10 characters)');
            return;
        }

        try {
            setLoading(true);
            await promotionService.createRequest({
                requested_role_id: selectedRoleId,
                reason: promotionReason
            });
            toast.success('Promotion request submitted successfully!');
            setSelectedRoleId(null);
            setPromotionReason('');
            fetchAvailableRoles();
        } catch (error: any) {
            let errorMessage = 'Failed to submit promotion request';

            // Handle specific error cases
            if (error.response?.data?.message) {
                const backendMessage = error.response.data.message.toLowerCase();

                if (backendMessage.includes('pending') || backendMessage.includes('already exists')) {
                    errorMessage = 'You already have a pending promotion request. Please wait for the current request to be approved or rejected before submitting a new one.';
                } else if (backendMessage.includes('permission')) {
                    errorMessage = 'You do not have permission to submit promotion requests. Please contact your administrator.';
                } else if (backendMessage.includes('role') || backendMessage.includes('invalid')) {
                    errorMessage = 'Invalid role selection. Please select a valid target role.';
                } else if (backendMessage.includes('frequency') || backendMessage.includes('limit')) {
                    errorMessage = 'You have reached the limit for promotion requests. Please wait before submitting another request.';
                } else {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleIncrementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(requestedAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid increment amount');
            return;
        }

        if (incrementReason.length < 10) {
            toast.error('Please provide a detailed reason (at least 10 characters)');
            return;
        }

        try {
            setLoading(true);
            await salaryIncrementService.createRequest({
                requested_amount: amount,
                reason: incrementReason
            });
            toast.success('Salary increment request submitted successfully!');
            setRequestedAmount('');
            setIncrementReason('');
            fetchCurrentSalary();
        } catch (error: any) {
            let errorMessage = 'Failed to submit increment request';

            // Handle specific error cases
            if (error.response?.data?.message) {
                const backendMessage = error.response.data.message.toLowerCase();

                if (backendMessage.includes('pending') || backendMessage.includes('already exists')) {
                    errorMessage = 'You already have a pending increment request. Please wait for the current request to be approved or rejected before submitting a new one.';
                } else if (backendMessage.includes('permission')) {
                    errorMessage = 'You do not have permission to submit increment requests. Please contact your administrator.';
                } else if (backendMessage.includes('amount') || backendMessage.includes('invalid')) {
                    errorMessage = 'Invalid increment amount. Please enter a valid amount within the allowed range.';
                } else if (backendMessage.includes('frequency') || backendMessage.includes('limit')) {
                    errorMessage = 'You have reached the limit for increment requests. Please wait before submitting another request.';
                } else {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            case 'Approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-600 border border-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                );
            case 'Rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-100 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20">
                        {status}
                    </span>
                );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };


    return (
        <div className="min-h-screen relative overflow-hidden bg-app-background">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full opacity-[0.07] blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${colors.primary[500]}, transparent)` }}
                />
            </div>

            <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/90 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-border-default relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: `linear-gradient(to bottom, ${colors.primary[500]}, ${colors.indigo[600]})` }} />

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.indigo[900]})` }}>
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase mb-1">
                                Career Path
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Target className="w-3 h-3 text-primary-500" />
                                    Growth & Compensation
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={activeTab === 'promotion' ? fetchPromotionHistory : fetchIncrementHistory}
                        className="group/btn relative px-6 py-3 bg-card border border-border-default text-text-primary rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 hover:bg-hover"
                    >
                        <div className="relative z-10 flex items-center gap-2">
                            <History className="w-4 h-4 text-primary-500 group-hover/btn:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">History Log</span>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Profile */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card/90 backdrop-blur-xl rounded-[2rem] border border-border-default shadow-xl p-8 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ background: `linear-gradient(to right, ${colors.primary[500]}, ${colors.indigo[600]})` }} />

                            <div className="relative inline-flex mb-6">
                                <div className="w-24 h-24 rounded-[1.5rem] bg-gray-50 flex items-center justify-center ring-4 ring-white shadow-lg overflow-hidden relative z-10">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-primary-500">{user?.name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 border-4 border-card rounded-full shadow-md flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">{user?.name || 'Authorized User'}</h2>
                            <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-2">{department || 'OPERATIONS DIVISION'}</p>

                            <div className="mt-8 pt-6 border-t border-gray-50 space-y-4 text-left">
                                {[
                                    { label: 'Assignment Level', value: currentRoleDisplay || 'STAFF GRADE', icon: Briefcase, color: 'primary' },
                                    { label: 'Active Compensation', value: formatCurrency(currentSalary), icon: DollarSign, color: 'primary' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className={`w-9 h-9 rounded-xl bg-input flex items-center justify-center shadow-sm`}>
                                            <item.icon className="w-4.5 h-4.5 text-text-muted" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">{item.label}</p>
                                            <p className="text-sm font-black text-text-primary">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Growth Intelligence */}
                        {/* <div className="bg-gray-900 rounded-[1.5rem] p-6 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Lightbulb size={60} className="text-white" />
                            </div>
                            <h4 className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest mb-3">
                                <Sparkles size={14} className="text-primary-400" />
                                Growth Intelligence
                            </h4>
                            <p className="text-gray-400 text-[10px] leading-relaxed font-semibold uppercase tracking-wider">
                                {activeTab === 'promotion'
                                    ? "Leverage your leadership KPIs to maximize role elevation success probability."
                                    : "Focus on operational efficiency indices and additional division-level responsibilities."}
                            </p>
                        </div> */}
                    </div>

                    {/* Right Column: Form */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-card/50 backdrop-blur-xl p-1.5 rounded-2xl border border-border-default shadow-md inline-flex gap-1.5">
                            {[
                                { id: 'promotion', label: 'Promotion', icon: Briefcase, visible: canViewPromotion },
                                { id: 'salary-increment', label: 'Increment', icon: DollarSign, visible: canViewIncrement }
                            ].filter(t => t.visible).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                        ? 'bg-card text-primary-600 shadow-sm border border-border-divider'
                                        : 'text-text-muted hover:text-text-secondary'
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-300'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-card rounded-[2rem] border border-border-default shadow-xl overflow-hidden relative">
                            <div className="px-8 py-8 border-b border-border-divider flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                                    style={{
                                        background: activeTab === 'promotion'
                                            ? `linear-gradient(135deg, ${colors.primary[600]}, ${colors.indigo[900]})`
                                            : `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})`
                                    }}>
                                    {activeTab === 'promotion' ? <Award className="w-6 h-6 text-white" /> : <Activity className="w-6 h-6 text-white" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                                        {activeTab === 'promotion' ? 'Request Promotion' : 'Request Increment'}
                                    </h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Institutional Registry Entry</p>
                                </div>
                            </div>

                            <form onSubmit={activeTab === 'promotion' ? handlePromotionSubmit : handleIncrementSubmit} className="p-8 space-y-8">
                                {activeTab === 'promotion' ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Target Grade Assignment</label>
                                            <div className="relative" ref={gradeDropdownRef}>
                                                {/* Trigger button */}
                                                <button
                                                    type="button"
                                                    onClick={() => { setGradeDropdownOpen(o => !o); setGradeFilter(''); }}
                                                    className="w-full flex items-center justify-between px-6 py-4 bg-input border border-border-default rounded-2xl text-[11px] font-black uppercase tracking-wider text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all shadow-sm cursor-pointer"
                                                >
                                                    <span className={selectedRoleId ? 'text-text-primary' : 'text-text-muted'}>
                                                        {selectedRoleId
                                                            ? (availableRoles.find(r => r.id === selectedRoleId)?.display_name ||
                                                                availableRoles.find(r => r.id === selectedRoleId)?.name ||
                                                                'Select Target Grade')
                                                            : 'Select Target Grade'}
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${gradeDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Dropdown panel */}
                                                {gradeDropdownOpen && (
                                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                        {/* Filter input */}
                                                        <div className="px-4 py-3 border-b border-border-divider">
                                                            <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl">
                                                                <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={gradeFilter}
                                                                    onChange={e => setGradeFilter(e.target.value)}
                                                                    placeholder="Filter products..."
                                                                    className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Role list */}
                                                        <div className="max-h-52 overflow-y-auto no-scrollbar">
                                                            {availableRoles
                                                                .filter(r =>
                                                                    (r.display_name || r.name)
                                                                        .toLowerCase()
                                                                        .includes(gradeFilter.toLowerCase())
                                                                )
                                                                .map(role => (
                                                                    <button
                                                                        key={role.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedRoleId(role.id);
                                                                            setGradeDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-6 py-3.5 text-[12px] font-black uppercase tracking-wider transition-colors hover:bg-hover ${selectedRoleId === role.id
                                                                            ? 'text-primary-600 bg-primary-50/50'
                                                                            : 'text-text-primary'
                                                                            }`}
                                                                    >
                                                                        {role.display_name || role.name}
                                                                    </button>
                                                                ))
                                                            }
                                                            {availableRoles.filter(r =>
                                                                (r.display_name || r.name)
                                                                    .toLowerCase()
                                                                    .includes(gradeFilter.toLowerCase())
                                                            ).length === 0 && (
                                                                    <div className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                                        No grades found
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Delta Justification Memo</label>
                                            <textarea
                                                value={promotionReason}
                                                onChange={(e) => setPromotionReason(e.target.value)}
                                                rows={2}
                                                placeholder="Document your performance metrics..."
                                                className="w-full px-6 py-3 bg-input border border-border-default rounded-2xl text-[13px] font-semibold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all resize-none shadow-sm placeholder:text-text-muted"
                                            />
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Formal Documentation Registry</p>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${promotionReason.length >= 10 ? 'text-primary-500' : 'text-primary-400'}`}>
                                                    {promotionReason.length} / 10 CHARS
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Requested Delta (LKR)</label>
                                                <div className="relative">
                                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">Rs.</div>
                                                    <input
                                                        type="number"
                                                        value={requestedAmount}
                                                        onChange={(e) => setRequestedAmount(e.target.value)}
                                                        className="w-full pl-14 pr-6 py-4 bg-input border border-border-default rounded-2xl text-lg font-black text-text-primary tabular-nums outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 shadow-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            {requestedAmount && (
                                                <div className="bg-primary-50/50 rounded-2xl p-4 border border-primary-100 flex flex-col justify-center">
                                                    <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-1">Projected Total</p>
                                                    <p className="text-xl font-black text-primary-700 tracking-tight leading-none tabular-nums">
                                                        {formatCurrency(Number(currentSalary) + (parseFloat(requestedAmount) || 0))}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Efficiency Rationale</label>
                                            <textarea
                                                value={incrementReason}
                                                onChange={(e) => setIncrementReason(e.target.value)}
                                                rows={2}
                                                placeholder="Highlight efficiency gains..."
                                                className="w-full px-6 py-3 bg-input border border-border-default rounded-2xl text-[13px] font-semibold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 transition-all resize-none shadow-sm placeholder:text-text-muted"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group/btn relative w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                                    style={{
                                        background: activeTab === 'promotion'
                                            ? `linear-gradient(135deg, ${colors.primary[600]}, ${colors.indigo[900]})`
                                            : `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]})`
                                    }}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                            {activeTab === 'promotion' ? 'Submit Promotion Request' : 'Submit Increment Request'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Registry History Modal */}
                {(showPromotionHistory || showIncrementHistory) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-border-default animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-border-default flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-text-primary tracking-tight uppercase leading-none mb-1">
                                        {showPromotionHistory ? 'Promotion History' : 'Increment History'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Historical Registry Protocol</p>
                                </div>
                                <button
                                    onClick={() => { setShowPromotionHistory(false); setShowIncrementHistory(false); }}
                                    className="w-10 h-10 bg-input hover:bg-hover rounded-xl flex items-center justify-center transition-all group/close active:scale-95"
                                >
                                    <XCircle className="w-5 h-5 text-text-muted group-hover/close:text-rose-500 transition-colors" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto bg-app-background flex-1 space-y-4 no-scrollbar">
                                {(showPromotionHistory ? promotionHistory : incrementHistory).map((request, idx) => (
                                    <div key={idx} className="bg-card border border-border-default rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    {showPromotionHistory ? (
                                                        <span className="text-sm font-black text-primary-600 uppercase">{(request as PromotionRequest).requested_role_name}</span>
                                                    ) : (
                                                        <span className="text-sm font-black text-primary-600">+{formatCurrency((request as SalaryIncrementRequest).requested_amount)}</span>
                                                    )}
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-300" />
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    Logged: {formatDate(request.requested_at)}
                                                </p>
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <div className="bg-input p-4 rounded-xl text-xs text-text-secondary leading-relaxed font-semibold">
                                            {request.reason}
                                        </div>
                                        {request.admin_feedback && (
                                            <div className="mt-4 p-4 bg-primary-50/50 rounded-xl border border-primary-50">
                                                <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <ShieldCheck size={10} /> Official Feedback
                                                </p>
                                                <p className="text-[11px] font-bold text-primary-900 leading-relaxed">{request.admin_feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(showPromotionHistory ? promotionHistory : incrementHistory).length === 0 && (
                                    <div className="py-20 text-center opacity-30">
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Historical Data Void</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
