import {useEffect} from "react";
import {v4 as uuidv4} from "uuid";
import useAvailableNodeStore from "@/stores/availableNodesStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import useEditorStore from "@/stores/editorStore";
import {
    Connection as ConnectionType,
    FlowState,
    Node as NodeType,
    NodeVariable,
    NodeVariableType,
    RouteSegment,
    RouteSegmentType
} from "@/types/types";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";

export function useAutoAddRouteNodes() {
    const availableNodes = useAvailableNodeStore((state) => state.availableNodes);
    const getAvailableNodeByPath = useAvailableNodeStore((state) => state.getAvailableNodeByPath);
    const addNode = useNodesStore((state) => state.addNode);
    const addConnection = useConnectionsStore((state) => state.addConnection);
    const nodes = useNodesStore((state) => state.nodes);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);

    useEffect(() => {
        if (nodes.length > 0 || !activeRouteId) return;

        const routeNode: NodeType | undefined = getAvailableNodeByPath(`nodes.nodes.route.route.Route`);
        const mockRouteNode: NodeType | undefined = getAvailableNodeByPath(`nodes.nodes.mock.mock_route_request.MockRouteRequest`);
        const dynamicRoute = getDynamicRoute(activeRouteId);

        if (!routeNode || !mockRouteNode || !dynamicRoute) return;

        routeNode.id = uuidv4();
        routeNode.driven = true;
        routeNode.flowState = FlowState.FlowIn;

        routeNode.view = {
            x: 400,
            y: 100,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: true,
        };

        mockRouteNode.id = uuidv4();
        mockRouteNode.view = {
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            adding: false,
            isDeletable: false,
            collapsed: true,
        };

        const connection: ConnectionType = {
            id: uuidv4(),
            sourceNodeId: mockRouteNode.id,
            sourceHandle: "true_path",
            hidden: false,
            targetHandle: "node",
            targetNodeId: routeNode.id,
            isInGroup: undefined
        };

        addNode(routeNode);
        addNode(mockRouteNode);
        addConnection(connection);

        const routeVariables: NodeVariable[] = [];
        dynamicRoute?.segments.map((segment: RouteSegment) => {
            if (segment.type === RouteSegmentType.Static) return;
            routeVariables.push({
                handle: segment.name,
                value: segment.default_value,
                type: segment.variable_type as NodeVariableType,
                published: false
            });
        });

        updateNodeVariable(routeNode.id, 'route_variables', routeVariables);
        updateNodeVariable(mockRouteNode.id, 'route_variables', routeVariables);
        updateNodeVariable(routeNode.id, 'method', dynamicRoute.method as string);
        updateNodeVariable(mockRouteNode.id, 'method', dynamicRoute.method as string);

    }, [
        nodes,
        availableNodes,
        activeRouteId,
        getAvailableNodeByPath,
        getDynamicRoute,
        addNode,
        addConnection,
        updateNodeVariable
    ]);
}