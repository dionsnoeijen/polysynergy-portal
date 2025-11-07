import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Heading } from '@/components/heading';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { PencilIcon, TrashIcon, PlusIcon, ArrowRightCircleIcon, ArrowPathIcon, CodeBracketIcon, ArrowDownTrayIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import useSectionsStore from '@/stores/sectionsStore';
import useSectionDataStore, { FilterOperator } from '@/stores/sectionDataStore';
import SectionRecordForm from '@/components/sections/section-record-form';
import JsonEditorModal from '@/components/sections/json-editor-modal';
import ExportModal from '@/components/sections/export-modal';
import { updateTableColumnOrder, fetchSectionRecords } from '@/api/sectionsApi';
import useEditorStore from '@/stores/editorStore';
import { ConfirmAlert } from '@/components/confirm-alert';

const SectionDataTables: React.FC = () => {
    const sections = useSectionsStore((state) => state.sections);
    const fetchSections = useSectionsStore((state) => state.fetchSections);
    const isFetchingSections = useSectionsStore((state) => state.isFetching);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);

    const activeSectionId = useSectionDataStore((state) => state.activeSectionId);
    const setActiveSectionId = useSectionDataStore((state) => state.setActiveSectionId);
    const tableConfig = useSectionDataStore((state) => state.tableConfig);
    const fetchTableConfig = useSectionDataStore((state) => state.fetchTableConfig);
    const fetchRecords = useSectionDataStore((state) => state.fetchRecords);
    const records = useSectionDataStore((state) => state.records);
    const isFetchingRecords = useSectionDataStore((state) => state.isFetchingRecords);
    const total = useSectionDataStore((state) => state.total);
    const offset = useSectionDataStore((state) => state.offset);
    const limit = useSectionDataStore((state) => state.limit);
    const hasMore = useSectionDataStore((state) => state.hasMore);
    const setPage = useSectionDataStore((state) => state.setPage);
    const setSorting = useSectionDataStore((state) => state.setSorting);
    const orderBy = useSectionDataStore((state) => state.orderBy);
    const orderDirection = useSectionDataStore((state) => state.orderDirection);
    const searchQuery = useSectionDataStore((state) => state.searchQuery);
    const setSearch = useSectionDataStore((state) => state.setSearch);
    const filters = useSectionDataStore((state) => state.filters);
    const setFilter = useSectionDataStore((state) => state.setFilter);
    const clearFilters = useSectionDataStore((state) => state.clearFilters);
    const openCreateForm = useSectionDataStore((state) => state.openCreateForm);
    const openEditForm = useSectionDataStore((state) => state.openEditForm);
    const deleteRecord = useSectionDataStore((state) => state.deleteRecord);
    const createRecord = useSectionDataStore((state) => state.createRecord);
    const updateRecord = useSectionDataStore((state) => state.updateRecord);
    const refreshRecords = useSectionDataStore((state) => state.refreshRecords);
    const isFormOpen = useSectionDataStore((state) => state.isFormOpen);
    const editingRecordId = useSectionDataStore((state) => state.editingRecordId);

    const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
    const [formWidth, setFormWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    const [draggingColumnHandle, setDraggingColumnHandle] = useState<string | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const [resizeStartX, setResizeStartX] = useState<number>(0);
    const [resizeStartWidth, setResizeStartWidth] = useState<number>(0);
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
    const [filterDropdownPosition, setFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);
    const [editingCell, setEditingCell] = useState<{ recordId: string; fieldHandle: string } | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [newRowData, setNewRowData] = useState<Record<string, string>>({});
    const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

    // Cache for related records: { sectionId: { recordId: record } }
    const [relatedRecordsCache, setRelatedRecordsCache] = useState<Record<string, Record<string, Record<string, unknown>>>>({});

    // JSON viewer modal state
    const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
    const [jsonViewerValue, setJsonViewerValue] = useState<object | null>(null);

    // Export modal state
    const [exportModalOpen, setExportModalOpen] = useState(false);

    // Get active section's vectorization config
    const activeSectionVectorization = useMemo(() => {
        if (!activeSectionId) return null;
        const activeSection = sections.find(s => s.id === activeSectionId);
        return activeSection?.vectorization_config || null;
    }, [activeSectionId, sections]);

    // Load sections on mount
    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    // When a section is selected, load its table config and records
    useEffect(() => {
        if (activeSectionId) {
            fetchTableConfig(activeSectionId);
            fetchRecords(activeSectionId);
        }
    }, [activeSectionId, fetchTableConfig, fetchRecords]);

    // Initialize column order, widths, and hidden columns when tableConfig changes
    useEffect(() => {
        if (tableConfig?.columns && activeSectionId) {
            // Find the active section to get its layout_config
            const activeSection = sections.find(s => s.id === activeSectionId);
            const savedOrder = activeSection?.layout_config?.table_columns?.order;
            const savedWidths = activeSection?.layout_config?.table_columns?.widths || {};
            const savedHidden = activeSection?.layout_config?.table_columns?.hidden || [];

            if (savedOrder && savedOrder.length > 0) {
                // Use saved order
                setColumnOrder(savedOrder);
            } else {
                // Use default order from tableConfig
                setColumnOrder(tableConfig.columns.map(col => col.field_handle));
            }

            // Merge default widths with custom widths
            const widths: Record<string, number> = {};
            tableConfig.columns.forEach(col => {
                widths[col.field_handle] = savedWidths[col.field_handle] ?? col.width;
            });
            setColumnWidths(widths);

            // Set hidden columns
            setHiddenColumns(savedHidden);
        }
    }, [tableConfig, activeSectionId, sections]);

    // Auto-select first section if none selected
    useEffect(() => {
        if (sections.length > 0 && !activeSectionId) {
            setActiveSectionId(sections[0].id);
        }
    }, [sections, activeSectionId, setActiveSectionId]);

    // Sync searchInput with searchQuery from store when section changes
    useEffect(() => {
        setSearchInput(searchQuery);
    }, [activeSectionId, searchQuery]);

    // Debounce search input
    useEffect(() => {
        const timerId = setTimeout(() => {
            if (searchInput !== searchQuery) {
                setSearch(searchInput);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(timerId);
    }, [searchInput, searchQuery, setSearch]);

    // Fetch related records for relation columns
    useEffect(() => {
        if (!tableConfig?.columns || !activeProjectId) return;

        const relationColumns = tableConfig.columns.filter(col =>
            col.type === 'relation_many_to_one' ||
            col.type === 'relation_one_to_many' ||
            col.type === 'relation_many_to_many'
        );

        relationColumns.forEach(async (column) => {
            const cellConfig = column.cell_config?.props as { relatedSection?: string; displayField?: string } | undefined;
            const relatedSectionId = cellConfig?.relatedSection;

            if (!relatedSectionId) return;

            // Skip if already cached
            if (relatedRecordsCache[relatedSectionId]) return;

            try {
                const response = await fetchSectionRecords(relatedSectionId, activeProjectId, {
                    limit: 1000, // Fetch more for cache
                    offset: 0
                });

                // Build cache: { recordId: record }
                const cache = response.records.reduce((acc, record) => {
                    acc[record.id as string] = record;
                    return acc;
                }, {} as Record<string, Record<string, unknown>>);

                setRelatedRecordsCache(prev => ({
                    ...prev,
                    [relatedSectionId]: cache
                } as Record<string, Record<string, Record<string, unknown>>>));
            } catch (error) {
                console.error('Failed to fetch related records:', error);
            }
        });
    }, [tableConfig, activeProjectId, relatedRecordsCache]);

    const handleTabClick = (sectionId: string) => {
        setActiveSectionId(sectionId);
    };

    const handleSort = (fieldHandle: string) => {
        // Toggle direction if clicking same column, otherwise default to DESC
        const newDirection = orderBy === fieldHandle && orderDirection === 'DESC' ? 'ASC' : 'DESC';
        setSorting(fieldHandle, newDirection);
    };

    const handlePreviousPage = () => {
        const newOffset = Math.max(0, offset - limit);
        setPage(newOffset);
    };

    const handleNextPage = () => {
        if (hasMore) {
            setPage(offset + limit);
        }
    };

    const handleRelationClick = (relatedSectionId: string, relatedRecordId: string) => {
        // Navigate to the related section
        setActiveSectionId(relatedSectionId);
        // Open the record in edit mode
        openEditForm(relatedRecordId);
    };

    const handleDeleteClick = (recordId: string) => {
        setRecordToDelete(recordId);
    };

    const handleDeleteConfirm = async () => {
        if (!activeSectionId || !recordToDelete) return;

        setDeletingRecordId(recordToDelete);
        try {
            await deleteRecord(activeSectionId, recordToDelete);
            await refreshRecords();
        } catch (error) {
            console.error('Failed to delete record:', error);
            alert('Failed to delete record');
        } finally {
            setDeletingRecordId(null);
            setRecordToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setRecordToDelete(null);
    };

    const handleCellDoubleClick = (recordId: string, fieldHandle: string, currentValue: unknown) => {
        setEditingCell({ recordId, fieldHandle });
        setEditingValue(String(currentValue ?? ''));
    };

    const handleCellEditSave = async () => {
        if (!editingCell || !activeSectionId) return;

        const { recordId, fieldHandle } = editingCell;

        try {
            await updateRecord(activeSectionId, recordId, {
                [fieldHandle]: editingValue
            });
            await refreshRecords();
        } catch (error) {
            console.error('Failed to update cell:', error);
            alert('Failed to update cell');
        } finally {
            setEditingCell(null);
            setEditingValue('');
        }
    };

    const handleCellEditCancel = () => {
        setEditingCell(null);
        setEditingValue('');
    };

    const handleCellEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCellEditSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCellEditCancel();
        }
    };

    const handleStartAddingRow = () => {
        setIsAddingRow(true);
        setNewRowData({});
    };

    const handleNewRowCellChange = (fieldHandle: string, value: string) => {
        setNewRowData(prev => ({
            ...prev,
            [fieldHandle]: value
        }));
    };

    const handleSaveNewRow = async () => {
        if (!activeSectionId) return;

        // Check if at least one field has a value
        const hasValue = Object.values(newRowData).some(v => v.trim() !== '');
        if (!hasValue) {
            setIsAddingRow(false);
            setNewRowData({});
            return;
        }

        try {
            await createRecord(activeSectionId, newRowData);
            await refreshRecords();
            setIsAddingRow(false);
            setNewRowData({});
        } catch (error) {
            console.error('Failed to create record:', error);
            alert('Failed to create record');
        }
    };

    const handleCancelAddingRow = () => {
        setIsAddingRow(false);
        setNewRowData({});
    };

    const handleNewRowKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveNewRow();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelAddingRow();
        }
    };

    // Column drag handlers
    const handleColumnDragStart = (e: React.DragEvent, fieldHandle: string) => {
        setDraggingColumnHandle(fieldHandle);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('columnHandle', fieldHandle);
    };

    const handleColumnDragOver = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTargetIndex(targetIndex);
    };

    const handleColumnDrop = async (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();

        const draggedHandle = e.dataTransfer.getData('columnHandle');
        if (!draggedHandle || !activeSectionId || !activeProjectId) return;

        // Build full order including new columns not yet in saved order
        const allColumnHandles = sortedColumns.map(col => col.field_handle);
        const currentIndex = allColumnHandles.indexOf(draggedHandle);

        if (currentIndex === -1 || currentIndex === targetIndex) {
            setDraggingColumnHandle(null);
            setDropTargetIndex(null);
            return;
        }

        // Reorder columns using the full list
        const newOrder = [...allColumnHandles];
        newOrder.splice(currentIndex, 1);
        newOrder.splice(targetIndex, 0, draggedHandle);

        setColumnOrder(newOrder);
        setDraggingColumnHandle(null);
        setDropTargetIndex(null);

        // Save new order to backend
        try {
            await updateTableColumnOrder(activeSectionId, activeProjectId, newOrder, hiddenColumns, columnWidths);
            // Refresh sections to get updated layout_config
            await fetchSections();
        } catch (error) {
            console.error('Failed to save column order:', error);
            alert('Failed to save column order');
            // Revert to previous order on error
            setColumnOrder(columnOrder);
        }
    };

    const handleColumnDragEnd = () => {
        setDraggingColumnHandle(null);
        setDropTargetIndex(null);
    };

    // Column resize handlers
    const handleColumnResizeStart = (e: React.MouseEvent, fieldHandle: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(fieldHandle);
        setResizeStartX(e.clientX);
        setResizeStartWidth(columnWidths[fieldHandle] || 20);
    };

    // Column visibility toggle
    const handleToggleColumn = async (fieldHandle: string) => {
        if (!activeSectionId || !activeProjectId) return;

        const newHidden = hiddenColumns.includes(fieldHandle)
            ? hiddenColumns.filter(h => h !== fieldHandle)
            : [...hiddenColumns, fieldHandle];

        setHiddenColumns(newHidden);

        // Save to backend
        try {
            await updateTableColumnOrder(activeSectionId, activeProjectId, columnOrder, newHidden, columnWidths);
            await fetchSections();
        } catch (error) {
            console.error('Failed to save column visibility:', error);
            // Revert on error
            setHiddenColumns(hiddenColumns);
        }
    };

    const startResizing = () => {
        setIsResizing(true);
    };

    // Handle form resize logic
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            // Min width 300px, max width 1200px
            setFormWidth(Math.min(Math.max(newWidth, 300), 1200));
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Close column menu on click outside
    useEffect(() => {
        if (!showColumnMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.relative')) {
                setShowColumnMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnMenu]);

    // Close filter dropdown on click outside
    useEffect(() => {
        if (!openFilterDropdown) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if click is outside the filter dropdown and not on a filter button
            const isFilterButton = target.closest('button[title="Filter column"]');
            const isFilterDropdown = target.closest('.fixed.z-\\[100\\]');

            if (!isFilterButton && !isFilterDropdown) {
                setOpenFilterDropdown(null);
                setFilterDropdownPosition(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openFilterDropdown]);

    // Handle column resize logic
    useEffect(() => {
        if (!resizingColumn) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartX;
            // Convert pixel delta to percentage (rough estimate based on table width)
            const tableWidth = 1000; // Approximate table width, adjust as needed
            const deltaPercent = (deltaX / tableWidth) * 100;
            const newWidth = Math.max(5, Math.min(50, resizeStartWidth + deltaPercent)); // Min 5%, max 50%

            setColumnWidths(prev => ({
                ...prev,
                [resizingColumn]: newWidth
            }));
        };

        const handleMouseUp = async () => {
            if (!activeSectionId || !activeProjectId) {
                setResizingColumn(null);
                return;
            }

            // Save new widths to backend
            try {
                await updateTableColumnOrder(
                    activeSectionId,
                    activeProjectId,
                    columnOrder,
                    [],
                    columnWidths
                );
                await fetchSections();
            } catch (error) {
                console.error('Failed to save column width:', error);
            }

            setResizingColumn(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn, resizeStartX, resizeStartWidth, activeSectionId, activeProjectId, columnOrder, columnWidths, fetchSections]);

    // Sort columns based on columnOrder and filter out hidden columns (before early returns)
    const columns = tableConfig?.columns || [];

    // Build sorted columns: use saved order + append any new columns not in the order
    const sortedColumns = columnOrder.length > 0
        ? [
            // First: columns in saved order
            ...columnOrder
                .map(handle => columns.find(col => col.field_handle === handle))
                .filter((col): col is NonNullable<typeof col> => col !== undefined)
                .filter(col => !hiddenColumns.includes(col.field_handle)),
            // Then: new columns not yet in saved order
            ...columns
                .filter(col => !columnOrder.includes(col.field_handle))
                .filter(col => !hiddenColumns.includes(col.field_handle))
        ]
        : columns.filter(col => !hiddenColumns.includes(col.field_handle));

    // Client-side filtering (temporary until backend supports filters)
    const filteredRecords = useMemo(() => {
        if (Object.keys(filters).length === 0) return records;

        return records.filter(record => {
            // All filters must match (AND logic)
            return Object.entries(filters).every(([fieldHandle, filter]) => {
                const value = record[fieldHandle];
                const filterValue = filter.value;

                switch (filter.operator) {
                    case 'contains':
                        return String(value || '').toLowerCase().includes((filterValue || '').toLowerCase());
                    case 'equals':
                        return String(value) === filterValue;
                    case 'not_equals':
                        return String(value) !== filterValue;
                    case 'gt':
                        return Number(value) > Number(filterValue);
                    case 'lt':
                        return Number(value) < Number(filterValue);
                    case 'gte':
                        return Number(value) >= Number(filterValue);
                    case 'lte':
                        return Number(value) <= Number(filterValue);
                    case 'is_empty':
                        return value === null || value === undefined || value === '';
                    case 'is_not_empty':
                        return value !== null && value !== undefined && value !== '';
                    case 'is_before':
                        return new Date(String(value)) < new Date(filterValue);
                    case 'is_after':
                        return new Date(String(value)) > new Date(filterValue);
                    default:
                        return true;
                }
            });
        });
    }, [records, filters]);

    if (isFetchingSections) {
        return (
            <div className="p-6">
                <Text>Loading sections...</Text>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <div className="p-6">
                <Heading>Sections</Heading>
                <Text className="mt-4">No sections found. Create a section first.</Text>
            </div>
        );
    }

    // Helper function to format cell values
    const formatCellValue = (value: unknown, column: { type: string; field_handle: string; cell_config: { component: string; props: Record<string, unknown> } }): string => {
        if (value === null || value === undefined) return '-';

        // Handle JSON/JSONB fields - show compact JSON representation
        if (column.type === 'json' || column.cell_config.component === 'JsonCell') {
            if (typeof value === 'object' && value !== null) {
                // Show compact JSON representation
                const jsonStr = JSON.stringify(value);
                return jsonStr.length > 50
                    ? `${jsonStr.substring(0, 47)}...`
                    : jsonStr;
            }
            return String(value);
        }

        // Handle select fields - show label instead of value
        if (column.type === 'select') {
            // Parse options from either array or comma-separated string
            const rawOptions = column.cell_config.props.options;
            let options: Array<{value: string; label: string}> = [];

            if (Array.isArray(rawOptions)) {
                options = rawOptions as Array<{value: string; label: string}>;
            } else if (typeof rawOptions === 'string' && rawOptions.length > 0) {
                options = rawOptions.split(',').map(opt => {
                    const trimmed = opt.trim();
                    return { value: trimmed, label: trimmed };
                });
            }

            if (options.length > 0 && value) {
                const option = options.find(opt => opt.value === value);
                if (option) {
                    return option.label;
                }
            }
            return String(value);
        }

        // Handle multi-select fields - show labels as comma-separated list
        if (column.type === 'multi_select' || column.cell_config.component === 'TagsCell') {
            if (Array.isArray(value)) {
                // Parse options from either array or comma-separated string
                const rawOptions = column.cell_config.props.options;
                let options: Array<{value: string; label: string}> = [];

                if (Array.isArray(rawOptions)) {
                    options = rawOptions as Array<{value: string; label: string}>;
                } else if (typeof rawOptions === 'string' && rawOptions.length > 0) {
                    options = rawOptions.split(',').map(opt => {
                        const trimmed = opt.trim();
                        return { value: trimmed, label: trimmed };
                    });
                }

                const labels = value.map(val => {
                    const option = options.find(opt => opt.value === val);
                    return option ? option.label : val;
                });
                return labels.join(', ');
            }
            return '-';
        }

        // Handle relation fields - show display field from related record
        if (column.type === 'relation_many_to_one' || column.type === 'relation_one_to_many' || column.type === 'relation_many_to_many') {
            const cellConfig = column.cell_config.props as { relatedSection?: string; displayField?: string };
            const relatedSectionId = cellConfig?.relatedSection;
            const displayField = cellConfig?.displayField || 'title';

            if (relatedSectionId && relatedRecordsCache[relatedSectionId]) {
                const relatedRecord = relatedRecordsCache[relatedSectionId][value as string];
                if (relatedRecord) {
                    return String(relatedRecord[displayField] || relatedRecord.id);
                }
            }
            // Fallback to UUID if not found in cache
            const str = String(value);
            return str.length > 8 ? `${str.substring(0, 8)}...` : str;
        }

        // Handle other cell component types
        switch (column.cell_config.component) {
            case 'DateTimeCell': {
                try {
                    const date = new Date(value as string);
                    const format = column.cell_config.props.format as string;
                    if (format === 'datetime') {
                        return date.toLocaleString();
                    } else if (format === 'date') {
                        return date.toLocaleDateString();
                    }
                    return date.toLocaleString();
                } catch {
                    return String(value);
                }
            }
            case 'UUIDCell': {
                const format = column.cell_config.props.format as string;
                if (format === 'short') {
                    const str = String(value);
                    return str.length > 8 ? `${str.substring(0, 8)}...` : str;
                }
                return String(value);
            }
            case 'TextCell':
            default:
                return String(value);
        }
    };

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return (
        <div className="flex h-full overflow-hidden">
            {/* Table Container */}
            <div className={`flex flex-col min-w-0 ${isFormOpen ? 'flex-1' : 'w-full'} transition-all`}>
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <div className="flex gap-2 px-6 -mb-px overflow-x-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => handleTabClick(section.id)}
                            className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                activeSectionId === section.id
                                    ? 'border-sky-500 dark:border-white text-sky-500 dark:text-white font-medium'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            {section.label}
                            {section.vectorization_stats?.enabled && (
                                <span
                                    className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    title={`Vector search enabled: ${section.vectorization_stats.vectorization_percentage}% indexed`}
                                >
                                    🔍 {section.vectorization_stats.vectorization_percentage}%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 min-w-0">
                {isFetchingRecords ? (
                    <Text>Loading records...</Text>
                ) : (
                    <>
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {/* Search input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search..."
                                        className="pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                    />
                                    <svg
                                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {searchInput && (
                                        <button
                                            onClick={() => setSearchInput('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Columns button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        Columns ({sortedColumns.length}/{columns.length})
                                    </button>

                                {/* Column visibility dropdown */}
                                {showColumnMenu && (
                                    <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                            <Text className="text-sm font-medium">Show/Hide Columns</Text>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto p-2">
                                            {columns.map((column) => (
                                                <label
                                                    key={column.field_handle}
                                                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={!hiddenColumns.includes(column.field_handle)}
                                                        onChange={() => handleToggleColumn(column.field_handle)}
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                    <span className="text-sm">{column.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                </div>

                                {/* Clear Filters button - shown when filters are active */}
                                {Object.keys(filters).length > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear {Object.keys(filters).length} Filter{Object.keys(filters).length > 1 ? 's' : ''}
                                    </button>
                                )}
                            </div>

                            {/* Add buttons on the right */}
                            <div className="flex items-center gap-2">
                                {/* Refresh button */}
                                <Button
                                    onClick={refreshRecords}
                                    disabled={isFetchingRecords}
                                    className="flex items-center gap-2"
                                    outline
                                >
                                    <ArrowPathIcon className={`w-4 h-4 ${isFetchingRecords ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                {/* Export button */}
                                <Button
                                    onClick={() => setExportModalOpen(true)}
                                    className="flex items-center gap-2"
                                    outline
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    Export CSV
                                </Button>
                                <Button
                                    onClick={handleStartAddingRow}
                                    disabled={isAddingRow}
                                    className="flex items-center gap-2"
                                    outline
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Quick Add
                                </Button>
                                <Button
                                    onClick={openCreateForm}
                                    className="flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Record
                                </Button>
                            </div>
                        </div>

                        {/* Table - with horizontal scroll */}
                        <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                                <thead className="bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        {sortedColumns.map((column, index) => (
                                            <th
                                                key={column.field_handle}
                                                draggable
                                                onDragStart={(e) => handleColumnDragStart(e, column.field_handle)}
                                                onDragOver={(e) => handleColumnDragOver(e, index)}
                                                onDrop={(e) => handleColumnDrop(e, index)}
                                                onDragEnd={handleColumnDragEnd}
                                                onClick={() => column.sortable && handleSort(column.field_handle)}
                                                style={{ width: `${columnWidths[column.field_handle] || column.width}%` }}
                                                className={`relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-all ${
                                                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700' : ''
                                                } ${
                                                    draggingColumnHandle === column.field_handle ? 'opacity-40' : ''
                                                } ${
                                                    dropTargetIndex === index && draggingColumnHandle !== column.field_handle
                                                        ? 'border-l-4 border-sky-500'
                                                        : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 cursor-move">⋮⋮</span>
                                                    <span className="cursor-move">{column.label}</span>
                                                    {column.sortable && orderBy === column.field_handle && (
                                                        <span className="text-sky-500 cursor-move">
                                                            {orderDirection === 'ASC' ? '↑' : '↓'}
                                                        </span>
                                                    )}

                                                    {/* Filter button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const button = e.currentTarget;
                                                            const rect = button.getBoundingClientRect();

                                                            if (openFilterDropdown === column.field_handle) {
                                                                setOpenFilterDropdown(null);
                                                                setFilterDropdownPosition(null);
                                                            } else {
                                                                setOpenFilterDropdown(column.field_handle);
                                                                setFilterDropdownPosition({
                                                                    top: rect.bottom + 8,
                                                                    left: rect.left
                                                                });
                                                            }
                                                        }}
                                                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 ${
                                                            filters[column.field_handle] ? 'text-sky-500' : 'text-gray-400'
                                                        }`}
                                                        title="Filter column"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {/* Resize handle */}
                                                <div
                                                    onMouseDown={(e) => handleColumnResizeStart(e, column.field_handle)}
                                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-sky-500 active:bg-sky-600 z-10"
                                                    style={{ marginRight: '-2px' }}
                                                />
                                            </th>
                                        ))}
                                        {activeSectionVectorization?.enabled && (
                                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <span title="Vector Index Status">🔍</span>
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-white/10">
                                    {/* New row being added */}
                                    {isAddingRow && (
                                        <tr className="bg-sky-50 dark:bg-sky-900/20">
                                            {sortedColumns.map((column) => {
                                                const isRelationColumn = column.type === 'relation_many_to_one' || column.type === 'relation_one_to_many' || column.type === 'relation_many_to_many';

                                                return (
                                                    <td
                                                        key={column.field_handle}
                                                        style={{ width: `${columnWidths[column.field_handle] || column.width}%` }}
                                                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                                                    >
                                                        {isRelationColumn ? (
                                                            <div className="text-xs text-gray-400 italic px-2 py-1">
                                                                (use form)
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={newRowData[column.field_handle] || ''}
                                                                onChange={(e) => handleNewRowCellChange(column.field_handle, e.target.value)}
                                                                onBlur={handleSaveNewRow}
                                                                onKeyDown={handleNewRowKeyDown}
                                                                placeholder={column.label}
                                                                className="w-full px-2 py-1 text-sm border border-sky-300 dark:border-sky-600 rounded bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {activeSectionVectorization?.enabled && (
                                                <td className="px-3 py-4 text-center bg-sky-50 dark:bg-sky-900/20">
                                                    <span className="inline-flex items-center text-gray-300" title="Pending vectorization">
                                                        <ClockIcon className="w-4 h-4" />
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-sky-50 dark:bg-sky-900/20">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={handleSaveNewRow}
                                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                        title="Save"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={handleCancelAddingRow}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        title="Cancel"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {filteredRecords.map((record) => {
                                        const isSelected = editingRecordId === record.id;
                                        return (
                                        <tr
                                            key={record.id as string}
                                            className={`${
                                                isSelected
                                                    ? 'bg-sky-100 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/30'
                                                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            {sortedColumns.map((column) => {
                                                const rawValue = record[column.field_handle];
                                                const formattedValue = formatCellValue(rawValue, column);
                                                const tooltipValue = rawValue !== null && rawValue !== undefined ? String(rawValue) : '-';
                                                const isEditing = editingCell?.recordId === record.id && editingCell?.fieldHandle === column.field_handle;
                                                const isRelationField = column.type === 'relation_many_to_one' || column.type === 'relation_one_to_many' || column.type === 'relation_many_to_many';
                                                const relatedSectionId = isRelationField ? (column.cell_config?.props as { relatedSection?: string })?.relatedSection : undefined;
                                                const isJsonField = column.type === 'json' || column.cell_config?.component === 'JsonCell';
                                                const jsonFieldCount = isJsonField && rawValue && typeof rawValue === 'object'
                                                    ? Object.keys(rawValue).length
                                                    : 0;
                                                const isMultiSelectField = column.type === 'multi_select' || column.cell_config?.component === 'TagsCell';
                                                const multiSelectOptions = (() => {
                                                    if (!isMultiSelectField) return [];
                                                    const rawOptions = column.cell_config?.props.options;
                                                    if (Array.isArray(rawOptions)) {
                                                        return rawOptions as Array<{value: string; label: string}>;
                                                    }
                                                    if (typeof rawOptions === 'string' && rawOptions.length > 0) {
                                                        return rawOptions.split(',').map(opt => {
                                                            const trimmed = opt.trim();
                                                            return { value: trimmed, label: trimmed };
                                                        });
                                                    }
                                                    return [];
                                                })();

                                                return (
                                                    <td
                                                        key={column.field_handle}
                                                        style={{ width: `${columnWidths[column.field_handle] || column.width}%` }}
                                                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                                                        onDoubleClick={() => !isEditing && !isRelationField && !isJsonField && !isMultiSelectField && handleCellDoubleClick(record.id as string, column.field_handle, rawValue)}
                                                    >
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onBlur={handleCellEditSave}
                                                                onKeyDown={handleCellEditKeyDown}
                                                                autoFocus
                                                                className="w-full px-2 py-1 text-sm border border-sky-500 rounded bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                            />
                                                        ) : isJsonField && rawValue ? (
                                                            <button
                                                                onClick={() => {
                                                                    setJsonViewerValue(rawValue as object);
                                                                    setJsonViewerOpen(true);
                                                                }}
                                                                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                                title="Click to view JSON"
                                                            >
                                                                <CodeBracketIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                                                <span className="text-gray-600 dark:text-gray-400 text-xs">
                                                                    {jsonFieldCount} {jsonFieldCount === 1 ? 'field' : 'fields'}
                                                                </span>
                                                            </button>
                                                        ) : isMultiSelectField && Array.isArray(rawValue) && rawValue.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 px-2 py-1">
                                                                {rawValue.slice(0, 3).map((val, idx) => {
                                                                    const option = multiSelectOptions.find(opt => opt.value === val);
                                                                    const label = option ? option.label : val;
                                                                    return (
                                                                        <span
                                                                            key={idx}
                                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
                                                                        >
                                                                            {label}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {rawValue.length > 3 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5">
                                                                        +{rawValue.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : isRelationField && relatedSectionId && rawValue ? (
                                                            <div
                                                                className="flex items-center justify-between gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                                onClick={() => handleRelationClick(relatedSectionId, rawValue as string)}
                                                                title="Click to view related record"
                                                            >
                                                                <span className="truncate">{formattedValue}</span>
                                                                <ArrowRightCircleIcon className="w-4 h-4 flex-shrink-0 text-sky-600 dark:text-sky-400" />
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="max-w-xs truncate px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                                title={tooltipValue}
                                                            >
                                                                {formattedValue}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {activeSectionVectorization?.enabled && (
                                                <td className={`px-3 py-4 text-center ${
                                                    isSelected
                                                        ? 'bg-sky-100 dark:bg-sky-900/30'
                                                        : 'bg-white dark:bg-zinc-900'
                                                }`}>
                                                    {(record as Record<string, unknown>).has_embedding ? (
                                                        <span
                                                            className="inline-flex items-center text-green-600 dark:text-green-400"
                                                            title="Indexed for semantic search"
                                                        >
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="inline-flex items-center text-gray-400"
                                                            title="Pending vectorization"
                                                        >
                                                            <ClockIcon className="w-4 h-4" />
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 ${
                                                isSelected
                                                    ? 'bg-sky-100 dark:bg-sky-900/30'
                                                    : 'bg-white dark:bg-zinc-900'
                                            }`}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditForm(record.id as string)}
                                                        className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(record.id as string)}
                                                        disabled={deletingRecordId === record.id}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        {deletingRecordId === record.id ? (
                                                            <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full" />
                                                        ) : (
                                                            <TrashIcon className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex items-center justify-between">
                            <Text className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} records
                            </Text>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handlePreviousPage}
                                    disabled={offset === 0}
                                    outline
                                >
                                    Previous
                                </Button>
                                <Text className="px-4 py-2 text-sm">
                                    Page {currentPage} of {totalPages}
                                </Text>
                                <Button
                                    onClick={handleNextPage}
                                    disabled={!hasMore}
                                    outline
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

            {/* Form Side Panel */}
            {isFormOpen && (
                <div
                    className="flex-shrink-0 relative border-l border-gray-200 dark:border-white/10"
                    style={{
                        width: `${formWidth}px`,
                        minWidth: '300px',
                        maxWidth: '1200px'
                    }}
                >
                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResizing}
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-sky-500 active:bg-sky-600 transition-colors z-10"
                        style={{ marginLeft: '-2px' }}
                    />
                    <div className="h-full overflow-y-auto">
                        <SectionRecordForm />
                    </div>
                </div>
            )}

            {/* Delete confirmation alert */}
            <ConfirmAlert
                open={recordToDelete !== null}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Record"
                description="Are you sure you want to delete this record? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="red"
            />

            {/* Filter dropdown - rendered via portal outside table */}
            {openFilterDropdown && filterDropdownPosition && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[100] p-3"
                    style={{
                        top: `${filterDropdownPosition.top}px`,
                        left: `${filterDropdownPosition.left}px`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Filter by
                            </label>
                            <select
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800"
                                value={filters[openFilterDropdown]?.operator || 'contains'}
                                onChange={(e) => {
                                    const currentFilter = filters[openFilterDropdown];
                                    if (currentFilter) {
                                        setFilter(openFilterDropdown, {
                                            ...currentFilter,
                                            operator: e.target.value as FilterOperator
                                        });
                                    }
                                }}
                            >
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                                <option value="not_equals">Not equals</option>
                                <option value="gt">Greater than</option>
                                <option value="lt">Less than</option>
                                <option value="is_empty">Is empty</option>
                                <option value="is_not_empty">Is not empty</option>
                            </select>
                        </div>

                        {(!filters[openFilterDropdown]?.operator ||
                          !['is_empty', 'is_not_empty'].includes(filters[openFilterDropdown]?.operator)) && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Value
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-800"
                                    value={filters[openFilterDropdown]?.value || ''}
                                    onChange={(e) => {
                                        const operator = (filters[openFilterDropdown]?.operator || 'contains') as FilterOperator;
                                        setFilter(openFilterDropdown, {
                                            operator,
                                            value: e.target.value
                                        });
                                    }}
                                    placeholder="Enter value..."
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setFilter(openFilterDropdown, null);
                                    setOpenFilterDropdown(null);
                                    setFilterDropdownPosition(null);
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-700"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => {
                                    setOpenFilterDropdown(null);
                                    setFilterDropdownPosition(null);
                                }}
                                className="flex-1 px-2 py-1 text-xs bg-sky-500 text-white rounded hover:bg-sky-600"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* JSON Viewer Modal */}
            <JsonEditorModal
                isOpen={jsonViewerOpen}
                onClose={() => setJsonViewerOpen(false)}
                value={jsonViewerValue}
                readOnly={true}
                title="View JSON Data"
            />

            {/* Export Modal */}
            {activeSectionId && activeProjectId && (
                <ExportModal
                    isOpen={exportModalOpen}
                    onClose={() => setExportModalOpen(false)}
                    sectionId={activeSectionId}
                    sectionHandle={sections.find(s => s.id === activeSectionId)?.handle || 'section'}
                    projectId={activeProjectId}
                    columns={columns}
                    currentSearch={searchQuery}
                />
            )}
        </div>
    );
};

export default SectionDataTables;
