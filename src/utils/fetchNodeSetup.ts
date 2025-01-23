import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import {fetchDynamicRoute as fetchDynamicRouteAPI} from "@/api/dynamicRoutesApi";
import {Route} from "@/types/types";

async function fetchAndApplyNodeSetup(
    routeId: string|null = null,
    scheduleId: string|null = null
) {
    if (!routeId && !scheduleId) return;

    try {
        if (routeId) {
            const route: Route = await fetchDynamicRouteAPI(routeId);
            useEditorStore.getState().setActiveVersionId(route.node_setup?.versions[0].id ?? '');
            useNodesStore.getState().initNodes(route.node_setup?.versions[0].content.nodes ?? []);
            useConnectionsStore.getState().initConnections(route.node_setup?.versions[0].content.connections ?? []);
        }

        if (scheduleId) {
            console.log('IMPLEMENT SCHEDULE');
        }

        console.log('Node setup successfully applied to the store.');
    } catch (error) {
        console.error('Failed to fetch or apply node setup:', error);
    }
}

export default fetchAndApplyNodeSetup;