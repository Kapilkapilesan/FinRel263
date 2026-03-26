"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Users,
    Search,
    RefreshCw,
    Building2,
    Calendar,
    DollarSign,
    User,
    CheckCircle2,
    ChevronDown,
    X,
    FileText,
    Printer,
    Download,
    MapPin,
} from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "@/services/auth.service";
import { API_BASE_URL, getHeaders } from "@/services/api.config";
import { documentPrintLogService } from "@/services/documentPrintLog.service";


interface Staff {
    id: number;
    staff_id: string;
    full_name: string;
    role: string;
}

interface Center {
    id: number;
    center_name: string;
    CSU_id: string;
    staff_id: string;
}

interface RepaymentLoan {
    group_no: string;
    customer_nic: string;
    product_code: string;
    customer_name: string;
    loan_amount: number;
    balance_amount: number;
    rental: number;
    arrears: number;
    arrears_age: number;
    attendance?: string;
}

interface CenterRepaymentData {
    center_id: number;
    center_name: string;
    csu_id: string;
    loans: RepaymentLoan[];
}

interface GroupedLoan {
    group_no: string;
    loans: RepaymentLoan[];
}

export default function RepaymentPage() {
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<string>("");
    const [selectedCenters, setSelectedCenters] = useState<number[]>([]);
    const [repaymentData, setRepaymentData] = useState<CenterRepaymentData[]>([]);
    const [loading, setLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(true);
    const [centerLoading, setCenterLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const staffDropdownRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target as Node)) {
                setIsStaffDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchStaffs = useCallback(async () => {
        try {
            setStaffLoading(true);
            const response = await fetch(`${API_BASE_URL}/staffs/by-role/field_officer`, {
                headers: getHeaders()
            });
            const result = await response.json();

            console.log("Fetch Staffs Result:", result);

            // Robust data extraction
            let rawItems: any[] = [];
            if (result?.data?.items && Array.isArray(result.data.items)) {
                rawItems = result.data.items;
            } else if (result?.data?.data && Array.isArray(result.data.data)) {
                rawItems = result.data.data;
            } else if (result?.data && Array.isArray(result.data)) {
                rawItems = result.data;
            } else if (Array.isArray(result)) {
                rawItems = result;
            } else if (result?.status === "success" && result?.data) {
                if (Array.isArray(result.data)) rawItems = result.data;
                else if (result.data.data && Array.isArray(result.data.data)) rawItems = result.data.data;
            }

            // Explicit mapping to ensure staff_id and full_name are populated
            const mappedItems: Staff[] = rawItems.map((item: any) => ({
                id: item.id || 0,
                staff_id: item.staff_id || item.staffId || item.user_name || item.username || String(item.id),
                full_name: item.full_name || item.fullName || item.name || item.display_name || "Unknown Staff",
                role: item.role || 'field_officer'
            }));

            // Guaranteed Fallback: Ensure current user is present if they are a field officer
            const currentUser = authService.getCurrentUser();
            const storedRolesStr = localStorage.getItem("roles");
            let isFieldOfficer = false;

            if (storedRolesStr) {
                try {
                    const roles = JSON.parse(storedRolesStr);
                    isFieldOfficer = Array.isArray(roles) && roles.some((r: any) => r.name === 'field_officer');
                } catch (e) { }
            }

            if (currentUser && isFieldOfficer) {
                const staffId = currentUser.staff_id || currentUser.user_name;
                if (staffId && !mappedItems.some(s => s.staff_id === staffId)) {
                    mappedItems.unshift({
                        id: currentUser.id || 0,
                        staff_id: staffId,
                        full_name: currentUser.full_name || currentUser.name || currentUser.display_name || staffId,
                        role: 'field_officer'
                    });
                }
            }

            // Filter out invalid items
            const finalStaffs = mappedItems.filter(item => item.staff_id && item.full_name);

            setStaffs(finalStaffs);

        } catch (error) {
            console.error("Failed to fetch staffs", error);
            // Even on error, try to show the current user
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                const staffId = currentUser.staff_id || currentUser.user_name;
                if (staffId && !selectedStaff) {
                    setStaffs([{
                        id: currentUser.id || 0,
                        staff_id: staffId,
                        full_name: currentUser.full_name || currentUser.name || currentUser.display_name || staffId,
                        role: 'field_officer'
                    }]);
                }
            }
        } finally {
            setStaffLoading(false);
        }
    }, []);

    const fetchCenters = useCallback(async (staffId: string) => {
        if (!staffId) {
            setCenters([]);
            return;
        }
        try {
            setCenterLoading(true);
            const response = await fetch(`${API_BASE_URL}/centers?staff_id=${staffId}`, {
                headers: getHeaders()
            });
            const result = await response.json();
            if (result.status === "success") {
                setCenters(result.data.data || result.data);
            }
        } catch (error) {
            console.error("Failed to fetch centers", error);
        } finally {
            setCenterLoading(false);
        }
    }, []);

    const fetchRepaymentData = useCallback(async () => {
        if (!selectedStaff || selectedCenters.length === 0) {
            setRepaymentData([]);
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/collections/repayment-sheet?staff_id=${selectedStaff}&${selectedCenters.map(id => `center_ids[]=${id}`).join('&')}`, {
                headers: getHeaders()
            });
            const result = await response.json();
            if (result.success) {
                setRepaymentData(result.data);
            } else {
                toast.error(result.message || "Failed to fetch repayment data");
            }
        } catch (error) {
            console.error("Failed to fetch repayment data", error);
            toast.error("An error occurred while fetching repayment data");
        } finally {
            setLoading(false);
        }
    }, [selectedStaff, selectedCenters]);

    useEffect(() => {
        fetchStaffs();
    }, [fetchStaffs]);

    useEffect(() => {
        if (!selectedStaff && staffs.length > 0) {
            const currentUser = authService.getCurrentUser();
            const storedRolesStr = localStorage.getItem("roles");
            let isFieldOfficer = false;

            if (storedRolesStr) {
                try {
                    const roles = JSON.parse(storedRolesStr);
                    isFieldOfficer = Array.isArray(roles) && roles.some((r: any) => r.name === 'field_officer');
                } catch (e) { }
            }

            if (currentUser && isFieldOfficer) {
                const staffId = currentUser.staff_id || currentUser.user_name;
                if (staffId && staffs.some(s => s.staff_id === staffId)) {
                    setSelectedStaff(staffId);
                }
            }
        }
    }, [staffs, selectedStaff]);

    useEffect(() => {
        if (selectedStaff) {
            fetchCenters(selectedStaff);
            setSelectedCenters([]);
            setRepaymentData([]);
        }
    }, [selectedStaff, fetchCenters]);

    useEffect(() => {
        if (selectedCenters.length > 0) {
            fetchRepaymentData();
        } else {
            setRepaymentData([]);
        }
    }, [selectedCenters, fetchRepaymentData]);

    const toggleCenter = (centerId: number) => {
        setSelectedCenters(prev =>
            prev.includes(centerId)
                ? prev.filter(id => id !== centerId)
                : [...prev, centerId]
        );
    };

    const handleSelectAllCenters = () => {
        if (selectedCenters.length === centers.length) {
            setSelectedCenters([]);
        } else {
            setSelectedCenters(centers.map(c => c.id));
        }
    };


    // Get selected staff name
    const selectedStaffName = staffs.find(s => s.staff_id === selectedStaff)?.full_name || "";

    // Get center info for header
    const selectedCenterInfo = repaymentData.length > 0 ? repaymentData[0] : null;

    // Format date for display
    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }) + " " + date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    // Print handler
    const handlePrint = () => {
        window.print();
    };

    // Export CSV for Mail Merge
    const handleExportCSV = () => {
        const headers = ["Group No", "Customer NIC", "Product Code", "Customer Name", "Loan Amount", "Balance Amount", "Rental", "Arrears", "Arrears Age"];
        const csvContent = [
            headers.join(","),
            ...repaymentData.flatMap(c => c.loans).map(loan => [
                loan.group_no,
                loan.customer_nic,
                loan.product_code,
                loan.customer_name,
                loan.loan_amount,
                loan.balance_amount,
                loan.rental,
                loan.arrears,
                loan.arrears_age
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Repayment_Sheet_${selectedDate}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="repayment-page p-4 md:p-6 space-y-5 animate-in fade-in duration-500">
            {/* Filter Bar */}
            <div className="filter-bar bg-card rounded-2xl shadow-sm border border-border-default p-4 md:p-5">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="flex-1 min-w-[220px]" ref={staffDropdownRef}>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            Field Officer
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => !staffLoading && setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                                disabled={staffLoading}
                                className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl text-left text-sm font-semibold text-text-primary flex items-center justify-between disabled:opacity-50 transition-all"
                            >
                                <span className={selectedStaff ? "text-text-primary" : "text-text-muted"}>
                                    {staffLoading ? "Loading..." : staffs.find(s => s.staff_id === selectedStaff)?.full_name || "Choose Officer"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isStaffDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isStaffDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-card border border-border-default rounded-xl shadow-2xl z-[50] overflow-hidden">
                                    <div className="p-2.5 border-b border-border-divider">
                                        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Available Officers</h4>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                                        {staffs.length === 0 ? (
                                            <p className="text-xs text-center py-4 text-text-muted font-medium">No officers found</p>
                                        ) : (
                                            staffs.map(staff => (
                                                <button
                                                    key={staff.staff_id}
                                                    onClick={() => {
                                                        setSelectedStaff(staff.staff_id);
                                                        setIsStaffDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between text-sm ${selectedStaff === staff.staff_id
                                                        ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900/30 dark:text-primary-400'
                                                        : 'hover:bg-hover text-text-primary'
                                                        }`}
                                                >
                                                    <span>{staff.full_name}</span>
                                                    {selectedStaff === staff.staff_id && <CheckCircle2 className="w-4 h-4" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-[220px]" ref={dropdownRef}>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            Centers
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => selectedStaff && !centerLoading && setIsDropdownOpen(!isDropdownOpen)}
                                disabled={!selectedStaff || centerLoading}
                                className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl text-left text-sm font-semibold text-text-primary flex items-center justify-between disabled:opacity-50 transition-all"
                            >
                                <span className={selectedCenters.length > 0 ? "text-text-primary" : "text-text-muted"}>
                                    {centerLoading ? "Loading..." : selectedCenters.length > 0 ? `${selectedCenters.length} Selected` : "Select Centers"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full bg-card border border-border-default rounded-xl shadow-2xl z-[50] overflow-hidden">
                                    <div className="p-2.5 border-b border-border-divider flex items-center justify-between">
                                        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Available Centers</h4>
                                        <button onClick={handleSelectAllCenters} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-1">
                                            {selectedCenters.length === centers.length ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                                        {centers.length === 0 ? (
                                            <p className="text-xs text-center py-4 text-text-muted font-medium">No centers found</p>
                                        ) : (
                                            centers.map(center => (
                                                <button
                                                    key={center.id}
                                                    onClick={() => toggleCenter(center.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between text-sm ${selectedCenters.includes(center.id)
                                                        ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-900/30 dark:text-primary-400'
                                                        : 'hover:bg-hover text-text-primary'
                                                        }`}
                                                >
                                                    <span>{center.center_name}</span>
                                                    {selectedCenters.includes(center.id) && <CheckCircle2 className="w-4 h-4" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                            <Search className="w-3.5 h-3.5 text-blue-500" />
                            Search
                        </label>
                        <input
                            type="text"
                            placeholder="Name, ID or Group..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl focus:outline-none text-sm font-medium text-text-primary placeholder-text-muted"
                        />
                    </div>

                    <div className="min-w-[170px]">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl focus:outline-none text-sm font-medium text-text-primary"
                        />
                    </div>

                    <div className="flex gap-2 mt-5 lg:mt-0">
                        <button onClick={handleExportCSV} disabled={repaymentData.length === 0} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 font-bold text-sm disabled:opacity-50 whitespace-nowrap">
                            <Download className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={handlePrint} disabled={repaymentData.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold text-sm disabled:opacity-50 whitespace-nowrap">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>
            </div>

            <div ref={printRef} className="print-area space-y-12">
                {loading ? (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-default p-16 flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <RefreshCw className="absolute inset-0 m-auto w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-text-secondary">Loading data...</p>
                    </div>
                ) : repaymentData.length === 0 ? (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-default p-20 flex flex-col items-center justify-center gap-4">
                        <div className="p-6 bg-muted-bg rounded-full"><FileText className="w-10 h-10 text-text-muted" /></div>
                        <p className="text-sm font-bold text-text-primary">No Records Found</p>
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl shadow-sm border border-border-default overflow-hidden">
                        <div className="w-full">
                            {repaymentData.map((centerData, centerIdx) => {
                                // Filter loans for this specific center based on search
                                const centerLoans = centerData.loans.filter(loan =>
                                    loan.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                                    loan.customer_nic.toLowerCase().includes(search.toLowerCase()) ||
                                    loan.group_no.toLowerCase().includes(search.toLowerCase())
                                );

                                if (centerLoans.length === 0 && search) return null;

                                // Group loans by group_no for this center
                                const centerGroups: Record<string, RepaymentLoan[]> = {};
                                centerLoans.forEach(loan => {
                                    if (!centerGroups[loan.group_no]) {
                                        centerGroups[loan.group_no] = [];
                                    }
                                    centerGroups[loan.group_no].push(loan);
                                });

                                const sortedGroups = Object.entries(centerGroups)
                                    .sort(([a], [b]) => (parseInt(a) || 0) - (parseInt(b) || 0))
                                    .map(([group_no, loans]) => ({ group_no, loans }));

                                // Calculate totals for this center
                                const centerTotals = {
                                    loan_amount: centerLoans.reduce((sum, l) => sum + (l.loan_amount || 0), 0),
                                    balance_amount: centerLoans.reduce((sum, l) => sum + (l.balance_amount || 0), 0),
                                    rental: centerLoans.reduce((sum, l) => sum + (l.rental || 0), 0),
                                    arrears: centerLoans.reduce((sum, l) => sum + (l.arrears || 0), 0),
                                };

                                // Chunk groups into sets of 5 for printing
                                const groupChunks = [];
                                for (let i = 0; i < sortedGroups.length; i += 5) {
                                    groupChunks.push(sortedGroups.slice(i, i + 5));
                                }

                                return groupChunks.map((chunk, chunkIdx) => (
                                    <div key={`${centerData.center_id}-${chunkIdx}`} className="border-b border-border-default last:border-0 page-break-after-always">
                                        {/* Combined Header - Repeating for each chunk */}
                                        <div className="document-header text-center py-4 px-6 border-b border-border-default bg-card">
                                            <h2 className="text-sm font-bold text-text-primary mb-2">Attendance / Repayment</h2>
                                            <p className="text-[10px] text-text-primary font-bold">
                                                CSU Name: <span className="uppercase">{centerData.center_name || "—"}</span>
                                                {"    "}CSU Code: <span className="uppercase">{centerData.csu_id || "—"}</span>
                                                {"    "}Print User: <span className="uppercase">{selectedStaffName}</span>
                                                {"    "}Print Date: {formatDisplayDate(new Date().toISOString())}
                                            </p>
                                        </div>

                                        <table className="w-full border-collapse repayment-table text-[10px]">
                                            <thead>
                                                <tr className="bg-table-header">
                                                    <th className="repayment-th w-[30px] min-w-[30px] relative p-0 overflow-hidden text-text-secondary">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className="rotate-[-90deg] uppercase text-[8px] font-black whitespace-nowrap">GROUP</span>
                                                        </div>
                                                    </th>
                                                    <th className="repayment-th text-center w-[85px] min-w-[85px] text-text-secondary">Customer ID</th>
                                                    <th className="repayment-th text-center w-[45px] min-w-[45px] text-text-secondary">Prod. Code</th>
                                                    <th className="repayment-th w-[110px] min-w-[110px] text-text-secondary">Customer Name</th>
                                                    <th className="repayment-th p-0 w-[65px] min-w-[65px] text-text-secondary">
                                                        <div className="text-center py-0.5 border-b border-border-divider text-[8px]">Attendance</div>
                                                        <div className="flex divide-x divide-border-divider h-5">
                                                            <div className="flex-1"></div><div className="flex-1"></div><div className="flex-1"></div><div className="flex-1"></div>
                                                        </div>
                                                    </th>
                                                    <th className="repayment-th w-[75px] min-w-[75px] text-right text-text-secondary">Loan Amt</th>
                                                    <th className="repayment-th w-[75px] min-w-[75px] text-right text-text-secondary">Balance</th>
                                                    <th className="repayment-th w-[65px] min-w-[65px] text-right text-text-secondary">Rental</th>
                                                    <th className="repayment-th w-[55px] min-w-[55px] text-right text-text-secondary">Arrears</th>
                                                    <th className="repayment-th w-[55px] min-w-[55px] text-right text-text-secondary">Arrears Age</th>
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <th key={i} colSpan={2} className="repayment-th w-[100px] min-w-[90px]"></th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {chunk.map((group) => (
                                                    <React.Fragment key={group.group_no}>
                                                        {group.loans.map((loan, loanIdx) => (
                                                            <tr key={`${group.group_no}-${loanIdx}`} className="repayment-row hover:bg-table-row-hover transition-colors">
                                                                <td className="repayment-td text-center font-bold text-text-primary">{loan.group_no}</td>
                                                                <td className="repayment-td font-medium text-text-primary">{loan.customer_nic}</td>
                                                                <td className="repayment-td text-center font-medium text-text-secondary">{loan.product_code}</td>
                                                                <td className="repayment-td font-semibold text-text-primary uppercase text-[10px]">{loan.customer_name}</td>
                                                                <td className="repayment-td p-0">
                                                                    <div className="flex divide-x divide-border-divider h-full min-h-[24px]">
                                                                        <div className="flex-1"></div><div className="flex-1"></div><div className="flex-1"></div><div className="flex-1"></div>
                                                                    </div>
                                                                </td>
                                                                <td className="repayment-td text-right font-medium text-text-primary">{formatNumber(loan.loan_amount)}</td>
                                                                <td className="repayment-td text-right font-medium text-text-primary">{formatNumber(loan.balance_amount)}</td>
                                                                <td className="repayment-td text-right font-medium text-text-primary">{formatNumber(loan.rental)}</td>
                                                                <td className={`repayment-td text-right font-medium ${loan.arrears < 0 ? 'text-rose-600' : 'text-text-primary'}`}>{formatNumber(loan.arrears)}</td>
                                                                <td className={`repayment-td text-right font-medium ${loan.arrears_age < 0 ? 'text-rose-600' : 'text-text-primary'}`}>{loan.arrears_age.toFixed(1)}</td>
                                                                {Array.from({ length: 8 }).map((_, i) => (
                                                                    <td key={i} className="repayment-td"></td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                        <tr className="repayment-row h-8">
                                                            <td colSpan={10}></td>
                                                            {Array.from({ length: 8 }).map((_, i) => (
                                                                <td key={i} className="repayment-td"></td>
                                                            ))}
                                                        </tr>
                                                        <tr className="h-2"><td colSpan={18} className="border-0"></td></tr>
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                            {chunkIdx === groupChunks.length - 1 && (
                                                <tfoot>
                                                    <tr className="bg-table-header font-black">
                                                        <td colSpan={5} className="repayment-td text-center uppercase text-[8px] tracking-[0.1em] py-2 italic text-text-secondary">{centerData.center_name} Total</td>
                                                        <td className="repayment-td text-right text-text-primary">{formatNumber(centerTotals.loan_amount)}</td>
                                                        <td className="repayment-td text-right text-text-primary">{formatNumber(centerTotals.balance_amount)}</td>
                                                        <td className="repayment-td text-right text-text-primary">{formatNumber(centerTotals.rental)}</td>
                                                        <td className="repayment-td text-right text-text-primary">{formatNumber(centerTotals.arrears)}</td>
                                                        <td className="repayment-td"></td>
                                                        {Array.from({ length: 8 }).map((_, i) => (
                                                            <td key={i} className="repayment-td"></td>
                                                        ))}
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                ));
                            })}
                        </div>

                        {/* Common Summaries and Signature */}
                        <div className="flex flex-col md:flex-row gap-6 p-6 border-t border-border-default">
                            <div className="w-80">
                                <table className="w-full border-collapse border border-border-divider text-[10px] font-bold text-text-primary">
                                    <tbody>
                                        {["Present", "Late", "Informed", "Absent", "Total", "Percentage"].map((label) => (
                                            <tr key={label}>
                                                <td className="border border-border-divider px-3 py-2 w-32 text-text-secondary">{label}</td>
                                                <td className="border border-border-divider p-0">
                                                    <div className="flex divide-x divide-border-divider h-8">
                                                        <div className="flex-1"></div><div className="flex-1"></div><div className="flex-1"></div><div className="flex-1"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex-1">
                                <table className="w-full border-collapse border border-border-divider text-[10px] font-bold text-text-primary">
                                    <tbody>
                                        {["Total", "Non Payments", "Non Pay Amt", "Under Payments", "Under Pay Amt"].map((label) => (
                                            <tr key={label}>
                                                <td className="border border-border-divider px-4 py-2 w-48 text-center text-text-secondary">{label}</td>
                                                {Array.from({ length: 8 }).map((_, i) => (
                                                    <td key={i} className="border border-border-divider px-2 py-2"></td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-10 flex justify-between items-end text-text-primary">
                                    <div className="text-center"><p className="font-black text-xs uppercase tracking-widest pt-2">CSU Manager</p></div>
                                    <div className="flex-1 max-w-xs border-b border-dotted border-border-divider h-px mb-1 ml-4"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .repayment-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
                .repayment-th, .repayment-td { 
                    border: 1px solid var(--border-divider); 
                    padding: 2.5px 4px; 
                    font-size: 10px; 
                    word-wrap: break-word; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                }
                
                @media print {
                    @page { size: landscape; margin: 5mm; }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print, .filter-bar { display: none !important; }
                    nav, aside, header { display: none !important; }
                    body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
                    .document-header { border-bottom: 2px solid #000 !important; }
                    .repayment-th, .repayment-td { border: 1px solid #000 !important; color: #000 !important; background: transparent !important; }
                    .page-break-after-always { page-break-after: always; }
                }
            `}</style>
        </div>
    );
}
