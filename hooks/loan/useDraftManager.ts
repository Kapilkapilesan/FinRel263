import { useState, useEffect, useCallback } from 'react';
import { DraftItem, LoanFormData } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { generateDraftName } from '@/utils/loan.utils';

export const useDraftManager = (
    formData: LoanFormData,
    currentStep: number,
    selectedCustomerName?: string,
    onLoadDraft?: (data: LoanFormData, step: number) => void
) => {
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
    const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

    // Load drafts from DB on mount
    useEffect(() => {
        const fetchDrafts = async () => {
            setIsLoadingDrafts(true);
            try {
                const data = await loanService.getDrafts();
                setDrafts(data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    savedAt: d.savedAt,
                    formData: d.formData,
                    currentStep: d.currentStep,
                })));
            } catch (error) {
                console.error('Failed to load drafts from server', error);
            } finally {
                setIsLoadingDrafts(false);
            }
        };
        fetchDrafts();
    }, []);

    const saveDraft = useCallback(async () => {
        const name = selectedCustomerName || generateDraftName(
            undefined,
            formData.nic,
            formData.customer
        );

        // Strip out File objects from documents (can't serialize them)
        const sanitizedFormData = {
            ...formData,
            status: 'draft' as const,
            documents: {} // Files can't be saved in DB drafts
        };

        try {
            const result = await loanService.saveDraft({
                name,
                form_data: sanitizedFormData,
                current_step: currentStep,
                draft_id: loadedDraftId || undefined,
            });

            const newDraft: DraftItem = {
                id: result.id,
                name: result.name || name,
                savedAt: result.savedAt,
                formData: sanitizedFormData,
                currentStep: currentStep,
            };

            // Update local state
            setDrafts(prev => {
                const filtered = prev.filter(d => d.id !== result.id);
                return [newDraft, ...filtered];
            });
            setLoadedDraftId(result.id);

            return { success: true, message: 'Draft saved successfully' };
        } catch (error) {
            console.error('Failed to save draft', error);
            return { success: false, message: 'Could not save draft. Please try again.' };
        }
    }, [formData, currentStep, selectedCustomerName, loadedDraftId]);

    const loadDraft = useCallback(
        (draftId: string) => {
            const draft = drafts.find((item) => item.id === draftId);
            if (!draft) return { success: false, message: 'Draft not found' };

            if (onLoadDraft) {
                onLoadDraft(draft.formData, draft.currentStep || 1);
            }

            setLoadedDraftId(draftId);
            setIsDraftModalOpen(false);
            return { success: true, message: `Draft "${draft.name}" loaded` };
        },
        [drafts, onLoadDraft]
    );

    const deleteDraft = useCallback(async (draftId: string) => {
        try {
            await loanService.deleteDraft(draftId);
            const updated = drafts.filter((item) => item.id !== draftId);
            setDrafts(updated);
            if (loadedDraftId === draftId) {
                setLoadedDraftId(null);
            }
            return { success: true, message: 'Draft deleted' };
        } catch (error) {
            console.error('Failed to delete draft', error);
            return { success: false, message: 'Could not delete draft.' };
        }
    }, [drafts, loadedDraftId]);

    return {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
        loadedDraftId,
        setLoadedDraftId,
        saveDraft,
        loadDraft,
        deleteDraft,
        isLoadingDrafts,
    };
};
