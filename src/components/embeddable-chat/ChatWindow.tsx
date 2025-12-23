import React, { useEffect, useCallback } from 'react';
import { useEmbeddedChatStore } from './stores/embeddedChatStore';
import { useEmbeddedWebSocket } from './hooks/useEmbeddedWebSocket';
import EmbeddedMessages from './components/EmbeddedMessages';
import EmbeddedPromptField from './components/EmbeddedPromptField';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export interface ChatWindowProps {
    /** The embed token for authentication */
    embedToken: string;

    /** Base API URL (defaults to window location origin) */
    apiUrl?: string;

    /** WebSocket URL (defaults to ws version of apiUrl) */
    websocketUrl?: string;

    /** Optional user ID for tracking */
    userId?: string;

    /** Additional CSS class names */
    className?: string;

    /** Theme: 'light' or 'dark' */
    theme?: 'light' | 'dark';

    /** Callback when chat is ready */
    onReady?: () => void;

    /** Callback on error */
    onError?: (error: Error) => void;

    /** Callback when message is sent */
    onMessageSent?: (message: string) => void;

    /** Callback when response is received */
    onResponseReceived?: (response: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    embedToken,
    apiUrl,
    websocketUrl,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId,
    className = '',
    theme = 'light',
    onReady,
    onError,
    onMessageSent,
    onResponseReceived,
}) => {
    const setConfig = useEmbeddedChatStore((s) => s.setConfig);
    const setVersionId = useEmbeddedChatStore((s) => s.setVersionId);
    const addMessage = useEmbeddedChatStore((s) => s.addMessage);
    const setWaitingForResponse = useEmbeddedChatStore((s) => s.setWaitingForResponse);
    const chatWindowName = useEmbeddedChatStore((s) => s.chatWindowName);
    const versionId = useEmbeddedChatStore((s) => s.versionId);
    const clearMessages = useEmbeddedChatStore((s) => s.clearMessages);
    const removePauseMessage = useEmbeddedChatStore((s) => s.removePauseMessage);

    // Determine URLs
    const baseApiUrl = apiUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const wsUrl = websocketUrl || baseApiUrl.replace(/^http/, 'ws');

    // Fetch config and version ID on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Fetch chat config
                const configResponse = await fetch(`${baseApiUrl}/api/v1/public/embedded/config/`, {
                    headers: {
                        'X-Embed-Token': embedToken,
                    },
                });

                if (!configResponse.ok) {
                    throw new Error(`Failed to fetch config: ${configResponse.statusText}`);
                }

                const config = await configResponse.json();
                setConfig({
                    chatWindowId: config.chat_window_id,
                    chatWindowName: config.chat_window_name,
                    sessionsEnabled: config.sessions_enabled,
                    sidebarVisible: config.sidebar_visible,
                });

                // Fetch version ID for WebSocket
                const versionResponse = await fetch(`${baseApiUrl}/api/v1/public/embedded/version-id/`, {
                    headers: {
                        'X-Embed-Token': embedToken,
                    },
                });

                if (!versionResponse.ok) {
                    throw new Error(`Failed to fetch version ID: ${versionResponse.statusText}`);
                }

                const versionData = await versionResponse.json();
                setVersionId(versionData.version_id);

                onReady?.();
            } catch (error) {
                console.error('[ChatWindow] Failed to initialize:', error);
                onError?.(error instanceof Error ? error : new Error(String(error)));
            }
        };

        fetchConfig();

        // Cleanup on unmount
        return () => {
            clearMessages();
        };
    }, [embedToken, baseApiUrl, setConfig, setVersionId, clearMessages, onReady, onError]);

    // WebSocket connection
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isConnected, connectionError, reconnect } = useEmbeddedWebSocket({
        versionId,
        embedToken,
        websocketUrl: wsUrl,
        onMessage: (data: unknown) => {
            // Handle response received callback
            if (typeof data === 'object' && data !== null) {
                const msg = data as { type?: string; content?: string };
                if (msg.type === 'chat_complete' && msg.content) {
                    onResponseReceived?.(msg.content);
                }
            }
        },
    });

    // Send message handler
    const handleSendMessage = useCallback(async (message: string) => {
        // Add user message to chat
        addMessage({
            id: `user-${Date.now()}`,
            sender: 'user',
            content: message,
            timestamp: new Date(),
        });

        setWaitingForResponse(true);
        onMessageSent?.(message);

        try {
            // Call execute endpoint
            const response = await fetch(`${baseApiUrl}/api/v1/public/embedded/execute/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Embed-Token': embedToken,
                },
                body: JSON.stringify({
                    message,
                    session_id: null, // TODO: Add session support
                }),
            });

            if (!response.ok) {
                throw new Error(`Execute failed: ${response.statusText}`);
            }

            // Response will come via WebSocket
        } catch (error) {
            console.error('[ChatWindow] Failed to send message:', error);
            setWaitingForResponse(false);
            addMessage({
                id: `error-${Date.now()}`,
                sender: 'system',
                content: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
            });
            onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    }, [baseApiUrl, embedToken, addMessage, setWaitingForResponse, onMessageSent, onError]);

    // Resume handler for HITL
    const handleResume = useCallback(async (runId: string, nodeId: string, response: string) => {
        // Add user response to chat
        addMessage({
            id: `user-${Date.now()}`,
            sender: 'user',
            content: response,
            timestamp: new Date(),
        });

        setWaitingForResponse(true);

        try {
            const resumeResponse = await fetch(`${baseApiUrl}/api/v1/public/embedded/resume/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Embed-Token': embedToken,
                },
                body: JSON.stringify({
                    session_id: null, // TODO: Add session support
                    execution_id: runId,
                    response,
                }),
            });

            if (!resumeResponse.ok) {
                throw new Error(`Resume failed: ${resumeResponse.statusText}`);
            }

            // Find and remove the pause message
            const messages = useEmbeddedChatStore.getState().messages;
            const pauseMessage = messages.find(
                (m) => m.pause_data?.run_id === runId && m.pause_data?.node_id === nodeId
            );
            if (pauseMessage) {
                removePauseMessage(pauseMessage.id);
            }
        } catch (error) {
            console.error('[ChatWindow] Failed to resume:', error);
            setWaitingForResponse(false);
            onError?.(error instanceof Error ? error : new Error(String(error)));
        }
    }, [baseApiUrl, embedToken, addMessage, setWaitingForResponse, removePauseMessage, onError]);

    const isDark = theme === 'dark';

    return (
        <div
            className={`flex flex-col h-full border rounded-lg overflow-hidden ${
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            } ${className}`}
        >
            {/* Header */}
            <div
                className={`flex items-center gap-2 px-4 py-3 border-b ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
            >
                <ChatBubbleLeftRightIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                <h2 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {chatWindowName || 'Chat'}
                </h2>
                <div className="ml-auto flex items-center gap-2">
                    <span
                        className={`w-2 h-2 rounded-full ${
                            isConnected ? 'bg-green-500' : connectionError ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                    />
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isConnected ? 'Connected' : connectionError ? 'Error' : 'Connecting...'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-hidden ${isDark ? 'dark' : ''}`}>
                <EmbeddedMessages onResume={handleResume} />
            </div>

            {/* Input */}
            <div className={isDark ? 'dark' : ''}>
                <EmbeddedPromptField onSend={handleSendMessage} />
            </div>
        </div>
    );
};

export default ChatWindow;
