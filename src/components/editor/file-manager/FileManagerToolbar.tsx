import React, { memo } from 'react';
import { 
    Squares2X2Icon,
    ListBulletIcon,
    FolderPlusIcon,
    ArrowUpTrayIcon,
    EyeIcon,
    EyeSlashIcon,
    TrashIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    PlusIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import { FileViewMode } from '@/types/types';

type FileManagerToolbarProps = {
    viewMode: FileViewMode;
    isPublicMode: boolean;
    selectedCount: number;
    selectedFileCount: number;
    showPreviewPanel: boolean;
    showAssignmentPanel?: boolean;
    canAssignFiles?: boolean;
    onViewModeChange: (mode: FileViewMode) => void;
    onPublicModeChange: (isPublic: boolean) => void;
    onPreviewToggle: (show: boolean) => void;
    onCreateFolder: () => void;
    onUpload: () => void;
    onDeleteSelected: () => void;
    onReload: () => void;
    onAssignSelectedFiles?: () => void;
    onEditMetadata?: () => void;
};

const FileManagerToolbar: React.FC<FileManagerToolbarProps> = ({
    viewMode,
    isPublicMode,
    selectedCount,
    selectedFileCount,
    showPreviewPanel,
    // showAssignmentPanel = false,
    canAssignFiles = false,
    onViewModeChange,
    onPublicModeChange,
    onPreviewToggle,
    onCreateFolder,
    onUpload,
    onDeleteSelected,
    onReload,
    onAssignSelectedFiles,
    onEditMetadata
}) => {
    return (
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            {/* Left side - Actions */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={onCreateFolder}
                    className="flex items-center space-x-1 px-2 py-1 text-sm rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Create new folder"
                >
                    <FolderPlusIcon className="w-4 h-4" />
                    <span>New Folder</span>
                </button>
                
                <button
                    onClick={onUpload}
                    className="flex items-center space-x-1 px-2 py-1 text-sm rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Upload files"
                >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    <span>Upload</span>
                </button>

                <button
                    onClick={onReload}
                    className="flex items-center space-x-1 px-2 py-1 text-sm rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Refresh files"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Refresh</span>
                </button>
                
                {selectedFileCount === 1 && onEditMetadata && (
                    <button
                        onClick={onEditMetadata}
                        className="flex items-center space-x-1 px-2 py-1 text-sm rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Edit metadata for selected file"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span>Edit Metadata</span>
                    </button>
                )}
                
                {canAssignFiles && selectedCount > 0 && onAssignSelectedFiles && (
                    <button
                        onClick={onAssignSelectedFiles}
                        className="flex items-center space-x-1 px-2 py-1 text-sm rounded hover:bg-sky-100 dark:hover:bg-sky-900/20 text-sky-600 dark:text-sky-400 transition-colors"
                        title={`Assign ${selectedCount} selected files to node`}
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Assign ({selectedCount})</span>
                    </button>
                )}
                
                {selectedCount > 0 && (
                    <button
                        onClick={onDeleteSelected}
                        className="flex items-center space-x-1 px-2 py-1 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        title={`Delete ${selectedCount} selected items`}
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete ({selectedCount})</span>
                    </button>
                )}
            </div>

            {/* Right side - View options */}
            <div className="flex items-center space-x-2">
                {/* Public/Private toggle */}
                <div className="flex items-center space-x-1">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Upload mode:</span>
                    <button
                        onClick={() => onPublicModeChange(!isPublicMode)}
                        className={`
                            flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors
                            ${isPublicMode 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                                : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                            }
                        `}
                        title={isPublicMode ? 'Files will be uploaded as public' : 'Files will be uploaded as private'}
                    >
                        {isPublicMode ? (
                            <>
                                <EyeIcon className="w-3 h-3" />
                                <span>Public</span>
                            </>
                        ) : (
                            <>
                                <EyeSlashIcon className="w-3 h-3" />
                                <span>Private</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Preview panel toggle */}
                <button
                    onClick={() => onPreviewToggle(!showPreviewPanel)}
                    className={`
                        p-1 rounded transition-colors
                        ${showPreviewPanel 
                            ? 'bg-sky-500 text-white' 
                            : 'hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-500'
                        }
                    `}
                    title={showPreviewPanel ? 'Hide preview panel' : 'Show preview panel'}
                >
                    <DocumentTextIcon className="w-4 h-4" />
                </button>

                {/* View mode toggle */}
                <div className="flex items-center border border-zinc-200 dark:border-zinc-600 rounded">
                    <button
                        onClick={() => onViewModeChange(FileViewMode.Grid)}
                        className={`
                            p-1 transition-colors
                            ${viewMode === FileViewMode.Grid 
                                ? 'bg-sky-500 text-white' 
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-500'
                            }
                        `}
                        title="Grid view"
                    >
                        <Squares2X2Icon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange(FileViewMode.List)}
                        className={`
                            p-1 transition-colors
                            ${viewMode === FileViewMode.List 
                                ? 'bg-sky-500 text-white' 
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-500'
                            }
                        `}
                        title="List view"
                    >
                        <ListBulletIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default memo(FileManagerToolbar);