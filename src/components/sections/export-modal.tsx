import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogBody, DialogTitle } from '@/components/dialog';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { getIdToken } from '@/api/auth/authToken';
import config from '@/config';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionId: string;
    sectionHandle: string;
    projectId: string;
    columns: Array<{
        field_handle: string;
        label: string;
        type: string;
    }>;
    currentSearch?: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    sectionId,
    sectionHandle,
    projectId,
    columns,
    currentSearch = ''
}) => {
    // All fields selected by default
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [limit, setLimit] = useState<number>(10000);
    const [offset, setOffset] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize selected fields and search when modal opens
    useEffect(() => {
        if (isOpen) {
            // Select all fields by default
            setSelectedFields(columns.map(col => col.field_handle));
            setSearchQuery(currentSearch);
            setError(null);
        }
    }, [isOpen, columns, currentSearch]);

    const handleToggleField = (fieldHandle: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldHandle)
                ? prev.filter(f => f !== fieldHandle)
                : [...prev, fieldHandle]
        );
    };

    const handleSelectAll = () => {
        setSelectedFields(columns.map(col => col.field_handle));
    };

    const handleDeselectAll = () => {
        setSelectedFields([]);
    };

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            setError('Please select at least one field to export');
            return;
        }

        if (limit < 1 || limit > 100000) {
            setError('Limit must be between 1 and 100,000');
            return;
        }

        if (offset < 0) {
            setError('Offset cannot be negative');
            return;
        }

        setIsExporting(true);
        setError(null);

        try {
            const response = await fetch(
                `${config.LOCAL_API_URL}/section-field/sections/${sectionId}/export/?project_id=${projectId}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getIdToken()}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        field_handles: selectedFields,
                        limit,
                        offset,
                        search: searchQuery || null,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Export failed: ${response.status} ${errorText}`);
            }

            // Get the filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `${sectionHandle}_export.csv`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            // Close modal on success
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} size="2xl">
            <DialogTitle>Export Section to CSV</DialogTitle>
            <DialogBody>
                <div className="space-y-4">
                    {/* Field Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select Fields to Export
                            </Text>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                    Select All
                                </button>
                                <span className="text-xs text-gray-400">|</span>
                                <button
                                    onClick={handleDeselectAll}
                                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-zinc-900">
                            {columns.map((column) => (
                                <label
                                    key={column.field_handle}
                                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedFields.includes(column.field_handle)}
                                        onChange={() => handleToggleField(column.field_handle)}
                                        className="rounded border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {column.label}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        ({column.type})
                                    </span>
                                </label>
                            ))}
                        </div>
                        <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                        </Text>
                    </div>

                    {/* Export Options */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Limit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Limit
                            </label>
                            <input
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                                min={1}
                                max={100000}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Max: 100,000 records
                            </Text>
                        </div>

                        {/* Offset */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Offset
                            </label>
                            <input
                                type="number"
                                value={offset}
                                onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
                                min={0}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            />
                            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Skip first N records
                            </Text>
                        </div>
                    </div>

                    {/* Search Query */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Filter (Optional)
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter records by search term..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {currentSearch && (
                            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Current table search: &quot;{currentSearch}&quot;
                            </Text>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    )}
                </div>
            </DialogBody>
            <DialogActions>
                <Button onClick={onClose} plain disabled={isExporting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={isExporting || selectedFields.length === 0}
                >
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportModal;
