import { useCallback } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { Connection } from "@/types/types";
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

        if (selectedNodes.length < 2) return null;

        const parentGroupId = currentOpenGroup;
        if (parentGroupId) {
            selectedNodes.forEach((nodeId) => {
                removeNodeFromGroupStore(parentGroupId, nodeId);
            });
        }

        const bounds = getNodeBoundsFromState(selectedNodes);

        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const nodesCenterX = bounds.minX + (width / 2);
        const nodesCenterY = bounds.minY + (height / 2);

        const groupId = uuidv4();

        const connectionsToRemove: Connection[] = [];
        const connectionsToAssignToGroup: Connection[] = [];

        selectedNodes.forEach((nodeId) => {
            const inCon = findInConnectionsByNodeId(nodeId, true, false);
            const outCon = findOutConnectionsByNodeId(nodeId, true, false);
            connectionsToAssignToGroup.push(...inCon, ...outCon);

            const filterOutside = (connection: Connection) => {
                const sourceInside =
                    selectedNodes.includes(connection.sourceNodeId ?? '') ||
                    selectedNodes.includes(connection.sourceGroupId ?? '') ||
                    connection.sourceGroupId === groupId;

                const targetInside =
                    selectedNodes.includes(connection.targetNodeId ?? '') ||
                    selectedNodes.includes(connection.targetGroupId ?? '') ||
                    connection.targetGroupId === groupId;

                const isGroupToNodeOrGroup =
                    (connection.sourceGroupId && selectedNodes.includes(connection.targetNodeId ?? '')) ||
                    (connection.targetGroupId && selectedNodes.includes(connection.sourceNodeId));

                const isGroupToNewGroup =
                    connection.sourceGroupId &&
                    selectedNodes.includes(connection.targetNodeId ?? '');

                const keep = (sourceInside && targetInside) || isGroupToNodeOrGroup;

                return !keep || isGroupToNewGroup;
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
                nodes: selectedNodes
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
        disableAllNodesViewExceptByIds([...selectedNodes]);

        return groupId;
    }, []);

    return {
        createGroup
    };
};

export default useGroupCreation;