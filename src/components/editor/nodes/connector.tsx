import React, { useState, useMemo, useCallback } from "react";
import {ChevronRightIcon} from "@heroicons/react/16/solid";
import {InOut, NodeCollapsedConnector, NodeVariableType} from "@/types/types";
import {useConnectorHandlers} from "@/hooks/editor/nodes/useConnectorHandlers";
import {useConnectorContextMenu} from "@/hooks/editor/nodes/useConnectorContextMenu";
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

// Format variable types for tooltip display (moved outside component to avoid recreating)
const formatVariableTypes = (types: string[]) => {
    return types.map(type => {
        // Convert enum values to readable names
        switch (type) {
            case NodeVariableType.TruePath:
                return "True Path";
            case NodeVariableType.FalsePath:
                return "False Path";
            case NodeVariableType.Dependency:
                return "Dependency";
            case NodeVariableType.Any:
                return "Any";
            default:
                return type;
        }
    }).join(", ");
};

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
    const {handleMouseDown} = useConnectorHandlers(isIn, isOut, nodeId, false, disabled);
    const {handleConnectorContextMenu} = useConnectorContextMenu(
        nodeId,
        handle || '',
        nodeVariableType,
        isOut || false
    );
    const [showTooltip, setShowTooltip] = useState(false);

    // PERFORMANCE: Memoize expensive computations
    const types = useMemo(() =>
        typeof nodeVariableType === "string"
            ? nodeVariableType.split(",").map((s) => s.trim())
            : [],
        [nodeVariableType]
    );

    const { backgroundClasses, iconColorClasses } = useMemo(() => {
        if (types.includes(NodeVariableType.TruePath)) {
            return {
                backgroundClasses: "ring-sky-500 dark:ring-white bg-green-400 dark:bg-green-400",
                iconColorClasses: "text-zinc-800 dark:text-zinc-800"
            };
        } else if (types.includes(NodeVariableType.FalsePath)) {
            return {
                backgroundClasses: "ring-sky-500 dark:ring-white bg-red-400 dark:bg-red-400",
                iconColorClasses: "text-zinc-800 dark:text-zinc-800"
            };
        } else if (types.includes(NodeVariableType.Dependency)) {
            return {
                backgroundClasses: "ring-sky-500 dark:ring-white bg-fuchsia-400 dark:bg-fuchsia-400",
                iconColorClasses: "text-zinc-800 dark:text-zinc-800"
            };
        } else {
            return {
                backgroundClasses: "ring-sky-500 dark:ring-white bg-white dark:bg-zinc-800",
                iconColorClasses: "text-sky-600 dark:text-white"
            };
        }
    }, [types]);

    const positionClasses = useMemo(() =>
        isIn ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
        [isIn]
    );

    const isInteractive = handle !== NodeCollapsedConnector.Collapsed;

    // PERFORMANCE: Stable callbacks
    const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
    const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

    const dataHandle = useMemo(() =>
        parentHandle ? `${parentHandle}.${handle}` : handle,
        [parentHandle, handle]
    );

    return (
        <div
            className={clsx(
                "w-4 h-4 absolute top-1/2 -translate-y-1/2 rounded-full", // Keep original positioning
                positionClasses, // left-0 / right-0 + x-vertaling
                className
            )}
        >
            <div
                onMouseDown={isInteractive ? handleMouseDown : undefined}
                onContextMenu={isInteractive && isOut ? handleConnectorContextMenu : undefined}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                data-type={isIn ? InOut.In : InOut.Out}
                data-node-id={nodeId}
                data-variable-type={nodeVariableType}
                data-group-id={groupId}
                data-handle={dataHandle}
                data-enabled={!disabled}
                className={clsx(
                    "w-full h-full rounded-full ring-1 origin-center relative",
                    backgroundClasses,
                    "connector-animatable" // om te targeten
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
                
                {/* Simple tooltip positioned relative to the inner connector div */}
                {showTooltip && types.length > 0 && (
                    <div
                        className={clsx(
                            "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none",
                            "top-1/2 -translate-y-1/2",
                            isIn 
                                ? "left-full ml-2" // Position to the right of input connectors
                                : "right-full mr-2" // Position to the left of output connectors
                        )}
                    >
                        <div className="font-medium">{isIn ? "Accepts:" : "Output:"}</div>
                        <div>{formatVariableTypes(types)}</div>
                        
                        {/* Arrow pointing to connector */}
                        <div
                            className={clsx(
                                "absolute top-1/2 -translate-y-1/2 w-0 h-0",
                                isIn 
                                    ? "left-0 -translate-x-full border-t-2 border-b-2 border-r-4 border-transparent border-r-gray-900"
                                    : "right-0 translate-x-full border-t-2 border-b-2 border-l-4 border-transparent border-l-gray-900"
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export default React.memo(Connector, (prevProps, nextProps) => {
    return (
        prevProps.nodeId === nextProps.nodeId &&
        prevProps.handle === nextProps.handle &&
        prevProps.parentHandle === nextProps.parentHandle &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.nodeVariableType === nextProps.nodeVariableType &&
        prevProps.className === nextProps.className &&
        prevProps.iconClassName === nextProps.iconClassName &&
        prevProps.groupId === nextProps.groupId &&
        prevProps.in === nextProps.in &&
        prevProps.out === nextProps.out
    );
});
