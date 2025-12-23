import React, {useEffect, useState, useMemo, useCallback} from "react";
import {createPortal} from "react-dom";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {ArrowsPointingOutIcon, ArrowsPointingInIcon} from "@heroicons/react/24/outline";
import {
    ElementLibrary,
    ElementTree,
    LayoutCanvas,
    PropertiesPanel,
    CodeEditorModal,
    LayoutDocument,
    LayoutElement,
    AvailableComponent,
    createDefaultDocument,
    findElementById,
    migrateDocument,
} from "./layout-editor";

const LayoutEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const getNodeVariable = useNodesStore((state) => state.getNodeVariable);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const findInConnectionsByNodeIdAndHandle = useConnectionsStore((state) => state.findInConnectionsByNodeIdAndHandle);

    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<Node>();
    const [layoutDoc, setLayoutDoc] = useState<LayoutDocument>(createDefaultDocument());
    const [isFullscreen, setIsFullscreen] = useState(true); // Default to fullscreen for better UX
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [editingCodeElement, setEditingCodeElement] = useState<LayoutElement | null>(null);
    const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);

    // Build available components list from connections to the "components" variable keys
    const availableComponents = useMemo<AvailableComponent[]>(() => {
        if (!formEditRecordId) return [];

        // Get the components variable (it's a Dict with value array containing the keys)
        const componentsVar = getNodeVariable(formEditRecordId as string, 'components');
        if (!componentsVar?.value || !Array.isArray(componentsVar.value)) return [];

        const components: AvailableComponent[] = [];

        // For each key in the components dict value array, find the connection
        for (const item of componentsVar.value) {
            // Item can be string or object with handle property
            const itemHandle = typeof item === 'string' ? item : (item as { handle: string }).handle;
            if (!itemHandle) continue;

            const handle = `components.${itemHandle}`;
            const connections = findInConnectionsByNodeIdAndHandle(formEditRecordId as string, handle);

            if (connections.length > 0) {
                const connection = connections[0];
                components.push({
                    key: itemHandle,
                    label: itemHandle.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                    nodeId: connection.sourceNodeId,
                    type: 'component',
                });
            }
        }

        return components;
    }, [formEditRecordId, getNodeVariable, findInConnectionsByNodeIdAndHandle]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;

        const jsonToSave = JSON.stringify(layoutDoc, null, 2);
        updateNodeVariable(formEditRecordId as string, formEditVariable.handle, jsonToSave);
        closeForm();
    };

    const handleDocumentChange = useCallback((newDoc: LayoutDocument) => {
        setLayoutDoc(newDoc);
    }, []);

    const handleEditCode = useCallback((element: LayoutElement) => {
        setEditingCodeElement(element);
    }, []);

    const handleSaveCode = useCallback((updatedElement: LayoutElement) => {
        // Update the element in the document
        const newDoc: LayoutDocument = JSON.parse(JSON.stringify(layoutDoc));
        const element = findElementById(newDoc.root, updatedElement.id);
        if (element && element.content.type === 'code' && updatedElement.content.type === 'code') {
            element.content.data.code = updatedElement.content.data.code;
            setLayoutDoc(newDoc);
        }
        setEditingCodeElement(null);
    }, [layoutDoc]);

    const handleDragStart = useCallback(() => {
        // Visual feedback could be added here
    }, []);

    const handleEditText = useCallback((element: LayoutElement) => {
        // Toggle: if already editing this element, close it; otherwise open it
        setEditingTextElementId(prev => prev === element.id ? null : element.id);
    }, []);

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId as string));
    }, [formEditRecordId, getNode]);

    useEffect(() => {
        const value = formEditVariable?.value;
        if (typeof value !== 'string' || !value.trim()) {
            setLayoutDoc(createDefaultDocument());
            return;
        }

        try {
            const parsed = JSON.parse(value);
            if (parsed?.version && parsed?.root) {
                // Migrate old documents to new format
                const migrated = migrateDocument(parsed as LayoutDocument);
                setLayoutDoc(migrated);
                return;
            }
        } catch {
            // Invalid JSON, fall through to default
        }

        setLayoutDoc(createDefaultDocument());
    }, [formEditVariable]);

    // Handle escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const formContent = (
        <form onSubmit={handleSubmit} method="post" className={isFullscreen ? 'h-full flex flex-col' : ''}>
            {/* Header */}
            <div className={`flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800`}>
                <div className="flex items-center gap-3">
                    <Heading className="text-lg">{node?.name || 'Layout'}: {formEditVariable?.handle}</Heading>
                </div>
                <div className="flex items-center gap-2">
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
                    <Button type="button" onClick={() => closeForm()} plain>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Layout
                    </Button>
                </div>
            </div>

            {/* Main editor area - 4 panel layout */}
            <div className={`flex-1 flex min-h-0 ${isFullscreen ? '' : 'h-[600px]'}`}>
                {/* Left sidebar - Structure Tree + Element Library */}
                <div className="w-56 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col">
                    {/* Structure Tree - top half */}
                    <div className="flex-1 min-h-0 border-b border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <ElementTree
                            document={layoutDoc}
                            selectedElementId={selectedElementId}
                            onSelect={setSelectedElementId}
                        />
                    </div>
                    {/* Element Library - bottom half */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ElementLibrary
                            availableComponents={availableComponents}
                            onDragStart={handleDragStart}
                        />
                    </div>
                </div>

                {/* Middle panel - Canvas */}
                <div className="flex-1 min-w-0 overflow-hidden">
                    <LayoutCanvas
                        document={layoutDoc}
                        selectedElementId={selectedElementId}
                        onSelect={setSelectedElementId}
                        onChange={handleDocumentChange}
                        onEditCode={handleEditCode}
                        onEditText={handleEditText}
                        editingElementId={editingTextElementId}
                    />
                </div>

                {/* Right panel - Properties */}
                <div className="w-72 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    <PropertiesPanel
                        document={layoutDoc}
                        selectedElementId={selectedElementId}
                        onChange={handleDocumentChange}
                    />
                </div>
            </div>

        </form>
    );

    const codeEditorModalElement = editingCodeElement && (
        <CodeEditorModal
            component={{
                id: editingCodeElement.id,
                type: 'code',
                content: editingCodeElement.content.type === 'code' ? editingCodeElement.content.data.code : '',
                x: 0,
                y: 0,
                width: 1,
                height: 1,
            }}
            isOpen={true}
            onClose={() => setEditingCodeElement(null)}
            onSave={(updatedComponent) => {
                const updated: LayoutElement = {
                    ...editingCodeElement,
                    content: {
                        type: 'code',
                        data: { code: updatedComponent.content || '' }
                    }
                };
                handleSaveCode(updated);
            }}
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
                {codeEditorModalElement}
            </>
        );
    }

    return (
        <>
            {formContent}
            {codeEditorModalElement}
        </>
    );
};

export default LayoutEditorForm;
