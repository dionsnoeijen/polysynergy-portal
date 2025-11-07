import React, {useState} from 'react';
import {GridCell, FieldAssignment, SectionField} from "@/types/types";
import {Text} from "@/components/text";
import {TrashIcon, PencilIcon} from "@heroicons/react/24/outline";
import {Textarea} from "@/components/textarea";

interface GridCellContentProps {
    cell: GridCell;
    assignments: FieldAssignment[];
    pendingAssignments: { tempId: string; assignment: Omit<FieldAssignment, 'id'> }[];
    fields: SectionField[];
    onUpdate: (updates: Partial<GridCell>) => void;
    onDelete: () => void;
    onAssignmentUpdate: (assignmentId: string, changes: Partial<FieldAssignment>) => void;
    onAssignmentCreate: (fieldId: string, tempAssignmentId: string) => void;
    checkResizeOverlap: (cellId: string, newBounds: { row_start: number; row_end: number; col_start: number; col_end: number }) => boolean;
    gridRef: React.RefObject<HTMLDivElement>;
    numRows: number;
    numCols: number;
    onCellDragStart: (cellId: string, offsetRow: number, offsetCol: number) => void;
}

const GridCellContent: React.FC<GridCellContentProps> = ({
    cell,
    assignments,
    pendingAssignments,
    fields,
    onUpdate,
    onDelete,
    onAssignmentCreate,
    checkResizeOverlap,
    gridRef,
    numRows,
    numCols,
    onCellDragStart
}) => {
    const [isEditingText, setIsEditingText] = useState(!cell.content); // Auto-edit if empty
    const [textContent, setTextContent] = useState(cell.content || '');
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<'east' | 'west' | 'north' | 'south' | null>(null);

    // For field cells, find the assignment and field
    let assignment: FieldAssignment | undefined;
    let field: SectionField | undefined;

    if (cell.type === 'field' && cell.fieldAssignmentId) {
        assignment = assignments.find(a => a.id === cell.fieldAssignmentId);

        if (!assignment && cell.fieldAssignmentId.startsWith('temp-')) {
            const pendingItem = pendingAssignments.find(p => p.tempId === cell.fieldAssignmentId);
            if (pendingItem) {
                assignment = {
                    id: cell.fieldAssignmentId,
                    ...pendingItem.assignment
                };
            }
        }

        field = assignment ? fields.find(f => f.id === assignment!.field_id) : undefined;
    }

    const handleResizeStart = (e: React.MouseEvent, direction: 'east' | 'west' | 'north' | 'south') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
    };

    const handleResizeMove = React.useCallback((e: MouseEvent) => {
        if (!isResizing || !resizeDirection || !gridRef.current) return;

        const gridRect = gridRef.current.getBoundingClientRect();
        const cellWidth = gridRect.width / numCols;
        const cellHeight = 80; // Row height from visual-grid-builder

        if (resizeDirection === 'east') {
            // Resize right edge - change col_end
            const relativeX = e.clientX - gridRect.left;
            const colPosition = Math.round(relativeX / cellWidth);
            const newColEnd = Math.min(numCols + 1, Math.max(cell.col_start + 1, colPosition + 1));

            if (newColEnd === cell.col_end) return;

            const newBounds = {
                row_start: cell.row_start,
                row_end: cell.row_end,
                col_start: cell.col_start,
                col_end: newColEnd
            };

            if (!checkResizeOverlap(cell.id, newBounds)) {
                onUpdate({ col_end: newColEnd });
            }
        } else if (resizeDirection === 'west') {
            // Resize left edge - change col_start
            const relativeX = e.clientX - gridRect.left;
            const colPosition = Math.round(relativeX / cellWidth);
            const newColStart = Math.min(cell.col_end - 1, Math.max(1, colPosition + 1));

            if (newColStart === cell.col_start) return;

            const newBounds = {
                row_start: cell.row_start,
                row_end: cell.row_end,
                col_start: newColStart,
                col_end: cell.col_end
            };

            if (!checkResizeOverlap(cell.id, newBounds)) {
                onUpdate({ col_start: newColStart });
            }
        } else if (resizeDirection === 'south') {
            // Resize bottom edge - change row_end
            const relativeY = e.clientY - gridRect.top;
            const rowPosition = Math.round(relativeY / cellHeight);
            const newRowEnd = Math.min(numRows, Math.max(cell.row_start + 1, rowPosition));

            if (newRowEnd === cell.row_end) return;

            const newBounds = {
                row_start: cell.row_start,
                row_end: newRowEnd,
                col_start: cell.col_start,
                col_end: cell.col_end
            };

            if (!checkResizeOverlap(cell.id, newBounds)) {
                onUpdate({ row_end: newRowEnd });
            }
        } else if (resizeDirection === 'north') {
            // Resize top edge - change row_start
            const relativeY = e.clientY - gridRect.top;
            const rowPosition = Math.round(relativeY / cellHeight);
            const newRowStart = Math.min(cell.row_end - 1, Math.max(0, rowPosition));

            if (newRowStart === cell.row_start) return;

            const newBounds = {
                row_start: newRowStart,
                row_end: cell.row_end,
                col_start: cell.col_start,
                col_end: cell.col_end
            };

            if (!checkResizeOverlap(cell.id, newBounds)) {
                onUpdate({ row_start: newRowStart });
            }
        }
    }, [isResizing, resizeDirection, gridRef, numCols, numRows, cell, checkResizeOverlap, onUpdate]);

    const handleResizeEnd = React.useCallback(() => {
        setIsResizing(false);
        setResizeDirection(null);
    }, []);

    // Add/remove document listeners for resize
    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            return () => {
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    const handleCellDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('movingCell', cell.id);
        e.dataTransfer.effectAllowed = 'move';

        // Calculate offset where user clicked within the cell
        if (gridRef.current) {
            const gridRect = gridRef.current.getBoundingClientRect();
            const cellWidth = gridRect.width / numCols;
            const cellHeight = 80;

            // Get click position relative to grid
            const relativeX = e.clientX - gridRect.left;
            const relativeY = e.clientY - gridRect.top;

            // Calculate which grid cell the mouse is in
            const mouseCol = Math.floor(relativeX / cellWidth);
            const mouseRow = Math.floor(relativeY / cellHeight);

            // Calculate offset relative to cell's top-left corner
            const offsetCol = mouseCol - (cell.col_start - 1); // -1 because col_start is 1-based
            const offsetRow = mouseRow - cell.row_start;

            onCellDragStart(cell.id, offsetRow, offsetCol);
        } else {
            onCellDragStart(cell.id, 0, 0);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Check for field drop
            const fieldDataStr = e.dataTransfer.getData('field');
            if (fieldDataStr) {
                const fieldData = JSON.parse(fieldDataStr) as SectionField;
                const tempAssignmentId = `temp-${Date.now()}`;
                onUpdate({
                    type: 'field',
                    fieldAssignmentId: tempAssignmentId
                });
                onAssignmentCreate(fieldData.id, tempAssignmentId);
                return;
            }

            // Check for element drop
            const elementType = e.dataTransfer.getData('element');
            if (elementType === 'text') {
                onUpdate({ type: 'info_text', content: '', style: 'default' });
            } else if (elementType === 'divider') {
                onUpdate({ type: 'divider' });
            } else if (elementType === 'heading') {
                onUpdate({ type: 'heading', content: 'Heading' });
            }
        } catch (error) {
            console.error('Error dropping:', error);
        }
    };

    return (
        <div className="group relative h-full">
            {/* Resize Handles - shown on hover for all cell types including empty */}
            <>
                {/* East handle - resize right edge */}
                <div
                    className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-sky-500/30 transition z-20"
                    onMouseDown={(e) => handleResizeStart(e, 'east')}
                    title="Resize right"
                />
                {/* West handle - resize left edge */}
                <div
                    className="absolute top-0 left-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-sky-500/30 transition z-20"
                    onMouseDown={(e) => handleResizeStart(e, 'west')}
                    title="Resize left"
                />
                {/* South handle - resize bottom edge */}
                <div
                    className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-sky-500/30 transition z-20"
                    onMouseDown={(e) => handleResizeStart(e, 'south')}
                    title="Resize bottom"
                />
                {/* North handle - resize top edge */}
                <div
                    className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-sky-500/30 transition z-20"
                    onMouseDown={(e) => handleResizeStart(e, 'north')}
                    title="Resize top"
                />
            </>

        <div className="relative h-full">
            {/* EMPTY STATE - DROP ZONE */}
            {cell.type === 'empty' && (
                <div
                    draggable
                    onDragStart={handleCellDragStart}
                    className="h-full border-2 border-dashed border-gray-300 dark:border-white/20 rounded bg-white dark:bg-zinc-900 flex items-center justify-center p-4 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:border-sky-500 dark:hover:bg-sky-900/10 transition-colors cursor-move"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <Text className="text-sm text-gray-400 dark:text-gray-500 text-center">
                        Drop here
                    </Text>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Delete empty cell"
                    >
                        <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </button>
                </div>
            )}

            {/* FIELD TYPE */}
            {cell.type === 'field' && field && (
                <div
                    draggable
                    onDragStart={handleCellDragStart}
                    className="h-full p-3 border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-zinc-800 hover:border-sky-500 dark:hover:border-sky-400 transition flex flex-col cursor-move"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <Text className="font-medium text-sm truncate">{field.label}</Text>
                                {field.is_required && <span className="text-red-500 text-xs">*</span>}
                            </div>
                            <Text className="text-xs text-gray-500 dark:text-gray-400 truncate">{field.field_type_handle}</Text>
                        </div>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                            title="Remove"
                        >
                            <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* DIVIDER TYPE */}
            {cell.type === 'divider' && (
                <div
                    draggable
                    onDragStart={handleCellDragStart}
                    className="h-full flex items-center justify-center border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-zinc-800 hover:border-sky-500 dark:hover:border-sky-400 transition cursor-move"
                >
                    <div className="w-full px-4">
                        <div className="border-t-2 border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Remove"
                    >
                        <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </button>
                </div>
            )}

            {/* HEADING TYPE */}
            {cell.type === 'heading' && (
                <div
                    draggable={!isEditingText}
                    onDragStart={handleCellDragStart}
                    className="h-full p-3 border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-zinc-800 hover:border-sky-500 dark:hover:border-sky-400 transition flex items-center cursor-move"
                >
                    {isEditingText ? (
                        <div className="flex gap-2 items-center flex-1">
                            <input
                                type="text"
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="Enter heading..."
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onUpdate({ content: textContent });
                                        setIsEditingText(false);
                                    } else if (e.key === 'Escape') {
                                        setTextContent(cell.content || '');
                                        setIsEditingText(false);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    onUpdate({ content: textContent });
                                    setIsEditingText(false);
                                }}
                                className="px-3 py-2 text-xs bg-sky-500 text-white rounded hover:bg-sky-600 transition"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTextContent(cell.content || '');
                                    setIsEditingText(false);
                                }}
                                className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {cell.content || 'Heading'}
                            </h3>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingText(true)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition"
                                    title="Edit"
                                >
                                    <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </button>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    title="Remove"
                                >
                                    <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TEXT TYPE */}
            {cell.type === 'info_text' && (
                <div
                    draggable={!isEditingText}
                    onDragStart={handleCellDragStart}
                    className="h-full p-3 border border-gray-200 dark:border-white/10 rounded bg-white dark:bg-zinc-800 hover:border-sky-500 dark:hover:border-sky-400 transition flex flex-col cursor-move"
                >
                    {isEditingText ? (
                        <div className="flex flex-col gap-2 h-full">
                            <Textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="Enter text content (markdown supported)..."
                                rows={5}
                                className="flex-1"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onUpdate({ content: textContent });
                                        setIsEditingText(false);
                                    }}
                                    className="px-3 py-1 text-xs bg-sky-500 text-white rounded hover:bg-sky-600 transition"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTextContent(cell.content || '');
                                        setIsEditingText(false);
                                    }}
                                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <Text className="text-sm flex-1">{cell.content || 'Empty text'}</Text>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingText(true)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition"
                                        title="Edit"
                                    >
                                        <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDelete}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                        title="Remove"
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
};

export default GridCellContent;
