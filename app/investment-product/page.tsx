'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, UserCheck, ShieldAlert, Clock, Wallet, BarChart3, Tag } from 'lucide-react';
import { InvestmentProduct, InvestmentProductFormData } from '../../types/investment-product.types';
import { investmentProductService } from '../../services/investment-product.service';
import { authService } from '../../services/auth.service';
import { InvestmentProductForm } from '../../components/investment-product/InvestmentProductForm';
import { InvestmentProductDetailModal } from '../../components/investment-product/InvestmentProductDetailModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import BMSLoader from '../../components/common/BMSLoader';
import { colors } from '@/themes/colors';
import { Pagination } from '../../components/common/Pagination';

export default function InvestmentProductManagementPage() {
    const [products, setProducts] = useState<InvestmentProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<InvestmentProduct | null>(null);
    const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Permission checks
    const canCreate = authService.hasPermission('investment_products.create');
    const canEdit = authService.hasPermission('investment_products.edit');
    const canDelete = authService.hasPermission('investment_products.delete');


    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await investmentProductService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load investment products');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: InvestmentProductFormData) => {
        try {
            if (editingProduct) {
                await investmentProductService.updateProduct(editingProduct.id, data);
                toast.success('Product updated successfully');
            } else {
                await investmentProductService.createProduct(data);
                toast.success('Product created successfully');
            }
            setShowModal(false);
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save product');
        }
    };

    const handleDelete = (id: number) => {
        setProductToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (productToDelete === null) return;
        try {
            await investmentProductService.deleteProduct(productToDelete);
            toast.success('Product deleted successfully');
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete product');
        } finally {
            setShowDeleteConfirm(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Pagination logic
    const totalItems = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-3xl shadow-sm border border-border-default">
                <div className="flex items-center gap-5">
                    <div
                        className="p-4 rounded-2xl shadow-lg"
                        style={{ backgroundColor: colors.primary[600], boxShadow: `0 10px 15px -3px ${colors.primary[600]}33` }}
                    >
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tight">Investment Product Schemes</h1>
                        <p className="text-sm text-text-muted mt-1 font-medium">Configure and manage financial investment products</p>
                    </div>
                </div>
                {canCreate && (
                    <button
                        onClick={() => { setEditingProduct(null); setShowModal(true); }}
                        style={{ backgroundColor: colors.primary[600], boxShadow: `0 10px 15px -3px ${colors.primary[600]}33` }}
                        className="flex items-center justify-center gap-2 text-white px-8 py-4 rounded-2xl transition-all active:scale-95 font-bold hover:opacity-90"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New Product</span>
                    </button>
                )}
            </div>


            {/* Content Section */}
            <div className="grid grid-cols-1 gap-4">
                {/* Search and Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by product name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-input border border-border-default rounded-2xl focus:outline-none focus:ring-2 transition-all shadow-sm text-text-primary font-medium"
                            style={{ '--tw-ring-color': `${colors.primary[500]}20`, borderColor: colors.primary[300] } as any}
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-card rounded-3xl shadow-xl border border-border-default overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-table-header border-b border-border-divider">
                                    <th className="px-6 py-5 text-left text-xs font-black text-text-muted uppercase tracking-widest">Product ID</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-text-muted uppercase tracking-widest">Product Name</th>
                                    <th className="px-6 py-5 text-center text-xs font-black text-text-muted uppercase tracking-widest">Returns</th>
                                    <th className="px-6 py-5 text-center text-xs font-black text-text-muted uppercase tracking-widest">Term</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-text-muted uppercase tracking-widest">Limits</th>
                                    {(canEdit || canDelete) && (
                                        <th className="px-6 py-5 text-right text-xs font-black text-text-muted uppercase tracking-widest">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-divider">
                                {loading ? (
                                    <tr>
                                        <td colSpan={(canEdit || canDelete) ? 5 : 4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <BMSLoader message="Synchronizing products..." size="xsmall" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedProducts.length > 0 ? (
                                    paginatedProducts.map(p => {
                                        const rates = p.interest_rates_json || [];
                                        const minMo = rates.length > 0 ? Math.min(...rates.map(r => r.term_months)) : 0;
                                        const maxMo = rates.length > 0 ? Math.max(...rates.map(r => r.term_months)) : 0;

                                        const allInterestValues = rates.flatMap(r => [r.interest_monthly, r.interest_maturity]);
                                        const minInt = allInterestValues.length > 0 ? Math.min(...allInterestValues) : 0;
                                        const maxInt = allInterestValues.length > 0 ? Math.max(...allInterestValues) : 0;

                                        return (
                                            <tr key={p.id} className="hover:bg-table-row-hover transition-colors group border-b border-border-divider last:border-0 text-left">
                                                <td className="px-6 py-3.5 font-mono font-bold text-sm text-primary-600 uppercase">
                                                    <span className="px-3 py-1 bg-primary-500/10 rounded-lg border border-primary-500/20">
                                                        {p.product_code || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 cursor-pointer" onClick={() => { setViewingProduct(p); setShowDetailModal(true); }}>
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="p-3 rounded-2xl group-hover:bg-primary-500/10 transition-colors"
                                                            style={{ backgroundColor: `${colors.primary[600]}15` }}
                                                        >
                                                            <Tag className="w-6 h-6" style={{ color: colors.primary[600] }} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-text-primary text-lg transition-colors group-hover:text-primary-500 uppercase">{p.name}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <div className="flex items-center gap-1 text-[10px] font-black text-text-muted uppercase tracking-widest">
                                                                    <UserCheck className="w-3.5 h-3.5" />
                                                                    <span>MIN AGE: {p.age_limited}+ YEARS</span>
                                                                </div>
                                                                <div className="w-1 h-1 bg-border-divider rounded-full" />
                                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest" style={{ color: colors.primary[500] }}>
                                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                                    <span>{rates.length} TIERS CONFIGURED</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xl font-black text-primary-500">
                                                                {minInt === maxInt ? `${minInt}%` : `${minInt}% - ${maxInt}%`}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5">Yield Range</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1.5 text-text-secondary">
                                                            <Clock className="w-4 h-4" style={{ color: colors.primary[500] }} />
                                                            <span className="text-base font-black uppercase">
                                                                {minMo === maxMo ? `${minMo} MO` : `${minMo} TO ${maxMo} MO`}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter mt-0.5 italic tracking-widest">DYNAMIC TERM OPTIONS</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-left">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                                                            <span className="text-[11px] text-text-muted font-bold uppercase tracking-tighter">MIN:</span>
                                                            <span className="text-xs font-black text-text-primary tracking-tight">LKR {Number(p.min_amount).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                            <span className="text-[11px] text-text-muted font-bold uppercase tracking-tighter">MAX:</span>
                                                            <span className="text-xs font-black text-text-primary tracking-tight">LKR {Number(p.max_amount).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {(canEdit || canDelete) && (
                                                    <td className="px-6 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            {canEdit && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingProduct(p); setShowModal(true); }}
                                                                    className="p-3 text-primary-600 hover:bg-primary-500/10 rounded-2xl transition-all active:scale-90 border border-transparent shadow-sm"
                                                                    style={{ color: colors.primary[600] }}
                                                                    title="Edit Product"
                                                                >
                                                                    <Edit2 className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                            {canDelete && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                                    className="p-3 text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-rose-100 shadow-sm"
                                                                    title="Delete Product"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}

                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={(canEdit || canDelete) ? 5 : 4} className="px-6 py-24 text-center">

                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-muted-bg rounded-full">
                                                    <Search className="w-8 h-8 text-text-muted/30" />
                                                </div>
                                                <p className="text-text-muted font-bold max-w-xs mx-auto">We couldn't find any products matching your search criteria.</p>
                                                <button
                                                    onClick={() => { setSearchTerm(''); }}
                                                    className="px-6 py-2 bg-muted-bg text-text-secondary rounded-xl font-bold hover:bg-hover transition-colors"
                                                >
                                                    Clear filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemName="products"
                />
            </div>

            {/* Modals */}
            <InvestmentProductForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingProduct}
            />

            <InvestmentProductDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                product={viewingProduct}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Deactivate Product Scheme"
                message="Are you sure you want to delete this investment product? This action will prevent new accounts from using this scheme, but will not affect existing active investments."
                confirmText="Permanently Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div >
    );
}
