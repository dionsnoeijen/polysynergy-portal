import { useState, useEffect, useCallback, useMemo } from 'react';
import { createFileManagerApi, type DirectoryContents, type FileListParams } from '@/api/fileManagerApi';
import { FileManagerState, FileViewMode, FileSortBy, FileSortOrder, ContextMenuItem } from '@/types/types';
import useEditorStore from '@/stores/editorStore';

export const useFileManager = () => {
    const activeProjectId = useEditorStore(state => state.activeProjectId);
    
    // Core state
    const [state, setState] = useState<FileManagerState>({
        currentPath: '',
        selectedFiles: [],
        selectedDirectories: [],
        viewMode: FileViewMode.Grid,
        sortBy: FileSortBy.Name,
        sortOrder: FileSortOrder.Asc,
        isUploading: false,
        uploadProgress: {},
        contextMenuVisible: false,
        contextMenuPosition: { x: 0, y: 0 },
        contextMenuItems: [],
        dragOver: false,
        isPublicMode: false,
    });

    // Directory contents
    const [directoryContents, setDirectoryContents] = useState<DirectoryContents>({
        path: '',
        files: [],
        directories: [],
        total_files: 0,
        total_directories: 0,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastClickedFile, setLastClickedFile] = useState<string | null>(null);

    // Create API instance
    const api = useMemo(() => {
        return activeProjectId ? createFileManagerApi(activeProjectId) : null;
    }, [activeProjectId]);

    // Update state helper
    const updateState = useCallback((updates: Partial<FileManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Load directory contents
    const loadDirectory = useCallback(async (path?: string) => {
        if (!api) return;

        const targetPath = path !== undefined ? path : state.currentPath;
        const isNavigating = path !== undefined && path !== state.currentPath;
        
        console.log('loadDirectory called with:', path, '-> targetPath:', targetPath, 'isNavigating:', isNavigating);

        setLoading(true);
        setError(null);

        try {
            const params: FileListParams = {
                path: targetPath,
                sort_by: state.sortBy,
                sort_order: state.sortOrder,
                limit: 1000, // Load all files for now
            };

            const contents = await api.listFiles(params);
            
            // Update contents and path in a single batch to reduce re-renders
            setDirectoryContents(contents);
            if (isNavigating) {
                updateState({ currentPath: targetPath });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load directory');
        } finally {
            setLoading(false);
        }
    }, [api, state.currentPath, state.sortBy, state.sortOrder, updateState]);

    // Navigate to directory
    const navigateToDirectory = useCallback(async (path: string) => {
        console.log('Navigating to directory:', path, '(current:', state.currentPath, ')'); // Debug log
        await loadDirectory(path);
    }, [loadDirectory, state.currentPath]);

    // Go up one directory level
    const navigateUp = useCallback(async () => {
        if (state.currentPath) {
            const parentPath = state.currentPath.split('/').slice(0, -1).join('/');
            await navigateToDirectory(parentPath);
        }
    }, [state.currentPath, navigateToDirectory]);

    // File selection
    const selectFile = useCallback((path: string, multiSelect = false, rangeSelect = false) => {
        if (rangeSelect && lastClickedFile) {
            // Shift + click: range selection
            const allFiles = directoryContents.files.map(f => f.path);
            const startIndex = allFiles.indexOf(lastClickedFile);
            const endIndex = allFiles.indexOf(path);
            
            if (startIndex !== -1 && endIndex !== -1) {
                const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
                const rangeFiles = allFiles.slice(min, max + 1);
                const newSelection = [...new Set([...state.selectedFiles, ...rangeFiles])];
                updateState({ selectedFiles: newSelection });
            } else {
                // Fallback to regular selection
                updateState({ selectedFiles: [path] });
            }
        } else if (multiSelect) {
            const isSelected = state.selectedFiles.includes(path);
            const newSelection = isSelected
                ? state.selectedFiles.filter(p => p !== path)
                : [...state.selectedFiles, path];
            updateState({ selectedFiles: newSelection });
        } else {
            updateState({ selectedFiles: [path] });
            setLastClickedFile(path);
        }
    }, [state.selectedFiles, updateState, lastClickedFile, directoryContents.files]);

    // Directory selection
    const selectDirectory = useCallback((path: string, multiSelect = false) => {
        if (multiSelect) {
            const isSelected = state.selectedDirectories.includes(path);
            const newSelection = isSelected
                ? state.selectedDirectories.filter(p => p !== path)
                : [...state.selectedDirectories, path];
            updateState({ selectedDirectories: newSelection });
        } else {
            updateState({ selectedDirectories: [path] });
        }
    }, [state.selectedDirectories, updateState]);

    // Clear selection
    const clearSelection = useCallback(() => {
        updateState({ selectedFiles: [], selectedDirectories: [] });
    }, [updateState]);

    // File operations
    const deleteFile = useCallback(async (path: string, isDirectory = false) => {
        if (!api) return false;

        try {
            await api.deleteFile(path, isDirectory);
            await loadDirectory(); // Refresh current directory
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
            return false;
        }
    }, [api, loadDirectory]);

    const deleteSelectedFiles = useCallback(async () => {
        if (!api) return false;

        const allPaths = [...state.selectedFiles, ...state.selectedDirectories];
        if (allPaths.length === 0) return false;

        try {
            if (allPaths.length === 1) {
                const isDirectory = state.selectedDirectories.includes(allPaths[0]);
                await api.deleteFile(allPaths[0], isDirectory);
            } else {
                await api.batchDeleteFiles(allPaths);
            }
            
            clearSelection();
            await loadDirectory(); // Refresh current directory
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete files');
            return false;
        }
    }, [api, state.selectedFiles, state.selectedDirectories, clearSelection, loadDirectory]);

    const createDirectory = useCallback(async (name: string, parentPath?: string) => {
        if (!api) return false;

        try {
            await api.createDirectory(name, parentPath || state.currentPath || undefined);
            await loadDirectory(); // Refresh current directory
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create directory');
            return false;
        }
    }, [api, state.currentPath, loadDirectory]);

    const moveFile = useCallback(async (sourcePath: string, destinationPath: string) => {
        if (!api) return false;

        try {
            await api.moveFile(sourcePath, destinationPath);
            await loadDirectory(); // Refresh current directory
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to move file');
            return false;
        }
    }, [api, loadDirectory]);

    // File upload
    const uploadFiles = useCallback(async (files: File[], folderPath?: string) => {
        if (!api) return;

        updateState({ isUploading: true });

        const uploadPromises = files.map(async (file) => {
            try {
                // Initialize progress tracking
                updateState({
                    uploadProgress: {
                        ...state.uploadProgress,
                        [file.name]: 0
                    }
                });

                const result = await api.uploadFile(file, folderPath || state.currentPath || undefined, state.isPublicMode);
                
                // Update progress to 100%
                updateState({
                    uploadProgress: {
                        ...state.uploadProgress,
                        [file.name]: 100
                    }
                });

                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
                throw err;
            }
        });

        try {
            await Promise.all(uploadPromises);
            await loadDirectory(); // Refresh current directory
        } finally {
            updateState({ isUploading: false });
            // Clear upload progress after a delay
            setTimeout(() => {
                updateState({ uploadProgress: {} });
            }, 2000);
        }
    }, [api, state.currentPath, state.uploadProgress, state.isPublicMode, updateState, loadDirectory]);


    // Context menu
    const showContextMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
        updateState({
            contextMenuVisible: true,
            contextMenuPosition: { x, y },
            contextMenuItems: items
        });
    }, [updateState]);

    const hideContextMenu = useCallback(() => {
        updateState({
            contextMenuVisible: false,
            contextMenuItems: []
        });
    }, [updateState]);

    // View settings
    const setViewMode = useCallback((mode: FileViewMode) => {
        updateState({ viewMode: mode });
    }, [updateState]);

    const setPublicMode = useCallback((isPublic: boolean) => {
        updateState({ isPublicMode: isPublic });
    }, [updateState]);

    const setSorting = useCallback((sortBy: FileSortBy, sortOrder?: FileSortOrder) => {
        const newSortOrder = sortOrder || (state.sortBy === sortBy && state.sortOrder === FileSortOrder.Asc 
            ? FileSortOrder.Desc 
            : FileSortOrder.Asc);
        
        updateState({ sortBy, sortOrder: newSortOrder });
    }, [state.sortBy, state.sortOrder, updateState]);


    // Drag and drop
    const setDragOver = useCallback((dragOver: boolean) => {
        updateState({ dragOver });
    }, [updateState]);

    // Initialize - load root directory
    // Separate loadDirectory function without dependencies to avoid re-creation
    const loadCurrentDirectory = useCallback(async () => {
        if (!api) return;

        setLoading(true);
        setError(null);

        try {
            const params: FileListParams = {
                path: state.currentPath,
                sort_by: state.sortBy,
                sort_order: state.sortOrder,
                limit: 1000,
            };

            const contents = await api.listFiles(params);
            setDirectoryContents(contents);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load directory');
        } finally {
            setLoading(false);
        }
    }, [api, state.currentPath, state.sortBy, state.sortOrder]);

    // Load directory when API is available or when sort changes
    useEffect(() => {
        if (api) {
            loadCurrentDirectory();
        }
    }, [api, state.sortBy, state.sortOrder, loadCurrentDirectory]);

    return {
        // State
        state,
        directoryContents,
        loading,
        error,
        
        // Navigation
        navigateToDirectory,
        navigateUp,
        
        // Selection
        selectFile,
        selectDirectory,
        clearSelection,
        
        // File operations
        deleteFile,
        deleteSelectedFiles,
        createDirectory,
        moveFile,
        uploadFiles,
        
        // View settings
        setViewMode,
        setPublicMode,
        setSorting,
        
        // Context menu
        showContextMenu,
        hideContextMenu,
        
        // Drag and drop
        setDragOver,
        
        // Refresh
        refresh: loadCurrentDirectory,
    };
};