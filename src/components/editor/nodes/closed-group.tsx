import React, {useState} from "react";
import useEditorStore from "@/stores/editorStore";
import useGrouping from "@/hooks/editor/nodes/useGrouping";
import useVariablesForGroup from "@/hooks/editor/nodes/useVariablesForGroup";
import useNodesStore from "@/stores/nodesStore";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";

import {GroupProps, NodeCollapsedConnector, NodeVariable} from "@/types/types";
import { ChevronDownIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/button";

import Connector from "@/components/editor/nodes/connector";
import ServiceHeading from "@/components/editor/nodes/rows/service-heading";
import NodeIcon from "@/components/editor/nodes/node-icon";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";
import useNodeColor from "@/hooks/editor/nodes/useNodeColor";
import NodeVariables from "@/components/editor/nodes/rows/node-variables";
import useAutoResize from "@/hooks/editor/nodes/useAutoResize";
import {ConfirmAlert} from "@/components/confirm-alert";

const ClosedGroup: React.FC<GroupProps> = ({
    node,
    isMirror = false,
    preview = false
}): React.ReactElement => {
    const ref = useAutoResize(node);
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const openContextMenu = useEditorStore((state) => state.openContextMenu);
    const nodeToMoveToGroupId = useEditorStore((state) => state.nodeToMoveToGroupId);
    const setNodeToMoveToGroupId = useEditorStore((state) => state.setNodeToMoveToGroupId);
    const toggleNodeViewCollapsedState = useNodesStore((state) => state.toggleNodeViewCollapsedState);
    const position = useNodePlacement(node);
    const addNodeToGroup = useNodesStore((state) => state.addNodeToGroup);

    const {openGroup, deleteGroup, dissolveGroup} = useGrouping();
    const {variablesForGroup} = useVariablesForGroup(node.id, false);
    const {handleNodeMouseDown} = useNodeMouseDown(node);

    const [isDissolveDialogOpen, setIsDissolveDialogOpen] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(
            e.clientX,
            e.clientY,
            [
                { label: "Move To Group", action: () => setNodeToMoveToGroupId(node.id) },
                { label: "Open Group", action: () => openGroup(node.id) },
                { label: "Delete Group", action: () => deleteGroup(node.id) },

                // @todo: Dissolving from a closed group requires finding the internal
                //    connections and showing them, because they have a status of hidden
                // { label: "Dissolve Group", action: () => setIsDissolveDialogOpen(true) }
            ]
        );
    };

    const handleCollapse = () => {
        toggleNodeViewCollapsedState(node.id);
    };

    const handleConfirmDissolve = () => {
        dissolveGroup(node.id);
        setIsDissolveDialogOpen(false);
    };

    const className = `
        ${preview ? 'relative' : 'absolute'} overflow-visible select-none items-start justify-start rounded-md pb-5 
        ${!isMirror && node.view.disabled ? ' z-1 select-none opacity-30' : ' z-20 cursor-move'}
        ${node.view.adding ? ' shadow-[0_0_15px_rgba(59,130,246,0.8)]' : ''}
        ${useNodeColor(node, selectedNodes.includes(node.id), undefined, false)}
        `.replace(/\s+/g, ' ').trim();

    return !node.view.collapsed ? (
        <div
            className={className}
            data-type="closed-group"
            data-node-id={isMirror ? ('mirror-' + node.id) : node.id}
            onContextMenu={!preview ? handleContextMenu : () => {}}
            onMouseDown={(e) => {
                if (preview) return;
                if (nodeToMoveToGroupId && nodeToMoveToGroupId !== node.id) {
                    addNodeToGroup(node.id, nodeToMoveToGroupId);
                    setNodeToMoveToGroupId(null);
                } else {
                    handleNodeMouseDown(e);
                }
            }}
            onDoubleClick={() => openGroup(node.id)}
            title={node.category + ' > ' + node.name + ' > ' + (isMirror ? ('mirror-' + node.id) : node.id)}
            style={{
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
        >
            <div
                className={`flex items-center border-b border-white/20 p-2 w-full overflow-visible relative pl-5 ${!isMirror && node.view.disabled && 'select-none opacity-0'}`}>
                {node?.icon && (
                    <NodeIcon icon={node.icon} className={'border bg-white border-white/50 mr-3'} />
                )}
                <h3 className="font-bold truncate text-sky-600 dark:text-white">
                    {node.service
                      ? (node.service.name.trim() === '' ? '...' : node.service.name)
                      : node.name}
                </h3>
                <Button
                    onClick={handleCollapse} plain className="ml-auto p-1 px-1 py-1">
                    <ChevronDownIcon style={{color: 'white'}} className={'w-4 h-4'}/>
                </Button>
            </div>

            {node.service && node.service.id && (
                <div className={`flex w-full ${!isMirror && node.view.disabled && 'select-none opacity-0'}`}>
                    <ServiceHeading nodeName={node.name} preview={preview} node={node} icon={node.icon}/>
                </div>
            )}
            <div className="flex w-full gap-4">
                {variablesForGroup?.inVariables && variablesForGroup?.inVariables?.length > 0 && (
                <div className="flex-1 flex flex-col">
                    <NodeVariables node={node} variables={variablesForGroup.inVariables.filter(
                        (v): v is { variable: NodeVariable; nodeId: string } => v !== null
                    )} isMirror={isMirror} onlyIn={true} />
                </div>
                )}
                {variablesForGroup?.outVariables && variablesForGroup?.outVariables?.length > 0 && (
                <div className="flex-1 flex flex-col">
                    <NodeVariables node={node} variables={variablesForGroup.outVariables} isMirror={isMirror} onlyOut={true} />
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
        </div>
    ) : (
        <div
            ref={ref}
            onContextMenu={!preview ? handleContextMenu : () => {}}
            onMouseDown={!preview ? handleNodeMouseDown : () => {}}
            onDoubleClick={handleCollapse}
            className={className + ` p-5`}
            style={{
                width: `200px`,
                left: preview ? '0px' : `${position.x}px`,
                top: preview ? '0px' : `${position.y}px`,
            }}
            title={node.category + ' > ' + node.id + ' > ' + node.name}
            data-type="closed-group"
            data-node-id={node.id}
        >
            <Connector in nodeId={node.id} handle={NodeCollapsedConnector.Collapsed}/>
            <div className="flex items-center gap-2">
                <GlobeAltIcon className={'w-10 h-10'}/>
                <h3 className="font-bold text-sky-600 dark:text-white">{node.name}</h3>
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
