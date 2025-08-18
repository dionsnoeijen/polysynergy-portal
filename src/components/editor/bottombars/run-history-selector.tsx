import React, { useState, useEffect } from "react";
import { ChevronDownIcon, ClockIcon, PlayIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import { getAvailableRuns } from "@/api/executionApi";

interface Run {
    run_id: string;
    timestamp: string;
}

export default function RunHistorySelector() {
    const [runs, setRuns] = useState<Run[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const activeVersionId = useEditorStore((state) => state.activeVersionId);
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const selectedRunId = useEditorStore((state) => state.selectedRunId);
    const isViewingHistoricalRun = useEditorStore((state) => state.isViewingHistoricalRun);
    const setSelectedRunId = useEditorStore((state) => state.setSelectedRunId);
    const clearSelectedRunId = useEditorStore((state) => state.clearSelectedRunId);
    const loadHistoricalRunData = useEditorStore((state) => state.loadHistoricalRunData);

    useEffect(() => {
        const fetchRuns = async () => {
            if (!activeVersionId) {
                setRuns([]);
                return;
            }
            
            setLoading(true);
            try {
                const response = await getAvailableRuns(activeVersionId!, activeProjectId!);
                setRuns(response.runs || []);
            } catch (error) {
                console.error("Failed to fetch runs:", error);
                setRuns([]);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchRuns();
        }
    }, [isOpen, activeVersionId]);

    const handleRunSelect = async (runId: string) => {
        if (runId === 'live') {
            clearSelectedRunId();
        } else {
            setSelectedRunId(runId);
            await loadHistoricalRunData(runId);
        }
        setIsOpen(false);
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCurrentDisplayText = () => {
        if (isViewingHistoricalRun && selectedRunId) {
            const selectedRun = runs.find(run => run.run_id === selectedRunId);
            if (selectedRun) {
                return `${formatTimestamp(selectedRun.timestamp)}`;
            }
            return `Run ${selectedRunId.substring(0, 8)}...`;
        }
        return "Live";
    };

    // Temporarily disabled until retention logic is properly implemented
    if (!activeVersionId || true) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded border border-zinc-600 transition-colors"
            >
                {isViewingHistoricalRun ? (
                    <ClockIcon className="w-3 h-3 text-amber-400" />
                ) : (
                    <PlayIcon className="w-3 h-3 text-green-400" />
                )}
                <span className="min-w-0 truncate">
                    {getCurrentDisplayText()}
                </span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 bg-zinc-800 border border-zinc-600 rounded-md shadow-lg z-50 min-w-48 max-h-64 overflow-y-auto">
                    {/* Live option */}
                    <button
                        onClick={() => handleRunSelect('live')}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 flex items-center gap-2 ${!isViewingHistoricalRun ? 'bg-zinc-700 text-green-400' : 'text-white'}`}
                    >
                        <PlayIcon className="w-3 h-3 text-green-400" />
                        <span>Live (current)</span>
                    </button>

                    {/* Historical runs */}
                    {loading ? (
                        <div className="px-3 py-2 text-xs text-zinc-400">
                            Loading runs...
                        </div>
                    ) : runs.length > 0 ? (
                        runs.map((run) => (
                            <button
                                key={run.run_id}
                                onClick={() => handleRunSelect(run.run_id)}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 flex items-center gap-2 ${selectedRunId === run.run_id ? 'bg-zinc-700 text-amber-400' : 'text-white'}`}
                            >
                                <ClockIcon className="w-3 h-3 text-amber-400" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate">
                                        {formatTimestamp(run.timestamp)}
                                    </div>
                                    <div className="text-zinc-400 text-[10px] truncate">
                                        {run.run_id}
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-zinc-400">
                            No historical runs available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}