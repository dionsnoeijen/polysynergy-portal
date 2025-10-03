import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
import useDrawingStore from '@/stores/drawingStore';
import useMockStore from '@/stores/mockStore';
import fetchAndApplyNodeSetup from '@/utils/fetchNodeSetup';
import { addScheduleNodesIfNeeded } from '@/utils/addScheduleNodesIfNeeded';
import { addRouteNodesIfNeeded } from '@/utils/addRouteNodesIfNeeded';

interface RouteSetupProps {
    projectUuid?: string;
    routeUuid?: string;
    scheduleUuid?: string;
    blueprintUuid?: string;
}

export const useRouteSetup = ({ 
    projectUuid, 
    routeUuid, 
    scheduleUuid, 
    blueprintUuid 
}: RouteSetupProps) => {
    const pathname = usePathname();
    const clearMockStore = useMockStore((state) => state.clearMockStore);
    
    const setActiveProjectId = useEditorStore((state) => state.setActiveProjectId);
    const setActiveRouteId = useEditorStore((state) => state.setActiveRouteId);
    const setActiveScheduleId = useEditorStore((state) => state.setActiveScheduleId);
    const setActiveBlueprintId = useEditorStore((state) => state.setActiveBlueprintId);
    const setIsExecuting = useEditorStore((state) => state.setIsExecuting);
    const setIsSaving = useEditorStore((state) => state.setIsSaving);
    
    const initNodes = useNodesStore((state) => state.initNodes);
    const initConnections = useConnectionsStore((state) => state.initConnections);

    // CRITICAL: Safely clear stores to prevent data contamination
    const safelyClearStores = () => {
        // 1. Stop autosave to prevent saving mixed data
        setIsSaving(false);

        // 2. Clear stores immediately to prevent contamination
        initNodes([]);
        initConnections([]);
        useDrawingStore.getState().clearAllDrawings();

        console.log('🛡️ Stores cleared safely - preventing data contamination');
    };

    // Clear mock store on path change
    useEffect(() => {
        clearMockStore();
    }, [clearMockStore, pathname]);

    // Set active project
    useEffect(() => {
        setActiveProjectId(projectUuid || '');
    }, [projectUuid, setActiveProjectId]);

    // Handle route/schedule/blueprint setup
    useEffect(() => {
        const { hasLoadedOnce } = useEditorStore.getState();
        
        if (routeUuid) {
            // CRITICAL: Only clear stores on switching, not initial load (prevents crude reset)
            if (hasLoadedOnce) {
                safelyClearStores();
                console.log('🔄 Switching to route - stores cleared');
            } else {
                console.log('🚀 Initial route load - preserving UI state');
            }
            
            setActiveRouteId(routeUuid);
            // Only clear other IDs if they're not already empty (prevent unnecessary re-renders)
            const currentState = useEditorStore.getState();
            if (currentState.activeScheduleId !== '') {
                setActiveScheduleId('');
            }
            if (currentState.activeBlueprintId !== '') {
                setActiveBlueprintId('');
            }
            fetchAndApplyNodeSetup({ routeId: routeUuid });
            addRouteNodesIfNeeded(routeUuid);
            setIsExecuting(null);
            
            // Mark as loaded for future switches
            if (!hasLoadedOnce) {
                useEditorStore.getState().setHasLoadedOnce(true);
                console.log('✅ First load complete - future clicks will be switches');
            }
        } else if (scheduleUuid) {
            // CRITICAL: Only clear stores on switching, not initial load (prevents crude reset)
            if (hasLoadedOnce) {
                safelyClearStores();
                console.log('🔄 Switching to schedule - stores cleared');
            } else {
                console.log('🚀 Initial schedule load - preserving UI state');
            }
            
            // Only clear other IDs if they're not already empty (prevent unnecessary re-renders)
            const currentState = useEditorStore.getState();
            if (currentState.activeRouteId !== '') {
                setActiveRouteId('');
            }
            setActiveScheduleId(scheduleUuid);
            if (currentState.activeBlueprintId !== '') {
                setActiveBlueprintId('');
            }
            fetchAndApplyNodeSetup({ scheduleId: scheduleUuid });
            addScheduleNodesIfNeeded(scheduleUuid);
            setIsExecuting(null);
            
            // Mark as loaded for future switches
            if (!hasLoadedOnce) {
                useEditorStore.getState().setHasLoadedOnce(true);
                console.log('✅ First load complete - future clicks will be switches');
            }
        } else if (blueprintUuid) {
            // CRITICAL: Only clear stores on switching, not initial load (prevents crude reset)
            if (hasLoadedOnce) {
                safelyClearStores();
                console.log('🔄 Switching to blueprint - stores cleared');
            } else {
                console.log('🚀 Initial blueprint load - preserving UI state');
            }
            
            // Only clear other IDs if they're not already empty (prevent unnecessary re-renders)
            const currentState = useEditorStore.getState();
            if (currentState.activeRouteId !== '') {
                setActiveRouteId('');
            }
            if (currentState.activeScheduleId !== '') {
                setActiveScheduleId('');
            }
            setActiveBlueprintId(blueprintUuid);
            fetchAndApplyNodeSetup({ blueprintId: blueprintUuid });
            setIsExecuting(null);
            
            // Mark as loaded for future switches
            if (!hasLoadedOnce) {
                useEditorStore.getState().setHasLoadedOnce(true);
                console.log('✅ First load complete - future clicks will be switches');
            }
        }
    }, [
        routeUuid, 
        scheduleUuid, 
        blueprintUuid, 
        setActiveRouteId, 
        setActiveScheduleId, 
        setActiveBlueprintId, 
        setIsExecuting
    ]);

    return {
        // These could be computed values if needed
        hasValidRoute: !!(routeUuid || scheduleUuid || blueprintUuid)
    };
};