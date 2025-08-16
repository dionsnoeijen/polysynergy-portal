import React, {useState, useEffect, useRef} from "react";
import {ChevronLeftIcon} from "@heroicons/react/24/outline";
import {getNodeExecutionDetails} from "@/api/executionApi";
import FormattedNodeOutput from "@/components/editor/bottombars/formatted-node-output";
import useMockStore from "@/stores/mockStore";
import useEditorStore from "@/stores/editorStore";

const NodeOutput: React.FC = (): React.ReactElement => {
    const mockNodes = useMockStore((state) => state.mockNodes);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [expandedNodes, setExpandedNodes] = useState<Record<string, any>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nodeDataCache, setNodeDataCache] = useState<Record<string, any>>({});
    const previousMockNodesLength = useRef(mockNodes.length);
    
    // Reset expanded state when a new execution starts (mockNodes get cleared and repopulated)
    useEffect(() => {
        // Detect new execution: mockNodes length goes from >0 to 0 (cleared), then starts growing again
        if (previousMockNodesLength.current > 0 && mockNodes.length === 0) {
            setExpandedNodes({});
            setNodeDataCache({});
        }
        previousMockNodesLength.current = mockNodes.length;
    }, [mockNodes.length]);

    const reversedNodes = [...mockNodes]
        .sort((a, b) => a.order - b.order)
        .reverse();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toggleNode = async (node: any) => {
        const nodeKey = `${node.id}-${node.order}`;
        
        if (expandedNodes[nodeKey]) {
            // Close the node
            setExpandedNodes((prev) => {
                const newState = {...prev};
                delete newState[nodeKey];
                return newState;
            });
            return;
        }

        // Check if we already have cached data for this node
        if (nodeDataCache[nodeKey]) {
            // Use cached data
            setExpandedNodes((prev) => ({
                ...prev,
                [nodeKey]: nodeDataCache[nodeKey],
            }));
            return;
        }

        // Fetch new data and cache it
        try {
            const data = await getNodeExecutionDetails(
                activeVersionId as string,
                node.runId,
                node.id,
                node.order,
                'mock',
                'mock'
            );

            // Cache the fetched data
            setNodeDataCache((prev) => ({
                ...prev,
                [nodeKey]: data,
            }));

            // Expand the node with cached data
            setExpandedNodes((prev) => ({
                ...prev,
                [nodeKey]: data,
            }));
        } catch (error) {
            console.error('Failed to fetch node execution details:', error);
        }
    };

    return (
        <div className="h-full overflow-auto">
            {reversedNodes.length === 0 ? (
                <div className="h-full flex flex-col items-center pt-[150px]">
                    <div className="bg-sky-50 dark:bg-zinc-800 border border-sky-200 dark:border-zinc-700 rounded-lg px-8 py-6 shadow-sm">
                        <div className="text-center text-zinc-600 dark:text-zinc-400 text-lg font-medium">
                            Run flow for output
                        </div>
                    </div>
                </div>
            ) : (
                reversedNodes.map((node, index) => {
                    const nodeKey = `${node.id}-${node.order}`;
                    const isOpen = !!expandedNodes[nodeKey];
                    return (
                        <div key={nodeKey} className="border-b border-sky-500/50 dark:border-white/10 p-2">
                            <div
                                className="flex justify-between items-center cursor-pointer hover:bg-white/5"
                                onClick={() => toggleNode(node)}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white">
                                        {reversedNodes.length - index}
                                    </span>
                                    <span className="text-sm font-bold">{node.type}</span>:
                                    <span className="text-[0.7rem] font-light">{node.handle}</span>
                                </span>
                                <ChevronLeftIcon
                                    className={`w-4 h-4 transition-transform ${isOpen ? "-rotate-90" : ""} text-sky-500 dark:text-white/80`}
                                />
                            </div>

                            {isOpen && expandedNodes[nodeKey]?.variables && (
                                <FormattedNodeOutput variables={expandedNodes[nodeKey].variables}/>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default NodeOutput;