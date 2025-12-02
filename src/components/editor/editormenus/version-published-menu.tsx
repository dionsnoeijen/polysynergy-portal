'use client';

import React from 'react';
import useEditorStore from '@/stores/editorStore';
import useMockStore from '@/stores/mockStore';

import {FormType} from '@/types/types';

import {
    // Bars3Icon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    Squares2X2Icon,
    ArrowUturnUpIcon,
    AdjustmentsHorizontalIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useBranding } from '@/contexts/branding-context';

export default function VersionPublishedMenu() {

    // const isSaving = useEditorStore((state) => state.isSaving);
    const openForm = useEditorStore((state) => state.openForm);

    const hasMockData = useMockStore((state) => state.hasMockData);
    const clearMockStore = useMockStore((state) => state.clearMockStore);

    const { accent_color } = useBranding();

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, opacity: number) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(14, 165, 233, ${opacity})`;
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const lightBg = hexToRgba(accent_color, 0.1);
    const lightBgHover = hexToRgba(accent_color, 0.2);
    const borderColor = hexToRgba(accent_color, 0.6);
    const dividerColor = hexToRgba(accent_color, 0.3);

    return (
        <div
            className="absolute bottom-2 right-12 flex items-center gap-2 p-2 dark:bg-zinc-800/80 dark:border-white/25 rounded-lg z-20"
            style={{
                backgroundColor: lightBg,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: borderColor
            }}
        >

            {/* Clear Mock Data Button */}
            <button
                disabled={!hasMockData}
                className={`p-1 rounded-md disabled:cursor-not-allowed ${!hasMockData ? 'opacity-50' : 'dark:hover:bg-zinc-400 dark:bg-zinc-600'}`}
                style={{
                    backgroundColor: hasMockData ? lightBgHover : 'transparent'
                }}
                onMouseEnter={(e) => hasMockData && (e.currentTarget.style.backgroundColor = lightBgHover)}
                onMouseLeave={(e) => hasMockData && (e.currentTarget.style.backgroundColor = lightBgHover)}
                title="Clear mock data"
                onClick={clearMockStore}
                data-tour-id="clear-mock-data-button"
            >
                <ArrowUturnUpIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
            </button>

            {/* Published Variables Button */}
            <button
                className="p-1 rounded-md dark:hover:bg-zinc-400"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Published variables"
                onClick={() => openForm(FormType.PublishedVariableForm)}
                data-tour-id="published-variable-button"
            >
                <AdjustmentsHorizontalIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
            </button>

            {/* Play Buttons Button */}
            <button
                className="p-1 rounded-md dark:hover:bg-zinc-400"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Play buttons"
                onClick={() => openForm(FormType.PlayButtonsForm)}
                data-tour-id="play-buttons-button"
            >
                <Squares2X2Icon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
            </button>

            {/* Divider */}
            <div className="w-px h-6 dark:bg-zinc-600 mx-1" style={{ backgroundColor: dividerColor }}></div>

            {/* Export Button */}
            <button
                className="p-1 rounded-md dark:hover:bg-zinc-400"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Export sharing package"
                onClick={() => openForm(FormType.ExportSharing)}
            >
                <ArrowDownTrayIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
            </button>

            {/* Import Button */}
            <button
                className="p-1 rounded-md dark:hover:bg-zinc-400"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Import package"
                onClick={() => openForm(FormType.ImportPackage)}
            >
                <ArrowUpTrayIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
            </button>

            {/* Publish Button */}
            <button
                className="p-1 rounded-md dark:hover:bg-zinc-400"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = lightBgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Publish"
                onClick={() => openForm(FormType.ProjectPublish)}
            >
                <RocketLaunchIcon className="h-5 w-5 dark:text-white/70" style={{ color: accent_color }}/>
            </button>
            
        </div>
    );
}
