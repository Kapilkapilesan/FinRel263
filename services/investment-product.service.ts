import { InvestmentProduct, InvestmentProductFormData } from '../types/investment-product.types';
import { API_BASE_URL, getHeaders } from './api.config';

export const investmentProductService = {
    getProducts: async (): Promise<InvestmentProduct[]> => {
        const response = await fetch(`${API_BASE_URL}/investment-products`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch investment products');
        const json = await response.json();
        return json.data || [];
    },

    getProductsList: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/investment-products/list`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to list investment products');
        const json = await response.json();
        return json.data || [];
    },

    getNextCode: async (): Promise<string> => {
        const response = await fetch(`${API_BASE_URL}/investment-products/next-code`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch next product code');
        const json = await response.json();
        return json.data;
    },

    createProduct: async (data: InvestmentProductFormData): Promise<InvestmentProduct> => {
        const response = await fetch(`${API_BASE_URL}/investment-products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to create investment product');
        return json.data;
    },

    updateProduct: async (id: number, data: Partial<InvestmentProductFormData>): Promise<InvestmentProduct> => {
        const response = await fetch(`${API_BASE_URL}/investment-products/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to update investment product');
        return json.data;
    },

    deleteProduct: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/investment-products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete investment product');
    }
};
