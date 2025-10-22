import { useEffect } from 'react';
import useConnectionsStore from '@/stores/connectionsStore';
import { Connection } from '@/types/types';

const VISUAL_CONNECTION_ID = 'warp-visual-';

export const useWarpGateVisualConnection = (
    isActive: boolean,
    gateNodeId: string,
    sourceNodeId: string | undefined,
    sourceHandle: string | undefined
) => {
    useEffect(() => {
        if (!isActive || !sourceNodeId || !sourceHandle) {
            // Remove visual connection from store if it exists
            const visualConnectionId = `${VISUAL_CONNECTION_ID}${gateNodeId}`;
            const existingConnection = useConnectionsStore.getState().getConnection(visualConnectionId);
            if (existingConnection) {
                useConnectionsStore.getState().removeConnectionById(visualConnectionId);
            }
            return;
        }

        // Wait for next frame to ensure DOM is updated (important after paste)
        const frame = requestAnimationFrame(() => {
            // Create a temporary visual connection using the normal connection system
            const visualConnectionId = `${VISUAL_CONNECTION_ID}${gateNodeId}`;

            const visualConnection: Connection = {
                id: visualConnectionId,
                sourceNodeId: sourceNodeId,
                sourceHandle: sourceHandle,
                targetNodeId: gateNodeId,
                targetHandle: 'in_visual',
                hidden: false,
                disabled: false,
                collapsed: false,
                // DON'T use temp: true - it gets filtered out in editor.tsx!
            };

            // Add to connections store
            useConnectionsStore.getState().addConnection(visualConnection);
        });

        // Cleanup
        return () => {
            cancelAnimationFrame(frame);
            const visualConnectionId = `${VISUAL_CONNECTION_ID}${gateNodeId}`;
            const connectionToRemove = useConnectionsStore.getState().getConnection(visualConnectionId);
            if (connectionToRemove) {
                useConnectionsStore.getState().removeConnectionById(visualConnectionId);
            }
        };
    }, [isActive, gateNodeId, sourceNodeId, sourceHandle]);
};
