import React, { useState } from 'react';
import { CustomerActivity, ActivityFormData, customerActivityService } from '@/services/customerActivity.service';

import { toast } from 'react-toastify';
import { Calendar, MessageSquare, UserCheck, AlertCircle } from 'lucide-react';

interface AddActivityFormProps {
    customerId: number;
    onActivityAdded: () => void;
}

const ACTIVITY_TYPES = ['Meeting', 'Call', 'Visit', 'Collection', 'Arrears Follow-up', 'Other'];
const BEHAVIORS = ['Positive', 'Neutral', 'Negative', 'Aggressive', 'Cooperative'];
const OUTCOMES = ['Pending', 'Resolved', 'Promise to Pay', 'No Answer', 'Follow-up Required'];

export const AddActivityForm: React.FC<AddActivityFormProps> = ({ customerId, onActivityAdded }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<ActivityFormData>>({
        customer_id: customerId,
        activity_type: 'Meeting',
        customer_behavior: 'Neutral',
        outcome: '',
        description: '',
        activity_date: new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description) {
            toast.error('Description is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await customerActivityService.create({
                ...formData,
                customer_id: customerId,
            } as ActivityFormData);

            toast.success('Activity recorded successfully');
            setFormData({
                customer_id: customerId,
                activity_type: 'Meeting',
                customer_behavior: 'Neutral',
                outcome: '',
                description: '',
                activity_date: new Date().toISOString().split('T')[0],
            });
            onActivityAdded();
        } catch (error) {
            console.error('Failed to add activity', error);
            toast.error('Failed to add activity');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card/50 p-4 rounded-xl border border-border-default">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Log New Activity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Type</label>
                    <select
                        name="activity_type"
                        value={formData.activity_type}
                        onChange={handleChange}
                        className="w-full text-sm bg-input text-text-primary border-border-default rounded-lg p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        {ACTIVITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
                    <input
                        type="date"
                        name="activity_date"
                        value={formData.activity_date}
                        onChange={handleChange}
                        className="w-full text-sm bg-input text-text-primary border-border-default rounded-lg p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Behavior</label>
                    <select
                        name="customer_behavior"
                        value={formData.customer_behavior}
                        onChange={handleChange}
                        className="w-full text-sm bg-input text-text-primary border-border-default rounded-lg p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        {BEHAVIORS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">Outcome</label>
                    <select
                        name="outcome"
                        value={formData.outcome}
                        onChange={handleChange}
                        className="w-full text-sm bg-input text-text-primary border-border-default rounded-lg p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        <option value="">Select Outcome...</option>
                        {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-medium text-text-muted mb-1">Description / Notes</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter details about the interaction..."
                    className="w-full text-sm bg-input text-text-primary border-border-default rounded-lg p-2 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    required
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting ? 'Saving...' : 'Save Activity'}
                </button>
            </div>
        </form>
    );
};
