import { useEffect, useRef, useCallback } from 'react';
import { useEmbeddedChatStore } from '../stores/embeddedChatStore';

interface UseEmbeddedWebSocketProps {
    versionId: string | null;
    embedToken: string;
    websocketUrl: string;
    onMessage?: (data: unknown) => void;
}

export function useEmbeddedWebSocket({
    versionId,
    embedToken,
    websocketUrl,
    onMessage,
}: UseEmbeddedWebSocketProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const setConnected = useEmbeddedChatStore((s) => s.setConnected);
    const setConnecting = useEmbeddedChatStore((s) => s.setConnecting);
    const setConnectionError = useEmbeddedChatStore((s) => s.setConnectionError);
    const updateStreamingMessage = useEmbeddedChatStore((s) => s.updateStreamingMessage);
    const finalizeStreamingMessage = useEmbeddedChatStore((s) => s.finalizeStreamingMessage);
    const setWaitingForResponse = useEmbeddedChatStore((s) => s.setWaitingForResponse);
    const addMessage = useEmbeddedChatStore((s) => s.addMessage);

    const connect = useCallback(() => {
        if (!versionId || !embedToken) return;

        setConnecting(true);

        const wsUrl = `${websocketUrl}/execution/${versionId}?embed_token=${embedToken}`;
        console.log('[EmbeddedChat] Connecting to WebSocket:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[EmbeddedChat] WebSocket connected');
            setConnected(true);
            setConnectionError(null);

            // Start ping interval
            pingIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, 30000);
        };

        ws.onmessage = (event) => {
            const data = event.data;

            // Handle pong
            if (data === 'pong') {
                return;
            }

            try {
                const parsed = JSON.parse(data);
                console.log('[EmbeddedChat] Received message:', parsed);

                // Handle different message types
                if (parsed.type === 'chat_stream') {
                    // Streaming token
                    const currentContent = useEmbeddedChatStore.getState().currentStreamingMessage;
                    updateStreamingMessage(currentContent + (parsed.content || ''));
                } else if (parsed.type === 'chat_complete') {
                    // Stream complete
                    finalizeStreamingMessage();
                } else if (parsed.type === 'execution_complete') {
                    // Execution finished
                    setWaitingForResponse(false);
                    finalizeStreamingMessage();
                } else if (parsed.type === 'pause') {
                    // HITL pause event
                    addMessage({
                        id: `pause-${Date.now()}`,
                        sender: 'system',
                        content: parsed.prompt || 'Waiting for your response...',
                        timestamp: new Date(),
                        pause_data: {
                            run_id: parsed.run_id,
                            node_id: parsed.node_id,
                            prompt: parsed.prompt,
                        },
                    });
                    setWaitingForResponse(false);
                } else if (parsed.type === 'error') {
                    addMessage({
                        id: `error-${Date.now()}`,
                        sender: 'system',
                        content: `Error: ${parsed.message || 'Unknown error'}`,
                        timestamp: new Date(),
                    });
                    setWaitingForResponse(false);
                }

                // Call custom message handler
                onMessage?.(parsed);
            } catch {
                // Not JSON, might be plain text
                console.log('[EmbeddedChat] Non-JSON message:', data);
            }
        };

        ws.onerror = (error) => {
            console.error('[EmbeddedChat] WebSocket error:', error);
            setConnectionError('Connection error');
        };

        ws.onclose = (event) => {
            console.log('[EmbeddedChat] WebSocket closed:', event.code, event.reason);
            setConnected(false);

            // Clear ping interval
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }

            // Reconnect after delay (unless intentionally closed)
            if (event.code !== 1000) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('[EmbeddedChat] Attempting reconnect...');
                    connect();
                }, 3000);
            }
        };
    }, [versionId, embedToken, websocketUrl, setConnected, setConnecting, setConnectionError, updateStreamingMessage, finalizeStreamingMessage, setWaitingForResponse, addMessage, onMessage]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close(1000);
            wsRef.current = null;
        }
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return {
        isConnected: useEmbeddedChatStore((s) => s.isConnected),
        isConnecting: useEmbeddedChatStore((s) => s.isConnecting),
        connectionError: useEmbeddedChatStore((s) => s.connectionError),
        reconnect: connect,
    };
}
