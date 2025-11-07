import { useCallback } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { Connection, NodeType } from "@/types/types";
import { getNodeBoundsFromState } from "@/utils/positionUtils";
import { v4 as uuidv4 } from "uuid";

const useGroupCreation = () => {
    const createGroup = useCallback((): string | null => {
        // PERFORMANCE: Use getState() pattern to avoid store subscriptions
        const selectedNodes = useEditorStore.getState().selectedNodes;
        const setSelectedNodes = useEditorStore.getState().setSelectedNodes;
        const openGroupStore = useNodesStore.getState().openGroup;
        const dissolveGroupStore = useNodesStore.getState().dissolveGroup;
        const hideGroup = useNodesStore.getState().hideGroup;
        const showGroup = useNodesStore.getState().showGroup;
        const removeNodeFromGroupStore = useNodesStore.getState().removeNodeFromGroup;
        const getGroupById = useNodesStore.getState().getGroupById;
        const addNodeToGroup = useNodesStore.getState().addNodeToGroup;
        const addGroupNode = useNodesStore.getState().addGroupNode;
        const disableAllNodesViewExceptByIds = useNodesStore.getState().disableAllNodesViewExceptByIds;
        const currentOpenGroup = useNodesStore.getState().openedGroup;
        const findInConnectionsByNodeId = useConnectionsStore.getState().findInConnectionsByNodeId;
        const findOutConnectionsByNodeId = useConnectionsStore.getState().findOutConnectionsByNodeId;
        const removeConnections = useConnectionsStore.getState().removeConnections;
        const updateConnection = useConnectionsStore.getState().updateConnection;
        const getAllNodes = useNodesStore.getState().getNodes;

        if (selectedNodes.length < 2) return null;

        // Find all warp gates that belong to the selected nodes and add them to the selection
        const allNodes = getAllNodes();
        const warpGatesToInclude = allNodes
            .filter(node =>
                node.type === NodeType.WarpGate &&
                node.warpGate?.sourceNodeId &&
                selectedNodes.includes(node.warpGate.sourceNodeId)
            )
            .map(node => node.id);

        // Combine selected nodes with their warp gates
        const nodesToGroup = [...selectedNodes, ...warpGatesToInclude];

        const parentGroupId = currentOpenGroup;
        if (parentGroupId) {
            nodesToGroup.forEach((nodeId) => {
                removeNodeFromGroupStore(parentGroupId, nodeId);
            });
        }

        const bounds = getNodeBoundsFromState(nodesToGroup);

        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const nodesCenterX = bounds.minX + (width / 2);
        const nodesCenterY = bounds.minY + (height / 2);

        const groupId = uuidv4();

        const connectionsToRemove: Connection[] = [];
        const connectionsToAssignToGroup: Connection[] = [];

        nodesToGroup.forEach((nodeId) => {
            const inCon = findInConnectionsByNodeId(nodeId, true, false);
            const outCon = findOutConnectionsByNodeId(nodeId, true, false);
            connectionsToAssignToGroup.push(...inCon, ...outCon);

            const filterOutside = (connection: Connection) => {
                const sourceInside =
                    nodesToGroup.includes(connection.sourceNodeId ?? '') ||
                    nodesToGroup.includes(connection.sourceGroupId ?? '') ||
                    connection.sourceGroupId === groupId;

                const targetInside =
                    nodesToGroup.includes(connection.targetNodeId ?? '') ||
                    nodesToGroup.includes(connection.targetGroupId ?? '') ||
                    connection.targetGroupId === groupId;

                // Keep only connections where BOTH endpoints are inside the new group
                const keep = sourceInside && targetInside;

                return !keep;
            };

            connectionsToRemove.push(
                ...inCon.filter(filterOutside),
                ...outCon.filter(filterOutside)
            );
        });

        const connectionsRemaining = Array.from(new Set(connectionsToAssignToGroup))
            .filter((con) => !connectionsToRemove.includes(con));

        removeConnections(connectionsToRemove);

        connectionsRemaining.forEach((connection) => {
            updateConnection({
                ...connection,
                isInGroup: groupId
            });
        });

        addGroupNode({
            id: groupId,
            group: {
                isOpen: true,
                isHidden: false,
                nodes: nodesToGroup
            },
            view: {
                x: nodesCenterX - 100,
                y: nodesCenterY - 100,
                width: 200,
                height: 200,
                collapsed: false
            }
        });

        if (parentGroupId) {
            addNodeToGroup(parentGroupId, groupId);
            const parentGroup = getGroupById(parentGroupId);
            if (parentGroup &&
                parentGroup.group &&
                parentGroup.group.nodes &&
                parentGroup.group.nodes.length <= 1
            ) {
                dissolveGroupStore(parentGroupId);
            }
        }

        if (currentOpenGroup && currentOpenGroup !== groupId) {
            hideGroup(currentOpenGroup);
        }

        setSelectedNodes([]);
        openGroupStore(groupId);
        showGroup(groupId);
        disableAllNodesViewExceptByIds([...nodesToGroup]);

        return groupId;
    }, []);

    return {
        createGroup
    };
};

export default useGroupCreation;