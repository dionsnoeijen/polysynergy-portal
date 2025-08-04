import React, { useRef, useEffect, useState } from 'react';
import { Rect, Text, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { DrawingNote } from '@/stores/drawingStore';

interface NoteProps {
    note: DrawingNote;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<DrawingNote>) => void;
    onEditingChange: (isEditing: boolean) => void;
}

const Note: React.FC<NoteProps> = ({ note, isSelected, onSelect, onUpdate, onEditingChange }) => {
    const groupRef = useRef<Konva.Group>(null);
    const rectRef = useRef<Konva.Rect>(null);
    const textRef = useRef<Konva.Text>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isSelected && transformerRef.current && groupRef.current) {
            transformerRef.current.nodes([groupRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const handleDoubleClick = () => {
        setIsEditing(true);
        onEditingChange(true);
        // Create a textarea element for editing
        const stage = rectRef.current?.getStage();
        if (!stage) return;

        const stageBox = stage.container().getBoundingClientRect();
        const scale = stage.scaleX(); // Get current zoom level
        const stageAttrs = stage.attrs;
        
        // Calculate actual position accounting for pan and zoom
        const areaPosition = {
            x: stageBox.left + (note.x * scale) + stageAttrs.x,
            y: stageBox.top + (note.y * scale) + stageAttrs.y,
        };

        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        textarea.value = note.text;
        textarea.style.position = 'absolute';
        textarea.style.top = areaPosition.y + 'px';
        textarea.style.left = areaPosition.x + 'px';
        textarea.style.width = (note.width * scale) + 'px';
        textarea.style.height = (note.height * scale) + 'px';
        textarea.style.fontSize = (note.fontSize * scale) + 'px';
        textarea.style.border = '2px solid ' + note.color;
        textarea.style.padding = '5px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'rgba(255, 255, 255, 0.9)';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = '1.2';
        textarea.style.fontFamily = 'Arial, sans-serif';
        textarea.style.transformOrigin = 'left top';
        textarea.style.color = note.color;
        textarea.style.zIndex = '1000';

        textarea.focus();
        textarea.select();

        const removeTextarea = () => {
            textarea.parentNode?.removeChild(textarea);
            setIsEditing(false);
            onEditingChange(false);
        };

        const setTextareaWidth = (newWidth: number) => {
            textarea.style.width = newWidth + 'px';
        };

        textarea.addEventListener('keydown', (e) => {
            if (e.keyCode === 13 && !e.shiftKey) {
                e.preventDefault();
                const newText = textarea.value.trim() || 'Double click to edit...';
                onUpdate({ text: newText });
                removeTextarea();
            }
            if (e.keyCode === 27) {
                removeTextarea();
            }
        });

        textarea.addEventListener('blur', () => {
            const newText = textarea.value.trim() || 'Double click to edit...';
            onUpdate({ text: newText });
            removeTextarea();
        });
    };

    const handleTransform = () => {
        const group = groupRef.current;
        if (!group) return;

        const scaleX = group.scaleX();
        const scaleY = group.scaleY();
        const rotation = group.rotation();

        // Reset scale to 1
        group.scaleX(1);
        group.scaleY(1);

        onUpdate({
            x: group.x(),
            y: group.y(),
            width: Math.max(100, note.width * scaleX),
            height: Math.max(50, note.height * scaleY),
            rotation: rotation,
        });
    };

    return (
        <>
            <Group
                ref={groupRef}
                x={note.x}
                y={note.y}
                rotation={note.rotation}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDblClick={handleDoubleClick}
                onDblTap={handleDoubleClick}
                onDragEnd={(e) => {
                    onUpdate({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={handleTransform}
            >
                <Rect
                    ref={rectRef}
                    x={0}
                    y={0}
                    width={note.width}
                    height={note.height}
                    fill="rgba(255, 255, 255, 0.3)"
                    stroke={note.color}
                    strokeWidth={2}
                />
                {!isEditing && (
                    <Text
                        ref={textRef}
                        x={5}
                        y={5}
                        width={note.width - 10}
                        height={note.height - 10}
                        text={note.text || 'Double click to edit...'}
                        fontSize={note.fontSize}
                        fontFamily="Arial, sans-serif"
                        fill={note.color}
                        listening={false}
                        wrap="word"
                    />
                )}
            </Group>
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    enabledAnchors={[
                        'top-left',
                        'top-right',
                        'bottom-left',
                        'bottom-right',
                        'middle-left',
                        'middle-right',
                        'top-center',
                        'bottom-center',
                    ]}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 100 || newBox.height < 50) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default Note;