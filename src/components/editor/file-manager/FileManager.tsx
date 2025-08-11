import React, { memo, useCallback, useState } from 'react';
import { 
    FolderPlusIcon, 
    TrashIcon, 
    PencilIcon,
    DocumentPlusIcon,
    ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

import { useFileManager } from '@/hooks/useFileManager';
import { FileViewMode, ContextMenuItem } from '@/types/types';
import { FileInfo, DirectoryInfo } from '@/api/fileManagerApi';

import Breadcrumb from './Breadcrumb';
import FileGrid from './FileGrid';
import FileList from './FileList';
import ContextMenu from './ContextMenu';
import FileManagerToolbar from './FileManagerToolbar';
import FilePreviewPanel from './FilePreviewPanel';
import CreateFolderModal from './CreateFolderModal';
import FileAssignmentPanel from './FileAssignmentPanel';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';

type FileManagerProps = {
    className?: string;
};

const FileManager: React.FC<FileManagerProps> = ({ className = "" }) => {
    const [showPreviewPanel, setShowPreviewPanel] = useState(false);
    const [selectedPreviewItem, setSelectedPreviewItem] = useState<FileInfo | DirectoryInfo | null>(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    
    // Editor store integration for file_selection nodes
    const selectedNodes = useEditorStore(state => state.selectedNodes);
    const getNode = useNodesStore(state => state.getNode);
    const updateNodeVariable = useNodesStore(state => state.updateNodeVariable);
    // Get the nodes array to detect any changes
    const nodes = useNodesStore(state => state.nodes);
    
    // Check if a file_selection node is selected
    const selectedFileSelectionNode = React.useMemo(() => {
        const selectedNode = selectedNodes.length === 1 ? getNode(selectedNodes[0]) : null;
        return selectedNode?.path === 'polysynergy_nodes.file.file_selection.FileSelection' ? selectedNode : null;
    }, [selectedNodes, getNode, nodes]);

    // Get assigned files for visual indication - will update when nodes array changes
    const assignedFiles = React.useMemo(() => {
        if (!selectedFileSelectionNode) return [];
        const selectedFilesVar = selectedFileSelectionNode.variables.find(v => v.handle === 'selected_files');
        return Array.isArray(selectedFilesVar?.value) ? selectedFilesVar.value as string[] : [];
    }, [selectedFileSelectionNode, nodes]);
    
    // Show assignment panel when file_selection node is selected
    const showAssignmentPanel = !!selectedFileSelectionNode;

    const {
        state,
        directoryContents,
        loading,
        error,
        navigateToDirectory,
        selectFile,
        selectDirectory,
        clearSelection,
        deleteFile,
        deleteSelectedFiles,
        createDirectory,
        moveFile,
        uploadFiles,
        setViewMode,
        setPublicMode,
        setSorting,
        showContextMenu,
        hideContextMenu,
        setDragOver,
        refresh
    } = useFileManager();


    // File input ref for upload
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // File and directory operations
    const handleFileDoubleClick = useCallback((file: FileInfo) => {
        if (file.url) {
            window.open(file.url, '_blank');
        }
    }, []);

    const handleDirectoryDoubleClick = useCallback(async (directory: DirectoryInfo) => {
        await navigateToDirectory(directory.path);
    }, [navigateToDirectory]);


    // Create folder handler
    const handleCreateFolder = useCallback(() => {
        setShowCreateFolderModal(true);
    }, []);

    const handleCreateFolderSubmit = useCallback(async (folderName: string) => {
        await createDirectory(folderName);
    }, [createDirectory]);

    // Handle assigning selected files to the file_selection node
    const handleAssignSelectedFiles = useCallback(() => {
        if (!selectedFileSelectionNode || state.selectedFiles.length === 0) return;
        
        // Get fresh data from the store to avoid stale closure
        const currentNode = getNode(selectedFileSelectionNode.id);
        if (!currentNode) return;
        
        const selectedFilesVar = currentNode.variables.find(v => v.handle === 'selected_files');
        const currentFiles = Array.isArray(selectedFilesVar?.value) ? selectedFilesVar.value as string[] : [];
        
        // Add new files to existing ones (avoid duplicates)
        const uniqueFiles = [...new Set([...currentFiles, ...state.selectedFiles])];
        
        updateNodeVariable(selectedFileSelectionNode.id, 'selected_files', uniqueFiles);
        
        // Clear file selection after assignment
        clearSelection();
    }, [selectedFileSelectionNode?.id, state.selectedFiles, getNode, updateNodeVariable, clearSelection]);

    // Upload handler
    const handleUpload = useCallback((files: File[]) => {
        uploadFiles(files, state.currentPath || undefined);
    }, [uploadFiles, state.currentPath]);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleUpload(files);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [handleUpload]);

    // Context menu for file/directory items
    const handleItemContextMenu = useCallback((e: React.MouseEvent, item: FileInfo | DirectoryInfo) => {
        e.preventDefault();
        
        const isDirectory = item.is_directory;
        const items: ContextMenuItem[] = [
            {
                label: 'Open',
                icon: <DocumentPlusIcon className="w-4 h-4" />,
                action: () => {
                    if (isDirectory) {
                        navigateToDirectory(item.path);
                    } else {
                        handleFileDoubleClick(item as FileInfo);
                    }
                }
            },
            { divider: true },
            {
                label: 'Rename',
                icon: <PencilIcon className="w-4 h-4" />,
                action: () => {
                    const newName = prompt(`Rename ${isDirectory ? 'folder' : 'file'}:`, item.name);
                    if (newName && newName !== item.name) {
                        const newPath = item.path.split('/').slice(0, -1).concat(newName).join('/');
                        moveFile(item.path, newPath);
                    }
                }
            },
            {
                label: 'Delete',
                icon: <TrashIcon className="w-4 h-4" />,
                action: () => {
                    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                        deleteFile(item.path, isDirectory);
                    }
                }
            }
        ];

        showContextMenu(e.clientX, e.clientY, items);
    }, [navigateToDirectory, handleFileDoubleClick, moveFile, deleteFile, showContextMenu]);

    // Context menu for empty area
    const handleEmptyAreaContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        
        const items: ContextMenuItem[] = [
            {
                label: 'New Folder',
                icon: <FolderPlusIcon className="w-4 h-4" />,
                action: handleCreateFolder
            },
            {
                label: 'Upload Files',
                icon: <ArrowUpTrayIcon className="w-4 h-4" />,
                action: handleUploadClick
            },
            { divider: true },
            {
                label: 'Refresh',
                icon: <DocumentPlusIcon className="w-4 h-4" />,
                action: refresh
            }
        ];

        showContextMenu(e.clientX, e.clientY, items);
    }, [
        handleCreateFolder,
        handleUploadClick,
        refresh,
        showContextMenu
    ]);

    // Handle drag and drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleUpload(files);
        }
    }, [handleUpload, setDragOver]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, [setDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, [setDragOver]);

    // Handle click on empty space to deselect
    const handleEmptyClick = useCallback((e: React.MouseEvent) => {
        // Only clear if clicking directly on the container
        if (e.target === e.currentTarget) {
            clearSelection();
            setSelectedPreviewItem(null);
        }
    }, [clearSelection]);

    // Standard file browser selection behavior
    const handleFileSelect = useCallback((path: string, isMultiSelect?: boolean, isRangeSelect?: boolean) => {
        if (isRangeSelect) {
            // Shift + click: range selection
            selectFile(path, false, true);
            // Don't change preview for range-select
        } else if (isMultiSelect) {
            // Ctrl/Cmd + click: toggle selection
            selectFile(path, true);
            // Don't change preview for multi-select
        } else {
            // Single click: select only this file (clear others)
            clearSelection();
            selectFile(path, false);
            
            // Update preview panel
            const selectedFile = directoryContents.files.find(f => f.path === path);
            if (selectedFile) {
                setSelectedPreviewItem(selectedFile);
                if (!showPreviewPanel) {
                    setShowPreviewPanel(true);
                }
            }
        }
    }, [selectFile, clearSelection, directoryContents.files, showPreviewPanel]);

    const handleDirectorySelect = useCallback((path: string, isMultiSelect?: boolean, isRangeSelect?: boolean) => {
        if (isRangeSelect) {
            // Shift + click: range selection (for now, just select single directory)
            selectDirectory(path, true);
            // Don't change preview for range-select
        } else if (isMultiSelect) {
            // Ctrl/Cmd + click: toggle selection
            selectDirectory(path, true);
            // Don't change preview for multi-select
        } else {
            // Single click: select only this directory (clear others)
            clearSelection();
            selectDirectory(path, false);
            
            // Update preview panel
            const selectedDir = directoryContents.directories.find(d => d.path === path);
            if (selectedDir) {
                setSelectedPreviewItem(selectedDir);
                if (!showPreviewPanel) {
                    setShowPreviewPanel(true);
                }
            }
        }
    }, [selectDirectory, clearSelection, directoryContents.directories, showPreviewPanel]);

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-zinc-800 ${className}`}>
            {/* Hidden file input for uploads */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
            />

            {/* Header with Breadcrumbs */}
            <div className="border-b border-zinc-200 dark:border-zinc-700">
                <Breadcrumb
                    currentPath={state.currentPath}
                    onNavigate={navigateToDirectory}
                />
            </div>

            {/* Toolbar */}
            <FileManagerToolbar
                viewMode={state.viewMode}
                isPublicMode={state.isPublicMode}
                selectedCount={state.selectedFiles.length + state.selectedDirectories.length}
                showPreviewPanel={showPreviewPanel}
                showAssignmentPanel={showAssignmentPanel}
                canAssignFiles={showAssignmentPanel && state.selectedFiles.length > 0}
                onViewModeChange={setViewMode}
                onPublicModeChange={setPublicMode}
                onPreviewToggle={setShowPreviewPanel}
                onCreateFolder={handleCreateFolder}
                onUpload={handleUploadClick}
                onReload={refresh}
                onAssignSelectedFiles={handleAssignSelectedFiles}
                onDeleteSelected={() => {
                    const selectedCount = state.selectedFiles.length + state.selectedDirectories.length;
                    if (selectedCount > 0) {
                        if (confirm(`Are you sure you want to delete ${selectedCount} selected item(s)?`)) {
                            deleteSelectedFiles();
                        }
                    }
                }}
            />

            {/* Content Area with Preview Panel */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main File Browser */}
                <div 
                    className={`${showAssignmentPanel || showPreviewPanel ? 'flex-1' : 'w-full'} overflow-hidden relative transition-none`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleEmptyClick}
                    onContextMenu={handleEmptyAreaContextMenu}
                >
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <div className="relative h-full overflow-y-auto">
                    {/* Show loading overlay when loading instead of replacing content */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading files...</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Always show content, even when loading (prevents flashing) */}
                    <div className={`h-full ${loading ? 'pointer-events-none' : ''}`}>
                        {state.viewMode === FileViewMode.Grid ? (
                            <FileGrid
                                files={directoryContents.files}
                                directories={directoryContents.directories}
                                selectedFiles={state.selectedFiles}
                                selectedDirectories={state.selectedDirectories}
                                assignedFiles={assignedFiles}
                                onFileSelect={handleFileSelect}
                                onDirectorySelect={handleDirectorySelect}
                                onFileDoubleClick={handleFileDoubleClick}
                                onDirectoryDoubleClick={handleDirectoryDoubleClick}
                                onContextMenu={handleItemContextMenu}
                            />
                        ) : (
                            <FileList
                                files={directoryContents.files}
                                directories={directoryContents.directories}
                                selectedFiles={state.selectedFiles}
                                selectedDirectories={state.selectedDirectories}
                                assignedFiles={assignedFiles}
                                sortBy={state.sortBy}
                                sortOrder={state.sortOrder}
                                onFileSelect={handleFileSelect}
                                onDirectorySelect={handleDirectorySelect}
                                onFileDoubleClick={handleFileDoubleClick}
                                onDirectoryDoubleClick={handleDirectoryDoubleClick}
                                onContextMenu={handleItemContextMenu}
                                onSort={setSorting}
                            />
                        )}
                    </div>
                    </div>

                    {/* Drag overlay */}
                    {state.dragOver && (
                        <div className="absolute inset-0 bg-sky-500/20 border-2 border-dashed border-sky-400 flex items-center justify-center z-10">
                            <div className="text-center">
                                <DocumentPlusIcon className="w-12 h-12 text-sky-500 mx-auto mb-2" />
                                <p className="text-lg font-medium text-sky-700 dark:text-sky-300">
                                    Drop files here to upload
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Panel or Assignment Panel */}
                {showAssignmentPanel ? (
                    <FileAssignmentPanel
                        onClose={() => {}}
                        className="w-80 flex-shrink-0"
                        onAssignSelectedFiles={handleAssignSelectedFiles}
                    />
                ) : showPreviewPanel ? (
                    <FilePreviewPanel
                        selectedItem={selectedPreviewItem}
                        onClose={() => setShowPreviewPanel(false)}
                        className="w-80 flex-shrink-0"
                    />
                ) : null}
            </div>

            {/* Context Menu */}
            <ContextMenu
                visible={state.contextMenuVisible}
                position={state.contextMenuPosition}
                items={state.contextMenuItems}
                onClose={hideContextMenu}
            />

            {/* Create Folder Modal */}
            <CreateFolderModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                onCreateFolder={handleCreateFolderSubmit}
                currentPath={state.currentPath}
            />
        </div>
    );
};

export default memo(FileManager);