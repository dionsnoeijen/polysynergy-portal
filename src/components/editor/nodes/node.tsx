import React, {useState} from "react";
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
import { Node as NodeType, NodeVariable, NodeVariableType } from "@/stores/nodesStore";
import {Switch} from "@/components/switch";
import {useEditorStore} from "@/stores/editorStore";

type NodeProps = {
    node: NodeType;
};

const Node: React.FC<NodeProps> = ({ node }) => {
    const { onDragMouseDown } = useDraggable();
    const { size, handleResizeMouseDown } = useResizable(200, 150);
    const [ isOpenMap, setIsOpenMap ] = useState<{ [key: string]: boolean }>({});
    const { selectedNodes, setSelectedNodes } = useEditorStore();

    const handleNodeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedNodes([node.uuid]);
        onDragMouseDown();
    };

    const handleToggle = (handle: string) => {
        setIsOpenMap((prev) => ({
            ...prev,
            [handle]: !prev[handle],
        }));
    };

    const handleNodeClick = () => {
        if (!selectedNodes.includes(node.uuid)) {
            setSelectedNodes([node.uuid]);
        }
    };

    return (
        <div
            onClick={handleNodeClick}
            onMouseDown={handleNodeMouseDown}
            className={`absolute overflow-visible z-10 select-none flex flex-col items-start justify-start ${
                selectedNodes.includes(node.uuid) ? "ring-2 ring-white" : "ring-1 ring-white/50"
            } shadow-2xl bg-slate-800/90 backdrop-blur-lg backdrop-opacity-60 rounded-md cursor-move pb-5`}
            style={{
                width: `${size.width}px`,
                left: `${node.x}px`,
                top: `${node.y}px`,
            }}
        >
            <div className="flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5">
                <Connector in nodeUuid={node.uuid} />
                <Switch />
                <h3 className="font-bold truncate ml-2">{node.name}</h3>
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
                                    <h3 className="font-semibold truncate">{variable.name}</h3>
                                    {variable.type === NodeVariableType.Array && (
                                        <Squares2X2Icon className="w-4 h-4 ml-1 text-gray-400" />
                                    )}
                                    {variable.type === NodeVariableType.String && (
                                        <DocumentTextIcon className="w-4 h-4 ml-1 text-gray-400" />
                                    )}
                                    {variable.type === NodeVariableType.Number && (
                                        <HashtagIcon className="w-4 h-4 ml-1 text-gray-400" />
                                    )}
                                </div>
                                {variable.type === NodeVariableType.Array && (
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(variable.handle)}
                                    >
                                        {isOpenMap[variable.handle] ? (
                                            <ChevronDownIcon className="w-5 h-5" />
                                        ) : (
                                            <ChevronLeftIcon className="w-5 h-5" />
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
                                        {(variable.value as NodeVariable[]).map((item: NodeVariable, index: number): React.ReactNode => (
                                            <div
                                                key={item.handle}
                                                className="flex items-center justify-between pl-5 pr-3 pt-1 relative"
                                            >
                                                {item.in_connections !== null && (
                                                    <Connector in nodeUuid={node.uuid} handle={variable.handle} />
                                                )}
                                                <div className="flex items-center truncate">
                                                    <span className="text-gray-400">
                                                    {index === ((variable.value as NodeVariable[])?.length ?? 0) - 1 ? "└─" : "├─"}
                                                    </span>{" "}
                                                    {item.name}:{" "}
                                                    {item.default_value && "{default: " + item.default_value + "}"}
                                                </div>
                                                {item.out_connections !== null && (
                                                    <Connector out nodeUuid={node.uuid} handle={variable.handle} />
                                                )}
                                            </div>
                                        ))}
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
