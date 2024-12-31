import React, {useEffect, useRef, useState} from "react";
import useResizable from "@/hooks/editor/nodes/useResizable";
import Connector from "@/components/editor/nodes/connector";
import useNodesStore from "@/stores/nodesStore";
import {Node as NodeType, NodeEnabledConnector, NodeVariableType} from "@/types/types";
import {useEditorStore} from "@/stores/editorStore";
import useToggleConnectionCollapse from "@/hooks/editor/nodes/useToggleConnectionCollapse";
import ArrayVariable from "@/components/editor/nodes/rows/array-variable";
import StringVariable from "@/components/editor/nodes/rows/string-variable";
import NumberVariable from "@/components/editor/nodes/rows/number-variable";
import BooleanVariable from "@/components/editor/nodes/rows/boolean-variable";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import {ThreeWaySwitch} from "@/components/three-way-switch";
import {globalToLocal} from "@/utils/positionUtils";

type NodeProps = {
    node: NodeType;
};

function interpretVariableType(type: string): { baseType: NodeVariableType; containsNone: boolean } {
    const types = type.split('|');
    const containsNone = types.includes('None');

    if (types.includes('int') || types.includes('float')) {
        return { baseType: NodeVariableType.Number, containsNone };
    } else if (types.includes('str')) {
        return { baseType: NodeVariableType.String, containsNone };
    } else if (types.includes('bool')) {
        return { baseType: NodeVariableType.Boolean, containsNone };
    } else if (types.includes('array') || types.includes('dict')) {
        return { baseType: NodeVariableType.Array, containsNone };
    } else if (types.includes('true_path')) {
        return { baseType: NodeVariableType.TruePath, containsNone };
    } else if (types.includes('false_path')) {
        return { baseType: NodeVariableType.FalsePath, containsNone };
    }

    return { baseType: NodeVariableType.Unknown, containsNone };
}

const NodeRows: React.FC<NodeProps> = ({ node }) => {
    const { size, handleResizeMouseDown } = useResizable(node);
    const [ isOpenMap, setIsOpenMap ] = useState<{ [key: string]: boolean }>({});
    const { selectedNodes, zoomFactor } = useEditorStore();
    const { collapseConnections, openConnections } = useToggleConnectionCollapse(node);
    const { updateNodeHeight, updateNodePosition, setAddingStatus } = useNodesStore();
    const { handleNodeMouseDown } = useNodeMouseDown(node);
    const { handleContextMenu } = useNodeContextMenu(node);
    const [position, setPosition] = useState({ x: node.view.x, y: node.view.y });

    const [switchState, setSwitchState] = useState<'disabled' | 'driven' | 'enabled'>(
        node.driven ? 'driven' : node.enabled ? 'enabled' : 'disabled'
    );

    const ref = useRef<HTMLDivElement>(null);
    const shouldUpdateConnections = useRef(false);

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
            const actualHeight = ref.current.getBoundingClientRect().height / zoomFactor;
            if (actualHeight !== node.view.height) {
                updateNodeHeight(node.id, actualHeight);
            }
        }
    }, [node.view.height, isOpenMap, updateNodeHeight, node.id]);

    useEffect(() => {
        setSwitchState(node.driven ? 'driven' : node.enabled ? 'enabled' : 'disabled');
    }, [node]);

    useEffect(() => {
        if (!node.view.adding) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition(globalToLocal(e.clientX, e.clientY));
        };

        const handleMouseUp = () => {
            updateNodePosition(node.id, position.x, position.y);
            setAddingStatus(node.id, false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [node.view.adding, zoomFactor, position, updateNodePosition, setAddingStatus]);

    return (
        <div
            ref={ref}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            className={`absolute overflow-visible select-none flex flex-col items-start justify-start ring-2 ${
                selectedNodes.includes(node.id) ? "ring-sky-500/50 dark:ring-white shadow-2xl" : "ring-sky-500/50 dark:ring-white/50 shadow-sm]"
            } bg-sky-100 dark:bg-slate-800/60 backdrop-blur-lg backdrop-opacity-60 rounded-md pb-5 ${
                node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'
            }`}
            style={{
                width: `${size.width}px`,
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            data-type="node"
            data-node-id={node.id}
        >
            <div className={`flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5 ${node.view.disabled && 'select-none opacity-0'}`}>
                <Connector in nodeId={node.id} handle={NodeEnabledConnector.Node}/>
                <ThreeWaySwitch value={switchState} onChange={(newState) => setSwitchState(newState)} />
                <h3 className="font-bold truncate ml-2 text-sky-600 dark:text-white">{node.name}</h3>
            </div>
            <div className="flex flex-col w-full items-start overflow-visible">
                <div className="w-full">
                    {node.variables.map((variable) => {
                        const type = interpretVariableType(variable.type);
                        switch (type.baseType) {
                            case NodeVariableType.Array:
                                return (
                                    <ArrayVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
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
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.Number:
                                return (
                                    <NumberVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.Boolean:
                            case NodeVariableType.TruePath:
                            case NodeVariableType.FalsePath:
                                return (
                                    <BooleanVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
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
