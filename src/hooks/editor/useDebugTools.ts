import { useEffect } from 'react';
import useConnectionsStore from '@/stores/connectionsStore';
import useNodesStore from '@/stores/nodesStore';

export const useDebugTools = () => {
    const removeConnectionById = useConnectionsStore((state) => state.removeConnectionById);
    const removeNode = useNodesStore((state) => state.removeNode);

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.debugMode = false;
            
            window.toggleDebug = function () {
                window.debugMode = !window.debugMode;
                console.log("Debug mode is:", window.debugMode);
            };
            
            // @ts-expect-error value is ambiguous
            window.snipeConnection = function (connectionId: string) {
                console.log('SNIPE', connectionId);
                removeConnectionById(connectionId);
            };

            // @ts-expect-error value is ambiguous
            window.snipeNode = function (nodeId: string) {
                console.log('SNIPE', nodeId);
                removeNode(nodeId);
            };
        }
    }, [removeConnectionById, removeNode]);

    return {
        // Debug tools are attached to window, no return needed
    };
};