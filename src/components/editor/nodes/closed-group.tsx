import React, { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { Node, NodeVariableType } from "@/types/types";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import useVariablesForGroup from "@/hooks/editor/nodes/useVariablesForGroup";
import ArrayVariable from "@/components/editor/nodes/rows/array-variable";
import StringVariable from "@/components/editor/nodes/rows/string-variable";
import NumberVariable from "@/components/editor/nodes/rows/number-variable";
import BooleanVariable from "@/components/editor/nodes/rows/boolean-variable";
import useNodesStore from "@/stores/nodesStore";
import useToggleConnectionCollapse from "@/hooks/editor/nodes/useToggleConnectionCollapse";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";

type GroupProps = { node: Node };

const ClosedGroup: React.FC<GroupProps> = ({ node }): React.ReactElement => {
    const ref = useRef<HTMLDivElement>(null);
    const { selectedNodes, openContextMenu } = useEditorStore();
    const { openGroup } = useGrouping();
    const { collapseConnections, openConnections } = useToggleConnectionCollapse(node);
    const [ isOpenMap, setIsOpenMap ] = useState<{ [key: string]: boolean }>({});
    const { variablesForGroup } = useVariablesForGroup(node.id, false);
    const shouldUpdateConnections = useRef(false);
    const { updateNodeHeight } = useNodesStore();
    const { handleNodeMouseDown } = useNodeMouseDown(node);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                {
                    label: "Open Group",
                    action: () => {
                        openGroup(node.id);
                    },
                },
                {
                    label: "Delete Group",
                    action: () => console.log("Delete Group"),
                },
            ]
        );
    };

    const handleToggle = (handle: string): (() => void) => {
        return () => {
            shouldUpdateConnections.current = true;
            setIsOpenMap((prev) => ({
                ...prev,
                [handle]: !prev[handle],
            }));
        };
    };

    useEffect(() => {
        if (ref.current) {
            const actualHeight = ref.current.getBoundingClientRect().height;
            if (actualHeight !== node.view.height) {
                updateNodeHeight(node.id, actualHeight);
            }
        }
    }, [node.view.height, isOpenMap, updateNodeHeight, node.id]);

    useEffect(() => {
        if (shouldUpdateConnections.current) {
            Object.entries(isOpenMap).forEach(([handle, isOpen]) => {
                if (isOpen) {
                    openConnections(handle);
                } else {
                    collapseConnections(handle);
                }
            });
            shouldUpdateConnections.current = false;
        }
    }, [isOpenMap, openConnections, collapseConnections]);

    return (
        <div
            className={`absolute overflow-visible select-none flex flex-col items-start justify-start ring-2 ${
                selectedNodes.includes(node.id) ? "ring-sky-500/50 dark:ring-white shadow-2xl" : "ring-sky-500/50 dark:ring-white/50 shadow-sm]"
            } bg-sky-100 dark:bg-slate-800/60 backdrop-blur-lg backdrop-opacity-60 rounded-md cursor-move pb-5 ${node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'}`}
            data-type="closed-group"
            data-node-id={node.id}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            style={{
                left: node.view.x,
                top: node.view.y,
            }}
        >
            <div className="flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5">
                <h3 className="font-bold truncate text-sky-600 dark:text-white">{node.name}</h3>
            </div>

            <div className="flex w-full gap-4 pt-2">
                <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-sky-600 pl-2 dark:text-white mb-2">Inputs</h4>
                    {variablesForGroup?.inVariables && variablesForGroup?.inVariables?.length > 0 ? (
                        variablesForGroup.inVariables.map(({variable, nodeId}) => {
                            if (typeof variable === 'undefined') return null;
                            switch (variable.type) {
                                case NodeVariableType.Array:
                                    return (
                                        <ArrayVariable
                                            key={'in-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            isOpen={isOpenMap[variable.handle] || false}
                                            onToggle={handleToggle(variable.handle)}
                                            nodeId={nodeId as string}
                                            onlyIn={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                case NodeVariableType.String:
                                    return (
                                        <StringVariable
                                            key={'in-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            nodeId={nodeId as string}
                                            onlyIn={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                case NodeVariableType.Number:
                                    return (
                                        <NumberVariable
                                            key={'in-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            nodeId={nodeId as string}
                                            onlyIn={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                case NodeVariableType.Boolean:
                                    return (
                                        <BooleanVariable
                                            key={'in-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            nodeId={nodeId as string}
                                            onlyIn={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                default:
                                    return null;
                            }
                        })
                    ) : (
                        <p className="text-sky-400 dark:text-slate-400">No inputs</p>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-sky-600 pr-2 dark:text-white mb-2">Outputs</h4>
                    {variablesForGroup?.outVariables && variablesForGroup?.outVariables?.length > 0 ? (
                        variablesForGroup.outVariables.map(({variable, nodeId}) => {
                            if (typeof variable === 'undefined') return null;
                            switch (variable.type) {
                                case NodeVariableType.Array:
                                    return (
                                        <ArrayVariable
                                            key={'out-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            isOpen={isOpenMap[variable.handle] || false}
                                            onToggle={handleToggle(variable.handle)}
                                            nodeId={nodeId as string}
                                            onlyOut={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                case NodeVariableType.String:
                                    return (
                                        <StringVariable
                                            key={'out-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            nodeId={nodeId as string}
                                            onlyOut={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                case NodeVariableType.Number:
                                    return (
                                        <NumberVariable
                                            key={'out-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            nodeId={nodeId as string}
                                            onlyOut={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                case NodeVariableType.Boolean:
                                    return (
                                        <BooleanVariable
                                            key={'out-' + variable.handle + '-' + nodeId}
                                            variable={variable}
                                            nodeId={nodeId as string}
                                            onlyOut={true}
                                            disabled={node.view.disabled}
                                            groupId={node.id}
                                        />
                                    );
                                default:
                                    return null;
                            }
                        })
                    ) : (
                        <p className="text-sky-400 dark:text-slate-400">No outputs</p>
                    )}
                </div>
            </div>
        </div>
    )
};

export default ClosedGroup;
