'use client'

import React, {useState} from 'react'
import useEditorStore from "@/stores/editorStore";

type Point = { x: number; y: number }

export default function DrawingLayer({
    panPosition,
    zoomFactor,
}: {
    panPosition: { x: number; y: number }
    zoomFactor: number
}) {
    const [lines, setLines] = useState<Point[][]>([]);
    const [currentLine, setCurrentLine] = useState<Point[] | null>(null);

    const editorMode = useEditorStore((state) => state.editorMode);

    const handleMouseDown = (e: React.MouseEvent) => {
        const point = getPoint(e);
        console.log('HANDLE DRAW MOUSE DOWN');
        setCurrentLine([point]);
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!currentLine) return
        const point = getPoint(e)
        setCurrentLine([...currentLine, point])
    }

    const handleMouseUp = () => {
        if (currentLine) {
            setLines([...lines, currentLine])
            setCurrentLine(null)
        }
    }

    const getPoint = (e: React.MouseEvent): Point => {
        const svg = e.currentTarget as SVGSVGElement
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
        return {x: svgP.x, y: svgP.y}
    }

    const renderLine = (points: Point[], index: number) => (
        <polyline
            key={index}
            fill="none"
            stroke="black"
            strokeWidth={2}
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        />
    )

    return (
        <div
            className={`absolute top-0 left-0 z-5 w-full h-full bg-red-500/20`}
            // onMouseDown={handleMouseDown}
            // onMouseMove={handleMouseMove}
            // onMouseUp={handleMouseUp}
        >
            <svg
                className="absolute top-0 left-0 w-0 h-0 z-50 pointer-events-none overflow-visible"
                style={{
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomFactor})`,
                }}
            >
                {lines.map(renderLine)}
                {currentLine && renderLine(currentLine, -1)}
            </svg>
        </div>
    )
}