import {NodeProps, NodeJumpType} from "@/types/types";
import {Strong} from "@/components/text";
import React from "react";
import Connector from "@/components/editor/nodes/connector";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";
import {useIsNodeSelectedOptimized} from "@/hooks/editor/nodes/useIsNodeSelectedOptimized";
import {useSourceNodeWarpGateHighlight} from "@/hooks/editor/nodes/useSourceNodeWarpGateHighlight";

import ExecutionOrder from "@/components/editor/nodes/execution-order";
import useNodeColor from "@/hooks/editor/nodes/useNodeColor";
import useMockStore from "@/stores/mockStore";

const NodeJump: React.FC<NodeProps> = ({node}) => {
    const isSelected = useIsNodeSelectedOptimized(node.id);
    const mockNode = useMockStore((state) => state.getMockNode(node.id));
    const hasMockData = useMockStore((state) => state.hasMockData);
    const {handleNodeMouseDown} = useNodeMouseDown(node);
    const {handleContextMenu} = useNodeContextMenu(node);
    const position = useNodePlacement(node);

    // Highlight warp gates when this node is selected
    useSourceNodeWarpGateHighlight(node.id, isSelected);


    const className = useNodeColor(node, isSelected, mockNode, hasMockData);

    return (
        <div
            className={`absolute select-none flex items-center justify-center ring-2 rounded-full pl-5 pr-5 ${className} ${
                isSelected ? "shadow-2xl" : "shadow-sm"
            } ${node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'} ${node.view.adding ? ' shadow-[0_0_15px_rgba(59,130,246,0.8)]' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                height: `50px`,
            }}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            data-type="node"
            data-adding={node.view.adding}
            data-node-id={node.id}
        >
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={true}/>}
            {node.type === NodeJumpType.From && (
                <Connector
                    in
                    nodeId={node.id}
                    handle="handle"
                    iconClassName="text-white dark:text-white"
                    className={`ring-blue-200/50 bg-blue-400 dark:bg-blue-400 ${node.view.disabled && 'select-none opacity-0'}`}
                    disabled={node.view.disabled}
                />
            )}

            <Strong
                className={`text-white dark:text-white -mt-1 ${node.view.disabled && 'select-none opacity-0'}`}>{node.handle}</Strong>
            {node.type === NodeJumpType.To && (
                <Connector
                    out
                    nodeId={node.id}
                    handle="handle"
                    iconClassName="text-white dark:text-white"
                    className={`ring-blue-200/50 bg-green-400 dark:bg-green-400 ${node.view.disabled && 'select-none opacity-0'}`}
                    disabled={node.view.disabled}
                />
            )}
        </div>
    );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(NodeJump, (prevProps, nextProps) => {
    return prevProps.node === nextProps.node && prevProps.preview === nextProps.preview;
});
