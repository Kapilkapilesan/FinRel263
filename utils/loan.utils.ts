import { CustomerRecord, LoanFormData } from '@/types/loan.types';

export const extractGenderFromNIC = (nic: string): 'Male' | 'Female' | null => {
    const cleanNIC = nic.toUpperCase().trim();
    let dayValue = 0;

    if (/^(\d{9})[VX]$/.test(cleanNIC)) {
        dayValue = parseInt(cleanNIC.substring(2, 5));
    } else if (/^(\d{12})$/.test(cleanNIC)) {
        dayValue = parseInt(cleanNIC.substring(4, 7));
    } else {
        return null;
    }

    return dayValue > 500 ? 'Female' : 'Male';
};

export const isValidNIC = (nic: string): boolean => {
    return /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/.test(nic.trim());
};

export const calculateTotalFees = (formData: LoanFormData): number => {
    return (
        Number(formData.processingFee || 0) +
        Number(formData.documentationFee || 0) +
        Number(formData.insuranceFee || 0)
    );
};

export const calculateNetDisbursement = (formData: LoanFormData): number => {
    return Number(formData.loanAmount || 0) - calculateTotalFees(formData);
};

export const findCustomerByNic = (
    nic: string,
    customerRecords: CustomerRecord[]
): CustomerRecord | undefined => {
    return customerRecords.find(
        (customer) => customer.nic.toLowerCase() === nic.toLowerCase()
    );
};

export const findCustomerById = (
    id: string,
    customerRecords: CustomerRecord[]
): CustomerRecord | undefined => {
    return customerRecords.find((customer) => customer.id === id);
};

export const getUniqueCenters = (customerRecords: CustomerRecord[]): string[] => {
    return Array.from(new Set(customerRecords.map((customer) => customer.center)));
};

export const getGroupsByCenter = (
    center: string,
    customerRecords: CustomerRecord[]
): string[] => {
    const filtered = center
        ? customerRecords.filter((customer) => customer.center === center)
        : customerRecords;
    return Array.from(new Set(filtered.map((customer) => customer.group)));
};

export const filterCustomersBySelection = (
    center: string,
    group: string,
    customerRecords: CustomerRecord[]
): CustomerRecord[] => {
    return customerRecords.filter((customer) => {
        const matchesCenter = center ? customer.center === center : true;
        const matchesGroup = group ? customer.group === group : true;
        return matchesCenter && matchesGroup;
    });
};

export const generateDraftName = (
    customer: CustomerRecord | undefined,
    nic: string,
    customerId: string
): string => {
    return (
        customer?.displayName ||
        (nic ? `NIC ${nic}` : customerId || 'Untitled draft')
    );
};

export const formatCurrency = (amount: number): string => {
    return `LKR ${amount.toLocaleString()}`;
};

export const getDocumentUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }
    // API URL is usually something like http://localhost:8000/api
    // Assets are usually served from http://localhost:8000/storage/uploads/...
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');

    // Ensure the path is correctly prefixed with storage/ if it's a relative path from the public disk
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;

    return `${baseUrl}/${storagePath}`;
};
/**
 * Extracts Birthday from NIC
 * Sri Lankan Standard: Treats every year as a leap year for day counting.
 */
export const extractBirthdayFromNIC = (nic: string): string | null => {
    const cleanNIC = nic.toUpperCase().trim();
    let birthYear = 0;
    let dayValue = 0;

    if (/^(\d{9})[VX]$/.test(cleanNIC)) {
        birthYear = parseInt('19' + cleanNIC.substring(0, 2));
        dayValue = parseInt(cleanNIC.substring(2, 5));
    } else if (/^(\d{12})$/.test(cleanNIC)) {
        birthYear = parseInt(cleanNIC.substring(0, 4));
        dayValue = parseInt(cleanNIC.substring(4, 7));
    } else {
        return null;
    }

    if (dayValue > 500) dayValue -= 500;

    // Sri Lankan NIC logic: Always use a leap year (like 2000) for the calculation 
    // to ensure day counts match the DRP standard (e.g., day 227 is always August 14).
    const date = new Date(2000, 0); // Jan 1st, 2000
    date.setDate(dayValue);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${birthYear}-${month}-${day}`;
};

/**
 * Calculates the installment rental (Principal + Interest) / Terms
 */
export const calculateRental = (principal: number, interestRatePercentage: number, terms: number): number => {
    if (terms <= 0) return 0;
    const interest = (principal * interestRatePercentage) / 100;
    return Math.round(((principal + interest) / terms) * 100) / 100;
};

/**
 * Calculates the first due date based on Company Business Rules:
 * Activation 1-7   -> 15th
 * Activation 8-14  -> 22nd
 * Activation 15-21 -> Next month 1st
 * Activation 22-EOM -> Next month 8th
 * 
 * Uses manual formatting to avoid UTC timezone shifts.
 */
export const calculateFirstDueDate = (activationDate: string | Date): { firstDueDate: string; dueDay: number } => {
    const date = new Date(activationDate);
    const day = date.getDate();
    let targetDay = 0;
    let targetMonth = date.getMonth();
    let targetYear = date.getFullYear();

    if (day >= 1 && day <= 7) {
        targetDay = 15;
    } else if (day >= 8 && day <= 14) {
        targetDay = 22;
    } else if (day >= 15 && day <= 21) {
        targetDay = 1;
        targetMonth += 1;
    } else {
        targetDay = 8;
        targetMonth += 1;
    }

    // Handle year overflow
    const firstDue = new Date(targetYear, targetMonth, targetDay);
    const yyyy = firstDue.getFullYear();
    const mm = String(firstDue.getMonth() + 1).padStart(2, '0');
    const dd = String(firstDue.getDate()).padStart(2, '0');

    return {
        firstDueDate: `${yyyy}-${mm}-${dd}`,
        dueDay: targetDay
    };
};
