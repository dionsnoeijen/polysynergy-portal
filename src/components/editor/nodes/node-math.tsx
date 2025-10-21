import { NodeProps } from "@/types/types";
import React, { useMemo } from "react";
import useEditorStore from "@/stores/editorStore";
import Connector from "@/components/editor/nodes/connector";
import useNodeMouseDown from "@/hooks/editor/nodes/useNodeMouseDown";
import useNodeContextMenu from "@/hooks/editor/nodes/useNodeContextMenu";
import useNodePlacement from "@/hooks/editor/nodes/useNodePlacement";

import ExecutionOrder from "@/components/editor/nodes/execution-order";
import useMockStore from "@/stores/mockStore";

const NodeMath: React.FC<NodeProps> = ({ node }) => {
    const isSelected = useEditorStore((state) => state.selectedNodes.includes(node.id));
    const mockNode = useMockStore((state) => state.getMockNode(node.id));
    const { handleNodeMouseDown } = useNodeMouseDown(node);
    const { handleContextMenu } = useNodeContextMenu(node);
    const position = useNodePlacement(node);
    
    // Extract input and output variables from node.variables
    const inputVariables = useMemo(() => 
        node.variables.filter(v => v.has_in === true && v.node !== false),
        [node.variables]
    );
    
    const outputVariables = useMemo(() => 
        node.variables.filter(v => v.has_out === true && v.node !== false && v.handle === 'true_path'),
        [node.variables]
    );
    
    // Calculate connector positions for inputs
    const getInputConnectorPosition = (index: number, total: number) => {
        if (total === 1) {
            // Single input: center on left side of circle
            return 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2';
        } else if (total === 2) {
            // Two inputs: spread out more on left side of circle
            return index === 0 
                ? 'left-0 top-1/4 -translate-y-1/2 -translate-x-1/2'  // Top quarter
                : 'left-0 top-3/4 -translate-y-1/2 -translate-x-1/2'; // Bottom quarter
        } else {
            // Multiple inputs: simple vertical distribution
            const positions = [
                'left-0 top-1/4 -translate-y-1/2 -translate-x-1/2',   // Top
                'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',   // Center
                'left-0 top-3/4 -translate-y-1/2 -translate-x-1/2',   // Bottom
            ];
            return positions[index] || 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2';
        }
    };
    

    return (
        <div
            className={`absolute select-none flex items-center justify-center bg-sky-600 dark:bg-zinc-800 bg-opacity-50 backdrop-blur-lg backdrop-opacity-60 rounded-[50%] ${
                isSelected ? "shadow-2xl ring-4" : "shadow-sm ring-2"
            } ${node.view.disabled ? 'z-1 select-none opacity-30' : 'z-20 cursor-move'} ${node.view.adding ? ' shadow-[0_0_15px_rgba(59,130,246,0.8)]' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `50px`,
                height: `50px`,
            }}
            onContextMenu={handleContextMenu}
            onMouseDown={handleNodeMouseDown}
            data-type="node"
            data-adding={node.view.adding}
            data-node-id={node.id}
        >
            {mockNode && <ExecutionOrder mockNode={mockNode} centered={true} />}
            
            {/* Dynamic Input Connectors */}
            {inputVariables.map((variable, index) => (
                <Connector
                    key={`in-${variable.handle}`}
                    in
                    nodeId={node.id}
                    handle={variable.handle}
                    iconClassName="text-white dark:text-white"
                    className={`${getInputConnectorPosition(index, inputVariables.length)} ring-blue-200/50 bg-blue-400 dark:bg-blue-400 ${node.view.disabled && 'select-none opacity-0'}`}
                    disabled={node.view.disabled}
                />
            ))}

            {/* Math Icon */}
            {node.icon && (
                <div 
                    className={`text-white dark:text-white ${node.view.disabled && 'select-none opacity-0'}`}
                    dangerouslySetInnerHTML={{ __html: node.icon }}
                />
            )}

            {/* Dynamic Output Connectors */}
            {outputVariables.map((variable) => (
                <Connector
                    key={`out-${variable.handle}`}
                    out
                    nodeId={node.id}
                    handle={variable.handle}
                    iconClassName="text-white dark:text-white"
                    className={`right-0 top-1/2 -translate-y-1/2 translate-x-1/2 ring-blue-200/50 bg-green-400 dark:bg-green-400 ${node.view.disabled && 'select-none opacity-0'}`}
                    disabled={node.view.disabled}
                />
            ))}
        </div>
    );
};

export default NodeMath;
