import {useCallback, useEffect, useRef} from 'react';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import useEditorStore from '@/stores/editorStore';
import {updateNodeSetupVersionAPI} from '@/api/nodeSetupsApi';
import {Fundamental} from '@/types/types';

let debounceTimeout: NodeJS.Timeout | null = null;
let savingInProgress = false;

export default function useGlobalStoreListenersWithImmediateSave() {
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const activeScheduleId = useEditorStore((state) => state.activeScheduleId);
    const activeBlueprintId = useEditorStore((state) => state.activeBlueprintId);
    const activeConfigId = useEditorStore((state) => state.activeConfigId);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const setIsSaving = useEditorStore((state) => state.setIsSaving);

    const debounceInterval = 1000;
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
        const unsubNodes = useNodesStore.subscribe(() => {
            setTimeout(() => saveNodeSetup(), 0);
        });
        const unsubConns = useConnectionsStore.subscribe(() => {
            setTimeout(() => saveNodeSetup(), 0);
        });

        return () => {
            unsubNodes();
            unsubConns();
            cancelPendingSave();
        };
    }, [activeRouteId, activeScheduleId, activeBlueprintId, activeConfigId, saveNodeSetup, cancelPendingSave]);
}