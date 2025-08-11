import React, { memo, useState, useCallback } from 'react';
import { createFileManagerApi } from '@/api/fileManagerApi';
import useEditorStore from '@/stores/editorStore';
import { 
    DocumentIcon, 
    PhotoIcon, 
    VideoCameraIcon, 
    SpeakerWaveIcon, 
    ArchiveBoxIcon,
    CodeBracketIcon,
    FolderIcon,
    XMarkIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { FileInfo, DirectoryInfo } from '@/api/fileManagerApi';

type FilePreviewPanelProps = {
    selectedItem: FileInfo | DirectoryInfo | null;
    onClose: () => void;
    className?: string;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getFileIcon = (contentType: string, fileName: string, size: 'small' | 'large' = 'large') => {
    const iconClass = size === 'large' ? 'w-16 h-16' : 'w-6 h-6';
    
    if (contentType.startsWith('image/')) {
        return <PhotoIcon className={`${iconClass} text-green-500`} />;
    }
    if (contentType.startsWith('video/')) {
        return <VideoCameraIcon className={`${iconClass} text-red-500`} />;
    }
    if (contentType.startsWith('audio/')) {
        return <SpeakerWaveIcon className={`${iconClass} text-purple-500`} />;
    }
    if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('archive')) {
        return <ArchiveBoxIcon className={`${iconClass} text-orange-500`} />;
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
        return <CodeBracketIcon className={`${iconClass} text-blue-500`} />;
    }
    
    return <DocumentIcon className={`${iconClass} text-zinc-500`} />;
};

const FilePreview: React.FC<{ file: FileInfo }> = memo(({ file }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { activeProjectId } = useEditorStore();
    const projectId = activeProjectId;

    // Extract S3 path from URL
    const extractS3Path = useCallback((url: string): string | null => {
        try {
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
        if (!file.url || !projectId || isRefreshing) return;
        
        const s3Path = extractS3Path(file.url);
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
                setImageError(false);
            }
        } catch (error) {
            console.error('Failed to refresh image URL:', error);
            setImageError(true);
        } finally {
            setIsRefreshing(false);
        }
    }, [file.url, projectId, extractS3Path, isRefreshing]);

    const imageUrl = refreshedUrl || file.url;

    // Image preview
    if (file.content_type.startsWith('image/') && imageUrl && !imageError) {
        return (
            <div className="relative">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 mb-4 min-h-[200px] flex items-center justify-center">
                    {(!imageLoaded || isRefreshing) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    <img
                        src={imageUrl}
                        alt={file.name}
                        className={`max-w-full max-h-[300px] object-contain rounded transition-opacity duration-200 ${
                            imageLoaded && !isRefreshing ? 'opacity-100' : 'opacity-0'
                        }`}
                        crossOrigin="anonymous"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            if (!refreshedUrl && !isRefreshing) {
                                refreshImageUrl();
                            } else {
                                setImageError(true);
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    // Video preview
    if (file.content_type.startsWith('video/') && imageUrl) {
        return (
            <div className="mb-4">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                    <video 
                        className="w-full max-h-[300px] rounded"
                        controls
                        preload="metadata"
                    >
                        <source src={imageUrl} type={file.content_type} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        );
    }

    // Audio preview
    if (file.content_type.startsWith('audio/') && imageUrl) {
        return (
            <div className="mb-4">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-4">
                        <SpeakerWaveIcon className="w-16 h-16 text-purple-500" />
                    </div>
                    <audio 
                        className="w-full"
                        controls
                        preload="metadata"
                    >
                        <source src={imageUrl} type={file.content_type} />
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            </div>
        );
    }

    // Text/Code preview (for small files)
    if (file.size < 100000 && // Less than 100KB
        (file.content_type.startsWith('text/') || 
         ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'md', 'txt'].includes(
             file.name.split('.').pop()?.toLowerCase() || ''
         ))) {
        
        if (file.url) {
            return <TextFilePreview file={file} />;
        }
    }

    // Default preview with file icon
    return (
        <div className="mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 flex items-center justify-center">
                {getFileIcon(file.content_type, file.name, 'large')}
            </div>
        </div>
    );
});

const TextFilePreview: React.FC<{ file: FileInfo }> = memo(({ file }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const loadTextContent = async () => {
        if (!file.url || loading || content) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(file.url);
            if (!response.ok) {
                throw new Error('Failed to load file content');
            }
            const text = await response.text();
            setContent(text);
            setShowPreview(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load file');
        } finally {
            setLoading(false);
        }
    };

    if (!showPreview) {
        return (
            <div className="mb-4">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6 text-center">
                    {getFileIcon(file.content_type, file.name, 'large')}
                    <button
                        onClick={loadTextContent}
                        disabled={loading}
                        className="mt-4 flex items-center gap-2 mx-auto px-3 py-2 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <EyeIcon className="w-4 h-4" />
                                Preview
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preview</span>
                    <button
                        onClick={() => setShowPreview(false)}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
                {error ? (
                    <div className="text-red-500 text-sm">{error}</div>
                ) : (
                    <pre className="text-xs text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 rounded p-3 overflow-auto max-h-[200px] whitespace-pre-wrap">
                        {content.length > 2000 ? content.substring(0, 2000) + '\n... (truncated)' : content}
                    </pre>
                )}
            </div>
        </div>
    );
});

TextFilePreview.displayName = 'TextFilePreview';
FilePreview.displayName = 'FilePreview';

const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({ 
    selectedItem, 
    onClose,
    className = "" 
}) => {
    if (!selectedItem) {
        return (
            <div className={`bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 flex items-center justify-center ${className}`}>
                <div className="text-center text-zinc-500 dark:text-zinc-400">
                    <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Select a file or folder to preview</p>
                </div>
            </div>
        );
    }

    const isDirectory = selectedItem.is_directory;
    const file = selectedItem as FileInfo;
    const directory = selectedItem as DirectoryInfo;

    return (
        <div className={`bg-white dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {isDirectory ? 'Folder Info' : 'File Preview'}
                </h3>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                {/* File/Folder Preview */}
                {!isDirectory && <FilePreview file={file} />}

                {isDirectory && (
                    <div className="mb-4">
                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 flex items-center justify-center">
                            <FolderIcon className="w-16 h-16 text-sky-600 dark:text-sky-400" />
                        </div>
                    </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Details</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">Name:</span>
                                <span className="text-sm text-zinc-900 dark:text-zinc-100 text-right break-all">
                                    {selectedItem.name}
                                </span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">Path:</span>
                                <span className="text-sm text-zinc-900 dark:text-zinc-100 text-right break-all font-mono">
                                    {selectedItem.path}
                                </span>
                            </div>
                            {!isDirectory && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Size:</span>
                                        <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">Type:</span>
                                        <span className="text-sm text-zinc-900 dark:text-zinc-100 text-right">
                                            {file.content_type}
                                        </span>
                                    </div>
                                </>
                            )}
                            {isDirectory && directory.file_count !== undefined && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Items:</span>
                                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                        {directory.file_count}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-start">
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">Modified:</span>
                                <span className="text-sm text-zinc-900 dark:text-zinc-100 text-right">
                                    {formatDate(selectedItem.last_modified)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {!isDirectory && file.url && (
                        <div>
                            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Actions</h4>
                            <div className="space-y-2">
                                <button
                                    onClick={() => window.open(file.url, '_blank')}
                                    className="w-full text-left px-3 py-2 text-sm bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors flex items-center gap-2"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                    Open in new tab
                                </button>
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = file.url!;
                                        link.download = file.name;
                                        link.click();
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm bg-zinc-500 text-white rounded-md hover:bg-zinc-600 transition-colors"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(FilePreviewPanel);