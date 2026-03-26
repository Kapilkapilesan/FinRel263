'use client'

import { useState, useEffect } from 'react';

interface UsePaginationProps {
    totalItems: number;
    initialItemsPerPage?: number;
}

export function usePagination({ totalItems, initialItemsPerPage = 10 }: UsePaginationProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Reset to page 1 when total items change
    useEffect(() => {
        setCurrentPage(1);
    }, [totalItems]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        startIndex,
        endIndex,
        handlePageChange,
        handleItemsPerPageChange
    };
}
