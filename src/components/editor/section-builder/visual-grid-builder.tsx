import React, {useState, useRef} from 'react';
import {GridCell, FieldAssignment, SectionField, SectionLayoutConfig} from "@/types/types";
import {Text} from "@/components/text";
import {Button} from "@/components/button";
import {PlusIcon, TrashIcon} from "@heroicons/react/24/outline";
import GridCellContent from './grid-cell-content';

interface VisualGridBuilderProps {
    layout: SectionLayoutConfig;
    activeTab: string;
    assignments: FieldAssignment[];
    pendingAssignments: { tempId: string; assignment: Omit<FieldAssignment, 'id'> }[];
    fields: SectionField[];
    onLayoutChange: (layout: SectionLayoutConfig) => void;
    onTabChange: (tabName: string) => void;
    onAssignmentUpdate: (assignmentId: string, changes: Partial<FieldAssignment>) => void;
    onAssignmentCreate: (fieldId: string, tempAssignmentId: string) => void;
    onAssignmentDelete: (assignmentId: string) => void;
}

interface DragSelection {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

const COLS = 12;

const VisualGridBuilder: React.FC<VisualGridBuilderProps> = ({
    layout,
    activeTab,
    assignments,
    pendingAssignments,
    fields,
    onLayoutChange,
    onAssignmentUpdate,
    onAssignmentCreate,
    onAssignmentDelete
}) => {
    const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [movingCellId, setMovingCellId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ row: number; col: number } | null>(null);
    const [dragOverPreview, setDragOverPreview] = useState<{ row_start: number; row_end: number; col_start: number; col_end: number } | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    const rows = layout.tabs?.[activeTab]?.rows || [];
    const numRows = rows.length;

    // Get all cells from all rows in this tab
    const allCells = rows.flatMap(row => row.cells);

    const handleAddRow = () => {
        const newRow = {
            id: `row-${Date.now()}`,
            cells: []
        };

        onLayoutChange({
            ...layout,
            tabs: {
                ...(layout.tabs || {}),
                [activeTab]: {
                    rows: [...rows, newRow]
                }
            }
        });
    };

    const handleDeleteRow = (rowIndex: number) => {
        if (rows.length === 1) {
            alert('Cannot delete the last row');
            return;
        }

        const updatedRows = rows.filter((_, index) => index !== rowIndex);

        // Update all cells that span past this row
        const adjustedRows = updatedRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => {
                // If cell starts after deleted row, shift it up
                if (cell.row_start > rowIndex) {
                    return {
                        ...cell,
                        row_start: cell.row_start - 1,
                        row_end: cell.row_end - 1
                    };
                }
                // If cell spans over deleted row, shrink it
                if (cell.row_start <= rowIndex && cell.row_end > rowIndex) {
                    return {
                        ...cell,
                        row_end: Math.max(cell.row_start + 1, cell.row_end - 1)
                    };
                }
                return cell;
            })
        }));

        onLayoutChange({
            ...layout,
            tabs: {
                ...(layout.tabs || {}),
                [activeTab]: {
                    rows: adjustedRows
                }
            }
        });
    };

    const checkOverlap = (newCell: { row_start: number; row_end: number; col_start: number; col_end: number }): boolean => {
        return allCells.some(cell => {
            // Check if rectangles overlap
            const rowOverlap = newCell.row_start < cell.row_end && newCell.row_end > cell.row_start;
            const colOverlap = newCell.col_start < cell.col_end && newCell.col_end > cell.col_start;
            return rowOverlap && colOverlap;
        });
    };

    const checkResizeOverlap = (cellId: string, newBounds: { row_start: number; row_end: number; col_start: number; col_end: number }): boolean => {
        // Check if the resized cell would overlap with any other cells (excluding itself)
        return allCells.some(cell => {
            if (cell.id === cellId) return false; // Don't check against itself

            const rowOverlap = newBounds.row_start < cell.row_end && newBounds.row_end > cell.row_start;
            const colOverlap = newBounds.col_start < cell.col_end && newBounds.col_end > cell.col_start;
            return rowOverlap && colOverlap;
        });
    };

    const handleGridDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const movingCellIdData = e.dataTransfer.types.includes('movingcell') ? movingCellId : null;

        if (movingCellIdData && gridRef.current) {
            const movingCell = allCells.find(c => c.id === movingCellIdData);
            if (!movingCell) return;

            // Calculate mouse position relative to grid
            const gridRect = gridRef.current.getBoundingClientRect();
            const relativeX = e.clientX - gridRect.left;
            const relativeY = e.clientY - gridRect.top;

            // Calculate which grid cell the mouse is in (0-based)
            const cellWidth = gridRect.width / COLS;
            const cellHeight = 80;
            const mouseCol = Math.floor(relativeX / cellWidth);  // 0-11
            const mouseRow = Math.floor(relativeY / cellHeight); // 0-based row

            // Apply offset if we have it (offset is where within the cell the user grabbed)
            const offsetRow = dragOffset?.row || 0;
            const offsetCol = dragOffset?.col || 0;

            // Calculate new top-left position (in 1-based for columns)
            const newRowStart = Math.max(0, mouseRow - offsetRow);
            const newColStart = Math.max(1, Math.min(COLS, (mouseCol - offsetCol) + 1));

            // Calculate new position (keeping same dimensions)
            const cellWidthSpan = movingCell.col_end - movingCell.col_start;
            const cellHeightSpan = movingCell.row_end - movingCell.row_start;

            const newRowEnd = newRowStart + cellHeightSpan;
            const newColEnd = newColStart + cellWidthSpan;

            // Check bounds
            if (newRowEnd <= numRows && newColEnd <= COLS + 1 && newRowStart >= 0 && newColStart >= 1) {
                const previewBounds = {
                    row_start: newRowStart,
                    row_end: newRowEnd,
                    col_start: newColStart,
                    col_end: newColEnd
                };

                // Only show preview if no overlap
                if (!checkResizeOverlap(movingCell.id, previewBounds)) {
                    setDragOverPreview(previewBounds);
                } else {
                    setDragOverPreview(null);
                }
            } else {
                setDragOverPreview(null);
            }
        }
    };

    const handleGridDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const movingCellIdData = e.dataTransfer.getData('movingCell');

        if (movingCellIdData && gridRef.current) {
            // Moving an existing cell
            const movingCell = allCells.find(c => c.id === movingCellIdData);
            if (!movingCell) {
                setDragOverPreview(null);
                return;
            }

            // Calculate mouse position relative to grid
            const gridRect = gridRef.current.getBoundingClientRect();
            const relativeX = e.clientX - gridRect.left;
            const relativeY = e.clientY - gridRect.top;

            // Calculate which grid cell the mouse is in (0-based)
            const cellWidth = gridRect.width / COLS;
            const cellHeight = 80;
            const mouseCol = Math.floor(relativeX / cellWidth);  // 0-11
            const mouseRow = Math.floor(relativeY / cellHeight); // 0-based row

            // Apply offset if we have it (where user grabbed the cell)
            const offsetRow = dragOffset?.row || 0;
            const offsetCol = dragOffset?.col || 0;

            // Calculate new top-left position (in 1-based for columns)
            const newRowStart = Math.max(0, mouseRow - offsetRow);
            const newColStart = Math.max(1, Math.min(COLS, (mouseCol - offsetCol) + 1)); // +1 for 1-based

            // Calculate new position (keeping same dimensions)
            const cellWidthSpan = movingCell.col_end - movingCell.col_start;
            const cellHeightSpan = movingCell.row_end - movingCell.row_start;

            const newRowEnd = newRowStart + cellHeightSpan;
            const newColEnd = newColStart + cellWidthSpan;

            // Check bounds
            if (newRowEnd > numRows || newColEnd > COLS + 1 || newRowStart < 0 || newColStart < 1) {
                setMovingCellId(null);
                setDragOffset(null);
                return; // Out of bounds
            }

            const newBounds = {
                row_start: newRowStart,
                row_end: newRowEnd,
                col_start: newColStart,
                col_end: newColEnd
            };

            // Check overlap (excluding the cell being moved)
            if (!checkResizeOverlap(movingCell.id, newBounds)) {
                handleCellUpdate(movingCell.id, newBounds);
            }

            setMovingCellId(null);
            setDragOffset(null);
            setDragOverPreview(null);
        }
    };

    const handleMouseDown = (row: number, col: number) => {
        // Check if clicking on existing cell
        // Note: col is 0-based (0-11), cell.col_start is 1-based (1-13)
        const clickedCell = allCells.find(cell =>
            row >= cell.row_start && row < cell.row_end &&
            (col + 1) >= cell.col_start && (col + 1) < cell.col_end
        );

        if (clickedCell) {
            // Don't start drawing on existing cells
            return;
        }

        setIsDragging(true);
        setDragSelection({
            startRow: row,
            startCol: col,
            endRow: row,
            endCol: col
        });
    };

    const handleMouseMove = (row: number, col: number) => {
        if (isDragging && dragSelection) {
            setDragSelection({
                ...dragSelection,
                endRow: row,
                endCol: col
            });
        }
    };

    const handleMouseUp = () => {
        if (isDragging && dragSelection) {
            const row_start = Math.min(dragSelection.startRow, dragSelection.endRow);
            const row_end = Math.max(dragSelection.startRow, dragSelection.endRow) + 1;
            const col_start = Math.min(dragSelection.startCol, dragSelection.endCol) + 1; // Convert to 1-based
            const col_end = Math.max(dragSelection.startCol, dragSelection.endCol) + 2; // Convert to 1-based and exclusive

            const newCell: GridCell = {
                id: `cell-${Date.now()}`,
                type: 'empty',
                row_start,
                row_end,
                col_start,
                col_end
            };

            // Check overlap
            if (!checkOverlap(newCell)) {
                // Find which row to add it to (use first row it spans)
                const targetRowIndex = row_start;
                const updatedRows = [...rows];

                if (!updatedRows[targetRowIndex]) {
                    updatedRows[targetRowIndex] = { id: `row-${targetRowIndex}`, cells: [] };
                }

                updatedRows[targetRowIndex].cells.push(newCell);

                onLayoutChange({
                    ...layout,
                    tabs: {
                        ...(layout.tabs || {}),
                        [activeTab]: {
                            rows: updatedRows
                        }
                    }
                });
            }
        }

        setIsDragging(false);
        setDragSelection(null);
    };

    const handleCellUpdate = (cellId: string, updates: Partial<GridCell>) => {
        const updatedRows = rows.map(row => ({
            ...row,
            cells: row.cells.map(cell =>
                cell.id === cellId ? { ...cell, ...updates } : cell
            )
        }));

        onLayoutChange({
            ...layout,
            tabs: {
                ...(layout.tabs || {}),
                [activeTab]: {
                    rows: updatedRows
                }
            }
        });
    };

    const handleCellDelete = (cellId: string) => {
        const cell = allCells.find(c => c.id === cellId);

        const updatedRows = rows.map(row => ({
            ...row,
            cells: row.cells.filter(c => c.id !== cellId)
        }));

        onLayoutChange({
            ...layout,
            tabs: {
                ...(layout.tabs || {}),
                [activeTab]: {
                    rows: updatedRows
                }
            }
        });

        // Track deletion if it's a field cell
        if (cell?.type === 'field' && cell.fieldAssignmentId) {
            onAssignmentDelete(cell.fieldAssignmentId);
        }
    };

    // Calculate drag preview
    const getDragPreview = () => {
        if (!dragSelection) return null;

        const row_start = Math.min(dragSelection.startRow, dragSelection.endRow);
        const row_end = Math.max(dragSelection.startRow, dragSelection.endRow) + 1;
        const col_start = Math.min(dragSelection.startCol, dragSelection.endCol);
        const col_end = Math.max(dragSelection.startCol, dragSelection.endCol) + 1;

        return { row_start, row_end, col_start, col_end };
    };

    const preview = getDragPreview();

    return (
        <div className="space-y-4">
            {numRows === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-lg">
                    <Text className="text-gray-500 dark:text-gray-400 mb-4">
                        No rows yet. Add a row to start building your layout.
                    </Text>
                    <Button onClick={handleAddRow} color="dark/white">
                        Add First Row
                    </Button>
                </div>
            ) : (
                <>
                    {/* 2D Grid with row controls */}
                    <div className="relative" style={{ paddingRight: rows.length > 1 ? '40px' : '0' }}>
                        <div
                            ref={gridRef}
                            className="relative border border-gray-300 dark:border-white/20 rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-900/30"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                            gridTemplateRows: `repeat(${numRows}, 80px)`,
                            gap: '0px'
                        }}
                        onMouseLeave={() => {
                            if (isDragging) {
                                setIsDragging(false);
                                setDragSelection(null);
                            }
                        }}
                        onDragOver={handleGridDragOver}
                        onDrop={handleGridDrop}
                        onDragLeave={() => setDragOverPreview(null)}
                    >
                        {/* Background grid cells for drawing */}
                        {Array.from({ length: numRows * COLS }).map((_, index) => {
                            const row = Math.floor(index / COLS);
                            const col = index % COLS;

                            // Check if this position is covered by an existing cell
                            const isCovered = allCells.some(cell =>
                                row >= cell.row_start && row < cell.row_end &&
                                (col + 1) >= cell.col_start && (col + 1) < cell.col_end
                            );

                            // Check if this grid square is part of drag selection (new cell drawing)
                            const isInDragPreview = preview &&
                                row >= preview.row_start && row < preview.row_end &&
                                col >= preview.col_start && col < preview.col_end;

                            // Check if this grid square is part of drag over preview (moving existing cell)
                            const isInMovePreview = dragOverPreview &&
                                row >= dragOverPreview.row_start && row < dragOverPreview.row_end &&
                                (col + 1) >= dragOverPreview.col_start && (col + 1) < dragOverPreview.col_end;

                            return (
                                <div
                                    key={`grid-${row}-${col}`}
                                    className={`border border-gray-200 dark:border-white/10 transition ${
                                        isCovered ? '' : 'cursor-crosshair hover:bg-gray-100 dark:hover:bg-white/5'
                                    } ${
                                        isInDragPreview ? 'bg-sky-200 dark:bg-sky-900/40' : ''
                                    } ${
                                        isInMovePreview ? 'bg-green-200 dark:bg-green-900/40 border-green-400 dark:border-green-600' : ''
                                    }`}
                                    style={{
                                        pointerEvents: isCovered ? 'none' : 'auto'
                                    }}
                                    onMouseDown={() => handleMouseDown(row, col)}
                                    onMouseMove={() => handleMouseMove(row, col)}
                                    onMouseUp={handleMouseUp}
                                />
                            );
                        })}

                        {/* Rendered cells (absolutely positioned on top) */}
                        {allCells.map((cell) => (
                            <div
                                key={cell.id}
                                className={movingCellId === cell.id ? 'opacity-50' : ''}
                                style={{
                                    position: 'absolute',
                                    top: `${cell.row_start * 80}px`,
                                    left: `${((cell.col_start - 1) / COLS) * 100}%`,
                                    width: `${((cell.col_end - cell.col_start) / COLS) * 100}%`,
                                    height: `${(cell.row_end - cell.row_start) * 80}px`,
                                    zIndex: 10,
                                    pointerEvents: 'auto',
                                    transition: movingCellId === cell.id ? 'opacity 0.2s' : 'none'
                                }}
                            >
                                <GridCellContent
                                    cell={cell}
                                    assignments={assignments}
                                    pendingAssignments={pendingAssignments}
                                    fields={fields}
                                    onUpdate={(updates) => handleCellUpdate(cell.id, updates)}
                                    onDelete={() => handleCellDelete(cell.id)}
                                    onAssignmentUpdate={onAssignmentUpdate}
                                    onAssignmentCreate={onAssignmentCreate}
                                    checkResizeOverlap={checkResizeOverlap}
                                    gridRef={gridRef}
                                    numRows={numRows}
                                    numCols={COLS}
                                    onCellDragStart={(cellId, offsetRow, offsetCol) => {
                                        setMovingCellId(cellId);
                                        setDragOffset({ row: offsetRow, col: offsetCol });
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Row delete buttons (absolutely positioned to the right of grid) */}
                    {rows.length > 1 && (
                        <div className="absolute right-0 top-0 flex flex-col" style={{ width: '40px' }}>
                            {rows.map((row, rowIndex) => (
                                <div
                                    key={row.id}
                                    style={{ height: '80px' }}
                                    className="flex items-center justify-center"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteRow(rowIndex)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                        title={`Delete row ${rowIndex + 1}`}
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>

                    <Button onClick={handleAddRow} color="dark/white">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Row
                    </Button>
                </>
            )}
        </div>
    );
};

export default VisualGridBuilder;
