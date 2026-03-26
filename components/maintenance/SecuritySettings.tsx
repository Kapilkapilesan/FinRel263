'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { systemSettingService, SystemSetting } from '../../services/systemSetting.service';

export function SecuritySettings() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await systemSettingService.getAll();
            setSettings(response.data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load security settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: string) => {
        setSettings(prev => prev.map(s => 
            s.key === key ? { ...s, value: s.value === '1' ? '0' : '1' } : s
        ));
    };

    const handleToggleValue = (key: string, value: string) => {
        setSettings(prev => {
            const exists = prev.find(s => s.key === key);
            if (exists) {
                return prev.map(s => s.key === key ? { ...s, value } : s);
            }
            return [...prev, { 
                id: 0, 
                key, 
                value, 
                description: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }];
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = settings.map(s => ({ key: s.key, value: s.value }));
            await systemSettingService.update(payload);
            toast.success('Security settings updated successfully');
            loadSettings();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const getSettingValue = (key: string) => {
        return settings.find(s => s.key === key)?.value === '1';
    };

    const getSettingRawValue = (key: string, defaultValue: string = '') => {
        return settings.find(s => s.key === key)?.value || defaultValue;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-primary-500/10 p-3 rounded-2xl">
                        <Shield className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Settings</h1>
                        <p className="text-text-muted font-medium">Manage system-wide access restrictions and security policies</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-muted-bg text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20"
                >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IP Restriction Toggle */}
                <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border-default hover:border-primary-500/30 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="bg-emerald-500/10 p-4 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                            <Lock className="w-8 h-8 text-emerald-500" />
                        </div>
                        <button
                            onClick={() => handleToggle('enable_ip_restriction')}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                                getSettingValue('enable_ip_restriction') ? 'bg-emerald-500' : 'bg-border-default'
                            }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-card shadow-sm transition-transform ${
                                    getSettingValue('enable_ip_restriction') ? 'translate-x-7' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Network Restriction</h3>
                        <p className="text-text-muted font-medium leading-relaxed">
                            When enabled, access to the system will be restricted to IP addresses listed in the IP Whitelist.
                        </p>
                        <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            getSettingValue('enable_ip_restriction') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                            {getSettingValue('enable_ip_restriction') ? 'Currently Protected' : 'Restrictions Disabled'}
                        </div>
                    </div>
                </div>

                {/* Device Restriction Toggle */}
                <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border-default hover:border-primary-500/30 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="bg-blue-500/10 p-4 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                            <Smartphone className="w-8 h-8 text-blue-500" />
                        </div>
                        <button
                            onClick={() => handleToggle('enable_device_restriction')}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                                getSettingValue('enable_device_restriction') ? 'bg-blue-500' : 'bg-border-default'
                            }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-card shadow-sm transition-transform ${
                                    getSettingValue('enable_device_restriction') ? 'translate-x-7' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Device Registration</h3>
                        <p className="text-text-muted font-medium leading-relaxed">
                            When enabled, users can only log in from pre-registered and authorized devices.
                        </p>
                        <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            getSettingValue('enable_device_restriction') ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                            {getSettingValue('enable_device_restriction') ? 'Registration Required' : 'Restrictions Disabled'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restriction Mode Selection - Only visible if both restrictions are enabled */}
            {getSettingValue('enable_ip_restriction') && getSettingValue('enable_device_restriction') && (
                <div className="bg-card p-8 rounded-[2rem] shadow-sm border border-border-default animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-primary-500/10 p-3 rounded-xl">
                            <Shield className="w-6 h-6 text-primary-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">Restriction Enforcement Mode</h3>
                            <p className="text-sm text-text-muted font-medium">Choose how multiple security restrictions are applied together</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleToggleValue('security_restriction_mode', 'strict')}
                            className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all text-left ${
                                getSettingRawValue('security_restriction_mode', 'strict') === 'strict'
                                    ? 'border-primary-500 bg-primary-500/5'
                                    : 'border-border-default hover:border-text-muted/20'
                            }`}
                        >
                            <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                getSettingRawValue('security_restriction_mode', 'strict') === 'strict' ? 'border-primary-500' : 'border-border-divider'
                            }`}>
                                {getSettingRawValue('security_restriction_mode', 'strict') === 'strict' && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-text-primary">Strict (AND)</p>
                                <p className="text-sm text-text-muted font-medium mt-1">Requires BOTH whitelisted network AND authorized device for access.</p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleToggleValue('security_restriction_mode', 'flexible')}
                            className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all text-left ${
                                getSettingRawValue('security_restriction_mode', 'strict') === 'flexible'
                                    ? 'border-emerald-500 bg-emerald-500/5'
                                    : 'border-border-default hover:border-text-muted/20'
                            }`}
                        >
                            <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                getSettingRawValue('security_restriction_mode', 'strict') === 'flexible' ? 'border-emerald-500' : 'border-border-divider'
                            }`}>
                                {getSettingRawValue('security_restriction_mode', 'strict') === 'flexible' && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-text-primary">Flexible (OR)</p>
                                <p className="text-sm text-text-muted font-medium mt-1">Allows access if EITHER whitelisted network OR authorized device is verified.</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-8">
                <div className="flex gap-4">
                    <div className="bg-card p-2 h-fit rounded-xl border border-border-default/50 shadow-sm">
                        <RefreshCw className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-2">Important Note</h4>
                        <p className="text-text-secondary font-medium leading-relaxed">
                            SuperAdmins are exempt from these restrictions to ensure emergency access. 
                            If you enable Network Restriction, make sure the workplace IPs are correctly whitelisted 
                            before staff members attempt to log in.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
