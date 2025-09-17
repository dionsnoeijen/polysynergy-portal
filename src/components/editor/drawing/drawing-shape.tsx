import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Line, Transformer, Text, Group } from 'react-konva';
import { DrawingShape } from '@/stores/drawingStore';

interface DrawingShapeComponentProps {
    shape: DrawingShape;
    isSelected?: boolean;
    onSelect?: () => void;
    onUpdate?: (updates: Partial<DrawingShape>) => void;
}

const DrawingShapeComponent: React.FC<DrawingShapeComponentProps> = ({
    shape,
    isSelected = false,
    onSelect,
    onUpdate
}) => {
    const shapeRef = useRef<unknown>();
    const transformerRef = useRef<unknown>();

    useEffect(() => {
        if (isSelected && transformerRef.current && shapeRef.current) {
            // Attach transformer to the selected shape
            transformerRef.current.nodes([shapeRef.current]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    // Helper function to convert hex to rgb
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result 
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '0, 0, 0';
    };
    const handleDragEnd = (e: unknown) => {
        if (onUpdate) {
            const target = e as { target: { x: () => number; y: () => number } };
            onUpdate({
                x: target.target.x(),
                y: target.target.y(),
            });
        }
    };

    const handleTransformEnd = (e: unknown) => {
        const target = e as { target: { 
            x: () => number; 
            y: () => number; 
            width: () => number; 
            height: () => number; 
            scaleX: () => number; 
            scaleY: () => number; 
            rotation: () => number;
        } };
        const node = target.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();

        if (onUpdate) {
            onUpdate({
                x: node.x(),
                y: node.y(),
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(5, node.height() * scaleY),
                rotation: rotation,
            });
        }

        // Reset scale to 1 after applying to width/height
        node.scaleX(1);
        node.scaleY(1);
    };

    // Helper function to get stroke dash array
    const getStrokeDash = () => {
        if (!shape.strokeStyle || shape.strokeStyle === 'solid') return [];
        if (shape.strokeStyle === 'dashed') return [10, 5];
        if (shape.strokeStyle === 'dotted') return [2, 3];
        return [];
    };

    // Group props for the container
    const groupProps = {
        ref: shapeRef,
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation || 0,
        draggable: true,
        onClick: (e) => {
            e.cancelBubble = true;
            if (onSelect) onSelect();
        },
        onTap: (e) => {
            e.cancelBubble = true;
            if (onSelect) onSelect();
        },
        onDragEnd: handleDragEnd,
        onTransformEnd: handleTransformEnd,
        // Cursor feedback
        onMouseEnter: (e) => {
            const stage = e.target.getStage();
            if (stage) {
                stage.container().style.cursor = 'pointer';
            }
        },
        onMouseLeave: (e) => {
            const stage = e.target.getStage();
            if (stage) {
                stage.container().style.cursor = 'default';
            }
        },
    };

    // Shape element props (without position and dragging)
    const shapeProps = {
        x: 0, // Relative to group
        y: 0, // Relative to group
        fill: shape.fillColor ? `rgba(${hexToRgb(shape.fillColor)}, ${shape.fillOpacity || 1})` : 'rgba(0,0,0,0.01)',
        stroke: isSelected ? '#3b82f6' : shape.color,
        strokeWidth: isSelected ? shape.strokeWidth + 1 : shape.strokeWidth,
        dash: getStrokeDash(),
        // Visual feedback
        shadowColor: isSelected ? '#3b82f6' : 'transparent',
        shadowBlur: isSelected ? 3 : 0,
        shadowOpacity: isSelected ? 0.3 : 0,
    };

    const renderShape = () => {
        const shapeElement = (() => {
            switch (shape.type) {
                case 'rectangle':
                    return (
                        <Rect
                            {...shapeProps}
                            width={shape.width}
                            height={shape.height}
                            cornerRadius={shape.cornerRadius || 0}
                        />
                    );

                case 'circle':
                    return (
                        <Circle
                            {...shapeProps}
                            radius={Math.min(shape.width, shape.height) / 2}
                            x={shape.width / 2}
                            y={shape.height / 2}
                        />
                    );

                case 'triangle':
                    return (
                        <Line
                            {...shapeProps}
                            points={[
                                shape.width / 2, 0, // top point
                                0, shape.height,     // bottom left
                                shape.width, shape.height, // bottom right
                                shape.width / 2, 0  // back to top
                            ]}
                            closed={true}
                        />
                    );

                case 'line':
                    return (
                        <Line
                            {...shapeProps}
                            points={[0, 0, shape.width, shape.height]}
                        />
                    );

                default:
                    return null;
            }
        })();

        // Render text on top of shape if present (relative to group)
        const textElement = shape.text ? (
            <Text
                x={0} // Relative to group
                y={0} // Relative to group
                width={shape.width}
                height={shape.height}
                text={shape.text}
                fontSize={shape.fontSize || 14}
                fontFamily={shape.fontFamily || 'Arial'}
                fill={shape.textColor || '#000000'}
                align={shape.textAlign || 'left'}
                verticalAlign={shape.textVerticalAlign || 'top'}
                padding={shape.textPadding || 8}
                listening={false} // Don't intercept events - let group handle them
            />
        ) : null;

        return (
            <Group {...groupProps}>
                {shapeElement}
                {textElement}
            </Group>
        );
    };

    return (
        <>
            {renderShape()}
            {isSelected && (
                <Transformer
                    ref={transformerRef}
                    flipEnabled={false}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit resize to minimum 5px
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default DrawingShapeComponent;