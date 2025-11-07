import React from 'react';

interface TextareaInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    config?: Record<string, unknown>;
}

const TextareaInput: React.FC<TextareaInputProps> = ({ value, onChange, placeholder, required, disabled, config }) => {
    const rows = (config?.rows as number) || 3;
    const maxLength = config?.max_length as number | undefined;

    return (
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 resize-y"
        />
    );
};

export default TextareaInput;
