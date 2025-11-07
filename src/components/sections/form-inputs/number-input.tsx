import React from 'react';

interface NumberInputProps {
    value: number | string;
    onChange: (value: number | string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    config?: Record<string, unknown>;
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, placeholder, required, disabled, config }) => {
    const min = config?.min as number | undefined;
    const max = config?.max as number | undefined;
    const step = config?.step as number | undefined;

    return (
        <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        />
    );
};

export default NumberInput;
