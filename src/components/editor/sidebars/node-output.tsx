import React, {useState, useEffect, useRef, useCallback} from "react";
import {ChevronLeftIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon, CheckCircleIcon, XCircleIcon, TrashIcon} from "@heroicons/react/24/outline";
import {getNodeExecutionDetails, getAvailableRuns, getAllNodesForRun, clearAllRuns, getMockNodesForRun} from "@/api/executionApi";
import FormattedNodeOutput from "@/components/editor/bottombars/formatted-node-output";
import useMockStore, {MockNode} from "@/stores/mockStore";
import useEditorStore, { BottomBarView } from "@/stores/editorStore";
import useNodesStore from "@/stores/nodesStore";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/button";

interface Run {
    run_id: string;
    timestamp: string;
    status?: 'success' | 'error' | 'running';
}

const NodeOutput: React.FC = (): React.ReactElement => {
    const mockNodes = useMockStore((state) => state.mockNodes);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const selectedRunId = useEditorStore((state) => state.selectedRunId);
    const setSelectedRunId = useEditorStore((state) => state.setSelectedRunId);
    const loadHistoricalRunData = useEditorStore((state) => state.loadHistoricalRunData);
    const globalIsExecuting = useEditorStore((state) => state.isExecuting);
    const setBottomBarView = useEditorStore((state) => state.setBottomBarView);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [expandedNodes, setExpandedNodes] = useState<Record<string, any>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [nodeDataCache, setNodeDataCache] = useState<Record<string, any>>({});
    const previousMockNodesLength = useRef(mockNodes.length);

    // Run history state
    const [runs, setRuns] = useState<Run[]>([]);
    const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const [historicalNodes, setHistoricalNodes] = useState<Record<string, MockNode[]>>({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    
    
    // Fetch available runs
    const fetchRuns = useCallback(async () => {
        if (!activeVersionId || !activeProjectId) {
            setRuns([]);
            return;
        }
        
        try {
            const response = await getAvailableRuns(activeVersionId, activeProjectId);
            const newRuns = response.runs || [];
            
            // Don't auto-expand any runs - everything closed by default
            
            setRuns(newRuns);
        } catch (error) {
            console.error("Failed to fetch runs:", error);
            setRuns([]);
        }
    }, [activeVersionId, activeProjectId]);

    // Fetch runs when version/project changes
    useEffect(() => {
        fetchRuns();
    }, [activeVersionId, activeProjectId]);

    // Listen for close accordion and reset events from 'c' key
    useEffect(() => {
        const handleCloseAccordionAndReset = () => {
            // Use React's batching by updating state synchronously
            setExpandedRuns(new Set());
            setIsExecuting(false);
            setCurrentRunId(null);
            setHistoricalNodes({});
            
            // Call fetchRuns after state updates
            fetchRuns();
        };

        window.addEventListener('close-accordion-and-reset', handleCloseAccordionAndReset);
        return () => window.removeEventListener('close-accordion-and-reset', handleCloseAccordionAndReset);
    }, [fetchRuns]);


    // Detect current run from mockNodes and manage accordion state
    useEffect(() => {
        // Detect new execution start: mockNodes length goes from >0 to 0 (cleared)
        if (previousMockNodesLength.current > 0 && mockNodes.length === 0) {
            setExpandedNodes({});
            setNodeDataCache({});
            // Don't clear currentRunId yet - wait for new nodes to appear
            setIsExecuting(true); // Execution is starting
        }
        
        // Detect execution start: mockNodes start populating (first node appears)
        if (previousMockNodesLength.current === 0 && mockNodes.length > 0) {
            // Get the run ID from the first mock node
            const firstNode = mockNodes[0];
            if (firstNode?.runId && firstNode.runId !== currentRunId) {
                // New execution started - clear the previous currentRunId
                setCurrentRunId(firstNode.runId);
                setIsExecuting(true); // Execution is active
                // Auto-expand only the current run (single-select)
                setExpandedRuns(new Set([firstNode.runId]));
                // Switch to Output tab to show the execution
                setBottomBarView(BottomBarView.Output);
                // Fetch updated runs list to include the new run
                setTimeout(fetchRuns, 500);
            }
        }
        
        // Detect execution completion: check if all nodes have finished executing
        if (mockNodes.length > 0) {
            const allNodesFinished = mockNodes.every(node => {
                // A node is finished if it has a status (success, error, killed) or is marked as processed
                return node.status === 'success' || node.status === 'error' || node.status === 'killed' || !node.started;
            });
            
            if (allNodesFinished && isExecuting) {
                // Small delay to ensure UI updates are complete
                setTimeout(() => {
                    setIsExecuting(false);
                    // Don't clear currentRunId - keep it so the completed run stays as current
                    // This allows the accordion to show the finished run properly
                }, 500);
            }
        }
        
        previousMockNodesLength.current = mockNodes.length;
    }, [mockNodes.length, currentRunId]);

    const reversedNodes = [...mockNodes]
        .sort((a, b) => a.order - b.order)
        .reverse();

    // Create combined runs list with proper time ordering
    const allRuns = React.useMemo(() => {
        const combinedRuns = [...runs];
        
        // Add current run if it exists and isn't already in the runs list
        if (currentRunId && !runs.some(r => r.run_id === currentRunId)) {
            combinedRuns.push({
                run_id: currentRunId,
                timestamp: new Date().toISOString(),
                status: 'running' as const
            });
        }
        
        // Sort by timestamp, newest first
        combinedRuns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return combinedRuns;
    }, [runs, currentRunId]);

    // Get nodes for a specific run (current or historical)
    const getNodesForRun = (runId: string) => {
        if (runId === currentRunId) {
            // Return live mockNodes for current run
            return reversedNodes;
        } else {
            // Return historical nodes if we have them
            return historicalNodes[runId] || [];
        }
    };
    
    // Fetch historical nodes for a run
    const fetchHistoricalNodes = async (runId: string) => {
        if (!activeVersionId || !activeProjectId) return;
        
        try {
            const response = await getAllNodesForRun(activeVersionId, runId, activeProjectId);
            const nodes = response.nodes || [];
            
            // Get node metadata from the nodes store
            const getNode = useNodesStore.getState().getNode;
            
            // Convert to MockNode format
            const mockNodes: MockNode[] = nodes.map((node: Record<string, unknown>) => {
                const nodeFlowNode = getNode(node.node_id as string);
                const nodeData = (node.data as Record<string, unknown>) || {};
                
                return {
                    id: `${node.node_id}-${node.order}`,
                    handle: nodeFlowNode?.handle || '',
                    order: node.order as number,
                    type: nodeFlowNode?.path?.split(".").pop() || 'Unknown',
                    killed: (nodeData.killed as boolean) || false,
                    runId: runId,
                    started: true,
                    variables: (nodeData.variables as Record<string, unknown>) || {},
                    status: nodeData.killed ? 'killed' : nodeData.error ? 'error' : 'success'
                };
            });
            
            // Sort and reverse for display
            const sortedNodes = mockNodes.sort((a, b) => a.order - b.order).reverse();
            
            setHistoricalNodes(prev => ({
                ...prev,
                [runId]: sortedNodes
            }));
            
            return sortedNodes;
        } catch (error) {
            console.error('Failed to fetch historical nodes:', error);
            return [];
        }
    };

    // Handle accordion run toggle
    const toggleRun = async (runId: string) => {
        const isExpanded = expandedRuns.has(runId);
        
        if (isExpanded) {
            // Collapse - simply close accordion and clear visual states
            setExpandedRuns(new Set());
            
            // Always clear mock data and visual states when closing any accordion item
            useMockStore.getState().clearMockStore();
            // Clear visual states from nodes
            const elements = document.querySelectorAll('[data-node-id]');
            elements.forEach((el) => {
                el.classList.remove('executing', 'executed-success', 'executed-killed', 'executed-error');
            });
            
            // Clear selection state but keep accordion active
            if (selectedRunId === runId) {
                // Use a lightweight clear that doesn't affect accordion state
                useEditorStore.setState({selectedRunId: undefined, isViewingHistoricalRun: false});
            }
        } else {
            // Disable opening other runs during execution
            if (globalIsExecuting !== null && runId !== currentRunId) {
                return;
            }
            
            // Single-select: close all others and open this one
            setExpandedRuns(new Set([runId]));
            
            // For historical runs, fetch the nodes and apply to mock store
            if (runId !== currentRunId) {
                // Clear current mock data
                useMockStore.getState().clearMockStore();
                
                try {
                    // First try to get stored mock nodes (perfect recreation)
                    const mockNodesResponse = await getMockNodesForRun(activeVersionId, runId, activeProjectId);
                    const storedMockNodes = mockNodesResponse.mock_nodes;
                    
                    if (storedMockNodes && storedMockNodes.length > 0) {
                        console.log("Using stored mock nodes for perfect recreation:", storedMockNodes.length);
                        
                        // Apply stored mock nodes directly
                        storedMockNodes.forEach(node => {
                            useMockStore.getState().addOrUpdateMockNode(node);
                        });
                        useMockStore.getState().setHasMockData(true);
                        setHistoricalNodes(prev => ({ ...prev, [runId]: storedMockNodes }));
                        
                        // Set as selected and load connection visual state
                        setSelectedRunId(runId);
                        await loadHistoricalRunData(runId);
                        
                    } else {
                        // Fallback: reconstruct from individual node data (legacy)
                        console.log("No stored mock nodes, falling back to reconstruction");
                        let nodes = historicalNodes[runId];
                        if (!nodes) {
                            nodes = await fetchHistoricalNodes(runId);
                        }
                        
                        if (nodes && nodes.length > 0) {
                            nodes.forEach(node => {
                                useMockStore.getState().addOrUpdateMockNode(node);
                            });
                            useMockStore.getState().setHasMockData(true);
                            
                            setSelectedRunId(runId);
                            await loadHistoricalRunData(runId);
                        }
                    }
                } catch (error) {
                    console.error('Failed to load historical run data:', error);
                }
            } else {
                // For current run, just set as selected and load visual state
                setSelectedRunId(runId);
                await loadHistoricalRunData(runId);
            }
        }
    };

    // Helper functions
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusIcon = (run: Run) => {
        if (run.status === 'error') {
            return <XCircleIcon className="w-4 h-4 text-red-400" />;
        } else if (run.status === 'success') {
            return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
        } else {
            return <ClockIcon className="w-4 h-4 text-white dark:text-white" />;
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toggleNode = async (node: any, runId: string) => {
        // Create a unique key for this node in this run
        const nodeKey = `${node.id}-${runId}`;
        
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
            // Parse the node ID to get the base node ID (remove the order suffix)
            const baseNodeId = node.id.replace(/-\d+$/, '');
            
            const data = await getNodeExecutionDetails(
                activeVersionId as string,
                runId,
                baseNodeId,
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

    const handleClearAllRuns = async () => {
        if (!activeVersionId || !activeProjectId) return;
        
        try {
            await clearAllRuns(activeVersionId, activeProjectId);
            // Clear local state
            setRuns([]);
            setExpandedRuns(new Set());
            setHistoricalNodes({});
            setCurrentRunId(null);
            setIsExecuting(false); // Reset execution state to enable accordion buttons
            useMockStore.getState().clearMockStore();
            // Clear visual states
            const elements = document.querySelectorAll('[data-node-id]');
            elements.forEach((el) => {
                el.classList.remove('executing', 'executed-success', 'executed-killed', 'executed-error');
            });
            setShowClearModal(false);
        } catch (error) {
            console.error('Failed to clear runs:', error);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header with clear button */}
            {allRuns.length > 0 && (
                <div className="flex justify-between items-center p-2 border-b border-zinc-700">
                    <span className="text-xs text-zinc-400 font-medium">Execution History</span>
                    <button
                        onClick={() => setShowClearModal(true)}
                        className="text-zinc-400 hover:text-red-400 transition-colors"
                        title="Clear all runs"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            
            <div className="flex-1 overflow-auto">
                {allRuns.length === 0 ? (
                <div className="h-full flex flex-col items-center pt-[150px]">
                    <div className="bg-sky-50 dark:bg-zinc-800 border border-sky-200 dark:border-zinc-700 rounded-lg px-8 py-6 shadow-sm">
                        <div className="text-center text-zinc-600 dark:text-zinc-400 text-lg font-medium">
                            Run flow for output
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-0">
                    {allRuns.map((run, index) => {
                        const isExpanded = expandedRuns.has(run.run_id);
                        const isSelected = selectedRunId === run.run_id;
                        const isCurrent = run.run_id === currentRunId && globalIsExecuting !== null;
                        const runNodes = getNodesForRun(run.run_id);
                        
                        return (
                            <div key={run.run_id} className="border-b border-zinc-700 last:border-b-0">
                                {/* Run Header */}
                                <button
                                    onClick={() => toggleRun(run.run_id)}
                                    disabled={globalIsExecuting !== null && run.run_id !== currentRunId}
                                    className={`w-full p-2 text-left transition-colors flex items-center justify-between ${
                                        isSelected ? 'bg-zinc-700' : ''
                                    } ${
                                        globalIsExecuting !== null && run.run_id !== currentRunId 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:bg-zinc-700/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {isExpanded ? (
                                            <ChevronDownIcon className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronRightIcon className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                                        )}
                                        {getStatusIcon(run)}
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs text-white font-medium flex items-center gap-2">
                                                Run #{allRuns.length - index}
                                                {isCurrent && (
                                                    <span className="text-green-400 text-xs">• Live</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-zinc-400 truncate">
                                                {formatTimestamp(run.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-500 font-mono">
                                        {run.run_id.substring(0, 8)}...
                                    </div>
                                </button>

                                {/* Run Content - Node List */}
                                {isExpanded && (
                                    <div className="bg-zinc-800/30">
                                        {runNodes.length === 0 ? (
                                            <div className="p-4 text-center text-zinc-500 text-xs">
                                                {isCurrent ? "Waiting for execution..." : "No execution data"}
                                            </div>
                                        ) : (
                                            runNodes.map((node, nodeIndex) => {
                                                const nodeKey = `${node.id}-${run.run_id}`;
                                                const isOpen = !!expandedNodes[nodeKey];
                                                
                                                return (
                                                    <div key={nodeKey} className="border-b border-zinc-600/50 last:border-b-0">
                                                        <div className="p-2">
                                                            <div
                                                                className="flex justify-between items-center cursor-pointer hover:bg-white/5 rounded"
                                                                onClick={() => toggleNode(node, run.run_id)}
                                                            >
                                                                <span className="inline-flex items-center gap-2">
                                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white text-xs">
                                                                        {runNodes.length - nodeIndex}
                                                                    </span>
                                                                    <span className="text-xs font-medium">{node.type}</span>:
                                                                    <span className="text-xs font-light text-zinc-400">{node.handle}</span>
                                                                </span>
                                                                <ChevronLeftIcon
                                                                    className={`w-3 h-3 transition-transform ${isOpen ? "-rotate-90" : ""} text-sky-500 dark:text-white/80`}
                                                                />
                                                            </div>

                                                            {isOpen && expandedNodes[nodeKey]?.variables && (
                                                                <div className="mt-2 pl-8">
                                                                    <FormattedNodeOutput variables={expandedNodes[nodeKey].variables}/>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                )}
            </div>
            
            {/* Clear All Runs Modal */}
            <Dialog size="md" className="rounded-sm" open={showClearModal} onClose={() => setShowClearModal(false)}>
                <DialogTitle>Clear All Execution History</DialogTitle>
                <DialogDescription>
                    Are you sure you want to clear all execution history? This action cannot be undone.
                </DialogDescription>
                <DialogBody></DialogBody>
                <DialogActions>
                    <Button outline onClick={() => setShowClearModal(false)}>Cancel</Button>
                    <Button color="red" onClick={handleClearAllRuns}>Clear All</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default NodeOutput;