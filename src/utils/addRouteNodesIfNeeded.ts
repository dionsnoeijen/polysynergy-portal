import useNodesStore from "@/stores/nodesStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import { v4 as uuidv4 } from "uuid";
import {Route} from "@/types/types";
import {
    Connection as ConnectionType,
    FlowState,
    NodeVariable,
    NodeVariableType,
    RouteSegment,
    RouteSegmentType,
} from "@/types/types";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";

const addRouteNodes = (route: Route) => {
    const getNodeByPath = useAvailableNodeStore.getState().getAvailableNodeByPath;
    const routeTemplate = getNodeByPath("polysynergy_nodes.route.route.Route");
    const mockTemplate = getNodeByPath("polysynergy_nodes.mock.mock_route_request.MockRouteRequest");

    if (!routeTemplate || !mockTemplate) return;

    const routeNode = {
        ...routeTemplate,
        id: uuidv4(),
        driven: true,
        flowState: FlowState.FlowIn,
        view: {
            x: 300,
            y: 0,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: true,
        },
    };

    const mockRouteNode = {
        ...mockTemplate,
        id: uuidv4(),
        view: {
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: true,
        },
    };

    const connection: ConnectionType = {
        id: uuidv4(),
        sourceNodeId: mockRouteNode.id,
        sourceHandle: "true_path",
        hidden: false,
        targetHandle: "node",
        targetNodeId: routeNode.id,
        isInGroup: undefined,
        isDeletable: false,
    };

    const { addNode, updateNodeVariable } = useNodesStore.getState();
    const { addConnection } = useConnectionsStore.getState();

    addNode(routeNode);
    addNode(mockRouteNode);
    addConnection(connection);

    const routeVariables: NodeVariable[] = route.segments
        .filter((segment: RouteSegment) => segment.type !== RouteSegmentType.Static)
        .map((segment: RouteSegment) => ({
            handle: segment.name,
            value: segment.default_value,
            type: segment.variable_type as NodeVariableType,
            published: false,
        }));

    updateNodeVariable(routeNode.id, "route_variables", routeVariables);
    updateNodeVariable(mockRouteNode.id, "route_variables", routeVariables);
    updateNodeVariable(routeNode.id, "method", route.method as string);
    updateNodeVariable(mockRouteNode.id, "method", route.method as string);
};

export function addRouteNodesIfNeeded(routeId: string) {
    let ticks = 0;
    const maxTicks = 50;
    const checkInterval = setInterval(() => {
        const activeId = useEditorStore.getState().activeRouteId;
        if (activeId !== routeId) {
            clearInterval(checkInterval);
            return;
        }

        const route = useDynamicRoutesStore.getState().getDynamicRoute(routeId);
        const nodes = useNodesStore.getState().nodes;
        if (!route || nodes.length > 0) {
            ticks++;
            if (ticks > maxTicks) clearInterval(checkInterval);
            return;
        }

        clearInterval(checkInterval);
        addRouteNodes(route);
    }, 100);
}