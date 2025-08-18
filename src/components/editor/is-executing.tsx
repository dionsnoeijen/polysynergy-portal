import React from "react";
import { WebSocketStatusDot } from "@/components/websocket-status";
import { ConnectionStatus } from "@/utils/WebSocketManager";

interface IsExecutingProps {
    connectionStatus?: ConnectionStatus;
}

const IsExecuting: React.FC<IsExecutingProps> = ({ connectionStatus }) => {
    return (
        <>
            {/* WebSocket Connection Status - always show if not connected */}
            {connectionStatus && connectionStatus !== 'connected' && (
                <div className="absolute bottom-3.5 left-20 z-40 pointer-events-none">
                    <div className="bg-white/90 dark:bg-zinc-800/90 border border-gray-200 dark:border-gray-700 backdrop-blur-sm
                                    rounded-md py-2 px-3 flex items-center gap-2 shadow-md">
                        <WebSocketStatusDot status={connectionStatus} />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {connectionStatus === 'connecting' && 'Connecting...'}
                            {connectionStatus === 'reconnecting' && 'Reconnecting...'}
                            {connectionStatus === 'disconnected' && 'Disconnected'}
                            {connectionStatus === 'failed' && 'Connection Failed'}
                        </span>
                    </div>
                </div>
            )}

        </>
    )
};

export default IsExecuting;

