import { useState, useEffect, useCallback } from 'react';

export interface StaffDraftItem {
    id: string;
    name: string;
    savedAt: string;
    formData: any;
    currentTab: string;
}

const STORAGE_KEYS = {
    STAFF_DRAFT_LIST: 'staffCreationDraftList',
} as const;

export const useStaffDraftManager = (
    formData: any,
    currentTab: string,
    onLoadDraft?: (data: any, tab: any) => void
) => {
    const [drafts, setDrafts] = useState<StaffDraftItem[]>([]);
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedList = localStorage.getItem(STORAGE_KEYS.STAFF_DRAFT_LIST);
        if (savedList) {
            try {
                const parsedList = JSON.parse(savedList);
                if (Array.isArray(parsedList)) {
                    setDrafts(parsedList);
                }
            } catch (error) {
                console.error('Failed to load staff draft list', error);
            }
        }
    }, []);

    const saveDraft = useCallback(() => {
        const name = formData.name || formData.nic || 'Untitled Draft';
        const newDraft: StaffDraftItem = {
            id: Date.now().toString(),
            name,
            savedAt: new Date().toISOString(),
            formData,
            currentTab,
        };

        try {
            const existing = localStorage.getItem(STORAGE_KEYS.STAFF_DRAFT_LIST);
            const parsed: StaffDraftItem[] = existing ? JSON.parse(existing) : [];
            const updated = [newDraft, ...parsed].slice(0, 10);

            localStorage.setItem(STORAGE_KEYS.STAFF_DRAFT_LIST, JSON.stringify(updated));
            setDrafts(updated);

            return { success: true, message: 'Staff draft saved successfully' };
        } catch (error) {
            console.error('Failed to save staff draft', error);
            return { success: false, message: 'Could not save draft. Please try again.' };
        }
    }, [formData, currentTab]);

    const loadDraft = useCallback(
        (draftId: string) => {
            const draft = drafts.find((item) => item.id === draftId);
            if (!draft) return { success: false, message: 'Draft not found' };

            if (onLoadDraft) {
                onLoadDraft(draft.formData, draft.currentTab);
            }

            setIsDraftModalOpen(false);
            return { success: true, message: `Draft for "${draft.name}" loaded` };
        },
        [drafts, onLoadDraft]
    );

    const deleteDraft = useCallback((draftId: string) => {
        const updated = drafts.filter((item) => item.id !== draftId);
        setDrafts(updated);
        localStorage.setItem(STORAGE_KEYS.STAFF_DRAFT_LIST, JSON.stringify(updated));
        return { success: true, message: 'Draft deleted' };
    }, [drafts]);

    return {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
        saveDraft,
        loadDraft,
        deleteDraft,
    };
};
