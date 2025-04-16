'use client'

import React, {useEffect, useRef, useState} from 'react'
import {Stage, Layer, Rect, Transformer} from 'react-konva'
import useEditorStore from '@/stores/editorStore'
import {EditorMode} from '@/types/types'

export default function DrawingLayer({
                                         panPosition,
                                         zoomFactor,
                                     }: {
    panPosition: { x: number; y: number }
    zoomFactor: number
}) {
    const editorMode = useEditorStore((state) => state.editorMode)
    const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
    const containerRef = useRef<HTMLDivElement>(null)
    const rectRef = useRef<any>(null)
    const transformerRef = useRef<any>(null)
    const [isSelected, setIsSelected] = useState(false)

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const {width, height} = containerRef.current.getBoundingClientRect()
                setCanvasSize({width, height})
            }
        }

        updateSize()

        const observer = new ResizeObserver(updateSize)
        if (containerRef.current) observer.observe(containerRef.current)

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current)
        }
    }, [])

    useEffect(() => {
        if (isSelected && transformerRef.current && rectRef.current) {
            transformerRef.current.nodes([rectRef.current])
            transformerRef.current.getLayer().batchDraw()
        }
    }, [isSelected])

    return (
        <div
            data-type="drawing-layer"
            ref={containerRef}
            className={`absolute top-0 left-0 w-full h-full z-20 ${
                editorMode !== EditorMode.Draw ? 'pointer-events-none' : ''
            }`}
        >
            <Stage
                width={canvasSize.width}
                height={canvasSize.height}
                scaleX={zoomFactor}
                scaleY={zoomFactor}
                x={panPosition.x}
                y={panPosition.y}
                onMouseDown={(e) => {
                    // deselect when clicked outside
                    const clickedOnEmpty = e.target === e.target.getStage()
                    if (clickedOnEmpty) setIsSelected(false)
                }}
            >
                <Layer>
                    {/*<Rect*/}
                    {/*    ref={rectRef}*/}
                    {/*    x={100}*/}
                    {/*    y={100}*/}
                    {/*    width={200}*/}
                    {/*    height={100}*/}
                    {/*    fill="skyblue"*/}
                    {/*    draggable*/}
                    {/*    stroke="black"*/}
                    {/*    strokeWidth={1}*/}
                    {/*    rotation={0}*/}
                    {/*    onClick={() => setIsSelected(true)}*/}
                    {/*    onTap={() => setIsSelected(true)} // for mobile*/}
                    {/*/>*/}
                    {/*{isSelected && (*/}
                    {/*    <Transformer*/}
                    {/*        ref={transformerRef}*/}
                    {/*        rotateEnabled={true}*/}
                    {/*        keepRatio={false} // <--- dit is belangrijk!*/}
                    {/*        enabledAnchors={[*/}
                    {/*            'top-left',*/}
                    {/*            'top-right',*/}
                    {/*            'bottom-left',*/}
                    {/*            'bottom-right',*/}
                    {/*            'middle-left',*/}
                    {/*            'middle-right',*/}
                    {/*            'top-center',*/}
                    {/*            'bottom-center',*/}
                    {/*        ]}*/}
                    {/*        boundBoxFunc={(oldBox, newBox) => {*/}
                    {/*            if (newBox.width < 20 || newBox.height < 20) {*/}
                    {/*                return oldBox*/}
                    {/*            }*/}
                    {/*            return newBox*/}
                    {/*        }}*/}
                    {/*    />*/}
                    {/*)}*/}
                </Layer>
            </Stage>
        </div>
    )
}