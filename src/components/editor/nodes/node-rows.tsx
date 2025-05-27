import React, {useLayoutEffect, useRef, useState} from "react";
import {
    NodeCollapsedConnector,
    NodeEnabledConnector,
    NodeProps,
    NodeType,
    NodeVariableType
} from "@/types/types";

import useNodesStore from "@/stores/nodesStore";
import useEditorStore from "@/stores/editorStore";
import useMockStore from "@/stores/mockStore";

import useResizable from "@/hooks/editor/nodes/useResizable";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";

import PlayButton from "@/components/editor/nodes/rows/play-button";
import ThreeWaySwitch from "@/components/editor/nodes/three-way-switch";
import Connector from "@/components/editor/nodes/connector";
import NodeIcon from "@/components/editor/nodes/node-icon";
import ServiceHeading from "@/components/editor/nodes/rows/service-heading";
import ExecutionOrder from "@/components/editor/nodes/execution-order";
import useNodeColor from "@/hooks/editor/nodes/useNodeColor";
import NodeVariables from "@/components/editor/nodes/rows/node-variables";

import {Button} from "@/components/button";
import {ChevronDownIcon, ChevronUpIcon, GlobeAltIcon, HomeIcon} from "@heroicons/react/24/outline";
import {useShallow} from 'zustand/shallow';

