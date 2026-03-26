
/**
 * Collection Utility Functions
 */

export interface DueInstallment {
    id: string;
    due_date: string;
    rental_amount: number;
    remained_due: number;
    penalty_amount: number;
    penalty_paid: number;
}

/**
 * Calculates the Arrears Category based on days overdue
 * 0 days: Standard (Performing)
 * 1-30 days: Special Mention
 * 31-90 days: Substandard
 * 91-180 days: Doubtful
 * > 180 days: Loss/Bad
 */
export const getArrearsCategory = (daysOverdue: number): string => {
    if (daysOverdue <= 0) return 'Standard';
    if (daysOverdue <= 30) return 'Special Mention';
    if (daysOverdue <= 90) return 'Substandard';
    if (daysOverdue <= 180) return 'Doubtful';
    return 'Loss';
};

/**
 * Calculates collection efficiency percentage
 */
export const calculateCollectionEfficiency = (collected: number, due: number): number => {
    if (due <= 0) return collected > 0 ? 100 : 0;
    return Math.min(Math.round((collected / due) * 100), 100);
};

/**
 * Previews how a payment will be allocated across multiple dues.
 * Logic: Oldest First, Penalty First.
 */
export const previewPaymentAllocation = (
    amount: number,
    dues: DueInstallment[]
): { allocations: any[], remaining: number } => {
    let remainingCash = amount;
    const allocations: any[] = [];

    // Sort dues by date (Oldest first)
    const sortedDues = [...dues].sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

    for (const due of sortedDues) {
        if (remainingCash <= 0) break;

        const allocation = {
            installment_id: due.id,
            penalty_paid: 0,
            rental_paid: 0
        };

        // 1. Penalty First
        const penaltyBalance = due.penalty_amount - due.penalty_paid;
        if (penaltyBalance > 0) {
            const toPay = Math.min(remainingCash, penaltyBalance);
            allocation.penalty_paid = toPay;
            remainingCash -= toPay;
        }

        if (remainingCash <= 0) {
            allocations.push(allocation);
            break;
        }

        // 2. Rental next
        const rentalBalance = due.remained_due;
        if (rentalBalance > 0) {
            const toPay = Math.min(remainingCash, rentalBalance);
            allocation.rental_paid = toPay;
            remainingCash -= toPay;
        }

        allocations.push(allocation);
    }

    return {
        allocations,
        remaining: Math.round(remainingCash * 100) / 100
    };
};
