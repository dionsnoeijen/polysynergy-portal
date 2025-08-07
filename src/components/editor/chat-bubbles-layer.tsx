import React, { useMemo } from 'react';
import NodeChatBubble from '@/components/editor/nodes/node-chat-bubble';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import useChatStore from '@/stores/chatStore';
import { NodeVariableType } from '@/types/types';

const ChatBubblesLayer: React.FC = () => {
    const nodes = useNodesStore((state) => state.nodes);
    const zoomFactor = useEditorStore((state) => state.zoomFactor);
    const panPosition = useEditorStore((state) => state.panPosition);
    const runId = useChatStore((state) => state.activeRunId);
    const messagesByRun = useChatStore((state) => state.messagesByRun);

    // Memoize the filtered nodes to avoid infinite re-renders
    const nodesToRender = useMemo(() => {
        return nodes.filter(node => !node.view.collapsed && node.view.disabled !== true);
    }, [nodes]);

    // Memoize messages to avoid re-renders
    const messages = useMemo(() => {
        return runId ? messagesByRun[runId] || [] : [];
    }, [runId, messagesByRun]);

    // Find nodes that have avatar variables and have chat messages
    const nodesWithChatBubbles = useMemo(() => {
        if (!runId || messages.length === 0) return [];
        
        return nodesToRender.filter(node => {
            // Check if node has avatar variables
            const hasAvatarVariable = node.variables.some(variable => 
                variable.type === NodeVariableType.Avatar
            );
            
            // Check if there are messages for this node
            const hasMessages = messages.some(msg => 
                msg.sender === 'agent' && msg.node_id === node.id
            );
            
            return hasAvatarVariable && hasMessages;
        });
    }, [runId, messages, nodesToRender]);

    // Early returns after all hooks
    if (!runId || messages.length === 0 || nodesWithChatBubbles.length === 0) return null;

    return (
        <div 
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 10000 }}
        >
            {nodesWithChatBubbles.map(node => {
                // Calculate the transformed position of the node
                const transformedX = node.view.x * zoomFactor + panPosition.x;
                const transformedY = node.view.y * zoomFactor + panPosition.y;
                
                return (
                    <div
                        key={`chat-bubble-${node.id}`}
                        className="absolute pointer-events-auto"
                        style={{
                            left: transformedX,
                            top: transformedY,
                            transform: `scale(${zoomFactor})`,
                            transformOrigin: '0 0'
                        }}
                    >
                        <NodeChatBubble nodeId={node.id} />
                    </div>
                );
            })}
        </div>
    );
};

export default ChatBubblesLayer;