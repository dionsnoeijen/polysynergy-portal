import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    DocumentTextIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { ConfirmAlert } from "@/components/confirm-alert";
import Editor from "@monaco-editor/react";
import useEditorStore from "@/stores/editorStore";
import {
    ProjectTemplate,
    fetchTemplatesAPI,
    createTemplateAPI,
    updateTemplateAPI,
    deleteTemplateAPI,
} from "@/api/templatesApi";

const BaseTemplatesEditor: React.FC = () => {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // New template form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newNameError, setNewNameError] = useState<string | null>(null);

    // Selected template for editing
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editName, setEditName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Delete confirmation
    const [templateToDelete, setTemplateToDelete] = useState<ProjectTemplate | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchTemplates = useCallback(async () => {
        if (!activeProjectId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTemplatesAPI(activeProjectId);
            setTemplates(data);
        } catch (err) {
            setError("Failed to load templates");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const validateName = (name: string): string | null => {
        if (!name.trim()) return "Name is required";
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
            return "Name must start with a letter or underscore, and contain only letters, numbers, and underscores";
        }
        if (templates.some((t) => t.name === name && t.id !== selectedTemplate?.id)) {
            return "A template with this name already exists";
        }
        return null;
    };

    const handleCreateTemplate = async () => {
        if (!activeProjectId) return;
        const validationError = validateName(newName);
        if (validationError) {
            setNewNameError(validationError);
            return;
        }

        try {
            const created = await createTemplateAPI(activeProjectId, {
                name: newName.trim(),
                content: "",
            });
            setTemplates([...templates, created]);
            setNewName("");
            setShowNewForm(false);
            setNewNameError(null);
            setSelectedTemplate(created);
            setEditContent("");
            setEditName(created.name);
        } catch (err) {
            setNewNameError(err instanceof Error ? err.message : "Failed to create template");
        }
    };

    const handleSelectTemplate = (template: ProjectTemplate) => {
        if (hasUnsavedChanges && selectedTemplate) {
            // Could show a confirmation dialog here
            // For now, just switch
        }
        setSelectedTemplate(template);
        setEditContent(template.content);
        setEditName(template.name);
        setHasUnsavedChanges(false);
        setIsEditingName(false);
    };

    const handleContentChange = (value: string | undefined) => {
        setEditContent(value || "");
        setHasUnsavedChanges(true);
    };

    const handleSaveTemplate = async () => {
        if (!activeProjectId || !selectedTemplate) return;

        try {
            const updated = await updateTemplateAPI(activeProjectId, selectedTemplate.id, {
                content: editContent,
            });
            setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTemplate(updated);
            setHasUnsavedChanges(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save template");
        }
    };

    const handleSaveName = async () => {
        if (!activeProjectId || !selectedTemplate) return;

        const validationError = validateName(editName);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            const updated = await updateTemplateAPI(activeProjectId, selectedTemplate.id, {
                name: editName.trim(),
            });
            setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTemplate(updated);
            setIsEditingName(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to rename template");
        }
    };

    const confirmDelete = (template: ProjectTemplate) => {
        setTemplateToDelete(template);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!activeProjectId || !templateToDelete) return;

        try {
            await deleteTemplateAPI(activeProjectId, templateToDelete.id);
            setTemplates(templates.filter((t) => t.id !== templateToDelete.id));
            if (selectedTemplate?.id === templateToDelete.id) {
                setSelectedTemplate(null);
                setEditContent("");
                setEditName("");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete template");
        } finally {
            setShowDeleteConfirm(false);
            setTemplateToDelete(null);
        }
    };

    if (loading) {
        return <div className="p-4 text-zinc-500">Loading templates...</div>;
    }

    return (
        <section className="grid grid-cols-[250px_1fr] gap-4 h-[500px]">
            {/* Left panel - Template list */}
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        Base Templates
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        Use with {`{% extends "name" %}`}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {templates.length === 0 ? (
                        <div className="p-4 text-center text-zinc-400 text-sm">
                            No templates yet
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    type="button"
                                    onClick={() => handleSelectTemplate(template)}
                                    className={`w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition ${
                                        selectedTemplate?.id === template.id
                                            ? "bg-sky-50 dark:bg-sky-900/20 border-l-2 border-sky-500"
                                            : ""
                                    }`}
                                >
                                    <DocumentTextIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                    <span className="text-sm font-mono truncate text-zinc-700 dark:text-zinc-200">
                                        {template.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* New template form */}
                <div className="p-2 border-t border-zinc-200 dark:border-zinc-700">
                    {showNewForm ? (
                        <div className="space-y-2">
                            <Input
                                placeholder="template_name"
                                value={newName}
                                onChange={(e) => {
                                    setNewName(e.target.value);
                                    setNewNameError(null);
                                }}
                                autoFocus
                            />
                            {newNameError && (
                                <p className="text-xs text-red-500">{newNameError}</p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    color="sky"
                                    onClick={handleCreateTemplate}
                                    className="flex-1"
                                >
                                    Create
                                </Button>
                                <Button
                                    type="button"
                                    plain
                                    onClick={() => {
                                        setShowNewForm(false);
                                        setNewName("");
                                        setNewNameError(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            color="sky"
                            onClick={() => setShowNewForm(true)}
                            className="w-full"
                        >
                            <PlusIcon className="w-4 h-4" /> Add Template
                        </Button>
                    )}
                </div>
            </div>

            {/* Right panel - Editor */}
            <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden flex flex-col">
                {selectedTemplate ? (
                    <>
                        {/* Header with name and actions */}
                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-48"
                                            autoFocus
                                        />
                                        <Button
                                            type="button"
                                            plain
                                            onClick={handleSaveName}
                                        >
                                            <CheckIcon className="w-4 h-4 text-green-500" />
                                        </Button>
                                        <Button
                                            type="button"
                                            plain
                                            onClick={() => {
                                                setIsEditingName(false);
                                                setEditName(selectedTemplate.name);
                                            }}
                                        >
                                            <XMarkIcon className="w-4 h-4 text-zinc-500" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                            {selectedTemplate.name}
                                        </span>
                                        <Button
                                            type="button"
                                            plain
                                            onClick={() => setIsEditingName(true)}
                                        >
                                            <PencilIcon className="w-3 h-3 text-zinc-400" />
                                        </Button>
                                    </>
                                )}
                                {hasUnsavedChanges && (
                                    <span className="text-xs text-amber-500">Unsaved changes</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    color="sky"
                                    onClick={handleSaveTemplate}
                                    disabled={!hasUnsavedChanges}
                                >
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    plain
                                    onClick={() => confirmDelete(selectedTemplate)}
                                >
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>

                        {/* Monaco Editor */}
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                language="html"
                                value={editContent}
                                onChange={handleContentChange}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                    tabSize: 2,
                                    wordWrap: "on",
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-400">
                        <div className="text-center">
                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Select a template to edit</p>
                            <p className="text-xs mt-1">or create a new one</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="col-span-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
                    {error}
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="ml-2 underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <ConfirmAlert
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete template?"
                description={`Are you sure you want to delete template "${templateToDelete?.name}"? This cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </section>
    );
};

export default BaseTemplatesEditor;
