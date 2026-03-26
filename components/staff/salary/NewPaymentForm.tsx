import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Info, Users, User, Filter, Search, X, Check, Building2, Briefcase, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { staffService } from '@/services/staff.service';
import { branchService } from '@/services/branch.service';
import { salaryService } from '../../../services/salary.service';
import { toast } from 'react-toastify';
import { colors } from '@/themes/colors';
import { SalaryReviewModal } from './SalaryReviewModal';

interface NewPaymentFormProps {
    onBack: () => void;
    onSubmit: (data: any) => void;
}

type SalaryMode = 'ROLE' | 'INDIVIDUAL' | 'FILTER';

export const NewPaymentForm: React.FC<NewPaymentFormProps> = ({ onBack, onSubmit }) => {
    const [salaryMode, setSalaryMode] = useState<SalaryMode>('INDIVIDUAL');
    const [employees, setEmployees] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active');
    const [showReview, setShowReview] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);

    const [formData, setFormData] = useState({
        month: 'January 2026',
        baseSalary: 0,
        allowances: 0,
        deductions: 0,
        paymentMethod: 'Bank Transfer',
        notes: ''
    });

    const [manualAllowances, setManualAllowances] = useState<{ id: string; label: string; amount: number }[]>([
        { id: Math.random().toString(36).substr(2, 9), label: 'Basic Allowance', amount: 0 }
    ]);

    const addAllowance = () => {
        setManualAllowances(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), label: '', amount: 0 }]);
    };

    const removeAllowance = (id: string) => {
        if (manualAllowances.length > 1) {
            setManualAllowances(prev => prev.filter(a => a.id !== id));
        } else {
            setManualAllowances([{ id: Math.random().toString(36).substr(2, 9), label: '', amount: 0 }]);
        }
    };

    const updateAllowance = (id: string, field: 'label' | 'amount', value: string | number) => {
        setManualAllowances(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const [manualDeductions, setManualDeductions] = useState<{ id: string; label: string; amount: number }[]>([
        { id: Math.random().toString(36).substr(2, 9), label: 'Tax/EPF', amount: 0 }
    ]);

    const addDeduction = () => {
        setManualDeductions(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), label: '', amount: 0 }]);
    };

    const removeDeduction = (id: string) => {
        if (manualDeductions.length > 1) {
            setManualDeductions(prev => prev.filter(a => a.id !== id));
        } else {
            setManualDeductions([{ id: Math.random().toString(36).substr(2, 9), label: '', amount: 0 }]);
        }
    };

    const updateDeduction = (id: string, field: 'label' | 'amount', value: string | number) => {
        setManualDeductions(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const [alreadyPaidIds, setAlreadyPaidIds] = useState<string[]>([]);

    const fetchStaffBasicSalary = async (staff: any) => {
        try {
            // First check if we already have basic salary in the employee data
            if (staff.basicSalary !== undefined && staff.basicSalary !== null) {
                setFormData(prev => ({ ...prev, baseSalary: Number(staff.basicSalary) }));
                return;
            }

            // If not available in local data, fetch from API using staffService
            const staffDetails = await staffService.getStaffDetails(staff.staffId || staff.id);

            if (staffDetails && staffDetails.basic_salary !== undefined && staffDetails.basic_salary !== null) {
                setFormData(prev => ({ ...prev, baseSalary: Number(staffDetails.basic_salary) }));
                toast.success(`Basic salary fetched for ${staff.name}`);
            }
        } catch (error) {
            console.error('Error fetching basic salary:', error);
            toast.error('Failed to fetch basic salary');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [users, fetchedRoles, fetchedBranches, history] = await Promise.all([
                    staffService.getUsers('staff', { per_page: 1000 }),
                    staffService.getAllRoles(),
                    branchService.getBranchesAll(),
                    salaryService.getHistory(formData.month)
                ]);
                setEmployees(users);
                setRoles(fetchedRoles);
                setBranches(fetchedBranches);
                setAlreadyPaidIds(history.map((p: any) => p.employeeId));
            } catch (error) {
                console.error("Error fetching data", error);
                toast.error("Failed to load required data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Also update paid IDs when month changes
    useEffect(() => {
        const fetchPaidStatus = async () => {
            try {
                const history = await salaryService.getHistory(formData.month);
                setAlreadyPaidIds(history.map((p: any) => p.employeeId));
            } catch (error) {
                console.error("Error updating paid status", error);
            }
        };
        fetchPaidStatus();
    }, [formData.month]);

    // Selection Logic based on Mode
    useEffect(() => {
        if (salaryMode === 'ROLE') {
            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
            const filtered = employees.filter(emp => {
                const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (
                    emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() ||
                    emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()
                ));

                const matchBranch = selectedBranches.length === 0 ||
                    selectedBranches.includes(String(emp.branchId)) ||
                    selectedBranches.some(bId => {
                        const bObj = branches.find(b => String(b.id) === bId);
                        return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                    });

                const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                return matchRole && matchBranch && !isPaid;
            });
            setSelectedStaffIds(filtered.map(emp => emp.id));
        } else if (salaryMode === 'FILTER') {
            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
            const filtered = employees.filter(emp => {
                const matchRole = !selectedRole ||
                    String(emp.roleId) === String(selectedRole) ||
                    (roleObj && (
                        emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() ||
                        emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()
                    ));

                const matchBranch = selectedBranches.length === 0 ||
                    selectedBranches.includes(String(emp.branchId)) ||
                    selectedBranches.some(bId => {
                        const bObj = branches.find(b => String(b.id) === bId);
                        return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                    });

                const matchStatus = !statusFilter || emp.status === statusFilter;
                const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                return matchRole && matchBranch && matchStatus && !isPaid;
            });
            setSelectedStaffIds(filtered.map(emp => emp.id));
        }
    }, [salaryMode, selectedRole, selectedBranches, statusFilter, employees, roles, branches, alreadyPaidIds]);

    const getGroupedEmployees = (): Record<string, any[]> => {
        const filtered = employees.filter(emp => {
            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
            const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
            const matchBranch = selectedBranches.length === 0 ||
                selectedBranches.includes(String(emp.branchId)) ||
                selectedBranches.some(bId => {
                    const bObj = branches.find(b => String(b.id) === bId);
                    return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                });
            const matchStatus = !statusFilter || emp.status === statusFilter;
            return matchRole && matchBranch && matchStatus;
        });

        if (selectedBranches.length === 0) {
            return filtered.reduce((acc: any, emp) => {
                const branchName = emp.branch && emp.branch !== '-' ? emp.branch : 'Unassigned';
                if (!acc[branchName]) acc[branchName] = [];
                acc[branchName].push(emp);
                return acc;
            }, {});
        }

        // If specific branches selected, group by those
        return filtered.reduce((acc: any, emp) => {
            const branchName = emp.branch && emp.branch !== '-' ? emp.branch : 'Unassigned';
            if (!acc[branchName]) acc[branchName] = [];
            acc[branchName].push(emp);
            return acc;
        }, {});
    };

    const handleToggleBranch = (id: string) => {
        if (id === '') {
            setSelectedBranches([]);
            return;
        }
        setSelectedBranches(prev =>
            prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
        );
    };

    const handleToggleStaff = (id: string) => {
        // Prevent toggling if already paid
        const emp = employees.find(e => e.id === id);
        if (emp && (alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id))) {
            toast.warn(`${emp.name} is already paid for ${formData.month}`);
            return;
        }

        const isSelected = selectedStaffIds.includes(id);

        setSelectedStaffIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );

        // Auto-fetch and populate basic salary for Individual mode
        if (salaryMode === 'INDIVIDUAL' && !isSelected) {
            fetchStaffBasicSalary(emp);
        }
    };

    const selectedStaffDetails = employees.filter(emp => selectedStaffIds.includes(emp.id));
    const totalAllowances = manualAllowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalDeductions = manualDeductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const netPayable = (Number(formData.baseSalary) || 0) + totalAllowances - totalDeductions;

    const handleSubmit = () => {
        if (selectedStaffIds.length === 0) {
            toast.error("Please select at least one employee");
            return;
        }

        const payload = {
            ...formData,
            allowances: totalAllowances,
            allowances_detail: manualAllowances,
            deductions: totalDeductions,
            deductions_detail: manualDeductions,
            employeeIds: selectedStaffIds,
            salaryMode
        };

        setReviewData(payload);
        setShowReview(true);
    };

    const handleFinalSubmit = () => {
        onSubmit(reviewData);
        setShowReview(false);
    };

    const filteredForSearch = employees.filter(emp => {
        const queryLower = searchQuery.trim().toLowerCase();
        return emp.name.toLowerCase().includes(queryLower) ||
            emp.staffId?.toLowerCase().includes(queryLower);
    });

    return (
        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border-default/50 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={onBack}
                        className="p-3 bg-card border border-border-default/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:border-primary-500/50"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-muted group-hover:text-primary-500 transition-colors" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-[900] text-text-primary tracking-tight leading-none mb-1">
                            Disbursement<span className="text-primary-600">.</span>
                        </h2>
                        <p className="text-sm font-medium text-text-muted flex items-center gap-2">
                            Configure Payroll Batch <span className="w-1 h-1 rounded-full bg-border-default"></span> {formData.month}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:text-primary-400 transition-all">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-primary-500"></div>
                    <span className="text-xs font-bold uppercase tracking-wider">System Ready</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Mode Selection Tabs */}
                    <div className="bg-muted-bg/50 p-1.5 rounded-[1.2rem] inline-flex gap-1 w-full border border-border-default/50 relative">
                        {/* Role-based action commented out per request
                        <button
                            onClick={() => { setSalaryMode('ROLE'); setSelectedStaffIds([]); setSelectedRole(''); setSelectedBranches([]); }}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${salaryMode === 'ROLE'
                                ? 'bg-card text-primary-600 shadow-lg ring-1 ring-border-default/50'
                                : 'text-text-muted hover:text-text-primary hover:bg-card/50'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${salaryMode === 'ROLE' ? 'bg-primary-500/10 text-primary-600' : 'bg-muted-bg text-text-muted'}`}>
                                <Users className="w-3.5 h-3.5" />
                            </div>
                            Role-based
                        </button>
                        */}
                        <button
                            onClick={() => { setSalaryMode('INDIVIDUAL'); setSelectedStaffIds([]); }}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${salaryMode === 'INDIVIDUAL'
                                ? 'bg-card text-primary-600 shadow-lg ring-1 ring-border-default/50'
                                : 'text-text-muted hover:text-text-primary hover:bg-card/50'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${salaryMode === 'INDIVIDUAL' ? 'bg-primary-500/10 text-primary-600' : 'bg-muted-bg text-text-muted'}`}>
                                <User className="w-3.5 h-3.5" />
                            </div>
                            Individual
                        </button>
                        {/* Filter-based action commented out per request
                        <button
                            onClick={() => { setSalaryMode('FILTER'); setSelectedStaffIds([]); setSelectedRole(''); setSelectedBranches([]); }}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${salaryMode === 'FILTER'
                                ? 'bg-card text-primary-600 shadow-lg ring-1 ring-border-default/50'
                                : 'text-text-muted hover:text-text-primary hover:bg-card/50'
                                }`}
                        >
                            <div className={`p-1 rounded-md transition-colors ${salaryMode === 'FILTER' ? 'bg-primary-500/10 text-primary-600' : 'bg-muted-bg text-text-muted'}`}>
                                <Filter className="w-3.5 h-3.5" />
                            </div>
                            Filter-based
                        </button>
                        */}
                    </div>

                    {/* Mode Specific Controls */}
                    <div className="bg-card p-6 rounded-2xl border border-border-default/50 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {false && salaryMode === 'ROLE' && (
                            <div className="space-y-6">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Filter by Role & Branch</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <Briefcase
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors"
                                            style={{ color: 'var(--icon-color, #9ca3af)' }}
                                        />
                                        <select
                                            value={selectedRole}
                                            onChange={e => setSelectedRole(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-input border border-border-default rounded-xl focus:border-transparent outline-none transition-all appearance-none text-sm font-medium text-text-primary"
                                            style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                        >
                                            <option value="">All Roles...</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.display_name || role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative group">
                                        <Building2
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors"
                                            style={{ color: 'var(--icon-color, #9ca3af)' }}
                                        />
                                        <div
                                            className="flex flex-wrap gap-1 items-center w-full pl-10 pr-4 py-2 border rounded-xl max-h-[100px] overflow-y-auto"
                                            style={{ backgroundColor: `${colors.primary[50]}33`, borderColor: colors.primary[100] }}
                                        >
                                            {selectedBranches.length === 0 ? (
                                                <span className="text-gray-400 text-sm py-1">All Branches Selected</span>
                                            ) : (
                                                selectedBranches.map(bId => {
                                                    const b = branches.find(branch => String(branch.id) === String(bId));
                                                    return (
                                                        <span
                                                            key={bId}
                                                            className="inline-flex items-center gap-1 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold"
                                                            style={{ backgroundColor: colors.primary[600] }}
                                                        >
                                                            {b?.branch_name || b?.name || `Branch ${bId}`}
                                                            <button onClick={() => handleToggleBranch(bId)}><X className="w-3 h-3" /></button>
                                                        </span>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <select
                                            className="w-full mt-2 pl-4 pr-10 py-2.5 bg-input border border-border-default rounded-xl text-xs font-semibold appearance-none text-text-primary"
                                            onChange={(e) => handleToggleBranch(e.target.value)}
                                            value=""
                                        >
                                            <option value="">Add Branch Filter...</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id} disabled={selectedBranches.includes(String(b.id))}>
                                                    {b.branch_name || b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Matching Staff</p>
                                        <button
                                            onClick={() => {
                                                const matching = employees.filter(emp => {
                                                    const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                                    const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                                    const matchBranch = selectedBranches.length === 0 ||
                                                        selectedBranches.includes(String(emp.branchId)) ||
                                                        selectedBranches.some(bId => {
                                                            const bObj = branches.find(b => String(b.id) === bId);
                                                            return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                        });
                                                    return matchRole && matchBranch;
                                                });
                                                const matchingIds = matching.map(m => m.id);
                                                const allSelected = matchingIds.every(id => selectedStaffIds.includes(id));
                                                if (allSelected) {
                                                    setSelectedStaffIds(selectedStaffIds.filter(id => !matchingIds.includes(id)));
                                                } else {
                                                    setSelectedStaffIds([...new Set([...selectedStaffIds, ...matchingIds])]);
                                                }
                                            }}
                                            className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                                        >
                                            Toggle All Matching
                                        </button>
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {employees.filter(emp => {
                                            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                            const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                            const matchBranch = selectedBranches.length === 0 ||
                                                selectedBranches.includes(String(emp.branchId)) ||
                                                selectedBranches.some(bId => {
                                                    const bObj = branches.find(b => String(b.id) === bId);
                                                    return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                });
                                            return matchRole && matchBranch;
                                        }).length > 0 ? employees.filter(emp => {
                                            const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                            const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                            const matchBranch = selectedBranches.length === 0 ||
                                                selectedBranches.includes(String(emp.branchId)) ||
                                                selectedBranches.some(bId => {
                                                    const bObj = branches.find(b => String(b.id) === bId);
                                                    return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                });
                                            return matchRole && matchBranch;
                                        }).map(emp => {
                                            const isSelected = selectedStaffIds.includes(emp.id);
                                            const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                                            return (
                                                <button
                                                    key={emp.id}
                                                    onClick={() => handleToggleStaff(emp.id)}
                                                    className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 group ${isSelected
                                                        ? 'text-white'
                                                        : 'bg-card border-border-divider hover:shadow-md'
                                                        } ${isPaid ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                    style={isSelected ? { backgroundColor: colors.primary[600], borderColor: colors.primary[600], boxShadow: `0 10px 15px -3px ${colors.primary[500]}4D` } : {}}
                                                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.borderColor = colors.primary[300])}
                                                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.borderColor = '')}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm transition-transform group-hover:scale-105 ${isSelected ? 'bg-white/20 text-white' : (isPaid ? 'bg-muted-bg text-text-muted' : 'bg-muted-bg text-text-primary')
                                                        }`}>
                                                        {isPaid ? <Check className="w-5 h-5" /> : emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                    <div className="text-left flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>{emp.name}</p>
                                                            {isPaid && <span className="text-[9px] font-black bg-muted-bg text-text-muted px-1.5 py-0.5 rounded uppercase tracking-tighter">Paid</span>}
                                                        </div>
                                                        <p className={`text-[10px] truncate font-medium ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>{emp.role}</p>
                                                    </div>
                                                    {isSelected && !isPaid && <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>}
                                                </button>
                                            );
                                        }) : (
                                            <div className="col-span-full py-8 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500 font-medium">No members match these filters</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {salaryMode === 'INDIVIDUAL' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest">Search & Select Staff</label>
                                    <p className="text-xs font-bold" style={{ color: colors.primary[600] }}>{selectedStaffIds.length} Selected</p>
                                </div>

                                <div className="relative group">
                                    <Search
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors"
                                        style={{ color: 'var(--icon-color, #9ca3af)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search by name or Staff ID..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-input border border-border-default rounded-xl focus:border-transparent outline-none transition-all text-sm text-text-primary"
                                        style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                        onFocus={(e) => {
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) parent.style.setProperty('--icon-color', colors.primary[500]);
                                        }}
                                        onBlur={(e) => {
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) parent.style.setProperty('--icon-color', '#9ca3af');
                                        }}
                                    />
                                </div>

                                <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {filteredForSearch.map(emp => {
                                        const isSelected = selectedStaffIds.includes(emp.id);
                                        const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleToggleStaff(emp.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group ${isSelected
                                                    ? 'bg-primary-500/10 border-primary-500/20'
                                                    : 'bg-card border-border-divider hover:border-primary-500/30'
                                                    } ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <div
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black`}
                                                        style={isSelected ? { backgroundColor: colors.primary[600], color: '#fff' } : (isPaid ? { backgroundColor: '#dcfce7', color: '#166534' } : { backgroundColor: '#f3f4f6', color: '#6b7280' })}
                                                    >
                                                        {isPaid ? <Check className="w-4 h-4" /> : emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-text-primary">{emp.name}</p>
                                                            {isPaid && <span className="text-[9px] font-black bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-tighter">Already Paid</span>}
                                                        </div>
                                                        <p className="text-[10px] text-text-muted">{emp.staffId || 'No ID'} • {emp.role}</p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isPaid ? 'bg-primary-100 border-primary-200 shadow-inner' : ''}`}
                                                    style={isSelected && !isPaid ? { backgroundColor: colors.primary[600], borderColor: colors.primary[600] } : {}}
                                                >
                                                    {isSelected && !isPaid && <Check className="w-3 h-3 text-white" />}
                                                    {isPaid && <Check className="w-3 h-3 text-primary-600" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Tokenized List */}
                                {selectedStaffIds.length > 0 && (
                                    <div className="pt-4 border-t border-border-divider flex flex-wrap gap-2">
                                        {selectedStaffDetails.map(emp => (
                                            <div
                                                key={emp.id}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold animate-in bounce-in duration-300"
                                                style={{ backgroundColor: `${colors.primary[100]}80`, color: colors.primary[700] }}
                                            >
                                                {emp.name}
                                                <button onClick={() => handleToggleStaff(emp.id)} className="hover:opacity-75 p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {false && salaryMode === 'FILTER' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Filter Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors duration-700"></div>

                                    <div className="flex items-center gap-2 mb-6 text-gray-400">
                                        <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                                            <Filter className="w-3.5 h-3.5" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Advanced Rules Engine</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        {/* Branch Filter - Spans more columns */}
                                        <div className="md:col-span-6 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Target Branches</label>
                                            <div className="relative group/branch">
                                                <div className="absolute left-3.5 top-3.5 pointer-events-none z-10">
                                                    <Building2 className="w-4 h-4 text-gray-400 group-focus-within/branch:text-blue-500 transition-colors" />
                                                </div>

                                                <div className="min-h-[52px] w-full pl-10 pr-2 py-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 focus-within:bg-white dark:focus-within:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-sm flex flex-wrap content-center gap-1.5 cursor-text"
                                                    onClick={() => document.getElementById('branch-select')?.focus()}
                                                >
                                                    {selectedBranches.length === 0 ? (
                                                        <span className="text-gray-400 text-sm font-medium py-1">All Branches Selected</span>
                                                    ) : (
                                                        selectedBranches.map(bId => {
                                                            const b = branches.find(branch => String(branch.id) === String(bId));
                                                            return (
                                                                <span
                                                                    key={bId}
                                                                    className="relative z-10 inline-flex items-center gap-1.5 text-white pl-2.5 pr-1.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm animate-in zoom-in-50 duration-200"
                                                                    style={{ backgroundColor: colors.primary[600] }}
                                                                >
                                                                    {b?.branch_name || b?.name}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleToggleBranch(bId); }}
                                                                        className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    )}

                                                    {/* Hidden select overlay or positioned nearby logic could be used, but here keeping simple integration */}
                                                    <select
                                                        id="branch-select"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
                                                        onChange={(e) => {
                                                            if (e.target.value) handleToggleBranch(e.target.value);
                                                            e.target.value = ''; // Reset
                                                        }}
                                                        value=""
                                                    >
                                                        <option value="">Select options...</option>
                                                        {selectedBranches.length > 0 && <option value="CLEAR_ALL">Clear All Selection</option>}
                                                        {branches.map(b => (
                                                            <option key={b.id} value={b.id} disabled={selectedBranches.includes(String(b.id))}>
                                                                {selectedBranches.includes(String(b.id)) ? '✓ ' : ''}{b.branch_name || b.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                                                        {selectedBranches.length === 0 ? 'ALL' : selectedBranches.length}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Role Filter */}
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Staff Role</label>
                                            <div className="relative group/role">
                                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/role:text-blue-500 transition-colors pointer-events-none" />
                                                <select
                                                    value={selectedRole}
                                                    onChange={e => setSelectedRole(e.target.value)}
                                                    className="w-full pl-11 pr-8 py-3.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-white focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer"
                                                    style={{ '--tw-ring-color': `${colors.primary[500]}33` } as any}
                                                >
                                                    <option value="">All Roles</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.display_name || role.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1">Account Status</label>
                                            <div className="relative group/status">
                                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusFilter === 'Active' ? 'bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : (statusFilter === 'Inactive' ? 'bg-gray-400' : 'bg-primary-500')}`}></div>
                                                <select
                                                    value={statusFilter}
                                                    onChange={e => setStatusFilter(e.target.value)}
                                                    className="w-full pl-10 pr-8 py-3.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-white focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                                >
                                                    <option value="Active">Active Only</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="">All Status</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Filter Results</span>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">Matching Staff</h3>
                                                    <span
                                                        className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide border"
                                                        style={{ backgroundColor: colors.primary[50], color: colors.primary[700], borderColor: colors.primary[200] }}
                                                    >
                                                        {(() => {
                                                            const count = employees.filter(emp => {
                                                                const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                                                const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                                                const matchBranch = selectedBranches.length === 0 ||
                                                                    selectedBranches.includes(String(emp.branchId)) ||
                                                                    selectedBranches.some(bId => {
                                                                        const bObj = branches.find(b => String(b.id) === bId);
                                                                        return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                                    });
                                                                const matchStatus = !statusFilter || emp.status === statusFilter;
                                                                return matchRole && matchBranch && matchStatus;
                                                            }).length;
                                                            return `${count} Found`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const matching = employees.filter(emp => {
                                                    const roleObj = roles.find(r => String(r.id) === String(selectedRole));
                                                    const matchRole = !selectedRole || String(emp.roleId) === String(selectedRole) || (roleObj && (emp.roleName?.toLowerCase() === roleObj.name?.toLowerCase() || emp.role?.toLowerCase() === roleObj.display_name?.toLowerCase()));
                                                    const matchBranch = selectedBranches.length === 0 ||
                                                        selectedBranches.includes(String(emp.branchId)) ||
                                                        selectedBranches.some(bId => {
                                                            const bObj = branches.find(b => String(b.id) === bId);
                                                            return bObj && emp.branch?.toLowerCase() === (bObj.branch_name || bObj.name)?.toLowerCase();
                                                        });
                                                    const matchStatus = !statusFilter || emp.status === statusFilter;
                                                    return matchRole && matchBranch && matchStatus;
                                                });
                                                const matchingIds = matching.filter(emp => {
                                                    const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);
                                                    return !isPaid;
                                                }).map(emp => emp.id);

                                                if (matchingIds.every(id => selectedStaffIds.includes(id)) && matchingIds.length > 0) {
                                                    // All visible filtered staff are selected -> Deselect them
                                                    setSelectedStaffIds(prev => prev.filter(id => !matchingIds.includes(id)));
                                                } else {
                                                    // Select all
                                                    const newSelection = new Set([...selectedStaffIds, ...matchingIds]);
                                                    setSelectedStaffIds(Array.from(newSelection));
                                                    if (matching.length > matchingIds.length) {
                                                        toast.info(`${matching.length - matchingIds.length} already-paid staff were skipped.`);
                                                    }
                                                }
                                            }}
                                            className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors"
                                            style={{ color: colors.primary[600] }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = colors.primary[700]}
                                            onMouseLeave={(e) => e.currentTarget.style.color = colors.primary[600]}
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform"
                                                style={{ backgroundColor: colors.primary[600] }}
                                            ></span>
                                            Toggle All Matching
                                        </button>
                                    </div>


                                    {Object.keys(getGroupedEmployees()).length > 0 ? (
                                        <div className="space-y-12">
                                            {Object.entries(getGroupedEmployees()).map(([branchName, branchEmps]) => {
                                                const allSelected = branchEmps.length > 0 && branchEmps.every(e => selectedStaffIds.includes(e.id));

                                                // Don't show empty branches in filter
                                                if (branchEmps.length === 0) return null;

                                                return (
                                                    <div key={branchName} className="relative pl-6 border-l-2 border-border-divider space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                                                        <div className="sticky top-0 z-10 -ml-6 flex items-center gap-3 bg-card/95 backdrop-blur-sm py-2 pr-4 rounded-r-xl w-max">
                                                            <div className="w-1.5 h-6 bg-primary-500 rounded-r-md"></div>
                                                            <h4 className="text-xs font-black text-text-primary tracking-tight uppercase">{branchName}</h4>
                                                            <span className="bg-muted-bg text-text-muted text-[9px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center">{branchEmps.length}</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {branchEmps.map(emp => {
                                                                const isSelected = selectedStaffIds.includes(emp.id);
                                                                const isPaid = alreadyPaidIds.includes(emp.staffId) || alreadyPaidIds.includes(emp.id);

                                                                return (
                                                                    <button
                                                                        key={emp.id}
                                                                        onClick={() => handleToggleStaff(emp.id)}
                                                                        className={`group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isSelected
                                                                            ? 'text-white transform -translate-y-0.5'
                                                                            : 'bg-card border-border-divider'
                                                                            } ${isPaid ? 'opacity-60 cursor-not-allowed grayscale-[0.8]' : ''}`}
                                                                        style={isSelected ? { backgroundColor: colors.primary[600], borderColor: colors.primary[600], boxShadow: `0 8px 20px -8px ${colors.primary[500]}66` } : {}}
                                                                        onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = `${colors.primary[50]}80`)}
                                                                        onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = '')}
                                                                    >
                                                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm transition-transform group-hover:scale-105 ${isSelected ? 'bg-white/20 text-white backdrop-blur-sm' : (isPaid ? 'bg-muted-bg text-text-muted' : 'bg-muted-bg text-text-primary border border-border-divider')
                                                                            }`}>
                                                                            {isPaid ? <Check className="w-5 h-5" /> : emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                                        </div>

                                                                        <div className="text-left flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>{emp.name}</p>
                                                                                {isPaid && <span className="text-[9px] font-black bg-card/80 text-text-muted px-1.5 py-0 rounded uppercase tracking-tighter">Paid</span>}
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <p className={`text-[10px] truncate font-medium ${isSelected ? 'text-blue-100' : 'text-text-muted'}`}>{emp.role}</p>
                                                                                {branchName === 'Unassigned' && (
                                                                                    <span className={`text-[9px] font-bold ${isSelected ? 'text-blue-200' : 'text-text-muted'}`}>{emp.branch !== '-' ? emp.branch : ''}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-white/50 bg-white/20' : 'border-border-divider bg-transparent group-hover:border-primary-300'}`}>
                                                                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="col-span-full py-12 text-center bg-muted-bg/30 rounded-2xl border border-dashed border-border-divider">
                                            <Users className="w-10 h-10 text-text-muted opacity-20 mx-auto mb-3" />
                                            <p className="text-xs text-text-muted font-bold uppercase tracking-widest">No matching staff found</p>
                                            <p className="text-[10px] text-text-muted/50 mt-1">Try adjusting your filters or search query</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payroll Settings */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-black text-text-primary">Payroll Calculation Settings</h3>
                            <div className="h-0.5 grow bg-border-divider mx-4"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider px-1">Payroll Period</label>
                                <div
                                    className="relative group rounded-xl transition-all"
                                    onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 4px ${colors.primary[500]}1a`}
                                    onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.month}
                                        onChange={e => setFormData({ ...formData, month: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-input border border-border-default rounded-xl outline-none transition-all text-sm font-semibold text-text-primary shadow-sm"
                                        style={{ focusBorderColor: colors.primary[500] } as any}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = colors.primary[500];
                                            const icon = e.currentTarget.previousElementSibling;
                                            if (icon) (icon as HTMLElement).style.color = colors.primary[500];
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '';
                                            const icon = e.currentTarget.previousElementSibling;
                                            if (icon) (icon as HTMLElement).style.color = '#9ca3af';
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider px-1">Base Salary (Per Head)</label>
                                <div
                                    className="relative group rounded-xl transition-all"
                                    onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 4px ${colors.primary[500]}1a`}
                                    onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                                >
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rs.</span>
                                    <input
                                        type="number"
                                        value={formData.baseSalary || ''}
                                        onChange={e => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-input border border-border-default rounded-xl outline-none transition-all text-sm font-bold text-text-primary shadow-sm"
                                        onFocus={(e) => e.currentTarget.style.borderColor = colors.primary[500]}
                                        onBlur={(e) => e.currentTarget.style.borderColor = ''}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-muted-bg/30 p-6 rounded-2xl border border-dashed border-border-divider space-y-5">
                                <div className="flex justify-between items-center group/title">
                                    <label className="flex items-center gap-2 text-xs font-black text-text-muted uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Allowances Breakdown
                                    </label>
                                    <button
                                        onClick={addAllowance}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-card text-green-600 hover:text-green-700 dark:text-green-400 rounded-lg text-[10px] font-black hover:shadow-md transition-all border border-border-divider"
                                    >
                                        <Plus className="w-3 h-3" />
                                        ADD ITEM
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {manualAllowances.map((allowance) => (
                                        <div key={allowance.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300 group">
                                            <div className="flex-[2] relative">
                                                <input
                                                    type="text"
                                                    value={allowance.label}
                                                    onChange={e => updateAllowance(allowance.id, 'label', e.target.value)}
                                                    placeholder="Description (e.g. Performance Bonus)"
                                                    className="w-full pl-4 pr-4 py-3 bg-card border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm font-medium shadow-sm text-text-primary"
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold text-xs">+</span>
                                                <input
                                                    type="number"
                                                    value={allowance.amount || ''}
                                                    onChange={e => updateAllowance(allowance.id, 'amount', Number(e.target.value))}
                                                    className="w-full pl-7 pr-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm font-bold text-green-600 dark:text-green-400"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeAllowance(allowance.id)}
                                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-rose-500/5 p-6 rounded-2xl border border-dashed border-rose-500/20 space-y-5">
                                <div className="flex justify-between items-center group/title">
                                    <label className="flex items-center gap-2 text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                        Deductions Breakdown
                                    </label>
                                    <button
                                        onClick={addDeduction}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-red-600 hover:text-red-700 dark:text-red-400 rounded-lg text-[10px] font-black hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                                    >
                                        <Plus className="w-3 h-3" />
                                        ADD ITEM
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {manualDeductions.map((deduction) => (
                                        <div key={deduction.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300 group">
                                            <div className="flex-[2] relative">
                                                <input
                                                    type="text"
                                                    value={deduction.label}
                                                    onChange={e => updateDeduction(deduction.id, 'label', e.target.value)}
                                                    placeholder="Description (e.g. Tax/EPF)"
                                                    className="w-full pl-4 pr-4 py-3 bg-card border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm font-medium shadow-sm text-text-primary"
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs">-</span>
                                                <input
                                                    type="number"
                                                    value={deduction.amount || ''}
                                                    onChange={e => updateDeduction(deduction.id, 'amount', Number(e.target.value))}
                                                    className="w-full pl-7 pr-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-sm font-bold text-rose-600 dark:text-rose-400"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeDeduction(deduction.id)}
                                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider px-1">Payment Method</label>
                                <div className="relative">
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3.5 bg-input border border-border-default rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer text-text-primary"
                                    >
                                        <option>Bank Transfer</option>
                                        <option>Cash</option>
                                        <option>Cheque</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider px-1">Notes / Remarks</label>
                                <textarea
                                    rows={2}
                                    placeholder="Add any internal audit notes regarding this batch..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-4 bg-input border border-border-default rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm font-medium resize-none shadow-sm text-text-primary"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                onClick={onBack}
                                className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-10 py-3 text-white rounded-xl text-sm font-black transition-all hover:shadow-none hover:-translate-y-0.5 active:translate-y-0"
                                style={{ backgroundColor: colors.primary[600], boxShadow: `0 10px 20px -10px ${colors.primary[500]}66` }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary[700]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary[600]}
                            >
                                Confirm & Process
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="relative">
                    <div className="sticky top-10">
                        <div className="bg-text-primary rounded-[2rem] p-1.5 shadow-2xl overflow-hidden ring-4 ring-muted-bg">
                            <div className="bg-card rounded-[1.6rem] p-8 border border-border-divider shadow-sm flex flex-col min-h-[500px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div>
                                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.25em] mb-1">Preview</h3>
                                        <p className="text-2xl font-black text-text-primary tracking-tight">Summary</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800/50 shadow-sm animate-pulse">
                                        Live Calculation
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8 relative z-10">
                                    <div className="text-center">
                                        <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-card shadow-lg mb-4" style={{ backgroundColor: `${colors.primary[500]}1a` }}>
                                            <span className="text-3xl font-black" style={{ color: colors.primary[600] }}>{selectedStaffIds.length}</span>
                                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Recipients</span>
                                        </div>
                                        <div className="flex justify-center -space-x-2">
                                            {selectedStaffDetails.slice(0, 4).map((emp, i) => (
                                                <div key={emp.id} className="w-8 h-8 rounded-full border-2 border-card bg-muted-bg flex items-center justify-center text-[9px] font-bold text-text-primary shadow-sm">
                                                    {emp.name[0]}
                                                </div>
                                            ))}
                                            {selectedStaffIds.length > 4 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-card bg-muted-bg flex items-center justify-center text-[9px] font-bold text-text-muted shadow-sm">
                                                    +{selectedStaffIds.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-5 bg-muted-bg/50 rounded-2xl border border-dashed border-border-divider space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-text-muted font-medium">Per Employee</span>
                                                <span className="font-bold text-text-primary font-mono">Rs. {netPayable.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full h-px bg-border-divider"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-text-muted uppercase tracking-widest">Total Batch</span>
                                                <span className="text-xl font-black" style={{ color: colors.primary[600] }}>Rs. {(netPayable * selectedStaffIds.length).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">
                                            <div className="bg-muted-bg p-2 rounded-lg border border-border-divider">
                                                {salaryMode} Mode
                                            </div>
                                            <div className="bg-muted-bg p-2 rounded-lg border border-border-divider truncate">
                                                {formData.paymentMethod}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4 relative z-10">
                                    <div
                                        className="flex items-start gap-3 p-3 rounded-xl border"
                                        style={{ backgroundColor: `${colors.primary[50]}80`, borderColor: colors.primary[100] }}
                                    >
                                        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.primary[500] }} />
                                        <p className="text-[10px] leading-relaxed font-medium" style={{ color: colors.primary[700] }}>
                                            Verifying {selectedStaffIds.length} payslips. Ensure allowance breakdown is correct before proceeding.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full py-4 bg-text-primary text-card rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0"
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showReview && reviewData && (
                <SalaryReviewModal
                    isOpen={showReview}
                    onClose={() => setShowReview(false)}
                    onConfirm={handleFinalSubmit}
                    data={reviewData}
                    employeeDetails={selectedStaffDetails}
                />
            )}
        </div>
    );
};