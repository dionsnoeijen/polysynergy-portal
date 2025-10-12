// hooks/useSmartWebSocketListener.ts (jouw bestand)
import {useEffect, useState} from 'react';
import useNodesStore from "@/stores/nodesStore";
import useMockStore, {MockNode} from '@/stores/mockStore';
import {getConnectionExecutionDetails} from "@/api/executionApi";
import useEditorStore from "@/stores/editorStore";
import { useRunsStore } from "@/stores/runsStore";
import {websocketStatusStore} from '@/hooks/editor/useHandlePlay';
import globalWebSocketSingleton from '@/utils/GlobalWebSocketManager';
import {ConnectionStatus} from '@/utils/WebSocketManager';

// ⬇️ NIEUW
import useChatViewStore from '@/stores/chatViewStore';
import useInteractionStore, { InteractionEvent } from '@/stores/interactionStore';

type ExecutionMessage = {
    node_id?: string;
    event: 'run_start' | 'start_node' | 'end_node' | 'run_end' | "start_tool" | "end_tool" | "RunContent" | "TeamRunContent" | "TeamToolCallCompleted" | "resume_start" | "resume_end";
    status?: 'success' | 'killed' | 'error';
    order?: number;
    run_id?: string;
    content?: string;
    sequence_id?: number;
    microtime?: number;
    message_id?: string;
    // New member/main agent metadata
    agent_role?: "single" | "leader" | "member";
    is_member_agent?: boolean;
    parent_team_id?: string;
    member_index?: number;
};

const processedEvents = new Set<string>();

// Tool execution timing tracker
const toolExecutionTracker = new Map<string, { startTime: number; startEvent: unknown }>();

// Tool visualization tracker - ensures minimum display time
const toolVisualizationTracker = new Map<string, { timeoutId: NodeJS.Timeout | null; displayStartTime: number }>();

// Run-aware group execution state tracker: runId -> groupId -> state
const groupStatesByRun = new Map<string, Map<string, { count: number, remaining: number }>>();

// Run-aware node execution state tracker: runId -> nodeId -> state
const nodeExecutionStateByRun = new Map<string, Map<string, { started: boolean; ended: boolean; status?: string }>>();

// Run-aware pending animations tracker: runId -> nodeId -> timeout
const pendingAnimationsByRun = new Map<string, Map<string, NodeJS.Timeout>>();

// Track completed runs to prevent late execution classes
const completedRunIds = new Set<string>();

// Helper functions for run-aware state management
function getGroupStatesForRun(runId: string): Map<string, { count: number, remaining: number }> {
    if (!groupStatesByRun.has(runId)) {
        groupStatesByRun.set(runId, new Map());
    }
    return groupStatesByRun.get(runId)!;
}

function getNodeExecutionStateForRun(runId: string): Map<string, { started: boolean; ended: boolean; status?: string }> {
    if (!nodeExecutionStateByRun.has(runId)) {
        nodeExecutionStateByRun.set(runId, new Map());
    }
    return nodeExecutionStateByRun.get(runId)!;
}

function getPendingAnimationsForRun(runId: string): Map<string, NodeJS.Timeout> {
    if (!pendingAnimationsByRun.has(runId)) {
        pendingAnimationsByRun.set(runId, new Map());
    }
    return pendingAnimationsByRun.get(runId)!;
}

// Function to restore visual state when making a background run active
export function restoreVisualStateForRun(runId: string) {
    const nodeStates = nodeExecutionStateByRun.get(runId);
    const groupStates = groupStatesByRun.get(runId);
    
    if (!nodeStates) return;
    
    console.log(`🎯 [WebSocket] Restoring visual state for run: ${runId}`);
    
    // Clear all current visual states first
    document.querySelectorAll('.executing, .executed-success, .executed-error, .executed-killed').forEach(el => {
        el.classList.remove('executing', 'executed-success', 'executed-error', 'executed-killed');
    });
    
    // Restore node states
    for (const [nodeId, state] of nodeStates.entries()) {
        const el = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
        if (el) {
            if (state.started && !state.ended) {
                // Node is still executing
                el.classList.add('executing');
            } else if (state.ended && state.status) {
                // Node is completed
                el.classList.add(`executed-${state.status}`);
            }
        }
    }
    
    // Restore group states
    if (groupStates) {
        for (const [groupId, groupState] of groupStates.entries()) {
            const groupEl = document.querySelector(`[data-node-id="${groupId}"]`) as HTMLElement;
            if (groupEl) {
                if (groupState.remaining > 0) {
                    // Group is still executing
                    groupEl.classList.add('executing');
                } else {
                    // Group is completed - determine status from member nodes
                    const groupNodeStates = Array.from(nodeStates.values());
                    const hasErrors = groupNodeStates.some(state => state.status === 'error');
                    const hasKilled = groupNodeStates.some(state => state.status === 'killed');
                    
                    if (hasErrors) {
                        groupEl.classList.add('executed-error');
                    } else if (hasKilled) {
                        groupEl.classList.add('executed-killed');
                    } else {
                        groupEl.classList.add('executed-success');
                    }
                }
            }
        }
    }
}

