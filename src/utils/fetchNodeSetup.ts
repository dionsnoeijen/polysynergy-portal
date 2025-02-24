import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import { fetchDynamicRoute as fetchDynamicRouteAPI } from "@/api/dynamicRoutesApi";
import { fetchBlueprint as fetchBlueprintAPI } from "@/api/blueprintApi";
import { fetchSchedule as fetchScheduleAPI } from "@/api/schedulesApi";
import { Route } from "@/types/types";

async function fetchAndApplyNodeSetup({
    routeId = null,
    scheduleId = null,
    blueprintId = null,
}: {
    routeId?: string | null;
    scheduleId?: string | null;
    blueprintId?: string | null;
}) {
    if (!routeId && !scheduleId && !blueprintId) return;

    try {
        if (routeId) {
            const route: Route = await fetchDynamicRouteAPI(routeId);
            useEditorStore.getState().setActiveVersionId(route.node_setup?.versions[0]?.id ?? '');
            useNodesStore.getState().initNodes(route.node_setup?.versions[0]?.content.nodes ?? []);
            useConnectionsStore.getState().initConnections(route.node_setup?.versions[0]?.content.connections ?? []);
        }

        if (scheduleId) {
            const schedule = await fetchScheduleAPI(scheduleId);
            useEditorStore.getState().setActiveVersionId(schedule.node_setup?.versions[0]?.id ?? '');
            useNodesStore.getState().initNodes(schedule.node_setup?.versions[0]?.content.nodes ?? []);
            useConnectionsStore.getState().initConnections(schedule.node_setup?.versions[0]?.content.connections ?? []);
        }

        if (blueprintId) {
            const blueprint = await fetchBlueprintAPI(blueprintId);
            useEditorStore.getState().setActiveVersionId(blueprint.node_setup?.versions[0]?.id ?? '');
            useNodesStore.getState().initNodes(blueprint.node_setup?.versions[0]?.content.nodes ?? []);
            useConnectionsStore.getState().initConnections(blueprint.node_setup?.versions[0]?.content.connections ?? []);
        }

        console.log('Node setup successfully applied to the store.');
    } catch (error) {
        console.error('Failed to fetch or apply node setup:', error);
    }
}

export default fetchAndApplyNodeSetup;