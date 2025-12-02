import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { InOut } from "@/types/types";
import useConnectionsStore from "@/stores/connectionsStore";
import { useConnectorHandlers } from "@/hooks/editor/nodes/useConnectorHandlers";
import { updateConnectionsDirectly } from "@/utils/updateConnectionsDirectly";
import useNodesStore from "@/stores/nodesStore";
import {useEffect, useMemo} from "react";
import { useBranding } from "@/contexts/branding-context";

type ConnectorGroupProps = {
    groupId: string;
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const ConnectorGroup: React.FC<ConnectorGroupProps> = ({
    groupId,
    in: isIn = false,
    out: isOut = false,
}) => {
    const { accent_color } = useBranding();

    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const findOutConnectionsByNodeId = useConnectionsStore((state) => state.findOutConnectionsByNodeId);
    const group = useNodesStore((state) => state.getGroupById(groupId));

    const { handleMouseDown } = useConnectorHandlers(isIn, isOut, groupId, true);

    const connections = isOut ?
            findInConnectionsByNodeId(groupId) :
            findOutConnectionsByNodeId(groupId);

    const connectorSlots = useMemo(() => {
        return [
            ...connections.map((_, index) => ({ id: index.toString() })),
            { id: connections.length.toString() },
        ];
    }, [connections]);

    useEffect(() => {
        updateConnectionsDirectly(connections);
    // eslint-disable-next-line
    }, [connections]);

    useEffect(() => {
        setTimeout(() => {
            updateConnectionsDirectly(connections);
        }, 0);
    // eslint-disable-next-line
    }, [connectorSlots]);

    return (
        <div
            className={`absolute top-1/2 transform -translate-y-1/2 ${
                isIn ? "left-[-30px]" : "right-[-30px]"
            }`}
        >
            {connectorSlots.map((slot) => (
                <div
                    key={slot.id}
                    className="relative w-[30px] h-[25px] mb-2"
                >
                    {(isIn || isOut) && (
                        <div
                            className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 rounded-full ${
                                isOut ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
                            }`}
                        >
                            <div
                                onMouseDown={handleMouseDown}
                                data-type={isIn ? InOut.Out : InOut.In}
                                data-group-id={groupId}
                                data-handle={slot.id}
                                data-enabled={!group?.service?.id}
                                className="w-full h-full rounded-full ring-1 dark:ring-white bg-white dark:bg-zinc-800 cursor-pointer connector-animatable origin-center relative"
                                style={{ borderColor: accent_color }}
                            >
                                <ChevronRightIcon
                                    className="w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 dark:text-white pointer-events-none"
                                    style={{ color: accent_color }}
                                />
                            </div>
                        </div>
                    )}
                    <EllipsisHorizontalIcon
                        className={`w-4 h-4 absolute ${
                            isIn ? "left-0" : "right-0"
                        } top-1/2 transform -translate-y-1/2 cursor-pointer pointer-events-none`}
                    />
                </div>
            ))}
        </div>
    );
};

export default ConnectorGroup;
