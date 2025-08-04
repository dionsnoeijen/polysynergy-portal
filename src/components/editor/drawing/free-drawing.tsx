import React, { useRef } from 'react';
import { Line } from 'react-konva';
import Konva from 'konva';

export interface DrawingPath {
    id: string;
    points: number[];
    color: string;
    strokeWidth: number;
    versionId: string;
}

interface FreeDrawingProps {
    path: DrawingPath;
}

const FreeDrawing: React.FC<FreeDrawingProps> = ({ path }) => {
    const lineRef = useRef<Konva.Line>(null);

    return (
        <Line
            ref={lineRef}
            points={path.points}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="source-over"
        />
    );
};

export default FreeDrawing;