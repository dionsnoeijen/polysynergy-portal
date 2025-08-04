import useEditorStore from "@/stores/editorStore";
import useDynamicRoutesStore from "@/stores/dynamicRoutesStore";
import useNodesStore from "@/stores/nodesStore";
import {useEffect} from "react";
import {NodeVariable, NodeVariableType, RouteSegment, RouteSegmentType} from "@/types/types";

export function useAutoUpdateRouteNodes() {
    const activeRouteId = useEditorStore((state) => state.activeRouteId);
    const getDynamicRoute = useDynamicRoutesStore((state) => state.getDynamicRoute);
    const getNodesByPath = useNodesStore((state) => state.getNodesByPath);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    useEffect(() => {
        if (!activeRouteId) return;

        const route = getDynamicRoute(activeRouteId);
        if (!route) return;

        const routeNodes = getNodesByPath(`polysynergy_nodes.route.route.Route`);
        const mockRouteNodes = getNodesByPath(`polysynergy_nodes.mock.mock_route_request.MockRouteRequest`);

        if (!routeNodes || !mockRouteNodes) return;

        const routeVariables: NodeVariable[] = [];
            route?.segments.map((segment: RouteSegment) => {
                if (segment.type === RouteSegmentType.Static) return;
                routeVariables.push({
                    handle: segment.name,
                    value: segment.default_value,
                    type: segment.variable_type as NodeVariableType,
                    published: false
                });
            });

        routeNodes.forEach((node) => {
            if (node.view.isDeletable !== false) return;

            updateNodeVariable(node.id, 'route_variables', routeVariables);
            updateNodeVariable(node.id, 'method', route.method);
        });

        mockRouteNodes.forEach((node) => {
            if (node.view.isDeletable !== false) return;

            updateNodeVariable(node.id, 'route_variables', routeVariables);
            updateNodeVariable(node.id, 'method', route.method);
        });

    }, [activeRouteId, getDynamicRoute, getNodesByPath, updateNodeVariable]);
}