import { LoanProduct, LoanProductFormData, LoanProductFilters, ApiResponse } from '../types/loan-product.types';
import { API_BASE_URL, getHeaders } from './api.config';

export const loanProductService = {
    /**
     * Get all loan products with optional filtering
     */
    getLoanProducts: async (filters?: LoanProductFilters): Promise<LoanProduct[]> => {
        try {
            const params = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        params.append(key, value.toString());
                    }
                });
            }

            const queryString = params.toString();
            const url = `${API_BASE_URL}/loan-products${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, {
                headers: getHeaders()
            });

            if (!response.ok) {
                console.error(`Failed to fetch loan products: ${response.statusText}`);
                return [];
            }

            const json: ApiResponse<LoanProduct[]> = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Error in getLoanProducts:", error);
            return [];
        }
    },

    /**
     * Get a simple list of loan products for dropdowns
     * (Accessible without loan_products.view permission)
     */
    getLoanProductsList: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products/list`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                console.error(`Failed to list loan products: ${response.statusText}`);
                return [];
            }

            const json: ApiResponse<any[]> = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Error in getLoanProductsList:", error);
            return [];
        }
    },

    /**
     * Filter loan products with advanced filters
     */
    filterLoanProducts: async (filters: LoanProductFilters & {
        from_date?: string;
        to_date?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<LoanProduct[]> => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });

            const response = await fetch(`${API_BASE_URL}/loan-products/filter?${params.toString()}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to filter loan products: ${response.statusText}`);
            }

            const json: ApiResponse<LoanProduct[]> = await response.json();
            return json.data;
        } catch (error) {
            console.error("Error in filterLoanProducts:", error);
            throw error;
        }
    },

    /**
     * Get a specific loan product by ID
     */
    getLoanProductById: async (id: number): Promise<LoanProduct> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products/${id}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch loan product details: ${response.statusText}`);
            }

            const json: ApiResponse<LoanProduct> = await response.json();
            return json.data;
        } catch (error) {
            console.error("Error in getLoanProductById:", error);
            throw error;
        }
    },

    /**
     * Create a new loan product
     */
    createLoanProduct: async (data: LoanProductFormData): Promise<LoanProduct> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            const json = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    const errorMessage = json.message || 'Validation failed';
                    const error = new Error(errorMessage);
                    (error as any).errors = json.errors;
                    throw error;
                }
                throw new Error(json.message || 'Failed to create loan product');
            }

            return json.data;
        } catch (error) {
            console.error("Error in createLoanProduct:", error);
            throw error;
        }
    },

    /**
     * Update an existing loan product
     */
    updateLoanProduct: async (id: number, data: Partial<LoanProductFormData>): Promise<LoanProduct> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            const json = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    const errorMessage = json.message || 'Validation failed';
                    const error = new Error(errorMessage);
                    (error as any).errors = json.errors;
                    throw error;
                }
                throw new Error(json.message || 'Failed to update loan product');
            }

            return json.data;
        } catch (error) {
            console.error("Error in updateLoanProduct:", error);
            throw error;
        }
    },

    /**
     * Delete/Cancel a loan product
     */
    deleteLoanProduct: async (id: number): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                const json = await response.json().catch(() => ({}));
                throw new Error(json.message || 'Failed to delete loan product');
            }
        } catch (error) {
            console.error("Error in deleteLoanProduct:", error);
            throw error;
        }
    },

    /**
     * Get loan products by customer ID (if applicable)
     */
    getLoanProductsByCustomerId: async (customerId: string): Promise<LoanProduct[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products/customer/${customerId}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch customer loan products: ${response.statusText}`);
            }

            const json: ApiResponse<LoanProduct[]> = await response.json();
            return json.data;
        } catch (error) {
            console.error("Error in getLoanProductsByCustomerId:", error);
            throw error;
        }
    },

    /**
     * Approve or send back a loan product
     */
    approveLoanProduct: async (id: number | string, action: 'approve' | 'send_back'): Promise<LoanProduct> => {
        try {
            const response = await fetch(`${API_BASE_URL}/loan-products/${id}/approve`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ action })
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.message || 'Failed to process loan action');
            }

            return json.data;
        } catch (error) {
            console.error("Error in approveLoanProduct:", error);
            throw error;
        }
    },

    /**
     * Check if product code is available
     */
    checkProductCode: async (code: string, excludeId?: number): Promise<{ status: 'available' | 'unavailable' | 'invalid'; message: string }> => {
        let url = `${API_BASE_URL}/loan-products/check-code?code=${encodeURIComponent(code)}`;
        if (excludeId) url += `&exclude_id=${excludeId}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        const json = await response.json().catch(() => ({}));

        return {
            status: json.status || (response.ok ? 'available' : 'invalid'),
            message: json.message || ''
        };
    }
};
