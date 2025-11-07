import React from 'react';

interface CheckboxInputProps {
    value: boolean;
    onChange: (value: boolean) => void;
    required?: boolean;
    disabled?: boolean;
    label?: string;
    config?: Record<string, unknown>;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({ value, onChange, required, disabled, label }) => {
    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                required={required}
                disabled={disabled}
                className="w-4 h-4 text-sky-600 border-gray-300 dark:border-gray-600 rounded focus:ring-sky-500 disabled:opacity-50"
            />
            {label && (
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
        </div>
    );
};

export default CheckboxInput;
