import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MultiSelectInputProps {
    value: string[] | null;
    onChange: (value: string[]) => void;
    required?: boolean;
    config?: {
        options?: Array<{value: string; label: string}>;
        minSelections?: number;
        maxSelections?: number;
        searchable?: boolean;
        props?: {
            options?: Array<{value: string; label: string}>;
            minSelections?: number;
            maxSelections?: number;
            searchable?: boolean;
        };
    };
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
    value,
    onChange,
    required = false,
    config
}) => {
    // Extract options - handle various structures
    const getOptions = (): Array<{value: string; label: string}> => {
        if (!config) return [];

        // Get the raw options value from either direct config or nested props
        let rawOptions: unknown = config.options;

        if (!rawOptions && config.props && typeof config.props === 'object') {
            const props = config.props as Record<string, unknown>;
            rawOptions = props.options;
        }

        // Handle array of objects (already formatted)
        if (Array.isArray(rawOptions)) {
            return rawOptions as Array<{value: string; label: string}>;
        }

        // Handle comma-separated string (e.g., "tag1,tag2,tag3")
        if (typeof rawOptions === 'string' && rawOptions.length > 0) {
            return rawOptions.split(',').map(opt => {
                const trimmed = opt.trim();
                return { value: trimmed, label: trimmed };
            });
        }

        return [];
    };

    const options = getOptions();
    const selectedValues = value || [];
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Extract config values - check both direct and nested props
    const getConfigValue = <T,>(key: keyof NonNullable<typeof config>): T | undefined => {
        if (!config) return undefined;

        // Try direct config
        if (config[key] !== undefined) {
            return config[key] as T;
        }

        // Try nested in props
        if (config.props && typeof config.props === 'object') {
            const props = config.props as Record<string, unknown>;
            if (props[key] !== undefined) {
                return props[key] as T;
            }
        }

        return undefined;
    };

    const searchable = getConfigValue<boolean>('searchable');
    const maxSelections = getConfigValue<number>('maxSelections');
    const minSelections = getConfigValue<number>('minSelections');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    const handleToggleOption = (optionValue: string) => {
        const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter(v => v !== optionValue)
            : [...selectedValues, optionValue];

        // Check max selections
        if (maxSelections && newValues.length > maxSelections) {
            return;
        }

        onChange(newValues);
    };

    const handleRemoveTag = (optionValue: string) => {
        const newValues = selectedValues.filter(v => v !== optionValue);
        onChange(newValues);
    };

    const getLabel = (val: string) => {
        const option = options.find(opt => opt.value === val);
        return option ? option.label : val;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected tags */}
            <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-sky-500">
                <div className="flex flex-wrap gap-1">
                    {selectedValues.map((val) => (
                        <span
                            key={val}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
                        >
                            {getLabel(val)}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(val)}
                                className="hover:text-sky-600 dark:hover:text-sky-300"
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1"
                    >
                        {selectedValues.length === 0 ? 'Select options...' : 'Add more...'}
                    </button>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchable && (
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                    )}
                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No options found
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                const isDisabled = !isSelected && !!maxSelections && selectedValues.length >= maxSelections;

                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer ${
                                            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleOption(option.value)}
                                            disabled={isDisabled}
                                            className="rounded border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {option.label}
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {minSelections && (
                        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                            Min: {minSelections} {maxSelections && `| Max: ${maxSelections}`}
                        </div>
                    )}
                </div>
            )}

            {/* Validation message */}
            {required && selectedValues.length === 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Please select at least one option
                </p>
            )}
        </div>
    );
};

export default MultiSelectInput;
