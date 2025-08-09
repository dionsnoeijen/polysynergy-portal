import React, { useState, useCallback } from 'react';
import { FolderPlusIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/modal';

type CreateFolderModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreateFolder: (folderName: string) => void;
    currentPath?: string;
};

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
    isOpen,
    onClose,
    onCreateFolder,
    currentPath
}) => {
    const [folderName, setFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setFolderName('');
        setError(null);
        setIsCreating(false);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!folderName.trim()) {
            setError('Folder name is required');
            return;
        }

        // Basic validation for folder names
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(folderName)) {
            setError('Folder name contains invalid characters');
            return;
        }

        if (folderName.trim().length > 255) {
            setError('Folder name is too long');
            return;
        }

        try {
            setIsCreating(true);
            setError(null);
            
            await onCreateFolder(folderName.trim());
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create folder');
        } finally {
            setIsCreating(false);
        }
    }, [folderName, onCreateFolder, handleClose]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFolderName(e.target.value);
        if (error) {
            setError(null);
        }
    }, [error]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create New Folder"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                    <FolderPlusIcon className="w-8 h-8 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                            Create a new folder
                        </h3>
                        {currentPath && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Location: /{currentPath}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="folder-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Folder Name
                    </label>
                    <input
                        id="folder-name"
                        type="text"
                        value={folderName}
                        onChange={handleInputChange}
                        placeholder="Enter folder name..."
                        className={`
                            w-full px-3 py-2 border rounded-md text-zinc-900 dark:text-zinc-100 
                            bg-white dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-500
                            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
                            ${error 
                                ? 'border-red-300 dark:border-red-600' 
                                : 'border-zinc-300 dark:border-zinc-600'
                            }
                        `}
                        disabled={isCreating}
                        autoFocus
                    />
                    {error && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isCreating}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 
                                 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 
                                 rounded-md transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isCreating || !folderName.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 
                                 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <FolderPlusIcon className="w-4 h-4" />
                                Create Folder
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateFolderModal;