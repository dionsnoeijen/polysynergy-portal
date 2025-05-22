import React, {useLayoutEffect} from 'react'
import useEditorStore from '@/stores/editorStore'
import type {Node} from '@/types/types'

/**
 * Hook om bij de eerste keer nodes in de editor automatisch te fitten,
 * en opnieuw te fitten als de resetKey verandert (bijv. projectUuid of versionId).
 *
 * @param containerRef Ref naar de editor‐container
 * @param nodes Array met nodes waar de bounds van berekend worden
 * @param padding Padding rondom de nodes (default 40px)
 * @param resetKey Key die, bij wijziging, de fit opnieuw triggert
 */
export function useAutoFitNodes(
    containerRef: React.RefObject<HTMLElement>,
    nodes: Node[],
    padding = 40,
    resetKey?: string | number
) {
    useLayoutEffect(() => {
        const store = useEditorStore.getState();
        const versionId = store.activeVersionId;
        if (!versionId) return;
        if (nodes.length === 0) return;

        const alreadyHasZoom = versionId in store.zoomFactorByVersion;
        const alreadyHasPan = versionId in store.panPositionsByVersion;
        if (alreadyHasZoom && alreadyHasPan) return;

        const container = containerRef.current;
        if (!container) return;

        const id = setTimeout(() => {
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

            for (const node of nodes) {
                const {x, y, width, height} = node.view;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + width);
                maxY = Math.max(maxY, y + height);
            }

            const boundsW = maxX - minX;
            const boundsH = maxY - minY;
            const {width: cw, height: ch} = container.getBoundingClientRect();
            const targetW = boundsW + padding * 2;
            const targetH = boundsH + padding * 2;

            const zoom = Math.min(cw / targetW, ch / targetH, 1);
            store.setZoomFactorForVersion(zoom);

            const panX = (cw - boundsW * zoom) / 2 - minX * zoom;
            const panY = (ch - boundsH * zoom) / 2 - minY * zoom;
            store.setPanPositionForVersion({x: panX, y: panY});
        }, 60);

        return () => clearTimeout(id);
    }, [containerRef, nodes, padding, resetKey]);
}