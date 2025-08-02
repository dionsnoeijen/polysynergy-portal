'use client';

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import useChatStore from '@/stores/chatStore';
import useNodesStore from '@/stores/nodesStore';
import { usePromptNodeDetection } from '@/hooks/editor/usePromptNodeDetection';

const EnhancedChat: React.FC = () => {
    const { promptNodes, chatWindowVisible, multipleChats } = usePromptNodeDetection();
    const messagesByRun = useChatStore((state) => state.messagesByRun);
    const addUserMessage = useChatStore((state) => state.addUserMessage);
    const updateNodeVariable = useNodesStore((state) => state.updateNodeVariable);

    const [input, setInput] = useState("");
    const [selectedPromptNodeId, setSelectedPromptNodeId] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Set default selected prompt node
    useEffect(() => {
        if (promptNodes.length > 0 && !selectedPromptNodeId) {
            setSelectedPromptNodeId(promptNodes[0].id);
        }
    }, [promptNodes, selectedPromptNodeId]);

    // Get messages for current run (keeping existing logic for now)
    const sortedRunIds = Object.entries(messagesByRun)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([runId]) => runId);
    const latestRunId = sortedRunIds[0];
    const messages = latestRunId ? messagesByRun[latestRunId] : [];

    const handleSend = () => {
        if (!input.trim()) return;
        if (!selectedPromptNodeId) return;

        // Set the prompt value on the selected prompt node
        updateNodeVariable(selectedPromptNodeId, "prompt", input);
        
        // Add to chat history (if we have an active run)
        if (latestRunId) {
            addUserMessage(input, latestRunId);
        }
        
        // TODO: Trigger execution of the flow
        // This would need to be implemented based on how execution is triggered
        
        setInput("");
    };

    const selectedPromptNode = promptNodes.find(node => node.id === selectedPromptNodeId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Show message if no prompt nodes
    if (!chatWindowVisible) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-lg font-medium mb-2">No prompt node found</div>
                    <div className="text-sm">
                        Add a PromptNode to enable chat functionality
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Tab headers for multiple prompt nodes */}
            {multipleChats && (
                <div className="border-b border-gray-200 dark:border-white/10">
                    <div className="flex">
                        {promptNodes.map((node) => (
                            <button
                                key={node.id}
                                onClick={() => setSelectedPromptNodeId(node.id)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    selectedPromptNodeId === node.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {node.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={msg.sender === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                        <div
                            className={`px-4 py-2 rounded-xl text-sm max-w-[70%] whitespace-pre-wrap ${
                                msg.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 dark:border-white/10 p-4">
                <div className="flex gap-2 max-w-3xl mx-auto items-end">
                    <textarea
                        className="flex-1 resize-none border rounded-lg p-2 min-h-[40px] max-h-[120px] text-sm dark:bg-neutral-900 dark:text-white"
                        rows={1}
                        value={input}
                        placeholder={`Prompt${selectedPromptNode ? ` for ${selectedPromptNode.name}` : ''}...`}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        className="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-full disabled:opacity-50"
                        onClick={handleSend}
                        disabled={!selectedPromptNodeId}
                    >
                        <ArrowUpIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnhancedChat;