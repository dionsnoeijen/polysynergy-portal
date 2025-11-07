import React from 'react';

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    config?: Record<string, unknown>;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, placeholder, required, disabled, config }) => {
    const maxLength = config?.max_length as number | undefined;

    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        />
    );
};

export default TextInput;
