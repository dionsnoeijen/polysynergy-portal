import React, {useEffect, useState, useRef} from "react";
import {Divider} from "@/components/divider";
import {Button} from "@/components/button";
import {Heading} from "@/components/heading";
import {Node} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import Editor from "@monaco-editor/react";
import {XMarkIcon, CodeBracketIcon, TableCellsIcon, ViewColumnsIcon, PlusIcon, TrashIcon} from "@heroicons/react/24/outline";
import {useTheme} from "next-themes";

interface TableColumn {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    sortable?: boolean;
    filterable?: boolean;
}

interface TableData {
    columns: TableColumn[];
    rows: Record<string, unknown>[];
}

const TableEditorForm: React.FC = () => {
    const getNode = useNodesStore((state) => state.getNode);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const {theme} = useTheme();

    const closeForm = useEditorStore((state) => state.closeForm);
    const formEditVariable = useEditorStore((state) => state.formEditVariable);
    const formEditRecordId = useEditorStore((state) => state.formEditRecordId);

    const [node, setNode] = useState<Node>();
    const [activeTab, setActiveTab] = useState<'columns' | 'data' | 'code'>('columns');
    const [tableData, setTableData] = useState<TableData>({ columns: [], rows: [] });
    const [jsonError, setJsonError] = useState<string | null>(null);
    const editorRef = useRef<unknown>(null);
    const [json, setJson] = useState<string>('');

    // Editing state for inline editing
    const [editingCell, setEditingCell] = useState<{rowIdx: number; colKey: string} | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEditRecordId || !formEditVariable) return;

        // Save as JSON string
        const jsonToSave = JSON.stringify(tableData, null, 2);
        updateNodeVariable(formEditRecordId as string, formEditVariable.handle, jsonToSave);
        closeForm();
    };

    const handleEditorChange = (value: string | undefined) => {
        setJson(value || '');

        if (value) {
            try {
                const parsed = JSON.parse(value);
                if (parsed.columns && parsed.rows) {
                    setTableData(parsed);
                    setJsonError(null);
                } else {
                    setJsonError('Invalid table structure: must have columns and rows');
                }
            } catch (error) {
                setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
            }
        } else {
            setJsonError(null);
        }
    };

    const updateJsonFromTableData = (newData: TableData) => {
        setTableData(newData);
        const jsonString = JSON.stringify(newData, null, 2);
        setJson(jsonString);
        setJsonError(null);
        if (editorRef.current) {
            const typedEditor = editorRef.current as { setValue: (value: string) => void };
            typedEditor.setValue(jsonString);
        }
    };

    const handleEditorDidMount = (editor: unknown) => {
        editorRef.current = editor;
    };

    // Column management
    const addColumn = () => {
        const newKey = `column_${tableData.columns.length + 1}`;
        const newColumn: TableColumn = {
            key: newKey,
            label: `Column ${tableData.columns.length + 1}`,
            type: 'string',
            sortable: true,
            filterable: true
        };

        // Add empty value for this column in all rows
        const newRows = tableData.rows.map(row => ({
            ...row,
            [newKey]: ''
        }));

        updateJsonFromTableData({
            columns: [...tableData.columns, newColumn],
            rows: newRows
        });
    };

    const removeColumn = (idx: number) => {
        const columnKey = tableData.columns[idx].key;
        const newColumns = tableData.columns.filter((_, i) => i !== idx);
        const newRows = tableData.rows.map(row => {
            const newRow = { ...row };
            delete newRow[columnKey];
            return newRow;
        });
        updateJsonFromTableData({ columns: newColumns, rows: newRows });
    };

    const updateColumn = (idx: number, field: keyof TableColumn, value: unknown) => {
        const newColumns = [...tableData.columns];
        const oldKey = newColumns[idx].key;

        if (field === 'key' && value !== oldKey) {
            // Update key in all rows
            const newRows = tableData.rows.map(row => {
                const newRow = { ...row };
                newRow[value as string] = newRow[oldKey];
                delete newRow[oldKey];
                return newRow;
            });
            newColumns[idx] = { ...newColumns[idx], [field]: value as string };
            updateJsonFromTableData({ columns: newColumns, rows: newRows });
        } else {
            newColumns[idx] = { ...newColumns[idx], [field]: value };
            updateJsonFromTableData({ ...tableData, columns: newColumns });
        }
    };

    // Row management
    const addRow = () => {
        const newRow: Record<string, unknown> = {};
        tableData.columns.forEach(col => {
            newRow[col.key] = col.type === 'number' ? 0 : col.type === 'boolean' ? false : '';
        });
        updateJsonFromTableData({
            ...tableData,
            rows: [...tableData.rows, newRow]
        });
    };

    const removeRow = (idx: number) => {
        const newRows = tableData.rows.filter((_, i) => i !== idx);
        updateJsonFromTableData({ ...tableData, rows: newRows });
    };

    const handleCellDoubleClick = (rowIdx: number, colKey: string) => {
        setEditingCell({ rowIdx, colKey });
        setEditingValue(String(tableData.rows[rowIdx][colKey] ?? ''));
    };

    const handleCellChange = (value: string) => {
        setEditingValue(value);
    };

    const handleCellBlur = () => {
        if (editingCell) {
            const { rowIdx, colKey } = editingCell;
            const column = tableData.columns.find(c => c.key === colKey);
            let parsedValue: unknown = editingValue;

            if (column) {
                if (column.type === 'number') {
                    parsedValue = parseFloat(editingValue) || 0;
                } else if (column.type === 'boolean') {
                    parsedValue = editingValue.toLowerCase() === 'true';
                }
            }

            const newRows = [...tableData.rows];
            newRows[rowIdx] = { ...newRows[rowIdx], [colKey]: parsedValue };
            updateJsonFromTableData({ ...tableData, rows: newRows });
        }
        setEditingCell(null);
        setEditingValue('');
    };

    const handleCellKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCellBlur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setEditingCell(null);
            setEditingValue('');
        }
    };

    // CSV Import
    const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target?.result as string;
            const lines = csvText.split('\n').filter(line => line.trim());

            if (lines.length < 1) return;

            // Parse header
            const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
            const columns: TableColumn[] = headers.map(h => ({
                key: h.toLowerCase().replace(/\s+/g, '_'),
                label: h,
                type: 'string' as const,
                sortable: true,
                filterable: true
            }));

            // Parse rows
            const rows: Record<string, unknown>[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
                const row: Record<string, unknown> = {};
                columns.forEach((col, idx) => {
                    row[col.key] = values[idx] || '';
                });
                rows.push(row);
            }

            updateJsonFromTableData({ columns, rows });
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    useEffect(() => {
        if (!formEditRecordId) return;
        setNode(getNode(formEditRecordId as string));
    }, [formEditRecordId, getNode]);

    useEffect(() => {
        if (formEditVariable?.value) {
            const jsonValue = formEditVariable.value as string;
            setJson(jsonValue);

            if (jsonValue) {
                try {
                    const parsed = JSON.parse(jsonValue);
                    if (parsed.columns && parsed.rows) {
                        setTableData(parsed);
                        setJsonError(null);
                    } else if (Array.isArray(parsed)) {
                        // Convert array of objects to table structure
                        if (parsed.length > 0) {
                            const firstRow = parsed[0];
                            const columns: TableColumn[] = Object.keys(firstRow).map(key => ({
                                key,
                                label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                                type: typeof firstRow[key] === 'number' ? 'number' :
                                      typeof firstRow[key] === 'boolean' ? 'boolean' : 'string',
                                sortable: true,
                                filterable: true
                            }));
                            setTableData({ columns, rows: parsed });
                            setJsonError(null);
                        }
                    } else {
                        setTableData({ columns: [], rows: [] });
                    }
                } catch {
                    setTableData({ columns: [], rows: [] });
                }
            }
        }
    }, [formEditVariable]);

    return (
        <form onSubmit={handleSubmit} method="post">
            <div className="p-10 pb-0">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Heading>{node && node.name}: {formEditVariable?.handle}</Heading>
                    <Button type="button" onClick={() => closeForm()} color="sky">
                        <XMarkIcon className="w-5 h-5"/>
                    </Button>
                </div>
                <Divider className="my-4" soft={true} bleed={true} />
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-4 px-10">
                <button
                    type="button"
                    onClick={() => setActiveTab('columns')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'columns'
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <ViewColumnsIcon className="w-4 h-4" />
                    Columns
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'data'
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <TableCellsIcon className="w-4 h-4" />
                    Data
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('code')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'code'
                            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                            : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <CodeBracketIcon className="w-4 h-4" />
                    Code
                </button>
            </div>

            <div className="px-10">
                <section className="grid sm:grid-cols-1 relative">
                    {/* Columns Tab */}
                    {activeTab === 'columns' && (
                        <div className="max-h-[60vh] overflow-auto">
                            <div className="mb-4 flex justify-between items-center">
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {tableData.columns.length} column{tableData.columns.length !== 1 ? 's' : ''}
                                </span>
                                <Button type="button" onClick={addColumn} outline className="flex items-center gap-2">
                                    <PlusIcon className="w-4 h-4" />
                                    Add Column
                                </Button>
                            </div>

                            {tableData.columns.length === 0 ? (
                                <div className="text-center text-zinc-500 dark:text-zinc-400 py-10">
                                    <ViewColumnsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No columns defined</p>
                                    <p className="text-sm">Add columns to define your table structure</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tableData.columns.map((column, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                            <div className="flex-1 grid grid-cols-4 gap-3">
                                                <input
                                                    type="text"
                                                    value={column.key}
                                                    onChange={(e) => updateColumn(idx, 'key', e.target.value)}
                                                    placeholder="key"
                                                    className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                                                />
                                                <input
                                                    type="text"
                                                    value={column.label}
                                                    onChange={(e) => updateColumn(idx, 'label', e.target.value)}
                                                    placeholder="Label"
                                                    className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                                                />
                                                <select
                                                    value={column.type}
                                                    onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                                                    className="px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                    <option value="date">Date</option>
                                                </select>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-1 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={column.sortable ?? true}
                                                            onChange={(e) => updateColumn(idx, 'sortable', e.target.checked)}
                                                        />
                                                        Sort
                                                    </label>
                                                    <label className="flex items-center gap-1 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={column.filterable ?? true}
                                                            onChange={(e) => updateColumn(idx, 'filterable', e.target.checked)}
                                                        />
                                                        Filter
                                                    </label>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeColumn(idx)}
                                                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div className="max-h-[60vh] overflow-auto">
                            <div className="mb-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {tableData.rows.length} row{tableData.rows.length !== 1 ? 's' : ''}
                                    </span>
                                    <label className="cursor-pointer text-sm text-sky-600 dark:text-sky-400 hover:underline">
                                        Import CSV
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={handleCsvImport}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addRow}
                                    outline
                                    className="flex items-center gap-2"
                                    disabled={tableData.columns.length === 0}
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Add Row
                                </Button>
                            </div>

                            {tableData.columns.length === 0 ? (
                                <div className="text-center text-zinc-500 dark:text-zinc-400 py-10">
                                    <TableCellsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Define columns first</p>
                                    <p className="text-sm">Go to the Columns tab to add columns</p>
                                </div>
                            ) : tableData.rows.length === 0 ? (
                                <div className="text-center text-zinc-500 dark:text-zinc-400 py-10">
                                    <TableCellsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No data rows</p>
                                    <p className="text-sm">Add rows or import a CSV file</p>
                                </div>
                            ) : (
                                <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-x-auto">
                                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase w-10">
                                                    #
                                                </th>
                                                {tableData.columns.map((col) => (
                                                    <th
                                                        key={col.key}
                                                        className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase"
                                                    >
                                                        {col.label}
                                                    </th>
                                                ))}
                                                <th className="px-3 py-2 w-10" />
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                                            {tableData.rows.map((row, rowIdx) => (
                                                <tr key={rowIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                                    <td className="px-3 py-2 text-sm text-zinc-400">
                                                        {rowIdx + 1}
                                                    </td>
                                                    {tableData.columns.map((col) => {
                                                        const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === col.key;
                                                        return (
                                                            <td
                                                                key={col.key}
                                                                className="px-3 py-2 text-sm"
                                                                onDoubleClick={() => handleCellDoubleClick(rowIdx, col.key)}
                                                            >
                                                                {isEditing ? (
                                                                    <input
                                                                        type={col.type === 'number' ? 'number' : 'text'}
                                                                        value={editingValue}
                                                                        onChange={(e) => handleCellChange(e.target.value)}
                                                                        onBlur={handleCellBlur}
                                                                        onKeyDown={handleCellKeyDown}
                                                                        autoFocus
                                                                        className="w-full px-2 py-1 text-sm border border-sky-500 rounded bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        className="px-2 py-1 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 min-h-[28px]"
                                                                        title="Double-click to edit"
                                                                    >
                                                                        {col.type === 'boolean' ? (
                                                                            row[col.key] ? 'true' : 'false'
                                                                        ) : (
                                                                            String(row[col.key] ?? '')
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-3 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(rowIdx)}
                                                            className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Code Tab */}
                    {activeTab === 'code' && (
                        <div className="h-[300px] overflow-hidden -mx-10 relative">
                            <Editor
                                height={`100%`}
                                defaultLanguage="json"
                                value={json}
                                onChange={handleEditorChange}
                                theme={theme === "dark" ? "vs-dark" : "vs"}
                                onMount={handleEditorDidMount}
                                options={{
                                    minimap: {enabled: false},
                                    scrollBeyondLastLine: false,
                                    scrollbar: {
                                        alwaysConsumeMouseWheel: false
                                    },
                                }}
                            />
                            {/* JSON Status Indicator */}
                            <div className="absolute bottom-4 right-14 z-10">
                                <div
                                    className={`w-3 h-3 rounded-full ${
                                        jsonError
                                            ? 'bg-red-400 dark:bg-red-500'
                                            : 'bg-green-400 dark:bg-green-500'
                                    }`}
                                    title={jsonError ? `JSON Error: ${jsonError}` : 'Valid JSON'}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Buttons */}
                <div className="flex justify-end gap-4 mt-4">
                    <Button type="button" onClick={() => closeForm()} plain>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Save Table
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default TableEditorForm;
