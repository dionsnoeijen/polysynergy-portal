import {useEffect} from 'react';
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import {updateNodeSetupVersionAPI} from "@/api/nodeSetupsApi";
import {State, StoreName} from "@/types/types";

export default function useGlobalStoreListenersWithImmediateSave() {
    const {nodes} = useNodesStore();
    const {connections} = useConnectionsStore();
    const {activeRouteId, activeScheduleId, activeBlueprintId, activeVersionId} = useEditorStore();
    const debounceInterval = 3000;
    const latestStates: Record<StoreName, State> = {
        nodes,
        connections,
    };
    let lastSavedAt = Date.now();
    let debounceTimeout: NodeJS.Timeout | null = null;

    const saveNodeSetup = () => {
        try {
            // console.log('Saving node setup',
            //     'activeRouteId', activeRouteId,
            //     'activeScheduleId', activeScheduleId,
            //     'activeBlueprintId', activeBlueprintId,
            //     'activeVersionId', activeVersionId
            // );

            if (activeVersionId) {
                if (activeRouteId) {
                    updateNodeSetupVersionAPI(
                        activeRouteId,
                        activeVersionId,
                        latestStates,
                        'route'
                    );
                }

                if (activeScheduleId) {
                    updateNodeSetupVersionAPI(
                        activeScheduleId,
                        activeVersionId,
                        latestStates,
                        'schedule'
                    );
                }

                if (activeBlueprintId) {
                    updateNodeSetupVersionAPI(
                        activeBlueprintId,
                        activeVersionId,
                        latestStates,
                        'blueprint'
                    );
                }
            }

            lastSavedAt = Date.now();
        } catch (error) {
            console.error("Failed to save node setup:", error);
        }
    };

    const triggerSave = () => {
        const now = Date.now();
        if (now - lastSavedAt >= debounceInterval) {
            saveNodeSetup();
        } else {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                saveNodeSetup();
            }, debounceInterval);
        }
    };

    useEffect(() => {
        const unsubscribeNodes = useNodesStore.subscribe((state) => {
            latestStates.nodes = state.nodes;
            triggerSave();
        });

        const unsubscribeConnections = useConnectionsStore.subscribe((state) => {
            latestStates.connections = state.connections;
            triggerSave();
        });

        return () => {
            unsubscribeNodes();
            unsubscribeConnections();
            if (debounceTimeout) clearTimeout(debounceTimeout);
        };
        // eslint-disable-next-line
    }, [activeRouteId, activeVersionId, activeScheduleId]);
}