import React, { useEffect, useState } from 'react';
import { CustomerActivity, customerActivityService } from '@/services/customerActivity.service';
import { Calendar, User, MessageCircle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface ActivityTimelineProps {
    customerId: number;
    refreshTrigger: number; // Increment to refresh list
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ customerId, refreshTrigger }) => {
    const [activities, setActivities] = useState<CustomerActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadActivities = async () => {
            setIsLoading(true);
            try {
                const data = await customerActivityService.getAll(customerId);
                setActivities(data);
            } catch (error) {
                console.error('Failed to load activities', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (customerId) {
            loadActivities();
        }
    }, [customerId, refreshTrigger]);

    const getBehaviorColor = (behavior?: string) => {
        switch (behavior?.toLowerCase()) {
            case 'positive': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'aggressive': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 font-bold';
            case 'cooperative': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-text-muted text-sm">Loading timeline...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="p-8 text-center border-l-2 border-border-divider/30 ml-4">
                <p className="text-text-muted opacity-50 text-sm italic">No activity history found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 ml-2 mt-6">
            {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-8 border-l-2 border-border-divider/30 last:border-0 pb-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-card border-2 border-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]"></div>

                    <div className="bg-muted-bg/30 rounded-2xl p-4 border border-border-default/50 hover:border-primary-500/30 transition-all group/card">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mr-2 mb-1 ${activity.activity_type === 'Collection' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-primary-500/10 text-primary-500 border border-primary-500/20'}`}>
                                    {activity.activity_type}
                                </span>
                                <span className="text-[10px] text-text-muted opacity-60 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(activity.activity_date).toLocaleDateString()}
                                </span>
                            </div>

                            {activity.customer_behavior && (
                                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${getBehaviorColor(activity.customer_behavior)}`}>
                                    {activity.customer_behavior}
                                </span>
                            )}
                        </div>

                        <p className="text-[13px] text-text-primary leading-relaxed mb-4 whitespace-pre-wrap font-medium">
                            {activity.description}
                        </p>

                        <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-border-divider/20 pt-3 mt-3">
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest opacity-60">
                                <User className="w-3 h-3" />
                                {activity.staff_name}
                            </span>
                            {activity.outcome && (
                                <span className="font-black uppercase tracking-widest text-primary-500/80">
                                    Outcome: {activity.outcome}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
