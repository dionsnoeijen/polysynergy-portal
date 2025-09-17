import React, { useState, useEffect } from 'react';
import { DrawingShape } from '@/stores/drawingStore';
import useDrawingStore from '@/stores/drawingStore';
import clsx from 'clsx';

interface ShapePropertiesPanelProps {
    shape: DrawingShape;
    onUpdate: (updates: Partial<DrawingShape>) => void;
    onClose: () => void;
}

const ShapePropertiesPanel: React.FC<ShapePropertiesPanelProps> = ({
    shape,
    onUpdate,
    onClose
}) => {
    const [isEditingText, setIsEditingText] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Use store for persistent panel position
    const panelPosition = useDrawingStore((state) => state.propertiesPanelPosition);
    const setPropertiesPanelPosition = useDrawingStore((state) => state.setPropertiesPanelPosition);

    // Disable keyboard shortcuts when editing text
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isEditingText) {
                // Stop propagation of keyboard events when editing text
                e.stopPropagation();
            }
        };

        if (isEditingText) {
            document.addEventListener('keydown', handleKeyDown, true);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isEditingText]);

    // Drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = e.currentTarget.closest('.absolute')?.getBoundingClientRect();
        if (rect) {
            const currentX = panelPosition.x !== null ? panelPosition.x : rect.left;
            const currentY = panelPosition.y !== null ? panelPosition.y : rect.top;
            
            setIsDragging(true);
            setDragStart({
                x: e.clientX - currentX,
                y: e.clientY - currentY
            });
            e.preventDefault();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPropertiesPanelPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const strokeStyles = [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' }
    ];

    return (
        <div 
            className="absolute w-56 bg-zinc-800/95 border border-white/25 rounded-lg shadow-xl z-50"
            style={{
                left: panelPosition.x !== null ? panelPosition.x : 'auto',
                top: panelPosition.y !== null ? panelPosition.y : 16,
                right: panelPosition.x !== null ? 'auto' : 16
            }}
            onWheel={(e) => {
                // Prevent wheel events from bubbling up to prevent zoom
                e.stopPropagation();
            }}
        >
            {/* Header with drag handle */}
            <div 
                className="flex justify-between items-center p-3 border-b border-sky-500/50 dark:border-white/10 cursor-move bg-zinc-700/50 rounded-t-lg select-none"
                onMouseDown={handleMouseDown}
            >
                <h3 className="text-white text-sm font-medium capitalize">{shape.type}</h3>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-gray-400 hover:text-white text-lg leading-none hover:bg-white/10 rounded px-1"
                >
                    ×
                </button>
            </div>

            <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                {/* Fill Color */}
                <div>
                    <label className="block text-white text-xs mb-1 font-medium">Fill</label>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={shape.fillColor || "#ffffff"}
                                onChange={(e) => onUpdate({ fillColor: e.target.value })}
                                className="w-12 h-8 rounded border border-gray-400 cursor-pointer bg-transparent"
                                disabled={!shape.fillColor}
                            />
                            <div className="flex flex-col">
                                <span className="text-white text-xs">
                                    {shape.fillColor || "None"}
                                </span>
                                <span className="text-gray-400 text-xs">
                                    {shape.fillColor ? "Color" : "Transparent"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => onUpdate({ fillColor: shape.fillColor ? undefined : "#ffffff" })}
                            className={clsx(
                                "px-2 py-1 text-xs rounded",
                                shape.fillColor 
                                    ? "bg-red-600 text-white hover:bg-red-700" 
                                    : "bg-sky-600 text-white hover:bg-sky-700"
                            )}
                        >
                            {shape.fillColor ? "×" : "+"}
                        </button>
                    </div>
                </div>

                {/* Fill Opacity */}
                {shape.fillColor && (
                    <div>
                        <label className="block text-white text-xs mb-1 font-medium">
                            Opacity {Math.round((shape.fillOpacity || 1) * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={shape.fillOpacity || 1}
                            onChange={(e) => onUpdate({ fillOpacity: parseFloat(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Stroke Color */}
                <div>
                    <label className="block text-white text-xs mb-1 font-medium">Stroke</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="color"
                            value={shape.color}
                            onChange={(e) => onUpdate({ color: e.target.value })}
                            className="w-12 h-8 rounded border border-gray-400 cursor-pointer bg-transparent"
                        />
                        <div className="flex flex-col">
                            <span className="text-white text-xs">{shape.color}</span>
                            <span className="text-gray-400 text-xs">Stroke</span>
                        </div>
                    </div>
                </div>

                {/* Stroke Width */}
                <div>
                    <label className="block text-white text-xs mb-1 font-medium">
                        Width {shape.strokeWidth}px
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="12"
                        value={shape.strokeWidth}
                        onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                {/* Stroke Style */}
                <div>
                    <label className="block text-white text-xs mb-1 font-medium">Style</label>
                    <select
                        value={shape.strokeStyle || 'solid'}
                        onChange={(e) => onUpdate({ strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                        className="w-full bg-zinc-700 text-white rounded px-2 py-1 text-sm"
                    >
                        {strokeStyles.map((style) => (
                            <option key={style.value} value={style.value}>
                                {style.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Corner Radius (only for rectangles) */}
                {shape.type === 'rectangle' && (
                    <div>
                        <label className="block text-white text-xs mb-1 font-medium">
                            Radius {shape.cornerRadius || 0}px
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={shape.cornerRadius || 0}
                            onChange={(e) => onUpdate({ cornerRadius: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Text Content */}
                <div>
                    <label className="block text-white text-xs mb-1 font-medium">Text</label>
                    <textarea
                        value={shape.text || ''}
                        onChange={(e) => onUpdate({ text: e.target.value })}
                        onFocus={() => setIsEditingText(true)}
                        onBlur={() => setIsEditingText(false)}
                        placeholder="Enter text..."
                        className="w-full bg-zinc-700 text-white rounded px-2 py-1 text-sm resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        rows={3}
                    />
                </div>

                {/* Text Properties */}
                {shape.text && (
                    <>
                        {/* Text Color */}
                        <div>
                            <label className="block text-white text-xs mb-1 font-medium">Color</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={shape.textColor || "#000000"}
                                    onChange={(e) => onUpdate({ textColor: e.target.value })}
                                    className="w-12 h-8 rounded border border-gray-400 cursor-pointer bg-transparent"
                                />
                                <div className="flex flex-col">
                                    <span className="text-white text-xs">{shape.textColor || "#000000"}</span>
                                    <span className="text-gray-400 text-xs">Text</span>
                                </div>
                            </div>
                        </div>

                        {/* Font Size */}
                        <div>
                            <label className="block text-white text-xs mb-1 font-medium">
                                Size {shape.fontSize || 14}px
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="120"
                                value={shape.fontSize || 14}
                                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>

                        {/* Text Alignment */}
                        <div>
                            <label className="block text-white text-xs mb-1 font-medium">H-Align</label>
                            <div className="grid grid-cols-3 gap-1">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => onUpdate({ textAlign: align as 'left' | 'center' | 'right' })}
                                        className={clsx(
                                            "px-2 py-1 text-xs rounded capitalize",
                                            shape.textAlign === align || (!shape.textAlign && align === 'left')
                                                ? "bg-sky-500 text-white" 
                                                : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                                        )}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Vertical Text Alignment */}
                        <div>
                            <label className="block text-white text-xs mb-1 font-medium">V-Align</label>
                            <div className="grid grid-cols-3 gap-1">
                                {['top', 'middle', 'bottom'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => onUpdate({ textVerticalAlign: align as 'top' | 'middle' | 'bottom' })}
                                        className={clsx(
                                            "px-2 py-1 text-xs rounded capitalize",
                                            shape.textVerticalAlign === align || (!shape.textVerticalAlign && align === 'top')
                                                ? "bg-sky-500 text-white" 
                                                : "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                                        )}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Family */}
                        <div>
                            <label className="block text-white text-xs mb-1 font-medium">Font</label>
                            <select
                                value={shape.fontFamily || 'Arial'}
                                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                                className="w-full bg-zinc-700 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                onFocus={() => setIsEditingText(true)}
                                onBlur={() => setIsEditingText(false)}
                            >
                                <option value="Arial">Arial</option>
                                <option value="Helvetica">Helvetica</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Monaco">Monaco</option>
                                <option value="Courier New">Courier New</option>
                            </select>
                        </div>

                        {/* Text Padding */}
                        <div>
                            <label className="block text-white text-xs mb-1 font-medium">
                                Padding {shape.textPadding || 8}px
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={shape.textPadding || 8}
                                onChange={(e) => onUpdate({ textPadding: parseInt(e.target.value) })}
                                className="w-full"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ShapePropertiesPanel;