import React, { useState, useEffect, useCallback } from 'react';
import { Connection as ConnectionProps } from "@/stores/connectionsStore";

type Props = {
    connection: ConnectionProps;
};

const Connection: React.FC<Props> = ({ connection }) => {
    const [path, setPath] = useState('');

    const color = connection.collapsed ? '#666666' : '#ffffff';
    const width = 2;
    const dotRadius = 6.5;
    const dashArray = connection.collapsed ? "4 4" : "0";

    const {
        startX,
        startY,
        endX,
        endY
    } = connection;

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
                <path d={path} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dashArray} />
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
