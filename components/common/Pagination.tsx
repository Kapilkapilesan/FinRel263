'use client'

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    itemName?: string; // e.g., "groups", "centers", "branches"
}

export function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemName = 'items'
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const goToPage = (page: number) => {
        onPageChange(Math.max(1, Math.min(page, totalPages)));
    };

    const renderPageNumbers = () => {
        const maxPagesToShow = 5;
        const pageNumbers: (number | string)[] = [];

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= maxPagesToShow - 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }

        return pageNumbers.map((number, index) =>
            number === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-text-muted">
                    ...
                </span>
            ) : (
                <button
                    key={number}
                    onClick={() => goToPage(number as number)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === number
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                        : 'bg-input border border-border-divider text-text-muted hover:text-text-primary hover:bg-hover'
                        }`}
                >
                    {number}
                </button>
            )
        );
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="bg-card/50 backdrop-blur-3xl border-t border-border-divider/50 px-8 py-5">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Left side: Stats & Page Size */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] whitespace-nowrap">
                        Showing <span className="text-text-primary">{startIndex + 1}</span> —{' '}
                        <span className="text-text-primary">{endIndex}</span> of{' '}
                        <span className="text-text-primary">{totalItems}</span> {itemName}
                    </p>

                    <div className="relative group">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="appearance-none pl-5 pr-10 py-2.5 bg-input border border-border-divider text-text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all cursor-pointer shadow-sm hover:bg-hover min-w-[140px]"
                        >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={15}>15 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted transition-transform group-hover:scale-110">
                            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Right side: Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center bg-input border border-border-divider rounded-xl text-text-muted hover:text-primary-600 hover:border-primary-500/30 hover:bg-primary-500/5 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex gap-2.5">
                            {renderPageNumbers()}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 flex items-center justify-center bg-input border border-border-divider rounded-xl text-text-muted hover:text-primary-600 hover:border-primary-500/30 hover:bg-primary-500/5 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
