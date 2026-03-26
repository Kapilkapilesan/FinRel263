import React, { useState, useEffect, useCallback } from 'react';
import { X, Calculator, AlertCircle, CheckCircle2, Lock, Plus } from 'lucide-react';
import { NewShareholder, CalculationPreview, ShareholderSystemInfo, Shareholder } from '@/types/shareholder.types';
import { shareholderService } from '@/services/shareholder.service';

interface AddShareholderModalProps {
    show: boolean;
    onClose: () => void;
    newShareholder: NewShareholder;
    setNewShareholder: (data: NewShareholder) => void;
    onAdd: () => void;
    systemInfo: ShareholderSystemInfo | null;
    existingShareholders?: Shareholder[];
}

interface ValidationErrors {
    name?: string;
    totalInvestment?: string;
    nic?: string;
    contact?: string;
    address?: string;
}

export function AddShareholderModal({
    show,
    onClose,
    newShareholder,
    setNewShareholder,
    onAdd,
    systemInfo,
    existingShareholders = []
}: AddShareholderModalProps) {
    const [calculation, setCalculation] = useState<CalculationPreview | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<{ [key in keyof ValidationErrors]?: boolean }>({});

    // Debounced calculation preview
    const fetchCalculation = useCallback(async (amount: number) => {
        if (amount <= 0) {
            setCalculation(null);
            return;
        }

        setIsCalculating(true);
        try {
            const result = await shareholderService.previewCalculation(amount);
            setCalculation(result);
        } catch (error) {
            console.error('Error fetching calculation:', error);
        } finally {
            setIsCalculating(false);
        }
    }, []);

    // Get error for a single field
    const getFieldError = useCallback((fieldName: keyof ValidationErrors, value: string): string | null => {
        switch (fieldName) {
            case 'name':
                if (!value?.trim()) return 'Shareholder Name is required';
                if (value.trim().length < 3) return 'Name must be at least 3 characters';
                if (!/^[a-zA-Z\s.]+$/.test(value.trim())) return 'Name should only contain letters, spaces and dots';
                break;
            case 'totalInvestment':
                const amount = parseFloat(value) || 0;
                const remainingCapacity = systemInfo?.remaining_capacity || 0;
                if (!value) return 'Investment Amount is required';
                if (amount <= 0) return 'Investment must be greater than 0';
                if (amount > remainingCapacity) return `Exceeds available capacity of LKR ${remainingCapacity.toLocaleString()}`;
                break;
            case 'nic':
                const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
                if (!value?.trim()) return 'NIC Number is required';
                if (!nicRegex.test(value.trim())) return 'Invalid NIC format (e.g., 941234567V or 199412345678)';
                const isDuplicate = existingShareholders.some(
                    (s) => s.nic?.trim().toUpperCase() === value.trim().toUpperCase()
                );
                if (isDuplicate) return `NIC "${value}" already exists`;
                break;
            case 'contact':
                if (!value?.trim()) return 'Contact Number is required';
                const trimmedContact = value.trim();
                if (!/^[0-9]{10}$/.test(trimmedContact)) return 'Contact must be exactly 10 digits (e.g., 0771234567)';
                // Check for duplicate phone number
                const isDuplicatePhone = existingShareholders.some(
                    (s) => s.contact?.trim() === trimmedContact
                );
                if (isDuplicatePhone) return `Contact number "${trimmedContact}" already exists`;
                break;
            case 'address':
                if (!value?.trim()) return 'Address is required';
                if (value.trim().length < 5) return 'Address must be at least 5 characters';
                break;
        }
        return null;
    }, [systemInfo?.remaining_capacity, existingShareholders]);

    // Validate a single field and update state
    const validateField = useCallback((fieldName: keyof ValidationErrors, value: string) => {
        const error = getFieldError(fieldName, value);
        setErrors(prev => {
            const next = { ...prev };
            if (error) {
                next[fieldName] = error;
            } else {
                delete next[fieldName];
            }
            return next;
        });
        return !error;
    }, [getFieldError]);

    // Effect to calculate when investment amount changes
    useEffect(() => {
        const amount = parseFloat(newShareholder.totalInvestment) || 0;
        const timeoutId = setTimeout(() => {
            fetchCalculation(amount);
            if (touched.totalInvestment) {
                validateField('totalInvestment', newShareholder.totalInvestment);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [newShareholder.totalInvestment, fetchCalculation, touched.totalInvestment, validateField]);

    // Reset state when modal closes
    useEffect(() => {
        if (!show) {
            setCalculation(null);
            setErrors({});
            setTouched({});
        }
    }, [show]);

    // Validate fields on change if touched
    useEffect(() => {
        if (touched.name) validateField('name', newShareholder.name);
    }, [newShareholder.name, touched.name, validateField]);

    useEffect(() => {
        if (touched.nic) validateField('nic', newShareholder.nic);
    }, [newShareholder.nic, touched.nic, validateField]);

    useEffect(() => {
        if (touched.contact) validateField('contact', newShareholder.contact || '');
    }, [newShareholder.contact, touched.contact, validateField]);

    useEffect(() => {
        if (touched.address) validateField('address', newShareholder.address || '');
    }, [newShareholder.address, touched.address, validateField]);

    if (!show) return null;

    const investmentAmount = parseFloat(newShareholder.totalInvestment) || 0;
    const isOverLimit = investmentAmount > (systemInfo?.remaining_capacity || 0);

    const handleBlur = (fieldName: keyof ValidationErrors) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        validateField(fieldName, (newShareholder as any)[fieldName] || '');
    };

    const handleAdd = () => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        const nameError = getFieldError('name', newShareholder.name);
        if (nameError) { newErrors.name = nameError; isValid = false; }

        const investmentError = getFieldError('totalInvestment', newShareholder.totalInvestment);
        if (investmentError) { newErrors.totalInvestment = investmentError; isValid = false; }

        const nicError = getFieldError('nic', newShareholder.nic);
        if (nicError) { newErrors.nic = nicError; isValid = false; }

        const contactError = getFieldError('contact', newShareholder.contact || '');
        if (contactError) { newErrors.contact = contactError; isValid = false; }

        const addressError = getFieldError('address', newShareholder.address || '');
        if (addressError) { newErrors.address = addressError; isValid = false; }

        setErrors(newErrors);
        setTouched({ name: true, totalInvestment: true, nic: true, contact: true, address: true });

        if (!isValid || isOverLimit || (calculation && !calculation.is_valid)) return;

        onAdd();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl max-w-lg w-full shadow-2xl border border-border-default">
                {/* Header */}
                <div className="p-6 border-b border-border-divider bg-gradient-to-r from-primary-600 to-indigo-600 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Add New Shareholder</h2>
                            <p className="text-blue-100 text-sm mt-1">
                                Available capacity: LKR {systemInfo?.remaining_capacity.toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Shareholder Name */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Shareholder Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newShareholder.name}
                            onChange={(e) =>
                                setNewShareholder({ ...newShareholder, name: e.target.value })
                            }
                            onBlur={() => handleBlur('name')}
                            className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-text-primary ${touched.name && errors.name
                                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                : 'border-border-default focus:ring-primary-500'
                                }`}
                            placeholder="Enter full name"
                        />
                        {touched.name && errors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Investment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Investment Amount (LKR) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={newShareholder.totalInvestment}
                                onChange={(e) =>
                                    setNewShareholder({ ...newShareholder, totalInvestment: e.target.value })
                                }
                                onBlur={() => handleBlur('totalInvestment')}
                                className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-text-primary ${(touched.totalInvestment && errors.totalInvestment) || isOverLimit
                                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-border-default focus:ring-primary-500'
                                    }`}
                                placeholder="Enter investment amount"
                                min="0"
                            />
                            {isCalculating && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        {(touched.totalInvestment && errors.totalInvestment) || isOverLimit ? (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.totalInvestment || `Investment exceeds available capacity of LKR ${systemInfo?.remaining_capacity.toLocaleString()}`}
                            </p>
                        ) : calculation?.is_valid && (
                            <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Investment is within available capacity
                            </p>
                        )}
                    </div>

                    {/* Auto-Calculated Values (READ-ONLY) */}
                    <div className="bg-gradient-to-r from-muted-bg to-primary-50/10 rounded-xl p-4 border border-border-default">
                        <div className="flex items-center gap-2 mb-3">
                            <Calculator className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-semibold text-text-primary">Auto-Calculated Values</span>
                            <Lock className="w-4 h-4 text-text-muted" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Share Percentage (%)
                                </label>
                                <div className="px-4 py-3 bg-card border border-border-default rounded-lg text-sm font-semibold text-text-primary">
                                    {calculation?.percentage?.toFixed(2) || '0.00'}%
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">
                                    Number of Shares
                                </label>
                                <div className="px-4 py-3 bg-card border border-border-default rounded-lg text-sm font-semibold text-text-primary">
                                    {calculation?.shares || 0} shares
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NIC Number */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            NIC Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newShareholder.nic}
                            onChange={(e) =>
                                setNewShareholder({ ...newShareholder, nic: e.target.value })
                            }
                            onBlur={() => handleBlur('nic')}
                            className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-text-primary ${touched.nic && errors.nic
                                ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                : 'border-border-default focus:ring-primary-500'
                                }`}
                            placeholder="Enter NIC number"
                        />
                        {touched.nic && errors.nic && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.nic}
                            </p>
                        )}
                    </div>

                    {/* Contact & Address Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={newShareholder.contact || ''}
                                onChange={(e) => {
                                    // Only allow digits, max 10 characters
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setNewShareholder({ ...newShareholder, contact: value });
                                }}
                                onBlur={() => handleBlur('contact')}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-text-primary ${touched.contact && errors.contact
                                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-border-default focus:ring-primary-500'
                                    }`}
                                placeholder="07XXXXXXXX"
                            />
                            {touched.contact && errors.contact && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.contact}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newShareholder.address || ''}
                                onChange={(e) =>
                                    setNewShareholder({ ...newShareholder, address: e.target.value })
                                }
                                onBlur={() => handleBlur('address')}
                                className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-text-primary ${touched.address && errors.address
                                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
                                    : 'border-border-default focus:ring-primary-500'
                                    }`}
                                placeholder="Enter address"
                            />
                            {touched.address && errors.address && (
                                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-default flex gap-3 justify-end bg-muted-bg rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-border-default bg-card text-text-primary rounded-lg hover:bg-hover transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${isOverLimit || Object.keys(errors).length > 0 || (calculation && !calculation.is_valid)
                            ? 'bg-muted-bg text-text-muted cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                        onClick={handleAdd}
                        disabled={isOverLimit || Object.keys(errors).length > 0 || (calculation !== null && !calculation.is_valid)}
                    >
                        <Plus className="w-4 h-4" />
                        Add Shareholder
                    </button>
                </div>
            </div>
        </div>
    );
}
