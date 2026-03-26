import React, { useState, useEffect } from 'react';
import { systemConfigService } from '@/services/systemConfig.service';
import { AlertCircle, Smartphone } from 'lucide-react';
import { toast } from 'react-toastify';

export function WelcomeGreetingTab() {
    const [staffSms, setStaffSms] = useState('');
    const [customerSms, setCustomerSms] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewVars, setPreviewVars] = useState({
        staff_name: 'John Doe',
        customer_name: 'Jane Smith',
        branch_name: 'Central Branch'
    });

    useEffect(() => {
        fetchGreetings();
    }, []);

    const fetchGreetings = async () => {
        try {
            const data = await systemConfigService.getWelcomeGreetings();
            setStaffSms(data.staff_welcome_sms || '');
            setCustomerSms(data.customer_welcome_sms || '');
        } catch (error) {
            toast.error('Failed to load welcome greetings');
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await systemConfigService.updateWelcomeGreetings({
                staff_welcome_sms: staffSms,
                customer_welcome_sms: customerSms
            });
            toast.success('Welcome greetings updated successfully');
        } catch (error) {
            toast.error('Failed to save welcome greetings');
        } finally {
            setIsLoading(false);
        }
    };

    const renderPreview = (template: string, type: 'staff' | 'customer') => {
        let parsed = template;
        parsed = parsed.replace(/{branch_name}/g, `<span class="text-primary-600 font-semibold bg-primary-50 px-1 rounded">${previewVars.branch_name}</span>`);

        if (type === 'staff') {
            parsed = parsed.replace(/{staff_name}/g, `<span class="text-primary-600 font-semibold bg-primary-50 px-1 rounded">${previewVars.staff_name}</span>`);
        } else {
            parsed = parsed.replace(/{customer_name}/g, `<span class="text-primary-600 font-semibold bg-primary-50 px-1 rounded">${previewVars.customer_name}</span>`);
        }

        return (
            <div className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-border-default">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b border-border-default flex items-center justify-between">
                    <div className="flex items-center gap-2 text-text-secondary text-xs">
                        <Smartphone className="w-4 h-4" />
                        <span>SMS Preview</span>
                    </div>
                    <span className="text-xs text-text-muted">Just now</span>
                </div>
                <div className="p-4 bg-app-background flex-1 text-sm font-medium text-text-primary leading-relaxed" dangerouslySetInnerHTML={{ __html: parsed }} />
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Column */}
            <div className="space-y-6">
                <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm">
                    <h2 className="text-lg font-bold text-text-primary mb-2">Staff Welcome Message</h2>
                    <p className="text-sm text-text-secondary mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                        Available variables: {'{staff_name}'}, {'{branch_name}'}
                    </p>
                    <textarea
                        value={staffSms}
                        onChange={(e) => setStaffSms(e.target.value)}
                        className="w-full h-32 p-4 bg-app-background border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                        placeholder="Welcome to our team {staff_name}!..."
                    />
                </div>

                <div className="bg-surface p-6 rounded-3xl border border-border-default shadow-sm">
                    <h2 className="text-lg font-bold text-text-primary mb-2">Customer Welcome Message</h2>
                    <p className="text-sm text-text-secondary mb-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                        Available variables: {'{customer_name}'}, {'{branch_name}'}
                    </p>
                    <textarea
                        value={customerSms}
                        onChange={(e) => setCustomerSms(e.target.value)}
                        className="w-full h-32 p-4 bg-app-background border border-border-default rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                        placeholder="Welcome {customer_name}! Thank you for joining {branch_name}..."
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                    >
                        {isLoading ? 'Saving Changes...' : 'Save Configuration'}
                    </button>
                </div>
            </div>

            {/* Preview Column */}
            <div className="space-y-6 lg:pl-8 lg:border-l border-border-default">
                <div>
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Staff SMS Preview</h3>
                    <div className="h-40">
                        {renderPreview(staffSms || 'Your message preview will appear here...', 'staff')}
                    </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border-default border-dashed">
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Customer SMS Preview</h3>
                    <div className="h-40">
                        {renderPreview(customerSms || 'Your message preview will appear here...', 'customer')}
                    </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-100 dark:border-primary-800/30">
                    <h4 className="text-sm font-semibold text-primary-700 dark:text-primary-400 mb-2">Test Variables</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Staff Name</label>
                            <input
                                type="text"
                                value={previewVars.staff_name}
                                onChange={e => setPreviewVars({ ...previewVars, staff_name: e.target.value })}
                                className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-border-default"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={previewVars.customer_name}
                                onChange={e => setPreviewVars({ ...previewVars, customer_name: e.target.value })}
                                className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-border-default"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-text-secondary mb-1">Branch Name</label>
                            <input
                                type="text"
                                value={previewVars.branch_name}
                                onChange={e => setPreviewVars({ ...previewVars, branch_name: e.target.value })}
                                className="w-full px-2 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-border-default"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
