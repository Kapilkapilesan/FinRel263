'use client';
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { LoanProduct } from '../../types/loan-product.types';

interface LoanProductTableProps {
  products: LoanProduct[];
  onEdit: (product: LoanProduct) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function LoanProductTable({
  products,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: LoanProductTableProps) {
  return (
    <div className="bg-card rounded-lg border border-border-default overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-table-header border-b border-border-divider">
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Product Type
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Term Type
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Interest Rate
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                Term
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-divider">
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-table-row-hover transition-colors">
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-text-primary uppercase">{product.product_name}</div>
                    {product.regacine && (
                      <div className="text-xs text-text-muted uppercase">{product.regacine}</div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-muted-bg text-text-secondary uppercase">
                      {product.product_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                        product.term_type === 'Weekly'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
                      }`}
                    >
                      {product.term_type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-text-secondary">
                    {product.product_terms && product.product_terms.length > 0
                      ? `${Math.min(...product.product_terms.map((t) => Number(t.interest_rate)))}% - ${Math.max(
                          ...product.product_terms.map((t) => Number(t.interest_rate))
                        )}%`
                      : `${Number(product.interest_rate)}%`}
                  </td>
                  <td className="px-6 py-3 text-sm text-text-secondary font-medium">
                    {product.min_amount && product.max_amount
                      ? `LKR ${Number(product.min_amount).toLocaleString()} - ${Number(product.max_amount).toLocaleString()}`
                      : `LKR ${Number(product.loan_amount).toLocaleString()}`}
                  </td>
                  <td className="px-6 py-3 text-sm text-text-secondary">
                    {product.product_terms && product.product_terms.length > 0
                      ? product.product_terms.map((t) => t.term).join(', ') + ' Periods'
                      : `${product.loan_term} Periods`}
                  </td>

                  <td className="px-6 py-3 text-right space-x-3">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2.5 text-primary-600 hover:bg-primary-500/10 rounded-xl transition-all active:scale-90 border border-transparent"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-2.5 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90 border border-transparent"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Optional: you can add View button later if needed */}
                    {/* <button
                      className="p-2.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90 border border-transparent"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button> */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-text-muted italic">
                  No loan products found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}