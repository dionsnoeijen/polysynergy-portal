'use client';

import React from 'react';
import { useTheme } from 'next-themes';

type GridProps = {
    zoomFactor: number;
    position: { x: number; y: number };
};

export const Grid: React.FC<GridProps> = ({ zoomFactor, position }) => {

    const { theme } = useTheme();

    return (
        <div
            className="absolute inset-0 pointer-events-none"
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
                    ${20 * zoomFactor}px ${20 * zoomFactor}px, 
                    ${20 * zoomFactor}px ${20 * zoomFactor}px, 
                    ${100 * zoomFactor}px ${100 * zoomFactor}px, 
                    ${100 * zoomFactor}px ${100 * zoomFactor}px
                `,
                backgroundPosition: `${position.x}px ${position.y}px`,
            }}
        />
    );
};