const NodeRows: React.FC<NodeProps> = ({node, preview = false}) => {
    const {size, handleResizeMouseDown} = useResizable(node);

    const ref = useRef<HTMLDivElement>(null);

    // @ts-expect-error Zustand shallow compare accepted here
    const selectedNodes: string[] = useEditorStore((state) => state.selectedNodes, useShallow);
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion());

    const toggleNodeViewCollapsedState = useNodesStore((state) => state.toggleNodeViewCollapsedState);
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node.id]));
    const {handleNodeMouseDown} = useNodeMouseDown(node, isNodeInService);
    const {handleContextMenu} = useNodeContextMenu(node);
    const position = useNodePlacement(node);
    const mockNode = useMockStore((state) => state.getMockNode(node.id));
    const hasMockData = useMockStore((state) => state.hasMockData);

    const [height, setHeight] = useState(0);

    const handleCollapse = () => {
        toggleNodeViewCollapsedState(node.id);
    };

    const isCollapsable = () => {
        return node.category !== NodeType.Note;
    };

    const className = `
        ${preview ? 'relative' : 'absolute'} overflow-visible select-none items-start justify-start rounded-md pb-5 z-0
        ${node.view.disabled ? " z-1 select-none opacity-30 " : " z-20 cursor-move "}
        ${node.view.adding ? ' shadow-[0_0_15px_rgba(59,130,246,0.8)] ' : ' '}
        ${useNodeColor(node, selectedNodes.includes(node.id), mockNode, hasMockData, isNodeInService)}
        `.replace(/\s+/g, ' ').trim();

    useLayoutEffect(() => {
        if (ref.current) {
            if (!isPanning && !isZooming) {
                setHeight(ref.current.getBoundingClientRect().height / zoomFactor);
            }
        }
    }, [node.view.height, isPanning, isZooming, node.id, zoomFactor]);

    return !node.view.collapsed ? (
        <div
            ref={ref}
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={isCollapsable() ? handleCollapse : undefined}
            className={className}
            title={node.category + ' > ' + node.name + ' > ' + node.id}
            style={{
                width: `${size.width}px`,
                height: isPanning || isZooming ? `${height}px` : 'auto',
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
            data-type="node"
            data-adding={node.view.adding}
            data-node-id={node.id}
        >
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={false}/>}
            {!isPanning && !isZooming && (<>

                <div
                    className={`flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5 ${node.view.disabled && 'select-none opacity-0'}`}>
                    {node.has_enabled_switch && (
                        <>
                            <Connector in
                                       nodeId={node.id}
                                       handle={NodeEnabledConnector.Node}
                                       nodeVariableType={[NodeVariableType.TruePath, NodeVariableType.FalsePath].join(',')}
                            />
                            <ThreeWaySwitch disabled={preview} node={node}/>
                        </>
                    )}
                    {node?.icon && (
                        <NodeIcon icon={node.icon}
                                  className={`max-h-6 max-w-6 mr-2 ${node.has_enabled_switch ? 'ml-3' : ''}`}/>
                    )}
                    <h3 className={`font-bold truncate ${node.has_enabled_switch ? 'ml-2' : 'ml-0'} text-sky-600 dark:text-white`}>
                        {node.service
                            ? (node.service.name.trim() === '' ? '...' : node.service.name)
                            : node.name}
                    </h3>
                    {false === node.view.isDeletable && (<HomeIcon className={'ml-2 h-4 w-4'}/>)}
                    {isCollapsable() && (
                        <Button
                            onClick={handleCollapse} plain className="ml-auto p-1 px-1 py-1">
                            <ChevronDownIcon style={{color: 'white'}} className={'w-4 h-4'}/>
                        </Button>
                    )}
                </div>
                <div
                    className={`flex flex-col w-full items-start overflow-visible ${node.view.disabled && 'select-none opacity-0'}`}>
                    <div className="w-full">
                        {node.category !== NodeType.Note && (
                            <div
                                className={`flex items-center justify-between w-full pl-5 pr-3 pt-1 pb-2 mb-1 relative border-b border-white/20`}>
                                <b className={'text-sky-200 truncate'}>{node.handle}</b>
                            </div>
                        )}
                        {node.service && node.service.id && (
                            <ServiceHeading
                                nodeName={node.name}
                                preview={preview}
                                node={node}
                                icon={node.icon}
                            />
                        )}
                        <NodeVariables
                            node={node}
                            variables={node.variables.map((variable) => ({variable, nodeId: node.id}))}
                        />
                        {node.has_play_button && (
                            <PlayButton
                                disabled={node.view.disabled}
                                nodeId={node.id}
                                staged={node.path === 'nodes.nodes.play.play.Play'}
                            />
                        )}
                    </div>
                </div>
                <div
                    onMouseDown={handleResizeMouseDown}
                    className="absolute w-[20px] h-[20px] border-r rounded-tr-none rounded-bl-none border-b border-white/50 right-[-5px] bottom-[-5px] cursor-se-resize rounded-[10px]"
                />
            </>)}
        </div>
    ) : (
        <div
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={isCollapsable() ? handleCollapse : undefined}
            className={className + ` p-5 w-auto h-auto inline-block items-center justify-center cursor-pointer`}
            style={{
                width: `${size.width}px`,
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
            title={node.category + ' > ' + node.name}
            data-type="node"
            data-node-id={node.id}
        >
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={false}/>}
            {node?.has_enabled_switch && (
                <Connector in nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
            )}
            <div className="flex items-center gap-2">
                {node?.has_play_button ? (
                    <PlayButton disabled={node.view.disabled} nodeId={node.id} centered={false} collapsed={true}/>
                ) : (
                    node?.icon ? (
                        <NodeIcon icon={node.icon} className={'text-white w-10 h-10 max-w-10 max-h-10'}/>
                    ) : (
                        <GlobeAltIcon className={'w-10 h-10'}/>
                    )
                )}
                <h3 className={`font-bold truncate ${node.has_enabled_switch ? 'ml-2' : 'ml-0'} text-sky-600 dark:text-white`}>
                    {node.service
                        ? (node.service.name.trim() === '' ? '...' : node.service.name)
                        : node.name}
                </h3>
                <Button
                    onClick={handleCollapse} plain className="ml-auto p-1 px-1 py-1">
                    <ChevronUpIcon style={{color: 'white'}} className={'w-4 h-4'}/>
                </Button>
            </div>
            <Connector out nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
        </div>
    );
};

export default NodeRows;
