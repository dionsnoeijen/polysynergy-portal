import React, {useEffect, useRef} from "react";
import useResizable from "@/hooks/editor/nodes/useResizable";
import Connector from "@/components/editor/nodes/connector";
import useNodesStore from "@/stores/nodesStore";
import useToggleConnectionCollapse from "@/hooks/editor/nodes/useToggleConnectionCollapse";
import DictVariable from "@/components/editor/nodes/rows/dict-variable";
import StringVariable from "@/components/editor/nodes/rows/string-variable";
import NumberVariable from "@/components/editor/nodes/rows/number-variable";
import BooleanVariable from "@/components/editor/nodes/rows/boolean-variable";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";
import PlayButton from "@/components/editor/nodes/rows/play-button";
import DatetimeVariable from "@/components/editor/nodes/rows/datetime-variable";
import ListVariable from "@/components/editor/nodes/rows/list-variable";
import BytesVariable from "@/components/editor/nodes/rows/bytes-variable";
import {NodeProps, NodeCollapsedConnector, NodeEnabledConnector, NodeType, NodeVariableType} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import SecretStringVariable from "@/components/editor/nodes/rows/secret-string-variable";
import {ThreeWaySwitch} from "@/components/three-way-switch";
import {interpretNodeVariableType} from "@/utils/interpretNodeVariableType";
import TextAreaVariable from "@/components/editor/nodes/rows/text-area-variable";
import {Button} from "@/components/button";
import {ChevronDownIcon, GlobeAltIcon} from "@heroicons/react/24/outline";
import NodeIcon from "@/components/editor/nodes/node-icon";
import ServiceHeading from "@/components/editor/nodes/rows/service-heading";

