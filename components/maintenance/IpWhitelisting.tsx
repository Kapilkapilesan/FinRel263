'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, X, User as UserIcon, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import { ipWhitelistService, IpWhitelistEntry } from '../../services/ipWhitelist.service';
import { staffService } from '../../services/staff.service';
import { User } from '../../types/staff.types';

export function IpWhitelisting() {
    const [ips, setIps] = useState<IpWhitelistEntry[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingIp, setEditingIp] = useState<IpWhitelistEntry | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        ip_address: '',
        description: '',
        is_active: true,
        user_id: null as number | null
    });

    useEffect(() => {
        loadIps();
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await staffService.getUsersList();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users', error);
        }
    };

    const loadIps = async () => {
        try {
            setLoading(true);
            const response = await ipWhitelistService.getAll();
            setIps(response.data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load IP whitelist');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (ip: IpWhitelistEntry | null = null) => {
        if (ip) {
            setEditingIp(ip);
            setFormData({
                ip_address: ip.ip_address,
                description: ip.description,
                is_active: ip.is_active,
                user_id: ip.user_id
            });
        } else {
            setEditingIp(null);
            setFormData({
                ip_address: '',
                description: '',
                is_active: true,
                user_id: null
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingIp) {
                await ipWhitelistService.update(editingIp.id, formData);
                toast.success('IP Whitelist entry updated');
            } else {
                await ipWhitelistService.add(formData.ip_address, formData.description, formData.is_active, formData.user_id);
                toast.success('IP Address added to whitelist');
            }
            setShowModal(false);
            loadIps();
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to remove this IP from the whitelist?')) {
            try {
                await ipWhitelistService.delete(id);
                toast.success('IP Address removed');
                loadIps();
            } catch (error: any) {
                toast.error(error.message || 'Delete failed');
            }
        }
    };

    const toggleStatus = async (ip: IpWhitelistEntry) => {
        try {
            await ipWhitelistService.update(ip.id, { is_active: !ip.is_active });
            toast.success(`IP ${!ip.is_active ? 'Activated' : 'Deactivated'}`);
            loadIps();
        } catch (error: any) {
            toast.error(error.message || 'Update failed');
        }
    };

    const filteredIps = ips.filter(ip =>
        ip.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-primary-500/10 p-3 rounded-2xl">
                        <Shield className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">IP Whitelisting</h1>
                        <p className="text-text-muted font-medium">Manage allowed IP addresses for system access</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Add IP Address
                </button>
            </div>

            {/* Content Card */}
            <div className="bg-card rounded-[2rem] shadow-sm border border-border-default overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Whitelisted IP Addresses</h2>
                            <p className="text-sm text-text-muted">Access restricted to these IP addresses when restriction mode is enabled.</p>
                        </div>
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search IPs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-muted-bg border-none rounded-xl font-medium text-text-primary placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border-divider/50">
                                    <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">IP Address</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Assigned User</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Description</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Added By</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date Added</th>
                                    <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredIps.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-text-muted font-medium bg-muted-bg/10">
                                            No IP addresses found
                                        </td>
                                    </tr>
                                ) : filteredIps.map((ip) => (
                                    <tr key={ip.id} className="group hover:bg-hover/50 transition-colors border-b border-border-divider/30 last:border-0">
                                        <td className="py-4 px-4">
                                            <span className="font-bold text-text-primary tracking-tight">{ip.ip_address}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                {ip.user ? (
                                                    <>
                                                        <div className="bg-primary-500/10 p-1.5 rounded-lg">
                                                            <UserIcon className="w-3.5 h-3.5 text-primary-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-text-primary text-sm leading-none">{ip.user.name}</p>
                                                            <p className="text-[10px] text-text-muted font-medium mt-1 uppercase tracking-wider">{ip.user.user_name}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                                                            <Globe className="w-3.5 h-3.5 text-emerald-500" />
                                                        </div>
                                                        <span className="text-emerald-500 font-bold text-sm">Global IP</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-text-secondary font-medium">{ip.description}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-text-muted font-medium">{ip.adder?.name || 'Current User'}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-text-muted font-medium">
                                                {new Date(ip.created_at).toLocaleDateString('en-GB')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button
                                                onClick={() => toggleStatus(ip)}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${ip.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-muted-bg text-text-muted'
                                                    }`}
                                            >
                                                {ip.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {ip.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                <button
                                                    onClick={() => toggleStatus(ip)}
                                                    className={`p-2 hover:bg-card hover:shadow-md rounded-lg transition-all ${ip.is_active ? 'text-emerald-500' : 'text-text-muted'}`}
                                                    title={ip.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {ip.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(ip)}
                                                    className="p-2 hover:bg-card hover:shadow-md rounded-lg text-text-muted hover:text-primary-500 transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ip.id)}
                                                    className="p-2 hover:bg-card hover:shadow-md rounded-lg text-text-muted hover:text-rose-500 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-border-default">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-text-primary">
                                        {editingIp ? 'Edit IP Address' : 'Add New IP Address'}
                                    </h3>
                                    <p className="text-sm text-text-muted font-medium">Enter the IP address to whitelist.</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-hover rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-text-muted" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">IP Address</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 192.168.1.1"
                                        value={formData.ip_address}
                                        onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                                        required
                                        className="w-full px-6 py-4 bg-input border border-border-default/50 rounded-2xl font-bold text-text-primary placeholder:text-text-muted/30 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Description</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Head Office"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        className="w-full px-6 py-4 bg-input border border-border-default/50 rounded-2xl font-bold text-text-primary placeholder:text-text-muted/30 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Assign User (Optional)</label>
                                    <select
                                        value={formData.user_id || ''}
                                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full px-6 py-4 bg-input border border-border-default/50 rounded-2xl font-bold text-text-primary focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer outline-none"
                                    >
                                        <option value="" className="bg-card text-text-primary">Global (All Staff)</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id} className="bg-card text-text-primary">
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-text-muted font-medium ml-1">Leave empty to whitelist for all staff members.</p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted-bg/50 rounded-2xl border border-border-default/50">
                                    <div>
                                        <p className="font-bold text-text-primary">Active Status</p>
                                        <p className="text-xs text-text-muted font-medium">Enable or disable this IP entry</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.is_active ? 'bg-emerald-500' : 'bg-border-default'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-muted-bg/50 hover:bg-hover text-text-muted hover:text-text-primary rounded-2xl font-bold transition-all border border-border-default/50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20"
                                    >
                                        {editingIp ? 'Update IP' : 'Add IP'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
