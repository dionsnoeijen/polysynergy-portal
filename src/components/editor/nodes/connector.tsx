import React from "react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import {InOut, NodeCollapsedConnector, NodeVariableType} from "@/types/types";
import { useConnectorHandlers } from "@/hooks/editor/nodes/useConnectorHandlers";
import clsx from "clsx";

type ConnectorProps = {
    nodeId: string;
    handle?: string;
    parentHandle?: string;
    className?: string;
    iconClassName?: string;
    disabled?: boolean;
    groupId?: string;
    nodeVariableType?: string;
} & (
    | { in: true; out?: never }
    | { out: true; in?: never }
    );

const Connector: React.FC<ConnectorProps> = ({
    nodeId,
    handle,
    parentHandle,
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

    const types = typeof nodeVariableType === "string"
      ? nodeVariableType.split(",").map((s) => s.trim())
      : [];

    if (types.includes(NodeVariableType.TruePath)) {
        backgroundClasses = "ring-white dark:ring-white bg-green-400 dark:bg-green-400";
        iconColorClasses = "text-zinc-800 dark:text-zinc-800";
    } else if (types.includes(NodeVariableType.FalsePath)) {
        backgroundClasses = "ring-white dark:ring-white bg-red-400 dark:bg-red-400";
        iconColorClasses = "text-zinc-800 dark:text-zinc-800";
    } else if (types.includes(NodeVariableType.Dependency)) {
        backgroundClasses = "ring-white dark:ring-white bg-fuchsia-400 dark:bg-fuchsia-400";
        iconColorClasses = "text-zinc-800 dark:text-zinc-800";
    } else {
        backgroundClasses = "ring-sky-500 dark:ring-white bg-white dark:bg-zinc-800";
        iconColorClasses = "text-sky-600 dark:text-white";
    }

    const positionClasses = isIn ?
        "left-0 -translate-x-1/2" : "right-0 translate-x-1/2";

    const isInteractive = handle !== NodeCollapsedConnector.Collapsed;

    return (
        <div
            onMouseDown={isInteractive ? handleMouseDown : undefined}
            data-type={isIn ? InOut.In : InOut.Out}
            data-node-id={nodeId}
            data-variable-type={nodeVariableType}
            data-group-id={groupId}
            data-handle={parentHandle ? parentHandle + '.' + handle : handle}
            data-enabled={!disabled}
            className={clsx(
                "w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1 cursor-pointer",
                positionClasses,
                backgroundClasses,
                className,
            )}
        >
            {isInteractive && (
                <ChevronRightIcon
                    className={clsx(
                        "w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2",
                        iconColorClasses,
                        iconClassName
                    )}
                />
            )}
        </div>
    );
};

export default Connector;
