import React, { useState } from 'react';
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import JsonEditorModal from '@/components/sections/json-editor-modal';

interface JsonInputProps {
    value: object | string | null;
    onChange: (value: object | null) => void;
    required?: boolean;
    config?: object;
}

const JsonInput: React.FC<JsonInputProps> = ({ value, onChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Parse value to object if it's a string
    const jsonValue = (() => {
        if (!value) return null;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return null;
            }
        }
        return value;
    })();

    // Count fields in JSON object
    const fieldCount = jsonValue && typeof jsonValue === 'object'
        ? Object.keys(jsonValue).length
        : 0;

    const handleSave = (newValue: object) => {
        onChange(newValue);
    };

    return (
        <div>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-900 transition-colors"
            >
                <CodeBracketIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                    Edit JSON ({fieldCount} {fieldCount === 1 ? 'field' : 'fields'})
                </span>
            </button>

            <JsonEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                value={jsonValue}
                onSave={handleSave}
                title="Edit JSON Data"
            />
        </div>
    );
};

export default JsonInput;
