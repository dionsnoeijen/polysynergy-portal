import React, {useEffect, useState, useCallback} from "react";
import {createPortal} from "react-dom";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import {ArrowsPointingOutIcon, ArrowsPointingInIcon} from "@heroicons/react/24/outline";
import FileTree from "./spa-editor/file-tree";
import CodePanel from "./spa-editor/code-panel";
import SettingsModal from "./spa-editor/settings-modal";
import {SPAProject, DEFAULT_PROJECT} from "./spa-editor/types";

const SPAEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<Node>();
    const [project, setProject] = useState<SPAProject>(DEFAULT_PROJECT);
    const [activeFile, setActiveFile] = useState<string>('src/App.jsx');
    const [initialProject, setInitialProject] = useState<string>('');
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // Track if there are unsaved changes
    const hasChanges = JSON.stringify(project) !== initialProject;

    // Load node
    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId as string));
    }, [formEditRecordId, getNode]);

    // Load project from node variable
    useEffect(() => {
        if (formEditVariable?.value) {
            try {
                const parsed = typeof formEditVariable.value === 'string'
                    ? JSON.parse(formEditVariable.value)
                    : formEditVariable.value;

                // Check if we have a valid project with files
                if (parsed.version && parsed.files && Object.keys(parsed.files).length > 0) {
                    setProject(parsed);
                    setInitialProject(JSON.stringify(parsed));

                    // Set active file to entry point or first file
                    const entryPoint = parsed.settings?.entryPoint;
                    if (entryPoint && parsed.files[entryPoint]) {
                        setActiveFile(entryPoint);
                    } else {
                        const firstFile = Object.keys(parsed.files)[0];
                        if (firstFile) setActiveFile(firstFile);
                    }
                } else {
                    // Empty or minimal project from backend - use frontend default template
                    setProject(DEFAULT_PROJECT);
                    setInitialProject(JSON.stringify(DEFAULT_PROJECT));
                    setActiveFile('src/App.jsx');
                }
            } catch {
                setProject(DEFAULT_PROJECT);
                setInitialProject(JSON.stringify(DEFAULT_PROJECT));
                setActiveFile('src/App.jsx');
            }
        }
    }, [formEditVariable]);

    // File operations
    const updateFile = useCallback((path: string, code: string) => {
        setProject(prev => ({
            ...prev,
            files: {
                ...prev.files,
                [path]: code
            }
        }));
    }, []);

    const createFile = useCallback((path: string) => {
        // Ensure path has extension
        const finalPath = path.includes('.') ? path : `${path}.jsx`;

        setProject(prev => ({
            ...prev,
            files: {
                ...prev.files,
                [finalPath]: `// ${finalPath}\n`
            }
        }));
        setActiveFile(finalPath);
    }, []);

    const createFolder = useCallback((path: string) => {
        // Create a placeholder file in the folder
        const placeholderPath = `${path}/.gitkeep`;
        setProject(prev => ({
            ...prev,
            files: {
                ...prev.files,
                [placeholderPath]: ''
            }
        }));
    }, []);

    const deleteFile = useCallback((path: string) => {
        setProject(prev => {
            const newFiles = { ...prev.files };

            // If it's a folder, delete all files in it
            const isFolder = !path.includes('.') || Object.keys(newFiles).some(
                p => p.startsWith(path + '/')
            );

            if (isFolder) {
                Object.keys(newFiles).forEach(p => {
                    if (p.startsWith(path + '/') || p === path) {
                        delete newFiles[p];
                    }
                });
            } else {
                delete newFiles[path];
            }

            // If active file was deleted, select another
            if (!newFiles[activeFile]) {
                const firstFile = Object.keys(newFiles).find(p => !p.endsWith('.gitkeep'));
                if (firstFile) setActiveFile(firstFile);
            }

            return { ...prev, files: newFiles };
        });
    }, [activeFile]);

    const renameFile = useCallback((oldPath: string, newPath: string) => {
        setProject(prev => {
            const newFiles: Record<string, string> = {};

            Object.entries(prev.files).forEach(([path, content]) => {
                if (path === oldPath) {
                    newFiles[newPath] = content;
                } else if (path.startsWith(oldPath + '/')) {
                    // It's a folder rename - update all children
                    const newChildPath = newPath + path.slice(oldPath.length);
                    newFiles[newChildPath] = content;
                } else {
                    newFiles[path] = content;
                }
            });

            // Update active file if renamed
            if (activeFile === oldPath) {
                setActiveFile(newPath);
            } else if (activeFile.startsWith(oldPath + '/')) {
                setActiveFile(newPath + activeFile.slice(oldPath.length));
            }

            return { ...prev, files: newFiles };
        });
    }, [activeFile]);

    const handleSettingsChange = useCallback((settings: SPAProject['settings']) => {
        setProject(prev => ({ ...prev, settings }));
    }, []);

    // Save to node
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;

        // Remove .gitkeep files before saving
        const cleanFiles: Record<string, string> = {};
        Object.entries(project.files).forEach(([path, content]) => {
            if (!path.endsWith('.gitkeep')) {
                cleanFiles[path] = content;
            }
        });

        const projectToSave = { ...project, files: cleanFiles };
        const jsonToSave = JSON.stringify(projectToSave, null, 2);

        updateNodeVariable(formEditRecordId as string, formEditVariable.handle, jsonToSave);
        setInitialProject(jsonToSave);
        closeForm();
    }, [formEditRecordId, formEditVariable, project, updateNodeVariable, closeForm]);

    // Handle close with unsaved changes warning
    const handleClose = useCallback(() => {
        if (hasChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                closeForm();
            }
        } else {
            closeForm();
        }
    }, [hasChanges, closeForm]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                // Trigger form submit
                const form = document.querySelector('form[data-spa-editor]') as HTMLFormElement;
                if (form) form.requestSubmit();
            }
            // Escape to exit fullscreen (not close)
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Filter out .gitkeep for display
    const displayFiles = Object.fromEntries(
        Object.entries(project.files).filter(([path]) => !path.endsWith('.gitkeep'))
    );

    const formContent = (
        <form onSubmit={handleSubmit} method="post" data-spa-editor className={isFullscreen ? 'h-full flex flex-col' : ''}>
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="flex items-center gap-3">
                    <Heading className="text-lg">{node?.name || 'SPA'}: {formEditVariable?.handle}</Heading>
                    {hasChanges && (
                        <span className="text-xs text-amber-500 dark:text-amber-400">
                            Unsaved changes
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => setShowSettings(true)}
                        color="zinc"
                        title="Project settings"
                    >
                        Settings
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        color="zinc"
                        title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? (
                            <ArrowsPointingInIcon className="w-5 h-5"/>
                        ) : (
                            <ArrowsPointingOutIcon className="w-5 h-5"/>
                        )}
                    </Button>
                    <Button type="button" onClick={handleClose} plain>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save SPA
                    </Button>
                </div>
            </div>

            {/* Main editor area */}
            <div className={`flex-1 flex min-h-0 ${isFullscreen ? '' : 'h-[600px]'}`}>
                {/* Left sidebar - File Tree */}
                <div className="w-56 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-800">
                    <FileTree
                        files={project.files}
                        activeFile={activeFile}
                        onSelectFile={setActiveFile}
                        onCreateFile={createFile}
                        onCreateFolder={createFolder}
                        onDeleteFile={deleteFile}
                        onRenameFile={renameFile}
                    />
                </div>

                {/* Main panel - Code Editor */}
                <div className="flex-1 min-w-0 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                    {activeFile && displayFiles[activeFile] !== undefined ? (
                        <CodePanel
                            code={project.files[activeFile] || ''}
                            filePath={activeFile}
                            onChange={(code) => updateFile(activeFile, code)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                            <div className="text-center">
                                <p className="text-lg mb-2">No file selected</p>
                                <p className="text-sm">Select a file from the tree or create a new one</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );

    // Settings modal
    const settingsModal = showSettings && (
        <SettingsModal
            settings={project.settings}
            onSettingsChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
        />
    );

    // Render in portal when fullscreen
    if (isFullscreen) {
        return (
            <>
                {createPortal(
                    <div className="fixed inset-0 z-[200] bg-zinc-100 dark:bg-zinc-900 flex flex-col">
                        {formContent}
                    </div>,
                    document.body
                )}
                {settingsModal}
            </>
        );
    }

    return (
        <>
            {formContent}
            {settingsModal}
        </>
    );
};

export default SPAEditorForm;
