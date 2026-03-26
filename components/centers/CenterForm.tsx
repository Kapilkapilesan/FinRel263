import React, { useState, useEffect, useRef } from "react";
import { Center, CenterFormData, ScheduleItem } from "../../types/center.types";
import { Branch } from "../../types/branch.types";
import { Staff } from "../../types/staff.types";
import { branchService } from "../../services/branch.service";
import { centerService } from "../../services/center.service";
import { authService } from "../../services/auth.service";
import { API_BASE_URL, getHeaders } from "../../services/api.config";
import { X, Plus, Trash2, Loader2, Info } from "lucide-react";
import { colors } from "../../themes/colors";

interface CenterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CenterFormData) => void;
  initialData?: Center | CenterFormData | null;
}

export function CenterForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CenterFormProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [centerName, setCenterName] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [centerNameDuplicateError, setCenterNameDuplicateError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [noBranchAssigned, setNoBranchAssigned] = useState(false);
  const [isBranchInactive, setIsBranchInactive] = useState(false);
  const [inactiveBranchName, setInactiveBranchName] = useState("");
  const duplicateCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user role
  useEffect(() => {
    const storedRolesStr = localStorage.getItem("roles");
    if (storedRolesStr) {
      try {
        const userRoles = JSON.parse(storedRolesStr);
        if (Array.isArray(userRoles) && userRoles.length > 0) {
          const roles = userRoles.map((r: any) => r.name);
          if (roles.includes("field_officer")) {
            setCurrentUserRole("field_officer");
          } else if (roles.includes("super_admin")) {
            setCurrentUserRole("super_admin");
          } else if (roles.includes("admin")) {
            setCurrentUserRole("admin");
          } else {
            setCurrentUserRole(roles[0]);
          }
        }
      } catch (e) {
        console.error("Error parsing roles", e);
      }
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Error parsing user", e);
      }
    }
  }, []);

  // Load form data only when opened and wait for it
  useEffect(() => {
    // Load user role from localStorage
    const storedRolesStr = localStorage.getItem("roles");
    if (storedRolesStr) {
      try {
        const userRoles = JSON.parse(storedRolesStr);
        if (Array.isArray(userRoles) && userRoles.length > 0) {
          // Just take the first one or prioritize field_officer for this logic
          const roles = userRoles.map((r) => r.name);
          if (roles.includes("field_officer")) {
            setCurrentUserRole("field_officer");
          } else if (roles.includes("super_admin")) {
            setCurrentUserRole("super_admin");
          } else if (roles.includes("admin")) {
            setCurrentUserRole("admin");
          } else {
            setCurrentUserRole(roles[0]);
          }
        }
      } catch (e) {
        console.error("Error parsing roles", e);
      }
    }

    const loadFormData = async () => {
      if (!isOpen) return;

      const storedRolesStr = localStorage.getItem("roles");
      let roles: string[] = [];
      if (storedRolesStr) {
        try {
          const userRoles = JSON.parse(storedRolesStr);
          roles = userRoles.map((r: any) => r.name);
        } catch (e) {
          console.error("Error parsing roles", e);
        }
      }

      setIsLoadingData(true);
      setNoBranchAssigned(false);
      try {
        // Fetch branches, field officers, and loan products in parallel
        const [branchesData, fieldOfficersResponse, productsResponse] = await Promise.all([
          branchService.getBranchesDropdown(),
          fetch(`${API_BASE_URL}/staffs/by-role/field_officer`, {
            headers: getHeaders(),
          }).then((res) => res.json()),
          fetch(`${API_BASE_URL}/loan-products`, {
            headers: getHeaders(),
          }).then((res) => res.json()),
        ]);

        if (productsResponse?.data) {
          setLoanProducts(productsResponse.data);

          // Automatically select 'MF' product if it exists and no product is selected
          const mfProduct = productsResponse.data.find((p: any) => p.product_code === 'MF');
          if (!productId && !initialData) {
            if (mfProduct) {
              setProductId(String(mfProduct.id));
            } else if (productsResponse.data.length > 0) {
              // Fallback to first available product if MF not found
              setProductId(String(productsResponse.data[0].id));
            }
          }
        }

        let filteredBranches = branchesData || [];

        // If field officer, filter by their assigned branch
        if (roles.includes("field_officer")) {
          try {
            // Use dedicated endpoint that bypasses all permission/scoping issues
            const branchResponse = await fetch(`${API_BASE_URL}/staffs/my-assigned-branch`, {
              headers: getHeaders(),
            }).then((res) => res.json());

            const branchData = branchResponse.data;

            // Check for branch_id in the response
            if (branchData && branchData.branch_id) {
              const branchId = branchData.branch_id;

              // Use loose comparison to handle potential string/number mismatches
              const matchingBranch = filteredBranches.find(
                (b: any) => String(b.id) === String(branchId)
              );

              if (matchingBranch) {
                filteredBranches = [matchingBranch];
              } else if (branchData.branch) {
                // Fallback: If branch is not in the global list, use the one from response
                console.log('Using branch from dedicated endpoint:', branchData.branch);
                filteredBranches = [branchData.branch];
              }

              setNoBranchAssigned(false);

              // Check if the assigned branch is active
              if (branchData.status && branchData.status !== 'active') {
                setIsBranchInactive(true);
                setInactiveBranchName(branchData.branch?.branch_name || "Assigned Branch");
              } else {
                setIsBranchInactive(false);
              }
            } else {
              console.warn('No branch_id found in dedicated endpoint:', branchData);
              // If staff has no branch_id, they can't create centers
              filteredBranches = [];
              setNoBranchAssigned(true);
              setIsBranchInactive(false);
            }
          } catch (err) {
            console.error(
              "Failed to fetch assigned branch details",
              err
            );
            // Default to strictly no access on error to be safe
            filteredBranches = [];
            setNoBranchAssigned(true);
            setIsBranchInactive(false);
          }
        } else {
          setNoBranchAssigned(false);
          setIsBranchInactive(false);
        }

        setBranches(filteredBranches);

        // Handle varied API response structures for field officers
        if (fieldOfficersResponse?.data) {
          setStaffList(fieldOfficersResponse.data);
        } else if (Array.isArray(fieldOfficersResponse)) {
          setStaffList(fieldOfficersResponse);
        }
      } catch (error) {
        console.error("Failed to load form data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFormData();
  }, [isOpen]);

  // Handle initial data for schedules
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSchedules(initialData.open_days || []);
        setCenterName(initialData.center_name || "");
        setBranchId(String(initialData.branch_id || ""));
        setProductId(String(initialData.product_id || ""));

        // If editing an existing center, check if its branch is inactive
        if (branches.length > 0) {
          const currentBranch = branches.find(b => String(b.id) === String(initialData.branch_id));
          if (currentBranch && currentBranch.status && currentBranch.status !== 'active') {
            setIsBranchInactive(true);
            setInactiveBranchName(currentBranch.branch_name);
          }
        }
      } else {
        setSchedules([]);
        setCenterName("");
        setBranchId(branches.length === 1 ? String(branches[0].id) : "");
        setProductId("");
      }
      // Reset errors when modal opens/closes
      setCenterNameDuplicateError(null);
    }
  }, [isOpen, initialData, branches]);

  // Handle auto-selecting 'MF' product for new centers
  useEffect(() => {
    if (isOpen && !initialData && loanProducts.length > 0 && !productId) {
      const mfProduct = loanProducts.find((p: any) => p.product_code === 'MF');
      if (mfProduct) {
        setProductId(String(mfProduct.id));
      } else {
        // Fallback to first available product if MF not found
        setProductId(String(loanProducts[0].id));
      }
    }
  }, [isOpen, initialData, loanProducts, productId]);

  const handleAddSchedule = () => {
    // Default to today's date for new schedules
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    setSchedules([...schedules, { day: "", date: todayStr, time: "10:00" }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  // Debounced function to check for duplicate center name
  const checkDuplicateCenterName = async (name: string, branch: string) => {
    if (!name.trim() || !branch) {
      setCenterNameDuplicateError(null);
      return;
    }

    // Clear existing timeout
    if (duplicateCheckTimeoutRef.current) {
      clearTimeout(duplicateCheckTimeoutRef.current);
    }

    // Set new timeout for debouncing (500ms)
    duplicateCheckTimeoutRef.current = setTimeout(async () => {
      try {
        setIsCheckingDuplicate(true);
        const result = await centerService.checkDuplicate(
          name.trim(),
          branch,
          initialData && 'id' in initialData ? String(initialData.id) : undefined
        );

        if (result.exists) {
          setCenterNameDuplicateError(
            "A center with this name already exists in this branch. Center names must be unique within a branch."
          );
        } else {
          setCenterNameDuplicateError(null);
        }
      } catch (error) {
        console.error("Error checking duplicate:", error);
        // Don't show error on API failure, just clear any existing error
        setCenterNameDuplicateError(null);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 500);
  };

  // Handle center name change
  const handleCenterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCenterName(newName);
    if (branchId) {
      checkDuplicateCenterName(newName, branchId);
    }
  };

  // Handle branch change
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranchId = e.target.value;
    setBranchId(newBranchId);

    // Check if the selected branch is inactive
    const selectedBranch = branches.find(b => b.id === Number(newBranchId));
    if (selectedBranch && selectedBranch.status && selectedBranch.status !== 'active') {
      setIsBranchInactive(true);
      setInactiveBranchName(selectedBranch.branch_name);
    } else {
      setIsBranchInactive(false);
    }

    if (centerName.trim()) {
      checkDuplicateCenterName(centerName, newBranchId);
    }
  };

  // Handle field officer change to auto-fetch branch
  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStaffId = e.target.value;
    const selectedStaff = staffList.find(s => String(s.staff_id) === String(selectedStaffId));

    if (selectedStaff && selectedStaff.branch_id) {
      const newBranchId = String(selectedStaff.branch_id);
      setBranchId(newBranchId);
      if (centerName.trim()) {
        checkDuplicateCenterName(centerName, newBranchId);
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (duplicateCheckTimeoutRef.current) {
        clearTimeout(duplicateCheckTimeoutRef.current);
      }
    };
  }, []);

  // ... (existing code for role loading)

  const handleScheduleChange = (
    index: number,
    field: keyof ScheduleItem,
    value: string
  ) => {
    const newSchedules = [...schedules];

    if (field === "date") {
      // When date changes, automatically update the day name
      const dateObj = new Date(value);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      newSchedules[index] = {
        ...newSchedules[index],
        [field]: value,
        day: dayName,
      };
    } else {
      newSchedules[index] = { ...newSchedules[index], [field]: value };
    }

    // Immediate validation for duplicate day+time combinations
    const seen = new Set();
    let hasDuplicate = false;

    // Check for duplicates
    for (const s of newSchedules) {
      // Only check if both day and time are present to avoid false positives on empty new rows
      if (s.day && s.time) {
        const key = `${s.day}-${s.time}`;
        if (seen.has(key)) {
          hasDuplicate = true;
          break;
        }
        seen.add(key);
      }
    }

    if (hasDuplicate) {
      setDuplicateError(
        "Duplicate schedule entries (same day and time) are not allowed."
      );
    } else {
      setDuplicateError(null);
    }

    setSchedules(newSchedules);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent submission if there are duplicate errors
    if (duplicateError || centerNameDuplicateError) {
      return;
    }

    const formData = new FormData(e.currentTarget);

    const data: CenterFormData = {
      CSU_id: formData.get("CSU_id") as string,
      center_name: formData.get("center_name") as string,
      branch_id: branchId,
      product_id: formData.get("product_id") as string,
      staff_id:
        currentUserRole === "field_officer"
          ? currentUser?.user_name || null
          : (formData.get("contactPerson") as string) || null,
      address: formData.get("address") as string,
      location: formData.get("locationType") as string,
      status: !initialData
        ? currentUserRole === "field_officer"
          ? "inactive"
          : "active"
        : (initialData.status as "active" | "inactive" | "rejected"),
      open_days: schedules,
      meetingTime: schedules.length > 0 ? schedules[0].time : undefined,
    };

    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-[2.5rem] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border-default flex flex-col">
        {/* Header */}
        <div
          className="px-8 py-6 border-b border-border-divider flex items-center justify-between rounded-t-[2.5rem]"
          style={{ backgroundImage: `linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[500]}, ${colors.indigo[600]})` }}
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                {initialData ? "Edit Center" : "Initialize Center"}
              </h2>
              <p className="text-white/70 text-[8px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">Center Architecture & Governance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all group active:scale-90"
          >
            <X className="w-4 h-4 text-white transition-all group-hover:rotate-90" />
          </button>
        </div>

        {isLoadingData ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={40} className="animate-spin" style={{ color: colors.primary[600] }} />
            <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Loading form details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
              {noBranchAssigned && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-widest">No Branch Assigned</h4>
                    <p className="text-[11px] text-red-700 dark:text-red-400/70 font-medium mt-1 leading-relaxed">
                      You are not currently assigned to any branch. Center creation is restricted until a branch is assigned to your profile.
                      <span className="block mt-2 font-black uppercase underline decoration-2 underline-offset-4">Please contact your Administrator for assistance.</span>
                    </p>
                  </div>
                </div>
              )}

              {isBranchInactive && !noBranchAssigned && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Branch Inactive</h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400/70 font-medium mt-1 leading-relaxed">
                      Your assigned branch <strong>{inactiveBranchName}</strong> is currently marked as inactive.
                      <span className="block mt-2 font-black uppercase underline decoration-2 underline-offset-4">Center creation and updates are disabled for inactive branches.</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CSU ID Hidden or Commented as per user's manual edit */}
                {/* 
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CSU ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="CSU_id"
                                    required
                                    defaultValue={initialData?.CSU_id}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="e.g. C001"
                                />
                            </div> 
                            */}

                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                    Center Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="center_name"
                    required
                    value={centerName}
                    onChange={handleCenterNameChange}
                    className={`w-full px-4 py-2.5 bg-input border rounded-xl focus:ring-2 transition-all text-text-primary uppercase ${centerNameDuplicateError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-border-default focus:ring-primary-500/20"
                      }`}
                    style={!centerNameDuplicateError ? { '--tw-ring-color': colors.primary[500] } as any : {}}
                    placeholder="Enter center name"
                  />
                  {centerNameDuplicateError && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <Info size={14} />
                      {centerNameDuplicateError}
                    </p>
                  )}
                  {isCheckingDuplicate && !centerNameDuplicateError && (
                    <p className="mt-1 text-xs text-text-muted italic">
                      Checking availability...
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  {(branches.length === 1 || !!initialData) ? (
                    <div className="px-4 py-2.5 bg-input border border-border-default rounded-xl flex items-center gap-2 opacity-80 cursor-default">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary[600] }} />
                      <span className="text-sm font-bold text-text-primary uppercase">
                        {branches.find(b => String(b.id) === String(branchId))?.branch_name || 
                         (initialData && 'branch' in initialData ? initialData.branch?.branch_name : 'Loading...')}
                      </span>
                      <input type="hidden" name="branch_id" value={branchId} />
                    </div>
                  ) : (
                    <select
                      name="branch_id"
                      required
                      value={branchId}
                      onChange={handleBranchChange}
                      className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl focus:ring-2 transition-all text-text-primary outline-none uppercase"
                      style={{ '--tw-ring-color': colors.primary[500] } as any}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.branch_name}
                        </option>
                      ))}
                    </select>
                  )}
                  {initialData && (
                    <p className="mt-1 text-[10px] text-text-muted italic flex items-center gap-1">
                      <Info size={10} />
                      Branch cannot be modified for existing centers.
                    </p>
                  )}
                </div>

                {/* Loan Product - Hidden and defaulted to 'MF' as per user request */}
                <input type="hidden" name="product_id" value={productId} />

                <div>
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                    Location Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="locationType"
                    required
                    defaultValue={initialData?.location}
                    className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl focus:ring-2 transition-all text-text-primary outline-none uppercase"
                    style={{ '--tw-ring-color': colors.primary[500] } as any}
                    placeholder="e.g. Urban, Rural"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  defaultValue={initialData?.address}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl focus:ring-2 transition-all text-text-primary outline-none resize-none uppercase"
                  style={{ '--tw-ring-color': colors.primary[500] } as any}
                  placeholder="Full address of the center"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentUserRole === "field_officer" ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-text-muted uppercase tracking-widest">
                      Assigned Field Officer
                    </label>
                    <div className="px-4 py-2.5 bg-input border border-border-divider rounded-xl text-sm font-bold text-text-secondary flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary[600] }} />
                      {currentUser?.full_name ||
                        currentUser?.name ||
                        "Loading..."}
                      <span className="text-[10px] text-text-muted font-mono bg-card px-1.5 py-0.5 rounded border border-border-divider">
                        {currentUser?.user_name || "..."}
                      </span>
                    </div>
                    <input
                      type="hidden"
                      name="contactPerson"
                      value={currentUser?.user_name || ""}
                    />
                    <p className="text-[10px] italic" style={{ color: colors.primary[600] }}>
                      Self-assigned as creating officer.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5">
                      Field Officer <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="contactPerson"
                      defaultValue={initialData?.staff_id || ""}
                      onChange={handleStaffChange}
                      className="w-full px-4 py-2.5 bg-input border border-border-default rounded-xl focus:ring-2 transition-all text-text-primary outline-none uppercase"
                      style={{ '--tw-ring-color': colors.primary[500] } as any}
                      required
                    >
                      <option value="">Select Officer</option>
                      {staffList.map((staff) => (
                        <option key={staff.staff_id} value={staff.staff_id}>
                          {staff.full_name} ({staff.staff_id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {initialData && currentUserRole !== "field_officer" ? (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-tighter">
                      <Info size={14} />
                      Center Status
                    </div>
                    <p className="text-[10px] text-blue-600 mt-1">
                      Status management is now handled via the action buttons in
                      the center table.
                    </p>
                  </div>
                ) : !initialData && currentUserRole === "field_officer" ? (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-tighter">
                      <Info size={14} />
                      Approval Required
                    </div>
                    <p className="text-[10px] text-amber-600 mt-1">
                      This center will be saved as{" "}
                      <span className="font-bold">Pending</span> and requires
                      manager activation.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="bg-table-header p-4 rounded-xl border border-border-divider">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-black text-text-muted uppercase tracking-widest">
                    Meeting Schedules
                  </label>
                  {authService.hasPermission("centers.schedule") && (
                    <button
                      type="button"
                      onClick={handleAddSchedule}
                      className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-500/20 bg-primary-500/10 transition-all hover:bg-primary-500/20"
                      style={{ color: colors.primary[600] }}
                    >
                      <Plus size={14} /> Add Schedule
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {schedules.map((schedule, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-in fade-in slide-in-from-top-1 duration-200 bg-card p-3 rounded-xl border border-border-divider"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[9px] uppercase font-black text-text-muted mb-1.5 tracking-widest">
                          Day
                        </label>
                        {!authService.hasPermission("centers.schedule") ? (
                          <input
                            type="text"
                            value={schedule.day}
                            readOnly
                            className="w-full px-4 py-2 bg-input border border-border-divider rounded-lg text-text-muted outline-none font-bold cursor-default"
                          />
                        ) : (
                          <select
                            value={schedule.day}
                            onChange={(e) =>
                              handleScheduleChange(idx, "day", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-border-input rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none bg-input text-text-primary uppercase"
                            required
                          >
                            <option value="">Select Day</option>
                            {[
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ].map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="w-full sm:w-32">
                        <label className="block text-[9px] uppercase font-black text-text-muted mb-1.5 tracking-widest">
                          Time
                        </label>
                        <input
                          type="time"
                          value={schedule.time}
                          onChange={(e) =>
                            handleScheduleChange(idx, "time", e.target.value)
                          }
                          readOnly={!authService.hasPermission("centers.schedule")}
                          className={`w-full px-4 py-2 bg-input border border-border-default rounded-lg focus:ring-2 transition-all text-text-primary outline-none ${!authService.hasPermission("centers.schedule")
                            ? "opacity-50 cursor-default"
                            : ""
                            }`}
                          style={{ '--tw-ring-color': colors.primary[500] } as any}
                        />
                      </div>

                      {authService.hasPermission("centers.schedule") && (
                        <div className="pt-5 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveSchedule(idx)}
                            className="text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            title="Remove schedule"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(schedules.length === 0 ||
                    currentUserRole === "field_officer") && (
                      <div className="text-center py-4 text-text-muted text-sm italic bg-input rounded border border-dashed border-border-divider">
                        {currentUserRole === "field_officer"
                          ? "Meeting schedules are managed exclusively by Managers."
                          : "No meeting schedules configured"}
                      </div>
                    )}
                  {duplicateError && (
                    <div className="text-red-500 text-xs font-semibold mt-2 flex items-center gap-1">
                      <Info size={12} />
                      {duplicateError}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-8 border-t border-border-divider flex gap-4 justify-end bg-muted-bg/30 backdrop-blur-3xl sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 bg-transparent border border-border-divider rounded-xl hover:bg-muted transition-all font-black text-[9px] uppercase tracking-[0.25em] text-text-secondary active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!centerNameDuplicateError || isCheckingDuplicate || (noBranchAssigned && !initialData) || isBranchInactive}
                className={`px-12 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 shadow-2xl flex items-center gap-3 ${centerNameDuplicateError || isCheckingDuplicate || (noBranchAssigned && !initialData) || isBranchInactive
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-primary-600 text-white shadow-primary-500/40 hover:bg-primary-500 hover:shadow-primary-500/60"
                  }`}
              >
                {initialData
                  ? initialData.status === "rejected"
                    ? "Resubmit Request"
                    : "Update Center"
                  : "Create Center"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
