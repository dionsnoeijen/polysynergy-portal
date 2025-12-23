import React, { useState } from 'react';
import {
    LayoutElement,
    LayoutDocument,
    getNestingColor,
} from './types';
import {
    ChevronRightIcon,
    ChevronDownIcon,
    Square2StackIcon,
    ViewColumnsIcon,
    Bars3Icon,
    DocumentTextIcon,
    PhotoIcon,
    MinusIcon,
    ArrowsUpDownIcon,
    CodeBracketIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';

type ElementTreeProps = {
    document: LayoutDocument;
    selectedElementId: string | null;
    onSelect: (elementId: string) => void;
};

type TreeNodeProps = {
    element: LayoutElement;
    depth: number;
    selectedElementId: string | null;
    expandedIds: Set<string>;
    onSelect: (elementId: string) => void;
    onToggleExpand: (elementId: string) => void;
};

const getElementIcon = (type: string) => {
    switch (type) {
        case 'block':
        case 'container':
        case 'section':
            return <Square2StackIcon className="w-4 h-4" />;
        case 'columns':
        case 'grid':
            return <ViewColumnsIcon className="w-4 h-4" />;
        case 'stack':
        case 'flex':
            return <Bars3Icon className="w-4 h-4" />;
        case 'text':
            return <DocumentTextIcon className="w-4 h-4" />;
        case 'heading':
            return <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">H</span>;
        case 'image':
            return <PhotoIcon className="w-4 h-4" />;
        case 'divider':
            return <MinusIcon className="w-4 h-4" />;
        case 'spacer':
            return <ArrowsUpDownIcon className="w-4 h-4" />;
        case 'code':
            return <CodeBracketIcon className="w-4 h-4" />;
        case 'component':
            return <CubeIcon className="w-4 h-4" />;
        default:
            return <Square2StackIcon className="w-4 h-4" />;
    }
};

const getElementLabel = (element: LayoutElement): string => {
    if (element.name) return element.name;

    switch (element.type) {
        case 'block': return 'Block';
        case 'columns': return 'Columns';
        case 'stack': return 'Stack';
        case 'container': return 'Container';
        case 'section': return 'Section';
        case 'flex': return 'Flex';
        case 'grid': return 'Grid';
        case 'text': return 'Text';
        case 'heading':
            return element.content.type === 'heading' ? `H${element.content.data.level}` : 'Heading';
        case 'image': return 'Image';
        case 'divider': return 'Divider';
        case 'spacer': return 'Spacer';
        case 'code': return 'Code';
        case 'component':
            return element.content.type === 'component' ? element.content.data.componentKey : 'Component';
        default: return element.type;
    }
};

const TreeNode: React.FC<TreeNodeProps> = ({
    element,
    depth,
    selectedElementId,
    expandedIds,
    onSelect,
    onToggleExpand,
}) => {
    const isSelected = selectedElementId === element.id;
    const isExpanded = expandedIds.has(element.id);
    const hasChildren = element.children.length > 0;
    const nestingColor = getNestingColor(depth);

    return (
        <div>
            <div
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded transition-colors ${
                    isSelected
                        ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300'
                }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => onSelect(element.id)}
            >
                {/* Expand/collapse button */}
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(element.id);
                        }}
                        className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="w-3 h-3" />
                        ) : (
                            <ChevronRightIcon className="w-3 h-3" />
                        )}
                    </button>
                ) : (
                    <span className="w-4" /> // Spacer for alignment
                )}

                {/* Nesting color indicator */}
                <span className={`w-2 h-2 rounded-full ${nestingColor.label}`} />

                {/* Icon */}
                <span className="text-zinc-500 dark:text-zinc-400">
                    {getElementIcon(element.type)}
                </span>

                {/* Label */}
                <span className="text-sm truncate flex-1">
                    {getElementLabel(element)}
                </span>

                {/* Children count badge */}
                {hasChildren && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {element.children.length}
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {element.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            element={child}
                            depth={depth + 1}
                            selectedElementId={selectedElementId}
                            expandedIds={expandedIds}
                            onSelect={onSelect}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ElementTree: React.FC<ElementTreeProps> = ({
    document,
    selectedElementId,
    onSelect,
}) => {
    // Start with root expanded
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const ids = new Set<string>();
        ids.add(document.root.id);
        return ids;
    });

    const handleToggleExpand = (elementId: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(elementId)) {
                next.delete(elementId);
            } else {
                next.add(elementId);
            }
            return next;
        });
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-800">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Structure
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                <TreeNode
                    element={document.root}
                    depth={0}
                    selectedElementId={selectedElementId}
                    expandedIds={expandedIds}
                    onSelect={onSelect}
                    onToggleExpand={handleToggleExpand}
                />
            </div>
        </div>
    );
};

export default ElementTree;
