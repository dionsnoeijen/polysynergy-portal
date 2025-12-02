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
                    has_out: true,
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

            // For mock nodes, preserve existing mock values
            const existingRouteVariables = node.variables.find(v => v.handle === 'route_variables');
            const existingValues = Array.isArray(existingRouteVariables?.value)
                ? existingRouteVariables.value as NodeVariable[]
                : [];

            // Merge new route structure with existing mock values
            const mergedRouteVariables = routeVariables.map((newVar) => {
                const existingVar = existingValues.find(v => v.handle === newVar.handle);

                // If variable exists and has a non-null value, preserve it
                if (existingVar && existingVar.value !== null && existingVar.value !== undefined) {
                    return {
                        ...newVar,
                        value: existingVar.value, // Keep existing mock value
                    };
                }

                // Otherwise use the default value from route
                return newVar;
            });

            updateNodeVariable(node.id, 'route_variables', mergedRouteVariables);
            updateNodeVariable(node.id, 'method', route.method);
        });

    }, [activeRouteId, getDynamicRoute, getNodesByPath, updateNodeVariable]);
}