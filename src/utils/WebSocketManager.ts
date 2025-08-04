export interface WebSocketManagerConfig {
  heartbeatInterval?: number;
  pingTimeout?: number;
  maxReconnectAttempts?: number;
  maxBackoffDelay?: number;
  debug?: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private config: Required<WebSocketManagerConfig>;
  private pingInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: ((event: MessageEvent) => void)[] = [];
  private statusHandlers: ((status: ConnectionStatus) => void)[] = [];
  private shouldReconnect = true;
  private isManualClose = false;

  constructor(url: string, config: WebSocketManagerConfig = {}) {
    this.url = url;
    this.config = {
      heartbeatInterval: config.heartbeatInterval ?? 30000, // 30 seconds
      pingTimeout: config.pingTimeout ?? 5000, // 5 seconds
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      maxBackoffDelay: config.maxBackoffDelay ?? 30000, // 30 seconds
      debug: config.debug ?? false
    };

    // Listen for page visibility changes
    this.setupPageVisibilityListener();
    // Listen for network changes
    this.setupNetworkListener();
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('WebSocket already connected');
      return;
    }

    this.isManualClose = false;
    this.setStatus('connecting');
    this.log(`🔌 Connecting to ${this.url}`);

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.log('🔌 WebSocket connected');
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      if (event.data === 'pong') {
        this.log('💓 Pong received');
        this.resetPingTimeout();
      } else {
        // Forward actual messages to handlers
        this.messageHandlers.forEach(handler => handler(event));
      }
    };

    this.ws.onclose = (event) => {
      this.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
      this.stopHeartbeat();
      
      if (!this.isManualClose && this.shouldReconnect) {
        this.setStatus('reconnecting');
        this.scheduleReconnect();
      } else {
        this.setStatus('disconnected');
      }
    };

    this.ws.onerror = (error) => {
      this.log('❌ WebSocket error:', error);
    };
  }

  disconnect(): void {
    this.log('🔌 Manual disconnect');
    this.isManualClose = true;
    this.shouldReconnect = false;
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.setStatus('disconnected');
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.log('❌ Cannot send message: WebSocket not connected');
    }
  }

  onMessage(handler: (event: MessageEvent) => void): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach(handler => handler(status));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('💓 Sending ping');
        this.ws.send('ping');
        
        // Set timeout for pong response
        this.pingTimeout = setTimeout(() => {
          this.log('❌ Ping timeout - connection appears dead');
          this.ws?.close(4000, 'Ping timeout');
        }, this.config.pingTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.resetPingTimeout();
  }

  private resetPingTimeout(): void {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('❌ Max reconnection attempts reached');
      this.setStatus('failed');
      return;
    }

    // Exponential backoff with jitter
    const baseDelay = Math.pow(2, this.reconnectAttempts) * 1000;
    const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
    const delay = Math.min(baseDelay + jitter, this.config.maxBackoffDelay);

    this.log(`🔄 Reconnecting in ${Math.round(delay)}ms... (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setupPageVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.log('📄 Page hidden - pausing heartbeat');
        this.stopHeartbeat();
      } else if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('📄 Page visible - resuming heartbeat');
        this.startHeartbeat();
      } else if (this.shouldReconnect && !this.isManualClose) {
        this.log('📄 Page visible - attempting reconnect');
        this.connect();
      }
    });
  }

  private setupNetworkListener(): void {
    window.addEventListener('online', () => {
      this.log('🌐 Network online - attempting reconnect');
      if (this.shouldReconnect && !this.isManualClose && this.ws?.readyState !== WebSocket.OPEN) {
        this.reconnectAttempts = 0; // Reset attempts on network recovery
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.log('🌐 Network offline - pausing heartbeat');
      this.stopHeartbeat();
    });
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WebSocketManager]', ...args);
    }
  }

  // Cleanup method for React components
  destroy(): void {
    this.disconnect();
    this.messageHandlers = [];
    this.statusHandlers = [];
  }
}