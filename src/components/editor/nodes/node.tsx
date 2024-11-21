import React, {useState, useEffect, useRef} from "react";
import useDraggable from "@/hooks/editor/nodes/useDraggable";
import useResizable from "@/hooks/editor/nodes/useResizable";
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    DocumentTextIcon,
    HashtagIcon,
    Squares2X2Icon
} from "@heroicons/react/16/solid";
import Connector from "@/components/editor/nodes/connector";
import useNodesStore, { Node as NodeType, NodeVariable, NodeVariableType } from "@/stores/nodesStore";
import { Switch } from "@/components/switch";
import { useEditorStore } from "@/stores/editorStore";
import useToggleConnectionCollapse from "@/hooks/editor/nodes/useToggleConnectionCollapse";
import { useTheme } from 'next-themes';

type NodeProps = {
    node: NodeType;
};

const Node: React.FC<NodeProps> = ({ node }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { onDragMouseDown } = useDraggable();
    const { size, handleResizeMouseDown } = useResizable(node);
    const [isOpenMap, setIsOpenMap] = useState<{ [key: string]: boolean }>({});
    const { selectedNodes, setSelectedNodes, openContextMenu } = useEditorStore();
    const { collapseConnections, openConnections } = useToggleConnectionCollapse(node);
    const shouldUpdateConnections = useRef(false);
    const { updateNodeHeight } = useNodesStore();
    const { theme } = useTheme();

    const handleNodeMouseDown = (e: React.MouseEvent) => {
        const isToggleClick = (e.target as HTMLElement).closest("button[data-toggle='true']");
        if (isToggleClick) return;
        e.preventDefault();
        if (!selectedNodes.includes(node.uuid)) {
            setSelectedNodes([node.uuid]);
            setTimeout(() => {
                onDragMouseDown();
            }, 0);
        } else {
            onDragMouseDown();
        }
    };

    const handleToggle = (handle: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        shouldUpdateConnections.current = true;
        setIsOpenMap((prev) => ({
            ...prev,
            [handle]: !prev[handle],
        }));
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
            if (actualHeight !== node.height) {
                updateNodeHeight(node.uuid, actualHeight);
            }
        }
    }, [node.height, isOpenMap, updateNodeHeight, node.uuid]);

    const handleNodeClick = (e: React.MouseEvent) => {
        const isToggleClick = (e.target as HTMLElement).closest("button[data-toggle='true']");
        if (isToggleClick) return;
        if (!selectedNodes.includes(node.uuid)) {
            setSelectedNodes([node.uuid]);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();

        const contextMenuItems = [
            { label: "Node-specific option", action: () => console.log("Node action") },
            { label: "Delete Node", action: () => console.log("Delete Node") }
        ];

        openContextMenu(e.clientX, e.clientY, contextMenuItems);
    };

    return (
        <div
            ref={ref}
            onClick={handleNodeClick}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            className={`absolute overflow-visible z-10 select-none flex flex-col items-start justify-start ring-2 ${
                selectedNodes.includes(node.uuid) ? "ring-sky-500/50 dark:ring-white shadow-2xl" : "ring-sky-500/50 dark:ring-white/50 shadow-sm]"
            } bg-sky-100 dark:bg-slate-800/60 backdrop-blur-lg backdrop-opacity-60 rounded-md cursor-move pb-5`}
            style={{
                width: `${size.width}px`,
                left: `${node.x}px`,
                top: `${node.y}px`,
            }}
            data-type="node"
            data-node-uuid={node.uuid}
        >
            <div className="flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5">
                <Connector in nodeUuid={node.uuid} handle={"node"} />
                <Switch color={theme === 'light' ? 'sky' : 'dark'} />
                <h3 className="font-bold truncate ml-2 text-sky-600 dark:text-white">{node.name}</h3>
            </div>
            <div className="flex flex-col w-full items-start overflow-visible">
                <div className="w-full">
                    {node.variables.map((variable) => (
                        <React.Fragment key={variable.handle}>
                            <div className="flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative">
                                {variable.in_connections !== null && (
                                    <Connector in nodeUuid={node.uuid} handle={variable.handle} />
                                )}
                                <div className="flex items-center truncate">
                                    <h3 className="font-semibold truncate text-sky-600 dark:text-white">{variable.name}</h3>
                                    {variable.type === NodeVariableType.Array && (
                                        <Squares2X2Icon className="w-4 h-4 ml-1 text-sky-600 dark:text-slate-400" />
                                    )}
                                    {variable.type === NodeVariableType.String && (
                                        <DocumentTextIcon className="w-4 h-4 ml-1 text-sky-600 dark:text-slate-400" />
                                    )}
                                    {variable.type === NodeVariableType.Number && (
                                        <HashtagIcon className="w-4 h-4 ml-1 text-sky-600 dark:text-slate-400" />
                                    )}
                                </div>
                                {variable.type === NodeVariableType.Array && (
                                    <button
                                        type="button"
                                        onClick={handleToggle(variable.handle)}
                                        data-toggle="true"
                                    >
                                        {isOpenMap[variable.handle] ? (
                                            <ChevronDownIcon className="w-5 h-5 text-sky-600 dark:text-slate-400" />
                                        ) : (
                                            <ChevronLeftIcon className="w-5 h-5 text-sky-600 dark:text-slate-400" />
                                        )}
                                    </button>
                                )}
                                {variable.out_connections !== null && (
                                    <Connector out nodeUuid={node.uuid} handle={variable.handle} />
                                )}
                            </div>
                            {variable.type === NodeVariableType.Array &&
                                Array.isArray(variable.value) &&
                                isOpenMap[variable.handle] && (
                                    <React.Fragment>
                                        {(variable.value as NodeVariable[]).map(
                                            (item: NodeVariable, index: number): React.ReactNode => (
                                                <div
                                                    key={item.handle}
                                                    className="flex items-center justify-between pl-5 pr-3 pt-1 relative"
                                                >
                                                    {item.in_connections !== null && (
                                                        <Connector
                                                            in
                                                            nodeUuid={node.uuid}
                                                            handle={variable.handle + "." + item.handle}
                                                        />
                                                    )}
                                                    <div className="flex items-center truncate text-sky-600 dark:text-white">
                                                        <span className="text-sky-600 dark:text-slate-400">
                                                            {index ===
                                                            ((variable.value as NodeVariable[])?.length ?? 0) - 1
                                                                ? "└─"
                                                                : "├─"}
                                                        </span>{" "}
                                                        {" " + item.name}:{" "}
                                                        {item.default_value &&
                                                            "{default: " + item.default_value + "}"}
                                                    </div>
                                                    {item.out_connections !== null && (
                                                        <Connector
                                                            out
                                                            nodeUuid={node.uuid}
                                                            handle={variable.handle + "." + item.handle}
                                                        />
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </React.Fragment>
                                )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div
                onMouseDown={handleResizeMouseDown}
                className="absolute w-[20px] h-[20px] border-r rounded-tr-none rounded-bl-none border-b border-white/50 right-[-5px] bottom-[-5px] cursor-se-resize rounded-[10px]"
            />
        </div>
    );
};

export default Node;
