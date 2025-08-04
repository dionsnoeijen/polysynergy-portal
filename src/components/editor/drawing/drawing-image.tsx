import React, { useRef, useEffect, useState } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { DrawingImage } from '@/stores/drawingStore';

interface DrawingImageProps {
    image: DrawingImage;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<DrawingImage>) => void;
}

const DrawingImageComponent: React.FC<DrawingImageProps> = ({ image, isSelected, onSelect, onUpdate }) => {
    const imageRef = useRef<Konva.Image>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const [konvaImage, setKonvaImage] = useState<HTMLImageElement | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setKonvaImage(img);
            
            // For GIFs, force regular redraws to show animation
            if (image.src.startsWith('data:image/gif')) {
                const animate = () => {
                    if (imageRef.current) {
                        imageRef.current.getLayer()?.batchDraw();
                    }
                    animationRef.current = requestAnimationFrame(animate);
                };
                animate();
            }
        };
        img.src = image.src;
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [image.src]);

    useEffect(() => {
        if (isSelected && transformerRef.current && imageRef.current) {
            transformerRef.current.nodes([imageRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    const handleTransform = () => {
        const node = imageRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();

        // Reset scale to 1
        node.scaleX(1);
        node.scaleY(1);

        onUpdate({
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * scaleX),
            height: Math.max(50, node.height() * scaleY),
            rotation: rotation,
        });
    };

    if (!konvaImage) {
        return null; // Still loading
    }

    return (
        <>
            <KonvaImage
                ref={imageRef}
                x={image.x}
                y={image.y}
                width={image.width}
                height={image.height}
                rotation={image.rotation}
                image={konvaImage}
                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={(e) => {
                    onUpdate({
                        x: e.target.x(),
                        y: e.target.y(),
                    });
                }}
                onTransformEnd={handleTransform}
            />
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
                        if (newBox.width < 50 || newBox.height < 50) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

export default DrawingImageComponent;