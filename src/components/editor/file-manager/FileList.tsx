import React, { memo, useMemo } from 'react';
import { 
    DocumentIcon, 
    PhotoIcon, 
    VideoCameraIcon, 
    SpeakerWaveIcon, 
    ArchiveBoxIcon,
    CodeBracketIcon,
    FolderIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { FileInfo, DirectoryInfo } from '@/api/fileManagerApi';
import { FileSortBy, FileSortOrder } from '@/types/types';

type FileListProps = {
    files: FileInfo[];
    directories: DirectoryInfo[];
    selectedFiles: string[];
    selectedDirectories: string[];
    assignedFiles?: string[];
    sortBy: FileSortBy;
    sortOrder: FileSortOrder;
    onFileSelect: (path: string, multiSelect?: boolean) => void;
    onDirectorySelect: (path: string, multiSelect?: boolean) => void;
    onFileDoubleClick: (file: FileInfo) => void;
    onDirectoryDoubleClick: (directory: DirectoryInfo) => void;
    onContextMenu: (e: React.MouseEvent, item: FileInfo | DirectoryInfo) => void;
    onSort: (sortBy: FileSortBy) => void;
};

const getFileIcon = (contentType: string, fileName: string) => {
    if (contentType.startsWith('image/')) {
        return <PhotoIcon className="w-5 h-5 text-green-500" />;
    }
    if (contentType.startsWith('video/')) {
        return <VideoCameraIcon className="w-5 h-5 text-red-500" />;
    }
    if (contentType.startsWith('audio/')) {
        return <SpeakerWaveIcon className="w-5 h-5 text-purple-500" />;
    }
    if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('archive')) {
        return <ArchiveBoxIcon className="w-5 h-5 text-orange-500" />;
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
        return <CodeBracketIcon className="w-5 h-5 text-blue-500" />;
    }
    
    return <DocumentIcon className="w-5 h-5 text-zinc-500" />;
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type SortHeaderProps = {
    label: string;
    sortKey: FileSortBy;
    currentSort: FileSortBy;
    currentOrder: FileSortOrder;
    onSort: (sortBy: FileSortBy) => void;
};

const SortHeader: React.FC<SortHeaderProps> = memo(({
    label,
    sortKey,
    currentSort,
    currentOrder,
    onSort
}) => {
    const isActive = currentSort === sortKey;
    
    return (
        <button
            className="flex items-center space-x-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            onClick={() => onSort(sortKey)}
        >
            <span>{label}</span>
            {isActive && (
                currentOrder === FileSortOrder.Asc ? (
                    <ChevronUpIcon className="w-3 h-3" />
                ) : (
                    <ChevronDownIcon className="w-3 h-3" />
                )
            )}
        </button>
    );
});

SortHeader.displayName = 'SortHeader';

type ListRowProps = {
    item: FileInfo | DirectoryInfo;
    isSelected: boolean;
    isAssigned?: boolean;
    onSelect: (path: string, multiSelect?: boolean) => void;
    onDoubleClick: (item: FileInfo | DirectoryInfo) => void;
    onContextMenu: (e: React.MouseEvent, item: FileInfo | DirectoryInfo) => void;
};

const ListRow: React.FC<ListRowProps> = memo(({
    item,
    isSelected,
    isAssigned = false,
    onSelect,
    onDoubleClick,
    onContextMenu
}) => {
    const handleClick = (e: React.MouseEvent) => {
        const multiSelect = e.ctrlKey || e.metaKey;
        onSelect(item.path, multiSelect);
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
                grid grid-cols-12 gap-4 px-4 py-2 cursor-pointer transition-colors duration-150 border-l-2
                ${isSelected 
                    ? 'bg-sky-500/20 border-sky-500 dark:bg-sky-500/20' 
                    : isAssigned
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/20'
                    : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }
            `}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
        >
            {/* Icon and Name */}
            <div className="col-span-6 flex items-center space-x-3 min-w-0">
                {isDirectory ? (
                    <FolderIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                ) : (
                    getFileIcon(fileInfo.content_type, fileInfo.name)
                )}
                <span 
                    className="truncate text-sm text-zinc-900 dark:text-zinc-100"
                    title={item.name}
                >
                    {item.name}
                </span>
                {isAssigned && !isDirectory && (
                    <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-2 h-2 text-white" />
                    </div>
                )}
            </div>
            
            {/* Size */}
            <div className="col-span-2 flex items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {isDirectory ? (
                        'file_count' in item && item.file_count !== undefined 
                            ? `${item.file_count} items`
                            : '-'
                    ) : (
                        formatFileSize(fileInfo.size)
                    )}
                </span>
            </div>
            
            {/* Type */}
            <div className="col-span-2 flex items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {isDirectory ? 'Folder' : (
                        fileInfo.content_type.split('/')[0] || 'File'
                    )}
                </span>
            </div>
            
            {/* Modified Date */}
            <div className="col-span-2 flex items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(item.last_modified)}
                </span>
            </div>
        </div>
    );
});

ListRow.displayName = 'ListRow';

const FileList: React.FC<FileListProps> = ({
    files,
    directories,
    selectedFiles,
    selectedDirectories,
    assignedFiles = [],
    sortBy,
    sortOrder,
    onFileSelect,
    onDirectorySelect,
    onFileDoubleClick,
    onDirectoryDoubleClick,
    onContextMenu,
    onSort
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
        <div className="flex-1 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <div className="col-span-6">
                    <SortHeader
                        label="Name"
                        sortKey={FileSortBy.Name}
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={onSort}
                    />
                </div>
                <div className="col-span-2">
                    <SortHeader
                        label="Size"
                        sortKey={FileSortBy.Size}
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={onSort}
                    />
                </div>
                <div className="col-span-2">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Type</span>
                </div>
                <div className="col-span-2">
                    <SortHeader
                        label="Modified"
                        sortKey={FileSortBy.Modified}
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={onSort}
                    />
                </div>
            </div>
            
            {/* File list */}
            <div className="overflow-y-auto">
                {allItems.map(({ item, isDirectory }) => {
                    const isSelected = isDirectory
                        ? selectedDirectories.includes(item.path)
                        : selectedFiles.includes(item.path);
                    const isAssigned = !isDirectory && assignedFiles.includes(item.path);

                    return (
                        <ListRow
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
        </div>
    );
};

export default memo(FileList);