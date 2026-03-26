'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Shareholder, NewShareholder, ShareholderSystemInfo } from '@/types/shareholder.types';
import BMSLoader from '@/components/common/BMSLoader';
import { ShareholderStats } from './ShareholderStats';
import { ShareholderTable } from './ShareholderTable';
import { AddShareholderModal } from './AddShareholderModal';
import { EditShareholderModal } from './EditShareholderModal';
import { ShareholderDetailsModal } from './ShareholderDetailsModal';
import { ProfitDistribution } from './ProfitDistribution';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { shareholderService } from '@/services/shareholder.service';
import { authService } from '@/services/auth.service';
import { toast } from 'react-toastify';

const initialShareholderState: NewShareholder = {
    name: '',
    totalInvestment: '',
    nic: '',
    contact: '',
    address: ''
};

export function ShareholderModule() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedShareholder, setSelectedShareholder] = useState<Shareholder | null>(null);
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [systemInfo, setSystemInfo] = useState<ShareholderSystemInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [shareholderToDelete, setShareholderToDelete] = useState<Shareholder | null>(null);

    const [newShareholder, setNewShareholder] = useState<NewShareholder>(initialShareholderState);

    // Permission checks
    const canCreate = authService.hasPermission('shareholders.create');
    const canEdit = authService.hasPermission('shareholders.edit');
    const canDelete = authService.hasPermission('shareholders.delete');
    const canManageDividends = authService.hasPermission('shareholders.manage_dividends');

    const fetchShareholders = async () => {
        try {
            setIsLoading(true);
            const response = await shareholderService.getAll();
            setShareholders(response.shareholders);
            setSystemInfo(response.system_info);
        } catch (error: any) {
            console.error('Error fetching shareholders:', error);
            toast.error(error.message || 'Failed to fetch shareholders');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShareholders();
    }, []);

    const handleAddShareholder = async () => {
        const { name, totalInvestment, nic, contact, address } = newShareholder;

        // Specific validation for each field
        if (!name?.trim()) {
            toast.error('Shareholder Name is required');
            return;
        }

        if (!totalInvestment) {
            toast.error('Investment Amount is required');
            return;
        }

        const investmentAmount = Number(totalInvestment);
        if (isNaN(investmentAmount) || investmentAmount <= 0) {
            toast.error('Please enter a valid investment amount greater than 0');
            return;
        }

        if (!nic?.trim()) {
            toast.error('NIC Number is required');
            return;
        }

        if (!contact?.trim()) {
            toast.error('Contact Number is required');
            return;
        }

        if (!address?.trim()) {
            toast.error('Address is required');
            return;
        }

        // Check for duplicate NIC locally first
        const isDuplicateNic = shareholders.some(
            (s) => s.nic?.trim().toUpperCase() === nic.trim().toUpperCase()
        );

        if (isDuplicateNic) {
            toast.error(`A shareholder with NIC "${nic}" already exists`);
            return;
        }

        // Validate against remaining capacity
        if (systemInfo && investmentAmount > systemInfo.remaining_capacity) {
            toast.error(`Investment amount LKR ${investmentAmount.toLocaleString()} exceeds available capacity of LKR ${systemInfo.remaining_capacity.toLocaleString()}`);
            return;
        }

        try {
            const payload = {
                name: name.trim(),
                total_investment: investmentAmount,
                nic: nic.trim(),
                contact: contact.trim(),
                address: address.trim()
            };

            await shareholderService.create(payload);
            toast.success('Shareholder added successfully');

            setNewShareholder(initialShareholderState);
            setShowAddModal(false);
            fetchShareholders();
        } catch (error: any) {
            console.error('Error adding shareholder:', error);
            toast.error(error.message || 'Failed to add shareholder');
        }
    };

    const handleEditShareholder = async (data: { name: string; total_investment: number; nic: string; contact?: string; address?: string }) => {
        if (!selectedShareholder) return;

        // Ensure all fields are provided in the data object
        if (!data.name?.trim()) {
            toast.error('Shareholder Name is required');
            return;
        }
        if (!data.nic?.trim()) {
            toast.error('NIC Number is required');
            return;
        }
        if (!data.contact?.trim()) {
            toast.error('Contact Number is required');
            return;
        }
        if (!data.address?.trim()) {
            toast.error('Address is required');
            return;
        }

        // Check for duplicate NIC (excluding current shareholder)
        const isDuplicateNic = shareholders.some(
            (s) => s.id !== selectedShareholder.id && s.nic?.trim().toUpperCase() === data.nic.toUpperCase()
        );

        if (isDuplicateNic) {
            toast.error(`A shareholder with NIC ${data.nic} already exists.`);
            return;
        }

        try {
            await shareholderService.update(selectedShareholder.id, data);
            toast.success('Shareholder updated successfully');
            setShowEditModal(false);
            setSelectedShareholder(null);
            fetchShareholders();
        } catch (error: any) {
            console.error('Error updating shareholder:', error);
            toast.error(error.message || 'Failed to update shareholder');
        }
    };

    const handleDeleteShareholder = (shareholder: Shareholder) => {
        setShareholderToDelete(shareholder);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteShareholder = async () => {
        if (!shareholderToDelete) return;

        try {
            await shareholderService.delete(shareholderToDelete.id);
            toast.success('Shareholder deleted successfully');
            fetchShareholders();
        } catch (error: any) {
            console.error('Error deleting shareholder:', error);
            toast.error(error.message || 'Failed to delete shareholder');
        } finally {
            setShowDeleteConfirm(false);
            setShareholderToDelete(null);
        }
    };

    const handleViewDetails = (shareholder: Shareholder) => {
        setSelectedShareholder(shareholder);
        setShowDetailsModal(true);
    };

    const handleEdit = (shareholder: Shareholder) => {
        setSelectedShareholder(shareholder);
        setShowEditModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <BMSLoader message="Loading shareholders..." size="xsmall" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Shareholder Management</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Total Investment Cap: LKR {systemInfo?.total_company_investment?.toLocaleString() || '20,000,000'} |
                        Total Shares: {systemInfo?.total_shares || 100}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchShareholders}
                        className="flex items-center gap-2 px-4 py-2 border border-border-default rounded-lg hover:bg-muted-bg text-text-primary transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {canCreate && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            disabled={systemInfo ? systemInfo.remaining_capacity <= 0 : false}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${systemInfo && systemInfo.remaining_capacity <= 0
                                ? 'bg-muted-bg text-text-muted cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-700'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Add Shareholder</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Investment Status Banner */}
            {systemInfo && (
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl p-5 text-white">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-primary-100 text-sm">Total Company Investment</p>
                            <p className="text-2xl font-bold">LKR {(systemInfo.total_company_investment / 1000000).toFixed(1)}M</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-sm">Currently Invested</p>
                            <p className="text-2xl font-bold">LKR {(systemInfo.total_invested / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-sm">Available for Investment</p>
                            <p className="text-2xl font-bold text-green-300">LKR {(systemInfo.remaining_capacity / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                            <p className="text-primary-100 text-sm">Investment Progress</p>
                            <div className="mt-2">
                                <div className="w-full bg-white/20 rounded-full h-3">
                                    <div
                                        className="bg-white rounded-full h-3 transition-all duration-500"
                                        style={{ width: `${(systemInfo.total_invested / systemInfo.total_company_investment) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm mt-1">
                                    {((systemInfo.total_invested / systemInfo.total_company_investment) * 100).toFixed(1)}% allocated
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ShareholderStats shareholders={shareholders} systemInfo={systemInfo} />

            <ShareholderTable
                shareholders={shareholders}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDeleteShareholder}
                canEdit={canEdit}
                canDelete={canDelete}
            />

            {canManageDividends && (
                <ProfitDistribution shareholders={shareholders} systemInfo={systemInfo} />
            )}

            <AddShareholderModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                newShareholder={newShareholder}
                setNewShareholder={setNewShareholder}
                onAdd={handleAddShareholder}
                systemInfo={systemInfo}
                existingShareholders={shareholders}
            />

            <EditShareholderModal
                show={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedShareholder(null);
                }}
                shareholder={selectedShareholder}
                onSave={handleEditShareholder}
                systemInfo={systemInfo}
                existingShareholders={shareholders}
            />

            <ShareholderDetailsModal
                show={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                shareholder={selectedShareholder}
            />

            {/* Deletion Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Shareholder"
                message={`Are you sure you want to delete the shareholder "${shareholderToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Shareholder"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDeleteShareholder}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setShareholderToDelete(null);
                }}
            />
        </div>
    );
}
