'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { colors } from '@/themes/colors';

interface StepNavigationProps {
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrevious: () => void;
    onSubmit?: () => void;
    isNextDisabled?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
    currentStep,
    totalSteps,
    onNext,
    onPrevious,
    onSubmit,
    isNextDisabled = false,
}) => {
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    return (
        <div className="flex items-center justify-between bg-card/50 dark:bg-muted-bg/10 backdrop-blur-md rounded-[2rem] p-4 border border-border-divider/30 shadow-2xl transition-all mt-6">
            <button
                onClick={onPrevious}
                disabled={isFirstStep}
                className="group flex items-center gap-2 px-6 py-2.5 bg-muted-bg/20 hover:bg-muted-bg border border-border-divider/50 rounded-xl text-text-muted font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
            >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Previous</span>
            </button>

            <div className="hidden lg:flex flex-col items-center">
                <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-text-primary uppercase tracking-[0.3em]">Execution Phase</span>
                </div>
                <div className="text-[12px] font-black text-primary-500 uppercase tracking-[0.4em] opacity-40">
                    S-0{currentStep} / S-0{totalSteps}
                </div>
            </div>

            {!isLastStep ? (
                <button
                    onClick={onNext}
                    disabled={isNextDisabled}
                    className="group flex items-center gap-2 px-8 py-2.5 text-white rounded-xl transition-all disabled:bg-muted-bg/20 disabled:text-text-muted/30 disabled:border-transparent active:scale-95 shadow-xl shadow-primary-500/20"
                    style={!isNextDisabled ? {
                        background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                    } : {}}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Execute Next</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            ) : (
                <button
                    onClick={onSubmit}
                    className="group flex items-center gap-2 px-8 py-2.5 text-white rounded-xl transition-all active:scale-95 border"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                        boxShadow: `0 15px 25px -5px ${colors.primary[500]}33`,
                        borderColor: `${colors.primary[400]}33`
                    }}
                >
                    <CheckCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Final Submit</span>
                </button>
            )}
        </div>
    );
};
