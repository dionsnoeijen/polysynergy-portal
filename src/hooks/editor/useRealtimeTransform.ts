import { useEffect, useState, useRef } from 'react';
import useEditorStore from '@/stores/editorStore';

export interface TransformValues {
    x: number;
    y: number;
    zoom: number;
}

/**
 * Hook that provides real-time transform values by monitoring both:
 * 1. Store updates (for programmatic changes)
 * 2. DOM mutations (for real-time DOM-based panning)
 * 
 * This allows multiple components to sync with the editor's efficient DOM panning
 * without interfering with the performance optimizations.
 */
export const useRealtimeTransform = () => {
    const activeVersionId = useEditorStore(state => state.activeVersionId);
    const [transform, setTransform] = useState<TransformValues>({ x: 0, y: 0, zoom: 1 });
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const updateTransform = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(() => {
                // First try to get real-time DOM values (during panning)
                const editorTransformLayer = document.querySelector('[data-type="editor"] [style*="transform"]') as HTMLElement;
                
                if (editorTransformLayer?.style.transform && editorTransformLayer.style.transform !== 'none') {
                    // Parse DOM transform for real-time values
                    const matrix = new DOMMatrix(editorTransformLayer.style.transform);
                    setTransform({
                        x: matrix.m41,
                        y: matrix.m42,
                        zoom: matrix.m11
                    });
                } else {
                    // Fallback to store values
                    const state = useEditorStore.getState();
                    const pan = state.getPanPositionForVersion();
                    const zoom = state.getZoomFactorForVersion();
                    setTransform({
                        x: pan.x,
                        y: pan.y,
                        zoom: zoom
                    });
                }
                
                animationFrameRef.current = null;
            });
        };

        // Initial update
        updateTransform();

        // Subscribe to store changes for programmatic updates
        const unsubscribeStore = useEditorStore.subscribe(() => {
            updateTransform();
        });

        // Monitor DOM changes for real-time panning
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' &&
                    (mutation.target as HTMLElement).style?.transform) {
                    updateTransform();
                    break;
                }
            }
        });

        // Watch editor for transform changes
        const editorElement = document.querySelector('[data-type="editor"]');
        if (editorElement) {
            observer.observe(editorElement, {
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            unsubscribeStore();
            observer.disconnect();
        };
    }, [activeVersionId]);

    return transform;
};