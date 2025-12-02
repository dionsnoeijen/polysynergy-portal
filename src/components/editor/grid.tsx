'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {GRID_SIZE} from "@/utils/snapToGrid";
import useEditorStore from "@/stores/editorStore";
import { useBranding } from '@/contexts/branding-context';

const Grid: React.FC = () => {

    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion());
    const panPosition = useEditorStore((state) => state.getPanPositionForVersion());
    const { accent_color } = useBranding();

    const { theme } = useTheme();

    // Convert hex to rgb
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return { r: 56, g: 189, b: 248 }; // fallback to sky-400
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    };

    const rgb = hexToRgb(accent_color);

    return (
        <div
            className="absolute inset-0 pointer-events-none z-1"
            style={{
                backgroundImage: theme === 'dark' ? `
                    linear-gradient(90deg, rgba(200, 200, 200, ${0.1 * zoomFactor}) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(200, 200, 200, ${0.1 * zoomFactor}) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(150, 150, 150, ${0.2 * zoomFactor}) 2px, transparent 1px 100px),
                    linear-gradient(0deg, rgba(150, 150, 150, ${0.2 * zoomFactor}) 2px, transparent 1px 100px)
                ` : `
                    linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 * zoomFactor}) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 * zoomFactor}) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.2 * zoomFactor}) 2px, transparent 1px 100px),
                    linear-gradient(0deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.2 * zoomFactor}) 2px, transparent 1px 100px)
                `,
                backgroundSize: `
                    ${GRID_SIZE * zoomFactor}px ${GRID_SIZE * zoomFactor}px, 
                    ${GRID_SIZE * zoomFactor}px ${GRID_SIZE * zoomFactor}px, 
                    ${(GRID_SIZE*5) * zoomFactor}px ${(GRID_SIZE*5) * zoomFactor}px, 
                    ${(GRID_SIZE*5) * zoomFactor}px ${(GRID_SIZE*5) * zoomFactor}px
                `,
                backgroundPosition: `${panPosition.x}px ${panPosition.y}px`,
            }}
        />
    );
};

export default Grid;
