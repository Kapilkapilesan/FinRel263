export const numberToWords = (num: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (num === 0) return 'Zero';

    const convertChunk = (n: number): string => {
        let str = '';
        if (n >= 100) {
            str += units[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            str += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        }
        if (n > 0) {
            str += units[n] + ' ';
        }
        return str.trim();
    };

    let words = '';
    let scaleIndex = 0;
    let integerPart = Math.floor(num);

    while (integerPart > 0) {
        const chunk = integerPart % 1000;
        if (chunk > 0) {
            words = convertChunk(chunk) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + ' ' + words;
        }
        integerPart = Math.floor(integerPart / 1000);
        scaleIndex++;
    }

    return words.trim();
};

export const formatDateToOrdinal = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    const suffix = (d: number) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };

    return `${day}${suffix(day)} ${month} ${year}`;
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};
