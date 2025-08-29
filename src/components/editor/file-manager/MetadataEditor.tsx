import React, { useState, useCallback, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    CheckIcon,
    XMarkIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { FileInfo } from '@/api/fileManagerApi';

interface MetadataKeyValue {
    key: string;
    value: string;
}

interface MetadataEditorProps {
    file: FileInfo;
    onSave: (metadata: Record<string, string>) => void;
    onClose: () => void;
    isLoading?: boolean;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({
    file,
    onSave,
    onClose,
    isLoading = false
}) => {
    const [metadata, setMetadata] = useState<MetadataKeyValue[]>([]);
    const [hasChanges, setHasChanges] = useState(false);


    // Initialize metadata with custom metadata only
    useEffect(() => {
        const initialMetadata: MetadataKeyValue[] = [];

        // Add existing custom metadata (excluding default fields that backend handles)
        if (file.custom_metadata) {
            Object.entries(file.custom_metadata).forEach(([key, value]) => {
                // Skip backend-handled fields
                if (key !== 'filename' && key !== 'filepath') {
                    initialMetadata.push({ key, value });
                }
            });
        }

        // Always end with an empty row for adding new metadata
        initialMetadata.push({ key: '', value: '' });

        setMetadata(initialMetadata);
    }, [file]);

    const updateMetadataItem = useCallback((index: number, field: 'key' | 'value', newValue: string) => {
        setMetadata(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: newValue };
            
            // If this was the last (empty) row and user added content, add a new empty row
            if (index === updated.length - 1 && (updated[index].key || updated[index].value)) {
                updated.push({ key: '', value: '' });
            }
            
            setHasChanges(true);
            return updated;
        });
    }, []);

    const removeMetadataItem = useCallback((index: number) => {
        setMetadata(prev => {
            const updated = prev.filter((_, i) => i !== index);
            
            // Ensure we always have an empty row at the end
            if (updated.length === 0 || updated[updated.length - 1].key || updated[updated.length - 1].value) {
                updated.push({ key: '', value: '' });
            }
            
            setHasChanges(true);
            return updated;
        });
    }, []);

    const handleSave = useCallback(() => {
        // Convert to Record<string, string>, filtering out empty entries
        const metadataRecord: Record<string, string> = {};
        
        metadata.forEach(({ key, value }) => {
            if (key.trim() && value.trim()) {
                metadataRecord[key.trim()] = value.trim();
            }
        });

        onSave(metadataRecord);
    }, [metadata, onSave]);

    const canRemove = useCallback((index: number, key: string) => {
        // All custom fields can be removed, just not empty rows
        return key.trim() !== '';
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-zinc-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                Edit Metadata
                            </h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {file.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        disabled={isLoading}
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                        {metadata.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                {/* Key input */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Key"
                                        value={item.key}
                                        onChange={(e) => updateMetadataItem(index, 'key', e.target.value)}
                                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 
                                                 rounded-md bg-white dark:bg-zinc-700 
                                                 text-zinc-900 dark:text-white
                                                 focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                                                 disabled:bg-zinc-100 dark:disabled:bg-zinc-800
                                                 disabled:text-zinc-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Value input */}
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        value={item.value}
                                        onChange={(e) => updateMetadataItem(index, 'value', e.target.value)}
                                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 
                                                 rounded-md bg-white dark:bg-zinc-700 
                                                 text-zinc-900 dark:text-white
                                                 focus:ring-2 focus:ring-sky-500 focus:border-sky-500
                                                 disabled:bg-zinc-100 dark:disabled:bg-zinc-800"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Remove button */}
                                {canRemove(index, item.key) && (
                                    <button
                                        onClick={() => removeMetadataItem(index)}
                                        className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 
                                                 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 
                                                 rounded-md transition-colors"
                                        disabled={isLoading}
                                        title="Remove metadata"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Spacer for default fields */}
                                {!canRemove(index, item.key) && (
                                    <div className="w-10 flex justify-center">
                                        <div className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-700 
                                                      px-2 py-1 rounded">
                                            default
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Help text */}
                    <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-md">
                        <p className="text-sm text-sky-800 dark:text-sky-300">
                            Add custom key-value pairs to enhance document attribution in AI responses.
                            The filename and filepath will be automatically included by the system.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-between">
                    <div className="flex items-center gap-2">
                        <PlusIcon className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            Add new key-value pairs in the empty row
                        </span>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-700 dark:text-zinc-300 border border-zinc-300 
                                     dark:border-zinc-600 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700 
                                     transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 
                                     transition-colors flex items-center gap-2 disabled:opacity-50"
                            disabled={isLoading || !hasChanges}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    Save Metadata
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetadataEditor;