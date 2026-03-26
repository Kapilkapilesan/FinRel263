import React, { useState, useEffect } from 'react';
import { getHeaders } from '@/services/api.config';
import { Loader2 } from 'lucide-react';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallbackName?: string;
    showLoader?: boolean;
}

export function SecureImage({ src, fallbackName, showLoader = false, className, ...props }: SecureImageProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const currentBlobUrl = blobUrl;

        const loadImage = async () => {
            if (!src) {
                setLoading(false);
                setError(false);
                return;
            }

            // If it's already a data URL or a full URL that doesn't need auth (external), use it directly
            if (src.startsWith('data:') || src.startsWith('blob:') || (src.startsWith('http') && !src.includes(window.location.host) && !src.includes('localhost'))) {
                setBlobUrl(src);
                setLoading(false);
                setError(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(src, {
                    headers: getHeaders()
                });

                if (!response.ok) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                if (isMounted) {
                    setBlobUrl(url);
                    setError(false);
                } else {
                    URL.revokeObjectURL(url);
                }
            } catch (err) {
                console.error('SecureImage error:', err);
                if (isMounted) {
                    setError(true);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
            if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [src]);

    if (loading && showLoader) {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            </div>
        );
    }

    const fallbackSrc = fallbackName
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&color=7F9CF5&background=EBF4FF`
        : undefined;

    if (error || !blobUrl) {
        return (
            <img
                src={fallbackSrc}
                className={className}
                {...props}
            />
        );
    }

    return (
        <img
            src={blobUrl}
            className={className}
            onError={() => setError(true)}
            {...props}
        />
    );
}
