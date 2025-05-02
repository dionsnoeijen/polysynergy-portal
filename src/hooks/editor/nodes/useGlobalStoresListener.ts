import {useCallback, useEffect, useRef} from 'react';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import useEditorStore from '@/stores/editorStore';
import {updateNodeSetupVersionAPI} from '@/api/nodeSetupsApi';
import {Fundamental} from '@/types/types';

let debounceTimeout: NodeJS.Timeout | null = null;
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
    const lastSaveTimeRef = useRef<number>(Date.now());

    const cancelPendingSave = useCallback(() => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }
        setIsSaving(false);
    }, [setIsSaving]);

    const doSave = useCallback(async () => {
        if (!activeVersionId || savingInProgress) return;
        savingInProgress = true;
        setIsSaving(true);
        try {
            const {nodes, groupStack, openedGroup} = useNodesStore.getState();
            const {connections} = useConnectionsStore.getState();
            const payload = {nodes, connections, groups: {groupStack, openedGroup}};

            const args = [activeVersionId, activeProjectId, payload] as const;

            if (activeRouteId) {
                await updateNodeSetupVersionAPI(activeRouteId, ...args, Fundamental.Route);
            } else if (activeScheduleId) {
                await updateNodeSetupVersionAPI(activeScheduleId, ...args, Fundamental.Schedule);
            } else if (activeBlueprintId) {
                await updateNodeSetupVersionAPI(activeBlueprintId, ...args, Fundamental.Blueprint);
            } else if (activeConfigId) {
                await updateNodeSetupVersionAPI(activeConfigId, ...args, Fundamental.Config);
            }

            lastSaveTimeRef.current = Date.now();
        } catch (err) {
            console.error('Failed to save node setup:', err);
        } finally {
            setIsSaving(false);
            savingInProgress = false;
            debounceTimeout = null;
        }
    }, [activeBlueprintId, activeConfigId, activeProjectId, activeRouteId, activeScheduleId, activeVersionId, setIsSaving]);

    const saveNodeSetup = useCallback(() => {
        const now = Date.now();
        const elapsed = now - lastSaveTimeRef.current;

        if (elapsed >= debounceInterval) {
            doSave();
        } else {
            if (!debounceTimeout) {
                setIsSaving(true);
                debounceTimeout = setTimeout(doSave, debounceInterval - elapsed);
            }
        }
    }, [doSave, setIsSaving]);

    useEffect(() => {
        lastSaveTimeRef.current = Date.now();
        cancelPendingSave();
    }, [activeVersionId, cancelPendingSave]);

    useEffect(() => {
        let ready = false;
        const tick = setTimeout(() => {
            ready = true;
        }, 0);

        const unsubNodes = useNodesStore.subscribe(() => {
            if (ready) saveNodeSetup();
        });
        const unsubConns = useConnectionsStore.subscribe(() => {
            if (ready) saveNodeSetup();
        });

        return () => {
            clearTimeout(tick);
            unsubNodes();
            unsubConns();
            cancelPendingSave();
        };
    }, [activeRouteId, activeScheduleId, activeBlueprintId, activeConfigId, saveNodeSetup, cancelPendingSave]);
}