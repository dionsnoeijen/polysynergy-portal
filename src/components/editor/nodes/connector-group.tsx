import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
    groupId: string;
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const ConnectorGroup: React.FC<ConnectorGroupProps> = ({
    groupId,
    in: isIn,
    out: isOut,
}) => {
    const {
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        findInConnectionsByNodeIdAndHandle,
        findOutConnectionsByNodeIdAndHandle,
        updateConnection,
    } = useConnectionsStore();
    const {
        editorPosition,
        panPosition,
        zoomFactor,
        setOnInConnectionAddedCallback,
        setOnOutConnectionAddedCallback,
        setOnInConnectionRemovedCallback,
        setOnOutConnectionRemovedCallback,
    } = useEditorStore();
    const nodesInGroup = useGroupsStore((state) =>
        state.getNodesInGroup(groupId)
    );

    const allNodes = useNodesStore((state) => {
        return state.nodes;
    });

    const nodes = useMemo(() => {
        return allNodes.filter((node) => nodesInGroup.includes(node.id));
    }, [allNodes, nodesInGroup]);

    const [connectionSlots, setConnectionSlots] = useState<
        Array<{ id: string }>
    >([]);
    const connectionSlotsRef = useRef(connectionSlots);

    useEffect(() => {
        connectionSlotsRef.current = connectionSlots;
    }, [connectionSlots]);

    useEffect(() => {
        const connections = isIn
            ? findOutConnectionsByNodeId(groupId)
            : findInConnectionsByNodeId(groupId);
        setConnectionSlots([...connections, { id: "new" }]);
    }, [
        findInConnectionsByNodeId,
        findOutConnectionsByNodeId,
        groupId,
        isIn,
    ]);

    const handleAddConnection = useCallback(() => {
        setConnectionSlots((prevSlots) => {
            return [...prevSlots, { id: `connection-${uuidv4()}` }];
        });
    }, []);

    const handleRemoveConnection = useCallback(() => {
        setConnectionSlots((prevSlots) => {
            const slotsWithoutNew = prevSlots.filter((slot) => slot.id !== "new");
            if (slotsWithoutNew.length > 0) {
                slotsWithoutNew.pop();
            }
            return [...slotsWithoutNew, { id: "new" }];
        });
    }, []);

    useEffect(() => {
        if (isIn) {
            setOnInConnectionAddedCallback(handleAddConnection);
            setOnInConnectionRemovedCallback(handleRemoveConnection);
        } else if (isOut) {
            setOnOutConnectionAddedCallback(handleAddConnection);
            setOnOutConnectionRemovedCallback(handleRemoveConnection);
        }
    }, [
        handleAddConnection,
        handleRemoveConnection,
        isIn,
        isOut,
        setOnInConnectionAddedCallback,
        setOnOutConnectionAddedCallback,
        setOnInConnectionRemovedCallback,
        setOnOutConnectionRemovedCallback,
    ]);

    useEffect(() => {
        if (connectionSlotsRef.current.length > 0) {
            connectionSlotsRef.current.forEach((connection) => {
                if (connection.id !== "new") {
                    const actualIndex = connectionSlotsRef.current
                        .filter((slot) => slot.id !== "new")
                        .indexOf(connection);

                    const connections = isIn
                        ? findOutConnectionsByNodeIdAndHandle(
                            groupId,
                            `${actualIndex}`
                        )
                        : findInConnectionsByNodeIdAndHandle(
                            groupId,
                            `${actualIndex}`
                        );

                    connections.forEach((conn) => {
                        const position = calculateConnectorPositionByAttributes(
                            groupId,
                            `${actualIndex}`,
                            isIn ? InOut.In : InOut.Out,
                            editorPosition,
                            panPosition,
                            zoomFactor
                        );

                        if (
                            isIn &&
                            (conn.startX !== position.x ||
                                conn.startY !== position.y)
                        ) {
                            updateConnection({
                                ...conn,
                                startX: position.x,
                                startY: position.y,
                            });
                        } else if (
                            isOut &&
                            (conn.endX !== position.x ||
                                conn.endY !== position.y)
                        ) {
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
    },
        // eslint-disable-next-line
        [
            nodes,
            connectionSlots,
        ]);

    return (
        <div
            className={`absolute top-1/2 transform -translate-y-1/2 ${
                isIn ? "left-[-30px]" : "right-[-30px]"
            }`}
        >
            {connectionSlots.map((connection, index) => (
                <div
                    key={connection.id}
                    className="relative w-[30px] h-[25px] mb-2"
                >
                    {isIn && (
                        <Connector
                            nodeId={groupId}
                            handle={`${index}`}
                            in
                            isGroup
                        />
                    )}
                    {isOut && (
                        <Connector
                            nodeId={groupId}
                            handle={`${index}`}
                            out
                            isGroup
                        />
                    )}
                    <EllipsisHorizontalIcon
                        className={`w-4 h-4 absolute ${
                            isIn ? "left-0" : "right-0"
                        } top-1/2 transform -translate-y-1/2 cursor-pointer`}
                    />
                </div>
            ))}
        </div>
    );
};

export default ConnectorGroup;
