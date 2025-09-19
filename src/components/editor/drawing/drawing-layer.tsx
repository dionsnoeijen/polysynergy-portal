'use client'

import React, {useEffect, useRef, useState, useMemo} from 'react'
import {Stage, Layer} from 'react-konva'
import type Konva from 'konva'
import useEditorStore from '@/stores/editorStore'
import useDrawingStore from '@/stores/drawingStore'
import {EditorMode} from '@/types/types'
import { useRealtimeTransform } from '@/hooks/editor/useRealtimeTransform'
import FreeDrawing from './free-drawing'
import DrawingImageComponent from './drawing-image'
import DrawingShapeComponent from './drawing-shape'
import ShapePropertiesPanel from './shape-properties-panel'
import { createImageFromFile } from '@/utils/imageUtils'

export default function DrawingLayer() {
    const editorMode = useEditorStore((state) => state.editorMode)
    const activeVersionId = useEditorStore((state) => state.activeVersionId)
    const transform = useRealtimeTransform()
    const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)
    
    // Drawing store
    const allPaths = useDrawingStore((state) => state.paths)
    const allImages = useDrawingStore((state) => state.images)
    const allShapes = useDrawingStore((state) => state.shapes)
    const selectedObjectId = useDrawingStore((state) => state.selectedObjectId)
    const currentColor = useDrawingStore((state) => state.currentColor)
    const currentTool = useDrawingStore((state) => state.currentTool)
    const strokeWidth = useDrawingStore((state) => state.strokeWidth)
    const addPath = useDrawingStore((state) => state.addPath)
    const deletePath = useDrawingStore((state) => state.deletePath)
    const addImage = useDrawingStore((state) => state.addImage)
    const updateImage = useDrawingStore((state) => state.updateImage)
    const deleteImage = useDrawingStore((state) => state.deleteImage)
    const addShape = useDrawingStore((state) => state.addShape)
    const updateShape = useDrawingStore((state) => state.updateShape)
    const deleteShape = useDrawingStore((state) => state.deleteShape)
    const setSelectedObject = useDrawingStore((state) => state.setSelectedObject)
    const setCurrentTool = useDrawingStore((state) => state.setCurrentTool)
    const setIsDrawing = useDrawingStore((state) => state.setIsDrawing)
    
    // Memoized filtered objects to prevent infinite loops
    const paths = useMemo(() => {
        return allPaths.filter(path => path.versionId === (activeVersionId || ''))
    }, [allPaths, activeVersionId])
    
    const images = useMemo(() => {
        return allImages.filter(image => image.versionId === (activeVersionId || ''))
    }, [allImages, activeVersionId])
    
    const shapes = useMemo(() => {
        return allShapes.filter(shape => shape.versionId === (activeVersionId || ''))
    }, [allShapes, activeVersionId])
    
    // Drawing state
    const [currentPath, setCurrentPath] = useState<number[]>([])
    const [isDrawingPath, setIsDrawingPath] = useState(false)
    const [isEditingText] = useState(false) // setIsEditingText is currently unused
    
    // Shape drawing state
    const [isDrawingShape, setIsDrawingShape] = useState(false)
    const [shapeStart, setShapeStart] = useState<{x: number, y: number} | null>(null)
    const [currentShapePreview, setCurrentShapePreview] = useState<{x: number, y: number, width: number, height: number} | null>(null)

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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (editorMode === EditorMode.Draw && !isEditingText) {
                // Tool shortcuts
                if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault()
                    setCurrentTool('select')
                } else if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault()
                    setCurrentTool('pen')
                } else if (e.key === 'e' || e.key === 'E') {
                    e.preventDefault()
                    setCurrentTool('eraser')
                }
                
                // Delete selected objects
                if (selectedObjectId && (e.key === 'Delete' || e.key === 'Backspace')) {
                    e.preventDefault()
                    // Try to delete path, shape, or image
                    const path = paths.find(p => p.id === selectedObjectId)
                    const shape = shapes.find(s => s.id === selectedObjectId)
                    const image = images.find(i => i.id === selectedObjectId)
                    
                    if (path) {
                        deletePath(selectedObjectId)
                    } else if (shape) {
                        deleteShape(selectedObjectId)
                    } else if (image) {
                        deleteImage(selectedObjectId)
                    }
                    setSelectedObject(null)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editorMode, selectedObjectId, paths, shapes, images, deletePath, deleteShape, deleteImage, setSelectedObject, setCurrentTool, isEditingText])

    const handleStageDoubleClick = () => {
        // Double click functionality can be added here later if needed
        return;
    }

    const handleStageMouseDown = (e: unknown) => {
        if (editorMode !== EditorMode.Draw) return
        
        const konvaEvent = e as { evt: MouseEvent; cancelBubble?: boolean }
        const nativeEvent = konvaEvent.evt as MouseEvent
        
        // Allow middle mouse button for panning, or Cmd/Ctrl+click - stop event from being handled by Konva
        if (nativeEvent.button === 1 || (nativeEvent.button === 0 && (nativeEvent.metaKey || nativeEvent.ctrlKey))) {
            // Stop Konva from handling this event, let it bubble to editor
            konvaEvent.cancelBubble = false
            return // Let the editor handle panning
        }
        
        const target = e as { target: { getStage: () => unknown, getPointerPosition?: () => { x: number, y: number } | null } }
        const clickedOnEmpty = target.target === target.target.getStage()
        
        // If we clicked on an object (not empty stage), don't start drawing
        if (!clickedOnEmpty) {
            return;
        }
        
        if (clickedOnEmpty) {
            setSelectedObject(null)
            
            // Only start drawing if we're using a drawing tool, not select tool
            if (currentTool !== 'select' && stageRef.current) {
                const pointer = stageRef.current.getPointerPosition()
                if (pointer) {
                    // Convert global screen coordinates to local stage coordinates
                    const stageEl = stageRef.current
                    const transform = stageEl.getAbsoluteTransform().copy()
                    transform.invert()
                    const localPos = transform.point(pointer)
                    const x = localPos.x
                    const y = localPos.y
                    
                    // Start drawing with pen or erasing with eraser
                    if (currentTool === 'pen' || currentTool === 'eraser') {
                        setIsDrawingPath(true)
                        setIsDrawing(true)
                        setCurrentPath([x, y])
                        
                        // If erasing, check for paths to remove at start position
                        if (currentTool === 'eraser') {
                            checkForErasure(x, y)
                        }
                    }
                    // Start drawing shapes
                    else if (['rectangle', 'circle', 'triangle', 'line'].includes(currentTool)) {
                        setIsDrawingShape(true)
                        setIsDrawing(true)
                        setShapeStart({ x, y })
                        setCurrentShapePreview({ x, y, width: 0, height: 0 })
                    }
                }
            }
        }
    }

    const handleStageMouseMove = () => {
        if (stageRef.current) {
            const pointer = stageRef.current.getPointerPosition()
            if (pointer) {
                // Convert global screen coordinates to local stage coordinates
                const stageEl = stageRef.current
                const transform = stageEl.getAbsoluteTransform().copy()
                transform.invert()
                const localPos = transform.point(pointer)
                const x = localPos.x
                const y = localPos.y

                // Handle path drawing (pen/eraser)
                if (isDrawingPath && (currentTool === 'pen' || currentTool === 'eraser')) {
                    setCurrentPath([...currentPath, x, y])
                    
                    // If erasing, check for paths to remove at current position
                    if (currentTool === 'eraser') {
                        checkForErasure(x, y)
                    }
                }
                // Handle shape drawing
                else if (isDrawingShape && shapeStart) {
                    const width = x - shapeStart.x
                    const height = y - shapeStart.y
                    setCurrentShapePreview({
                        x: Math.min(shapeStart.x, x),
                        y: Math.min(shapeStart.y, y),
                        width: Math.abs(width),
                        height: Math.abs(height)
                    })
                }
            }
        }
    }

    const handleStageMouseUp = () => {
        // Handle path drawing completion
        if (isDrawingPath && currentPath.length > 2 && currentTool === 'pen') {
            // Only add path if using pen tool (not eraser)
            addPath({
                points: currentPath,
                color: currentColor,
                strokeWidth: strokeWidth,
                versionId: activeVersionId || ''
            })
        }
        
        // Handle shape drawing completion
        if (isDrawingShape && currentShapePreview && shapeStart) {
            const minSize = 5 // Minimum size for shapes
            if (currentShapePreview.width >= minSize && currentShapePreview.height >= minSize) {
                addShape({
                    type: currentTool as 'rectangle' | 'circle' | 'triangle' | 'line',
                    x: currentShapePreview.x,
                    y: currentShapePreview.y,
                    width: currentShapePreview.width,
                    height: currentShapePreview.height,
                    color: currentColor,
                    strokeWidth: strokeWidth,
                    versionId: activeVersionId || ''
                })
            }
        }
        
        // Reset all drawing states
        setIsDrawingPath(false)
        setIsDrawingShape(false)
        setIsDrawing(false)
        setCurrentPath([])
        setShapeStart(null)
        setCurrentShapePreview(null)
    }

    // Eraser functionality - check if eraser position intersects with any paths
    const checkForErasure = (eraserX: number, eraserY: number) => {
        const eraserRadius = strokeWidth * 2 // Eraser size based on stroke width
        
        paths.forEach(path => {
            const points = path.points
            for (let i = 0; i < points.length; i += 2) {
                const pathX = points[i]
                const pathY = points[i + 1]
                
                // Calculate distance between eraser and path point
                const distance = Math.sqrt((eraserX - pathX) ** 2 + (eraserY - pathY) ** 2)
                
                if (distance <= eraserRadius) {
                    // Path intersects with eraser, remove it
                    deletePath(path.id)
                    break // Stop checking this path since it's being deleted
                }
            }
        })
    }

    // Handle file drop for images
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        if (editorMode !== EditorMode.Draw) return

        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(file => file.type.startsWith('image/'))

        if (imageFiles.length === 0) return

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        // Calculate drop position
        const x = (e.clientX - rect.left - transform.x) / transform.zoom
        const y = (e.clientY - rect.top - transform.y) / transform.zoom

        // Process first image file
        const file = imageFiles[0]
        try {
            const imageData = await createImageFromFile(file, x, y, activeVersionId || '')
            addImage(imageData)
        } catch (error) {
            console.error('Failed to process image:', error)
            alert(error instanceof Error ? error.message : 'Failed to process image')
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    return (
        <div
            data-type="drawing-layer"
            ref={containerRef}
            className={`absolute top-0 left-0 w-full h-full ${
                editorMode === EditorMode.Draw ? 'z-10' : 'z-5'
            }`}
            style={{
                // Allow all events to reach the Stage
                pointerEvents: editorMode === EditorMode.Draw ? 'auto' : 'none'
            }}
            onWheel={(e) => {
                // Forward wheel events to the editor for zoom handling
                if (!isDrawingPath && !isDrawingShape) {
                    const editorElement = document.querySelector('[data-type="editor"]');
                    if (editorElement) {
                        const wheelEvent = new WheelEvent('wheel', {
                            deltaY: e.deltaY,
                            deltaX: e.deltaX,
                            clientX: e.clientX,
                            clientY: e.clientY,
                            bubbles: true,
                            cancelable: true
                        });
                        editorElement.dispatchEvent(wheelEvent);
                    }
                }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <Stage
                ref={stageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                scaleX={transform.zoom}
                scaleY={transform.zoom}
                x={transform.x}
                y={transform.y}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onDblClick={handleStageDoubleClick}
                onWheel={() => {}} // Disable Konva's wheel handling
                listening={editorMode === EditorMode.Draw}
            >
                <Layer>
                    {/* Render completed paths */}
                    {paths.map((path) => (
                        <FreeDrawing
                            key={path.id}
                            path={path}
                        />
                    ))}
                    
                    {/* Render current path being drawn */}
                    {isDrawingPath && currentPath.length > 2 && currentTool === 'pen' && (
                        <FreeDrawing
                            path={{
                                id: 'current',
                                points: currentPath,
                                color: currentColor,
                                strokeWidth: strokeWidth,
                                versionId: activeVersionId || ''
                            }}
                        />
                    )}
                    
                    {/* Render eraser trail */}
                    {isDrawingPath && currentPath.length > 2 && currentTool === 'eraser' && (
                        <FreeDrawing
                            path={{
                                id: 'eraser',
                                points: currentPath,
                                color: '#ff4444',
                                strokeWidth: strokeWidth * 2,
                                versionId: activeVersionId || ''
                            }}
                        />
                    )}
                    
                    {/* Render shapes */}
                    {shapes.map((shape) => (
                        <DrawingShapeComponent
                            key={shape.id}
                            shape={shape}
                            isSelected={selectedObjectId === shape.id}
                            onSelect={() => setSelectedObject(shape.id)}
                            onUpdate={(updates) => updateShape(shape.id, updates)}
                        />
                    ))}

                    {/* Render shape preview while drawing */}
                    {isDrawingShape && currentShapePreview && (
                        <DrawingShapeComponent
                            shape={{
                                id: 'preview',
                                type: currentTool as 'rectangle' | 'circle' | 'triangle' | 'line',
                                x: currentShapePreview.x,
                                y: currentShapePreview.y,
                                width: currentShapePreview.width,
                                height: currentShapePreview.height,
                                color: currentColor,
                                strokeWidth: strokeWidth,
                                versionId: activeVersionId || ''
                            }}
                            isSelected={false}
                        />
                    )}
                    
                    {/* Render images */}
                    {images.map((image) => (
                        <DrawingImageComponent
                            key={image.id}
                            image={image}
                            isSelected={selectedObjectId === image.id}
                            onSelect={() => setSelectedObject(image.id)}
                            onUpdate={(updates) => updateImage(image.id, updates)}
                        />
                    ))}
                </Layer>
            </Stage>
            
            {/* Shape Properties Panel */}
            {selectedObjectId && shapes.find(shape => shape.id === selectedObjectId) && (
                <ShapePropertiesPanel
                    shape={shapes.find(shape => shape.id === selectedObjectId)!}
                    onUpdate={(updates) => updateShape(selectedObjectId, updates)}
                    onClose={() => setSelectedObject(null)}
                />
            )}
        </div>
    )
}