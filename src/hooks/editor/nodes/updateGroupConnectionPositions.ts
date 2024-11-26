import { useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useConnectionsStore, Connection } from "@/stores/connectionsStore";
import { calculateConnectorPositionByAttributes } from "@/utils/positionUtils";
import { InOut } from "@/types/types";

type UpdateGroupConnectionPositionsHookProps = {
    groupId: string;
    isIn: boolean;
};

export const useUpdateGroupConnectionPositions = ({
                                                      groupId,
                                                      isIn,
                                                  }: UpdateGroupConnectionPositionsHookProps) => {
    const { editorPosition, panPosition, zoomFactor } = useEditorStore();
    const {
        findOutConnectionsByNodeIdAndHandle,
        findInConnectionsByNodeIdAndHandle,
        updateConnection,
        connections,
    } = useConnectionsStore();

    const updateGroupConnectionPositions = useCallback(() => {
        const slots = connections.map((_, index) => index.toString());

        slots.forEach((slotId) => {
            const relevantConnections = isIn
                ? findOutConnectionsByNodeIdAndHandle(groupId, slotId)
                : findInConnectionsByNodeIdAndHandle(groupId, slotId);

            relevantConnections.forEach((conn: Connection) => {

                if (conn.hidden) return;

                const position = calculateConnectorPositionByAttributes(
                    groupId,
                    slotId,
                    isIn ? InOut.In : InOut.Out,
                    editorPosition,
                    panPosition,
                    zoomFactor
                );

                if (
                    isIn &&
                    (conn.startX !== position.x || conn.startY !== position.y)
                ) {
                    updateConnection({
                        ...conn,
                        startX: position.x,
                        startY: position.y,
                    });
                } else if (
                    !isIn &&
                    (conn.endX !== position.x || conn.endY !== position.y)
                ) {
                    updateConnection({
                        ...conn,
                        endX: position.x,
                        endY: position.y,
                    });
                }
            });
        });
    }, [
        connections,
        editorPosition,
        panPosition,
        zoomFactor,
        findOutConnectionsByNodeIdAndHandle,
        findInConnectionsByNodeIdAndHandle,
        updateConnection,
        groupId,
        isIn,
    ]);

    return { updateGroupConnectionPositions };
};
