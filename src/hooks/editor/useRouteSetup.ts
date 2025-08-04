import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useEditorStore from '@/stores/editorStore';
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
            setActiveRouteId(routeUuid);
            setActiveScheduleId('');
            setActiveBlueprintId('');
            fetchAndApplyNodeSetup({ routeId: routeUuid });
            addRouteNodesIfNeeded(routeUuid);
            setIsExecuting(null);
        } else if (scheduleUuid) {
            setActiveRouteId('');
            setActiveScheduleId(scheduleUuid);
            setActiveBlueprintId('');
            fetchAndApplyNodeSetup({ scheduleId: scheduleUuid });
            addScheduleNodesIfNeeded(scheduleUuid);
            setIsExecuting(null);
        } else if (blueprintUuid) {
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