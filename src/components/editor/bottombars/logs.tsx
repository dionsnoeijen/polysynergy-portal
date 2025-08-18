import React, {useEffect, useRef, useState} from "react";
import useEditorStore from "@/stores/editorStore";
import apiConfig from "@/config";
import {getIdToken} from "@/api/auth/authToken";
import {ArrowPathIcon} from "@heroicons/react/24/outline";

interface LogEntry {
    function: string;
    variant: string;
    timestamp: number;
    message: string;
}

export default function Logs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [inactiveCount, setInactiveCount] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const activeVersionId = useEditorStore((state) => state.activeVersionId);

    const fetchLogs = async () => {
        if (paused || !activeVersionId) return;

        let url = `${apiConfig.LOCAL_API_URL}/execution/${activeVersionId}/logs/`;
        if (lastTimestamp) url += `?after=${lastTimestamp}`;

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
                setInactiveCount(0);
            } else {
                setInactiveCount((prev) => prev + 1);
            }
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (paused || !activeVersionId) return;

        intervalRef.current = setInterval(() => {
            fetchLogs();
        }, 5000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line
    }, [activeVersionId, lastTimestamp, paused]);

    useEffect(() => {
        if (inactiveCount >= 6) {
            setPaused(true);
        }
    }, [inactiveCount]);

    const handleResume = () => {
        setPaused(false);
        setInactiveCount(0);
        setLoading(true);
    };

    return (
        <div className="flex h-full">
            <div className="flex-1 border-r dark:border-white/10 h-full flex flex-col">
                <div
                    className="flex-1 overflow-auto text-sm font-mono bg-transparent dark:bg-black text-sky-500 dark:text-white relative max-w-full break-words">
                    {!activeVersionId ? (
                        <div className="p-4 text-center text-zinc-500">
                            <div className="mb-2">📋 No active node setup</div>
                            <div className="text-xs">Run a workflow to see execution logs here</div>
                        </div>
                    ) : loading ? (
                        <div className="absolute inset-0 bg-black flex items-center justify-center">
                            <div
                                className="animate-spin h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-2 text-zinc-500">No logs available.</div>
                    ) : (
                        <div className="p-2">
                            {[...logs].reverse().map((log, index) => {
                                const isError = log.message.includes("[ERROR]");
                                const isInfo = log.message.includes("[INFO]");
                                const isNewRun = log.message.includes("START RequestId:");
                                
                                // Check if this is the start of a new run and not the first log
                                const shouldShowSeparator = isNewRun && index > 0;

                                return (
                                    <React.Fragment key={index}>
                                        {shouldShowSeparator && (
                                            <div className="my-4 flex items-center">
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
                                                <div className="px-4 text-xs text-sky-400 font-medium">
                                                    NEW RUN
                                                </div>
                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
                                            </div>
                                        )}
                                        <div className="whitespace-normal break-all">
                                            <span className="text-zinc-500 mr-2">
                                                [{new Date(log.timestamp).toLocaleTimeString()}]
                                            </span>
                                            <span className="mr-2 px-1 rounded text-xs bg-zinc-700">
                                                {log.variant}
                                            </span>
                                            <span className={isError ? "text-red-400" : isInfo ? "text-green-400" : isNewRun ? "text-sky-300 font-medium" : ""}>
                                                {log.message}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-12 flex items-center rounded rounded-l-none rounded-r-md justify-center border-l border-sky-500/50 dark:border-white/10 bg-sky-100 dark:bg-zinc-900">
                {paused && (
                    <button
                        onClick={handleResume}
                        title="Resume logs"
                        className="bg-sky-400 hover:bg-sky-500 dark:bg-zinc-400 dark:hover:bg-zinc-600 p-2 rounded-md"
                    >
                        <ArrowPathIcon className="w-4 h-4 text-white"/>
                    </button>
                )}
            </div>
        </div>
    );
}