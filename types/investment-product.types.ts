export interface InterestRateTier {
    term_months: number;
    interest_monthly: number;
    interest_maturity: number;
    breakdown_monthly: number;
    breakdown_maturity: number;
}

export interface NegotiationRates {
    monthly: number;
    maturity: number;
}

export interface InvestmentProduct {
    id: number;
    product_code: string;
    name: string;
    age_limited: number;
    min_amount: number;
    max_amount: number;
    interest_rates_json: InterestRateTier[];
    negotiation_rates_json?: NegotiationRates;
    interest_rate?: string | number;
    duration_months?: number;
    early_withdrawal_penalty?: string | number;
    created_at?: string;
    updated_at?: string;
}

export interface InvestmentProductFormData {
    product_code: string;
    name: string;
    age_limited: number;
    min_amount: number;
    max_amount: number;
    interest_rates_json: InterestRateTier[];
    negotiation_rates_json?: NegotiationRates;
}
