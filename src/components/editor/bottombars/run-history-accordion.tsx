import React, { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, PlayIcon, CheckCircleIcon, XCircleIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import { useRunsStore, type Run } from "@/stores/runsStore";

export default function RunHistoryAccordion() {
    console.log('[RunHistoryAccordion] Component rendering...');
    const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
    
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const selectedRunId = useEditorStore((state) => state.selectedRunId);
    const setSelectedRunId = useEditorStore((state) => state.setSelectedRunId);
    const clearSelectedRunId = useEditorStore((state) => state.clearSelectedRunId);
    const loadHistoricalRunData = useEditorStore((state) => state.loadHistoricalRunData);
    
    // Use runs store instead of local state
    const runs = useRunsStore((state) => state.runs);
    const activeRunId = useRunsStore((state) => state.activeRunId);
    const isLoading = useRunsStore((state) => state.isLoading);
    const fetchRuns = useRunsStore((state) => state.fetchRuns);
    const makeRunActive = useRunsStore((state) => state.makeRunActive);
    const moveActiveRunToBackground = useRunsStore((state) => state.moveActiveRunToBackground);
    const getRunDuration = useRunsStore((state) => state.getRunDuration);
    
    // Debug logging for activeRunId changes
    if (activeRunId) {
        console.log('[RunHistoryAccordion] Current activeRunId:', activeRunId);
        console.log('[RunHistoryAccordion] Current runs:', runs.map(r => `${r.run_id.substring(0, 8)}:${r.status}`));
    }


    useEffect(() => {
        if (activeVersionId && activeProjectId) {
            fetchRuns(activeVersionId, activeProjectId);
            
            // Refresh runs periodically to catch new executions
            const interval = setInterval(() => {
                fetchRuns(activeVersionId, activeProjectId);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeVersionId, activeProjectId, fetchRuns]);
    
    // Auto-expand newest run when runs change
    useEffect(() => {
        if (runs.length > 0) {
            const newestRunId = runs[0].run_id;
            setExpandedRuns(prev => new Set([...prev, newestRunId]));
        }
    }, [runs]);

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
                    {activeRunId && (
                        <span className="text-amber-600 font-mono">
                            Active: {activeRunId.substring(0, 6)}
                        </span>
                    )}
                </div>
            </div>

            {/* Runs Accordion */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && runs.length === 0 ? (
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
                            const isActive = activeRunId === run.run_id;
                            const isBackground = run.status === 'running' && !isActive;
                            const isCompleted = run.status === 'success' || run.status === 'error';
                            
                            // Debug logging
                            console.log(`[RunHistory] Run ${run.run_id.substring(0, 8)}: status=${run.status}, isActive=${isActive}, activeRunId=${activeRunId}`);
                            
                            return (
                                <div key={run.run_id} className="border-b border-sky-300/50 dark:border-zinc-700 last:border-b-0">
                                    {/* Run Header */}
                                    <div className={`flex items-center ${isActive ? 'bg-amber-50 dark:bg-amber-900/20' : isBackground ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <button
                                            onClick={() => toggleRun(run.run_id)}
                                            className={`flex-1 p-3 text-left hover:bg-sky-100 dark:hover:bg-zinc-700/50 transition-colors flex items-center justify-between ${
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
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-xs text-sky-700 dark:text-white font-medium">
                                                            Run #{runs.length - index}
                                                        </div>
                                                        {isActive && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200">
                                                                Active
                                                            </span>
                                                        )}
                                                        {isBackground && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200">
                                                                Background
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-sky-500 dark:text-zinc-400 truncate">
                                                        {formatTimestamp(run.timestamp)}
                                                        {run.status === 'running' && run.startTime && (
                                                            <span className="ml-2 text-amber-600 dark:text-amber-400">
                                                                • {getRunDuration(run)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-sky-500 dark:text-zinc-500 font-mono">
                                                {run.run_id.substring(0, 8)}...
                                            </div>
                                        </button>
                                        
                                        {/* Action buttons */}
                                        {(run.status === 'running' || true) && (
                                            <div className="flex items-center gap-1 px-2 border border-red-200">
                                                <span className="text-xs text-red-500">
                                                    {run.status}|{isActive ? 'A' : 'B'}
                                                </span>
                                                {isActive ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveActiveRunToBackground();
                                                        }}
                                                        className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
                                                        title="Move to background"
                                                    >
                                                        <ArrowUpRightIcon className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            makeRunActive(run.run_id);
                                                        }}
                                                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                                                        title="Make active"
                                                    >
                                                        <PlayIcon className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Run Content */}
                                    {isExpanded && (
                                        <div className="px-6 pb-3 bg-sky-50 dark:bg-zinc-800/50">
                                            <div className="text-xs text-sky-700 dark:text-zinc-400 space-y-1">
                                                <div>Run ID: <span className="font-mono text-sky-900 dark:text-zinc-300">{run.run_id}</span></div>
                                                <div>Timestamp: <span className="text-sky-900 dark:text-zinc-300">{run.timestamp}</span></div>
                                                {run.status === 'running' && run.startTime && (
                                                    <div>Duration: <span className="text-sky-900 dark:text-zinc-300">{getRunDuration(run)}</span></div>
                                                )}
                                                {run.nodeId && run.nodeName && (
                                                    <div>Current Node: <span className="text-sky-900 dark:text-zinc-300">{run.nodeName}</span> <span className="font-mono text-xs text-sky-500">({run.nodeId.substring(0, 8)}...)</span></div>
                                                )}
                                                <div className="pt-2">
                                                    {run.status === 'running' && isActive && (
                                                        <div className="text-amber-600 dark:text-amber-400">⚡ Active execution - receiving live updates</div>
                                                    )}
                                                    {run.status === 'running' && isBackground && (
                                                        <div className="text-blue-600 dark:text-blue-400">🔄 Running in background</div>
                                                    )}
                                                    {run.status === 'success' && (
                                                        <div className="text-green-600 dark:text-green-400">✓ Execution completed successfully</div>
                                                    )}
                                                    {run.status === 'error' && (
                                                        <div className="text-red-600 dark:text-red-400">✗ Execution failed with errors</div>
                                                    )}
                                                    {isSelected && run.status !== 'running' && (
                                                        <div className="text-sky-600 dark:text-zinc-500">Historical data loaded on canvas</div>
                                                    )}
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