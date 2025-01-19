// components/theme-toggle.js
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    if (!mounted) {
        // Render a placeholder to avoid hydration mismatch
        return (
            <button
                aria-label="Toggle Dark Mode"
                className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {/* Placeholder icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M10 0a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
            ) : (
                <MoonIcon className={`w-5 h-5`} />
            )}
        </button>
    );
}
