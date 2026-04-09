import React from 'react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    config?: Record<string, unknown>;
}

// Normalize any date string to YYYY-MM-DD
function toDateValue(value: string): string {
    if (!value) return '';
    // Already in correct format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    } catch {
        return value;
    }
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange, required, disabled }) => {
    return (
        <input
            type="date"
            value={toDateValue(value)}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        />
    );
};

export default DateInput;
