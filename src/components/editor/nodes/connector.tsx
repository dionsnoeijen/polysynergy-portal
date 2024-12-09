import React from "react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { InOut, NodeVariableType } from "@/types/types";
import { useConnectorHandlers } from "@/hooks/editor/nodes/useConnectorHandlers";
import clsx from "clsx";

type ConnectorProps = {
    nodeId: string;
    handle?: string;
    className?: string;
    iconClassName?: string;
    disabled?: boolean;
    groupId?: string;
    nodeVariableType?: NodeVariableType
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const Connector: React.FC<ConnectorProps> = ({
    nodeId,
    handle,
    in: isIn,
    out: isOut,
    className,
    iconClassName,
    disabled = false,
    groupId,
    nodeVariableType
}): React.ReactElement => {
    const { handleMouseDown } = useConnectorHandlers(isIn, isOut, nodeId, false, disabled);

    let backgroundClasses;
    let iconColorClasses;

    if (nodeVariableType === NodeVariableType.TruePath) {
        backgroundClasses = "ring-white dark:ring-white bg-green-400 dark:bg-green-400";
        iconColorClasses = "text-white dark:text-white";
    } else if (nodeVariableType === NodeVariableType.FalsePath) {
        backgroundClasses = "ring-white dark:ring-white bg-red-400 dark:bg-red-400";
        iconColorClasses = "text-white dark:text-white";
    } else {
        backgroundClasses = "ring-sky-500 dark:ring-white bg-white dark:bg-slate-800";
        iconColorClasses = "text-sky-600 dark:text-slate-400";
    }

    const positionClasses = isIn ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2";

    return (
        <div
            onMouseDown={handleMouseDown}
            data-type={isIn ? InOut.In : InOut.Out}
            data-node-id={nodeId}
            data-group-id={groupId}
            data-handle={handle}
            data-enabled={!disabled}
            className={clsx(
                "w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1 cursor-pointer",
                positionClasses,
                backgroundClasses,
                className
            )}
        >
            <ChevronRightIcon
                className={clsx(
                    "w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2",
                    iconColorClasses,
                    iconClassName
                )}
            />
        </div>
    );
};

export default Connector;
