"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    MapPin,
    Upload,
    Search,
    ChevronDown,
    ChevronUp,
    Edit3,
    Trash2,
    Plus,
    X,
    CheckCircle2,
    AlertCircle,
    FileText,
    Download,
    RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { authService } from "../../../services/auth.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface GsDivision {
    id: number;
    name: string;
    mpa_code: string;
    province: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PaginatedResponse {
    data: GsDivision[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ImportSummary {
    created: number;
    updated: number;
    skipped: number;
    total_rows: number;
    errors: string[];
}

export default function GsDivisionsPage() {
    const [divisions, setDivisions] = useState<GsDivision[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState<"name" | "mpa_code" | "province">("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    // Import state
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportSummary | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Create/Edit state
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingDivision, setEditingDivision] = useState<GsDivision | null>(null);
    const [formData, setFormData] = useState({ name: "", mpa_code: "", province: "" });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
    });

    const fetchDivisions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: "25",
            });
            if (search) params.append("search", search);

            const res = await fetch(`${API_BASE_URL}/system-config/gs-divisions?${params}`, {
                headers: getAuthHeaders(),
            });
            const json = await res.json();
            if (json.status === "success") {
                const paginated = json.data as PaginatedResponse;
                setDivisions(paginated.data);
                setTotalPages(paginated.last_page);
                setTotalItems(paginated.total);
            }
        } catch {
            toast.error("Failed to load GS Divisions");
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => {
        fetchDivisions();
    }, [fetchDivisions]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Import handler
    const handleImport = async (file: File) => {
        if (!file) return;
        setImporting(true);
        setImportResult(null);

        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch(`${API_BASE_URL}/system-config/gs-divisions/import`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    Accept: "application/json",
                },
                body: fd,
            });

            const json = await res.json();
            if (json.status === "success") {
                setImportResult(json.data);
                toast.success("Import completed successfully!");
                fetchDivisions();
            } else {
                toast.error(json.message || "Import failed");
            }
        } catch {
            toast.error("Import failed");
        } finally {
            setImporting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
            handleImport(file);
        } else {
            toast.error("Please upload a CSV file");
        }
    };

    // Create / Edit
    const openCreateModal = () => {
        setEditingDivision(null);
        setFormData({ name: "", mpa_code: "", province: "" });
        setFormErrors({});
        setShowFormModal(true);
    };

    const openEditModal = (div: GsDivision) => {
        setEditingDivision(div);
        setFormData({ name: div.name, mpa_code: div.mpa_code, province: div.province });
        setFormErrors({});
        setShowFormModal(true);
    };

    const handleSave = async () => {
        const errors: Record<string, string> = {};
        // Name is now optional, defaults to MPA code on backend if empty
        if (!formData.mpa_code.trim()) errors.mpa_code = "MPA Code is required";
        if (!formData.province.trim()) errors.province = "Province is required";
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSaving(true);
        try {
            const url = editingDivision
                ? `${API_BASE_URL}/system-config/gs-divisions/${editingDivision.id}`
                : `${API_BASE_URL}/system-config/gs-divisions`;

            const res = await fetch(url, {
                method: editingDivision ? "PUT" : "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const json = await res.json();
            if (json.status === "success") {
                toast.success(editingDivision ? "Updated successfully" : "Created successfully");
                setShowFormModal(false);
                fetchDivisions();
            } else {
                if (json.errors) {
                    setFormErrors(
                        Object.fromEntries(
                            Object.entries(json.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
                        ) as Record<string, string>
                    );
                } else {
                    toast.error(json.message || "Save failed");
                }
            }
        } catch {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    // Delete
    const handleDelete = async (div: GsDivision) => {
        if (!confirm(`Are you sure you want to delete "${div.name}" (${div.mpa_code})?`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/system-config/gs-divisions/${div.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });

            const json = await res.json();
            if (json.status === "success") {
                toast.success(json.message);
                fetchDivisions();
            } else {
                toast.error(json.message || "Delete failed");
            }
        } catch {
            toast.error("Delete failed");
        }
    };

    // Sort (client-side for current page)
    const sortedDivisions = [...divisions].sort((a, b) => {
        const aVal = a[sortField].toLowerCase();
        const bVal = b[sortField].toLowerCase();
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const toggleSort = (field: "name" | "mpa_code" | "province") => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
        return sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3 text-primary-500" />
        ) : (
            <ChevronDown className="w-3 h-3 text-primary-500" />
        );
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tighter flex items-center gap-3">
                        <div className="p-3 bg-primary-500/10 rounded-2xl">
                            <MapPin className="w-7 h-7 text-primary-600" />
                        </div>
                        GS Divisions
                    </h1>
                    <p className="text-sm text-text-muted mt-1 font-bold tracking-tight">
                        Manage Grama Sevaka Division records • {totalItems} divisions
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/30 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Division
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
                    >
                        <Upload className="w-4 h-4" />
                        Import CSV
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search by division name, MPA code, or province..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-card border border-border-default rounded-2xl text-sm font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
                {searchInput && (
                    <button
                        onClick={() => setSearchInput("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted-bg rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-text-muted" />
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-card rounded-3xl border border-border-default overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-divider/50 bg-muted-bg/30">
                                <th className="text-left px-6 py-4">
                                    <button
                                        onClick={() => toggleSort("name")}
                                        className="flex items-center gap-1.5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-text-primary transition-colors"
                                    >
                                        Division Name <SortIcon field="name" />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4">
                                    <button
                                        onClick={() => toggleSort("mpa_code")}
                                        className="flex items-center gap-1.5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-text-primary transition-colors"
                                    >
                                        MPA Code <SortIcon field="mpa_code" />
                                    </button>
                                </th>
                                <th className="text-left px-6 py-4">
                                    <button
                                        onClick={() => toggleSort("province")}
                                        className="flex items-center gap-1.5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-text-primary transition-colors"
                                    >
                                        Province <SortIcon field="province" />
                                    </button>
                                </th>
                                <th className="text-center px-6 py-4">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                        Status
                                    </span>
                                </th>
                                <th className="text-right px-6 py-4">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                                            <p className="text-sm font-bold text-text-muted">Loading divisions...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedDivisions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-3">
                                            <MapPin className="w-12 h-12 text-text-muted opacity-20" />
                                            <p className="text-sm font-bold text-text-muted">
                                                {search ? "No divisions match your search" : "No GS divisions yet"}
                                            </p>
                                            <p className="text-xs text-text-muted/60">
                                                {!search && "Import a CSV file to get started"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedDivisions.map((div, i) => (
                                    <tr
                                        key={div.id}
                                        className={`border-b border-border-divider/20 hover:bg-primary-50/30 dark:hover:bg-primary-500/5 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted-bg/10"
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-text-primary">{div.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 bg-primary-500/10 text-primary-600 rounded-lg text-xs font-black tracking-wide">
                                                {div.mpa_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-text-secondary">{div.province}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${div.is_active
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : "bg-rose-500/10 text-rose-500"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${div.is_active ? "bg-emerald-500" : "bg-rose-500"
                                                        }`}
                                                />
                                                {div.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(div)}
                                                    className="p-2 hover:bg-primary-500/10 rounded-xl transition-colors text-text-muted hover:text-primary-600"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(div)}
                                                    className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors text-text-muted hover:text-rose-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border-divider/30 flex items-center justify-between bg-muted-bg/20">
                        <p className="text-xs font-bold text-text-muted">
                            Page {currentPage} of {totalPages} • {totalItems} total records
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-xs font-bold rounded-xl border border-border-default bg-card hover:bg-muted-bg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${page === currentPage
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                                            : "border border-border-default bg-card hover:bg-muted-bg text-text-secondary"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-xs font-bold rounded-xl border border-border-default bg-card hover:bg-muted-bg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2.5rem] max-w-lg w-full shadow-2xl border border-border-default p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-text-primary tracking-tighter">Import GS Divisions</h3>
                                <p className="text-xs text-text-muted font-bold mt-1">Upload a CSV with: [Name (Optional)], MPA Code, Province</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportResult(null);
                                }}
                                className="p-3 hover:bg-muted-bg rounded-2xl transition-colors text-text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragActive(true);
                            }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("csv-upload")?.click()}
                            className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${dragActive
                                ? "border-primary-500 bg-primary-500/5"
                                : "border-border-divider/50 hover:border-primary-500/50 hover:bg-muted-bg/20"
                                }`}
                        >
                            {importing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
                                    <p className="text-sm font-bold text-primary-600">Importing...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 bg-primary-500/10 rounded-2xl">
                                        <Upload className="w-8 h-8 text-primary-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">
                                            Drop CSV file here or click to browse
                                        </p>
                                        <p className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-wider">
                                            Supports [MPA Code, Province] or [Name, MPA Code, Province]
                                        </p>
                                    </div>
                                </div>
                            )}
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv,.txt"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImport(file);
                                    e.target.value = "";
                                }}
                            />
                        </div>

                        {/* Import Results */}
                        {importResult && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm font-black text-emerald-600 uppercase tracking-wider">
                                        Import Complete
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-card rounded-xl p-3 border border-border-default">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Created</p>
                                        <p className="text-2xl font-black text-emerald-600">{importResult.created}</p>
                                    </div>
                                    <div className="bg-card rounded-xl p-3 border border-border-default">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Updated</p>
                                        <p className="text-2xl font-black text-primary-600">{importResult.updated}</p>
                                    </div>
                                    <div className="bg-card rounded-xl p-3 border border-border-default">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Skipped</p>
                                        <p className="text-2xl font-black text-amber-600">{importResult.skipped}</p>
                                    </div>
                                    <div className="bg-card rounded-xl p-3 border border-border-default">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Rows</p>
                                        <p className="text-2xl font-black text-text-primary">{importResult.total_rows}</p>
                                    </div>
                                </div>
                                {importResult.errors.length > 0 && (
                                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 space-y-1">
                                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Errors</p>
                                        {importResult.errors.map((err, i) => (
                                            <p key={i} className="text-xs text-rose-600 font-mono">{err}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showFormModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2.5rem] max-w-md w-full shadow-2xl border border-border-default p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-text-primary tracking-tighter">
                                {editingDivision ? "Edit Division" : "New Division"}
                            </h3>
                            <button
                                onClick={() => setShowFormModal(false)}
                                className="p-3 hover:bg-muted-bg rounded-2xl transition-colors text-text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">
                                    Division Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-5 py-3 bg-muted-bg/30 border ${formErrors.name ? "border-rose-500" : "border-border-default"
                                        } rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-text-primary`}
                                    placeholder="e.g. Analaitivu North"
                                />
                                {formErrors.name && (
                                    <p className="text-[9px] text-rose-500 font-bold mt-1 ml-2">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">
                                    MPA Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.mpa_code}
                                    onChange={(e) => setFormData({ ...formData, mpa_code: e.target.value })}
                                    className={`w-full px-5 py-3 bg-muted-bg/30 border ${formErrors.mpa_code ? "border-rose-500" : "border-border-default"
                                        } rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-text-primary`}
                                    placeholder="e.g. J/37"
                                />
                                {formErrors.mpa_code && (
                                    <p className="text-[9px] text-rose-500 font-bold mt-1 ml-2">{formErrors.mpa_code}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">
                                    Province *
                                </label>
                                <input
                                    type="text"
                                    value={formData.province}
                                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                    className={`w-full px-5 py-3 bg-muted-bg/30 border ${formErrors.province ? "border-rose-500" : "border-border-default"
                                        } rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-text-primary`}
                                    placeholder="e.g. Northern"
                                />
                                {formErrors.province && (
                                    <p className="text-[9px] text-rose-500 font-bold mt-1 ml-2">{formErrors.province}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowFormModal(false)}
                                className="px-6 py-3 text-xs font-black text-text-muted hover:bg-muted-bg rounded-2xl transition-all uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/30 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                {editingDivision ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
