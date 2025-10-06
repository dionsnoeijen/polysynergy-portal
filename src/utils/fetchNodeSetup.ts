import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import useDrawingStore from "@/stores/drawingStore";
import {fetchDynamicRoute as fetchDynamicRouteAPI} from "@/api/dynamicRoutesApi";
import {fetchBlueprint as fetchBlueprintAPI} from "@/api/blueprintApi";
import {fetchSchedule as fetchScheduleAPI} from "@/api/schedulesApi";
import {fetchChatWindow as fetchChatWindowAPI} from "@/api/chatWindowsApi";
import {NodeSetupVersion, Route} from "@/types/types";

async function fetchAndApplyNodeSetup({
    routeId = null,
    scheduleId = null,
    chatWindowId = null,
    blueprintId = null,
    versionId = null,
}: {
    routeId?: string | null;
    scheduleId?: string | null;
    chatWindowId?: string | null;
    blueprintId?: string | null;
    versionId?: string | null;
}) {

    if (!routeId && !scheduleId && !chatWindowId && !blueprintId) return;

    // CRITICAL: Ensure loading state is set (may already be set by menu click)
    useEditorStore.getState().setIsLoadingFlow(true);
    
    console.log("fetchAndApplyNodeSetup", { routeId, scheduleId, chatWindowId, blueprintId });

    let version: NodeSetupVersion | null | undefined = null;

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
        if (chatWindowId) {
            const chatWindow = await fetchChatWindowAPI(chatWindowId, activeProjectId);
            version = getVersion(chatWindow?.node_setup?.versions);
        }
        if (blueprintId) {
            const blueprint = await fetchBlueprintAPI(blueprintId, activeProjectId);
            version = getVersion(blueprint?.node_setup?.versions);
        }

        // CRITICAL: Autosave already disabled by tree click handler - just identify setup type
        const setupType = routeId ? 'route' : scheduleId ? 'schedule' : chatWindowId ? 'chat window' : 'blueprint';
        console.log(`📥 Loading ${setupType} data...`);

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

            // Load drawings if they exist
            if (version?.content.drawings && version.id) {
                const drawingStore = useDrawingStore.getState();
                const versionId = version.id;
                // Clear existing drawings for this version first
                drawingStore.paths.filter(p => p.versionId === versionId).forEach(p => drawingStore.deletePath(p.id));
                drawingStore.shapes.filter(s => s.versionId === versionId).forEach(s => drawingStore.deleteShape(s.id));
                drawingStore.images.filter(i => i.versionId === versionId).forEach(i => drawingStore.deleteImage(i.id));
                drawingStore.notes.filter(n => n.versionId === versionId).forEach(n => drawingStore.deleteNote(n.id));

                // Add loaded drawings
                version.content.drawings.paths?.forEach(path => drawingStore.addPath(path));
                version.content.drawings.shapes?.forEach(shape => drawingStore.addShape(shape));
                version.content.drawings.images?.forEach(image => drawingStore.addImage(image));
                version.content.drawings.notes?.forEach(note => drawingStore.addNote(note));
            }

            // Wait a moment for all store updates to complete
            await new Promise(resolve => setTimeout(resolve, 100));

        } finally {
            // CRITICAL: Re-enable autosave after loading is complete (replaces old module-based control)
            useEditorStore.getState().setAutosaveEnabled(true);
            useEditorStore.getState().setIsLoadingFlow(false);
            console.log(`✅ ${setupType} loaded - autosave re-enabled`);
        }
    } catch (error) {
        console.error('Failed to fetch or apply node setup:', error);
        // CRITICAL: Ensure autosave is re-enabled even on error for safety
        useEditorStore.getState().setAutosaveEnabled(true);
        useEditorStore.getState().setIsLoadingFlow(false);
        console.log('⚠️ Error recovery - autosave re-enabled for safety');
    }
}

export default fetchAndApplyNodeSetup;