// Function to cleanup state for completed runs
export function cleanupStateForRun(runId: string) {
    console.log(`🧹 [WebSocket] Cleaning up state for completed run: ${runId}`);

    // Clear pending animations for this run
    const pendingAnimations = pendingAnimationsByRun.get(runId);
    if (pendingAnimations) {
        for (const timeout of pendingAnimations.values()) {
            clearTimeout(timeout);
        }
        pendingAnimationsByRun.delete(runId);
    }

    // Clear group states for this run
    groupStatesByRun.delete(runId);

    // Clear node execution states for this run
    nodeExecutionStateByRun.delete(runId);

    console.log(`✅ [WebSocket] State cleaned up for run: ${runId}`);
}

// Function to cleanup all execution glow states
function cleanupExecutionGlow() {
    // ENHANCED: Clear all run-aware state trackers and pending animations
    processedEvents.clear();

    // Clear all pending animations for all runs
    for (const runAnimations of pendingAnimationsByRun.values()) {
        for (const timeout of runAnimations.values()) {
            clearTimeout(timeout);
        }
        runAnimations.clear();
    }
    pendingAnimationsByRun.clear();

    // Clear group states for all runs
    groupStatesByRun.clear();

    // Clear node execution states for all runs
    nodeExecutionStateByRun.clear();

    // Clear completed runs tracker
    completedRunIds.clear();

    // Clear tool execution and visualization trackers
    toolExecutionTracker.clear();
    for (const tracker of toolVisualizationTracker.values()) {
        if (tracker.timeoutId) {
            clearTimeout(tracker.timeoutId);
        }
    }
    toolVisualizationTracker.clear();

    console.log('🧹 [WebSocket] Cleared all run-aware execution state trackers and pending animations');

    // Clear visual classes from DOM elements
    const nodeEls = document.querySelectorAll('[data-node-id]');
    nodeEls.forEach((el) => {
        el.classList.remove(
            'executing',
            'executed-success',
            'executed-error',
            'executed-killed',
            'executed-provided'
        );
    });

    const groupEls = document.querySelectorAll('[data-group-id]');
    groupEls.forEach((el) => {
        el.classList.remove(
            'executing',
            'executed-success',
            'executed-error',
            'executed-killed',
            'executed-provided'
        );
    });
}

// Singleton message handler - only one instance processes messages regardless of how many times the hook is used
let globalMessageHandler: ((event: MessageEvent) => Promise<void>) | null = null;
let handlerRefCount = 0;

