import React from "react";
import useEditorStore from "@/stores/editorStore";
import { WebSocketStatusDot } from "@/components/websocket-status";
import { ConnectionStatus } from "@/utils/WebSocketManager";

interface IsExecutingProps {
    connectionStatus?: ConnectionStatus;
}

const IsExecuting: React.FC<IsExecutingProps> = ({ connectionStatus }) => {
    const isExecuting = useEditorStore((state) => state.isExecuting);

    return (
        <>
            {/* WebSocket Connection Status - always show if not connected */}
            {connectionStatus && connectionStatus !== 'connected' && (
                <div className="absolute top-4 right-16 z-40 pointer-events-none">
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

            {/* Execution Status */}
            {isExecuting && (
                <div className="absolute top-0 left-0 w-full z-40 pointer-events-none">
                    <div className="mx-auto max-w-2xl mt-4 bg-white dark:bg-zinc-800/80 border border-sky-500/50 dark:border-white/25  backdrop-blur-sm
                                    rounded-md py-2 px-4 flex items-center justify-center gap-3 text-white shadow-md">
                        <div
                            className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"/>
                        <span className="text-sm font-medium text-sky-500 dark:text-white">
                            {typeof isExecuting === 'string' ? isExecuting : 'Executing...'}
                        </span>
                        {/* Show connection status dot during execution */}
                        {connectionStatus && (
                            <WebSocketStatusDot status={connectionStatus} className="ml-1" />
                        )}
                    </div>
                </div>
            )}
        </>
    )
};

export default IsExecuting;

