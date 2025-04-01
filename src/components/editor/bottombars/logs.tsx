import React, { useEffect, useRef, useState } from "react";
import useEditorStore from "@/stores/editorStore";
import apiConfig from "@/config";
import {getIdToken} from "@/api/auth/authToken";

interface LogEntry {
    function: string;
    variant: string;
    timestamp: number;
    message: string;
}

export default function Logs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);

    useEffect(() => {
        const fetchLogs = async () => {
            let url = `${apiConfig.API_URL}/lambda-logs/${activeVersionId}/`;
            if (lastTimestamp) {
                url += `?after=${lastTimestamp}`;
            }

            try {
                const idToken = getIdToken();
                const response = await fetch(url, {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                });
                const data = await response.json();

                if (data.logs && data.logs.length > 0) {
                    setLogs((prev) => [...prev, ...data.logs]);
                    const newest = Math.max(...data.logs.map((l: LogEntry) => l.timestamp));
                    setLastTimestamp(newest);
                }
            } catch (err) {
                console.error("Failed to fetch logs", err);
            }
        };

        intervalRef.current = setInterval(fetchLogs, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [activeVersionId, lastTimestamp]);

    return (
        <div className="flex h-full">
            <div className="flex-1 border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3 className="text-white font-bold text-sm">Logs</h3>
                </div>
                <div className="flex-1 overflow-scroll text-sm font-mono p-2 bg-black text-white">
                    {[...logs].reverse().map((log, index) => (
                        <div key={index}>
                            <span className="text-zinc-500 mr-2">
                                [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className={`mr-2 px-1 rounded text-xs bg-zinc-700`}>
                                {log.variant}
                            </span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}