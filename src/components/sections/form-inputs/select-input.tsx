import React from 'react';

interface SelectInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    config?: Record<string, unknown>;
}

interface SelectOption {
    value: string;
    label: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, required, disabled, config }) => {
    // Extract options - handle various structures
    const getOptions = (): SelectOption[] => {
        if (!config) return [];

        // Get the raw options value from either direct config or nested props
        let rawOptions: unknown = config.options;

        if (!rawOptions && config.props && typeof config.props === 'object') {
            const props = config.props as Record<string, unknown>;
            rawOptions = props.options;
        }

        // Handle array of objects (already formatted)
        if (Array.isArray(rawOptions)) {
            return rawOptions as SelectOption[];
        }

        // Handle comma-separated string (e.g., "hoog,middel,laag,onbekend")
        if (typeof rawOptions === 'string' && rawOptions.length > 0) {
            return rawOptions.split(',').map(opt => {
                const trimmed = opt.trim();
                return { value: trimmed, label: trimmed };
            });
        }

        return [];
    };

    const options = getOptions();

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        >
            <option value="">Select...</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default SelectInput;
