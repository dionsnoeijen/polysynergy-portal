import React, { memo, useMemo } from 'react';
import { 
    DocumentIcon, 
    PhotoIcon, 
    VideoCameraIcon, 
    SpeakerWaveIcon, 
    ArchiveBoxIcon,
    CodeBracketIcon,
    FolderIcon
} from '@heroicons/react/24/outline';
import { FileInfo, DirectoryInfo } from '@/api/fileManagerApi';

type FileGridProps = {
    files: FileInfo[];
    directories: DirectoryInfo[];
    selectedFiles: string[];
    selectedDirectories: string[];
    onFileSelect: (path: string, multiSelect?: boolean) => void;
    onDirectorySelect: (path: string, multiSelect?: boolean) => void;
    onFileDoubleClick: (file: FileInfo) => void;
    onDirectoryDoubleClick: (directory: DirectoryInfo) => void;
    onContextMenu: (e: React.MouseEvent, item: FileInfo | DirectoryInfo) => void;
};

const getFileIcon = (contentType: string, fileName: string) => {
    if (contentType.startsWith('image/')) {
        return <PhotoIcon className="w-8 h-8 text-green-500" />;
    }
    if (contentType.startsWith('video/')) {
        return <VideoCameraIcon className="w-8 h-8 text-red-500" />;
    }
    if (contentType.startsWith('audio/')) {
        return <SpeakerWaveIcon className="w-8 h-8 text-purple-500" />;
    }
    if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('archive')) {
        return <ArchiveBoxIcon className="w-8 h-8 text-orange-500" />;
    }
    
    // Check by file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
        return <CodeBracketIcon className="w-8 h-8 text-blue-500" />;
    }
    
    return <DocumentIcon className="w-8 h-8 text-zinc-500" />;
};

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
    onSelect: (path: string, multiSelect?: boolean) => void;
    onDoubleClick: (item: FileInfo | DirectoryInfo) => void;
    onContextMenu: (e: React.MouseEvent, item: FileInfo | DirectoryInfo) => void;
};

const GridItem: React.FC<GridItemProps> = memo(({
    item,
    isSelected,
    onSelect,
    onDoubleClick,
    onContextMenu
}) => {
    const handleClick = (e: React.MouseEvent) => {
        const isMultiSelect = e.ctrlKey || e.metaKey;
        onSelect(item.path, isMultiSelect);
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

    return (
        <div
            className={`
                group relative p-3 rounded-lg cursor-pointer transition-all duration-150
                border border-transparent
                ${isSelected 
                    ? 'bg-sky-500/20 border-sky-500/50 dark:bg-sky-500/20 dark:border-sky-400/50' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600'
                }
            `}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
        >
            <div className="flex flex-col items-center space-y-2">
                {/* Icon */}
                <div className="flex items-center justify-center">
                    {isDirectory ? (
                        <FolderIcon className="w-10 h-10 text-sky-600 dark:text-sky-400" />
                    ) : (
                        <div className="relative">
                            {getFileIcon(fileInfo.content_type, fileInfo.name)}
                            {/* Image preview for images */}
                            {fileInfo.content_type.startsWith('image/') && fileInfo.url && (
                                <div className="absolute inset-0 rounded overflow-hidden">
                                    <img
                                        src={fileInfo.url}
                                        alt={fileInfo.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            // Hide image on error, show default icon
                                            const target = e.target as HTMLElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* File name */}
                <div className="text-center w-full">
                    <p 
                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate"
                        title={item.name}
                    >
                        {item.name}
                    </p>
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
            
            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                </div>
            )}
        </div>
    );
});

GridItem.displayName = 'GridItem';

const FileGrid: React.FC<FileGridProps> = ({
    files,
    directories,
    selectedFiles,
    selectedDirectories,
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

                return (
                    <GridItem
                        key={item.path}
                        item={item}
                        isSelected={isSelected}
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