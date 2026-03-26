'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Search, Trash2, CheckCircle, XCircle, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import { registeredDeviceService, RegisteredDevice } from '../../services/registeredDevice.service';

export function DeviceManagement() {
    const [devices, setDevices] = useState<RegisteredDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const response = await registeredDeviceService.getAllDevices();
            setDevices(response.data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load registered devices');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorize = async (id: number) => {
        try {
            await registeredDeviceService.authorize(id);
            toast.success('Device authorized successfully');
            loadDevices();
        } catch (error: any) {
            toast.error(error.message || 'Failed to authorize device');
        }
    };

    const handleRevoke = async (id: number) => {
        try {
            await registeredDeviceService.revoke(id);
            toast.success('Device authorization revoked');
            loadDevices();
        } catch (error: any) {
            toast.error(error.message || 'Failed to revoke authorization');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this device record? This will force the user to re-register.')) {
            try {
                await registeredDeviceService.delete(id);
                toast.success('Device record deleted');
                loadDevices();
            } catch (error: any) {
                toast.error(error.message || 'Delete failed');
            }
        }
    };

    const filteredDevices = devices.filter(device =>
        device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.device_fingerprint.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-primary-500/10 p-3 rounded-2xl">
                        <Smartphone className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Device Management</h1>
                        <p className="text-text-muted font-medium">Manage and authorize user devices for system access</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-3xl border border-border-default shadow-sm flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-2xl">
                        <Smartphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Devices</p>
                        <p className="text-2xl font-black text-text-primary tracking-tight">{devices.length}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border-default shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-2xl">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Authorized</p>
                        <p className="text-2xl font-black text-text-primary tracking-tight">{devices.filter(d => d.is_authorized).length}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-3xl border border-border-default shadow-sm flex items-center gap-4">
                    <div className="bg-rose-500/10 p-3 rounded-2xl">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Pending/Revoked</p>
                        <p className="text-2xl font-black text-text-primary tracking-tight">{devices.filter(d => !d.is_authorized).length}</p>
                    </div>
                </div>
            </div>

            {/* List Card */}
            <div className="bg-card rounded-[2rem] shadow-sm border border-border-default overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Registered Devices</h2>
                            <p className="text-sm text-text-muted font-medium">Monitoring and controlling access by machine identification.</p>
                        </div>
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by user or device..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-muted-bg border-none rounded-xl font-medium text-text-primary placeholder:text-text-muted/40 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-2">
                            <thead>
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Device / Fingerprint</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Last Used</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDevices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-text-muted font-medium bg-muted-bg/10">
                                            No registered devices found
                                        </td>
                                    </tr>
                                ) : filteredDevices.map((device) => (
                                    <tr key={device.id} className="group hover:bg-hover transition-all">
                                        <td className="py-4 px-6 bg-muted-bg/30 group-hover:bg-hover/10 rounded-l-2xl border-y border-l border-transparent group-hover:border-border-divider/20">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-card p-2 rounded-lg shadow-sm">
                                                    <Smartphone className="w-5 h-5 text-text-muted" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-primary">{device.device_name || 'Unknown Device'}</p>
                                                    <p className="text-[10px] text-text-muted font-mono tracking-tighter">{device.device_fingerprint}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 bg-muted-bg/30 group-hover:bg-hover/10 border-y border-transparent group-hover:border-border-divider/20">
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {device.last_used_at ? new Date(device.last_used_at).toLocaleString('en-GB') : 'Never'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 bg-muted-bg/30 group-hover:bg-hover/10 border-y border-transparent group-hover:border-border-divider/20">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                                                device.is_authorized ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                            }`}>
                                                {device.is_authorized ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {device.is_authorized ? 'Authorized' : 'Unauthorized'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 bg-muted-bg/30 group-hover:bg-hover/10 rounded-r-2xl border-y border-r border-transparent group-hover:border-border-divider/20 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {device.is_authorized ? (
                                                    <button
                                                        onClick={() => handleRevoke(device.id)}
                                                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Revoke
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAuthorize(device.id)}
                                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold transition-all"
                                                    >
                                                        Authorize
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(device.id)}
                                                    className="p-2 hover:bg-rose-500/10 text-text-muted hover:text-rose-500 rounded-lg transition-all"
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
        </div>
    );
}
