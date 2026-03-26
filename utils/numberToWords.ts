/**
 * Convert a number to words (Sri Lankan / English format)
 * e.g. 150000 => "One Hundred and Fifty Thousand"
 */
export function numberToWords(num: number): string {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanThousand(n: number): string {
        if (n === 0) return '';
        if (n < 20) return ones[n];
        if (n < 100) {
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        }
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
    }

    if (num < 0) return 'Minus ' + numberToWords(-num);

    let result = '';
    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = Math.floor(num % 1000);

    if (billion) result += convertLessThanThousand(billion) + ' Billion ';
    if (million) result += convertLessThanThousand(million) + ' Million ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder) result += convertLessThanThousand(remainder);

    return result.trim();
}

/**
 * Format a number with commas: 150000 => "150,000"
 */
export function formatAmount(amount: number | string): string {
    return Number(amount).toLocaleString();
}

/**
 * Calculate end date given start date + weeks
 */
export function calculateEndDate(startDate: string, weeks: number): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (weeks * 7));
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
}
