import React from 'react';
import { ConnectionStatus } from '@/utils/WebSocketManager';

interface WebSocketStatusProps {
  status: ConnectionStatus;
  className?: string;
  showText?: boolean;
}

const statusConfig = {
  connecting: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    dot: 'bg-yellow-500',
    text: 'Connecting...',
    pulse: true
  },
  connected: {
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900', 
    dot: 'bg-green-500',
    text: 'Connected',
    pulse: false
  },
  reconnecting: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    dot: 'bg-orange-500', 
    text: 'Reconnecting...',
    pulse: true
  },
  disconnected: {
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dot: 'bg-gray-400',
    text: 'Disconnected',
    pulse: false
  },
  failed: {
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    dot: 'bg-red-500',
    text: 'Connection Failed',
    pulse: false
  }
};

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  status, 
  className = '', 
  showText = true 
}) => {
  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div 
          className={`w-2 h-2 rounded-full ${config.dot} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        />
        {config.pulse && (
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.dot} animate-ping opacity-75`} />
        )}
      </div>
      {showText && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      )}
    </div>
  );
};

// Inline status indicator for minimal space
export const WebSocketStatusDot: React.FC<{ status: ConnectionStatus; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  return <WebSocketStatus status={status} showText={false} className={className} />;
};

// Status badge with background
export const WebSocketStatusBadge: React.FC<WebSocketStatusProps> = ({ 
  status, 
  className = '', 
  showText = true 
}) => {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}>
      <div 
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot} ${
          config.pulse ? 'animate-pulse' : ''
        }`}
      />
      {showText && config.text}
    </div>
  );
};

export default WebSocketStatus;