import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Eye, EyeOff, Camera, User, Phone, Mail, Award, Briefcase, DollarSign, Heart, FileText, ChevronRight, ChevronLeft, Building2, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { Role } from '../../types/staff.types';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { Branch } from '../../types/branch.types';
import { authService } from '../../services/auth.service';
import { nicService } from '../../services/nic.service';
import { SRI_LANKAN_BANKS, BANK_VALIDATION_RULES } from '../../constants/loan.constants';
import { bankService } from '@/services/bank.service';
import { Bank, BankBranch } from '@/types/bank.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { useStaffDraftManager } from '../../hooks/staff/useStaffDraftManager';

import { StaffDraftModal } from './StaffDraftModal';
import { colors } from '@/themes/colors';
import { Save, History } from 'lucide-react';
import { formatFullName, formatNameWithInitials } from '../../utils/name.utils';

interface StaffFormProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<any>;
    roles: Role[];
}

type TabType = 'basic' | 'employment' | 'education' | 'experience' | 'salary' | 'emergency';

export function StaffForm({ onClose, onSubmit, roles }: StaffFormProps) {
    const [currentTab, setCurrentTab] = useState<TabType>('basic');
    const [loading, setLoading] = useState(false);
    const [officeBranches, setOfficeBranches] = useState<Branch[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);

    const [banks, setBanks] = useState<Bank[]>([]);
    const [bankBranches, setBankBranches] = useState<BankBranch[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
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
    const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

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

    const [formData, setFormData] = useState({
        // Authentication & Role
        roleId: '',
        email: '',
        password: '',
        isActive: false,

        // Basic Info
        first_name: '',
        surname: '',
        name: '',
        name_with_initial: '',
        nic: '',
        gender: 'Male',
        date_of_birth: '',
        age: '',
        nationality: 'Sri Lankan',
        marital_status: 'Single',
        preferred_language: 'Tamil',
        profile_image: '',

        // Contact Details
        address: '',
        mailing_address: '',
        contactKey: '',
        personal_mobile: '',
        personal_email: '',

        // Employment Details
        department: '',
        employee_type: 'Permanent',
        joinedDate: '',
        permanent_date: '',
        confirmation_date: '',
        is_blacklisted: false,
        bond_signed: false,
        bond_period_from: '',
        bond_period_to: '',
        branch: '',
        branch_code: '',
        office_mobile: '',
        office_email: '',

        // Education
        highest_qualification: '',
        professional_certifications: '',
        special_skills: '',
        languages_known: '',

        // Work Experience
        bms_experience: '',
        total_experience: '',
        previous_company: '',
        last_designation: '',
        key_responsibilities: '',

        // Salary & Bank
        basic_salary: '',
        allowances: '',
        incentives: '',
        other_benefits: '',
        bank_name: '',
        account_holder_name: '',
        bank_account_number: '',
        confirm_account_number: '',
        bank_branch: '',

        // Emergency & Attendance
        emergency_contact_name: '',
        emergency_relationship: '',
        emergency_contact_number: '',
        previous_leave_data: '',
        leave_balance: '',
        bankId: '',
        bankBranchId: '',
    });

    const selectedRole = roles.find(r => r.id.toString() === formData.roleId);
    const isAdminRole = selectedRole?.name === 'admin' || selectedRole?.name === 'super_admin';

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

    const handleLoadDraft = useCallback((data: any, tab: any) => {
        setFormData(data);
        setCurrentTab(tab);
        if (data.profile_image) {
            setPreviewImage(data.profile_image);
        }
    }, []);

    const {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
        saveDraft,
        loadDraft,
        deleteDraft,
    } = useStaffDraftManager(formData, currentTab, handleLoadDraft);

    // Automatic NIC Parsing & Availability Check
    useEffect(() => {
        const checkNIC = async () => {
            if (formData.nic && (formData.nic.length === 10 || formData.nic.length === 12)) {
                // Parse NIC
                const parsed = nicService.parseNIC(formData.nic);
                if (parsed) {
                    setFormData(prev => ({
                        ...prev,
                        gender: parsed.gender,
                        date_of_birth: parsed.dob,
                        age: parsed.age.toString()
                    }));
                }

                // Check Duplication
                const isAvailable = await staffService.checkAvailability('nic', formData.nic);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, nic: 'This NIC is already registered to another staff member' }));
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
            } else if (formData.nic && formData.nic.length > 0) {
                // Basic format check
                const nicRegex = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
                if (!nicRegex.test(formData.nic)) {
                    setFieldErrors(prev => ({ ...prev, nic: 'Invalid NIC format' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, nic: '' }));
                }
            }
        };

        const timer = setTimeout(checkNIC, 500);
        return () => clearTimeout(timer);
    }, [formData.nic]);

    // Email Availability Check (Login & Personal)
    useEffect(() => {
        const checkEmail = async () => {
            // Check login email
            if (formData.email && formData.email.includes('@')) {
                const isAvailable = await staffService.checkAvailability('email', formData.email);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, email: 'This login email is already registered' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                }
            }

            // Check personal email (independent check)
            if (formData.personal_email && formData.personal_email.includes('@')) {
                const isAvailable = await staffService.checkAvailability('personal_email', formData.personal_email);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, personal_email: 'Personal email already registered' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, personal_email: '' }));
                }
            }
        };
        const timer = setTimeout(checkEmail, 600);
        return () => clearTimeout(timer);
    }, [formData.email, formData.personal_email]);

    // Contact Availability Check (Login & Personal)
    useEffect(() => {
        const checkContact = async () => {
            // Check login mobile
            if (formData.contactKey && formData.contactKey.length === 10) {
                const isAvailable = await staffService.checkAvailability('contact', formData.contactKey);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, contactKey: 'This login mobile is already in use' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, contactKey: '' }));
                }
            } else if (formData.contactKey && formData.contactKey.length > 0) {
                const stripped = formData.contactKey.replace(/\D/g, "");
                if (!/^0[0-9]{9}$/.test(stripped)) {
                    setFieldErrors(prev => ({ ...prev, contactKey: 'Must be 10 digits starting with 0' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, contactKey: '' }));
                }
            }

            // Check personal mobile (independent)
            if (formData.personal_mobile && formData.personal_mobile.length === 10) {
                const isAvailable = await staffService.checkAvailability('personal_mobile', formData.personal_mobile);
                if (!isAvailable) {
                    setFieldErrors(prev => ({ ...prev, personal_mobile: 'Personal mobile already registered' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, personal_mobile: '' }));
                }
            }
        };
        const timer = setTimeout(checkContact, 500);
        return () => clearTimeout(timer);
    }, [formData.contactKey, formData.personal_mobile]);

    // Branch Manager Conflict Check
    // When role is "manager" and a branch is selected, check if that branch already has a manager
    useEffect(() => {
        const checkBranchManager = async () => {
            const selectedRoleObj = roles.find(r => r.id.toString() === formData.roleId);
            const isManagerRole = selectedRoleObj?.name === 'manager';

            if (isManagerRole && formData.branch) {
                const conflictMessage = await staffService.checkBranchManager(formData.branch);
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
    }, [formData.roleId, formData.branch, roles]);

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
                setFormData(prev => ({ ...prev, [name]: value }));
            }
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
        } else if (['personal_mobile', 'contactKey', 'emergency_contact_number', 'office_mobile'].includes(name)) {
            // Strip everything except digits
            const digits = (val as string).replace(/\D/g, "");

            // Apply mask as user types
            let formatted = digits;
            if (digits.length > 3 && digits.length <= 6) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
            } else if (digits.length > 6) {
                formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
            }
            // Update the local val since it's used below
            const formattedVal = formatted;

            setFormData(prev => {
                const updated = { ...prev, [name]: formattedVal };
                // Mirror login mobile to office mobile if name is contactKey
                if (name === 'contactKey') {
                    updated.office_mobile = formattedVal;
                }
                return updated;
            });
        } else if (name === 'email') {
            // Mirror login email to office email and enforce lowercase
            const lowercaseEmail = value.toLowerCase();
            setFormData(prev => ({ ...prev, email: lowercaseEmail, office_email: lowercaseEmail }));
        } else if (name === 'office_email' || name === 'personal_email') {
            // Enforce lowercase for other email fields as well
            setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }

        // Immediate simple validation on change
        if (name === 'bank_account_number' || name === 'confirm_account_number') {
            const acc = name === 'bank_account_number' ? value : formData.bank_account_number;
            const confirm = name === 'confirm_account_number' ? value : formData.confirm_account_number;
            if (acc !== confirm && confirm.length > 0) {
                setFieldErrors(prev => ({ ...prev, confirm_account_number: 'Account numbers do not match' }));
            } else {
                setFieldErrors(prev => ({ ...prev, confirm_account_number: '' }));
            }
        }

        if (name === 'bank_name') {
            const rule = BANK_VALIDATION_RULES[value] || BANK_VALIDATION_RULES['Default'];
            if (formData.bank_account_number && !rule.regex.test(formData.bank_account_number)) {
                setFieldErrors(prev => ({ ...prev, bank_account_number: rule.error }));
            } else {
                setFieldErrors(prev => ({ ...prev, bank_account_number: '' }));
            }
        }

        if (name === 'bank_account_number') {
            const rule = BANK_VALIDATION_RULES[formData.bank_name] || BANK_VALIDATION_RULES['Default'];
            if (value && !rule.regex.test(value)) {
                setFieldErrors(prev => ({ ...prev, bank_account_number: rule.error }));
            } else {
                setFieldErrors(prev => ({ ...prev, bank_account_number: '' }));
            }
        }

        if (name === 'basic_salary') {
            if (parseFloat(value) < 0) {
                setFieldErrors(prev => ({ ...prev, basic_salary: 'Salary cannot be negative' }));
            } else {
                setFieldErrors(prev => ({ ...prev, basic_salary: '' }));
            }
        }

        if (name === 'bms_experience' || name === 'total_experience') {
            const bms = name === 'bms_experience' ? value : formData.bms_experience;
            const total = name === 'total_experience' ? value : formData.total_experience;

            if (bms && total) {
                // Extract numbers if user formats like "2 Years"
                const bmsVal = parseFloat(bms) || 0;
                const totalVal = parseFloat(total) || 0;

                if (totalVal < bmsVal) {
                    setFieldErrors(prev => ({ ...prev, total_experience: 'Total experience must be greater than BMS experience' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, total_experience: '' }));
                }
            } else {
                setFieldErrors(prev => ({ ...prev, total_experience: '' }));
            }
        }

        // Clear general errors if field is modified (except duplication errors)
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
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateTab = (tab: TabType): string | null => {
        const errors: Record<string, string> = {};

        if (tab === 'basic') {
            if (!formData.name.trim()) errors.name = 'Full Name is required';
            if (!formData.name_with_initial.trim()) errors.name_with_initial = 'Name with Initials is required';
            if (!formData.nic.trim()) errors.nic = 'NIC is required';
            if (!formData.gender) errors.gender = 'Gender is required';
            if (!formData.age || parseInt(formData.age) < 18) errors.age = 'Must be 18 or older';
            if (!formData.address.trim()) errors.address = 'Permanent Address is required';

            if (!formData.contactKey.trim()) {
                errors.contactKey = 'Personal Mobile is required';
            } else {
                const stripped = formData.contactKey.replace(/\D/g, "");
                if (!/^0[0-9]{9}$/.test(stripped)) {
                    errors.contactKey = 'Mobile must be 10 digits starting with 0';
                }
            }

            // NIC Format
            const nicRegex = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
            if (formData.nic && !nicRegex.test(formData.nic)) {
                errors.nic = 'Invalid NIC format';
            }
        }

        if (tab === 'employment') {
            if (!formData.roleId) errors.roleId = 'Role is required';
            if (!formData.email.trim()) errors.email = 'Login Email (Office) is required';
            if (!formData.email.includes('@')) errors.email = 'Invalid email format';
            if (!formData.password.trim() && isAdminRole) {
                errors.password = 'Password is required for admin roles';
            }
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

        if (tab === 'salary') {
            if (!formData.basic_salary) {
                errors.basic_salary = 'Basic salary is required';
            } else if (parseFloat(formData.basic_salary) < 0) {
                errors.basic_salary = 'Salary cannot be negative';
            }

            if (!formData.bank_name) {
                errors.bank_name = 'Bank Name is required';
            }

            if (!formData.bank_account_number.trim()) {
                errors.bank_account_number = 'Account number is required';
            } else {
                const rule = BANK_VALIDATION_RULES[formData.bank_name] || BANK_VALIDATION_RULES['Default'];
                if (!rule.regex.test(formData.bank_account_number)) {
                    errors.bank_account_number = rule.error;
                }
            }

            if (formData.bank_account_number !== formData.confirm_account_number) {
                errors.confirm_account_number = 'Account numbers do not match';
            }
        }

        // Check for duplication errors (NIC, Email, Contact, Branch Manager) if they've been set by useEffect
        const duplicationFields: Record<string, string> = {
            nic: 'NIC',
            email: 'Login Email',
            contactKey: 'Contact Number',
            branch: 'Branch'
        };

        Object.keys(duplicationFields).forEach(field => {
            if (fieldErrors[field] && fieldErrors[field].toLowerCase().includes('already')) {
                errors[field] = fieldErrors[field];
            }
        });

        if (Object.keys(errors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...errors }));
            return Object.values(errors)[0]; // Return the first error message
        }

        return null;
    };

    const handleTabChange = (nextTabId: TabType) => {
        const tabOrder: TabType[] = ['basic', 'employment', 'education', 'experience', 'salary', 'emergency'];
        const currentIndex = tabOrder.indexOf(currentTab);
        const nextIndex = tabOrder.indexOf(nextTabId);

        if (nextIndex <= currentIndex) {
            setCurrentTab(nextTabId);
            return;
        }

        // Sequentially validate tabs when trying to jump forward
        for (let i = currentIndex; i < nextIndex; i++) {
            const error = validateTab(tabOrder[i]);
            if (error) {
                toast.warning(`Please complete the ${tabOrder[i].charAt(0).toUpperCase() + tabOrder[i].slice(1)} section: ${error}`);
                setCurrentTab(tabOrder[i]);
                return;
            }
        }

        setCurrentTab(nextTabId);
    };

    const validate = () => {
        const tabOrder: TabType[] = ['basic', 'employment', 'education', 'experience', 'salary', 'emergency'];
        for (const tab of tabOrder) {
            const error = validateTab(tab);
            if (error) {
                toast.error(`${tab.charAt(0).toUpperCase() + tab.slice(1)}: ${error}`);
                setCurrentTab(tab);
                return false;
            }
        }
        return true;
    };

    const handleSubmitClick = async () => {
        if (!validate()) {
            toast.error('Please fix the errors before submitting.');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();

            data.append('staffId', '');

            // Map flat formData to the structured backend payload
            data.append('role_name', selectedRole?.name || '');
            data.append('roleId', formData.roleId);
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
            data.append('preferred_language', formData.preferred_language || 'Tamil');

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

            // JSON fields (PHP Laravel will decode them automatically in Staff model if cast)
            // But we send them as individual appends if multipart, or a stringified JSON
            // For multipart/form-data, we can send as arrays: education_info[skill] etc
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

            // Regular fields
            data.append('basic_salary', formData.basic_salary);
            data.append('bank_name', formData.bank_name);
            data.append('account_holder_name', formData.account_holder_name);
            data.append('bank_account_number', formData.bank_account_number);
            data.append('bank_branch', formData.bank_branch);

            // Work info for backend compatibility
            data.append('work_info', JSON.stringify({
                designation: selectedRole?.display_name || '',
                department: formData.department
            }));

            if (profileFile) {
                data.append('profile_image_file', profileFile);
            }

            await onSubmit(data);
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to save staff member');
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'basic', label: 'Basic & Contact', icon: <User className="w-4 h-4" /> },
        { id: 'employment', label: 'Employment', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'education', label: 'Qualifications', icon: <Award className="w-4 h-4" /> },
        { id: 'experience', label: 'Experience', icon: <FileText className="w-4 h-4" /> },
        { id: 'salary', label: 'Salary & Bank', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'emergency', label: 'Others', icon: <Heart className="w-4 h-4" /> },
    ];

    const renderField = (label: string, name: string, type: string = 'text', placeholder: string = '', options?: { value: string; label: string }[], isRequired: boolean = false, isReadOnly: boolean = false, autoComplete: string = 'off', rows: number = 4) => (
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
                                    <div className="py-8 text-center">
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
                    rows={rows}
                    placeholder={placeholder}
                    readOnly={isReadOnly}
                    className={`w-full px-5 py-2 bg-muted-bg/50 border ${fieldErrors[name] ? 'border-rose-500' : 'border-border-default'} rounded-2xl text-[13px] font-bold text-text-primary outline-none transition-all hover:bg-muted-bg focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 resize-none placeholder:text-text-muted/30 disabled:opacity-50 uppercase`}
                />
            ) : (
                <div className="relative group/input flex items-center">
                    <input
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        type={type === 'password' && visibleFields[name] ? 'text' : type}
                        placeholder={placeholder}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                        onKeyDown={type === 'number' ? (e) => {
                            if (e.key === '-' || e.key === 'e') {
                                e.preventDefault();
                            }
                        } : undefined}
                        min={type === 'number' ? "0" : undefined}
                        onPaste={name === 'confirm_account_number' || name === 'nic' || name === 'bank_account_number' ? (e) => e.preventDefault() : undefined}
                        autoComplete={autoComplete}
                        className={`w-full px-5 py-3.5 bg-muted-bg/50 border ${fieldErrors[name] ? 'border-rose-500' : 'border-border-default'} rounded-2xl text-[13px] font-bold text-text-primary outline-none transition-all hover:bg-muted-bg focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 placeholder:text-text-muted/30 disabled:opacity-50 ${type !== 'password' && type !== 'email' ? 'uppercase' : ''}`}
                    />
                    {type === 'password' && (
                        <button
                            type="button"
                            onClick={() => setVisibleFields(prev => ({ ...prev, [name]: !prev[name] }))}
                            className="absolute right-4 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                        >
                            {visibleFields[name] ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                    )}
                    {fieldErrors[name] && (
                        <p className="absolute -bottom-6 left-1 text-[10px] font-black text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
                            {fieldErrors[name]}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-card rounded-[2.5rem] max-w-4xl w-full shadow-2xl border border-border-default/50 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border-default flex items-center justify-between bg-table-header/30 flex-wrap gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <div className="sr-only">
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">
                                REGISTER EMPLOYEE
                            </h2>
                            <p className="text-sm text-text-muted font-bold mt-0.5">Initialize a new staff profile in the BMS ecosystem</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDraftModalOpen(true)}
                            className="flex items-center gap-3 px-5 py-3 bg-muted-bg/50 text-text-muted hover:text-text-primary hover:bg-muted-bg rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest border border-border-default"
                        >
                            <History className="w-4 h-4 text-primary-500" />
                            Drafts
                        </button>
                        <button
                            onClick={() => {
                                const result = saveDraft();
                                if (result.success) toast.success(result.message);
                                else toast.info(result.message);
                            }}
                            className="flex items-center gap-3 px-5 py-3 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest border border-primary-500/20"
                        >
                            <Save className="w-4 h-4" />
                            Save Draft
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-muted-bg text-text-muted hover:text-text-primary rounded-2xl transition-all active:scale-95 bg-muted-bg/50 ml-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-4 bg-table-header/20 border-b border-border-default gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
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

                {/* Form Content */}
                <div ref={formContentRef} className="flex-1 overflow-y-auto p-8 scroll-smooth space-y-10 custom-scrollbar">
                    {/* Fake inputs to prevent Chrome autofill */}
                    <input type="text" style={{ display: 'none' }} aria-hidden="true" />
                    <input type="password" style={{ display: 'none' }} aria-hidden="true" />

                    {currentTab === 'basic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col lg:flex-row gap-12 items-start">
                                {/* Profile Picture Upload */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-40 h-40 rounded-[2.5rem] bg-muted-bg border-4 border-card shadow-inner flex items-center justify-center overflow-hidden ring-1 ring-border-default">
                                            {previewImage ? (
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                                    {renderField('Name with Initials', 'name_with_initial', 'text', 'Auto-generated', [], true, true)}
                                    {renderField('NIC Number', 'nic', 'text', 'Old or New Format', [], true)}
                                    <div className="grid grid-cols-2 gap-4">
                                        {renderField('Gender', 'gender', 'select', '', [
                                            { value: 'Male', label: 'Male' },
                                            { value: 'Female', label: 'Female' },
                                            { value: 'Other', label: 'Other' }
                                        ], true, true)}
                                        {renderField('Age', 'age', 'number', '', [], true, true)}
                                    </div>
                                    {renderField('Date of Birth', 'date_of_birth', 'text', 'YYYY-MM-DD', [], false, true)}
                                </div>
                            </div>

                            <div className="pt-10 border-t border-border-default">
                                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-primary-500" /> Identity & Contact
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {renderField('Nationality', 'nationality')}
                                    {renderField('Marital Status', 'marital_status', 'select', '', [
                                        { value: 'Single', label: 'Single' },
                                        { value: 'Married', label: 'Married' },
                                        { value: 'Widowed', label: 'Widowed' },
                                        { value: 'Separated', label: 'Separated' }
                                    ])}
                                    {renderField('Preferred Language', 'preferred_language', 'select', '', [
                                        { value: 'Tamil', label: 'Tamil' },
                                        { value: 'English', label: 'English' },
                                        { value: 'Sinhala', label: 'Sinhala' }
                                    ])}
                                    <div className="col-span-1 md:col-span-3">
                                        {renderField('Permanent Address', 'address', 'textarea', 'Complete residential address', [], true, false, 'off', 2)}
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        {renderField('Mailing Address', 'mailing_address', 'textarea', 'If different from permanent', [], false, false, 'off', 2)}
                                    </div>
                                    {renderField('Personal Mobile', 'contactKey', 'tel', 'e.g., 0771234567', [], true, false, 'new-password')}
                                    {renderField('Email Personal', 'personal_email', 'email')}
                                    {renderField('Personal Mobile (Secondary)', 'personal_mobile', 'tel')}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'employment' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-1 md:col-span-3">
                                    {renderField('System Access Role', 'roleId', 'select', '', roles.map(r => ({ value: r.id.toString(), label: r.display_name })), true)}
                                </div>
                                {renderField('Department', 'department')}
                                {renderField('Employee Type', 'employee_type', 'select', '', [
                                    { value: 'Permanent', label: 'Permanent' },
                                    { value: 'Contract', label: 'Contract' },
                                    { value: 'Part-Time', label: 'Part-Time' },
                                    { value: 'Probation', label: 'Probation' }
                                ])}
                                {renderField('Login Email (Office)', 'email', 'email', 'Used for system login', [], true, false, 'new-email')}
                                {renderField('Date of Joining', 'joinedDate', 'date')}
                                {renderField('Permanent Date', 'permanent_date', 'date')}
                                {renderField('Confirmation Date', 'confirmation_date', 'date')}

                                <div className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10 col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
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

                                <div className="pt-6 border-t border-border-default col-span-1 md:col-span-3">
                                    <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                        <Building2 className="w-4 h-4 text-primary-500" /> Location & Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            {renderField('Branch / Location', 'branch', 'select', '', officeBranches.map(b => ({ value: b.id.toString(), label: b.branch_name })), false)}
                                        </div>
                                        {renderField('Branch Code', 'branch_code', 'text', '', [], false, !!formData.branch)}
                                        {renderField('Office Mobile', 'office_mobile', 'tel', '', [], false, !!formData.branch)}
                                        <div className="col-span-1 md:col-span-2">
                                            {renderField('Office Mail Address', 'office_email', 'email', '', [], false, !!formData.branch)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'education' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            {renderField('Highest Qualification', 'highest_qualification')}
                            {renderField('Professional Certifications', 'professional_certifications', 'textarea', 'e.g., CIMA, ACA, etc')}
                            {renderField('Special Skills', 'special_skills', 'textarea')}
                            {renderField('Languages Known', 'languages_known')}
                        </div>
                    )}

                    {currentTab === 'experience' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField('BMS Capital Experience', 'bms_experience', 'number', 'Years of experience')}
                                {renderField('Total Experience', 'total_experience', 'number', 'Total years of experience')}
                            </div>
                            {renderField('Previous Company', 'previous_company')}
                            {renderField('Last Designation', 'last_designation')}
                            {renderField('Key Responsibilities', 'key_responsibilities', 'textarea')}
                        </div>
                    )}

                    {currentTab === 'salary' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {renderField('Basic Salary (LKR)', 'basic_salary', 'number', '0.00')}
                                {renderField('Allowances', 'allowances', 'number', '0.00')}
                                {renderField('Incentives / Commission', 'incentives', 'number', '0.00')}
                                <div className="col-span-1 md:col-span-3">
                                    {renderField('EPF / ETF / Other Benefits', 'other_benefits', 'textarea')}
                                </div>
                            </div>

                            <div className="p-6 bg-primary-500/5 rounded-[2.5rem] border border-primary-500/10 space-y-6">
                                <h3 className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <DollarSign className="w-4 h-4" /> Bank Details (Verified)
                                </h3>
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
                                    {renderField('Account Holder Name', 'account_holder_name', 'text', '', [], true)}
                                    <div className="hidden md:block"></div>
                                    {renderField('Account Number', 'bank_account_number', 'password', 'Enter account number', [], true, false, 'new-password')}
                                    {renderField('Confirm Account Number', 'confirm_account_number', 'password', 'Re-enter account number', [], true, false, 'new-password')}

                                    {/* <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-muted-bg/30 rounded-[2.5rem] border border-border-default shadow-inner">
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest leading-relaxed flex items-center gap-3">
                                            <Award className="w-4 h-4" />
                                            Copy-paste disabled for account verification. Please type manually for system security.
                                        </p>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'emergency' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="bg-muted-bg/30 p-6 rounded-[2.5rem] border border-border-default">
                                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8">Emergency Contact</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {renderField('Contact Person Name', 'emergency_contact_name')}
                                    {renderField('Relationship', 'emergency_relationship')}
                                    {renderField('Contact Number', 'emergency_contact_number', 'tel')}
                                </div>
                            </div>

                            <div className="bg-muted-bg/30 p-6 rounded-[2.5rem] border border-border-default">
                                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8">Attendance & Leave</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderField('Previous Leave Data', 'previous_leave_data', 'textarea')}
                                    {renderField('Initial Leave Balance', 'leave_balance', 'text', 'e.g., 14 Annual / 7 Casual')}
                                </div>
                            </div>

                            {/* Logic for Super Admin to toggle status during edit */}
                            {authService.hasPermission('admin_dashboard.view') && (
                                <div className="flex items-center justify-between p-6 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10">
                                    <div>
                                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Initial Account Status</p>
                                        <p className="text-[10px] text-text-muted font-bold mt-1">Set the default access level for this profile</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${formData.isActive
                                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                            : 'bg-rose-500 text-white shadow-rose-500/20'
                                            }`}
                                    >
                                        {formData.isActive ? 'ACTIVE ACCESS' : 'INACTIVE ACCESS'}
                                    </button>
                                </div>
                            )}
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
                            CANCEL
                        </button>
                        {currentTab === 'emergency' ? (
                            <button
                                onClick={handleSubmitClick}
                                disabled={loading}
                                className="px-12 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {loading ? 'PROCESSING...' : 'COMPLETE REGISTRATION'}
                                {!loading && <ChevronRight className="w-4 h-4" />}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    const index = tabs.findIndex(t => t.id === currentTab);
                                    if (index < tabs.length - 1) handleTabChange(tabs[index + 1].id as TabType);
                                }}
                                className="px-12 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center gap-3"
                            >
                                CONTINUE <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <StaffDraftModal
                isOpen={isDraftModalOpen}
                drafts={drafts}
                onClose={() => setIsDraftModalOpen(false)}
                onLoad={(id) => loadDraft(id)}
                onDelete={(id) => deleteDraft(id)}
            />
        </div>
    );
}
