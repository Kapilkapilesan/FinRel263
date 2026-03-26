export interface DocumentRecord {
    id: number;
    title: string;
    category: string;
    file_type: string;
    file_path: string;
    description: string | null;
    file_size: number;
    uploaded_by: number | null;
    created_at: string;
    updated_at: string;
    uploader?: {
        id: number;
        name: string;
        full_name?: string;
    };
}

export type DocumentCategory = 'Document' | 'Forms' | 'Contracts' | 'Reports' | 'Templates' | 'Legal' | 'Reference';

export interface DocumentUploadPayload {
    title: string;
    category: string;
    file_type: string;
    file: File;
    description?: string;
}
