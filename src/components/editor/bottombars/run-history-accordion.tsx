import React, { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, PlayIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import { getAvailableRuns } from "@/api/executionApi";

interface Run {
    run_id: string;
    timestamp: string;
    status?: 'success' | 'error' | 'running';
}

export default function RunHistoryAccordion() {
    const [runs, setRuns] = useState<Run[]>([]);
    const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const selectedRunId = useEditorStore((state) => state.selectedRunId);
    const setSelectedRunId = useEditorStore((state) => state.setSelectedRunId);
    const clearSelectedRunId = useEditorStore((state) => state.clearSelectedRunId);
    const loadHistoricalRunData = useEditorStore((state) => state.loadHistoricalRunData);

    const fetchRuns = async () => {
        if (!activeVersionId || !activeProjectId) {
            console.log("RunHistoryAccordion: Missing activeVersionId or activeProjectId, setting empty runs");
            setRuns([]);
            return;
        }
        
        console.log("RunHistoryAccordion: Fetching runs for activeVersionId:", activeVersionId, "activeProjectId:", activeProjectId);
        setLoading(true);
        try {
            const response = await getAvailableRuns(activeVersionId, activeProjectId);
            console.log("RunHistoryAccordion: Response received:", response);
            const newRuns = response.runs || [];
            
            // Auto-expand the newest run
            if (newRuns.length > 0) {
                const newestRunId = newRuns[0].run_id;
                setExpandedRuns(prev => new Set([...prev, newestRunId]));
                console.log("RunHistoryAccordion: Auto-expanding newest run:", newestRunId);
            }
            
            setRuns(newRuns);
            console.log("RunHistoryAccordion: Set runs:", newRuns);
        } catch (error) {
            console.error("RunHistoryAccordion: Failed to fetch runs:", error);
            setRuns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
        
        // Refresh runs periodically to catch new executions
        const interval = setInterval(fetchRuns, 5000);
        return () => clearInterval(interval);
    }, [activeVersionId, activeProjectId]);

    const toggleRun = async (runId: string) => {
        const isExpanded = expandedRuns.has(runId);
        
        if (isExpanded) {
            // Collapse
            setExpandedRuns(prev => {
                const newSet = new Set(prev);
                newSet.delete(runId);
                return newSet;
            });
            
            // Clear selection if this run was selected
            if (selectedRunId === runId) {
                clearSelectedRunId();
            }
        } else {
            // Expand and load data
            setExpandedRuns(prev => new Set([...prev, runId]));
            setSelectedRunId(runId);
            await loadHistoricalRunData(runId);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusIcon = (run: Run) => {
        if (run.status === 'error') {
            return <XCircleIcon className="w-4 h-4 text-red-400" />;
        } else if (run.status === 'success') {
            return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
        } else {
            return <ClockIcon className="w-4 h-4 text-amber-400" />;
        }
    };

    if (!activeVersionId || !activeProjectId) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="border-b border-sky-500/50 dark:border-white/10 p-2 flex items-center justify-between">
                <h3 className="text-sky-700 dark:text-white/80">Execution History</h3>
                <div className="flex items-center gap-2 text-xs text-sky-600 dark:text-zinc-400">
                    <PlayIcon className="w-3 h-3" />
                    <span>Live</span>
                </div>
            </div>

            {/* Runs Accordion */}
            <div className="flex-1 overflow-y-auto">
                {loading && runs.length === 0 ? (
                    <div className="p-4 text-center text-sky-600 dark:text-zinc-500">
                        <div className="animate-spin h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <div className="text-xs">Loading runs...</div>
                    </div>
                ) : runs.length === 0 ? (
                    <div className="p-4 text-center text-sky-600 dark:text-zinc-500">
                        <ClockIcon className="w-8 h-8 mx-auto mb-2 text-sky-500 dark:text-zinc-600" />
                        <div className="text-xs">No execution history</div>
                    </div>
                ) : (
                    <div className="divide-y divide-sky-300/50 dark:divide-zinc-700">
                        {runs.map((run, index) => {
                            const isExpanded = expandedRuns.has(run.run_id);
                            const isSelected = selectedRunId === run.run_id;
                            
                            return (
                                <div key={run.run_id} className="border-b border-sky-300/50 dark:border-zinc-700 last:border-b-0">
                                    {/* Run Header */}
                                    <button
                                        onClick={() => toggleRun(run.run_id)}
                                        className={`w-full p-3 text-left hover:bg-sky-100 dark:hover:bg-zinc-700/50 transition-colors flex items-center justify-between ${
                                            isSelected ? 'bg-sky-50 dark:bg-zinc-700' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {isExpanded ? (
                                                <ChevronDownIcon className="w-3 h-3 text-sky-600 dark:text-zinc-400 flex-shrink-0" />
                                            ) : (
                                                <ChevronRightIcon className="w-3 h-3 text-sky-600 dark:text-zinc-400 flex-shrink-0" />
                                            )}
                                            {getStatusIcon(run)}
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs text-sky-700 dark:text-white font-medium">
                                                    Run #{runs.length - index}
                                                </div>
                                                <div className="text-xs text-sky-500 dark:text-zinc-400 truncate">
                                                    {formatTimestamp(run.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-sky-500 dark:text-zinc-500 font-mono">
                                            {run.run_id.substring(0, 8)}...
                                        </div>
                                    </button>

                                    {/* Run Content */}
                                    {isExpanded && (
                                        <div className="px-6 pb-3 bg-sky-50 dark:bg-zinc-800/50">
                                            <div className="text-xs text-sky-700 dark:text-zinc-400 space-y-1">
                                                <div>Run ID: <span className="font-mono text-sky-900 dark:text-zinc-300">{run.run_id}</span></div>
                                                <div>Timestamp: <span className="text-sky-900 dark:text-zinc-300">{run.timestamp}</span></div>
                                                <div className="pt-2">
                                                    <div className="text-green-600 dark:text-green-400">✓ Historical data loaded</div>
                                                    <div className="text-sky-600 dark:text-zinc-500">Node states applied to canvas</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}