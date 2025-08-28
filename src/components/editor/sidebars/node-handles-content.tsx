import React, { useState } from "react";
import useEditorStore from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import { Node, NodeVariable, NodeVariableType } from "@/types/types";
import { 
    ClipboardDocumentIcon, 
    CheckIcon,
    CodeBracketIcon,
    CubeIcon,
    ListBulletIcon,
    HashtagIcon,
    CalendarIcon,
    DocumentTextIcon,
    KeyIcon,
    PhotoIcon,
    CogIcon
} from "@heroicons/react/24/outline";

interface VariableDisplay {
    node: Node;
    variable: NodeVariable;
    fullHandle: string;
    level: number;
    isCurrentNode: boolean;
}

const NodeHandlesContent: React.FC = () => {
    const selectedNodes = useEditorStore((state) => state.selectedNodes);
    const nodes = useNodesStore((state) => state.nodes);
    const findInConnectionsByNodeId = useConnectionsStore((state) => state.findInConnectionsByNodeId);
    const [copiedHandle, setCopiedHandle] = useState<string | null>(null);

    // Get the currently selected node
    const selectedNode = selectedNodes.length === 1 
        ? nodes.find((n) => n.id === selectedNodes[0]) 
        : null;

    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center p-4 pt-[150px]">
                <div className="bg-sky-50/50 dark:bg-zinc-800/50 rounded-lg px-4 py-3">
                    <div className="text-center text-zinc-500 dark:text-zinc-500 text-sm">
                        Select a node to view handles
                    </div>
                    <div className="text-center text-zinc-400 dark:text-zinc-400 text-xs mt-1">
                        Choose a node to see its available variables and predecessor handles
                    </div>
                </div>
            </div>
        );
    }

    // Function to get all predecessor nodes (nodes that connect TO the current node)
    const getPredecessorNodes = (nodeId: string, visited = new Set<string>()): Node[] => {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const inConnections = findInConnectionsByNodeId(nodeId);
        const predecessorNodes: Node[] = [];

        for (const connection of inConnections) {
            const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
            if (sourceNode && sourceNode.handle) {
                predecessorNodes.push(sourceNode);
                // Recursively get predecessors of predecessors
                predecessorNodes.push(...getPredecessorNodes(sourceNode.id, visited));
            }
        }

        return predecessorNodes;
    };

    // Get all variables to display
    const getAllVariableDisplays = (): VariableDisplay[] => {
        const displays: VariableDisplay[] = [];
        
        // Add current node variables (level 0)
        if (selectedNode.variables) {
            selectedNode.variables.forEach(variable => {
                if (variable.handle) {
                    const fullHandle = variable.handle;
                    displays.push({
                        node: selectedNode,
                        variable,
                        fullHandle,
                        level: 0,
                        isCurrentNode: true
                    });

                    // If it's a dict, add sub-variables
                    if (variable.type === NodeVariableType.Dict && Array.isArray(variable.value)) {
                        (variable.value as NodeVariable[]).forEach(subVar => {
                            if (subVar.handle) {
                                const subFullHandle = `${variable.handle}.${subVar.handle}`;
                                displays.push({
                                    node: selectedNode,
                                    variable: subVar,
                                    fullHandle: subFullHandle,
                                    level: 0,
                                    isCurrentNode: true
                                });
                            }
                        });
                    }
                }
            });
        }

        // Add predecessor node variables (level 1+)
        const predecessors = getPredecessorNodes(selectedNode.id);
        const uniquePredecessors = Array.from(new Map(predecessors.map(n => [n.id, n])).values());

        uniquePredecessors.forEach(predNode => {
            if (predNode.variables && predNode.handle) {
                predNode.variables.forEach(variable => {
                    if (variable.handle) {
                        const fullHandle = `${predNode.handle}.${variable.handle}`;
                        displays.push({
                            node: predNode,
                            variable,
                            fullHandle,
                            level: 1,
                            isCurrentNode: false
                        });

                        // If it's a dict, add sub-variables
                        if (variable.type === NodeVariableType.Dict && Array.isArray(variable.value)) {
                            (variable.value as NodeVariable[]).forEach(subVar => {
                                if (subVar.handle) {
                                    const subFullHandle = `${predNode.handle}.${variable.handle}.${subVar.handle}`;
                                    displays.push({
                                        node: predNode,
                                        variable: subVar,
                                        fullHandle: subFullHandle,
                                        level: 1,
                                        isCurrentNode: false
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });

        return displays;
    };

    const variableDisplays = getAllVariableDisplays();

    // Group by level and node
    const currentNodeVars = variableDisplays.filter(v => v.isCurrentNode);
    const predecessorVars = variableDisplays.filter(v => !v.isCurrentNode);

    // Group predecessor vars by node
    const predecessorsByNode = predecessorVars.reduce((acc, display) => {
        const nodeId = display.node.id;
        if (!acc[nodeId]) {
            acc[nodeId] = [];
        }
        acc[nodeId].push(display);
        return acc;
    }, {} as Record<string, VariableDisplay[]>);

    // Get icon for variable type
    const getVariableTypeIcon = (type: string) => {
        switch (type) {
            case NodeVariableType.String:
            case NodeVariableType.TextArea:
            case NodeVariableType.RichTextArea:
                return <DocumentTextIcon className="w-3 h-3" />;
            case NodeVariableType.Number:
            case NodeVariableType.Int:
            case NodeVariableType.Float:
                return <HashtagIcon className="w-3 h-3" />;
            case NodeVariableType.Boolean:
                return <CogIcon className="w-3 h-3" />;
            case NodeVariableType.Dict:
                return <CubeIcon className="w-3 h-3" />;
            case NodeVariableType.List:
                return <ListBulletIcon className="w-3 h-3" />;
            case NodeVariableType.DateTime:
                return <CalendarIcon className="w-3 h-3" />;
            case NodeVariableType.Code:
            case NodeVariableType.Json:
            case NodeVariableType.Template:
                return <CodeBracketIcon className="w-3 h-3" />;
            case NodeVariableType.SecretString:
                return <KeyIcon className="w-3 h-3" />;
            case NodeVariableType.Image:
            case NodeVariableType.Avatar:
                return <PhotoIcon className="w-3 h-3" />;
            default:
                return <DocumentTextIcon className="w-3 h-3" />;
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(`{{ ${text} }}`);
            setCopiedHandle(text);
            setTimeout(() => setCopiedHandle(null), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const VariableItem: React.FC<{ display: VariableDisplay; showNodeName?: boolean }> = ({ 
        display, 
        showNodeName = false 
    }) => {
        const isCopied = copiedHandle === display.fullHandle;
        
        return (
            <div 
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-t border-b border-zinc-200 dark:border-zinc-700 cursor-pointer group transition-all duration-150"
                onClick={() => copyToClipboard(display.fullHandle)}
                title={`Copy: {{ ${display.fullHandle} }}`}
            >
                {/* Type Icon */}
                <div className="flex-shrink-0 text-zinc-500 dark:text-zinc-400">
                    {getVariableTypeIcon(display.variable.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    {showNodeName && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5 truncate">
                            {display.node.name || display.node.handle}
                        </div>
                    )}
                    <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 truncate">
                        {display.fullHandle}
                    </div>
                    {display.variable.name && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {display.variable.name} ({display.variable.type})
                        </div>
                    )}
                </div>
                
                {/* Copy Button */}
                <div className="flex-shrink-0">
                    {isCopied ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckIcon className="w-3 h-3" />
                            <span className="text-xs font-medium">Copied</span>
                        </div>
                    ) : (
                        <div className="text-zinc-400 dark:text-zinc-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            <ClipboardDocumentIcon className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Current Node Variables */}
            {currentNodeVars.length > 0 && (
                <div className="bg-sky-50/50 dark:bg-zinc-800/50 p-2 border-t border-b border-sky-200/30 dark:border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <CubeIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <h3 className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                            {selectedNode.name || selectedNode.handle}
                        </h3>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                            {currentNodeVars.length}
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        {currentNodeVars.map((display, index) => (
                            <VariableItem key={index} display={display} />
                        ))}
                    </div>
                </div>
            )}

            {/* Predecessor Node Variables */}
            {Object.keys(predecessorsByNode).length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                        <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <h3 className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                            Connected Nodes
                        </h3>
                    </div>
                    {Object.entries(predecessorsByNode).map(([nodeId, displays]) => {
                        const node = displays[0].node;
                        return (
                            <div key={nodeId} className="bg-zinc-50 dark:bg-zinc-800/30 p-2 border-t border-b border-zinc-200/50 dark:border-zinc-700/30">
                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                    <div className="w-2 h-2 bg-zinc-400 dark:bg-zinc-500 rounded-full"></div>
                                    <h4 className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                                        {node.name || node.handle}
                                    </h4>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                        {displays.length}
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    {displays.map((display, index) => (
                                        <VariableItem key={index} display={display} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {currentNodeVars.length === 0 && Object.keys(predecessorsByNode).length === 0 && (
                <div className="text-center py-8">
                    <div className="text-zinc-500 dark:text-zinc-400 text-sm">
                        No handles available for this node
                    </div>
                </div>
            )}
        </div>
    );
};

export default NodeHandlesContent;