import React, { memo, useCallback, useState } from 'react';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';

type FileAssignmentPanelProps = {
    onClose: () => void;
    className?: string;
    onDragOver?: () => void;
    onDragLeave?: () => void;
    onDrop?: (filePaths: string[]) => void;
    onAssignSelectedFiles?: () => void;
};

const FileAssignmentPanel: React.FC<FileAssignmentPanelProps> = ({ 
    onClose, 
    className = "",
    onDragOver,
    onDragLeave,
    onDrop,
    onAssignSelectedFiles
}) => {
    const selectedNodes = useEditorStore(state => state.selectedNodes);
    const getNode = useNodesStore(state => state.getNode);
    const updateNodeVariable = useNodesStore(state => state.updateNodeVariable);
    // Get the nodes array to detect any changes
    const nodes = useNodesStore(state => state.nodes);
    
    const [isDragOver, setIsDragOver] = useState(false);
    
    // Get the first selected file_selection node
    const fileSelectionNode = React.useMemo(() => {
        const selectedNode = selectedNodes.length === 1 ? getNode(selectedNodes[0]) : null;
        return selectedNode?.path === 'polysynergy_nodes.file.file_selection.FileSelection' ? selectedNode : null;
    }, [selectedNodes, getNode, nodes]);

    // Get assigned files - will update when nodes array changes
    const assignedFiles = React.useMemo(() => {
        if (!fileSelectionNode) return [];
        const selectedFilesVar = fileSelectionNode.variables.find(v => v.handle === 'selected_files');
        return Array.isArray(selectedFilesVar?.value) ? selectedFilesVar.value as string[] : [];
    }, [fileSelectionNode, nodes]);

    const handleRemoveFile = useCallback((filePath: string) => {
        if (!fileSelectionNode) return;
        
        const newFiles = assignedFiles.filter(path => path !== filePath);
        updateNodeVariable(fileSelectionNode.id, 'selected_files', newFiles);
    }, [fileSelectionNode?.id, assignedFiles, updateNodeVariable]);

    // This function is handled by the parent FileManager component

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver?.();
    }, [onDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        onDragLeave?.();
    }, [onDragLeave]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        // Extract file paths from drag data - use paths (S3 keys) not URLs
        try {
            const dragData = e.dataTransfer.getData('application/json');
            const { filePaths } = JSON.parse(dragData);
            if (Array.isArray(filePaths) && filePaths.length > 0) {
                onDrop?.(filePaths);
                
                // Assign file paths (S3 keys) to the node, not URLs
                if (fileSelectionNode) {
                    const uniqueFiles = [...new Set([...assignedFiles, ...filePaths])];
                    updateNodeVariable(fileSelectionNode.id, 'selected_files', uniqueFiles);
                }
            }
        } catch (error) {
            console.warn('Failed to parse drop data:', error);
        }
    }, [onDrop, fileSelectionNode?.id, assignedFiles, updateNodeVariable]);

    // Don't render if no file_selection node is selected
    if (!fileSelectionNode) {
        return null;
    }

    return (
        <div className={`bg-white dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Files for: {fileSelectionNode.handle || 'File Selection'}
                </h3>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                    ×
                </button>
            </div>

            {/* Assignment List */}
            <div 
                className={isDragOver 
                    ? 'flex-1 p-4 overflow-y-auto transition-colors bg-sky-50 dark:bg-sky-900/20 border-2 border-dashed border-sky-400'
                    : 'flex-1 p-4 overflow-y-auto transition-colors'
                }
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="divide-y divide-zinc-200 dark:divide-zinc-600">
                    {assignedFiles.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <PlusIcon className="w-6 h-6" />
                            </div>
                            <p className="text-sm">No files assigned</p>
                            <p className="text-xs mt-1">Select files and click &quot;Assign Selected&quot; or drag files here</p>
                        </div>
                    ) : (
                        assignedFiles.map((filePathOrUrl, index) => {
                            // Extract filename from S3 key/path or legacy URL for display
                            const getDisplayName = (pathOrUrl: string) => {
                                try {
                                    // If it's a legacy URL, extract the path part and get the filename
                                    if (pathOrUrl.startsWith('http')) {
                                        const url = new URL(pathOrUrl);
                                        // Remove query parameters and extract filename from path
                                        return url.pathname.split('/').pop() || pathOrUrl;
                                    }
                                    // If it's an S3 key/path, just get the filename
                                    return pathOrUrl.split('/').pop() || pathOrUrl;
                                } catch {
                                    // Fallback for any parsing errors
                                    return pathOrUrl.split('/').pop() || pathOrUrl;
                                }
                            };

                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between py-2 px-1 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate" title={filePathOrUrl}>
                                            {getDisplayName(filePathOrUrl)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFile(filePathOrUrl)}
                                        className="ml-2 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                        title="Remove file"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Assignment Status */}
                {assignedFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            {assignedFiles.length} file{assignedFiles.length !== 1 ? 's' : ''} assigned
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                    onClick={onAssignSelectedFiles}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    Assign Selected Files
                </button>
            </div>
        </div>
    );
};

export default memo(FileAssignmentPanel);