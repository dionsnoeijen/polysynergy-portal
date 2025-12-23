import React, { useMemo } from 'react';
import {
    LayoutElement,
    ElementStyles,
    canHaveChildren,
    Spacing,
    SizeValue,
    getNestingColor,
    GAP_VALUES,
} from './types';
import {
    TrashIcon,
    CodeBracketIcon,
    CubeIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import InlineMarkdownEditor from './inline-markdown-editor';

type CanvasElementProps = {
    element: LayoutElement;
    selectedElementId: string | null;
    dragOverId: string | null;
    dropPosition: 'before' | 'after' | 'inside' | null;
    depth: number;
    onSelect: (elementId: string | null) => void;
    onDelete: (elementId: string) => void;
    onDrop: (e: React.DragEvent, targetId: string, position: 'before' | 'after' | 'inside') => void;
    onDragOver: (e: React.DragEvent, elementId: string, position: 'before' | 'after' | 'inside') => void;
    onDragLeave: () => void;
    onEditCode: (element: LayoutElement) => void;
    onEditText?: (element: LayoutElement) => void;
    onSaveText?: (elementId: string, text: string) => void;
    editingElementId?: string | null;
};

// Convert spacing to CSS
const spacingToCSS = (spacing?: Spacing): React.CSSProperties => {
    if (!spacing) return {};
    return {
        paddingTop: typeof spacing.top === 'number' ? spacing.top : undefined,
        paddingRight: typeof spacing.right === 'number' ? spacing.right : undefined,
        paddingBottom: typeof spacing.bottom === 'number' ? spacing.bottom : undefined,
        paddingLeft: typeof spacing.left === 'number' ? spacing.left : undefined,
    };
};

// Convert size value to CSS
const sizeToCSS = (value?: SizeValue): string | number | undefined => {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    return value;
};

// Convert styles to CSS
const stylesToCSS = (styles: ElementStyles): React.CSSProperties => {
    const css: React.CSSProperties = {};

    // Display
    if (styles.display) css.display = styles.display;

    // Sizing
    if (styles.sizing) {
        css.width = sizeToCSS(styles.sizing.width);
        css.height = sizeToCSS(styles.sizing.height);
        css.minWidth = sizeToCSS(styles.sizing.minWidth);
        css.maxWidth = sizeToCSS(styles.sizing.maxWidth);
        css.minHeight = sizeToCSS(styles.sizing.minHeight);
        css.maxHeight = sizeToCSS(styles.sizing.maxHeight);
    }

    // Padding
    if (styles.padding) {
        Object.assign(css, spacingToCSS(styles.padding));
    }

    // Margin
    if (styles.margin) {
        if (typeof styles.margin.top === 'number') css.marginTop = styles.margin.top;
        if (typeof styles.margin.right === 'number') css.marginRight = styles.margin.right;
        if (typeof styles.margin.bottom === 'number') css.marginBottom = styles.margin.bottom;
        if (typeof styles.margin.left === 'number') css.marginLeft = styles.margin.left;
    }

    // Background
    if (styles.background?.color) css.backgroundColor = styles.background.color;

    // Border
    if (styles.border?.all) {
        css.borderWidth = styles.border.all.width;
        css.borderStyle = styles.border.all.style;
        css.borderColor = styles.border.all.color;
    }
    if (styles.border?.radius) {
        css.borderRadius = typeof styles.border.radius === 'number'
            ? styles.border.radius
            : undefined;
    }

    // Flex container
    if (styles.flex) {
        css.flexDirection = styles.flex.direction;
        css.flexWrap = styles.flex.wrap;
        css.justifyContent = styles.flex.justifyContent;
        css.alignItems = styles.flex.alignItems;
        css.gap = styles.flex.gap;
    }

    // Grid container
    if (styles.grid) {
        css.gridTemplateColumns = typeof styles.grid.columns === 'number'
            ? `repeat(${styles.grid.columns}, 1fr)`
            : styles.grid.columns;
        css.gridTemplateRows = styles.grid.rows;
        css.gap = styles.grid.gap;
    }

    // Typography
    if (styles.typography) {
        css.fontSize = styles.typography.fontSize;
        css.fontWeight = styles.typography.fontWeight;
        css.lineHeight = styles.typography.lineHeight;
        css.textAlign = styles.typography.textAlign;
        css.color = styles.typography.color;
    }

    return css;
};

const CanvasElement: React.FC<CanvasElementProps> = ({
    element,
    selectedElementId,
    dragOverId,
    dropPosition,
    depth,
    onSelect,
    onDelete,
    onDrop,
    onDragOver,
    onDragLeave,
    onEditCode,
    onEditText,
    onSaveText,
    editingElementId,
}) => {
    const isSelected = selectedElementId === element.id;
    const isDragOver = dragOverId === element.id;
    const canNest = canHaveChildren(element.type);
    const isRoot = depth === 0;
    const isColumns = element.type === 'columns';
    const nestingColor = getNestingColor(depth);

    // For columns, don't apply grid styles to wrapper - they go on content div
    const elementStyles = useMemo(() => {
        if (isColumns) {
            // Only apply non-grid styles to wrapper for columns
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { display, grid, flex, ...rest } = element.styles;
            return stylesToCSS(rest);
        }
        return stylesToCSS(element.styles);
    }, [element.styles, isColumns]);

    // Get element label based on type
    const getLabel = () => {
        switch (element.type) {
            case 'block': return element.name || 'Block';
            case 'columns': return 'Columns';
            case 'stack': return 'Stack';
            // Legacy types
            case 'container': return 'Container';
            case 'section': return 'Section';
            case 'flex': return 'Flex';
            case 'grid': return 'Grid';
            // Content types
            case 'heading':
                return element.content.type === 'heading' ? `H${element.content.data.level}` : 'Heading';
            case 'text': return 'Text';
            case 'image': return 'Image';
            case 'divider': return 'Divider';
            case 'spacer': return 'Spacer';
            case 'code': return 'Code';
            case 'component':
                return element.content.type === 'component' ? element.content.data.componentKey : 'Component';
            default: return element.type;
        }
    };

    // Handle double-click for inline editing
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (element.type === 'text' || element.type === 'heading') {
            onEditText?.(element);
        }
    };

    // Render element content
    const renderContent = () => {
        switch (element.type) {
            case 'heading':
                if (element.content.type === 'heading') {
                    const HeadingTag = `h${element.content.data.level}` as keyof JSX.IntrinsicElements;
                    return (
                        <HeadingTag
                            className="m-0 cursor-text"
                            onDoubleClick={handleDoubleClick}
                        >
                            {element.content.data.text || 'Double-click to edit...'}
                        </HeadingTag>
                    );
                }
                return null;

            case 'text':
                if (element.content.type === 'text') {
                    const isEditing = editingElementId === element.id;
                    return (
                        <InlineMarkdownEditor
                            content={element.content.data.text || ''}
                            isEditing={isEditing}
                            onStartEdit={() => onEditText?.(element)}
                            onSave={(text) => {
                                onSaveText?.(element.id, text);
                                onEditText?.(element); // Close editing after save
                            }}
                            onCancel={() => onEditText?.(element)}
                            placeholder="Double-click to edit markdown..."
                        />
                    );
                }
                return null;

            case 'image':
                if (element.content.type === 'image' && element.content.data.src) {
                    return (
                        <img
                            src={element.content.data.src}
                            alt={element.content.data.alt || ''}
                            className="max-w-full h-auto"
                        />
                    );
                }
                return (
                    <div className="flex items-center justify-center h-24 bg-zinc-100 dark:bg-zinc-700 rounded">
                        <PhotoIcon className="w-8 h-8 text-zinc-400" />
                    </div>
                );

            case 'divider':
                return <hr className="w-full border-zinc-200 dark:border-zinc-600" />;

            case 'spacer':
                if (element.content.type === 'spacer') {
                    return (
                        <div
                            className="flex items-center justify-center text-xs text-zinc-400"
                            style={{ height: element.content.data.size }}
                        >
                            {element.content.data.size}px
                        </div>
                    );
                }
                return null;

            case 'code':
                return (
                    <div
                        className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-700 rounded text-sm cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditCode(element);
                        }}
                    >
                        <CodeBracketIcon className="w-5 h-5 text-zinc-500" />
                        <span className="text-zinc-600 dark:text-zinc-300 font-mono text-xs">
                            {element.content.type === 'code' && element.content.data.code
                                ? element.content.data.code.substring(0, 50) + (element.content.data.code.length > 50 ? '...' : '')
                                : 'Click to edit code'}
                        </span>
                    </div>
                );

            case 'component':
                return (
                    <div className="flex items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                        <CubeIcon className="w-5 h-5 text-purple-500" />
                        <span className="text-purple-700 dark:text-purple-300 font-medium">
                            {element.content.type === 'component' ? element.content.data.componentKey : 'Component'}
                        </span>
                    </div>
                );

            default:
                return null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(element.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(element.id);
    };

    // Drop zones
    const renderDropZone = (position: 'before' | 'after' | 'inside') => {
        const isActive = isDragOver && dropPosition === position;
        const shouldShow = canNest || position !== 'inside';

        if (!shouldShow) return null;

        if (position === 'inside' && canNest) {
            return (
                <div
                    className={`absolute inset-0 pointer-events-none border-2 border-dashed rounded transition-colors ${
                        isActive ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-900/20' : 'border-transparent'
                    }`}
                />
            );
        }

        return null;
    };

    // Handle drag start for moving existing elements
    const handleDragStart = (e: React.DragEvent) => {
        if (isRoot) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        e.dataTransfer.setData('application/layout-element-move', JSON.stringify({ elementId: element.id }));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={`relative group w-full ${isRoot ? '' : 'my-1'}`}
            draggable={!isRoot}
            onDragStart={handleDragStart}
            onClick={handleClick}
            onDragOver={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const threshold = rect.height * 0.25;

                let position: 'before' | 'after' | 'inside' = 'inside';
                if (!isRoot) {
                    if (y < threshold) position = 'before';
                    else if (y > rect.height - threshold) position = 'after';
                    else if (canNest) position = 'inside';
                    else position = 'after';
                }

                onDragOver(e, element.id, position);
            }}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, element.id, dropPosition || 'inside')}
        >
            {/* Before drop indicator */}
            {isDragOver && dropPosition === 'before' && !isRoot && (
                <div className="absolute -top-1 left-0 right-0 h-1 bg-sky-400 rounded-full z-10" />
            )}

            {/* Element wrapper with nesting color */}
            <div
                className={`relative transition-all border-2 w-full ${
                    isSelected
                        ? `${nestingColor.border} ring-2 ring-offset-1 ring-sky-500`
                        : `border-transparent hover:${nestingColor.border}`
                } ${canNest ? `min-h-[60px] ${nestingColor.bg}` : ''} rounded-lg`}
                style={elementStyles}
            >
                {/* Element label with nesting color */}
                <div
                    className={`absolute -top-6 left-2 text-xs px-2 py-1 rounded font-medium z-10 flex items-center gap-1.5 transition-opacity ${
                        isSelected
                            ? `${nestingColor.label} text-white`
                            : 'bg-zinc-700 text-white opacity-0 group-hover:opacity-100'
                    }`}
                >
                    {getLabel()}
                </div>

                {/* Delete button */}
                {!isRoot && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className={`absolute -top-6 right-2 px-2 py-1 rounded text-white z-10 transition-opacity ${
                            isSelected
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-zinc-700 hover:bg-red-500 opacity-0 group-hover:opacity-100'
                        }`}
                    >
                        <TrashIcon className="w-3 h-3" />
                    </button>
                )}

                {/* Inside drop zone */}
                {renderDropZone('inside')}

                {/* Content - no extra padding, layout is rendered exactly as configured */}
                {isColumns ? (
                    // Columns: use grid layout
                    <div
                        className="w-full"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${element.children.length || 2}, 1fr)`,
                            gap: element.content.type === 'columns' ? GAP_VALUES[element.content.data.config.gap] : 16,
                        }}
                    >
                        {element.children.map((child) => (
                            <CanvasElement
                                key={child.id}
                                element={child}
                                selectedElementId={selectedElementId}
                                dragOverId={dragOverId}
                                dropPosition={dropPosition}
                                depth={depth + 1}
                                onSelect={onSelect}
                                onDelete={onDelete}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onEditCode={onEditCode}
                                onEditText={onEditText}
                                onSaveText={onSaveText}
                                editingElementId={editingElementId}
                            />
                        ))}
                    </div>
                ) : canNest ? (
                    element.children.map((child) => (
                        <CanvasElement
                            key={child.id}
                            element={child}
                            selectedElementId={selectedElementId}
                            dragOverId={dragOverId}
                            dropPosition={dropPosition}
                            depth={depth + 1}
                            onSelect={onSelect}
                            onDelete={onDelete}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onEditCode={onEditCode}
                            onEditText={onEditText}
                            onSaveText={onSaveText}
                            editingElementId={editingElementId}
                        />
                    ))
                ) : (
                    renderContent()
                )}
            </div>

            {/* After drop indicator */}
            {isDragOver && dropPosition === 'after' && !isRoot && (
                <div className="absolute -bottom-1 left-0 right-0 h-1 bg-sky-400 rounded-full z-10" />
            )}
        </div>
    );
};

export default CanvasElement;
