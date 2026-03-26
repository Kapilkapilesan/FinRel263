import { DocumentScreen } from '@/components/documents/DocumentScreen';

export const metadata = {
    title: 'Documents | BMS',
    description: 'Document Management System',
};

export default function DocumentsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <DocumentScreen />
        </div>
    );
}
