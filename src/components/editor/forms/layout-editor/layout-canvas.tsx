import React, { useState, useCallback } from 'react';
import {
    LayoutElement,
    LayoutDocument,
    ElementType,
    createDefaultElement,
    canHaveChildren,
    findElementById,
    findParentElement,
    getElementPath,
} from './types';
import CanvasElement from './canvas-element';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

type LayoutCanvasProps = {
    document: LayoutDocument;
    selectedElementId: string | null;
    onSelect: (elementId: string | null) => void;
    onChange: (document: LayoutDocument) => void;
    onEditCode: (element: LayoutElement) => void;
    onEditText?: (element: LayoutElement) => void;
    editingElementId?: string | null;
};

const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
    document,
    selectedElementId,
    onSelect,
    onChange,
    onEditCode,
    onEditText,
    editingElementId,
}) => {
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    // Get breadcrumb path for selected element
    const breadcrumbPath = selectedElementId
        ? getElementPath(document.root, selectedElementId) || []
        : [document.root];

    // Deep clone helper
    const cloneDocument = useCallback((doc: LayoutDocument): LayoutDocument => {
        return JSON.parse(JSON.stringify(doc));
    }, []);

    // Insert element at position
    const insertElement = useCallback((
        targetId: string,
        position: 'before' | 'after' | 'inside',
        newElement: LayoutElement
    ) => {
        const newDoc = cloneDocument(document);

        if (position === 'inside') {
            const target = findElementById(newDoc.root, targetId);
            if (target && canHaveChildren(target.type)) {
                target.children.push(newElement);
            }
        } else {
            const parent = findParentElement(newDoc.root, targetId);
            if (parent) {
                const index = parent.children.findIndex(c => c.id === targetId);
                if (index !== -1) {
                    const insertIndex = position === 'before' ? index : index + 1;
                    parent.children.splice(insertIndex, 0, newElement);
                }
            } else if (newDoc.root.id === targetId) {
                // Dropping on root - add inside
                newDoc.root.children.push(newElement);
            }
        }

        onChange(newDoc);
    }, [document, cloneDocument, onChange]);

    // Delete element
    const deleteElement = useCallback((elementId: string) => {
        if (elementId === document.root.id) return; // Can't delete root

        const newDoc = cloneDocument(document);
        const parent = findParentElement(newDoc.root, elementId);
        if (parent) {
            parent.children = parent.children.filter(c => c.id !== elementId);
            onChange(newDoc);
            if (selectedElementId === elementId) {
                onSelect(null);
            }
        }
    }, [document, cloneDocument, onChange, selectedElementId, onSelect]);

    // Handle save text (for inline markdown editing)
    const handleSaveText = useCallback((elementId: string, text: string) => {
        const newDoc = cloneDocument(document);
        const element = findElementById(newDoc.root, elementId);
        if (element && element.content.type === 'text') {
            element.content.data.text = text;
            onChange(newDoc);
        }
    }, [document, cloneDocument, onChange]);

    // Move element to new position
    const moveElement = useCallback((elementId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
        // Can't move to itself or its own children
        if (elementId === targetId) return;

        const newDoc = cloneDocument(document);

        // Find and remove element from current position
        const elementToMove = findElementById(newDoc.root, elementId);
        if (!elementToMove) return;

        // Check if target is a child of the element being moved (would create circular reference)
        const targetElement = findElementById(elementToMove, targetId);
        if (targetElement) return; // Target is inside the element being moved

        // Remove from current parent
        const currentParent = findParentElement(newDoc.root, elementId);
        if (currentParent) {
            currentParent.children = currentParent.children.filter(c => c.id !== elementId);
        }

        // Insert at new position
        if (position === 'inside') {
            const target = findElementById(newDoc.root, targetId);
            if (target && canHaveChildren(target.type)) {
                target.children.push(elementToMove);
            }
        } else {
            const parent = findParentElement(newDoc.root, targetId);
            if (parent) {
                const index = parent.children.findIndex(c => c.id === targetId);
                if (index !== -1) {
                    const insertIndex = position === 'before' ? index : index + 1;
                    parent.children.splice(insertIndex, 0, elementToMove);
                }
            } else if (newDoc.root.id === targetId) {
                newDoc.root.children.push(elementToMove);
            }
        }

        onChange(newDoc);
    }, [document, cloneDocument, onChange]);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent, targetId: string, position: 'before' | 'after' | 'inside') => {
        e.preventDefault();
        e.stopPropagation();

        setDragOverId(null);
        setDropPosition(null);

        // Check if this is a move operation (existing element)
        const moveData = e.dataTransfer.getData('application/layout-element-move');
        if (moveData) {
            try {
                const { elementId } = JSON.parse(moveData) as { elementId: string };
                moveElement(elementId, targetId, position);
                return;
            } catch (error) {
                console.error('Failed to parse move data:', error);
            }
        }

        // Otherwise, it's a new element from the library
        const data = e.dataTransfer.getData('application/layout-element');
        if (!data) return;

        try {
            const { type, componentKey } = JSON.parse(data) as { type: ElementType; componentKey?: string };
            const newElement = createDefaultElement(type);

            // Set component key if it's a component type
            if (type === 'component' && componentKey && newElement.content.type === 'component') {
                (newElement.content as { type: 'component'; data: { componentKey: string } }).data.componentKey = componentKey;
            }

            insertElement(targetId, position, newElement);
            onSelect(newElement.id);
        } catch (error) {
            console.error('Failed to parse dropped element:', error);
        }
    }, [insertElement, moveElement, onSelect]);

    // Handle drag over
    const handleDragOver = useCallback((e: React.DragEvent, elementId: string, position: 'before' | 'after' | 'inside') => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setDragOverId(elementId);
        setDropPosition(position);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverId(null);
        setDropPosition(null);
    }, []);

    // Get label for breadcrumb
    const getElementLabel = (element: LayoutElement) => {
        if (element.name) return element.name;
        switch (element.type) {
            case 'block': return 'Block';
            case 'columns': return 'Columns';
            case 'stack': return 'Stack';
            case 'text': return 'Text';
            case 'heading': return 'Heading';
            default: return element.type;
        }
    };

    return (
        <div className="h-full flex flex-col bg-zinc-100 dark:bg-zinc-900">
            {/* Header with breadcrumb */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="flex items-center gap-1 text-sm">
                    {breadcrumbPath.map((element, index) => (
                        <React.Fragment key={element.id}>
                            {index > 0 && (
                                <ChevronRightIcon className="w-3 h-3 text-zinc-400" />
                            )}
                            <button
                                type="button"
                                onClick={() => onSelect(element.id)}
                                className={`px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                                    element.id === selectedElementId
                                        ? 'text-sky-600 dark:text-sky-400 font-medium'
                                        : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                {getElementLabel(element)}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 overflow-auto p-4">
                <div
                    className="min-h-full bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-4"
                    style={{ maxWidth: document.settings?.maxWidth || '100%' }}
                >
                    <CanvasElement
                        element={document.root}
                        selectedElementId={selectedElementId}
                        dragOverId={dragOverId}
                        dropPosition={dropPosition}
                        depth={0}
                        onSelect={onSelect}
                        onDelete={deleteElement}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onEditCode={onEditCode}
                        onEditText={onEditText}
                        onSaveText={handleSaveText}
                        editingElementId={editingElementId}
                    />
                </div>
            </div>
        </div>
    );
};

export default LayoutCanvas;
