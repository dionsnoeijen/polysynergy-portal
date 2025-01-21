import {useEffect} from 'react';
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useGroupsStore from "@/stores/groupStore";
import useEditorStore from "@/stores/editorStore";
import {updateNodeSetupVersionAPI} from "@/api/nodeSetupsApi";
import {State, StoreName} from "@/types/types";

export default function useGlobalStoreListenersWithImmediateSave() {
    const {nodes, currentRouteData} = useNodesStore();
    const {connections} = useConnectionsStore();
    const {groups} = useGroupsStore();
    const {activeRouteId, activeScheduleId} = useEditorStore();
    const debounceInterval = 3000;
    const latestStates: Record<StoreName, State> = {
        nodes,
        connections,
        groups,
    };
    let lastSavedAt = Date.now();
    let debounceTimeout: NodeJS.Timeout | null = null;

    const saveNodeSetup = () => {
        try {
            if (activeRouteId) {
                updateNodeSetupVersionAPI(
                    activeRouteId,
                    currentRouteData?.node_setup?.versions[0].id as string,
                    latestStates,
                    'route'
                );
            } else if (activeScheduleId) {
                console.log('Implement schedule saving');
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

        const unsubscribeGroups = useGroupsStore.subscribe((state) => {
            latestStates.groups = state.groups;
            triggerSave();
        });

        return () => {
            unsubscribeNodes();
            unsubscribeConnections();
            unsubscribeGroups();
            if (debounceTimeout) clearTimeout(debounceTimeout);
        };
        // eslint-disable-next-line
    }, []);
}