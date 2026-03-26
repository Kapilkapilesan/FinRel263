'use client'
import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { Branch, BranchFormData } from '../../types/branch.types';
import { API_BASE_URL, getHeaders } from '../../services/api.config';
import { customerService } from '../../services/customer.service';

interface BranchFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BranchFormData) => void;
    initialData?: Branch | null;
}

const defaultFormData: BranchFormData = {
    branch_id: '',
    branch_code: '', // 2-letter code
    branch_name: '',
    address: '',
    district: '',
    province: '',
    postal_code: '',
    phone: '',
    email: '',
    manager_id: '',
    status: 'active'
};

export function BranchForm({ isOpen, onClose, onSave, initialData }: BranchFormProps) {
    const [formData, setFormData] = useState<BranchFormData>(defaultFormData);
    const [managers, setManagers] = useState<{ staff_id: string; full_name: string; branch?: { branch_name: string } }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [constants, setConstants] = useState<any>(null);
    const [filteredDistricts, setFilteredDistricts] = useState<string[]>([]);

    // Dropdown States
    const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
    const [provinceFilter, setProvinceFilter] = useState('');
    const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
    const [districtFilter, setDistrictFilter] = useState('');
    const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
    const [managerFilter, setManagerFilter] = useState('');

    // Refs for outside click
    const provinceRef = useRef<HTMLDivElement>(null);
    const districtRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchConstants = async () => {
            try {
                const data = await customerService.getConstants();
                setConstants(data);
                if (initialData?.province && data?.province_districts_map) {
                    setFilteredDistricts(data.province_districts_map[initialData.province] || []);
                }
            } catch (error) {
                console.error("Failed to fetch constants", error);
            }
        };

        const fetchManagers = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/staffs/by-role/manager`, {
                    headers: getHeaders()
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.data) {
                        setManagers(result.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch managers", error);
            }
        };

        if (isOpen) {
            fetchConstants();
            fetchManagers();
        }

        if (initialData) {
            setFormData({
                branch_id: initialData.branch_id,
                branch_code: initialData.branch_code || '',
                branch_name: initialData.branch_name,
                address: initialData.address || '',
                district: initialData.district || '',
                province: initialData.province || '',
                postal_code: initialData.postal_code || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                manager_id: initialData.manager_id || '',
                status: initialData.status || 'active'
            });
        } else {
            setFormData(defaultFormData);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
                setProvinceDropdownOpen(false);
            }
            if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
                setDistrictDropdownOpen(false);
            }
            if (managerRef.current && !managerRef.current.contains(event.target as Node)) {
                setManagerDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (formData.province && constants?.province_districts_map) {
            setFilteredDistricts(constants.province_districts_map[formData.province] || []);
        } else {
            setFilteredDistricts([]);
        }
    }, [formData.province, constants]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.branch_name.trim()) {
            newErrors.branch_name = 'Branch name is required';
        } else if (formData.branch_name.length > 50) {
            newErrors.branch_name = 'Branch name is too long. Please keep it under 50 characters.';
        }

        if (!formData.branch_code.trim()) {
            newErrors.branch_code = 'Branch code is required';
        } else if (!/^[A-Z]{2}$/.test(formData.branch_code.toUpperCase())) {
            newErrors.branch_code = 'Branch code must be exactly 2 letters (A-Z)';
        }

        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.district.trim()) newErrors.district = 'District is required';
        if (!formData.province.trim()) newErrors.province = 'Province is required';
        if (!formData.postal_code.trim()) newErrors.postal_code = 'Postal code is required';

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^0\d{2}-\d{3}-\d{4}$/.test(formData.phone)) {
            newErrors.phone = 'Invalid phone format (e.g., 077-123-4567)';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const hasChanges = !initialData || Object.keys(formData).some(key => {
        const currentVal = formData[key as keyof BranchFormData];
        const initialVal = initialData[key as keyof Branch];
        return (currentVal || '') !== (initialVal || '');
    });

    const handleSubmit = () => {
        if (validate()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-card/95 backdrop-blur-2xl rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 flex flex-col animate-in zoom-in-95 duration-500">
                <div className="p-8 border-b border-border-default/50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">
                            {initialData ? 'Update Sector' : 'Add New Branch'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-black/5 rounded-2xl transition-all text-text-muted hover:text-text-primary"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {/* Branch Code & Name */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-1 space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Branch Code *</label>
                            <input
                                type="text"
                                value={formData.branch_code}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase().slice(0, 2).replace(/[^A-Z]/g, '');
                                    setFormData({ ...formData, branch_code: val });
                                }}
                                disabled={!!initialData}
                                className={`w-full px-5 py-3.5 bg-input border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 text-[11px] font-bold text-text-primary tracking-widest uppercase transition-all shadow-sm ${errors.branch_code ? 'border-red-500' : 'border-border-default'} ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="CN"
                                maxLength={2}
                            />
                            {errors.branch_code && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.branch_code}</p>}
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Branch Name *</label>
                            <input
                                type="text"
                                value={formData.branch_name}
                                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                maxLength={50}
                                className={`w-full px-5 py-3.5 bg-input border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 text-[11px] font-bold text-text-primary uppercase tracking-wider transition-all shadow-sm ${errors.branch_name ? 'border-red-500' : 'border-border-default'}`}
                                placeholder="ENTER BRANCH NAME"
                            />
                            {errors.branch_name && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.branch_name}</p>}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Address *</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className={`w-full px-5 py-3.5 bg-input border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 text-[11px] font-bold text-text-primary uppercase tracking-wider transition-all shadow-sm ${errors.address ? 'border-red-500' : 'border-border-default'}`}
                            placeholder="ENTER ADDRESS"
                        />
                        {errors.address && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.address}</p>}
                    </div>

                    {/* Province & District */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Province *</label>
                            <div className="relative" ref={provinceRef}>
                                <button
                                    type="button"
                                    onClick={() => { setProvinceDropdownOpen(!provinceDropdownOpen); setProvinceFilter(''); }}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 bg-input border rounded-xl text-[11px] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 outline-none shadow-sm cursor-pointer transition-all ${errors.province ? 'border-red-500' : 'border-border-default'}`}
                                >
                                    <span className={formData.province ? 'text-text-primary' : 'text-text-muted opacity-50'}>
                                        {formData.province || 'SELECT PROVINCE'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${provinceDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {provinceDropdownOpen && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-4 py-3 border-b border-border-divider">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl border border-border-divider">
                                                <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={provinceFilter}
                                                    onChange={e => setProvinceFilter(e.target.value)}
                                                    placeholder="FILTER PROVINCE..."
                                                    className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                            {constants?.provinces
                                                ?.filter((p: string) => p.toLowerCase().includes(provinceFilter.toLowerCase()))
                                                .map((p: string) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, province: p, district: '' }));
                                                            setProvinceDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${formData.province === p ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))
                                            }
                                            {constants?.provinces?.filter((p: string) => p.toLowerCase().includes(provinceFilter.toLowerCase())).length === 0 && (
                                                <div className="px-5 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                    No provinces found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.province && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.province}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">District *</label>
                            <div className="relative" ref={districtRef}>
                                <button
                                    type="button"
                                    disabled={!formData.province}
                                    onClick={() => { setDistrictDropdownOpen(!districtDropdownOpen); setDistrictFilter(''); }}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 bg-input border rounded-xl text-[11px] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 outline-none shadow-sm transition-all ${!formData.province ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${errors.district ? 'border-red-500' : 'border-border-default'}`}
                                >
                                    <span className={formData.district ? 'text-text-primary' : 'text-text-muted opacity-50'}>
                                        {formData.district || 'SELECT DISTRICT'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${districtDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {districtDropdownOpen && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-4 py-3 border-b border-border-divider">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl border border-border-divider">
                                                <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={districtFilter}
                                                    onChange={e => setDistrictFilter(e.target.value)}
                                                    placeholder="FILTER DISTRICT..."
                                                    className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                            {filteredDistricts
                                                .filter(d => d.toLowerCase().includes(districtFilter.toLowerCase()))
                                                .map(d => (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, district: d }));
                                                            setDistrictDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${formData.district === d ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))
                                            }
                                            {filteredDistricts.filter(d => d.toLowerCase().includes(districtFilter.toLowerCase())).length === 0 && (
                                                <div className="px-5 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                    No districts found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.district && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.district}</p>}
                        </div>
                    </div>

                    {/* Postal Code & Phone */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Postal Code *</label>
                            <input
                                type="text"
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                className={`w-full px-5 py-3.5 bg-input border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 text-[11px] font-bold text-text-primary tracking-widest uppercase transition-all shadow-sm ${errors.postal_code ? 'border-red-500' : 'border-border-default'}`}
                                placeholder="ENTER POSTAL CODE"
                            />
                            {errors.postal_code && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.postal_code}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Phone *</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const digits = val.replace(/\D/g, "");
                                    let formatted = digits;
                                    if (digits.length > 3 && digits.length <= 6) {
                                        formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                                    } else if (digits.length > 6) {
                                        formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
                                    }
                                    setFormData({ ...formData, phone: formatted });
                                }}
                                className={`w-full px-5 py-3.5 bg-input border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 text-[11px] font-bold text-text-primary uppercase tracking-widest transition-all shadow-sm ${errors.phone ? 'border-red-500' : 'border-border-default'}`}
                                placeholder="0XX-XXX-XXXX"
                            />
                            {errors.phone && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Email & Manager */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-5 py-3.5 bg-input border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 text-[11px] font-bold text-text-primary tracking-widest transition-all shadow-sm ${errors.email ? 'border-red-500' : 'border-border-default'}`}
                                placeholder="BRANCH@LMS.LK"
                            />
                            {errors.email && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-text-muted tracking-widest ml-1 uppercase">Branch Manager </label>
                            <div className="relative" ref={managerRef}>
                                <button
                                    type="button"
                                    onClick={() => { setManagerDropdownOpen(!managerDropdownOpen); setManagerFilter(''); }}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 bg-input border rounded-xl text-[11px] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/50 outline-none shadow-sm cursor-pointer transition-all ${errors.manager_id ? 'border-red-500' : 'border-border-default'}`}
                                >
                                    <span className={formData.manager_id ? 'text-text-primary' : 'text-text-muted opacity-50'}>
                                        {formData.manager_id
                                            ? `${managers.find(m => m.staff_id === formData.manager_id)?.full_name} (${formData.manager_id})`
                                            : 'SELECT MANAGER'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${managerDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {managerDropdownOpen && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="px-4 py-3 border-b border-border-divider">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-input rounded-xl border border-border-divider">
                                                <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={managerFilter}
                                                    onChange={e => setManagerFilter(e.target.value)}
                                                    placeholder="FILTER MANAGER..."
                                                    className="flex-1 bg-transparent outline-none text-[11px] font-semibold text-text-primary placeholder:text-text-muted uppercase tracking-wider"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-52 overflow-y-auto custom-scrollbar">
                                            {managers
                                                .filter(m =>
                                                    m.full_name.toLowerCase().includes(managerFilter.toLowerCase()) ||
                                                    m.staff_id.toLowerCase().includes(managerFilter.toLowerCase())
                                                )
                                                .map(manager => (
                                                    <button
                                                        key={manager.staff_id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, manager_id: manager.staff_id }));
                                                            setManagerDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-hover ${formData.manager_id === manager.staff_id ? 'text-primary-600 bg-primary-50/50' : 'text-text-primary'}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span>{manager.full_name} ({manager.staff_id})</span>
                                                            {manager.branch?.branch_name && (
                                                                <span className="text-[8px] opacity-40">TRANSFER FROM: {manager.branch.branch_name}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))
                                            }
                                            {managers.filter(m =>
                                                m.full_name.toLowerCase().includes(managerFilter.toLowerCase()) ||
                                                m.staff_id.toLowerCase().includes(managerFilter.toLowerCase())
                                            ).length === 0 && (
                                                    <div className="px-5 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest text-center">
                                                        No managers found
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.manager_id && <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter mt-1 ml-1">{errors.manager_id}</p>}
                            {formData.manager_id && managers.find(m => m.staff_id === formData.manager_id)?.branch &&
                                managers.find(m => m.staff_id === formData.manager_id)?.branch?.branch_name !== initialData?.branch_name && (
                                    <p className="text-amber-600 text-[9px] font-black uppercase mt-2 flex items-center gap-1.5 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 italic tracking-tight leading-relaxed">
                                        <span>⚠️ AUTOMATIC TRANSFER: MANAGER WILL BE MOVED FROM <strong>{managers.find(m => m.staff_id === formData.manager_id)?.branch?.branch_name}</strong>.</span>
                                    </p>
                                )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border-default/50 flex gap-4 justify-center bg-gray-50/50 rounded-b-[2.5rem]">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 bg-white border border-border-default text-text-muted font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-50 transition-all hover:text-text-primary shadow-sm active:scale-95"
                    >
                        Abort
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!hasChanges}
                        className={`flex-[1.5] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${!hasChanges
                            ? 'bg-muted text-text-muted cursor-not-allowed shadow-none border border-border-default'
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20'
                            }`}
                    >
                        {initialData ? 'Update Branch' : 'Create Branch'}
                    </button>
                </div>
            </div>
        </div>
    );
}
