import React, { useEffect, useRef, useState } from "react";
import useResizable from "@/hooks/editor/nodes/useResizable";
import Connector from "@/components/editor/nodes/connector";
import useNodesStore from "@/stores/nodesStore";
import { Node as NodeType, NodeVariableType } from "@/types/types";
import { Switch } from "@/components/switch";
import { useEditorStore } from "@/stores/editorStore";
import useToggleConnectionCollapse from "@/hooks/editor/nodes/useToggleConnectionCollapse";
import { useTheme } from 'next-themes';
import ArrayVariable from "@/components/editor/nodes/rows/array-variable";
import StringVariable from "@/components/editor/nodes/rows/string-variable";
import NumberVariable from "@/components/editor/nodes/rows/number-variable";
import BooleanVariable from "@/components/editor/nodes/rows/boolean-variable";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useGroupsStore from "@/stores/groupStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";

type NodeProps = {
    node: NodeType;
    setIsDeleteNodesDialogOpen?: (isOpen: boolean) => void;
};

const NodeRows: React.FC<NodeProps> = ({ node, setIsDeleteNodesDialogOpen }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { size, handleResizeMouseDown } = useResizable(node);
    const [ isOpenMap, setIsOpenMap ] = useState<{ [key: string]: boolean }>({});
    const { selectedNodes, openContextMenu } = useEditorStore();
    const { collapseConnections, openConnections } = useToggleConnectionCollapse(node);
    const shouldUpdateConnections = useRef(false);
    const { updateNodeHeight } = useNodesStore();
    const { theme } = useTheme();
    const { handleNodeMouseDown } = useNodeMouseDown(node);
    const { isNodeInGroup } = useGroupsStore();
    const { removeNodeFromGroup } = useGrouping();

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

    useEffect(() => {
        if (ref.current) {
            const actualHeight = ref.current.getBoundingClientRect().height;
            if (actualHeight !== node.view.height) {
                updateNodeHeight(node.id, actualHeight);
            }
        }
    }, [node.view.height, isOpenMap, updateNodeHeight, node.id]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (selectedNodes.length > 1) return;

        const contextMenuItems = [];

        const groupId = isNodeInGroup(node.id);
        if (groupId) {
            contextMenuItems.push({
                label: "Remove from group",
                action: () => removeNodeFromGroup(groupId, node.id)
            });
        }

        contextMenuItems.push({
            label: "Delete",
            action: () => setIsDeleteNodesDialogOpen?.(true)
        });

        openContextMenu(e.clientX, e.clientY, contextMenuItems);
    };

    return (
        <div
            ref={ref}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            className={`absolute overflow-visible select-none flex flex-col items-start justify-start ring-2 ${
                selectedNodes.includes(node.id) ? "ring-sky-500/50 dark:ring-white shadow-2xl" : "ring-sky-500/50 dark:ring-white/50 shadow-sm]"
            } bg-sky-100 dark:bg-slate-800/60 backdrop-blur-lg backdrop-opacity-60 rounded-md pb-5 ${node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'}`}
            style={{
                width: `${size.width}px`,
                left: `${node.view.x}px`,
                top: `${node.view.y}px`,
            }}
            data-type="node"
            data-node-id={node.id}
        >
            <div className={`flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5 ${node.view.disabled && 'select-none opacity-0'}`}>
                <Connector in nodeId={node.id} handle={"node"}/>
                <Switch color={theme === 'light' ? 'sky' : 'dark'}/>
                <h3 className="font-bold truncate ml-2 text-sky-600 dark:text-white">{node.name}</h3>
            </div>
            <div className="flex flex-col w-full items-start overflow-visible">
                <div className="w-full">
                    {node.variables.map((variable) => {
                        switch (variable.type) {
                            case NodeVariableType.Array:
                                return (
                                    <ArrayVariable
                                        key={variable.handle}
                                        variable={variable}
                                        isOpen={isOpenMap[variable.handle] || false}
                                        onToggle={handleToggle(variable.handle)}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.String:
                                return (
                                    <StringVariable
                                        key={variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.Number:
                                return (
                                    <NumberVariable
                                        key={variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.Boolean:
                                return (
                                    <BooleanVariable
                                        key={variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
            <div
                onMouseDown={handleResizeMouseDown}
                className="absolute w-[20px] h-[20px] border-r rounded-tr-none rounded-bl-none border-b border-white/50 right-[-5px] bottom-[-5px] cursor-se-resize rounded-[10px]"
            />
        </div>
    );
};

export default NodeRows;
