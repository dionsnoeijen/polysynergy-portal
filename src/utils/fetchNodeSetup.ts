import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import {fetchDynamicRoute as fetchDynamicRouteAPI} from "@/api/dynamicRoutesApi";
import {fetchBlueprint as fetchBlueprintAPI} from "@/api/blueprintApi";
import {fetchSchedule as fetchScheduleAPI} from "@/api/schedulesApi";
import {fetchConfig } from "@/api/configsApi";
import {NodeSetupVersion, Route} from "@/types/types";

async function fetchAndApplyNodeSetup({
    routeId = null,
    scheduleId = null,
    blueprintId = null,
    configId = null,
    versionId = null,
}: {
    routeId?: string | null;
    scheduleId?: string | null;
    blueprintId?: string | null;
    configId?: string | null;
    versionId?: string | null;
}) {
    if (!routeId && !scheduleId && !blueprintId && !configId) return;

    let version = null;

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
            const route: Route = await fetchDynamicRouteAPI(routeId);
            version = getVersion(route?.node_setup?.versions);
        }
        if (scheduleId) {
            const schedule = await fetchScheduleAPI(scheduleId);
            version = getVersion(schedule?.node_setup?.versions);
        }
        if (blueprintId) {
            const blueprint = await fetchBlueprintAPI(blueprintId);
            version = getVersion(blueprint?.node_setup?.versions);
        }
        if (configId) {
            const config = await fetchConfig(configId);
            version = getVersion(config?.node_setup?.versions);
        }

        useEditorStore.getState().setIsDraft(version?.draft ?? false);
        useEditorStore.getState().setIsPublished(version?.published ?? false);
        useEditorStore.getState().setActiveVersionId(version?.id ?? '');
        useNodesStore.getState().initNodes(version?.content.nodes ?? []);
        if (version?.content.groups) {
            useNodesStore.getState().initGroups(
                version?.content.groups.groupStack ?? [],
                version?.content.groups.openedGroup ?? null
            );
        }
        useConnectionsStore.getState()
            .initConnections(version?.content.connections ?? []);
    } catch (error) {
        console.error('Failed to fetch or apply node setup:', error);
    }
}

export default fetchAndApplyNodeSetup;