'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers } from 'lucide-react';
import { LoanProduct, LoanProductFormData } from '../../types/loan-product.types';
import { loanProductService } from '../../services/loan-product.service';
import { LoanProductTable } from '../../components/loan-product/LoanProductTable';
import { LoanProductForm } from '../../components/loan-product/LoanProductForm';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import BMSLoader from '../../components/common/BMSLoader';
import { colors } from '@/themes/colors';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Pagination } from '../../components/common/Pagination';

export default function LoanProductManagementPage() {
    const [products, setProducts] = useState<LoanProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [termFilter, setTermFilter] = useState<string>('all');
    const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
    const [isMounted, setIsMounted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Permission checks
    const [canCreate, setCanCreate] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
        const { authService } = require('../../services/auth.service');
        setIsMounted(true);
        setCanCreate(authService.hasPermission('loan_products.create'));
        setCanEdit(authService.hasPermission('loan_products.edit'));
        setCanDelete(authService.hasPermission('loan_products.delete'));
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await loanProductService.getLoanProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error('Failed to load loan products');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleEdit = (product: LoanProduct) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setProductToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (productToDelete === null) return;

        try {
            await loanProductService.deleteLoanProduct(productToDelete);
            await loadProducts();
            toast.success('Product deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete product:', error);
            toast.error(error.message || 'Failed to delete product');
        } finally {
            setShowDeleteConfirm(false);
            setProductToDelete(null);
        }
    };

    const handleSave = async (formData: LoanProductFormData) => {
        try {
            if (editingProduct) {
                await loanProductService.updateLoanProduct(editingProduct.id, formData);
                toast.success('Product updated successfully!');
            } else {
                await loanProductService.createLoanProduct(formData);
                toast.success('Product created successfully!');
            }
            setShowModal(false);
            loadProducts();
        } catch (error: any) {
            console.error('Failed to save product:', error);
            const errorMessage = error.errors ?
                Object.values(error.errors).flat().join(', ') :
                error.message || 'Failed to save product';
            toast.error(errorMessage);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.regacine || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerm = termFilter === 'all' || product.term_type === termFilter;
        const matchesProductType = productTypeFilter === 'all' || product.product_type === productTypeFilter;
        return matchesSearch && matchesTerm && matchesProductType;
    });

    // Pagination logic
    const totalItems = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, termFilter, productTypeFilter]);

    if (loading && products.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <BMSLoader message="Loading products..." size="medium" />
            </div>
        );
    }

    return (
        <div className="space-y-3 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-text-primary tracking-tight">
                        Loan Product <span className="text-primary-600">Schemes</span>
                    </h1>
                    {/* <p className="text-sm font-medium text-text-muted mt-2 max-w-md">
                        Engineer and manage institutional loan product configurations and financial logic.
                    </p> */}
                </div>
                {isMounted && canCreate && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-3 bg-primary-600 text-white px-8 py-3.5 rounded-2xl transition-all shadow-2xl shadow-primary-500/40 active:scale-95 hover:bg-primary-500 hover:shadow-primary-500/60 font-black text-xs uppercase tracking-widest"
                    >
                        <Plus className="w-5 h-5" />
                        New Loan Product
                    </button>
                )}
            </div>

            {/* Quick Stats Summary */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border-default shadow-sm">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${colors.primary[600]}15` }}
                        >
                            <Layers className="w-5 h-5" style={{ color: colors.primary[600] }} />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted uppercase font-semibold tracking-widest">TOTAL SCHEMES</p>
                            <p className="text-xl font-bold text-text-primary">{products.length}</p>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Search */}
            <div className="bg-card rounded-3xl border border-border-default p-4 shadow-xl shadow-black/5">
                <div className="flex flex-col sm:flex-row gap-5">
                    <div className="relative flex-1 group">
                        <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search schemes by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-5 py-3.5 bg-input border border-border-default rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all text-sm text-text-primary placeholder:text-text-muted/50"
                        />
                    </div>
                    <div className="w-[200px]">
                        <SearchableSelect
                            value={productTypeFilter}
                            onChange={(val) => setProductTypeFilter(val as string)}
                            placeholder="ALL PRODUCT TYPES"
                            options={[
                                { id: 'all', label: 'ALL PRODUCT TYPES' },
                                { id: 'micro_loan', label: 'MICRO LOAN' },
                                { id: 'investor_loan', label: 'INVESTOR LOAN' },
                                { id: 'staff_loan', label: 'STAFF LOAN' },
                                { id: 'advance_loan', label: 'ADVANCE LOAN' },
                            ]}
                            className=""
                        />
                    </div>
                    <div className="w-[200px]">
                        <SearchableSelect
                            value={termFilter}
                            onChange={(val) => setTermFilter(val as string)}
                            placeholder="ALL TERM TYPES"
                            options={[
                                { id: 'all', label: 'ALL TERM TYPES' },
                                { id: 'Weekly', label: 'WEEKLY' },
                                { id: 'Bi-Weekly', label: 'BI-WEEKLY' },
                                { id: 'Monthly', label: 'MONTHLY' },
                            ]}
                            className=""
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <LoanProductTable
                products={paginatedProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canEdit={isMounted && canEdit}
                canDelete={isMounted && canDelete}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="schemes"
            />

            {/* Product Form Modal */}
            <LoanProductForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingProduct}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Product Scheme"
                message="Are you sure you want to delete this product scheme? This will not affect existing active loans based on this scheme."
                confirmText="Delete Scheme"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

        </div>
    );
}
