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
import useNodeColor, {
    getCategoryGradientBackgroundColor,
    getCategoryBorderColor,
    getCategoryTextColor, NodeSubType
} from "@/hooks/editor/nodes/useNodeColor";
import NodeVariables from "@/components/editor/nodes/rows/node-variables";
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
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);

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

    const isService = !!node.service?.id || isNodeInService;

    const className = `
        ${preview ? 'relative' : 'absolute'} overflow-visible select-none items-start justify-start rounded-md z-0
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

    const shouldSuspendNodeRendering = isPanning && visibleNodeCount >= 30;
    const categoryBorder = getCategoryBorderColor(node.category, isService ? NodeSubType.Service : undefined);
    const categoryBackground = getCategoryGradientBackgroundColor(node.category, isService ? NodeSubType.Service : undefined);
    const categoryMainTextColor = getCategoryTextColor('main', node.category, isService ? NodeSubType.Service : undefined);
    const categorySubTextColor = getCategoryTextColor('sub', node.category, isService ? NodeSubType.Service : undefined);

    return !node.view.collapsed ? (
        <div
            ref={ref}
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={isCollapsable() ? handleCollapse : undefined}
            className={className + ' pb-5'}
            title={node.category + ' > ' + node.name + ' > ' + node.id}
            style={{
                width: `${size.width}px`,
                height: shouldSuspendNodeRendering ? `${height}px` : 'auto',
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
            data-type="node"
            data-adding={node.view.adding}
            data-node-id={node.id}
        >
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={false}/>}
            {!shouldSuspendNodeRendering && (<>
                <div
                    className={`flex items-center border-b ${categoryBorder} ${categoryBackground} p-[0.86rem] w-full overflow-visible relative pl-5 ${node.view.disabled && 'select-none opacity-0'}`}>
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
                    {node.category === NodeType.Note && (
                        <div
                            className="absolute -top-4 left-1/2 z-30 text-2xl pointer-events-none"
                        >
                            📌
                        </div>
                    )}
                    {node?.icon && (
                        <div className="flex items-center justify-center h-10 w-10 mr-0">
                            <NodeIcon
                                icon={node.icon}
                                className={`h-10 w-10 ${node.has_enabled_switch ? 'ml-2' : ''} ${categoryMainTextColor}`}
                                preserveColor={!!node.service}
                            />
                        </div>
                    )}
                    <div
                        className={`flex flex-col justify-center ${node.has_enabled_switch ? 'ml-2' : 'ml-3'} min-w-0`}>
                        <h3 className={`font-bold truncate ${categoryMainTextColor}`}>
                            {node.service?.name?.trim() === '' ? '...' : node.service?.name || node.name}
                        </h3>
                        <h5 className={`text-xs truncate ${categorySubTextColor} -mt-0.5`}>
                            {node.category}
                        </h5>
                    </div>

                    {false === node.view.isDeletable && (<HomeIcon className={'ml-2 h-4 w-4'}/>)}
                    {isCollapsable() && (
                        <button
                            onClick={handleCollapse} className={`ml-auto p-1 px-1 py-1`}>
                            <ChevronDownIcon className={`w-6 h-6 ${categoryMainTextColor}`}/>
                        </button>
                    )}
                </div>
                <div
                    className={`flex flex-col w-full items-start overflow-visible ${node.view.disabled && 'select-none opacity-0'}`}>
                    <div className="w-full">
                        {node.category !== NodeType.Note && (
                            <div
                                className={`flex items-center justify-between w-full pl-4 pr-4 pt-[.5rem] pb-[0.8rem] mb-1 relative border-b ${categoryBorder}`}>
                                <b className={`${categoryMainTextColor} truncate`}>{node.handle}</b>
                            </div>
                        )}
                        {node.service && node.service.id && (
                            <ServiceHeading
                                nodeName={node.name}
                                preview={preview}
                                node={node}
                                icon={node.icon}
                                categoryMainTextColor={categoryMainTextColor}
                                categorySubTextColor={categorySubTextColor}
                                categoryBorderColor={categoryBorder}
                            />
                        )}
                        <NodeVariables
                            node={node}
                            variables={node.variables.map((variable) => ({variable, nodeId: node.id}))}
                            categoryMainTextColor={categoryMainTextColor}
                            categorySubTextColor={categorySubTextColor}
                        />
                        {node.has_play_button && (
                            <PlayButton
                                disabled={node.view.disabled}
                                nodeId={node.id}
                                staged={node.path === 'nodes.nodes.play.play.Play'}
                                categoryMainTextColor={categoryMainTextColor}
                                categorySubTextColor={categorySubTextColor}
                            />
                        )}
                    </div>
                </div>
                <div
                    onMouseDown={handleResizeMouseDown}
                    className="absolute w-[20px] h-[20px] border-r rounded-tr-none rounded-bl-none border-b border-sky-500/50 dark:border-white/50 right-[-5px] bottom-[-5px] cursor-se-resize rounded-[10px]"
                />
            </>)}
        </div>
    ) :
    (
        <div
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={isCollapsable() ? handleCollapse : undefined}
            className={className + ` p-[0.86rem] w-auto inline-block items-center justify-center cursor-pointer ${categoryBackground}`}
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
                    <PlayButton
                        disabled={node.view.disabled}
                        nodeId={node.id}
                        centered={false}
                        collapsed={true}
                    />
                ) : (
                    node?.icon ? (
                        <NodeIcon
                            icon={node.icon}
                            className={`${categoryMainTextColor} w-10 h-10 max-w-10 max-h-10`}
                            preserveColor={!!node.service?.id}
                        />
                    ) : (
                        <GlobeAltIcon className={`w-10 h-10 ${categoryMainTextColor}`}/>
                    )
                )}
                <div className={`flex flex-col justify-center ml-2 min-w-0`}>
                    <h3 className={`font-bold truncate ${categoryMainTextColor}`}>
                        {node.service?.name?.trim() === '' ? '...' : node.service?.name || node.name}
                    </h3>
                    <h5 className={`text-xs truncate ${categorySubTextColor} -mt-0.5`}>
                        {node.category}
                    </h5>
                </div>
                <button onClick={handleCollapse} className="ml-auto p-1 px-1 py-1">
                    <ChevronUpIcon className={`w-6 h-6 ${categoryMainTextColor}`}/>
                </button>
            </div>
            <Connector out nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
        </div>
    );
};

export default NodeRows;
