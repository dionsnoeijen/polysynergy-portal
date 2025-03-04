import { useEffect } from 'react';
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import { updateNodeSetupVersionAPI } from "@/api/nodeSetupsApi";
import { State, StoreName } from "@/types/types";

export default function useGlobalStoreListenersWithImmediateSave() {
    const nodes = useNodesStore((state) => state.nodes);
    const connections = useConnectionsStore((state) => state.connections);
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const activeBlueprintId = useEditorStore((state) => state.activeBlueprintId);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const setIsSaving = useEditorStore((state) => state.setIsSaving);
    const debounceInterval = 3000;
    const latestStates: Record<StoreName, State> = { nodes, connections };

    let debounceTimeout: NodeJS.Timeout | null = null;
    let isSaving = false;

    const cancelSave = () => {
        if (debounceTimeout) {
            setIsSaving(false);
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }
    };

    const saveNodeSetup = async () => {

        if (isSaving) return;

        try {
            isSaving = true;

            const { activeRouteId, activeScheduleId, activeBlueprintId, activeVersionId } = useEditorStore.getState();

            if (!activeVersionId) return;

            if (activeRouteId) {
                await updateNodeSetupVersionAPI(
                    activeRouteId,
                    activeVersionId,
                    latestStates,
                    'route'
                );
            }

            if (activeScheduleId) {
                await updateNodeSetupVersionAPI(
                    activeScheduleId,
                    activeVersionId,
                    latestStates,
                    'schedule'
                );
            }

            if (activeBlueprintId) {
                await updateNodeSetupVersionAPI(
                    activeBlueprintId,
                    activeVersionId,
                    latestStates,
                    'blueprint'
                );
            }
            setIsSaving(false);

        } catch (error) {
            console.error("Failed to save node setup:", error);
        } finally {
            isSaving = false;
        }
    };

    const triggerSave = () => {
        cancelSave();
        setIsSaving(true);
        debounceTimeout = setTimeout(() => {
            saveNodeSetup();
        }, debounceInterval);
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
            cancelSave();
        };
    // eslint-disable-next-line
    }, [activeRouteId, activeVersionId, activeScheduleId, activeBlueprintId]);

    useEffect(() => {
        cancelSave();
    // eslint-disable-next-line
    }, [activeVersionId, activeRouteId, activeScheduleId, activeBlueprintId]);
}