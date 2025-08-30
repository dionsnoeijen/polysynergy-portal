import React, { useState, useEffect } from "react";
import EnhancedChat from "@/components/editor/bottombars/enhanced-chat";
import Logs from "@/components/editor/bottombars/logs";

const Output: React.FC = (): React.ReactElement => {
    const [logsRatio, setLogsRatio] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    // Handle resizing for logs/chat layout
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = document.querySelector('[data-panel="output-logs-chat"]') as HTMLElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const newRatio = Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100));
            setLogsRatio(newRatio);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="flex h-full" data-panel="output-logs-chat">
            <div 
                className="border-r border-sky-500/50 dark:border-white/10 h-full flex flex-col"
                style={{ width: `${logsRatio}%` }}
            >
                <Logs />
            </div>

            {/* Resizable divider */}
            <div 
                className="w-1 bg-sky-500/50 dark:bg-white/20 cursor-col-resize hover:bg-sky-500 dark:hover:bg-white/40 transition-colors"
                onMouseDown={handleMouseDown}
            />

            <div 
                className="border-l border-sky-500/50 dark:border-white/10 h-full flex flex-col"
                style={{ width: `${100 - logsRatio}%` }}
            >
                <div className="border-b border-sky-500/50 dark:border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white/80">Chat</h3>
                </div>
                <div className="flex-1 overflow-auto text-sm text-white/80">
                    <EnhancedChat />
                </div>
            </div>
        </div>
    );
};

export default Output;
