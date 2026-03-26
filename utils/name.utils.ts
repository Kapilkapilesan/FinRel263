
/**
 * Utility functions for name formatting
 */

/**
 * Generates initials from a surname string.
 * Each word in the surname is converted to its first letter, uppercased, and followed by a dot and space.
 * E.g., "ram sathya kumar" -> "R. S. K. "
 */
export const getSurnameInitials = (surname: string): string => {
    if (!surname.trim()) return '';

    return surname
        .trim()
        .split(/\s+/)
        .map(word => {
            const firstLetter = word.charAt(0).toUpperCase();
            return firstLetter ? `${firstLetter}. ` : '';
        })
        .join('');
};

/**
 * Gets initials from a full name.
 * E.g., "John Doe" -> "JD"
 */
export const getInitials = (name: string): string => {
    if (!name || !name.trim()) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Formats full name from first name and surname.
 * E.g., "ravi", "ram" -> "ravi ram"
 */
export const formatFullName = (firstName: string, surname: string): string => {
    const fn = firstName.trim().toUpperCase();
    const sn = surname.trim().toUpperCase();
    if (!fn && !sn) return '';
    if (!fn) return sn;
    if (!sn) return fn;
    return `${fn} ${sn}`;
};

/**
 * Formats name with initials from first name and surname.
 * E.g., "siva", "ram sathya kumar" -> "R. S. K. SIVA"
 */
export const formatNameWithInitials = (firstName: string, surname: string): string => {
    const fn = firstName.trim().toUpperCase();
    const sn = surname.trim().toUpperCase();

    if (!sn) return fn;

    const initials = getSurnameInitials(sn);
    return initials ? `${initials}${fn}` : fn;
};
