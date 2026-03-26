
import { InvestmentProduct, InterestRateTier } from '@/types/investment-product.types';

/**
 * Validates if the investment amount meets the product's minimum requirements
 */
export const validateInvestmentAmount = (amount: number, product: InvestmentProduct): { isValid: boolean; message?: string } => {
    if (amount < product.min_amount) {
        return {
            isValid: false,
            message: `Amount must be at least LKR ${product.min_amount.toLocaleString()}`
        };
    }
    if (product.max_amount > 0 && amount > product.max_amount) {
        return {
            isValid: false,
            message: `Amount cannot exceed LKR ${product.max_amount.toLocaleString()}`
        };
    }
    return { isValid: true };
};

/**
 * Finds the interest rate tier matching the selected term
 */
export const findTierByTerm = (termMonths: number, product: InvestmentProduct): InterestRateTier | undefined => {
    return product.interest_rates_json.find(t => t.term_months === termMonths);
};

/**
 * Validates the complete investment form data
 */
export const validateInvestmentForm = (data: {
    customer_id: string;
    product_id: string;
    amount: string | number;
    policy_term: string | number;
    nominees?: any[];
}): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.customer_id) errors.push('Customer selection is required');
    if (!data.product_id) errors.push('Product selection is required');
    if (!data.amount || Number(data.amount) <= 0) errors.push('Valid investment amount is required');
    if (!data.policy_term) errors.push('Investment term is required');

    if (data.nominees && data.nominees.length > 0) {
        data.nominees.forEach((nominee, index) => {
            const nomineeId = nominee.id_type === 'BC' ? 'Birth Certificate' : 'NIC';
            if (!nominee.name?.trim()) errors.push(`Nominee #${index + 1} name is required`);
            if (!nominee.id_type) errors.push(`Nominee #${index + 1} ID type is required`);

            if (!nominee.nic?.trim()) {
                errors.push(`Nominee #${index + 1} ${nomineeId} number is required`);
            } else if (nominee.id_type === 'NIC') {
                // Validate Sri Lankan NIC format (9 digits + V/X or 12 digits)
                const nicPattern = /^([0-9]{9}[x|X|v|V]|[0-9]{12})$/;
                if (!nicPattern.test(nominee.nic.trim())) {
                    errors.push(`Nominee #${index + 1} NIC format is invalid`);
                }
            }

            if (!nominee.relationship) errors.push(`Nominee #${index + 1} relationship is required`);
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Filters investments based on search term and status
 */
export const filterInvestments = (
    investments: any[],
    searchTerm: string,
    statusFilter: string
): any[] => {
    return investments.filter(inv => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term || (
            inv.transaction_id.toLowerCase().includes(term) ||
            inv.customer?.full_name?.toLowerCase().includes(term) ||
            inv.product?.name?.toLowerCase().includes(term)
        );
        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
};

/**
 * Calculates summary statistics for a list of investments
 */
export const calculateInvestmentStats = (investments: any[]) => {
    const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
    const totalPrincipal = activeInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const activeCount = activeInvestments.length;
    const totalCount = investments.length;
    const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

    return {
        totalPrincipal,
        activeCount,
        totalCount,
        activePercentage
    };
};

/**
 * Calculates the maturity date based on the start date and term in months.
 * Ensuring it handles month-end overflows correctly (e.g., Jan 31 + 1 month = Feb 28/29).
 */
export const calculateMaturityDate = (startDate: string | Date, termMonths: number): Date => {
    const d = new Date(startDate);
    const date = d.getDate();
    d.setMonth(d.getMonth() + termMonths);
    if (d.getDate() !== date) {
        d.setDate(0);
    }
    return d;
};

/**
 * Calculates estimated interest based on payout type and tier rates
 */
export const calculateEstimatedInterest = (
    amount: number,
    termMonths: number,
    payoutType: 'MONTHLY' | 'MATURITY',
    tier: InterestRateTier,
    negotiationRate: number = 0
): {
    periodicInterest: number;
    totalInterest: number;
    effectiveRate: number
} => {
    const baseRate = payoutType === 'MONTHLY' ? tier.interest_monthly : tier.interest_maturity;
    const effectiveRate = Number(baseRate) + Number(negotiationRate);

    // Total interest over the full term
    const totalInterest = (amount * effectiveRate * (termMonths / 12)) / 100;

    // Periodic interest (monthly payout)
    const periodicInterest = payoutType === 'MONTHLY'
        ? (amount * (Number(tier.interest_monthly) / 100)) / 12
        : 0;

    return {
        periodicInterest: Math.round(periodicInterest * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        effectiveRate
    };
};

/**
 * Calculates the payout amount for an early withdrawal
 * Matches Backend Logic in InvestmentService.php
 */
export const calculateEarlyWithdrawalPayout = (
    principal: number,
    stayedMonths: number,
    payoutType: 'MONTHLY' | 'MATURITY',
    tier: InterestRateTier,
    negotiationRate: number = 0
): {
    principal: number;
    interestEarned: number;
    overpaidInterest: number;
    netPayout: number;
} => {
    const negotiation = Number(negotiationRate);
    let interestEarned = 0;
    let overpaidInterest = 0;

    if (payoutType === 'MATURITY') {
        const breakRate = Number(tier.breakdown_maturity) + negotiation;
        interestEarned = (principal * (breakRate / 100)) * (stayedMonths / 12);
    } else {
        // MONTHLY Payout logic (Clawback)
        const normalRate = Number(tier.interest_monthly);
        const breakRate = Number(tier.breakdown_monthly) + negotiation;

        const monthlyInterestAtNormalRate = (principal * (normalRate / 100)) / 12;
        const interestAlreadyPaid = monthlyInterestAtNormalRate * stayedMonths;
        const allowedInterest = (principal * (breakRate / 100)) * (stayedMonths / 12);

        overpaidInterest = Math.max(0, interestAlreadyPaid - allowedInterest);
        interestEarned = allowedInterest;
    }

    const netPayout = principal + (payoutType === 'MATURITY' ? interestEarned : -overpaidInterest);

    return {
        principal,
        interestEarned: Math.round(interestEarned * 100) / 100,
        overpaidInterest: Math.round(overpaidInterest * 100) / 100,
        netPayout: Math.round(netPayout * 100) / 100
    };
};
