
import React from 'react';
import { Wallet, CheckCircle2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { colors } from '@/themes/colors';
import { CollectionStats as StatsType } from '../../services/collection.types';

interface CollectionStatsProps {
    stats: StatsType;
}

export function CollectionStats({ stats }: CollectionStatsProps) {
    // Updated logic: Positive (+) is Debt/Red, Negative (-) is Advance/Green
    const netArrears = stats.arrears;

    // Determine styling based on net arrears value
    const getArrearsStyle = () => {
        if (netArrears > 0) {
            return {
                bgAccent: 'bg-rose-50/50',
                iconBg: 'bg-rose-500',
                shadow: 'shadow-rose-200',
                textColor: 'text-rose-600',
                subtitleColor: 'text-rose-400',
                subtitle: 'Debt (Overdue)',
                Icon: TrendingUp
            };
        } else if (netArrears < 0) {
            return {
                bgAccent: 'bg-primary-50/50',
                iconBg: 'bg-primary-500',
                shadow: 'shadow-primary-200',
                textColor: 'text-primary-600',
                subtitleColor: 'text-primary-400',
                subtitle: 'Advance (Credit)',
                Icon: TrendingDown
            };
        } else {
            return {
                bgAccent: 'bg-gray-50/50',
                iconBg: 'bg-gray-400',
                shadow: 'shadow-gray-200',
                textColor: 'text-gray-600',
                subtitleColor: 'text-gray-400',
                subtitle: 'On track',
                Icon: Minus
            };
        }
    };

    const arrearsStyle = getArrearsStyle();
    const ArrearsIcon = arrearsStyle.Icon;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-card rounded-2xl border border-border-default/50 p-3 hover:shadow-sm transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 opacity-10" style={{ backgroundColor: colors.primary[500] }} />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${colors.primary[600]}20`, color: colors.primary[600], border: `1px solid ${colors.primary[600]}30` }}>
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5 group-hover:text-text-secondary transition-colors">Total Due Today</p>
                        <p className="text-xl font-black text-text-primary tracking-tight">LKR {stats.totalDue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border-default/50 p-3 hover:shadow-sm transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 opacity-10" style={{ backgroundColor: colors.primary[500] }} />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${colors.primary[600]}20`, color: colors.primary[600], border: `1px solid ${colors.primary[600]}30` }}>
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5">Total Collected</p>
                        <p className="text-xl font-black tracking-tight" style={{ color: colors.primary[600] }}>LKR {stats.collected.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border-default/50 p-3 hover:shadow-sm transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-10 transition-transform group-hover:scale-110 ${arrearsStyle.textColor.replace('text', 'bg')}`} />
                <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-10 h-10 ${arrearsStyle.iconBg.replace('bg', 'bg-opacity-10 bg')} ${arrearsStyle.textColor} border border-current/20 rounded-xl flex items-center justify-center shadow-sm`}>
                        <ArrearsIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-0.5">Total Arrears</p>
                        <p className={`text-[10px] ${arrearsStyle.subtitleColor} font-bold uppercase tracking-tight`}>{arrearsStyle.subtitle}</p>
                        <p className={`text-xl font-black ${arrearsStyle.textColor} tracking-tight leading-none`}>
                            LKR {netArrears > 0 ? '+' : ''}{netArrears.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
