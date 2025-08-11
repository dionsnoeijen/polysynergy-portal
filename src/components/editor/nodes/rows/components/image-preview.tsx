import React, { useState, useCallback, useEffect } from 'react';
import { createFileManagerApi } from '@/api/fileManagerApi';
import useEditorStore from '@/stores/editorStore';

type Logic = {
    getImageData: () => string | null;
    isValidImage: () => boolean;
    getImageMetadata: () => {
        width?: number;
        height?: number;
        format: string;
        size?: number;
    };
};

type Props = {
    logic: Logic;
};

const ImagePreview: React.FC<Props> = ({ logic }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { activeProjectId } = useEditorStore();
    const projectId = activeProjectId;
    
    const { getImageData, isValidImage, getImageMetadata } = logic;
    
    const originalImageData = getImageData();
    const imageData = refreshedUrl || originalImageData;
    const hasValidImage = isValidImage();
    const metadata = getImageMetadata();

    // Extract S3 path from URL
    const extractS3Path = useCallback((url: string): string | null => {
        try {
            // Parse URL to get the path
            const urlObj = new URL(url);
            const pathMatch = urlObj.pathname.match(/^\/([^?]+)/);
            if (pathMatch) {
                return decodeURIComponent(pathMatch[1]);
            }
        } catch (e) {
            console.error('Failed to parse URL:', e);
        }
        return null;
    }, []);

    // Refresh expired URL
    const refreshImageUrl = useCallback(async () => {
        if (!originalImageData || !projectId || isRefreshing) return;
        
        const s3Path = extractS3Path(originalImageData);
        if (!s3Path) {
            console.error('Could not extract S3 path from URL');
            return;
        }

        setIsRefreshing(true);
        try {
            const fileApi = createFileManagerApi(projectId);
            const metadata = await fileApi.getFileMetadata(s3Path);
            
            if (metadata.url) {
                setRefreshedUrl(metadata.url);
            }
        } catch (error) {
            console.error('Failed to refresh image URL:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [originalImageData, projectId, extractS3Path, isRefreshing]);

    // Reset refreshed URL when original changes
    useEffect(() => {
        setRefreshedUrl(null);
    }, [originalImageData]);

    if (!hasValidImage || !imageData) {
        return (
            <div className="mt-2 p-4 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center text-zinc-500 dark:text-zinc-400">
                    <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span>No image data available</span>
                </div>
            </div>
        );
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="mt-2 p-4 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-3">
                {/* Image metadata */}
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-x-4">
                    {metadata.format !== 'unknown' && (
                        <span>Format: {metadata.format.toUpperCase()}</span>
                    )}
                    {metadata.width && metadata.height && (
                        <span>Size: {metadata.width} × {metadata.height}px</span>
                    )}
                    {metadata.size && (
                        <span>File size: {formatFileSize(metadata.size)}</span>
                    )}
                </div>

                {/* Image preview - full width like avatar component */}
                <div className="w-full flex justify-center items-center bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
                    {isRefreshing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    <img
                        src={imageData}
                        alt="Image preview"
                        className={`
                            cursor-pointer transition-all
                            ${isExpanded ? 'max-w-full max-h-screen w-auto object-contain' : 'max-h-48 w-auto object-contain'}
                        `}
                        crossOrigin="anonymous"
                        onClick={() => setIsExpanded(!isExpanded)}
                        onError={(e) => {
                            // If we haven't tried refreshing yet, try to refresh the URL
                            if (!refreshedUrl && !isRefreshing) {
                                refreshImageUrl();
                            } else {
                                // If refresh failed or we already tried, show error state
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }
                        }}
                    />
                    
                    {/* Error fallback */}
                    <div className="hidden flex items-center justify-center w-full h-32 bg-zinc-100 dark:bg-zinc-700 rounded border border-zinc-300 dark:border-zinc-600">
                        <div className="text-center text-zinc-500 dark:text-zinc-400">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-sm">Failed to load image</p>
                        </div>
                    </div>
                </div>

                {/* Expand/collapse hint */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Click image to {isExpanded ? 'collapse' : 'expand'}
                </div>
            </div>
        </div>
    );
};

export default ImagePreview;