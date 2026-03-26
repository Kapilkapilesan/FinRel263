'use client';

import React, { useState } from 'react';
import {
    MessageSquare,
    Mail,
    Smartphone,
    Send,
    Plus,
    RotateCcw,
    Trash2,
    Play,
    CheckCircle2,
    XCircle,
    Info,
    MailCheck,
    Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { systemTestService, DiagnosticResult } from '../../services/systemTest.service';

interface SmsTestItem {
    id: string;
    phone_number: string;
    message: string;
    result?: DiagnosticResult;
    isProcessing?: boolean;
}

export function SystemTest() {
    const [activeTab, setActiveTab] = useState<'sms' | 'email'>('sms');
    const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);

    // SMS State
    const [smsTests, setSmsTests] = useState<SmsTestItem[]>([
        { id: Math.random().toString(36), phone_number: '', message: '' }
    ]);

    // Email State
    const [emailForm, setEmailForm] = useState({
        recipients: '',
        subject: 'System Test Email',
        message: 'This is a test email from the Loan Management System.'
    });

    const addSmsTest = () => {
        setSmsTests(prev => [
            ...prev,
            { id: Math.random().toString(36), phone_number: '', message: '' }
        ]);
    };

    const removeSmsTest = (id: string) => {
        if (smsTests.length === 1) return;
        setSmsTests(prev => prev.filter(t => t.id !== id));
    };

    const handleSmsChange = (id: string, field: keyof SmsTestItem, value: any) => {
        setSmsTests(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };


    const runSmsTests = async () => {
        const validTests = smsTests.filter(t => t.phone_number.trim() && t.message.trim());
        if (validTests.length === 0) {
            toast.warning('Please fill in at least one SMS test');
            return;
        }

        setIsGlobalProcessing(true);
        try {
            const response = await systemTestService.sendTestSms(validTests);

            // Map results back to items
            const newSmsTests = [...smsTests];
            response.data.forEach((res, index) => {
                const itemIndex = newSmsTests.findIndex(t => t.phone_number === res.phone_number);
                if (itemIndex !== -1) {
                    newSmsTests[itemIndex].result = res;
                }
            });
            setSmsTests(newSmsTests);
            toast.success('SMS Diagnostic Complete');
        } catch (error: any) {
            toast.error(error.message || 'Diagnostic failed');
        } finally {
            setIsGlobalProcessing(false);
        }
    };

    const runEmailTests = async () => {
        const recipientList = emailForm.recipients.split(',').map(e => e.trim()).filter(e => e);
        if (recipientList.length === 0) {
            toast.warning('Please enter at least one recipient email');
            return;
        }

        setIsGlobalProcessing(true);
        try {
            await systemTestService.sendTestEmail({
                recipients: recipientList,
                subject: emailForm.subject,
                message: emailForm.message
            });
            toast.success('Email Diagnostic Complete');
        } catch (error: any) {
            toast.error(error.message || 'Email diagnostic failed');
        } finally {
            setIsGlobalProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <Smartphone className="w-8 h-8 text-primary-500" />
                    <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">System Diagnostics</h1>
                </div>
                <p className="text-text-secondary font-medium ml-11">Test communication channels and system alerts</p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-card p-1.5 rounded-[2rem] border border-border-default flex gap-2 shadow-sm w-full max-w-2xl mx-auto">
                <button
                    onClick={() => setActiveTab('sms')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${activeTab === 'sms'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'text-text-muted hover:text-text-primary hover:bg-hover'}`}
                >
                    <MessageSquare className="w-4 h-4" />
                    SMS Gateway
                </button>
                <button
                    onClick={() => setActiveTab('email')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${activeTab === 'email'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'text-text-muted hover:text-text-primary hover:bg-hover'}`}
                >
                    <Mail className="w-4 h-4" />
                    Gmail / SMTP
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-card rounded-[3rem] border border-border-default shadow-xl shadow-black/5 p-10 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 opacity-[0.02] -mr-32 -mt-32 rounded-full blur-3xl pointer-events-none" />

                {activeTab === 'sms' ? (
                    <div className="space-y-10 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-text-primary">SMS Delivery Test</h2>
                                <p className="text-text-secondary font-medium mt-1">Verify SMS integration by sending test messages to mobile numbers</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSmsTests([{ id: Math.random().toString(36), phone_number: '', message: '' }])}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-text-secondary font-bold hover:bg-hover transition-all border border-transparent hover:border-border-divider"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </button>
                                <button
                                    onClick={addSmsTest}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-primary-500 font-bold hover:bg-primary-500/10 transition-all border border-primary-500/20"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Test
                                </button>
                                <button
                                    onClick={runSmsTests}
                                    disabled={isGlobalProcessing}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                >
                                    {isGlobalProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                    Run All Tests
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {smsTests.map((test, index) => (
                                <div key={test.id} className="p-8 bg-hover rounded-[2.5rem] border border-border-divider relative group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted">
                                                    <Smartphone className="w-5 h-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. +94771234567"
                                                    value={test.phone_number}
                                                    onChange={(e) => handleSmsChange(test.id, 'phone_number', e.target.value)}
                                                    className="w-full pl-16 pr-8 py-4 bg-card border border-border-default rounded-2xl font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Test Message</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Enter test message content..."
                                                    value={test.message}
                                                    onChange={(e) => handleSmsChange(test.id, 'message', e.target.value)}
                                                    className="w-full px-8 py-4 bg-card border border-border-default rounded-2xl font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action result overlay or indicator */}
                                    <div className="absolute right-6 bottom-6 flex items-center gap-3">
                                        {test.result && (
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${test.result.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {test.result.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {test.result.status}
                                            </div>
                                        )}
                                        {smsTests.length > 1 && (
                                            <button
                                                onClick={() => removeSmsTest(test.id)}
                                                className="p-2 text-text-muted hover:text-rose-500 transition-colors bg-card hover:bg-rose-500/5 rounded-xl border border-border-default"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                if (!test.phone_number || !test.message) return;
                                                handleSmsChange(test.id, 'isProcessing' as any, true as any);
                                                try {
                                                    const res = await systemTestService.sendTestSms([test]);
                                                    handleSmsChange(test.id, 'result', res.data[0]);
                                                    toast.success('Test message sent');
                                                } catch (e: any) {
                                                    toast.error(e.message);
                                                } finally {
                                                    handleSmsChange(test.id, 'isProcessing' as any, false as any);
                                                }
                                            }}
                                            disabled={test.isProcessing}
                                            className="p-2 text-primary-500 hover:text-white hover:bg-primary-500 transition-all bg-card rounded-xl border border-primary-500/20"
                                        >
                                            <Send className={`w-4 h-4 ${test.isProcessing ? 'animate-pulse' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-primary-500/5 border border-primary-500/10 p-6 rounded-[2.5rem] flex items-start gap-4">
                            <Info className="w-6 h-6 text-primary-500 mt-1" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-text-primary">Diagnostic Mode</h4>
                                <p className="text-xs text-text-secondary font-medium leading-relaxed">
                                    Each test will be logged in the system as a diagnostic event. Ensure you have sufficient SMS credits in your gateway provider before running bulk tests.
                                    Numbers should include country codes (e.g., +94).
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-text-primary">Email Service Test</h2>
                                <p className="text-text-secondary font-medium mt-1">Verify SMTP configuration by sending a test email</p>
                            </div>
                            <button
                                onClick={() => setEmailForm({ recipients: '', subject: 'System Test Email', message: 'This is a test email from the Loan Management System.' })}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-text-secondary font-bold hover:bg-hover transition-all border border-transparent hover:border-border-divider"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Clear Form
                            </button>
                        </div>

                        <div className="bg-hover p-10 rounded-[3rem] border border-border-divider space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Recipient Email</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. user@example.com, admin@fincore.com"
                                        value={emailForm.recipients}
                                        onChange={(e) => setEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                                        className="w-full pl-16 pr-8 py-5 bg-card border border-border-default rounded-3xl font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                    />
                                    <p className="mt-2 ml-4 text-[10px] font-bold text-text-muted uppercase opacity-60">* Separate multiple emails with commas</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Subject</label>
                                <input
                                    type="text"
                                    placeholder="Enter email subject..."
                                    value={emailForm.subject}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-8 py-5 bg-card border border-border-default rounded-3xl font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Message Content</label>
                                <textarea
                                    rows={6}
                                    placeholder="Enter test message content..."
                                    value={emailForm.message}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-8 py-6 bg-card border border-border-default rounded-[2rem] font-bold text-text-primary focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={runEmailTests}
                                disabled={isGlobalProcessing}
                                className="w-full flex items-center justify-center gap-3 py-6 rounded-[2.5rem] bg-primary-500 text-white font-black text-lg transition-all shadow-xl shadow-primary-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                            >
                                {isGlobalProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <MailCheck className="w-6 h-6" />}
                                Send Test Gmail
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Active SMTP', value: 'Google SMTP Relay', color: 'text-emerald-500' },
                                { label: 'Security', value: 'TLS / SSL (256-bit)', color: 'text-primary-500' },
                                { label: 'Environment', value: 'Production', color: 'text-amber-500' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-hover/50 p-6 rounded-3xl border border-border-divider flex flex-col items-center text-center">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
