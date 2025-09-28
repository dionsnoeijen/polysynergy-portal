import React, { memo, useState, useCallback, useMemo } from 'react';
import { createFileManagerApi } from '@/api/fileManagerApi';
import useEditorStore from '@/stores/editorStore';
import { 
    FolderIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { FileInfo, DirectoryInfo } from '@/api/fileManagerApi';
import { FileIconWithBadge } from '@/utils/fileIcons';
import { FileNameGridView } from '@/utils/fileNameUtils';

type FileGridProps = {
    files: FileInfo[];
    directories: DirectoryInfo[];
    selectedFiles: string[];
    selectedDirectories: string[];
    assignedFiles?: string[];
    onFileSelect: (path: string, multiSelect?: boolean, rangeSelect?: boolean) => void;
    onDirectorySelect: (path: string, multiSelect?: boolean, rangeSelect?: boolean) => void;
    onFileDoubleClick: (file: FileInfo) => void;
    onDirectoryDoubleClick: (directory: DirectoryInfo) => void;
    onContextMenu: (e: React.MouseEvent, item: FileInfo | DirectoryInfo) => void;
};

// Removed - using FileIconWithBadge from utils

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};


type GridItemProps = {
    item: FileInfo | DirectoryInfo;
    isSelected: boolean;
    isAssigned?: boolean;
    onSelect: (path: string, multiSelect?: boolean, rangeSelect?: boolean) => void;
    onDoubleClick: (item: FileInfo | DirectoryInfo) => void;
    onContextMenu: (e: React.MouseEvent, item: FileInfo | DirectoryInfo) => void;
};

const GridItem: React.FC<GridItemProps> = memo(({
    item,
    isSelected,
    isAssigned = false,
    onSelect,
    onDoubleClick,
    onContextMenu
}) => {
    const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { activeProjectId } = useEditorStore();
    const projectId = activeProjectId;
    const handleClick = (e: React.MouseEvent) => {
        const isMultiSelect = e.ctrlKey || e.metaKey;
        const isRangeSelect = e.shiftKey;
        onSelect(item.path, isMultiSelect, isRangeSelect);
    };

    const handleDoubleClick = () => {
        onDoubleClick(item);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu(e, item);
    };

    const isDirectory = item.is_directory;
    const fileInfo = item as FileInfo;
    
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
        if (isDirectory || !('url' in fileInfo) || !fileInfo.url || !projectId || isRefreshing) return;
        
        const s3Path = extractS3Path(fileInfo.url);
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
    }, [('url' in fileInfo) ? fileInfo.url : null, projectId, extractS3Path, isRefreshing, isDirectory]);
    
    const imageUrl = refreshedUrl || (('url' in fileInfo) ? fileInfo.url : null);

    return (
        <div
            className={`
                group relative p-3 rounded-lg cursor-pointer transition-all duration-150
                border border-transparent
                ${isSelected 
                    ? 'bg-sky-500/20 border-sky-500/50 dark:bg-sky-500/20 dark:border-sky-400/50' 
                    : isAssigned
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/20'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600'
                }
            `}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            draggable={!isDirectory}
            onDragStart={(e) => {
                if (!isDirectory) {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                        filePaths: [item.path],
                        fileUrls: [(('url' in item) ? item.url : null) || item.path] // Include URL for full file access
                    }));
                }
            }}
        >
            <div className="flex flex-col items-center space-y-2">
                {/* Icon */}
                <div className="flex items-center justify-center">
                    {isDirectory ? (
                        <FolderIcon className="w-10 h-10 text-sky-600 dark:text-sky-400" />
                    ) : (
                        <div className="relative">
                            <FileIconWithBadge 
                                contentType={fileInfo.content_type} 
                                fileName={fileInfo.name} 
                                size="lg"
                            />
                            {/* Image preview for images */}
                            {fileInfo.content_type.startsWith('image/') && imageUrl && !imageError && (
                                <div className="absolute inset-0 rounded overflow-hidden">
                                    {isRefreshing && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-sky-50/20 dark:bg-black/20 z-10">
                                            <div className="w-4 h-4 border-2 border-sky-600 dark:border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    <img
                                        src={imageUrl}
                                        alt={fileInfo.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            if (!refreshedUrl && !isRefreshing) {
                                                refreshImageUrl();
                                            } else {
                                                // Hide image on error, show default icon
                                                const target = e.target as HTMLElement;
                                                target.style.display = 'none';
                                                setImageError(true);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {/* Assignment indicator */}
                    {isAssigned && !isDirectory && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                </div>
                
                {/* File name */}
                <div className="text-center w-full">
                    {isDirectory ? (
                        <p 
                            className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate"
                            title={item.name}
                        >
                            {item.name}
                        </p>
                    ) : (
                        <FileNameGridView 
                            fileName={item.name}
                            className="text-sm font-medium"
                        />
                    )}
                    {!isDirectory && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {formatFileSize(fileInfo.size)}
                        </p>
                    )}
                    {isDirectory && 'file_count' in item && item.file_count !== undefined && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {item.file_count} items
                        </p>
                    )}
                </div>
            </div>
            
        </div>
    );
});

GridItem.displayName = 'GridItem';

const FileGrid: React.FC<FileGridProps> = ({
    files,
    directories,
    selectedFiles,
    selectedDirectories,
    assignedFiles = [],
    onFileSelect,
    onDirectorySelect,
    onFileDoubleClick,
    onDirectoryDoubleClick,
    onContextMenu
}) => {
    // Combine and sort items
    const allItems = useMemo(() => {
        const items: Array<{
            item: FileInfo | DirectoryInfo;
            isDirectory: boolean;
            sortKey: string;
        }> = [
            ...directories.map(dir => ({
                item: dir,
                isDirectory: true,
                sortKey: `0_${dir.name.toLowerCase()}`
            })),
            ...files.map(file => ({
                item: file,
                isDirectory: false,
                sortKey: `1_${file.name.toLowerCase()}`
            }))
        ];
        
        return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [files, directories]);

    if (allItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center text-zinc-500 dark:text-zinc-400">
                    <FolderIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">This folder is empty</p>
                    <p className="text-sm mt-2">Upload files or create new folders to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-4">
            {allItems.map(({ item, isDirectory }) => {
                const isSelected = isDirectory
                    ? selectedDirectories.includes(item.path)
                    : selectedFiles.includes(item.path);
                const isAssigned = !isDirectory && assignedFiles.includes(item.path);

                return (
                    <GridItem
                        key={item.path}
                        item={item}
                        isSelected={isSelected}
                        isAssigned={isAssigned}
                        onSelect={isDirectory ? onDirectorySelect : onFileSelect}
                        onDoubleClick={(item) => {
                            if (isDirectory) {
                                onDirectoryDoubleClick(item as DirectoryInfo);
                            } else {
                                onFileDoubleClick(item as FileInfo);
                            }
                        }}
                        onContextMenu={onContextMenu}
                    />
                );
            })}
        </div>
    );
};

export default memo(FileGrid);