'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Building2, ArrowLeftRight, ChevronDown, Check, Zap } from 'lucide-react';
import { useBranchContext, EffectiveBranch } from '../../contexts/BranchContext';

export function BranchSwitcher() {
    const { effectiveBranches, activeBranch, setActiveBranch, hasMultipleBranches, isLoading } = useBranchContext();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Don't render if no branches or only one branch
    if (!hasMultipleBranches || !activeBranch) {
        return null;
    }

    const handleBranchSelect = (branch: EffectiveBranch) => {
        setActiveBranch(branch);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 rounded-xl transition-all group"
                title="Switch Branch"
            >
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300 max-w-[100px] truncate">
                        {activeBranch.name}
                    </span>
                    {activeBranch.type === 'temporary' && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded">
                            <Zap className="w-2.5 h-2.5" />
                            TEMP
                        </span>
                    )}
                </div>
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 group-hover:rotate-180 transition-transform duration-300" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border-default z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border-divider">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            Switch Branch Context
                        </p>
                        <p className="text-xs text-text-muted opacity-60 mt-1">
                            You have access to multiple branches via temporary promotion
                        </p>
                    </div>
                    <div className="py-2">
                        {effectiveBranches.map((branch) => (
                            <button
                                key={branch.id}
                                onClick={() => handleBranchSelect(branch)}
                                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-hover transition-colors ${activeBranch.id === branch.id
                                    ? 'bg-primary-500/10'
                                    : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${branch.type === 'temporary'
                                        ? 'bg-amber-100 dark:bg-amber-900/30'
                                        : 'bg-muted-bg'
                                        }`}>
                                        <Building2 className={`w-4 h-4 ${branch.type === 'temporary'
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-text-muted'
                                            }`} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-text-primary">
                                            {branch.name}
                                        </p>
                                        <p className={`text-xs ${branch.type === 'temporary'
                                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                                            : 'text-text-muted'
                                            }`}>
                                            {branch.type === 'temporary' ? '⚡ Temporary Assignment' : 'Original Branch'}
                                        </p>
                                    </div>
                                </div>
                                {activeBranch.id === branch.id && (
                                    <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BranchSwitcher;
