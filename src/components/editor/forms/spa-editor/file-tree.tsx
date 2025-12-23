import React, {useState} from 'react';
import {FileTreeNode, buildFileTree, getFileIcon} from './types';
import {
    FolderIcon,
    FolderOpenIcon,
    DocumentIcon,
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';

interface FileTreeProps {
    files: Record<string, string>;
    activeFile: string;
    onSelectFile: (path: string) => void;
    onCreateFile: (path: string) => void;
    onCreateFolder: (path: string) => void;
    onDeleteFile: (path: string) => void;
    onRenameFile: (oldPath: string, newPath: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({
    files,
    activeFile,
    onSelectFile,
    onCreateFile,
    onCreateFolder,
    onDeleteFile,
    onRenameFile
}) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
    const [newItemMode, setNewItemMode] = useState<'file' | 'folder' | null>(null);
    const [newItemParent, setNewItemParent] = useState<string>('');
    const [newItemName, setNewItemName] = useState('');
    const [renamingPath, setRenamingPath] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const tree = buildFileTree(files);

    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const handleStartNewItem = (type: 'file' | 'folder', parentPath: string = '') => {
        setNewItemMode(type);
        setNewItemParent(parentPath);
        setNewItemName('');
        if (parentPath) {
            setExpandedFolders(prev => new Set([...prev, parentPath]));
        }
    };

    const handleConfirmNewItem = () => {
        if (!newItemName.trim()) {
            setNewItemMode(null);
            return;
        }

        const fullPath = newItemParent ? `${newItemParent}/${newItemName}` : newItemName;

        if (newItemMode === 'file') {
            onCreateFile(fullPath);
        } else {
            onCreateFolder(fullPath);
        }

        setNewItemMode(null);
        setNewItemName('');
    };

    const handleStartRename = (path: string, name: string) => {
        setRenamingPath(path);
        setRenameValue(name);
    };

    const handleConfirmRename = () => {
        if (!renamingPath || !renameValue.trim()) {
            setRenamingPath(null);
            return;
        }

        const parts = renamingPath.split('/');
        parts[parts.length - 1] = renameValue;
        const newPath = parts.join('/');

        if (newPath !== renamingPath) {
            onRenameFile(renamingPath, newPath);
        }

        setRenamingPath(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        } else if (e.key === 'Escape') {
            setNewItemMode(null);
            setRenamingPath(null);
        }
    };

    const renderNode = (node: FileTreeNode, depth: number = 0): React.ReactNode => {
        const isExpanded = expandedFolders.has(node.path);
        const isActive = node.path === activeFile;
        const isRenaming = renamingPath === node.path;

        return (
            <div key={node.path}>
                <div
                    className={`flex items-center gap-1 px-2 py-1 cursor-pointer group ${
                        isActive
                            ? 'bg-sky-100 dark:bg-zinc-700 text-sky-700 dark:text-white'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                    }`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            toggleFolder(node.path);
                        } else {
                            onSelectFile(node.path);
                        }
                    }}
                >
                    {node.type === 'folder' ? (
                        <>
                            {isExpanded ? (
                                <ChevronDownIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                            ) : (
                                <ChevronRightIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                            )}
                            {isExpanded ? (
                                <FolderOpenIcon className="w-4 h-4 text-amber-500" />
                            ) : (
                                <FolderIcon className="w-4 h-4 text-amber-500" />
                            )}
                        </>
                    ) : (
                        <>
                            <span className="w-3" />
                            <DocumentIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-400" />
                        </>
                    )}

                    {isRenaming ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleConfirmRename}
                            onKeyDown={(e) => handleKeyDown(e, handleConfirmRename)}
                            autoFocus
                            className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-1 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <span className="flex-1 truncate text-sm">{node.name}</span>
                            {node.type === 'file' && (
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100">
                                    {getFileIcon(node.path)}
                                </span>
                            )}
                        </>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        {node.type === 'folder' && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartNewItem('file', node.path);
                                }}
                                className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                                title="New file"
                            >
                                <PlusIcon className="w-3 h-3" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(node.path, node.name);
                            }}
                            className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                            title="Rename"
                        >
                            <PencilIcon className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete ${node.name}?`)) {
                                    onDeleteFile(node.path);
                                }
                            }}
                            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-600 rounded text-zinc-500 hover:text-red-600 dark:hover:text-white"
                            title="Delete"
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Children */}
                {node.type === 'folder' && isExpanded && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, depth + 1))}

                        {/* New item input inside folder */}
                        {newItemMode && newItemParent === node.path && (
                            <div
                                className="flex items-center gap-1 px-2 py-1"
                                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                            >
                                <span className="w-3" />
                                {newItemMode === 'folder' ? (
                                    <FolderIcon className="w-4 h-4 text-amber-500" />
                                ) : (
                                    <DocumentIcon className="w-4 h-4 text-zinc-400" />
                                )}
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onBlur={handleConfirmNewItem}
                                    onKeyDown={(e) => handleKeyDown(e, handleConfirmNewItem)}
                                    autoFocus
                                    placeholder={newItemMode === 'folder' ? 'folder name' : 'filename.jsx'}
                                    className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-1 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Files</span>
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => handleStartNewItem('file', '')}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                        title="New file"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStartNewItem('folder', '')}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                        title="New folder"
                    >
                        <FolderIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-1">
                {tree.map(node => renderNode(node))}

                {/* Root level new item */}
                {newItemMode && newItemParent === '' && (
                    <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: '8px' }}>
                        <span className="w-3" />
                        {newItemMode === 'folder' ? (
                            <FolderIcon className="w-4 h-4 text-amber-500" />
                        ) : (
                            <DocumentIcon className="w-4 h-4 text-zinc-400" />
                        )}
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onBlur={handleConfirmNewItem}
                            onKeyDown={(e) => handleKeyDown(e, handleConfirmNewItem)}
                            autoFocus
                            placeholder={newItemMode === 'folder' ? 'folder name' : 'filename.jsx'}
                            className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-1 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileTree;
