/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client'

import React, {useEffect, useRef, useState, useMemo} from 'react'
import {Stage, Layer} from 'react-konva'
import useEditorStore from '@/stores/editorStore'
import useDrawingStore from '@/stores/drawingStore'
import {EditorMode} from '@/types/types'
import Note from './note'
import FreeDrawing from './free-drawing'
import DrawingImageComponent from './drawing-image'
import { createImageFromFile } from '@/utils/imageUtils'

export default function DrawingLayer() {
    const editorMode = useEditorStore((state) => state.editorMode)
    const panPosition = useEditorStore((state) => state.getPanPositionForVersion())
    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion())
    const activeVersionId = useEditorStore((state) => state.activeVersionId)
    const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<any>(null)
    
    // Drawing store
    const allNotes = useDrawingStore((state) => state.notes)
    const allPaths = useDrawingStore((state) => state.paths)
    const allImages = useDrawingStore((state) => state.images)
    const selectedObjectId = useDrawingStore((state) => state.selectedObjectId)
    const currentColor = useDrawingStore((state) => state.currentColor)
    const currentTool = useDrawingStore((state) => state.currentTool)
    const strokeWidth = useDrawingStore((state) => state.strokeWidth)
    const addNote = useDrawingStore((state) => state.addNote)
    const updateNote = useDrawingStore((state) => state.updateNote)
    const deleteNote = useDrawingStore((state) => state.deleteNote)
    const addPath = useDrawingStore((state) => state.addPath)
    const updatePath = useDrawingStore((state) => state.updatePath)
    const deletePath = useDrawingStore((state) => state.deletePath)
    const addImage = useDrawingStore((state) => state.addImage)
    const updateImage = useDrawingStore((state) => state.updateImage)
    const deleteImage = useDrawingStore((state) => state.deleteImage)
    const setSelectedObject = useDrawingStore((state) => state.setSelectedObject)
    const setCurrentTool = useDrawingStore((state) => state.setCurrentTool)
    const setIsDrawing = useDrawingStore((state) => state.setIsDrawing)
    
    // Memoized filtered notes and paths to prevent infinite loops
    const notes = useMemo(() => {
        return allNotes.filter(note => note.versionId === (activeVersionId || ''))
    }, [allNotes, activeVersionId])
    
    const paths = useMemo(() => {
        return allPaths.filter(path => path.versionId === (activeVersionId || ''))
    }, [allPaths, activeVersionId])
    
    const images = useMemo(() => {
        return allImages.filter(image => image.versionId === (activeVersionId || ''))
    }, [allImages, activeVersionId])
    
    // Drawing state
    const [currentPath, setCurrentPath] = useState<number[]>([])
    const [isDrawingPath, setIsDrawingPath] = useState(false)
    const [isEditingText, setIsEditingText] = useState(false)

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
                } else if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault()
                    setCurrentTool('note')
                }
                
                // Delete selected objects
                if (selectedObjectId && (e.key === 'Delete' || e.key === 'Backspace')) {
                    e.preventDefault()
                    // Try to delete note, path, or image
                    const note = notes.find(n => n.id === selectedObjectId)
                    const path = paths.find(p => p.id === selectedObjectId)
                    const image = images.find(i => i.id === selectedObjectId)
                    
                    if (note) {
                        deleteNote(selectedObjectId)
                    } else if (path) {
                        deletePath(selectedObjectId)
                    } else if (image) {
                        deleteImage(selectedObjectId)
                    }
                    setSelectedObject(null)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [editorMode, selectedObjectId, notes, paths, images, deleteNote, deletePath, deleteImage, setSelectedObject, setCurrentTool, isEditingText])

    const handleStageClick = (e: unknown) => {
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            setSelectedObject(null)
        }
    }

    const handleStageDoubleClick = (e: unknown) => {
        if (editorMode !== EditorMode.Draw || currentTool !== 'note') return
        
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            const stage = e.target.getStage()
            const pointer = stage.getPointerPosition()
            if (pointer) {
                // Adjust for pan and zoom
                const x = (pointer.x - panPosition.x) / zoomFactor
                const y = (pointer.y - panPosition.y) / zoomFactor
                
                addNote({
                    x,
                    y,
                    width: 200,
                    height: 100,
                    rotation: 0,
                    text: 'Double click to edit...',
                    color: currentColor,
                    fontSize: 14,
                    versionId: activeVersionId || ''
                })
            }
        }
    }

    const handleStageMouseDown = (e: unknown) => {
        if (editorMode !== EditorMode.Draw) return
        
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            setSelectedObject(null)
            
            // Start drawing with pen or erasing with eraser
            if (currentTool === 'pen' || currentTool === 'eraser') {
                setIsDrawingPath(true)
                setIsDrawing(true)
                const stage = e.target.getStage()
                const pointer = stage.getPointerPosition()
                if (pointer) {
                    const x = (pointer.x - panPosition.x) / zoomFactor
                    const y = (pointer.y - panPosition.y) / zoomFactor
                    setCurrentPath([x, y])
                    
                    // If erasing, check for paths to remove at start position
                    if (currentTool === 'eraser') {
                        checkForErasure(x, y)
                    }
                }
            }
        }
    }

    const handleStageMouseMove = (e: unknown) => {
        if (!isDrawingPath || (currentTool !== 'pen' && currentTool !== 'eraser')) return
        
        const stage = e.target.getStage()
        const pointer = stage.getPointerPosition()
        if (pointer) {
            const x = (pointer.x - panPosition.x) / zoomFactor
            const y = (pointer.y - panPosition.y) / zoomFactor
            setCurrentPath([...currentPath, x, y])
            
            // If erasing, check for paths to remove at current position
            if (currentTool === 'eraser') {
                checkForErasure(x, y)
            }
        }
    }

    const handleStageMouseUp = () => {
        if (isDrawingPath && currentPath.length > 2 && currentTool === 'pen') {
            // Only add path if using pen tool (not eraser)
            addPath({
                points: currentPath,
                color: currentColor,
                strokeWidth: strokeWidth,
                versionId: activeVersionId || ''
            })
        }
        setIsDrawingPath(false)
        setIsDrawing(false)
        setCurrentPath([])
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
        const x = (e.clientX - rect.left - panPosition.x) / zoomFactor
        const y = (e.clientY - rect.top - panPosition.y) / zoomFactor

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
            className={`absolute top-0 left-0 w-full h-full z-20 ${
                editorMode !== EditorMode.Draw ? 'pointer-events-none' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <Stage
                ref={stageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                scaleX={zoomFactor}
                scaleY={zoomFactor}
                x={panPosition.x}
                y={panPosition.y}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onDblClick={handleStageDoubleClick}
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
                    
                    {/* Render notes */}
                    {notes.map((note) => (
                        <Note
                            key={note.id}
                            note={note}
                            isSelected={selectedObjectId === note.id}
                            onSelect={() => setSelectedObject(note.id)}
                            onUpdate={(updates) => updateNote(note.id, updates)}
                            onEditingChange={setIsEditingText}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    )
}