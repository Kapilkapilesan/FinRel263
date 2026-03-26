'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings2,
    Clock,
    AlertTriangle,
    ShieldCheck,
    Bell,
    Calendar,
    Save,
    Power,
    RefreshCw,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { maintenanceModeService, MaintenanceStatus } from '../../services/maintenanceMode.service';

export function MaintenanceMode() {
    const [status, setStatus] = useState<MaintenanceStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        is_active: false,
        start_time: '',
        end_time: '',
        message: ''
    });

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingToggleValue, setPendingToggleValue] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setIsLoading(true);
        try {
            const response = await maintenanceModeService.getStatus();
            setStatus(response.data);
            setFormData({
                is_active: response.data.is_active,
                start_time: response.data.start_time ? response.data.start_time.slice(0, 16) : '',
                end_time: response.data.end_time ? response.data.end_time.slice(0, 16) : '',
                message: response.data.message || ''
            });
        } catch (error) {
            console.error('Failed to load status', error);
            toast.error('Failed to load maintenance settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        setPendingToggleValue(newValue);
        setShowConfirmModal(true);
    };

    const confirmToggle = async () => {
        setShowConfirmModal(false);
        setIsUpdating(true);
        try {
            await maintenanceModeService.updateSettings({ is_active: pendingToggleValue });
            setFormData(prev => ({ ...prev, is_active: pendingToggleValue }));
            toast.success(`Maintenance mode ${pendingToggleValue ? 'enabled' : 'disabled'} successfully`);
            loadStatus();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update maintenance mode');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateSettings = async () => {
        setIsUpdating(true);
        try {
            await maintenanceModeService.updateSettings({
                start_time: formData.start_time,
                end_time: formData.end_time,
                message: formData.message
            });
            toast.success('Scheduled maintenance settings updated');
            loadStatus();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                    <div className="bg-primary-500/10 p-4 rounded-[2rem] shadow-sm border border-primary-500/20 text-primary-500">
                        <Settings2 className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Maintenance Mode</h1>
                        <p className="text-text-secondary font-medium mt-1">Control system accessibility and maintenance operations</p>
                    </div>
                </div>

                <div className="bg-card px-6 py-3 rounded-full border border-border-default flex items-center gap-3 shadow-sm">
                    <div className={`w-3 h-3 rounded-full ${status?.is_active ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-sm font-bold text-text-primary">
                        System Status: {status?.is_active ? 'Under Maintenance' : 'Normal Operation'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* General Settings Card */}
                <div className="bg-card rounded-[3rem] border border-border-default overflow-hidden shadow-xl shadow-black/5 p-10 relative">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-2xl font-black text-text-primary">General Settings</h2>
                    </div>
                    <p className="text-text-secondary font-medium -mt-6 mb-8">Enable maintenance mode immediately to restrict access to the system.</p>

                    <div className="bg-hover p-10 rounded-[2.5rem] border border-border-divider flex items-center justify-between group transition-all duration-300 hover:border-primary-500/30">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-text-primary">Maintenance Mode</h3>
                            <p className="text-sm text-text-muted font-medium">Toggle to enable or disable system-wide maintenance mode manually</p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={handleToggleClick}
                                className="sr-only peer"
                            />
                            <div className="w-20 h-10 bg-border-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-8 after:w-9 after:transition-all peer-checked:bg-primary-500 shadow-inner"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-hover/50 p-6 rounded-[2rem] border border-border-divider flex items-start gap-4">
                            <ShieldCheck className="w-6 h-6 text-emerald-500 mt-1" />
                            <div>
                                <h4 className="font-bold text-text-primary">Super Administrative Access</h4>
                                <p className="text-xs text-text-muted mt-1 leading-relaxed">Only super admins can still access all features during maintenance.</p>
                            </div>
                        </div>
                        <div className="bg-hover/50 p-6 rounded-[2rem] border border-border-divider flex items-start gap-4">
                            <Bell className="w-6 h-6 text-primary-500 mt-1" />
                            <div>
                                <h4 className="font-bold text-text-primary">Worker Notification</h4>
                                <p className="text-xs text-text-muted mt-1 leading-relaxed">A maintenance notification will be shown to regular workers and standard admins when they try to access.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scheduled Maintenance Card */}
                <div className="bg-card rounded-[3rem] border border-border-default overflow-hidden shadow-xl shadow-black/5 p-10 relative">
                    <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-2xl font-black text-text-primary">Scheduled Maintenance</h2>
                    </div>
                    <p className="text-text-secondary font-medium -mt-6 mb-8">Plan ahead by setting a date and time for automatic maintenance mode.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Start Date & Time</label>
                            <div className="relative">
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                    className="w-full px-8 py-5 bg-hover border border-border-default rounded-3xl font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">End Date & Time</label>
                            <div className="relative">
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <input
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                    className="w-full px-8 py-5 bg-hover border border-border-default rounded-3xl font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Maintenance Message</label>
                        <textarea
                            rows={3}
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            className="w-full px-8 py-6 bg-hover border border-border-default rounded-[2rem] font-medium text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none resize-none"
                            placeholder="System is currently in Maintenance mode Access to most features is restricted"
                        />
                    </div>

                    {formData.start_time && formData.end_time && (
                        <div className="mt-8 p-6 bg-primary-500/5 border border-primary-500/10 rounded-3xl flex items-center gap-4">
                            <Clock className="w-5 h-5 text-primary-500" />
                            <p className="text-sm font-bold text-text-primary">
                                Scheduled maintenance window from <span className="text-primary-500">{new Date(formData.start_time).toLocaleString()}</span> to <span className="text-primary-500">{new Date(formData.end_time).toLocaleString()}</span>.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleUpdateSettings}
                        disabled={isUpdating}
                        className="flex items-center justify-center gap-3 px-12 py-5 bg-primary-500 text-white font-black text-lg rounded-[1.75rem] shadow-2xl shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isUpdating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                        Update Settings
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-md rounded-[3.5rem] border border-border-default shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className={`mx-auto w-24 h-24 mb-8 rounded-full flex items-center justify-center ${pendingToggleValue ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {pendingToggleValue ? <AlertTriangle className="w-12 h-12" /> : <ShieldCheck className="w-12 h-12" />}
                            </div>

                            <h3 className="text-2xl font-black text-text-primary mb-4">
                                {pendingToggleValue ? 'Enable Maintenance Mode?' : 'Disable Maintenance Mode?'}
                            </h3>
                            <p className="text-text-secondary font-medium leading-relaxed mb-10">
                                {pendingToggleValue
                                    ? 'This will immediately disconnect all active users and restrict system access. Are you sure?'
                                    : 'This will restore system access for all users immediately. Are you sure?'}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 py-5 bg-hover text-text-secondary rounded-[1.75rem] font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmToggle}
                                    className={`flex-1 py-5 text-white font-black text-lg rounded-[1.75rem] shadow-xl transition-all active:scale-95 ${pendingToggleValue ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
                                        }`}
                                >
                                    {pendingToggleValue ? 'Enable' : 'Disable'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
