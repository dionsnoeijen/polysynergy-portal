import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useEditorStore from '@/stores/editorStore';
import useNodesStore from '@/stores/nodesStore';
import useConnectionsStore from '@/stores/connectionsStore';
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
        if (routeUuid) {
            // CRITICAL: Clear stores BEFORE switching to prevent data contamination
            safelyClearStores();
            
            setActiveRouteId(routeUuid);
            setActiveScheduleId('');
            setActiveBlueprintId('');
            fetchAndApplyNodeSetup({ routeId: routeUuid });
            addRouteNodesIfNeeded(routeUuid);
            setIsExecuting(null);
        } else if (scheduleUuid) {
            // CRITICAL: Clear stores BEFORE switching to prevent data contamination
            safelyClearStores();
            
            setActiveRouteId('');
            setActiveScheduleId(scheduleUuid);
            setActiveBlueprintId('');
            fetchAndApplyNodeSetup({ scheduleId: scheduleUuid });
            addScheduleNodesIfNeeded(scheduleUuid);
            setIsExecuting(null);
        } else if (blueprintUuid) {
            // CRITICAL: Clear stores BEFORE switching to prevent data contamination
            safelyClearStores();
            
            setActiveRouteId('');
            setActiveScheduleId('');
            setActiveBlueprintId(blueprintUuid);
            fetchAndApplyNodeSetup({ blueprintId: blueprintUuid });
            setIsExecuting(null);
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