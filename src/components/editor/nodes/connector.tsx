import React from "react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { InOut } from "@/types/types";
import { useConnectorHandlers } from "@/hooks/editor/nodes/useConnectorHandlers";
import clsx from "clsx";

type ConnectorProps = {
    nodeId: string;
    handle?: string;
    className?: string;
    iconClassName?: string;
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
}): React.ReactElement => {
    const { handleMouseDown } = useConnectorHandlers(isIn, isOut, nodeId, false);

    return (
        <div
            onMouseDown={handleMouseDown}
            data-type={isIn ? InOut.In : InOut.Out}
            data-node-id={nodeId}
            data-handle={handle}
            className={clsx(
                "w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1 ring-sky-500 dark:ring-white bg-white dark:bg-slate-800 cursor-pointer",
                isIn ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
                className
            )}
        >
            <ChevronRightIcon
                className={clsx(
                    "w-5 h-5 absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2",
                    "text-sky-600 dark:text-slate-400",
                    iconClassName
                )}
            />
        </div>
    );
};

export default Connector;
