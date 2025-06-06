import React, {useState, useLayoutEffect, useRef} from "react";
import useEditorStore from "@/stores/editorStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import useVariablesForGroup from "@/hooks/editor/nodes/useVariablesForGroup";
import useNodesStore from "@/stores/nodesStore";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";

import {GroupProps, NodeCollapsedConnector, NodeVariable} from "@/types/types";
import {ChevronDownIcon, ChevronUpIcon, GlobeAltIcon} from "@heroicons/react/24/outline";
import {Button} from "@/components/button";

import Connector from "@/components/editor/nodes/connector";
import ServiceHeading from "@/components/editor/nodes/rows/service-heading";
import NodeIcon from "@/components/editor/nodes/node-icon";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";
import useNodeColor, {
    getCategoryGradientBackgroundColor,
    getCategoryBorderColor,
    getCategoryTextColor, NodeSubType
} from "@/hooks/editor/nodes/useNodeColor";
import NodeVariables from "@/components/editor/nodes/rows/node-variables";
import useAutoResize from "@/hooks/editor/nodes/useAutoResize";
import {ConfirmAlert} from "@/components/confirm-alert";
import useMockStore from "@/stores/mockStore";

const ClosedGroup: React.FC<GroupProps> = ({
                                               node,
                                               isMirror = false,
                                               preview = false
                                           }): React.ReactElement => {
    const ref = useAutoResize(node);
    const measureRef = useRef<HTMLDivElement>(null);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);
    const toggleNodeViewCollapsedState = useNodesStore((state) => state.toggleNodeViewCollapsedState);
    const visibleNodeCount = useEditorStore((state) => state.visibleNodeCount);
    const position = useNodePlacement(node);
    const updateNodeWidth = useNodesStore((state) => state.updateNodeWidth);
    const isNodeInGroup = useNodesStore((state) => state.isNodeInGroup);
    const hasMockData = useMockStore((state) => state.hasMockData);
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node.id]));


    const [height, setHeight] = useState(0);
    const isPanning = useEditorStore((state) => state.isPanning);
    const isZooming = useEditorStore((state) => state.isZooming);
    const zoomFactor = useEditorStore((state) => state.getZoomFactorForVersion());
    const {openGroup, deleteGroup, dissolveGroup, removeNodeFromGroup, moveNodeToGroup} = useGrouping();
    const {variablesForGroup} = useVariablesForGroup(node.id, false);
    const {handleNodeMouseDown} = useNodeMouseDown(node);

    const [isDissolveDialogOpen, setIsDissolveDialogOpen] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const contextMenuItems = [
            {label: "Open Group", action: () => openGroup(node.id)},
            {label: "Delete Group", action: () => deleteGroup(node.id)},
        ];
        const groupId = isNodeInGroup(node.id);
        if (groupId && selectedNodes.length === 1) {
            contextMenuItems.unshift({
                label: "Remove From Group",
                action: () => removeNodeFromGroup(groupId, node.id)
            });
        }
        if (!nodeToMoveToGroupId && selectedNodes.length === 1) {
            contextMenuItems.unshift({
                label: "Move To group",
                action: () => setNodeToMoveToGroupId(node.id)
            });
        }

        openContextMenu(
            e.clientX,
            e.clientY,
            contextMenuItems
        );
    };

    const handleCollapse = () => {
        toggleNodeViewCollapsedState(node.id);
    };

    const handleConfirmDissolve = () => {
        dissolveGroup(node.id);
        setIsDissolveDialogOpen(false);
    };

    const shouldSuspendNodeRendering = isPanning && visibleNodeCount >= 30;

    const className = `
        ${preview ? 'relative' : 'absolute'} overflow-visible select-none items-start justify-start rounded-md
        ${!isMirror && node.view.disabled ? ' z-1 select-none opacity-30' : ` z-20${!nodeToMoveToGroupId ? ' cursor-move' : ''}`}
        ${node.view.adding ? ' shadow-[0_0_15px_rgba(59,130,246,0.8)]' : ''}
        ${useNodeColor(node, selectedNodes.includes(node.id), hasMockData ? {started: false, killed: false} : undefined, hasMockData)}
        `.replace(/\s+/g, ' ').trim();

    useLayoutEffect(() => {
        if (measureRef.current && !isPanning && !isZooming) {
            const rect = measureRef.current.getBoundingClientRect();
            const newHeight = rect.height / zoomFactor;
            const newWidth = rect.width / zoomFactor;

            setHeight(newHeight);

            if (Math.abs(newWidth - node.view.width) > 1) {
                updateNodeWidth(node.id, newWidth);
            }
        }
    }, [isPanning, isZooming, zoomFactor, node.id, node.view.width, updateNodeWidth]);

    useLayoutEffect(() => {
        if (!node.view.collapsed && measureRef.current && !isPanning && !isZooming) {
            const rect = measureRef.current.getBoundingClientRect();
            const newWidth = rect.width / zoomFactor;
            if (Math.abs(newWidth - node.view.width) > 1) {
                updateNodeWidth(node.id, newWidth);
            }
        }
    }, [
        isPanning,
        isZooming,
        node.id,
        node.view.collapsed,
        node.view.width,
        updateNodeWidth,
        zoomFactor
    ]);

    const isService = !!node.service?.id || isNodeInService;

    const categoryBorder = getCategoryBorderColor(node.category, isService ? NodeSubType.Service : undefined);
    const categoryBackground = getCategoryGradientBackgroundColor(node.category, isService ? NodeSubType.Service : undefined);
    const categoryMainTextColor = getCategoryTextColor('main', node.category, isService ? NodeSubType.Service : undefined);
    const categorySubTextColor = getCategoryTextColor('sub', node.category, isService ? NodeSubType.Service : undefined);

    return !node.view.collapsed ? (
        <div
            className={className + ' pb-5'}
            data-type="closed-group"
            data-node-id={isMirror ? ('mirror-' + node.id) : node.id}
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={(e) => {
                if (preview) return;
                if (nodeToMoveToGroupId && nodeToMoveToGroupId !== node.id) {
                    moveNodeToGroup(nodeToMoveToGroupId, node.id);
                } else {
                    handleNodeMouseDown(e);
                }
            }}
            ref={measureRef}
            onDoubleClick={() => openGroup(node.id)}
            title={node.category + ' > ' + node.name + ' > ' + (isMirror ? ('mirror-' + node.id) : node.id)}
            style={{
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
                minWidth: isPanning || isZooming ? `${node.view.width}px` : 'auto',
                height: shouldSuspendNodeRendering ? `${height}px` : undefined,
            }}
        >
            {!shouldSuspendNodeRendering && (
                <>
                    <div
                        className={`flex items-center border-b ${categoryBorder} ${categoryBackground} p-2 w-full overflow-visible relative pl-5 ${!isMirror && node.view.disabled && 'select-none opacity-0'}`}>
                        {node?.icon && (
                            <NodeIcon
                                icon={node.icon}
                                className={`h-10 w-10 ${categoryMainTextColor} mr-3`}
                                preserveColor={!!node.service?.id}
                            />
                        )}
                        <div
                            className={`flex flex-col justify-center ${node.has_enabled_switch ? 'ml-2' : 'ml-3'} min-w-0`}>
                            <h3 className={`font-bold truncate ${categoryMainTextColor}`}>
                                {node.service
                                    ? (node.service.name.trim() === '' ? '...' : node.service.name)
                                    : node.name}
                            </h3>
                            <h5 className={`text-xs truncate ${categorySubTextColor} -mt-0.5`}>
                                {node.category}
                            </h5>
                        </div>

                        <button
                            onClick={handleCollapse} className="ml-auto p-1 px-1 py-1">
                            <ChevronDownIcon className={`w-6 h-6 ${categoryMainTextColor}`}/>
                        </button>
                    </div>

                    {node.service && node.service.id && (
                        <div className={`flex w-full ${!isMirror && node.view.disabled && 'select-none opacity-0'}`}>
                            <ServiceHeading
                                nodeName={node.name}
                                preview={preview}
                                node={node}
                                icon={node.icon}
                                categoryMainTextColor={categoryMainTextColor}
                                categorySubTextColor={categorySubTextColor}
                                categoryBorderColor={categoryBorder}
                            />
                        </div>
                    )}
                    <div className="flex w-full gap-4">
                        {variablesForGroup?.inVariables && variablesForGroup?.inVariables?.length > 0 && (
                            <div className="flex-1 flex flex-col">
                                <NodeVariables
                                    node={node}
                                    categoryMainTextColor={categoryMainTextColor}
                                    categorySubTextColor={categorySubTextColor}
                                    variables={variablesForGroup.inVariables.filter(
                                    (v): v is { variable: NodeVariable; nodeId: string } => v !== null
                                )} isMirror={isMirror} onlyIn={true}/>
                            </div>
                        )}
                        {variablesForGroup?.outVariables && variablesForGroup?.outVariables?.length > 0 && (
                            <div className="flex-1 flex flex-col">
                                <NodeVariables
                                    node={node}
                                    categoryMainTextColor={categoryMainTextColor}
                                    categorySubTextColor={categorySubTextColor}
                                    variables={variablesForGroup.outVariables}
                                    isMirror={isMirror}
                                    onlyOut={true}
                                />
                            </div>
                        )}
                    </div>

                    <ConfirmAlert
                        open={isDissolveDialogOpen}
                        onClose={() => setIsDissolveDialogOpen(false)}
                        onConfirm={handleConfirmDissolve}
                        title={'Confirm Dissolve Group'}
                        description={'Are you sure you want to dissolve this group? This action cannot be undone.'}
                    />
                </>
            )}
        </div>
    ) : (
        <div
            ref={ref}
            onContextMenu={!preview ? handleContextMenu : () => {
            }}
            onMouseDown={!preview ? handleNodeMouseDown : () => {
            }}
            onDoubleClick={handleCollapse}
            className={className + ` p-[0.86rem] ${categoryBackground}`}
            style={{
                width: `${node.view.width}px`,
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
                minWidth: '200px'
            }}
            title={node.category + ' > ' + node.id + ' > ' + node.name}
            data-type="closed-group"
            data-node-id={node.id}
        >
            <Connector in nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
            <div className="flex items-center gap-2">
                {node?.icon ? (
                    <NodeIcon
                        icon={node.icon}
                        className={`${categoryMainTextColor} w-10 h-10 max-w-10 max-h-10`}
                        preserveColor={!!node.service?.id}
                    />
                ) : (
                    <GlobeAltIcon className={`w-10 h-10 ${categoryMainTextColor}`}/>
                )}
                <div className={`flex flex-col justify-center ml-2 min-w-0`}>
                <h3 className={`font-bold truncate ${categoryMainTextColor}`}>{node.name}</h3>
                    <h5 className={`text-xs truncate ${categorySubTextColor} -mt-0.5`}>
                        {node.category}
                    </h5>
                </div>
                <button
                    onClick={handleCollapse} className="ml-auto p-1 px-1 py-1">
                    <ChevronUpIcon className={`w-6 h-6 ${categoryMainTextColor}`}/>
                </button>
            </div>
            <Connector out nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>

            <ConfirmAlert
                open={isDissolveDialogOpen}
                onClose={() => setIsDissolveDialogOpen(false)}
                onConfirm={handleConfirmDissolve}
                title={'Confirm Dissolve Group'}
                description={'Are you sure you want to dissolve this group? This action cannot be undone.'}
            />
        </div>
    )
};

export default ClosedGroup;
