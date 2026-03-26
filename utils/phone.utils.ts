
/**
 * Utility functions for contact information formatting (Phone, Email, etc.)
 */

/**
 * Formats a raw phone number string into the standard SL format: 07X-XXX-XXXX
 * E.g., "0774383999" -> "077-438-3999"
 */
export const formatPhoneNumber = (phoneNumber: string | null | undefined): string => {
    if (!phoneNumber) return '';
    
    // Strip everything except digits
    const digits = phoneNumber.replace(/\D/g, "");
    
    if (digits.length <= 3) {
        return digits;
    } else if (digits.length <= 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
};