function getOrCreateMessageHandler() {
    if (globalMessageHandler) {
        handlerRefCount++;
        console.log(`📡 [WebSocket Singleton] Reusing message handler (subscribers: ${handlerRefCount})`);
        return globalMessageHandler;
    }

    console.log(`📡 [WebSocket Singleton] Creating message handler (first subscriber)`);
    handlerRefCount = 1;

    globalMessageHandler = async (event: MessageEvent) => {
            const data = typeof event.data === 'string' ? event.data.trim() : '';
            if (!data || (data[0] !== '{' && data[0] !== '[')) return;

            let message: ExecutionMessage;
            try {
                message = JSON.parse(data);
            } catch {
                return;
            }
            const editorStore = useEditorStore.getState();
            const nodesStore = useNodesStore.getState();
            const mockStore = useMockStore.getState();

            // ⬇️ chat-view store ophalen
            const chatView = useChatViewStore.getState();

            // ⬇️ interaction store ophalen
            const interactionStore = useInteractionStore.getState();

            // ---- INTERACTION EVENTS ----
            // Handle interaction events (e.g. OAuth authorization required)
            if ('interaction_type' in message && (message as unknown as { type: string }).type === 'interaction_event') {
                const interactionEvent = message as unknown as InteractionEvent;
                console.log('🔑 [WebSocket] Received interaction event:', interactionEvent.interaction_type, 'for node:', interactionEvent.node_id);

                // Handle OAuth authorization required
                if (interactionEvent.interaction_type === 'oauth_authorization_required') {
                    console.log('🔑 [WebSocket] OAuth authorization required:', interactionEvent.data);
                    interactionStore.openOAuthPopup(interactionEvent);
                }

                return; // Early return for interaction events
            }

            const eventType = message.event;
            const node_id = message.node_id;

            // Special debug for run_start event
            if (eventType === 'run_start') {
                console.log('🚀 [DEBUG] RUN_START event received:', {
                    run_id: message.run_id,
                    timestamp: new Date().toISOString()
                });
            }

            // ---- STREAM CONTENT ----
            if ((eventType === "RunContent" || eventType === "TeamRunContent")
                && message.content) {
                const sessionId = chatView.getActiveSessionId();
                if (sessionId && message.content) {
                    const tsMs =
                        typeof message.microtime === "number" ? Math.round(message.microtime * 1000) : Date.now();

                    // Smart streaming: Route based on agent role
                    if (message.is_member_agent === true) {
                        // Member agent responses -> Now to BOTH node bubbles AND main chat
                        console.log(`[Smart Streaming] Member agent response routed to both bubble and chat: ${message.node_id}`);

                        // Update team member activity status
                        if (message.parent_team_id && message.node_id) {
                            // Get the actual member name from the team node configuration
                            // const teamNode = nodesStore.nodes.find(n => n.id === message.parent_team_id);
                            const memberNode = nodesStore.nodes.find(n => n.id === message.node_id);

                            let memberName = `Member ${(message.member_index || 0) + 1}`;

                            if (memberNode) {
                                // Use the node's handle or name variable if available
                                const nameVar = memberNode.variables?.find(v => v.handle === 'name');
                                const displayName = nameVar?.value ? String(nameVar.value) : memberNode.handle;
                                memberName = displayName || memberNode.handle || memberName;
                            }

                            chatView.setTeamMemberActive(message.node_id, memberName, message.member_index);
                        }

                        // Member agents: Update BOTH bubbles AND main chat (for collapsible display)
                        chatView.appendAgentChunkBubbleOnly(
                            sessionId,
                            message.node_id,
                            message.content,
                            tsMs,
                            message.sequence_id,
                            message.run_id ?? null
                        );

                        // ALSO append to main chat for the collapsible team response view
                        chatView.appendAgentChunk(
                            sessionId,
                            message.node_id,
                            message.content,
                            tsMs,
                            message.sequence_id,
                            message.run_id ?? null,
                            true, // isTeamMember
                            message.parent_team_id, // parentTeamId
                            message.member_index // memberIndex
                        );
                    } else {
                        // Main agent (single/leader) responses -> Stream to main chat window
                        chatView.appendAgentChunk(
                            sessionId,
                            message.node_id,
                            message.content,
                            tsMs,
                            message.sequence_id,
                            message.run_id ?? null
                        );
                    }
                }
            }

            // ---- RUN START ----
            if (eventType === 'run_start') {
                console.log('🚀 [WebSocket] Received run_start event for run_id:', message.run_id);

                // Update runs store - this might be from a different source than useHandlePlay
                const runsStore = useRunsStore.getState();
                const existingRun = runsStore.runs.find(r => r.run_id === message.run_id);
                if (!existingRun) {
                    runsStore.addNewRun({
                        run_id: message.run_id!,
                        timestamp: new Date().toISOString(),
                        status: 'running',
                        startTime: Date.now(),
                        lastEventTime: Date.now()
                    });
                }

                // Auto-start log polling for fire-and-forget executions
                console.log('📊 [WebSocket] Auto-starting log polling for run_start');
                window.dispatchEvent(new CustomEvent('restart-log-polling'));

                // Also switch to output tab to show logs
                window.dispatchEvent(new CustomEvent('switch-to-output-tab'));

                // Don't return here - continue processing other events
                console.log('🔍 [DEBUG] run_start processed, continuing with other event processing...');
            }

            // ---- TOOLS UI ----
            if (eventType === 'start_tool') {
                console.log('🔧 [TOOL DEBUG] start_tool event received:', {
                    node_id,
                    run_id: message.run_id,
                    message
                });

                const startTime = performance.now();
                const trackingKey = `${node_id}-${message.run_id}`;

                // Check if we already have a visualization running for this tool
                const existingViz = toolVisualizationTracker.get(trackingKey);
                if (existingViz) {
                    console.log('🔧 [TOOL DEBUG] Already have visualization for this tool, skipping');
                    return;
                }

                // Store start time for duration calculation
                toolExecutionTracker.set(trackingKey, {
                    startTime,
                    startEvent: message
                });

                const element = document.querySelector(`[data-node-id="${node_id}"]`);
                console.log('🔧 [TOOL DEBUG] DOM element lookup:', {
                    node_id,
                    found: !!element,
                    classList: element?.classList.toString()
                });

                if (element) {
                    element.classList.add('executing-tool');
                    console.log('🔧 [TOOL DEBUG] Added executing-tool class, new classList:', element.classList.toString());

                    // Store visualization info for minimum display time
                    toolVisualizationTracker.set(trackingKey, {
                        timeoutId: null, // Will be set when end_tool arrives
                        displayStartTime: performance.now()
                    });
                } else {
                    console.warn('⚠️ [TOOL DEBUG] Element not found for node_id:', node_id);
                }
                return;
            }
            
            if (eventType === 'end_tool') {
                console.log('🔧 [TOOL DEBUG] end_tool event received:', {
                    node_id,
                    run_id: message.run_id,
                    message
                });

                const endTime = performance.now();
                const trackingKey = `${node_id}-${message.run_id}`;
                const startData = toolExecutionTracker.get(trackingKey);
                const vizData = toolVisualizationTracker.get(trackingKey);

                console.log('🔧 [TOOL DEBUG] Tracker data:', {
                    trackingKey,
                    hasStartData: !!startData,
                    hasVizData: !!vizData
                });

                let duration = 'unknown';
                if (startData) {
                    const durationMs = endTime - startData.startTime;
                    duration = `${durationMs.toFixed(2)}ms`;
                    toolExecutionTracker.delete(trackingKey);
                }

                // Show warning if tool executed too quickly
                if (startData && (endTime - startData.startTime) < 50) {
                    console.warn('⚡ VERY FAST TOOL EXECUTION - Duration:', duration);
                }

                // Handle visualization with minimum display time
                if (vizData) {
                    const MINIMUM_DISPLAY_TIME = 2000; // 2 seconds minimum
                    const displayTimeElapsed = endTime - vizData.displayStartTime;
                    const remainingDisplayTime = Math.max(0, MINIMUM_DISPLAY_TIME - displayTimeElapsed);

                    const cleanup = () => {
                        const element = document.querySelector(`[data-node-id="${node_id}"]`);
                        if (element) {
                            element.classList.remove('executing-tool');
                        }
                        toolVisualizationTracker.delete(trackingKey);
                    };

                    if (remainingDisplayTime > 0) {
                        // Need to wait more to reach minimum display time
                        const timeoutId = setTimeout(cleanup, remainingDisplayTime);
                        toolVisualizationTracker.set(trackingKey, {
                            ...vizData,
                            timeoutId
                        });
                    } else {
                        // Already displayed long enough, cleanup immediately
                        cleanup();
                    }
                } else {
                    console.warn('⚠️ END_TOOL received without corresponding START_TOOL visualization');
                }
                return;
            }

            // ---- RESUME START ----
            if (eventType === 'resume_start') {
                console.log('⏸️ [WebSocket] Received resume_start event for run_id:', message.run_id);
                console.log('⏸️ [WebSocket] Flow paused - waiting for human input');
                // TODO: Add visual feedback for paused state if needed
                return;
            }

            // ---- RESUME END ----
            if (eventType === 'resume_end') {
                console.log('▶️ [WebSocket] Received resume_end event for run_id:', message.run_id);
                console.log('▶️ [WebSocket] Flow resumed - refreshing connections and nodes state');

                // Refresh connections and node state after resume (similar to run_end but without cleanup)
                setTimeout(async () => {
                    const activeVersionId = editorStore.activeVersionId as string;

                    try {
                        // Refresh connection execution details
                        const data = await getConnectionExecutionDetails(activeVersionId, message.run_id as string);
                        mockStore.setMockConnections(data);
                        mockStore.setHasMockData(true);
                        console.log('✅ [WebSocket] Connections refreshed after resume');

                        // Refresh node execution details for currently executing nodes
                        const mockNodes = mockStore.getMockNodesForRun(message.run_id!);
                        if (mockNodes.length > 0) {
                            // Find the node with highest order (last executed before resume)
                            const lastNode = mockNodes.reduce((prev, curr) =>
                                curr.order > prev.order ? curr : prev
                            );

                            // Import getNodeExecutionDetails dynamically
                            const { getNodeExecutionDetails } = await import('@/api/executionApi');

                            // Get the original node ID (without order suffix)
                            const originalNodeId = lastNode.id.replace(/-\d+$/, '');

                            try {
                                const executeResult = await getNodeExecutionDetails(
                                    activeVersionId,
                                    message.run_id!,
                                    originalNodeId,
                                    lastNode.order,
                                    'mock',
                                    'mock'
                                );

                                // Update mock result for the node
                                mockStore.setMockResultForNode(originalNodeId, executeResult);
                                console.log('✅ [WebSocket] Node execution details refreshed after resume:', originalNodeId);

                                // Update real node variables with execution results (for image nodes)
                                if (executeResult && executeResult.variables) {
                                    const node = nodesStore.nodes.find(n => n.id === originalNodeId);
                                    if (node) {
                                        const { getUpdatableVariableHandles } = await import('@/utils/imageNodeUtils');
                                        const updatableHandles = getUpdatableVariableHandles(node, executeResult.variables);

                                        for (const variableHandle of updatableHandles) {
                                            const variableValue = executeResult.variables[variableHandle];
                                            nodesStore.updateNodeVariable(originalNodeId, variableHandle, variableValue);
                                            console.log('🖼️ [WebSocket] Updated variable after resume:', originalNodeId, variableHandle);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('[WebSocket] Failed to refresh node execution details after resume:', error);
                            }
                        }
                    } catch (error) {
                        console.error('[WebSocket] Failed to refresh connections after resume:', error);
                    }
                }, 100);

                return;
            }

            // ---- RUN END ----
            if (eventType === 'run_end') {
                console.log('🏁 [WebSocket] Received run_end event for run_id:', message.run_id);
                
                // Mark this run as completed to prevent late execution classes
                if (message.run_id) {
                    completedRunIds.add(message.run_id);
                    console.log(`🔒 [WebSocket] Marked run ${message.run_id} as completed - no more execution classes will be added`);
                }
                
                // Clear ALL executed status classes when run ends
                const elementsToClean = document.querySelectorAll('.executed-success, .executed-error, .executed-killed, .executing');
                console.log(`🧹 [WebSocket] Found ${elementsToClean.length} elements with execution status to clear`);
                elementsToClean.forEach(el => {
                    const nodeId = el.getAttribute('data-node-id');
                    console.log(`  - Clearing execution classes from node: ${nodeId}`);
                    el.classList.remove('executed-success', 'executed-error', 'executed-killed', 'executing');
                });
                console.log('✅ [WebSocket] Cleared all execution status classes at run_end');
                
                // NEVER clear mock data at run_end - this removes run output from NodeOutput panel
                // The purple glow issue will need to be fixed elsewhere
                console.log(`📋 [WebSocket] Preserving ALL mock data for run: ${message.run_id}`);
                
                
                const sessionId = chatView.getActiveSessionId();
                if (sessionId) {
                    chatView.finalizeAgentMessage(sessionId);

                    // Clear team member activity when run ends
                    chatView.clearTeamMembers();

                    // Safety fallback: clear waiting state if still active (edge case: no agent response)
                    chatView.setWaitingForResponse(false);
                    
                    // Sync with backend to get correct run_id after streaming completes
                    try {
                        const selectedPromptNodeId = nodesStore.selectedPromptNodeId;
                        const activeProjectId = editorStore.activeProjectId;
                        
                        if (selectedPromptNodeId && activeProjectId) {
                            const context = nodesStore.getLiveContextForPrompt(selectedPromptNodeId);
                            if (context.hasMemory && context.storageNow && context.sid) {
                                console.log('[sync] Syncing session after streaming completion...');
                                await chatView.syncSessionFromBackend({
                                    projectId: activeProjectId,
                                    storageConfig: context.storageNow as {type: "LocalAgentStorage" | "DynamoDBAgentStorage" | "LocalDb" | "DynamoDb"},
                                    sessionId: context.sid,
                                    userId: context.uid as string | undefined,
                                    limit: 200,
                                });
                                console.log('[sync] Session sync completed with correct run_ids');
                            }
                        }
                    } catch (e) {
                        console.warn('[sync] Failed to sync session after streaming:', e);
                    }
                }

                setTimeout(async () => {
                    // Clear only the processed events set
                    processedEvents.clear();

                    // Clear editor execution lock state for fire-and-forget executions
                    // Only unlock if this run_end matches the currently active run_id
                    const runsStore = useRunsStore.getState();
                    const currentActiveRunId = runsStore.activeRunId;
                    if (currentActiveRunId === message.run_id) {
                        console.log('🔓 Editor unlocked for completed run_id:', message.run_id);
                        editorStore.setIsExecuting(null);
                        runsStore.setActiveRunId(null);
                        
                        // Update run status to completed
                        runsStore.updateRunFromWebSocket(message.run_id!, {
                            status: 'success',
                            duration: Date.now() - (runsStore.runs.find(r => r.run_id === message.run_id)?.startTime || Date.now())
                        });
                    } else {
                        console.log('⏸️ Ignoring run_end for different run_id:', message.run_id, 'vs active:', currentActiveRunId);
                        
                        // Still update background run status to completed
                        runsStore.updateRunFromWebSocket(message.run_id!, {
                            status: 'success',
                            duration: Date.now() - (runsStore.runs.find(r => r.run_id === message.run_id)?.startTime || Date.now())
                        });
                    }

                    const activeVersionId = editorStore.activeVersionId as string;
                    const data = await getConnectionExecutionDetails(activeVersionId, message.run_id as string);
                    mockStore.setMockConnections(data);
                    mockStore.setHasMockData(true);

                    // Fetch results for the last executed node (for play button executions)
                    const mockNodes = mockStore.getMockNodesForRun(message.run_id!);
                    if (mockNodes.length > 0) {
                        // Find the node with highest order (last executed)
                        const lastNode = mockNodes.reduce((prev, curr) =>
                            curr.order > prev.order ? curr : prev
                        );

                        // Import getNodeExecutionDetails dynamically to avoid circular dependency
                        const { getNodeExecutionDetails } = await import('@/api/executionApi');

                        // Get the original node ID (without order suffix)
                        const originalNodeId = lastNode.id.replace(/-\d+$/, '');

                        try {
                            const executeResult = await getNodeExecutionDetails(
                                activeVersionId,
                                message.run_id!,
                                originalNodeId,
                                lastNode.order,
                                'mock',
                                'mock' // Default to mock substage, could be enhanced
                            );

                            // Store the result for the last executed node
                            mockStore.setMockResultForNode(originalNodeId, executeResult);
                            console.log('💾 [WebSocket] Stored execution result for last node:', originalNodeId);

                            // ALSO update the real node variables with execution results (only for image nodes/variables)
                            if (executeResult && executeResult.variables) {
                                const node = nodesStore.nodes.find(n => n.id === originalNodeId);
                                if (node) {
                                    // Use imageNodeUtils to determine which variables should be updated
                                    const { getUpdatableVariableHandles } = await import('@/utils/imageNodeUtils');
                                    const updatableHandles = getUpdatableVariableHandles(node, executeResult.variables);

                                    for (const variableHandle of updatableHandles) {
                                        const variableValue = executeResult.variables[variableHandle];
                                        // Update the real node variable so it shows in the UI
                                        nodesStore.updateNodeVariable(originalNodeId, variableHandle, variableValue);
                                        console.log('🖼️ [WebSocket] Updated image variable:', originalNodeId, variableHandle, typeof variableValue === 'object' ? '[Object]' : variableValue);
                                    }
                                }
                            }

                            // Also store for play button nodes if this was initiated by one
                            const playNodes = nodesStore.nodes.filter(n => n.has_play_button);
                            for (const playNode of playNodes) {
                                // Store result for all play nodes (they can access the last node's result)
                                mockStore.setMockResultForNode(playNode.id, executeResult);
                                console.log('💾 [WebSocket] Stored execution result for play node:', playNode.id);
                            }
                        } catch (error) {
                            console.error('[WebSocket] Failed to fetch node execution details:', error);
                        }
                    }
                }, 100);
                return;
            }

            // ---- FILTER INVALID EVENTS ----
            // Skip events with undefined status or order (spurious events)
            if ((eventType === 'end_node' && !message.status) || message.order === undefined) {
                return;
            }

            // ---- NODE GLOW / MOCK ----
            if (!node_id || !message.run_id) return;

            const isViewingHistoricalRun = editorStore.isViewingHistoricalRun;
            const selectedRunId = editorStore.selectedRunId;
            const runsStore = useRunsStore.getState();
            const currentActiveRunId = runsStore.activeRunId;
            
            // For visual node updates: Show for active run, but NOT for backgrounded runs
            const isBackgroundedRun = runsStore.backgroundedRunIds.has(message.run_id);
            // const forActiveRunOnly = !isViewingHistoricalRun && message.run_id === currentActiveRunId;
            const forVisualUpdates = !isViewingHistoricalRun && !isBackgroundedRun;

            // For mock store updates (runs panel): Update for active run or selected historical run
            const forCurrentView = !isViewingHistoricalRun && (!selectedRunId || message.run_id === selectedRunId || message.run_id === currentActiveRunId);

            const el = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement | null;
            const nodeFlowNode = nodesStore.getNode(node_id);
            const type = typeof nodeFlowNode?.path === 'undefined' ? 'GroupNode' : nodeFlowNode?.path.split(".").pop();

            if (eventType === 'start_node' || eventType === 'end_node') {
                // Create unique event ID to prevent processing duplicates
                const eventId = `${eventType}-${node_id}-${message.run_id}-${message.order}`;
                if (processedEvents.has(eventId)) {
                    return;
                }
                processedEvents.add(eventId);

                // Always update runs store with execution progress (for all runs)
                runsStore.updateRunFromWebSocket(message.run_id, {
                    lastEventTime: Date.now(),
                    nodeId: node_id,
                    nodeName: nodeFlowNode?.handle || `Node ${message.order}`
                });

                // Always update mock store for runs panel (for all runs)
                if (forCurrentView) {
                    const mockNodeData = {
                        id: `${node_id}-${message.order || 0}`,
                        handle: nodeFlowNode?.handle,
                        runId: message.run_id,
                        killed: message.status === 'killed',
                        type,
                        started: eventType === 'start_node',
                        variables: {},
                        status: eventType === 'start_node' ? 'executing' : (message.status || 'killed'),
                    } as MockNode;

                    console.log('🔍 [DEBUG] Adding mock node to store:', mockNodeData);
                    mockStore.addOrUpdateMockNode(mockNodeData);
                } else {
                    console.log('🔍 [DEBUG] Skipping mock store update - forCurrentView is false');
                }
            }

            // ENHANCED: Run-aware visual feedback - always track state, only show visuals for active run
            if (el && message.run_id) {
                const runId = message.run_id;
                const nodeStates = getNodeExecutionStateForRun(runId);
                const groupStates = getGroupStatesForRun(runId);
                const nodeState = nodeStates.get(node_id) || { started: false, ended: false };

                if (eventType === 'start_node') {
                    nodeState.started = true;
                    nodeState.ended = false;
                    nodeStates.set(node_id, nodeState);

                    // Handle group execution states (always track, regardless of active run)
                    const groupNodeId = nodesStore.isNodeInGroup(node_id);
                    if (groupNodeId) {
                        let groupState = groupStates.get(groupNodeId);
                        if (!groupState) {
                            const groupNodesInRun = mockStore.getMockNodesForRun(runId).filter(mockNode => {
                                const originalNodeId = mockNode.id.replace(/-\d+$/, '');
                                return nodesStore.isNodeInGroup(originalNodeId) === groupNodeId;
                            });
                            groupState = { count: groupNodesInRun.length, remaining: groupNodesInRun.length };
                            groupStates.set(groupNodeId, groupState);
                            console.log(`🏷️ [WebSocket] Created group state for ${groupNodeId}: ${groupState.count} nodes`);
                        }

                        // Apply visual classes for non-backgrounded runs
                        if (forVisualUpdates) {
                            const groupEl = document.querySelector(`[data-node-id="${groupNodeId}"]`);
                            if (groupEl && !groupEl.classList.contains('executing')) {
                                groupEl.classList.add('executing');
                            }
                        }
                    }

                    // Apply visual classes for non-backgrounded runs
                    // But only if node is NOT in a group (let groups handle their own status)
                    const nodeGroupId = nodesStore.isNodeInGroup(node_id);
                    if (forVisualUpdates && !nodeGroupId) {
                        el.classList.add('executing');
                        el.classList.remove('executed-success', 'executed-error', 'executed-killed');
                    }
                }

                if (eventType === 'end_node') {
                    nodeState.ended = true;
                    nodeState.status = message.status;
                    nodeStates.set(node_id, nodeState);

                    // Skip execution classes if run has already ended
                    if (message.run_id && completedRunIds.has(message.run_id)) {
                        console.log(`⏰ [WebSocket] Skipping end_node execution classes for node ${node_id} - run ${message.run_id} already completed`);
                        return;
                    }

                    // Handle animations for non-backgrounded runs
                    if (forVisualUpdates) {
                        const pendingAnimations = getPendingAnimationsForRun(runId);
                        
                        // Clear any pending animation for this node
                        const pendingTimeout = pendingAnimations.get(node_id);
                        if (pendingTimeout) {
                            clearTimeout(pendingTimeout);
                            pendingAnimations.delete(node_id);
                        }

                        // Schedule end animation with minimum display time
                        const animationTimeout = setTimeout(() => {
                            // Skip execution classes if run has already ended
                            if (message.run_id && completedRunIds.has(message.run_id)) {
                                console.log(`⏰ [WebSocket] Skipping delayed execution classes for node ${node_id} - run ${message.run_id} already completed`);
                                pendingAnimations.delete(node_id);
                                return;
                            }

                            const currentEl = document.querySelector(`[data-node-id="${node_id}"]`) as HTMLElement;
                            const nodeGroupId = nodesStore.isNodeInGroup(node_id);
                            
                            // Only apply execution status to nodes NOT in groups (groups handle their own status)
                            if (currentEl && !nodeGroupId) {
                                console.log(`🔄 [WebSocket] Removing executing class for node: ${node_id}, status: ${message.status}`);
                                currentEl.classList.remove('executing');
                                if (message.status) {
                                    currentEl.classList.add(`executed-${message.status}`);
                                }
                            } else if (!currentEl) {
                                console.warn(`⚠️ [WebSocket] Element not found for node cleanup: ${node_id}`);
                            } else {
                                console.log(`🏷️ [WebSocket] Skipping individual node status for ${node_id} - in group ${nodeGroupId}`);
                            }

                            // Handle group state completion - bubble to outer-most group
                            let groupNodeId = nodesStore.isNodeInGroup(node_id);
                            // Find the outer-most group (for nested groups)
                            while (groupNodeId) {
                                const parentGroupId = nodesStore.isNodeInGroup(groupNodeId);
                                if (parentGroupId) {
                                    groupNodeId = parentGroupId;
                                } else {
                                    break;
                                }
                            }
                            
                            if (groupNodeId) {
                                const groupState = groupStates.get(groupNodeId);
                                if (groupState) {
                                    groupState.remaining--;
                                    console.log(`🏷️ [WebSocket] Group ${groupNodeId}: node ${node_id} completed, remaining: ${groupState.remaining}/${groupState.count}`);
                                    if (groupState.remaining <= 0) {
                                        const groupEl = document.querySelector(`[data-node-id="${groupNodeId}"]`);
                                        if (groupEl) {
                                            groupEl.classList.remove('executing');
                                            // Apply group status based on member results
                                            const hasErrors = Array.from(nodeStates.values()).some(state => state.status === 'error');
                                            const hasKilled = Array.from(nodeStates.values()).some(state => state.status === 'killed');
                                            
                                            if (hasErrors) {
                                                groupEl.classList.add('executed-error');
                                            } else if (hasKilled) {
                                                groupEl.classList.add('executed-killed');
                                            } else {
                                                groupEl.classList.add('executed-success');
                                            }
                                        }
                                        console.log(`🏷️ [WebSocket] Group ${groupNodeId} completed - deleting state`);
                                        groupStates.delete(groupNodeId);
                                    }
                                }
                            }

                            pendingAnimations.delete(node_id);
                        }, 500); // Minimum 500ms display time

                        pendingAnimations.set(node_id, animationTimeout);
                    }
                }
            }

            // Fallback: Handle cases where direct node element not found but group exists
            // Apply visuals for non-backgrounded runs, but still track state for all runs
            if (forVisualUpdates && !el && message.run_id) {
                const groupNodeId = nodesStore.isNodeInGroup(node_id);
                if (groupNodeId) {
                    const groupEl = document.querySelector(`[data-node-id="${groupNodeId}"]`) as HTMLElement;
                    if (groupEl) {
                        if (eventType === 'start_node') {
                            groupEl.classList.add('executing');
                        } else if (eventType === 'end_node') {
                            // Skip execution classes if run has already ended
                            if (message.run_id && completedRunIds.has(message.run_id)) {
                                console.log(`⏰ [WebSocket] Skipping group end_node execution classes for node ${node_id} - run ${message.run_id} already completed`);
                                return;
                            }
                            setTimeout(() => {
                                groupEl.classList.remove('executing');
                                if (message.status) {
                                    groupEl.classList.add(`executed-${message.status}`);
                                }
                            }, 500);
                        }
                    }
                }
            }
        };

    return globalMessageHandler;
}

function releaseMessageHandler() {
    handlerRefCount--;
    console.log(`📡 [WebSocket Singleton] Releasing message handler (subscribers: ${handlerRefCount})`);

    if (handlerRefCount <= 0) {
        console.log(`📡 [WebSocket Singleton] Destroying message handler (last subscriber unsubscribed)`);
        globalMessageHandler = null;
        handlerRefCount = 0;
    }
}

export function useSmartWebSocketListener(flowId: string) {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!flowId) return;

        const handleWebSocketMessage = getOrCreateMessageHandler();

        const unsubscribe = globalWebSocketSingleton.subscribe(
            flowId,
            (status, connected) => {
                setConnectionStatus(status);
                setIsConnected(connected);
            },
            handleWebSocketMessage
        );

        return () => {
            unsubscribe();
            releaseMessageHandler();
        };
    }, [flowId]);

    useEffect(() => {
        websocketStatusStore.updateStatus(isConnected, connectionStatus);
    }, [isConnected, connectionStatus]);

    useEffect(() => {
        if (!flowId) return;
        cleanupExecutionGlow();
        return cleanupExecutionGlow;
    }, [flowId]);

    return {connectionStatus, isConnected};
}