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
    const setForceSave = useEditorStore((state) => state.setForceSave);

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

        const [fundamentalId, type] = getCurrentFundamental();
        const last = lastTypeAndVersionRef.current;

        if (!fundamentalId || !type) return;

        // ⛔ skip save als type en versie niet matchen met vorige
        // BUT: Don't skip on first initialization (when last values are null)
        if ((last.versionId !== activeVersionId || last.type !== type) && last.versionId !== null) {
            lastTypeAndVersionRef.current = {type, versionId: activeVersionId};
            return;
        }
        
        // Initialize tracking for first save
        if (last.versionId === null) {
            lastTypeAndVersionRef.current = {type, versionId: activeVersionId};
        }

        savingInProgress = true;
        setIsSaving(true);

        try {
            const {nodes, groupStack, openedGroup} = useNodesStore.getState();
            const {connections} = useConnectionsStore.getState();
            const payload = {nodes, connections, groups: {groupStack, openedGroup}};
            await updateNodeSetupVersionAPI(fundamentalId, activeVersionId, activeProjectId, payload, type);
            lastSaveTimeRef.current = Date.now();
        } catch (err) {
            console.error('Failed to save node setup:', err);
        } finally {
            setIsSaving(false);
            savingInProgress = false;
            debounceTimeout = null;
        }
    // eslint-disable-next-line
    }, [activeVersionId, activeProjectId, activeRouteId, activeScheduleId, activeBlueprintId, activeConfigId, setIsSaving]);
    
    // Create force save function that cancels debounce and saves immediately
    const forceImmediateSave = useCallback(async () => {
        console.log('Force save requested...');
        
        // Cancel any pending debounced save
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
            console.log('Cancelled pending debounced save');
        }
        
        // Wait for any ongoing save to complete
        let waitCount = 0;
        while (savingInProgress && waitCount < 200) { // Max 10 seconds
            await new Promise(resolve => setTimeout(resolve, 50));
            waitCount++;
        }
        
        if (savingInProgress) {
            console.error('Save still in progress after timeout - forcing anyway');
        }
        
        console.log('Executing immediate save...');
        
        // Force immediate save
        try {
            await doSave();
            console.log('Force save completed successfully');
        } catch (error) {
            console.error('Force save failed:', error);
            throw error;
        }
    }, [doSave]);
    
    // Register the force save function in the store
    useEffect(() => {
        setForceSave(forceImmediateSave);
        return () => setForceSave(null);
    }, [forceImmediateSave, setForceSave]);

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

    const lastTypeAndVersionRef = useRef<{ type: Fundamental | null, versionId: string | null }>({
        type: null,
        versionId: null,
    });

    const getCurrentFundamental = (): [string | undefined, Fundamental | null] => {
        if (activeRouteId) return [activeRouteId, Fundamental.Route];
        if (activeScheduleId) return [activeScheduleId, Fundamental.Schedule];
        if (activeBlueprintId) return [activeBlueprintId, Fundamental.Blueprint];
        if (activeConfigId) return [activeConfigId, Fundamental.Config];
        return [undefined, null];
    };

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