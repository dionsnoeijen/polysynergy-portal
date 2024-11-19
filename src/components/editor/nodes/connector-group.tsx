import React, { useState, useEffect, useCallback, useRef } from "react";
import Connector from "@/components/editor/nodes/connector";
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useConnectionsStore } from "@/stores/connectionsStore";
import { v4 as uuidv4 } from "uuid";
import { calculateConnectorPositionByAttributes } from "@/utils/positionUtils";
import { InOut } from "@/types/types";
import { useEditorStore } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useGroupsStore from "@/stores/groupStore";

type ConnectorGroupProps = {
    groupId: string
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const ConnectorGroup: React.FC<ConnectorGroupProps> = ({ groupId, in: isIn, out: isOut }) => {
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        findInConnectionsByNodeIdAndHandle,
        findOutConnectionsByNodeIdAndHandle,
        updateConnection,
    } = useConnectionsStore();
    const { editorPosition, panPosition, zoomFactor, setOnInConnectionAddedCallback, setOnOutConnectionAddedCallback } = useEditorStore();
    const { getNodesByIds } = useNodesStore();
    const { getNodesInGroup } = useGroupsStore();

    const nodesInGroup = getNodesInGroup(groupId);
    const nodes = getNodesByIds(nodesInGroup);

    const [connectionSlots, setConnectionSlots] = useState<Array<{ id: string }>>([]);
    const connectionSlotsRef = useRef(connectionSlots); // Gebruik een ref voor connectionSlots

    // Update ref whenever connectionSlots changes
    useEffect(() => {
        connectionSlotsRef.current = connectionSlots;
    }, [connectionSlots]);

    // Update connection slots on mount and whenever dependencies change
    useEffect(() => {
        const connections = isIn
            ? findOutConnectionsByNodeId(groupId)
            : findInConnectionsByNodeId(groupId);
        setConnectionSlots([...connections, { id: "new" }]);
    }, [findInConnectionsByNodeId, findOutConnectionsByNodeId, groupId, isIn]);

    // Callback for adding a connection
    const handleAddConnection = useCallback(() => {
        console.log('handleAddConnection aangeroepen');
        setConnectionSlots((prevSlots) => {
            return [...prevSlots, { id: `connection-${uuidv4()}` }];
        });
    }, []);

    useEffect(() => {
        if (isIn) {
            setOnInConnectionAddedCallback(handleAddConnection);
        } else if (isOut) {
            setOnOutConnectionAddedCallback(handleAddConnection);
        }
    }, [handleAddConnection, isIn, isOut, setOnInConnectionAddedCallback, setOnOutConnectionAddedCallback]);

    // Update connections after adding a new connection slot
    useEffect(() => {
        if (connectionSlotsRef.current.length > 0) {
            connectionSlotsRef.current.forEach((connection) => {
                if (connection.id !== "new") {
                    const actualIndex = connectionSlotsRef.current.filter(slot => slot.id !== "new").indexOf(connection);

                    // Zoek de huidige verbinding in de state
                    const connections = isIn
                        ? findOutConnectionsByNodeIdAndHandle(groupId, `${actualIndex}`)
                        : findInConnectionsByNodeIdAndHandle(groupId, `${actualIndex}`);

                    console.log(isIn ? 'IN' : 'OUT', connections);

                    connections.forEach((conn) => {
                        // Bereken de nieuwe positie van de connector
                        const position = calculateConnectorPositionByAttributes(
                            groupId,
                            `${actualIndex}`,
                            isIn ? InOut.In : InOut.Out,
                            editorPosition,
                            panPosition,
                            zoomFactor
                        );

                        // Werk de verbinding bij in de state, afhankelijk van het type (in of out)
                        if (isIn && (conn.startX !== position.x || conn.startY !== position.y)) {
                            updateConnection({
                                ...conn,
                                startX: position.x,
                                startY: position.y,
                            });
                        } else if (isOut && (conn.endX !== position.x || conn.endY !== position.y)) {
                            updateConnection({
                                ...conn,
                                endX: position.x,
                                endY: position.y,
                            });
                        }
                    });
                }
            });
        }
    }, [editorPosition, findInConnectionsByNodeIdAndHandle, findOutConnectionsByNodeIdAndHandle, groupId, isIn, isOut, nodes, panPosition, updateConnection, zoomFactor]);

    return (
        <div className={`absolute top-1/2 transform -translate-y-1/2 ${isIn ? 'left-[-30px]' : 'right-[-30px]'}`}>
            {connectionSlots.map((connection, index) => (
                <div key={connection.id} className="relative w-[30px] h-[25px] mb-2">
                    {connection.id !== "new" && (
                        <>
                            {isIn && (
                                <Connector
                                    nodeUuid={groupId}
                                    handle={`${index}`}
                                    in
                                    isGroup
                                />
                            )}
                            {isOut && (
                                <Connector
                                    nodeUuid={groupId}
                                    handle={`${index}`}
                                    out
                                    isGroup
                                />
                            )}
                            <EllipsisHorizontalIcon
                                className={`w-4 h-4 absolute ${isIn ? 'left-0' : 'right-0'} top-1/2 transform -translate-y-1/2 cursor-pointer`}
                            />
                        </>
                    )}

                    {connection.id === "new" && (
                        <>
                            {isIn && (
                                <Connector
                                    nodeUuid={groupId}
                                    handle={`${index}`}
                                    in
                                    isGroup
                                />
                            )}
                            {isOut && (
                                <Connector
                                    nodeUuid={groupId}
                                    handle={`${index}`}
                                    out
                                    isGroup
                                />
                            )}
                            <EllipsisHorizontalIcon
                                className={`w-4 h-4 absolute ${isIn ? 'left-0' : 'right-0'} top-1/2 transform -translate-y-1/2 cursor-pointer`}
                            />
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ConnectorGroup;
