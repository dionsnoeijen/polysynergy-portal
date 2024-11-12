import React, { useState, useEffect, useCallback } from 'react';

interface ConnectionProps {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    width?: number;
    dotRadius?: number; // Optioneel: grootte van de bollen
}

const Connection: React.FC<ConnectionProps> = ({
    startX,
    startY,
    endX,
    endY,
    color = '#ffffff',
    width = 2,
    dotRadius = 6.5,
}) => {
    const [path, setPath] = useState('');

    const generatePath = useCallback(() => {
        const controlPointX = (startX + endX) / 2;
        const pathData = `M ${startX},${startY} 
                      C ${controlPointX},${startY} 
                        ${controlPointX},${endY} 
                        ${endX},${endY}`;
        setPath(pathData);
    }, [startX, startY, endX, endY]);

    useEffect(() => {
        generatePath();
    }, [generatePath]);

    return (
        <>
            <svg style={{ position: 'absolute', pointerEvents: 'none', overflow: 'visible', zIndex: 1 }}>
                <path d={path} stroke={color} strokeWidth={width} fill="none" />
            </svg>

            <div
                style={{
                    position: 'absolute',
                    left: startX - dotRadius,
                    top: startY - dotRadius,
                    width: dotRadius * 2,
                    height: dotRadius * 2,
                    borderRadius: '50%',
                    backgroundColor: color,
                    zIndex: 100,
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    left: endX - dotRadius,
                    top: endY - dotRadius,
                    width: dotRadius * 2,
                    height: dotRadius * 2,
                    borderRadius: '50%',
                    backgroundColor: color,
                    zIndex: 100,
                    pointerEvents: 'none',
                    cursor: 'pointer',
                }}
            />
        </>
    );
};

export default Connection;
