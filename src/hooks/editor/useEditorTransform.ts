import { useEffect, useRef } from 'react';
import useEditorStore, { EditorState } from '@/stores/editorStore';

export const useEditorTransform = (isDOMActiveRef?: React.RefObject<boolean>) => {
    const transformLayerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const applyTransform = (state: EditorState) => {
            // Skip if DOM operations are active
            if (isDOMActiveRef?.current) {
                console.log('⚠️ Skipping useEditorTransform - DOM active');
                return;
            }
            
            const pan = state.getPanPositionForVersion();
            const zoom = state.getZoomFactorForVersion();

            if (transformLayerRef.current) {
                transformLayerRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
            }
        };

        applyTransform(useEditorStore.getState());

        const unsubscribe = useEditorStore.subscribe((state, prevState) => {
            const vid = state.activeVersionId;
            if (!vid) return;

            const pan = state.panPositionsByVersion[vid];
            const prevPan = prevState.panPositionsByVersion[vid];
            const zoom = state.zoomFactorByVersion[vid];
            const prevZoom = prevState.zoomFactorByVersion[vid];

            if (
                pan?.x !== prevPan?.x ||
                pan?.y !== prevPan?.y ||
                zoom !== prevZoom
            ) {
                applyTransform(state);
            }
        });

        return () => unsubscribe();
    }, [isDOMActiveRef]);

    return {
        transformLayerRef
    };
};