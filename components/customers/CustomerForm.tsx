import React, { useState, useEffect, useRef } from "react";
import {
    X,
    User,
    MapPin,
    Briefcase,
    Phone,
    MessageSquare,
    Mail,
    Building,
    Landmark,
    ChevronDown,
    CheckCircle2,
    ShieldCheck,
    Heart,
    Calendar,
    Camera,
    FileText,
    Download,
    Search
} from "lucide-react";
import { DocumentPreviewModal } from "../common/DocumentPreviewModal";
import { CustomerFormData } from "../../types/customer.types";
import { customerService } from "../../services/customer.service";
import { authService } from "../../services/auth.service";
import GsDivisionSearch from "../common/GsDivisionSearch";
import { nicService } from "../../services/nic.service";
import { toast } from "react-toastify";
import { formatFullName, formatNameWithInitials } from "../../utils/name.utils";
import { formatPhoneNumber } from "../../utils/phone.utils";
import { SecureImage } from "../common/SecureImage";
import { API_BASE_URL } from "../../services/api.config";

interface CustomerFormProps {
    onClose: () => void;
    onSubmit: (data: CustomerFormData) => Promise<any>;
    initialData?: Partial<CustomerFormData>;
}

// 📌 Move internal components OUTSIDE to prevent remounting/focus issues
const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-4 mb-2 pb-1 border-b border-border-divider/30">
        <div className="p-2 bg-primary-500/10 rounded-2xl text-primary-500 shadow-lg shadow-primary-500/5">
            <Icon size={16} />
        </div>
        <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] opacity-90">
            {title}
        </h3>
    </div>
);

const FormInput = ({
    label,
    name,
    type = "text",
    placeholder,
    required,
    error,
    icon: Icon,
    colSpan = 1,
    value,
    onChange,
    readOnly,
    min,
    max,
    onPaste,
}: any) => (
    <div
        className={`space-y-1 ${colSpan === 2 ? "md:col-span-2" : colSpan === 3 ? "md:col-span-3" : ""
            }`}
    >
        <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-widest flex items-center gap-2 ml-1">
            {label} {required && <span className="text-rose-500 text-lg leading-none">*</span>}
        </label>
        <div className="relative group/input">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40 group-focus-within/input:text-primary-500 group-focus-within/input:opacity-100 transition-all pointer-events-none">
                    <Icon size={16} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value || ""}
                onChange={onChange}
                onPaste={onPaste}
                readOnly={readOnly}
                min={min !== undefined ? min : type === "number" ? "0" : undefined}
                max={max}
                placeholder={placeholder}
                className={`w-full ${Icon ? "pl-11" : "pl-5"
                    } pr-5 py-2.5 bg-muted-bg/30 border-2 ${error
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                        : "border-border-divider/30 focus:border-primary-500 focus:ring-primary-500/10"
                    } rounded-2xl focus:outline-none focus:ring-8 transition-all text-sm font-bold text-text-primary placeholder:text-text-muted/20 placeholder:font-black placeholder:uppercase placeholder:tracking-widest uppercase ${readOnly ? "cursor-not-allowed opacity-40 grayscale" : ""
                    }`}
            />
        </div>
        {error && (
            <p className="text-[10px] text-rose-500 font-black uppercase tracking-tight ml-2 animate-in fade-in slide-in-from-top-1">
                {error}
            </p>
        )}
    </div>
);

// FormInput remains outside as it doesn't need component state.

