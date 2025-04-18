import { useEffect } from 'react';
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import { updateNodeSetupVersionAPI } from "@/api/nodeSetupsApi";
import { Fundamental } from "@/types/types";

let lastSaveTime = 0;
let debounceTimeout: NodeJS.Timeout | null = null;
let pendingSave = false;
let savingInProgress = false;

export default function useGlobalStoreListenersWithImmediateSave() {
    const {
        activeRouteId,
        activeScheduleId,
        activeBlueprintId,
        activeConfigId,
        activeVersionId,
        activeProjectId,
        setIsSaving,
    } = useEditorStore();

    const debounceInterval = 3000;

    const cancelPendingSave = () => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
            pendingSave = false;
            setIsSaving(false);
        }
    };

    const saveNodeSetup = async () => {
        const now = Date.now();
        const timeSinceLastSave = now - lastSaveTime;

        if (!activeVersionId || savingInProgress) return; // <== voorkom stacking

        const doSave = async () => {
            savingInProgress = true;
            try {
                setIsSaving(true);

                const {
                    nodes,
                    groupStack,
                    openedGroup
                } = useNodesStore.getState();

                const { connections } = useConnectionsStore.getState();

                const currentState = {
                    nodes,
                    connections,
                    groups: {
                        groupStack,
                        openedGroup
                    }
                };

                if (activeRouteId) {
                    await updateNodeSetupVersionAPI(activeRouteId, activeVersionId, activeProjectId, currentState, Fundamental.Route);
                } else if (activeScheduleId) {
                    await updateNodeSetupVersionAPI(activeScheduleId, activeVersionId, activeProjectId, currentState, Fundamental.Schedule);
                } else if (activeBlueprintId) {
                    await updateNodeSetupVersionAPI(activeBlueprintId, activeVersionId, activeProjectId, currentState, Fundamental.Blueprint);
                } else if (activeConfigId) {
                    await updateNodeSetupVersionAPI(activeConfigId, activeVersionId, activeProjectId, currentState, Fundamental.Config);
                }

                lastSaveTime = Date.now();
            } catch (error) {
                console.error("Failed to save node setup:", error);
            } finally {
                setIsSaving(false);
                pendingSave = false;
                debounceTimeout = null;
                savingInProgress = false; // <== weer vrijgeven
            }
        };

        if (timeSinceLastSave >= debounceInterval) {
            await doSave();
        } else {
            if (!pendingSave) {
                const delay = debounceInterval - timeSinceLastSave;
                setIsSaving(true);
                pendingSave = true;
                debounceTimeout = setTimeout(() => {
                    doSave();
                }, delay);
            }
        }
    };

    useEffect(() => {
        const unsubscribeNodes = useNodesStore.subscribe(() => {
            saveNodeSetup();
        });

        const unsubscribeConnections = useConnectionsStore.subscribe(() => {
            saveNodeSetup();
        });

        return () => {
            unsubscribeNodes();
            unsubscribeConnections();
            cancelPendingSave();
        };
        // eslint-disable-next-line
    }, [activeRouteId, activeVersionId, activeScheduleId, activeBlueprintId, activeConfigId]);

    useEffect(() => {
        cancelPendingSave();
        // eslint-disable-next-line
    }, [activeVersionId, activeRouteId, activeScheduleId, activeBlueprintId, activeConfigId]);
}