const NodeRows: React.FC<NodeProps> = ({node, preview = false}) => {
    const {size, handleResizeMouseDown} = useResizable(node);
    const {selectedNodes, zoomFactor} = useEditorStore();
    const {collapseConnections, openConnections} = useToggleConnectionCollapse(node);
    const {
        updateNodeHeight,
        toggleNodeVariableOpenState,
        getNodeVariableOpenState,
        toggleNodeViewCollapsedState
    } = useNodesStore();
    const {handleNodeMouseDown} = useNodeMouseDown(node);
    const {handleContextMenu} = useNodeContextMenu(node);
    const position = useNodePlacement(node);

    const ref = useRef<HTMLDivElement>(null);
    const shouldUpdateConnections = useRef(false);

    const handleToggle = (handle: string): (() => void) => {
        return () => {
            shouldUpdateConnections.current = true;
            toggleNodeVariableOpenState(node.id, handle);
        };
    };

    const handleCollapse = () => {
        shouldUpdateConnections.current = true;
        toggleNodeViewCollapsedState(node.id);
    };

    const isCollapsable = () => {
        return node.category !== NodeType.Note;
    };

    const getColorForNodeType = () => {
        let classList = '';

        if (node.service && node.service.id) {
            classList += "ring-purple-500 dark:ring-purple-500";
        } else {
            if (node.category === NodeType.Mock) {
                classList += "ring-orange-500 dark:ring-orange-500";
            } else if (node.category === NodeType.Note) {
                classList += "ring-yellow-500 dark:ring-yellow-500";
            } else {
                classList += "ring-sky-500 dark:ring-sky-500";
            }
        }

        if (selectedNodes.includes(node.id)) {
            classList += " ring-2 shadow-2xl";
        }

        return classList;
    };

    const className = `
    ${preview ? 'relative' : 'absolute'} overflow-visible select-none items-start justify-start 
    ring-1 bg-zinc-800 ${getColorForNodeType()} rounded-md pb-5 
    ${node.view.disabled ? "z-1 select-none opacity-30" : "z-20 cursor-move"}
    `.trim();

    useEffect(() => {
        if (shouldUpdateConnections.current) {
            node.variables.forEach((variable) => {
                if (variable.value && (typeof variable.value === "object" && !Array.isArray(variable.value) || Array.isArray(variable.value))) {
                    const isOpen = getNodeVariableOpenState(node.id, variable.handle);
                    if (isOpen) {
                        openConnections(variable.handle);
                    } else {
                        collapseConnections(variable.handle);
                    }
                }
            });
            shouldUpdateConnections.current = false;
        }
    }, [getNodeVariableOpenState, openConnections, collapseConnections, node.id, node.variables]);

    useEffect(() => {
        if (ref.current) {
            const actualHeight = ref.current.getBoundingClientRect().height / zoomFactor;
            if (actualHeight !== node.view.height) {
                updateNodeHeight(node.id, actualHeight);
            }
        }
        // eslint-disable-next-line
    }, [node.view.height, getNodeVariableOpenState, updateNodeHeight, node.id]);

    return !node.view.collapsed ? (
        <div
            ref={ref}
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={isCollapsable() ? handleCollapse : undefined}
            className={className}
            title={node.category + ' > ' + node.name + ' ' + node.id}
            style={{
                width: `${size.width}px`,
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
            data-type="node"
            data-node-id={node.id}
        >
            <div
                className={`flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5 ${node.view.disabled && 'select-none opacity-0'}`}>
                {node.has_enabled_switch && (
                    <>
                        <Connector in nodeId={node.id} handle={NodeEnabledConnector.Node}/>
                        <ThreeWaySwitch disabled={preview} node={node}/>
                    </>
                )}
                {node?.icon && (
                    <NodeIcon icon={node.icon} className={'border bg-white border-white/50 ml-3'} />
                )}
                <h3 className={`font-bold truncate ${node.has_enabled_switch ? 'ml-2' : 'ml-0'} text-sky-600 dark:text-white`}>
                    {node.service
                      ? (node.service.name.trim() === '' ? '...' : node.service.name)
                      : node.name}
                </h3>
                {isCollapsable() && (
                    <Button
                        onClick={handleCollapse} plain className="ml-auto p-1 px-1 py-1">
                        <ChevronDownIcon style={{color: 'white'}} className={'w-4 h-4'}/>
                    </Button>
                )}
            </div>
            <div className="flex flex-col w-full items-start overflow-visible">
                <div className="w-full">
                    {node.service && node.service.id && (
                        <ServiceHeading nodeName={node.name} preview={preview} service={node.service} icon={node.icon} />
                    )}
                    {node.variables.map((variable) => {
                        const type = interpretNodeVariableType(variable);
                        const isOpen = getNodeVariableOpenState(node.id, variable.handle);
                        switch (type.baseType) {
                            case NodeVariableType.Dict:
                                return (
                                    <DictVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        isOpen={isOpen}
                                        onToggle={handleToggle(variable.handle)}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.List:
                                return (
                                    <ListVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        isOpen={isOpen}
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
                            case NodeVariableType.Bytes:
                                return (
                                    <BytesVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                )
                            case NodeVariableType.Number:
                                return (
                                    <NumberVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.DateTime:
                                return (
                                    <DatetimeVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.SecretString:
                                return (
                                    <SecretStringVariable
                                        key={'dock-' + node.id + '-' + variable.handle}
                                        variable={variable}
                                        nodeId={node.id}
                                        disabled={node.view.disabled}
                                    />
                                );
                            case NodeVariableType.TextArea:
                            case NodeVariableType.RichTextArea:
                                return (
                                    <TextAreaVariable
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
                    {node.has_play_button && (
                        <PlayButton
                            disabled={node.view.disabled}
                            nodeId={node.id}
                        />
                    )}
                </div>
            </div>
            <div
                onMouseDown={handleResizeMouseDown}
                className="absolute w-[20px] h-[20px] border-r rounded-tr-none rounded-bl-none border-b border-white/50 right-[-5px] bottom-[-5px] cursor-se-resize rounded-[10px]"
            />
        </div>
    ) : (
        <div
            ref={ref}
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={isCollapsable() ? handleCollapse : undefined}
            className={className + ` p-5 w-auto h-auto inline-block items-center justify-center cursor-pointer`}
            style={{
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
            title={node.category + ' > ' + node.name}
            data-type="node"
            data-node-id={node.id}
        >
            <Connector in nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
            {node?.icon ? (
                <NodeIcon icon={node.icon} className={'max-w-10 max-h-10'} />
                ) : (
                <GlobeAltIcon className={'w-10 h-10'} />
            )}
            <Connector out nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
        </div>
    );
};

export default NodeRows;
