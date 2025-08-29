import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager, ConnectionStatus, WebSocketManagerConfig } from '@/utils/WebSocketManager';

export interface UseSmartWebSocketOptions extends WebSocketManagerConfig {
  enabled?: boolean;
  autoConnect?: boolean;
}

export function useSmartWebSocket(
  url: string, 
  options: UseSmartWebSocketOptions = {}
) {
  const { enabled = true, autoConnect = true, ...managerConfig } = options;
  const managerRef = useRef<WebSocketManager | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const messageHandlersRef = useRef<Set<(event: MessageEvent) => void>>(new Set());

  // Initialize WebSocket manager
  useEffect(() => {
    if (!enabled || !url) {
      console.log('🔌 WEBSOCKET MANAGER: Not initializing', { enabled, url });
      return;
    }

    console.log('🔌 WEBSOCKET MANAGER: Initializing with URL:', url);
    managerRef.current = new WebSocketManager(url, {
      debug: true, // FORCE debug logging to see connection issues
      ...managerConfig
    });

    console.log('🔌 WEBSOCKET MANAGER: Created, subscribing to status changes');

    // Subscribe to status changes
    const unsubscribeStatus = managerRef.current.onStatusChange((status) => {
      console.log('🔌 WEBSOCKET MANAGER: Status changed to:', status);
      setConnectionStatus(status);
    });

    // Subscribe to messages and forward to registered handlers
    const unsubscribeMessage = managerRef.current.onMessage((event) => {
      messageHandlersRef.current.forEach(handler => handler(event));
    });

    // Auto-connect if enabled
    if (autoConnect) {
      console.log('🔌 WEBSOCKET MANAGER: Auto-connecting...');
      managerRef.current.connect();
    } else {
      console.log('🔌 WEBSOCKET MANAGER: Auto-connect disabled');
    }

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [url, enabled, autoConnect, JSON.stringify(managerConfig)]);

  // Connect function
  const connect = useCallback(() => {
    managerRef.current?.connect();
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  // Send message function
  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    managerRef.current?.send(data);
  }, []);

  // Add message handler
  const onMessage = useCallback((handler: (event: MessageEvent) => void) => {
    messageHandlersRef.current.add(handler);
    
    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Status helpers
  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting';
  const isDisconnected = connectionStatus === 'disconnected' || connectionStatus === 'failed';

  return {
    connectionStatus,
    isConnected,
    isConnecting,
    isDisconnected,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    manager: managerRef.current
  };
}