export function CustomerForm({
    onClose,
    onSubmit,
    initialData,
}: CustomerFormProps) {
    const [loading, setLoading] = useState(false);
    const [constants, setConstants] = useState<any>(null);
    const [filteredDistricts, setFilteredDistricts] = useState<string[]>([]);
    const [filteredCenters, setFilteredCenters] = useState<any[]>([]);
    const [isBranchInactive, setIsBranchInactive] = useState(false);
    const [inactiveBranchName, setInactiveBranchName] = useState("");

    const [formData, setFormData] = useState<Partial<CustomerFormData>>({
        code_type: "NIC",
        address_type: "Home Address",
        country: "Sri Lanka",
        preferred_language: "Tamil",
        ...initialData,
        mobile_no_1: formatPhoneNumber(initialData?.mobile_no_1),
        mobile_no_2: formatPhoneNumber(initialData?.mobile_no_2),
        telephone: formatPhoneNumber(initialData?.telephone),
        date_of_birth: initialData?.date_of_birth
            ? new Date(initialData.date_of_birth).toISOString().split("T")[0]
            : "",
        customer_code_confirmation: initialData?.customer_code || "",
    });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [filterText, setFilterText] = useState("");

    // Outside click handler for custom dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
                setFilterText("");
            }
        };

        if (activeDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeDropdown]);

    const FormSelect = ({
        label,
        name,
        options,
        required,
        error,
        icon: Icon,
        colSpan = 1,
        value,
        onChange,
        disabled,
    }: any) => {
        const isActive = activeDropdown === name;

        return (
            <div
                className={`space-y-1 ${colSpan === 2 ? "md:col-span-2" : colSpan === 3 ? "md:col-span-3" : ""}`}
            >
                <label className="text-[10px] font-black text-text-primary/70 uppercase tracking-widest flex items-center gap-2 ml-1">
                    {label} {required && <span className="text-rose-500 text-lg leading-none">*</span>}
                </label>
                <div className="relative" ref={isActive ? dropdownRef : null}>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveDropdown(isActive ? null : name);
                            setFilterText("");
                        }}
                        disabled={disabled}
                        className={`w-full ${Icon ? "pl-11" : "pl-5"} pr-12 py-2.5 bg-muted-bg/30 border-2 ${error
                            ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                            : "border-border-divider/30 focus:border-primary-500 focus:ring-primary-500/10"
                            } rounded-2xl focus:outline-none focus:ring-8 transition-all text-sm font-bold text-text-primary flex items-center justify-between uppercase ${disabled ? "cursor-not-allowed opacity-40 bg-muted-bg" : "cursor-pointer"
                            }`}
                    >
                        {Icon && (
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-40 ${isActive ? 'text-primary-500 opacity-100' : ''}`}>
                                <Icon size={16} />
                            </div>
                        )}
                        <span className={!value ? 'text-text-muted/40 font-black tracking-widest uppercase' : ''}>
                            {options?.find((opt: any) => (opt.value || opt) === value)?.label || options?.find((opt: any) => (opt.value || opt) === value) || `Select ${label}`}
                        </span>
                        {!disabled && (
                            <ChevronDown className={`w-5 h-5 text-text-muted opacity-40 transition-all ${isActive ? "text-primary-500 rotate-180" : ""}`} />
                        )}
                    </button>

                    {isActive && (
                        <div className="absolute z-[110] left-0 right-0 mt-2 bg-card/95 backdrop-blur-3xl border border-primary-500/30 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-3 border-b border-border-divider/30 bg-primary-500/5">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/40" />
                                    <input
                                        type="text"
                                        placeholder={`FILTER ${label.toUpperCase()}...`}
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                        className="w-full bg-muted-bg/40 border-2 border-border-divider/30 rounded-xl pl-10 pr-4 py-2 text-[11px] font-black tracking-widest text-text-primary focus:outline-none focus:border-primary-500/50 uppercase"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                                {options?.filter((opt: any) => {
                                    const lbl = opt.label || opt;
                                    return lbl.toString().toLowerCase().includes(filterText.toLowerCase());
                                }).length === 0 ? (
                                    <div className="py-8 text-center" key="no-results">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">No matching results</p>
                                    </div>
                                ) : (
                                    options?.filter((opt: any) => {
                                        const lbl = opt.label || opt;
                                        return lbl.toString().toLowerCase().includes(filterText.toLowerCase());
                                    }).map((opt: any, index: number) => {
                                        const optValue = opt.value || opt;
                                        const optLabel = opt.label || opt;
                                        const isSelected = value === optValue;

                                        return (
                                            <button
                                                key={`${optValue}-${index}`}
                                                type="button"
                                                onClick={() => {
                                                    onChange({ target: { name, value: optValue } } as any);
                                                    setActiveDropdown(null);
                                                    setFilterText("");
                                                }}
                                                className={`w-full px-4 py-3 text-left text-[11px] font-black tracking-widest uppercase transition-all rounded-xl flex items-center justify-between group/opt ${isSelected
                                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                                    : 'text-text-muted hover:bg-primary-500/10 hover:text-primary-500'
                                                    }`}
                                            >
                                                {optLabel}
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in-50" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-tight ml-2 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        );
    };



    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [previewDoc, setPreviewDoc] = useState<{ url: string; type: string } | null>(null);
    const isFieldOfficer = !authService.hasPermission('dashboard.view_all_branches');
    const hasActiveLoans = (initialData as any)?.active_loans_count > 0;
    const isEditMode = !!initialData;
    const isExplicitlyUnlocked = (initialData as any)?.is_edit_locked === false;
    const requiresApproval =
        isEditMode && isFieldOfficer && hasActiveLoans && !isExplicitlyUnlocked;
    const isPendingApproval =
        (initialData as any)?.edit_request_status === "pending";

    useEffect(() => {
        loadConstants();
    }, []);

    const loadConstants = async () => {
        try {
            const data = await customerService.getConstants();
            const user = authService.getCurrentUser();
            const isFieldOfficer = !authService.hasPermission('dashboard.view_all_branches');

            if (data) {
                let finalBranches = data.branches || [];
                let finalCenters = data.centers || [];

                // 🎯 If Field Officer, restrict to their assigned centers/branches
                if (isFieldOfficer && user) {
                    // Filter centers where this FO is assigned
                    finalCenters = data.centers.filter(
                        (c: any) => c.staff_id === user.user_name
                    );

                    // Filter branches to only those that have filtered centers
                    const assignedBranchIds = [
                        ...new Set(finalCenters.map((c: any) => c.branch_id)),
                    ];

                    // Also include the user's primary branch
                    if (user.branch?.id) {
                        assignedBranchIds.push(user.branch.id);
                    }

                    finalBranches = data.branches.filter((b: any) =>
                        [...new Set(assignedBranchIds)].includes(b.id)
                    );

                    // 🔍 CRITICAL: Specifically check if the FO's primary branch is inactive
                    // (since it wouldn't be in data.branches which only returns active ones)
                    try {
                        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
                        const getHeaders = () => {
                            const token = localStorage.getItem('token');
                            return {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            };
                        };

                        const branchResponse = await fetch(`${API_BASE_URL}/staffs/my-assigned-branch`, {
                            headers: getHeaders(),
                        }).then((res) => res.json());

                        if (branchResponse.data) {
                            const assignedBranch = branchResponse.data;
                            if (assignedBranch.status && assignedBranch.status !== 'active') {
                                setIsBranchInactive(true);
                                setInactiveBranchName(assignedBranch.branch?.branch_name || "Your Assigned Branch");

                                // Ensure the inactive branch is at least in the list so the UI can show the name
                                if (assignedBranch.branch && !finalBranches.find((b: any) => b.id === assignedBranch.branch_id)) {
                                    finalBranches = [assignedBranch.branch, ...finalBranches];
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to check assigned branch status", e);
                    }

                    // Auto-select if there's only one branch OR if no branch is selected, pick the user's primary branch
                    if (!formData.branch_id && !initialData) {
                        const autoSelectBranch = finalBranches.length === 1
                            ? finalBranches[0]
                            : finalBranches.find((b: any) => b.id === user.branch?.id) || finalBranches[0];

                        if (autoSelectBranch) {
                            setFormData((prev) => ({
                                ...prev,
                                branch_id: autoSelectBranch.id,
                            }));
                            setFilteredCenters(
                                finalCenters.filter(
                                    (c: any) =>
                                        c.branch_id === autoSelectBranch.id && c.status === "active"
                                )
                            );
                        }
                    }
                }

                setConstants({
                    ...data,
                    branches: finalBranches,
                    province_districts_map: data.province_districts_map,
                    centers: data.centers, // Keep all in master constants but filtered in UI state
                });

                // Check if current/selected branch is inactive
                const checkBranchId = initialData?.branch_id || (finalBranches.length === 1 ? finalBranches[0].id : null);
                if (checkBranchId) {
                    const branch = finalBranches.find((b: any) => b.id === checkBranchId);
                    if (branch && branch.status && branch.status !== 'active') {
                        setIsBranchInactive(true);
                        setInactiveBranchName(branch.branch_name);
                    }
                }

                if (initialData?.province && data.province_districts_map) {
                    setFilteredDistricts(
                        data.province_districts_map[initialData.province] || []
                    );
                }

                // Initial filtering for centers dropdown
                if (initialData?.branch_id && data.centers) {
                    let centersToFilter = isFieldOfficer ? finalCenters : data.centers;
                    setFilteredCenters(
                        centersToFilter.filter(
                            (c: any) =>
                                c.branch_id === initialData.branch_id && c.status === "active"
                        )
                    );
                } else if (isFieldOfficer && finalBranches.length === 1) {
                    setFilteredCenters(
                        finalCenters.filter(
                            (c: any) =>
                                c.branch_id === finalBranches[0].id && c.status === "active"
                        )
                    );
                }
            }
        } catch (error) {
            console.error("Failed to load constants", error);
        }
    };

    // 🌍 Dependent logic for Province -> District (Option 1: Watch State)
    useEffect(() => {
        if (formData.province && constants?.province_districts_map) {
            const districts = constants.province_districts_map[formData.province] || [];
            setFilteredDistricts(districts);

            setFormData(prev => {
                if (prev.district && !districts.includes(prev.district)) {
                    return { ...prev, district: "" };
                }
                return prev;
            });
        }
    }, [formData.province, constants?.province_districts_map]);

    // 🕵️ Real-time Duplicate NIC Checker (GLOBAL - Cross Branch/Officer)
    useEffect(() => {
        const checkDuplicate = async () => {
            if (
                formData.customer_code &&
                formData.customer_code.length >= 10 &&
                /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(formData.customer_code)
            ) {
                try {
                    // 🌍 Use Global Verification (bypasses security filters for this check)
                    const result = await customerService.verifyNICGlobal(
                        formData.customer_code,
                        (initialData as any)?.id as unknown as number
                    );

                    if (result.exists) {
                        const ownerInfo = result.data?.is_same_officer
                            ? "already registered under YOU."
                            : `registered in ${result.data?.branch_name} under ${result.data?.officer_name}.`;

                        setFieldErrors(prev => ({
                            ...prev,
                            customer_code: `STOP: ${result.data?.customer_name} is ${ownerInfo}`
                        }));
                    } else {
                        setFieldErrors(prev => {
                            // Only clear the error if it was a "registered" duplicate error
                            if (prev.customer_code?.includes("registered")) {
                                return { ...prev, customer_code: "" };
                            }
                            return prev;
                        });
                    }
                } catch (error) {
                    console.error("Global NIC check failed", error);
                }
            }
        };

        const timer = setTimeout(checkDuplicate, 600);
        return () => clearTimeout(timer);
    }, [formData.customer_code, (initialData as any)?.id]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;
        let val: any = value;

        if (
            name === "branch_id" ||
            name === "center_id" ||
            name === "grp_id" ||
            type === "number"
        ) {
            val = value === "" ? undefined : parseInt(value);
        } else if (type === "checkbox") {
            val = (e.target as HTMLInputElement).checked;
        }

        // 🔒 Status Validation: Cannot change status if in a group
        if (name === "status" && val !== "active" && (formData.grp_id || (initialData as any)?.grp_id)) {
            toast.error("Cannot block/disable customer while assigned to a group. Remove from group first.");
            return;
        }

        // 📱 Phone Number Formatting (077-777-7777)
        if (["mobile_no_1", "mobile_no_2", "telephone"].includes(name)) {
            val = formatPhoneNumber(value);
        }

        setFormData((prev) => ({ ...prev, [name]: val }));

        // 🔒 GENDER & CENTER MISMATCH VALIDATION
        if (name === "center_id" && val && (formData.gender === "Male" || (formData as any).gender === "Male")) {
            toast.error("Center assignment failed: Centers can only be assigned to female customers.");
            setFormData(prev => ({ ...prev, center_id: undefined }));
            return;
        }

        if (name === "gender" && val === "Male" && formData.center_id) {
            toast.warning("Center linkage removed: Centers can only be assigned to female customers.");
            setFormData(prev => ({ ...prev, center_id: undefined }));
        }

        // 🧠 Auto-fill Name Fields (Requirement: Full Name and Name with Initials)
        if (name === "first_name" || name === "last_name") {
            const firstName = name === "first_name" ? val : (formData.first_name || "");
            const lastName = name === "last_name" ? val : (formData.last_name || "");

            const fullName = formatFullName(firstName, lastName);
            const nameWithInitials = formatNameWithInitials(firstName, lastName);

            setFormData(prev => ({
                ...prev,
                full_name: fullName,
                initials: nameWithInitials
            }));

            // Clear errors for auto-filled fields
            setFieldErrors(prev => ({
                ...prev,
                full_name: "",
                initials: ""
            }));
        }

        // ✅ Real-time Field Validation
        const errors = { ...fieldErrors };

        if (name === "family_members_count") {
            const count = typeof val === "string" ? parseInt(val, 10) : Number(val);
            if (val !== undefined && val !== null && (isNaN(count) || count < 1 || count > 20)) {
                errors.family_members_count = "1-20 members";
            } else {
                delete errors.family_members_count;
            }
        } else if (name === "full_name") {
            if (val.trim().length < 3) errors.full_name = "Too short";
            else if (!/^[a-zA-Z\s.]+$/.test(val)) errors.full_name = "Letters only";
            else delete errors.full_name;
        } else if (name === "customer_code_confirmation") {
            if (val && val !== formData.customer_code) errors.customer_code_confirmation = "NIC mismatch";
            else delete errors.customer_code_confirmation;
        } else if (["first_name", "last_name", "initials", "spouse_name"].includes(name)) {
            if (!val.trim()) errors[name] = "Required";
            else if (!/^[a-zA-Z\s.]+$/.test(val)) errors[name] = "Letters only";
            else delete errors[name];
        } else if (name === "mobile_no_1") {
            if (!/^0\d{2}-\d{3}-\d{4}$/.test(val)) errors.mobile_no_1 = "Invalid format (07X-XXX-XXXX)";
            else delete errors.mobile_no_1;
        } else if (fieldErrors[name]) {
            delete errors[name];
        }

        setFieldErrors(errors);

        // Dependent logic for Branch -> Center
        if (name === "branch_id") {
            const branchId = parseInt(value);
            const user = authService.getCurrentUser();
            const isFieldOfficer = !authService.hasPermission('dashboard.view_all_branches');

            if (constants?.centers) {
                let centersToFilter = constants.centers;
                if (isFieldOfficer && user) {
                    centersToFilter = constants.centers.filter(
                        (c: any) => c.staff_id === user.user_name
                    );
                }
                setFilteredCenters(
                    centersToFilter.filter(
                        (c: any) => c.branch_id === branchId && c.status === "active"
                    )
                );
            } else {
                setFilteredCenters([]);
            }
            setFormData((prev) => ({
                ...prev,
                branch_id: branchId,
                center_id: undefined,
            }));

            // Check if the selected branch is inactive
            const selectedBranch = constants?.branches?.find((b: any) => b.id === branchId);
            if (selectedBranch && selectedBranch.status && selectedBranch.status !== 'active') {
                setIsBranchInactive(true);
                setInactiveBranchName(selectedBranch.branch_name);
            } else {
                setIsBranchInactive(false);
            }
        }

        // 🧠 Auto-detect Gender, DOB and Age from NIC (Requirement 3)
        if (name === "customer_code" || name === "customer_code_confirmation") {
            const currentCode = name === "customer_code" ? val : formData.customer_code;
            const currentConf = name === "customer_code_confirmation" ? val : formData.customer_code_confirmation;

            // Immediate Format Validation
            if (name === "customer_code") {
                if (currentCode && !/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(currentCode)) {
                    // Only show error if length is significant or user stopped typing? 
                    // Showing immediately might be annoying if starting to type, but requested "immedietly".
                    // Let's show if length > 5 to be slightly less annoying, or just show it.
                    // User said "immedietly".
                    setFieldErrors(prev => ({ ...prev, customer_code: "Invalid NIC Format (9V/X or 12 digits)" }));
                } else {
                    setFieldErrors(prev => ({ ...prev, customer_code: "" }));
                }
            }

            if (currentCode && currentCode === currentConf) {
                const extractedData = nicService.parseNIC(currentCode);
                if (extractedData) {
                    setFormData((prev) => ({
                        ...prev,
                        gender: extractedData.gender,
                        date_of_birth: extractedData.dob,
                        age: extractedData.age
                    }));

                    // 🔒 GENDER & CENTER MISMATCH VALIDATION (from NIC)
                    if (extractedData.gender === "Male" && formData.center_id) {
                        toast.warning("Center linkage removed: Centers can only be assigned to female customers.");
                        setFormData(prev => ({ ...prev, center_id: undefined }));
                    }

                    // Clear errors if they were set
                    setFieldErrors(prev => ({
                        ...prev,
                        customer_code: "",
                        customer_code_confirmation: "",
                        gender: "",
                        date_of_birth: ""
                    }));

                }
            } else if (currentCode && currentConf && currentCode !== currentConf) {
                setFieldErrors(prev => ({ ...prev, customer_code_confirmation: "NIC numbers do not match" }));
            } else if (!currentCode) {
                // Clear auto-detected fields when NIC is removed
                setFormData((prev) => ({
                    ...prev,
                    gender: undefined,
                    date_of_birth: "",
                    age: undefined
                }));
            }
        }

    };


    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validate = () => {
        const errors: Record<string, string> = {};

        // Helper: Alphabetical only (allows spaces, dots, and hyphens)
        const isAlphabetical = (val: string) => /^[a-zA-Z\s.-]+$/.test(val);

        // Helper: Valid SL Phone (starts with 0, 10 digits with mask 07X-XXX-XXXX)
        const isValidPhone = (val: string) => /^0\d{2}-\d{3}-\d{4}$/.test(val);

        // Required Product / Location Details
        if (!formData.branch_id) errors.branch_id = "Branch is required";
        // center_id is now optional
        if (!formData.title) errors.title = "Title is required";

        if (!formData.full_name?.trim()) {
            errors.full_name = "Full name is required";
        } else if (!isAlphabetical(formData.full_name)) {
            errors.full_name = "Letters only";
        } else if (formData.full_name.trim().length < 3) {
            errors.full_name = "Too short";
        }

        if (!formData.initials?.trim()) {
            errors.initials = "Initials are required";
        } else if (!isAlphabetical(formData.initials)) {
            errors.initials = "Letters only";
        }

        if (!formData.first_name?.trim()) {
            errors.first_name = "Required";
        } else if (!isAlphabetical(formData.first_name)) {
            errors.first_name = "Letters only";
        }

        if (!formData.last_name?.trim()) {
            errors.last_name = "Required";
        } else if (!isAlphabetical(formData.last_name)) {
            errors.last_name = "Letters only";
        }

        if (!formData.customer_code?.trim()) {
            errors.customer_code = "NIC is required";
        } else {
            const nic = formData.customer_code.trim();
            if (!/^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(nic)) {
                errors.customer_code = "Invalid NIC format";
            } else if (formData.customer_code !== formData.customer_code_confirmation) {
                errors.customer_code_confirmation = "NIC numbers must match";
            } else {
                const extracted = nicService.parseNIC(nic);
                if (!extracted) {
                    errors.customer_code = "Could not parse NIC";
                }
            }
        }

        if (!formData.date_of_birth) {
            errors.date_of_birth = "Required";
        } else {
            const dobDate = new Date(formData.date_of_birth);
            const today = new Date();
            if (dobDate > today) {
                errors.date_of_birth = "Cannot be in future";
            } else {
                const age = calculateAge(formData.date_of_birth);
                if (age < 18) errors.date_of_birth = "Min 18 years";
                if (age > 65) errors.date_of_birth = "Max 65 years";
            }
        }

        if (!formData.gender) errors.gender = "Gender is required";
        if (formData.gender === "Male" && formData.center_id) {
            errors.center_id = "Males cannot be linked to centers";
            toast.error("Center assignment is restricted to female customers only.");
        }
        if (!formData.religion) errors.religion = "Religion is required";
        if (!formData.civil_status) {
            errors.civil_status = "Status is required";
        } else if (formData.civil_status === 'Married' && !formData.spouse_name?.trim()) {
            errors.spouse_name = "Required for Married";
        }

        if (formData.spouse_name?.trim() && !isAlphabetical(formData.spouse_name)) {
            errors.spouse_name = "Letters only";
        }

        // Required Contact
        if (!formData.mobile_no_1?.trim()) {
            errors.mobile_no_1 = "Required";
        } else if (!isValidPhone(formData.mobile_no_1)) {
            errors.mobile_no_1 = "Format: 0XX-XXX-XXXX";
        }

        // Optional format validations
        if (formData.mobile_no_2?.trim() && !isValidPhone(formData.mobile_no_2)) {
            errors.mobile_no_2 = "Format: 0XX-XXX-XXXX";
        }
        if (formData.telephone?.trim() && !isValidPhone(formData.telephone)) {
            errors.telephone = "Format: 0XX-XXX-XXXX";
        }
        if (
            formData.business_email?.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)
        ) {
            errors.business_email = "Invalid email";
        }

        // Required Address
        if (!formData.address_line_1?.trim()) {
            errors.address_line_1 = "Required";
        } else if (formData.address_line_1.trim().length < 5) {
            errors.address_line_1 = "Min 5 characters";
        }

        if (!formData.city?.trim()) errors.city = "City is required";
        if (!formData.province) errors.province = "Province is required";
        if (!formData.district) errors.district = "District is required";

        if (!formData.gs_division?.trim()) {
            errors.gs_division = "Required";
        } else if (formData.gs_division.trim().length < 3) {
            errors.gs_division = "Min 3 characters";
        }

        // Numeric Ranges
        if (
            formData.family_members_count !== undefined &&
            formData.family_members_count !== null
        ) {
            const count = Number(formData.family_members_count);
            if (isNaN(count) || !Number.isInteger(count) || count < 1 || count > 20) {
                errors.family_members_count = "1-20 (integer)";
            }
        }

        if (formData.monthly_income !== undefined && formData.monthly_income !== null) {
            const income = Number(formData.monthly_income);
            if (income < 0) {
                errors.monthly_income = "Cannot be negative";
            } else if (income > 10000000) {
                errors.monthly_income = "Max 10 million";
            }
        }

        if (formData.no_of_employees !== undefined && formData.no_of_employees !== null) {
            const empCount = Number(formData.no_of_employees);
            if (empCount < 0) {
                errors.no_of_employees = "Cannot be negative";
            } else if (empCount > 5000) {
                errors.no_of_employees = "Max 5000";
            }
        }

        // Business Register Number format (basic alphanumeric check)
        if (formData.register_number?.trim()) {
            if (!/^[a-zA-Z0-9/-]+$/.test(formData.register_number)) {
                errors.register_number = "Alphanumeric only";
            }
        }

        // Documentation Validation
        if (!formData.nic_copy_image) {
            errors.nic_copy_image = "NIC Copy is required";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please complete all required fields correctly");
            return;
        }

        setLoading(true);
        try {
            // Sanitize phone numbers before submission
            const submissionData = {
                ...formData,
                mobile_no_1: formData.mobile_no_1?.replace(/\D/g, ""),
                mobile_no_2: formData.mobile_no_2?.replace(/\D/g, ""),
                telephone: formData.telephone?.replace(/\D/g, ""),
            };
            await onSubmit(submissionData as CustomerFormData);
            toast.success(
                initialData
                    ? "Customer profile updated successfully!"
                    : "Customer profile finalized successfully!"
            );
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to save customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
            <div className="bg-card rounded-[3.5rem] max-w-5xl w-full shadow-2xl border border-border-default flex flex-col h-full max-h-[95vh] overflow-hidden transform transition-all">
                {/* Header */}
                <div className="p-7 border-b border-border-divider/30 flex items-center justify-between bg-card/80 backdrop-blur-3xl sticky top-0 z-20">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-text-primary tracking-tighter flex items-center gap-4 uppercase">
                            {initialData ? "Edit Profile" : "New Customer"}
                            {!initialData && (
                                <span className="px-4 py-1.5 bg-primary-500/10 text-primary-500 text-[10px] rounded-full uppercase tracking-widest font-black ring-1 ring-primary-500/20 shadow-lg shadow-primary-500/5">
                                    Active Draft
                                </span>
                            )}
                            {isPendingApproval && (
                                <span className="px-4 py-1.5 bg-amber-500/10 text-amber-500 text-[10px] rounded-full uppercase tracking-widest font-black ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5">
                                    Pending Approval
                                </span>
                            )}
                        </h2>
                        <p className="text-[10px] text-text-muted font-black tracking-[0.3em] uppercase opacity-40">
                            Core CRM Portal • Registration Workspace
                        </p>
                        {requiresApproval && !isPendingApproval && (
                            <div className="flex items-center gap-2 bg-primary-500/10 px-3 py-1.5 rounded-xl mt-3 inline-flex border border-primary-500/10">
                                <ShieldCheck size={12} className="text-primary-500" />
                                <p className="text-[9px] text-primary-500 font-black uppercase tracking-widest">
                                    This customer has active loans. Edits will require Manager
                                    approval.
                                </p>
                            </div>
                        )}
                        {isPendingApproval && (
                            <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl mt-3 inline-flex border border-amber-500/10">
                                <ShieldCheck size={12} className="text-amber-500" />
                                <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">
                                    ⚠️ A change request is already pending for this customer.                                </p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-muted-bg/50 hover:bg-rose-500/10 hover:text-rose-500 rounded-[2rem] transition-all text-text-muted group border border-border-divider/30"
                    >
                        <X
                            size={24}
                            className="group-hover:rotate-90 transition-transform duration-500 ease-out"
                        />
                    </button>
                </div>

                {/* Main Form Area */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 scroll-smooth custom-scrollbar bg-card"
                >
                    {isBranchInactive && (
                        <div className="p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-[2rem] flex items-start gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-500 shadow-xl shadow-amber-500/10">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Branch Inactive Block</h4>
                                <p className="text-[11px] text-amber-500/80 font-bold uppercase tracking-widest leading-relaxed">
                                    The selected branch <span className="text-amber-500 underline underline-offset-4 decoration-2">"{inactiveBranchName}"</span> is currently inactive.
                                    <span className="block mt-2 opacity-60">Customer registration and profile updates are disabled for inactive branches.</span>
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Main Type & Location Section */}
                    <div className="bg-primary-500/5 p-3 lg:p-4 rounded-[2rem] border border-primary-500/10 space-y-1 relative">
                        {/* Decoration Layer */}
                        <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        </div>


                        {!isEditMode && (
                            <div className="relative z-10">
                                <label className="text-[10px] font-black text-primary-500 uppercase tracking-[0.4em] mb-1.5 block opacity-90">II. Location Assignment</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FormInput
                                        label="Branch"
                                        name="branch_name"
                                        value={constants?.branches?.find((b: any) => b.id === formData.branch_id)?.branch_name || "Loading..."}
                                        readOnly={true}
                                        required
                                        error={fieldErrors.branch_id}
                                        icon={MapPin}
                                    />
                                    <FormSelect
                                        label="Center (Optional)"
                                        name="center_id"
                                        options={
                                            filteredCenters?.map((c: any) => ({
                                                value: c.id,
                                                label: c.center_name,
                                            })) || []
                                        }
                                        error={fieldErrors.center_id}
                                        icon={Building}
                                        value={formData.center_id}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <SectionHeader icon={User} title="Personal Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                            <FormSelect
                                label="Title"
                                name="title"
                                options={["Mr", "Mrs", "Miss", "Ms", "Dr", "Rev"]}
                                required
                                error={fieldErrors.title}
                                icon={User}
                                value={formData.title}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="First Name"
                                name="first_name"
                                placeholder="Primary naming"
                                required
                                error={fieldErrors.first_name}
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Last Name"
                                name="last_name"
                                placeholder="Surname"
                                required
                                error={fieldErrors.last_name}
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Initials"
                                name="initials"
                                placeholder="e.g. W.M."
                                required
                                error={fieldErrors.initials}
                                value={formData.initials}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Full Name"
                                name="full_name"
                                placeholder="As per Identity Document"
                                required
                                error={fieldErrors.full_name}
                                value={formData.full_name}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="NIC Number"
                                name="customer_code"
                                placeholder="9 digits + V/X or 12 digits"
                                required
                                error={fieldErrors.customer_code}
                                icon={ShieldCheck}
                                value={formData.customer_code}
                                onChange={handleChange}
                                onPaste={(e: React.ClipboardEvent) => e.preventDefault()}
                            />
                            <FormInput
                                label="Confirm NIC Number"
                                name="customer_code_confirmation"
                                placeholder="Re-enter NIC"
                                required
                                error={fieldErrors.customer_code_confirmation}
                                icon={CheckCircle2}
                                value={formData.customer_code_confirmation}
                                onChange={handleChange}
                                onPaste={(e: React.ClipboardEvent) => e.preventDefault()}
                            />
                            <FormInput
                                label="Date of Birth"
                                name="date_of_birth"
                                type="date"
                                required
                                readOnly={true}
                                error={fieldErrors.date_of_birth}
                                icon={Calendar}
                                value={formData.date_of_birth}
                                onChange={handleChange}
                            />
                            <FormSelect
                                label="Gender"
                                name="gender"
                                options={["Male", "Female", "Other"]}
                                required
                                error={fieldErrors.gender}
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={true}
                            />
                            <FormInput
                                label="Age"
                                name="age"
                                type="number"
                                readOnly={true}
                                placeholder="Auto-calculated"
                                value={formData.age}
                                onChange={handleChange}
                                error={formData.age && (formData.age < 18 || formData.age > 65) ? "Outside loan eligibility range" : ""}
                            />
                            <FormSelect
                                label="Civil Status"
                                name="civil_status"
                                options={["Single", "Married", "Divorced", "Widowed"]}
                                required
                                error={fieldErrors.civil_status}
                                icon={Heart}
                                value={formData.civil_status}
                                onChange={handleChange}
                            />
                            <FormSelect
                                label="Religion"
                                name="religion"
                                options={
                                    constants?.religions || [
                                        "Hinduism",
                                        "Christianity",
                                        "Islam",
                                        "Buddhism",
                                        "Other",
                                    ]
                                }
                                required
                                error={fieldErrors.religion}
                                value={formData.religion}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Spouse Name"
                                name="spouse_name"
                                placeholder={formData.civil_status === 'Married' ? "Enter spouse's full name" : "If applicable"}
                                colSpan={2}
                                value={formData.spouse_name}
                                onChange={handleChange}
                                required={formData.civil_status === 'Married'}
                                error={fieldErrors.spouse_name}
                            />
                            <FormInput
                                label="Family Members"
                                name="family_members_count"
                                type="number"
                                placeholder="Count"
                                error={fieldErrors.family_members_count}
                                value={formData.family_members_count}
                                onChange={handleChange}
                                min={1}
                                max={20}
                            />
                            <FormInput
                                label="Monthly Income (LKR)"
                                name="monthly_income"
                                type="number"
                                placeholder="0.00"
                                icon={Landmark}
                                error={fieldErrors.monthly_income}
                                value={formData.monthly_income}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Contact & Address */}
                    <div className="bg-muted-bg/10 p-6 lg:p-8 rounded-3xl border border-border-divider/30">
                        <SectionHeader icon={MessageSquare} title="Contact & Address" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                            <FormInput
                                label="Primary Mobile"
                                name="mobile_no_1"
                                placeholder="077-XXX-XXXX"
                                icon={Phone}
                                required
                                error={fieldErrors.mobile_no_1}
                                value={formData.mobile_no_1}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Secondary Mobile"
                                name="mobile_no_2"
                                placeholder="07X-XXX-XXXX (Optional)"
                                icon={Phone}
                                error={fieldErrors.mobile_no_2}
                                value={formData.mobile_no_2}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Fixed Line"
                                name="telephone"
                                placeholder="0XX-XXX-XXXX (Optional)"
                                icon={Phone}
                                error={fieldErrors.telephone}
                                value={formData.telephone}
                                onChange={handleChange}
                            />
                            <div className="md:col-span-3">
                                <FormInput
                                    label="Address Line 1"
                                    name="address_line_1"
                                    placeholder="House No, Street Name"
                                    required
                                    error={fieldErrors.address_line_1}
                                    value={formData.address_line_1}
                                    onChange={handleChange}
                                />
                            </div>
                            <FormInput
                                label="Address Line 2"
                                name="address_line_2"
                                placeholder="Locality"
                                value={formData.address_line_2}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Address Line 3"
                                name="address_line_3"
                                placeholder="Additional info"
                                value={formData.address_line_3}
                                onChange={handleChange}
                            />
                            <GsDivisionSearch
                                label="Grama Sevaka Division"
                                value={formData.gs_division || ""}
                                gs_division_id={(formData as any).gs_division_id || null}
                                required
                                error={fieldErrors.gs_division}
                                onChange={(division) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        gs_division: division.name,
                                        gs_division_id: division.id,
                                        ...(division.province ? { province: division.province } : {})
                                    }));
                                    // Clear error when field changes
                                    if (division.name) {
                                        setFieldErrors(prev => ({ ...prev, gs_division: "" }));
                                    }
                                }}
                            />
                            <FormSelect
                                label="Province"
                                name="province"
                                options={constants?.provinces || []}
                                required
                                error={fieldErrors.province}
                                value={formData.province}
                                onChange={handleChange}
                            />
                            <FormSelect
                                label="District"
                                name="district"
                                options={
                                    filteredDistricts.length > 0
                                        ? filteredDistricts
                                        : constants?.districts || []
                                }
                                required
                                error={fieldErrors.district}
                                value={formData.district}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="City"
                                name="city"
                                placeholder="Enter city"
                                required
                                error={fieldErrors.city}
                                value={formData.city}
                                onChange={handleChange}
                            />
                            <FormInput
                                label="Country"
                                name="country"
                                value={formData.country}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Documentation & Profile */}
                    <div className="bg-muted-bg/10 p-6 lg:p-8 rounded-3xl border border-border-divider/30">
                        <SectionHeader icon={Camera} title="Documentation & Profile" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Profile Image Upload */}
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-3 opacity-60">
                                    <Camera size={16} className="text-primary-500" />
                                    Customer Photo <span className="text-[9px] text-text-muted/40 font-black lowercase tracking-normal italic">(Optional)</span>
                                </label>
                                <div className="flex items-center gap-8">
                                    <div className="relative group/photo">
                                        <div className="w-28 h-28 rounded-3xl bg-muted-bg/30 border-2 border-dashed border-border-divider/50 overflow-hidden flex items-center justify-center transition-all group-hover/photo:border-primary-500/50 bg-card shadow-inner">
                                            {formData.customer_profile_image || (isEditMode && (initialData as any)?.id) ? (
                                                <SecureImage
                                                    src={formData.customer_profile_image?.startsWith('data:')
                                                        ? formData.customer_profile_image
                                                        : `${API_BASE_URL}/media/customers/${(initialData as any)?.id}?type=profile`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                                                    fallbackName={formData.full_name}
                                                />
                                            ) : (
                                                <User size={48} className="text-text-muted opacity-10" />
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 p-3 bg-primary-600 text-white rounded-2xl shadow-2xl shadow-primary-500/40 cursor-pointer hover:bg-primary-500 transition-all hover:scale-110 active:scale-95 border-2 border-card">
                                            <Camera size={18} />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        // Requirement: Max size 1MB
                                                        if (file.size > 1 * 1024 * 1024) {
                                                            alert("Profile photo size exceeds 1MB limit.");
                                                            e.target.value = ""; // Reset input
                                                            return;
                                                        }
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setFormData(prev => ({ ...prev, customer_profile_image: reader.result as string }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-30">Protocol Requirement</p>
                                        <p className="text-[10px] text-text-muted font-bold leading-relaxed">High-resolution portrait required for neural verification.</p>
                                        {formData.customer_profile_image?.startsWith('data:') && (
                                            <div className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-500/10 rounded-lg w-fit">
                                                <CheckCircle2 size={10} className="text-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">New Photo Selected</span>
                                            </div>
                                        )}
                                        {formData.customer_profile_image && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, customer_profile_image: '' }))}
                                                className="text-[9px] text-rose-500 font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity flex items-center gap-1"
                                            >
                                                <X size={10} /> Remove Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* NIC Copy Upload */}
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-3 opacity-60">
                                    <FileText size={16} className="text-primary-500" />
                                    NIC Front Copy <span className="text-rose-500 text-lg leading-none">*</span>
                                </label>
                                <div
                                    className={`relative group h-28 rounded-3xl border-2 border-dashed ${fieldErrors.nic_copy_image ? 'border-rose-500/50 bg-rose-500/5' : 'border-border-divider/50 bg-muted-bg/20'} flex flex-col items-center justify-center transition-all hover:border-primary-500/50 cursor-pointer overflow-hidden bg-card shadow-inner`}
                                    onClick={() => document.getElementById('nic-upload')?.click()}
                                >
                                    {formData.nic_copy_image || formData.nic_image_url ? (
                                        <div className="w-full h-full flex items-center justify-between px-8 bg-primary-500/5">
                                            <div className="flex items-center gap-5">
                                                <div className="p-3 bg-primary-500/10 rounded-2xl text-primary-500 shadow-lg shadow-primary-500/5">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Document Encrypted</span>
                                                    {(formData.nic_image_url || (isEditMode && (initialData as any)?.id)) && !formData.nic_copy_image?.startsWith('data:') && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewDoc({
                                                                    url: `${API_BASE_URL}/media/customers/${(initialData as any)?.id}?type=nic`,
                                                                    type: 'NIC Copy'
                                                                });
                                                            }}
                                                            className="text-[9px] text-primary-500 hover:opacity-70 font-black uppercase tracking-widest mt-1 underline"
                                                        >
                                                            View Document
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <CheckCircle2 size={16} className="text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-primary-500/5 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                                                <FileText size={20} className="text-text-muted opacity-20 group-hover:text-primary-500 group-hover:opacity-100" />
                                            </div>
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-30 group-hover:opacity-60 transition-opacity">Submit Certificate copy</span>
                                        </div>
                                    )}
                                    <input
                                        id="nic-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                // Requirement: Max size 1MB
                                                if (file.size > 1 * 1024 * 1024) {
                                                    alert("NIC image size exceeds 1MB limit.");
                                                    e.target.value = ""; // Reset input
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData(prev => ({ ...prev, nic_copy_image: reader.result as string }));
                                                    setFieldErrors(prev => ({ ...prev, nic_copy_image: '' }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                                {fieldErrors.nic_copy_image && (
                                    <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest ml-3 animate-pulse">{fieldErrors.nic_copy_image}</p>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Extra Status for Edit Mode */}
                    {initialData && (
                        <div className="pt-10 border-t border-border-divider/30">
                            <div className="max-w-xs">
                                <FormSelect
                                    label="Customer Status"
                                    name="status"
                                    options={constants?.statuses || ["active", "blocked"]}
                                    colSpan={1}
                                    value={formData.status}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}
                </form>

                {/* Sticky Footer */}
                <div className="p-7 border-t border-border-divider/30 flex items-center justify-end gap-6 bg-card/95 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-10 py-4 text-[11px] font-black text-text-muted hover:bg-muted-bg/50 rounded-2xl transition-all uppercase tracking-[0.2em] disabled:opacity-20 active:scale-95"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || isPendingApproval || isBranchInactive}
                        className={`flex items-center gap-4 px-14 py-3.5 ${isPendingApproval || isBranchInactive
                            ? "bg-muted-bg grayscale text-text-muted border-transparent"
                            : requiresApproval
                                ? "bg-primary-500/10 backdrop-blur-xl border border-primary-500/20 text-primary-600 hover:bg-primary-600 hover:text-white"
                                : "bg-primary-600 hover:bg-primary-500 text-white border-transparent"
                            } rounded-[2rem] transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl ${isPendingApproval || isBranchInactive ? '' : requiresApproval ? 'shadow-primary-500/10' : 'shadow-primary-500/40'} active:scale-95 disabled:opacity-20 disabled:pointer-events-none`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>
                                    {requiresApproval ? "Submitting..." : "Verifying..."}
                                </span>
                            </>
                        ) : (
                            <>
                                {requiresApproval ? (
                                    <ShieldCheck size={20} />
                                ) : (
                                    <CheckCircle2 size={20} />
                                )}
                                <span>
                                    {isPendingApproval
                                        ? "Request Pending"
                                        : requiresApproval
                                            ? "Submit for Approval"
                                            : initialData
                                                ? "Update Record"
                                                : "Finalize Profile"}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {previewDoc && (
                <DocumentPreviewModal
                    url={previewDoc.url}
                    type={previewDoc.type}
                    onClose={() => setPreviewDoc(null)}
                    isSecure={true}
                />
            )}
        </div>
    );
}
