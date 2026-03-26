import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SecureImage } from '../common/SecureImage';
import { X, Eye, EyeOff, Camera, User, Phone, Mail, Award, Briefcase, DollarSign, Heart, FileText, ChevronRight, ChevronLeft, Building2, Search, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { Role, Staff } from '../../types/staff.types';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { Branch } from '../../types/branch.types';
import { authService } from '../../services/auth.service';
import { nicService } from '../../services/nic.service';
import { SRI_LANKAN_BANKS, BANK_VALIDATION_RULES } from '../../constants/loan.constants';
import { bankService } from '@/services/bank.service';
import { Bank, BankBranch } from '@/types/bank.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { API_BASE_URL } from '../../services/api.config';
import { formatFullName, formatNameWithInitials } from '../../utils/name.utils';

interface StaffEditFormProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<any>;
    roles: Role[];
    initialData: any;
}

type TabType = 'basic' | 'employment' | 'education' | 'experience' | 'salary' | 'emergency';

export function StaffEditForm({ onClose, onSubmit, roles, initialData }: StaffEditFormProps) {
    const [currentTab, setCurrentTab] = useState<TabType>('basic');
    const [loading, setLoading] = useState(false);
    const [officeBranches, setOfficeBranches] = useState<Branch[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [bankBranches, setBankBranches] = useState<BankBranch[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(() => {
        const sId = initialData?.staff_id || initialData?.staffId || initialData?.userName || initialData?.user_name;

        // If we have an ID, prioritize the secure media endpoint
        if (sId && typeof sId === 'string' && (sId.startsWith('ST') || sId.startsWith('AD') || sId.startsWith('FO'))) {
            return `${API_BASE_URL}/media/staff-profiles/${sId}`;
        }

        if (initialData?.profile_image_url) return initialData.profile_image_url;
        if (initialData?.avatar) return initialData.avatar;

        if (initialData?.profile_image) {
            return initialData.profile_image.startsWith('http')
                ? initialData.profile_image
                : (sId ? `${API_BASE_URL}/media/staff-profiles/${sId}` : null);
        }

        return null;
    });
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
    const formContentRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [filterText, setFilterText] = useState("");

    // Reset scroll to top when tab changes
    useEffect(() => {
        if (formContentRef.current) {
            formContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentTab]);

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

    // Ensure we have a consistent ID for exclusion in duplication checks
    const currentStaffId = initialData?.staff_id || initialData?.staffId || (initialData?.id && /^ST\d+/.test(initialData.id) ? initialData.id : initialData?.id);

    // Helper to format date for input fields (YYYY-MM-DD)
    const formatDate = (dateVal: any) => {
        if (!dateVal) return '';
        try {
            // Handle string date formats safe for <input type="date">
            if (typeof dateVal === 'string') {
                // If it's already YYYY-MM-DD exactly (no time component)
                if (dateVal.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
                    return dateVal;
                }

                // If it's DD/MM/YYYY or DD-MM-YYYY
                const matchDMY = dateVal.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
                if (matchDMY) return `${matchDMY[3]}-${matchDMY[2]}-${matchDMY[1]}`;
            }

            const date = new Date(dateVal);
            if (isNaN(date.getTime())) return '';

            // Use local date getters to avoid UTC timezone shifts
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    };

    const [formData, setFormData] = useState({
        // Authentication & Role
        roleId: initialData?.roleId?.toString() || '',
        email: initialData?.email || '',
        password: '',
        isActive: initialData?.status === 'Active' || initialData?.is_active === true,

        // Basic Info
        name: initialData?.name || initialData?.full_name || '',
        first_name: initialData?.first_name || '',
        surname: initialData?.surname || '',
        name_with_initial: initialData?.name_with_initial || '',
        nic: initialData?.nic || '',
        gender: initialData?.gender || 'Male',
        date_of_birth: formatDate(initialData?.date_of_birth),
        age: initialData?.age?.toString() || '',
        nationality: initialData?.nationality || 'Sri Lankan',
        marital_status: initialData?.marital_status || 'Single',
        preferred_language: initialData?.preferred_language || 'Tamil',
        profile_image: initialData?.profile_image || '',

        // Contact Details
        address: initialData?.address || '',
        mailing_address: initialData?.mailing_address || '',
        contactKey: initialData?.contact_no || '',
        personal_mobile: initialData?.personal_mobile || '',
        personal_email: initialData?.personal_email || '',

        // Employment Details
        department: initialData?.department || '',
        employee_type: initialData?.employee_type || 'Permanent',
        joinedDate: formatDate(initialData?.joinedDate || initialData?.joining_date),
        permanent_date: formatDate(initialData?.permanent_date),
        confirmation_date: formatDate(initialData?.confirmation_date),
        is_blacklisted: initialData?.is_blacklisted || false,
        bond_signed: initialData?.bond_signed || false,
        bond_period_from: formatDate(initialData?.bond_period_from),
        bond_period_to: formatDate(initialData?.bond_period_to),
        branch: initialData?.branchId?.toString() || initialData?.branch_id?.toString() || '',
        branch_code: initialData?.branch_code || '',
        office_mobile: initialData?.office_mobile || '',
        office_email: initialData?.office_email || '',

        // Education
        highest_qualification: initialData?.education_info?.highest_qualification || '',
        professional_certifications: initialData?.education_info?.certifications || '',
        special_skills: initialData?.education_info?.skills || '',
        languages_known: initialData?.education_info?.languages || '',

        // Work Experience
        bms_experience: initialData?.experience_info?.bms_experience || '',
        total_experience: initialData?.experience_info?.total_experience || '',
        previous_company: initialData?.experience_info?.previous_company || '',
        last_designation: initialData?.experience_info?.last_designation || '',
        key_responsibilities: initialData?.experience_info?.responsibilities || '',

        // Salary & Bank
        basic_salary: initialData?.basic_salary?.toString() || '',
        allowances: initialData?.benefits_info?.allowances || '',
        incentives: initialData?.benefits_info?.incentives || '',
        other_benefits: initialData?.benefits_info?.benefits || '',
        bank_name: initialData?.bank_name || '',
        account_holder_name: initialData?.account_holder_name || '',
        bank_account_number: initialData?.bank_account_number || '',
        confirm_account_number: initialData?.bank_account_number || '',
        bank_branch: initialData?.bank_branch || '',

        // Emergency & Attendance
        emergency_contact_name: initialData?.emergency_contact?.name || '',
        emergency_relationship: initialData?.emergency_contact?.relationship || '',
        emergency_contact_number: initialData?.emergency_contact?.phone || '',
        previous_leave_data: initialData?.leave_balance_info?.previous_leave || '',
        leave_balance: initialData?.leave_balance_info?.balance || '',
        bankId: '',
        bankBranchId: '',
        handover_staff_id: '',
    });

    const [initialBranch, setInitialBranch] = useState<string>('');
    const [assignmentsCount, setAssignmentsCount] = useState({ centers: 0, customers: 0, loans: 0 });
    const [potentialSuccessors, setPotentialSuccessors] = useState<Staff[]>([]);
    const [isLoadingSuccessors, setIsLoadingSuccessors] = useState(false);

    const selectedRole = roles.find(r => r.id.toString() === formData.roleId);

    const fetchOfficeBranches = async () => {
        try {
            const data = await branchService.getBranchesAll();
            setOfficeBranches(data);
        } catch (error) {
            console.error("Failed to fetch branches", error);
        }
    };

    const fetchBanks = async () => {
        setIsLoadingBanks(true);
        try {
            const data = await bankService.getBanks();
            setBanks(data);
        } catch (error) {
            console.error("Failed to fetch banks", error);
        } finally {
            setIsLoadingBanks(false);
        }
    };

    const fetchBankBranches = async (bankId: string) => {
        if (!bankId) {
            setBankBranches([]);
            return;
        }
        setIsLoadingBranches(true);
        try {
            const data = await bankService.getBankBranches(Number(bankId));
            setBankBranches(data.branches || []);
        } catch (error) {
            console.error("Failed to fetch branches", error);
        } finally {
            setIsLoadingBranches(false);
        }
    };

    useEffect(() => {
        fetchOfficeBranches();
        fetchBanks();
    }, []);

    useEffect(() => {
        if (formData.bankId) {
            fetchBankBranches(formData.bankId);
        } else {
            setBankBranches([]);
        }
    }, [formData.bankId]);

    // Handle initial branch matching when bankBranches change
    useEffect(() => {
        if (bankBranches.length > 0 && !formData.bankBranchId && initialData?.bank_branch) {
            const foundBranch = bankBranches.find(b => b.branch_name === initialData.bank_branch);
            if (foundBranch) {
                setFormData(prev => ({ ...prev, bankBranchId: foundBranch.id.toString() }));
            }
        }
    }, [bankBranches, initialData?.bank_branch, formData.bankBranchId]);

    // Load detailed staff data if needed
    useEffect(() => {
        const loadStaffDetails = async () => {
            if (currentStaffId) {
                try {
                    const details = await staffService.getStaffDetails(currentStaffId);
                    if (details) {
                        setFormData(prev => ({
                            ...prev,
                            // Authentication & Role
                            roleId: roles.find(r => r.name === details.role_name)?.id?.toString() || prev.roleId,

                            // Basic
                            name: details.full_name || prev.name,
                            first_name: details.first_name || prev.first_name,
                            surname: details.surname || prev.surname,
                            name_with_initial: details.name_with_initial || prev.name_with_initial,
                            nic: details.nic || prev.nic,
                            gender: details.gender || prev.gender,
                            date_of_birth: formatDate(details.date_of_birth),
                            age: details.age?.toString() || prev.age,
                            nationality: details.nationality || prev.nationality,
                            marital_status: details.marital_status || prev.marital_status,
                            preferred_language: details.preferred_language || prev.preferred_language,
                            profile_image: details.profile_image || prev.profile_image,

                            // Contact
                            address: details.address || prev.address,
                            mailing_address: details.mailing_address || prev.mailing_address,
                            contactKey: details.contact_no || prev.contactKey,
                            personal_mobile: details.personal_mobile || prev.personal_mobile,
                            personal_email: details.personal_email || prev.personal_email,

                            // Employment
                            department: details.department || prev.department,
                            employee_type: details.employee_type || prev.employee_type,
                            joinedDate: formatDate(details.joining_date),
                            permanent_date: formatDate(details.permanent_date),
                            confirmation_date: formatDate(details.confirmation_date),
                            is_blacklisted: details.is_blacklisted === 1 || details.is_blacklisted === true,
                            bond_signed: details.bond_signed === 1 || details.bond_signed === true,
                            bond_period_from: formatDate(details.bond_period_from),
                            bond_period_to: formatDate(details.bond_period_to),
                            branch: details.branch_id?.toString() || prev.branch,
                            branch_code: details.branch_code || prev.branch_code,
                            office_mobile: details.office_mobile || prev.office_mobile,
                            office_email: details.office_email || prev.office_email,

                            // Education
                            highest_qualification: details.education_info?.highest_qualification || prev.highest_qualification,
                            professional_certifications: details.education_info?.certifications || prev.professional_certifications,
                            special_skills: details.education_info?.skills || prev.special_skills,
                            languages_known: details.education_info?.languages || prev.languages_known,

                            // Experience
                            bms_experience: details.experience_info?.bms_experience || prev.bms_experience,
                            total_experience: details.experience_info?.total_experience || prev.total_experience,
                            previous_company: details.experience_info?.previous_company || prev.previous_company,
                            last_designation: details.experience_info?.last_designation || prev.last_designation,
                            key_responsibilities: details.experience_info?.responsibilities || prev.key_responsibilities,

                            // Salary
                            basic_salary: details.basic_salary?.toString() || prev.basic_salary,
                            allowances: details.benefits_info?.allowances || prev.allowances,
                            incentives: details.benefits_info?.incentives || prev.incentives,
                            other_benefits: details.benefits_info?.benefits || prev.other_benefits,
                            bank_name: details.bank_name || prev.bank_name,
                            account_holder_name: details.account_holder_name || prev.account_holder_name,
                            bank_account_number: details.bank_account_number || prev.bank_account_number,
                            confirm_account_number: details.bank_account_number || prev.confirm_account_number,
                            bank_branch: details.bank_branch || prev.bank_branch,

                            // Emergency
                            emergency_contact_name: details.emergency_contact?.name || prev.emergency_contact_name,
                            emergency_relationship: details.emergency_contact?.relationship || prev.emergency_relationship,
                            emergency_contact_number: details.emergency_contact?.phone || prev.emergency_contact_number,
                            previous_leave_data: details.leave_balance_info?.previous_leave || prev.previous_leave_data,
                            leave_balance: details.leave_balance_info?.balance || prev.leave_balance,
                        }));

                        if (details.branch_id) setInitialBranch(details.branch_id.toString());
                        if (details.assignments_count) setAssignmentsCount(details.assignments_count);
                        const roleObj = roles.find(r => r.name === details.role_name);
                        if (roleObj) {
                            setFormData(prev => ({ ...prev, roleId: roleObj.id.toString() }));
                        }

                        // If banks are loaded, try to find matching bank/branch IDs
                        if (banks.length > 0) {
                            const foundBank = banks.find(b => b.bank_name === details.bank_name);
                            if (foundBank) {
                                setFormData(prev => ({ ...prev, bankId: foundBank.id.toString() }));
                                // Branches will be fetched by the useEffect hook
                            }
                        }
                        const sIdForPreview = details.staff_id || details.staffId || details.user_name || currentStaffId;
                        if (sIdForPreview) {
                            setPreviewImage(`${API_BASE_URL}/media/staff-profiles/${sIdForPreview}`);
                        } else if (details.profile_image_url) {
                            setPreviewImage(details.profile_image_url);
                        } else if (details.profile_image) {
                            const url = details.profile_image.startsWith('http')
                                ? details.profile_image
                                : `${API_BASE_URL}/media/staff-profiles/${details.staff_id || details.staffId || details.user_name}`;
                            setPreviewImage(url);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load staff details", err);
                }
            }
        };
        loadStaffDetails();
    }, [currentStaffId]);

    // Real-time Validations with EXCLUSION OF CURRENT USER
    useEffect(() => {
        const checkNIC = async () => {
            if (formData.nic && (formData.nic.length === 10 || formData.nic.length === 12)) {
                // Parse for HR data info
                const parsed = nicService.parseNIC(formData.nic);
                if (parsed) {
                    setFormData(prev => ({
                        ...prev,
                        gender: parsed.gender,
                        date_of_birth: parsed.dob,
                        age: parsed.age.toString()
                    }));
                }

                // CHECK DUPLICATION (Exclude current user)
                const isAvailable = await staffService.checkAvailability('nic', formData.nic, currentStaffId);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, nic: 'This NIC belongs to another staff member' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, nic: '' }));
                }
            } else if (!formData.nic) {
                // Clear fields if NIC is removed
                setFormData(prev => ({
                    ...prev,
                    gender: 'Male',
                    date_of_birth: '',
                    age: ''
                }));
                setFieldErrors(prev => ({ ...prev, nic: '' }));
            }
        };
        const timer = setTimeout(checkNIC, 500);
        return () => clearTimeout(timer);
    }, [formData.nic, currentStaffId]);

    useEffect(() => {
        const checkEmail = async () => {
            // Login Email Check
            if (formData.email && formData.email.includes('@')) {
                const isAvailable = await staffService.checkAvailability('email', formData.email, currentStaffId);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, email: 'This login email is already taken by another user' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                }
            }
            // Personal Email Check
            if (formData.personal_email && formData.personal_email.includes('@')) {
                const isAvailable = await staffService.checkAvailability('personal_email', formData.personal_email, currentStaffId);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, personal_email: 'This personal email is registered to someone else' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, personal_email: '' }));
                }
            }
        };
        const timer = setTimeout(checkEmail, 600);
        return () => clearTimeout(timer);
    }, [formData.email, formData.personal_email, currentStaffId]);

    useEffect(() => {
        const checkContact = async () => {
            const stripped = formData.contactKey.replace(/\D/g, "");

            // Login Mobile Check
            if (stripped && stripped.length === 10) {
                const isAvailable = await staffService.checkAvailability('contact', stripped, currentStaffId);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, contactKey: 'This personal mobile is already used by another staff' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, contactKey: '' }));
                }
            } else if (stripped && stripped.length > 0) {
                if (!/^0[0-9]{9}$/.test(stripped)) {
                    setFieldErrors(prev => ({ ...prev, contactKey: 'Must be 10 digits starting with 0' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, contactKey: '' }));
                }
            }
            // Personal Mobile Check (Secondary)
            const strippedSecondary = formData.personal_mobile.replace(/\D/g, "");
            if (strippedSecondary && strippedSecondary.length === 10) {
                const isAvailable = await staffService.checkAvailability('personal_mobile', strippedSecondary, currentStaffId);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, personal_mobile: 'This personal mobile is already registered' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, personal_mobile: '' }));
                }
            }
        };
        const timer = setTimeout(checkContact, 500);
        return () => clearTimeout(timer);
    }, [formData.contactKey, formData.personal_mobile, currentStaffId]);

    // Branch Manager Conflict Check
    // When role is "manager" and a branch is selected, check if that branch already has a manager
    useEffect(() => {
        const checkBranchManager = async () => {
            const selectedRoleObj = roles.find(r => r.id.toString() === formData.roleId);
            const isManagerRole = selectedRoleObj?.name === 'manager';

            if (isManagerRole && formData.branch) {
                const conflictMessage = await staffService.checkBranchManager(formData.branch, currentStaffId);
                if (conflictMessage) {
                    setFieldErrors(prev => ({ ...prev, branch: conflictMessage }));
                } else {
                    setFieldErrors(prev => ({ ...prev, branch: '' }));
                }
            } else {
                // Clear the error if role is not manager or no branch selected
                setFieldErrors(prev => ({ ...prev, branch: '' }));
            }
        };
        const timer = setTimeout(checkBranchManager, 300);
        return () => clearTimeout(timer);
    }, [formData.roleId, formData.branch, roles, currentStaffId]);

    // Fetch Potential Successors when branch changes for an FO
    useEffect(() => {
        const fetchSuccessors = async () => {
            const roleObj = roles.find(r => r.id.toString() === formData.roleId);
            const isFO = roleObj?.name === 'field_officer';
            const hasAssignments = assignmentsCount.centers > 0 || assignmentsCount.customers > 0;

            if (isFO && initialBranch && formData.branch !== initialBranch && hasAssignments) {
                setIsLoadingSuccessors(true);
                try {
                    const fos = await staffService.getStaffsByRole('field_officer', initialBranch);
                    // Exclude current person
                    setPotentialSuccessors(fos.filter(f => f.staff_id !== currentStaffId));
                } catch (err) {
                    console.error("Failed to fetch successors", err);
                } finally {
                    setIsLoadingSuccessors(false);
                }
            } else {
                setPotentialSuccessors([]);
                if (formData.handover_staff_id) {
                    setFormData(prev => ({ ...prev, handover_staff_id: '' }));
                }
            }
        };
        fetchSuccessors();
    }, [formData.branch, initialBranch, formData.roleId, assignmentsCount.centers, assignmentsCount.customers, roles, currentStaffId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        if (name === 'branch') {
            const selectedBranch = officeBranches.find(b => b.id.toString() === value);
            if (selectedBranch) {
                setFormData(prev => ({
                    ...prev,
                    branch: value,
                    branch_code: selectedBranch.branch_id || '',
                    office_mobile: selectedBranch.phone || '',
                    office_email: selectedBranch.email || ''
                }));
            } else {
                setFormData(prev => ({ ...prev, [name]: val }));
            }
        } else if (name === 'email') {
            const lowercaseEmail = value.toLowerCase();
            setFormData(prev => ({ ...prev, email: lowercaseEmail, office_email: lowercaseEmail }));
        } else if (name === 'office_email' || name === 'personal_email') {
            setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
        } else if (name === 'contactKey') {
            setFormData(prev => ({ ...prev, contactKey: value, office_mobile: value }));
        } else if (name === 'first_name' || name === 'surname') {
            const firstName = name === 'first_name' ? value : formData.first_name;
            const surname = name === 'surname' ? value : formData.surname;

            const fullName = formatFullName(firstName, surname);
            const nameWithInitials = formatNameWithInitials(firstName, surname);

            setFormData(prev => ({
                ...prev,
                [name]: value,
                name: fullName,
                name_with_initial: nameWithInitials
            }));

            // Clear errors for auto-filled fields
            setFieldErrors(prev => ({
                ...prev,
                name: "",
                name_with_initial: ""
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }

        // Field-specific validation resets
        if (fieldErrors[name] && !['nic', 'email', 'contactKey', 'personal_email', 'personal_mobile'].includes(name)) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Requirement: Max size 1MB
            if (file.size > 1 * 1024 * 1024) {
                toast.error("Profile image size exceeds 1MB limit.");
                e.target.value = ""; // Reset input
                return;
            }
            setProfileFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const validateTab = (tab: TabType): string | null => {
        const errors: Record<string, string> = {};

        if (tab === 'basic') {
            if (!formData.name.trim()) errors.name = 'Full Name is required';
            if (!formData.first_name.trim()) errors.first_name = 'First Name is required';
            if (!formData.surname.trim()) errors.surname = 'Surname / Last Name is required';
            if (!formData.nic.trim()) errors.nic = 'NIC is required';

            if (!formData.contactKey.trim()) {
                errors.contactKey = 'Personal Mobile is required';
            } else {
                const stripped = formData.contactKey.replace(/\D/g, "");
                if (!/^0[0-9]{9}$/.test(stripped)) {
                    errors.contactKey = 'Must be 10 digits starting with 0';
                }
            }

            const nicRegex = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
            if (formData.nic && !nicRegex.test(formData.nic)) errors.nic = 'Invalid NIC format';
        }

        if (tab === 'employment') {
            if (!formData.roleId) errors.roleId = 'Role is required';
            if (!formData.email.trim()) errors.email = 'Login Email is required';
        }

        if (tab === 'experience') {
            if (formData.bms_experience && formData.total_experience) {
                const bmsVal = parseFloat(formData.bms_experience) || 0;
                const totalVal = parseFloat(formData.total_experience) || 0;

                if (totalVal < bmsVal) {
                    errors.total_experience = 'Total experience must be greater than BMS experience';
                }
            }
        }

        // Check for duplication block errors
        const blockingErrors = ['nic', 'email', 'contactKey', 'personal_email', 'personal_mobile', 'branch'];
        for (const field of blockingErrors) {
            if (fieldErrors[field]) {
                errors[field] = fieldErrors[field];
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...errors }));
            return Object.values(errors)[0];
        }

        return null;
    };

    const handleSubmitClick = async () => {
        const error = validateTab(currentTab);
        if (error) {
            toast.error(error);
            return;
        }

        const roleObj = roles.find(r => r.id.toString() === formData.roleId);
        const hasAssignments = assignmentsCount.centers > 0 || assignmentsCount.customers > 0;
        
        if (roleObj?.name === 'field_officer' && initialBranch && formData.branch !== initialBranch && hasAssignments) {
            if (!formData.handover_staff_id) {
                setFieldErrors(prev => ({ ...prev, handover_staff_id: 'You must select a successor to take over centers/customers' }));
                toast.error("This Field Officer has active assignments in the old branch. Please select a successor.");
                return;
            }
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('staffId', currentStaffId);
            data.append('role_name', selectedRole?.name || '');
            data.append('email_id', formData.email);
            data.append('account_status', formData.isActive ? 'active' : 'inactive');
            if (formData.password) data.append('password', formData.password);

            data.append('full_name', formData.name);
            data.append('first_name', formData.first_name);
            data.append('surname', formData.surname);
            data.append('name_with_initial', formData.name_with_initial);
            data.append('nic', formData.nic);
            data.append('gender', formData.gender);
            data.append('date_of_birth', formData.date_of_birth);
            data.append('age', formData.age);
            data.append('nationality', formData.nationality);
            data.append('marital_status', formData.marital_status);
            data.append('preferred_language', formData.preferred_language);
            data.append('address', formData.address);
            data.append('mailing_address', formData.mailing_address);
            data.append('contact_no', formData.contactKey.replace(/\D/g, ""));
            data.append('personal_mobile', formData.personal_mobile.replace(/\D/g, ""));
            data.append('personal_email', formData.personal_email);
            data.append('department', formData.department);
            data.append('employee_type', formData.employee_type);
            data.append('joining_date', formData.joinedDate);
            data.append('permanent_date', formData.permanent_date);
            data.append('confirmation_date', formData.confirmation_date);
            data.append('is_blacklisted', formData.is_blacklisted ? '1' : '0');
            data.append('bond_signed', formData.bond_signed ? '1' : '0');
            data.append('bond_period_from', formData.bond_period_from);
            data.append('bond_period_to', formData.bond_period_to);
            data.append('branch_id', formData.branch);
            data.append('branch_code', formData.branch_code);
            data.append('office_mobile', formData.office_mobile.replace(/\D/g, ""));
            data.append('office_email', formData.office_email);

            data.append('education_info', JSON.stringify({
                highest_qualification: formData.highest_qualification,
                certifications: formData.professional_certifications,
                skills: formData.special_skills,
                languages: formData.languages_known
            }));

            data.append('experience_info', JSON.stringify({
                bms_experience: formData.bms_experience,
                total_experience: formData.total_experience,
                previous_company: formData.previous_company,
                last_designation: formData.last_designation,
                responsibilities: formData.key_responsibilities
            }));

            data.append('benefits_info', JSON.stringify({
                allowances: formData.allowances,
                incentives: formData.incentives,
                benefits: formData.other_benefits
            }));

            data.append('emergency_contact', JSON.stringify({
                name: formData.emergency_contact_name,
                relationship: formData.emergency_relationship,
                phone: formData.emergency_contact_number
            }));

            data.append('leave_balance_info', JSON.stringify({
                previous_leave: formData.previous_leave_data,
                balance: formData.leave_balance
            }));

            data.append('basic_salary', formData.basic_salary);
            data.append('bank_name', formData.bank_name);
            data.append('account_holder_name', formData.account_holder_name);
            data.append('bank_account_number', formData.bank_account_number);
            data.append('bank_branch', formData.bank_branch);

            if (formData.handover_staff_id) {
                data.append('handover_staff_id', formData.handover_staff_id);
            }

            if (profileFile) {
                data.append('profile_image_file', profileFile);
            }

            await onSubmit(data);
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'basic', label: 'Identity & Contact', icon: <User className="w-4 h-4" /> },
        { id: 'employment', label: 'Employment', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'education', label: 'Qualifications', icon: <Award className="w-4 h-4" /> },
        { id: 'experience', label: 'Experience', icon: <FileText className="w-4 h-4" /> },
        { id: 'salary', label: 'SALARY & BANK', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'emergency', label: 'HR & EMERGENCY', icon: <Heart className="w-4 h-4" /> },
    ];

    const renderField = (label: string, name: string, type: string = 'text', placeholder: string = '', options?: { value: string; label: string }[], isRequired: boolean = false, isReadOnly: boolean = false, autoComplete: string = 'off') => (
        <div className="space-y-2">
            <label className="block text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">
                {label} {isRequired && <span className="text-rose-500">*</span>}
            </label>
            {type === 'select' ? (
                <div className="relative" ref={activeDropdown === name ? dropdownRef : null}>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveDropdown(activeDropdown === name ? null : name);
                            setFilterText("");
                        }}
                        disabled={isReadOnly}
                        className={`w-full px-5 py-3.5 bg-muted-bg/50 border ${fieldErrors[name] ? 'border-rose-500' : 'border-border-default'} rounded-2xl text-[13px] font-bold text-text-primary outline-none transition-all hover:bg-muted-bg focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed uppercase`}
                    >
                        <span className={!(formData as any)[name] ? 'text-text-muted/40' : ''}>
                            {options?.find(opt => opt.value === (formData as any)[name])?.label || `Select ${label}`}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === name ? '-rotate-90' : 'rotate-90'}`} />
                    </button>

                    {activeDropdown === name && (
                        <div className="absolute z-[110] left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-primary-500/30 rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-3 border-b border-border-default/50 bg-primary-500/5">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50" />
                                    <input
                                        type="text"
                                        placeholder={`FILTER ${label.toUpperCase()}...`}
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                        className="w-full bg-muted-bg/40 border border-border-default rounded-xl pl-9 pr-4 py-2 text-[11px] font-black tracking-widest text-text-primary focus:outline-none focus:border-primary-500/50 uppercase"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                                {options?.filter(opt =>
                                    opt.label.toLowerCase().includes(filterText.toLowerCase())
                                ).length === 0 ? (
                                    <div className="py-8 text-center" key="no-results">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">No matching results</p>
                                    </div>
                                ) : (
                                    options?.filter(opt =>
                                        opt.label.toLowerCase().includes(filterText.toLowerCase())
                                    ).map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                handleChange({ target: { name, value: opt.value } } as any);
                                                setActiveDropdown(null);
                                                setFilterText("");
                                            }}
                                            className={`w-full px-4 py-3 text-left text-[11px] font-black tracking-widest uppercase transition-all rounded-xl flex items-center justify-between group/opt ${(formData as any)[name] === opt.value
                                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                                    : 'text-text-muted hover:bg-primary-500/10 hover:text-primary-500'
                                                }`}
                                        >
                                            {opt.label}
                                            {(formData as any)[name] === opt.value && <ChevronRight className="w-3 h-3 text-white" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                    {fieldErrors[name] && (
                        <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                            {fieldErrors[name]}
                        </p>
                    )}
                </div>
            ) : type === 'textarea' ? (
                <textarea
                    name={name}
                    value={(formData as any)[name]}
                    onChange={handleChange}
                    rows={4}
                    placeholder={placeholder}
                    readOnly={isReadOnly}
                    className={`w-full px-5 py-3.5 bg-muted-bg/50 border ${fieldErrors[name] ? 'border-rose-500' : 'border-border-default'} rounded-2xl text-[13px] font-bold text-text-primary outline-none transition-all hover:bg-muted-bg focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 resize-none placeholder:text-text-muted/30 disabled:opacity-50`}
                />
            ) : (
                <div className="relative">
                    <input
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        type={type === 'password' && visibleFields[name] ? 'text' : type}
                        placeholder={placeholder}
                        readOnly={isReadOnly}
                        onKeyDown={type === 'number' ? (e) => {
                            if (e.key === '-' || e.key === 'e') {
                                e.preventDefault();
                            }
                        } : undefined}
                        min={type === 'number' ? "0" : undefined}
                        onPaste={name === 'nic' || name === 'bank_account_number' || name === 'confirm_account_number' ? (e) => e.preventDefault() : undefined}
                        autoComplete={autoComplete}
                        className={`w-full px-5 py-3.5 bg-muted-bg/50 border ${fieldErrors[name] ? 'border-rose-500' : 'border-border-default'} rounded-2xl text-[13px] font-bold text-text-primary outline-none transition-all hover:bg-muted-bg focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 placeholder:text-text-muted/30 disabled:opacity-50 ${type === 'password' ? 'pr-12' : ''}`}
                    />
                    {type === 'password' && (
                        <button
                            type="button"
                            onClick={() => setVisibleFields(prev => ({ ...prev, [name]: !prev[name] }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        >
                            {visibleFields[name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    )}
                    {fieldErrors[name] && (
                        <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                            {fieldErrors[name]}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-4xl w-full shadow-2xl border border-border-default/50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border-default flex items-center justify-between bg-table-header/30">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <div className="sr-only">
                            <h2 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-3">
                                UPDATE PROFILE <span className="text-primary-500 text-sm font-black bg-primary-500/10 px-3 py-1 rounded-full">{currentStaffId}</span>
                            </h2>
                            <p className="text-sm text-text-muted font-bold mt-0.5">Review and modify staff information securely</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-muted-bg text-text-muted hover:text-text-primary rounded-2xl transition-all active:scale-95 bg-muted-bg/50">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-3 bg-table-header/20 border-b border-border-default gap-2 overflow-x-auto custom-scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentTab === tab.id
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                : 'text-text-muted hover:text-text-primary hover:bg-muted-bg'
                                }`}
                        >
                            <span className={currentTab === tab.id ? 'text-white' : 'text-primary-500'}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Scrollable Content */}
                <div ref={formContentRef} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Fake inputs to prevent Chrome autofill */}
                    <input type="text" style={{ display: 'none' }} aria-hidden="true" />
                    <input type="password" style={{ display: 'none' }} aria-hidden="true" />

                    {/* GLOBAL HANDOVER NOTIFICATION - ALWAYS AT TOP OF CONTENT */}
                    {(assignmentsCount.centers > 0 || assignmentsCount.customers > 0) && initialBranch && formData.branch !== initialBranch && (
                        <div className="sticky top-0 z-[100] p-6 bg-amber-500 rounded-3xl shadow-xl border-b border-amber-600 animate-in fade-in slide-in-from-top-4 duration-300 mb-10">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <UserCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">FO Handover Required</p>
                                        <p className="text-[10px] text-white/90 font-bold mt-1 leading-relaxed">
                                            Transferring <span className="text-white font-black underline">{assignmentsCount.centers} centers</span> & <span className="text-white font-black underline">{assignmentsCount.customers} customers</span> from <span className="text-amber-900 font-extrabold">{officeBranches.find(b => b.id.toString() === initialBranch)?.branch_name || 'Old Branch'}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex-1 w-full md:w-auto">
                                    {potentialSuccessors.length > 0 ? (
                                        <div className="bg-white/10 p-1 rounded-2xl border border-white/20">
                                            <SearchableSelect
                                                label=""
                                                options={potentialSuccessors.map(f => ({
                                                    id: f.staff_id,
                                                    label: f.full_name,
                                                    subLabel: f.staff_id
                                                }))}
                                                value={formData.handover_staff_id}
                                                onChange={(val) => setFormData(prev => ({ ...prev, handover_staff_id: val?.toString() || '' }))}
                                                placeholder="SELECT SUCCESSOR FO IN OLD BRANCH *"
                                                searchPlaceholder="Search FOs..."
                                                isLoading={isLoadingSuccessors}
                                                error={fieldErrors.handover_staff_id}
                                            />
                                        </div>
                                    ) : (
                                        <div className="px-5 py-3 bg-rose-600/40 backdrop-blur-md rounded-2xl border border-white/20 text-center">
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">No active Field Officers found in old branch!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'basic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex flex-col lg:flex-row gap-12 items-start">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-40 h-40 rounded-[2.5rem] bg-muted-bg border-4 border-card shadow-inner flex items-center justify-center overflow-hidden ring-1 ring-border-default">
                                            {previewImage ? (
                                                <SecureImage
                                                    src={previewImage}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    fallbackName={initialData?.full_name || initialData?.name}
                                                />
                                            ) : (
                                                <User className="w-20 h-20 text-text-muted opacity-20" />
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 bg-primary-500 text-white p-3.5 rounded-2xl cursor-pointer shadow-xl hover:scale-110 transition-all hover:bg-primary-600 border-4 border-card active:scale-95">
                                            <Camera className="w-6 h-6" />
                                            <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                        </label>
                                    </div>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Profile Photo</span>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {renderField('First Name', 'first_name', 'text', 'Primary naming', [], true)}
                                    {renderField('Surname / Last Name', 'surname', 'text', 'Family mapping', [], true)}
                                    <div className="col-span-1 md:col-span-2">
                                        {renderField('Full Name', 'name', 'text', 'Auto-generated', [], true, true)}
                                    </div>
                                    {renderField('Name with Initials', 'name_with_initial', 'text', '', [], true, true)}
                                    {renderField('NIC Number', 'nic', 'text', '', [], true)}
                                    {renderField('Date of Birth', 'date_of_birth', 'date', '', [], false, true)}
                                    <div className="grid grid-cols-2 gap-4">
                                        {renderField('Gender', 'gender', 'select', '', [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }], false, true)}
                                        {renderField('Age', 'age', 'number', '', [], false, true)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border-default">
                                {renderField('Personal Mobile', 'contactKey', 'tel', '', [], true, false, 'new-password')}
                                {renderField('Personal Email', 'personal_email', 'email')}
                                {renderField('Personal Mobile (Secondary)', 'personal_mobile', 'tel')}
                                <div className="col-span-1 md:col-span-3">
                                    {renderField('Permanent Address', 'address', 'textarea', '', [], true)}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'employment' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField('Role', 'roleId', 'select', '', roles.map(r => ({ value: r.id.toString(), label: r.display_name })), true)}
                                {renderField('Login Email (System)', 'email', 'email', '', [], true, false, 'new-email')}
                                {renderField('Department', 'department')}
                                {renderField('Employee Type', 'employee_type', 'select', '', [
                                    { value: 'Permanent', label: 'Permanent' },
                                    { value: 'Contract', label: 'Contract' },
                                    { value: 'Probation', label: 'Probation' }
                                ])}
                                {renderField('Date of Joining', 'joinedDate', 'date')}
                                {renderField('Permanent Date', 'permanent_date', 'date')}
                                {renderField('Confirmation Date', 'confirmation_date', 'date')}
                            </div>

                            <div className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                name="bond_signed"
                                                checked={formData.bond_signed}
                                                onChange={handleChange}
                                                className="peer hidden"
                                            />
                                            <div className="w-10 h-6 bg-muted-bg rounded-full border border-border-default peer-checked:bg-amber-500 transition-all"></div>
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-5 shadow-sm"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Bond Signed</span>
                                    </label>
                                </div>
                                {renderField('Bond Period From', 'bond_period_from', 'date')}
                                {renderField('Bond Period To', 'bond_period_to', 'date')}
                            </div>

                            <div className="bg-primary-500/5 p-8 rounded-[2rem] border border-primary-500/10">
                                <h4 className="text-[10px] font-black text-primary-600 dark:text-primary-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Building2 className="w-4 h-4" /> Office & Location
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        {renderField('Branch / Location', 'branch', 'select', '', officeBranches.map(b => ({ value: b.id.toString(), label: b.branch_name })), false)}
                                    </div>
                                    {renderField('Branch Code', 'branch_code', 'text', '', [], false, true)}
                                    {renderField('Office Mobile', 'office_mobile', 'tel', '', [], false, true)}
                                    {renderField('Office Email', 'office_email', 'email', '', [], false, true)}
                                    <div className="col-span-1 md:col-span-2 pt-4">
                                        <label className="flex items-center gap-4 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    name="is_blacklisted"
                                                    id="is_blacklisted"
                                                    checked={formData.is_blacklisted}
                                                    onChange={handleChange}
                                                    className="peer hidden"
                                                />
                                                <div className="w-12 h-6 bg-muted-bg rounded-full border border-border-default peer-checked:bg-rose-500 transition-all"></div>
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7 shadow-sm"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">Blacklisted Account</p>
                                                <p className="text-[10px] text-rose-600/60 font-medium">Prevent this staff from critical operations</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'salary' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderField('Basic Salary', 'basic_salary', 'number')}
                                {renderField('Allowances', 'allowances', 'number')}
                                {renderField('Incentives / Commission', 'incentives', 'number')}
                            </div>
                            <div className="p-6 bg-muted-bg/30 rounded-[2.5rem] border border-border-default space-y-6">
                                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                                    <DollarSign className="w-4 h-4" /> Bank Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <SearchableSelect
                                        label="Bank Name *"
                                        options={banks.map(bank => ({
                                            id: bank.id,
                                            label: bank.bank_name,
                                            subLabel: bank.bank_code
                                        }))}
                                        value={formData.bankId}
                                        onChange={(val) => {
                                            const bankId = val?.toString() || '';
                                            const bankName = banks.find(b => b.id.toString() === bankId)?.bank_name || '';
                                            setFormData(prev => ({
                                                ...prev,
                                                bankId: bankId,
                                                bank_name: bankName,
                                                bankBranchId: '',
                                                bank_branch: ''
                                            }));
                                        }}
                                        placeholder="Select Bank"
                                        searchPlaceholder="Search banks..."
                                        isLoading={isLoadingBanks}
                                        error={fieldErrors.bank_name}
                                    />
                                    <SearchableSelect
                                        label="Bank Branch *"
                                        options={bankBranches.map(branch => ({
                                            id: branch.id,
                                            label: branch.branch_name,
                                            subLabel: branch.branch_code
                                        }))}
                                        value={formData.bankBranchId}
                                        onChange={(val) => {
                                            const branchId = val?.toString() || '';
                                            const branchName = bankBranches.find(b => b.id.toString() === branchId)?.branch_name || '';
                                            setFormData(prev => ({
                                                ...prev,
                                                bankBranchId: branchId,
                                                bank_branch: branchName
                                            }));
                                        }}
                                        disabled={!formData.bankId}
                                        placeholder={!formData.bankId ? 'Select Bank First' : 'Select Branch'}
                                        searchPlaceholder="Search branches..."
                                        isLoading={isLoadingBranches}
                                        error={fieldErrors.bank_branch}
                                    />
                                    {renderField('Account Holder', 'account_holder_name')}
                                    <div className="hidden md:block"></div>
                                    {renderField('Account Number', 'bank_account_number', 'password', '', [], true)}
                                    {renderField('Confirm Account Number', 'confirm_account_number', 'password', '', [], true)}

                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'education' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                             <div className="space-y-4">
                                 {renderField('Highest Qualification', 'highest_qualification')}
                                 {renderField('Special Skills', 'special_skills', 'textarea')}
                                 {renderField('Languages', 'languages_known')}
                             </div>
                        </div>
                    )}

                    {currentTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {renderField('BMS Capital Experience', 'bms_experience', 'number', 'Years')}
                                 {renderField('Total Experience', 'total_experience', 'number', 'Total years')}
                             </div>
                             {renderField('Previous Company', 'previous_company')}
                             {renderField('Last Designation', 'last_designation')}
                             {renderField('Key Responsibilities', 'key_responsibilities', 'textarea')}
                        </div>
                    )}
                    {currentTab === 'emergency' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField('Emergency Contact Name', 'emergency_contact_name')}
                                {renderField('Relationship', 'emergency_relationship')}
                                {renderField('Emergency Number', 'emergency_contact_number', 'tel')}

                                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted-bg/30 rounded-[2.5rem] border border-border-default shadow-inner">
                                    <div className="col-span-1 md:grid-cols-2">
                                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Attendance & Leave</h4>
                                    </div>
                                    {renderField('Previous Leave Data', 'previous_leave_data', 'textarea')}
                                    {renderField('Initial Leave Balance', 'leave_balance', 'text')}
                                </div>

                                <div className="col-span-2 p-6 bg-rose-500/5 rounded-[2.5rem] border border-rose-500/10 flex items-center justify-between group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                        <Heart className="w-24 h-24 text-rose-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">Account Status</p>
                                        <p className="text-[10px] text-text-muted font-bold mt-1">Control system access for this staff member</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        className={`relative z-10 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${formData.isActive
                                            ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                            : 'bg-text-muted/20 text-text-muted'}`}
                                    >
                                        {formData.isActive ? 'ACTIVE ACCOUNT' : 'ACCOUNT LOCKED'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-border-default bg-table-header/30 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <div className="flex gap-4">
                        {currentTab !== 'basic' && (
                            <button
                                onClick={() => {
                                    const index = tabs.findIndex(t => t.id === currentTab);
                                    if (index > 0) setCurrentTab(tabs[index - 1].id);
                                }}
                                className="px-8 ml-[-12px] py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:bg-muted-bg transition-all flex items-center gap-3"
                            >
                                <ChevronLeft className="w-4 h-4" /> PREVIOUS STEP
                            </button>
                        )}
                    </div>

                    <div className="flex gap-6">
                        <button onClick={onClose} className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors">
                            DISCARD CHANGES
                        </button>
                        {currentTab === 'emergency' ? (
                            <button
                                onClick={handleSubmitClick}
                                disabled={loading}
                                className="px-12 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {loading ? 'PROCESSING...' : 'SAVE STAFF MEMBER'}
                                {!loading && <FileText className="w-4 h-4" />}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    const index = tabs.findIndex(t => t.id === currentTab);
                                    if (index < tabs.length - 1) setCurrentTab(tabs[index + 1].id as TabType);
                                }}
                                className="px-12 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center gap-3"
                            >
                                CONTINUE <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
