import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import {fetchDynamicRoute as fetchDynamicRouteAPI} from "@/api/dynamicRoutesApi";
import {fetchBlueprint as fetchBlueprintAPI} from "@/api/blueprintApi";
import {fetchSchedule as fetchScheduleAPI} from "@/api/schedulesApi";
import {NodeSetupVersion, Route} from "@/types/types";
import { disableAutosave, enableAutosave } from "@/hooks/editor/nodes/useGlobalStoresListener";

async function fetchAndApplyNodeSetup({
    routeId = null,
    scheduleId = null,
    blueprintId = null,
    versionId = null,
}: {
    routeId?: string | null;
    scheduleId?: string | null;
    blueprintId?: string | null;
    versionId?: string | null;
}) {

    if (!routeId && !scheduleId && !blueprintId) return;

    // CRITICAL: Ensure loading state is set (may already be set by menu click)
    useEditorStore.getState().setIsLoadingFlow(true);
    
    console.log("fetchAndApplyNodeSetup", { routeId, scheduleId, blueprintId });

    let version = null;

    const activeProjectId = useEditorStore.getState().activeProjectId;

    const getVersion = (versions: NodeSetupVersion[] | undefined) => {
        if (!versionId) {
            version = versions
                ?.sort((a, b) => b.version_number - a.version_number)[0];
        } else {
            version = versions
                ?.find((v) => v.id === versionId);
        }
        return version;
    }

    try {
        if (routeId) {
            const route: Route = await fetchDynamicRouteAPI(routeId, activeProjectId);
            version = getVersion(route?.node_setup?.versions);
        }
        if (scheduleId) {
            const schedule = await fetchScheduleAPI(scheduleId, activeProjectId);
            version = getVersion(schedule?.node_setup?.versions);
        }
        if (blueprintId) {
            const blueprint = await fetchBlueprintAPI(blueprintId, activeProjectId);
            version = getVersion(blueprint?.node_setup?.versions);
        }

        // CRITICAL: Disable autosave during node setup switching to prevent data corruption
        const setupType = routeId ? 'route' : scheduleId ? 'schedule' : 'blueprint';
        disableAutosave(`Switching to ${setupType} ${routeId || scheduleId || blueprintId}`);

        try {
            useEditorStore.getState().setIsDraft(version?.draft ?? false);
            useEditorStore.getState().setIsPublished(version?.published ?? false);
            useEditorStore.getState().setActiveVersionId(version?.id ?? 'nothing');
            useNodesStore.getState().initNodes(version?.content.nodes ?? []);
            if (version?.content.groups) {
                useNodesStore.getState().initGroups(
                    version?.content.groups.groupStack ?? [],
                    version?.content.groups.openedGroup ?? null
                );
            }
            useConnectionsStore.getState()
                .initConnections(version?.content.connections ?? []);
                
            // Wait a moment for all store updates to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } finally {
            // CRITICAL: Re-enable autosave after switching is complete
            enableAutosave(`Completed switch to ${setupType} ${routeId || scheduleId || blueprintId}`);
            
            // CRITICAL: Clear loading state to re-enable editor
            useEditorStore.getState().setIsLoadingFlow(false);
        }
    } catch (error) {
        console.error('Failed to fetch or apply node setup:', error);
        // Ensure autosave is re-enabled even on error
        enableAutosave('Error recovery during node setup switch');
        // CRITICAL: Clear loading state even on error
        useEditorStore.getState().setIsLoadingFlow(false);
    }
}

export default fetchAndApplyNodeSetup;