'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import {GRID_SIZE} from "@/utils/snapToGrid";
import useEditorStore from "@/stores/editorStore";

const Grid: React.FC = () => {

    const zoomFactor = useEditorStore((state) => state.zoomFactor);
    const panPosition = useEditorStore((state) => state.panPosition);

    const { theme } = useTheme();

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
                    linear-gradient(90deg, rgba(56, 189, 248, ${0.1 * zoomFactor}) 1px, transparent 1px),
                    linear-gradient(0deg, rgba(56, 189, 248, ${0.1 * zoomFactor}) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(56, 189, 248, ${0.2 * zoomFactor}) 2px, transparent 1px 100px),
                    linear-gradient(0deg, rgba(56, 189, 248, ${0.2 * zoomFactor}) 2px, transparent 1px 100px)
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
