import React, {useState, useEffect, useCallback} from "react";
import Logs from "@/components/editor/bottombars/logs";
import Chat from "@/components/editor/chat/chat";
import {ChevronLeftIcon, ChevronRightIcon} from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";

type Mode = "split" | "logs" | "chat";

const LS_KEY_RATIO = "output.logsRatio";
const LS_KEY_MODE = "output.mode";

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

const Output: React.FC = (): React.ReactElement => {
    const chatMode = useEditorStore(s => s.chatMode);
    
    // restore persisted state
    const [logsRatio, setLogsRatio] = useState<number>(() => {
        const v = Number(localStorage.getItem(LS_KEY_RATIO));
        return Number.isFinite(v) ? clamp(v, 10, 90) : 50;
    });
    const [mode, setMode] = useState<Mode>(() => {
        const m = localStorage.getItem(LS_KEY_MODE) as Mode | null;
        return m === "logs" || m === "chat" || m === "split" ? m : "split";
    });
    
    // Auto-switch to chat mode when Chat Mode is enabled
    useEffect(() => {
        if (chatMode) {
            setMode("chat");
        }
    }, [chatMode]);

    const [isDragging, setIsDragging] = useState(false);

    // persist
    useEffect(() => {
        localStorage.setItem(LS_KEY_RATIO, String(logsRatio));
    }, [logsRatio]);
    useEffect(() => {
        localStorage.setItem(LS_KEY_MODE, mode);
    }, [mode]);

    // calc widths from mode
    const logsWidthPct = mode === "logs" ? 100 : mode === "chat" ? 0 : logsRatio;
    const chatWidthPct = 100 - logsWidthPct;

    const beginDrag = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        // als iemand begint te slepen terwijl je in een full view zat → naar split
        if (mode !== "split") setMode("split");
        e.preventDefault();
    }, [mode]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = document.querySelector('[data-panel="output-logs-chat"]') as HTMLElement | null;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const ratio = ((e.clientX - rect.left) / rect.width) * 100;
            setLogsRatio(clamp(ratio, 10, 90));
        };
        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    const resetSplit = useCallback(() => {
        setMode("split");
        setLogsRatio(50);
    }, []);

    return (
        <div className="flex h-full" data-panel="output-logs-chat">
            {/* Logs panel */}
            <div
                className={`h-full flex flex-col transition-[width] duration-150 ease-out ${
                    mode === "chat" ? "pointer-events-none" : ""
                } ${logsWidthPct === 0 ? "overflow-hidden" : ""}`}
                style={{width: `${logsWidthPct}%`}}
            >
                <div
                    className="border-b border-sky-500/50 dark:border-white/10 px-2 py-1 flex items-center justify-between">
                    <h3 className="text-sky-500 dark:text-white/80 text-sm">Logs</h3>
                    <div className="flex items-center gap-1">
                        {mode !== "logs" && (
                            <button
                                className="text-xs px-2 py-1 rounded border border-sky-500/40 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10"
                                onClick={() => setMode("logs")}
                                title="Expand logs"
                            >
                                <ChevronRightIcon className={'w-4 h-4'} />
                            </button>
                        )}
                        {mode !== "split" && (
                            <button
                                className="text-xs px-2 py-1 rounded border border-slate-400/40 text-slate-600 dark:text-slate-200 hover:bg-white/5"
                                onClick={() => setMode("split")}
                                title="Split"
                            >
                                <ChevronLeftIcon className={'w-4 h-4'} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Logs/>
                </div>
            </div>

            {/* Splitter */}
            {mode === "split" && (
                <div
                    className={`w-1 bg-sky-500/50 dark:bg-white/20 cursor-col-resize hover:bg-sky-500 dark:hover:bg-white/40 transition-colors ${
                        isDragging ? "opacity-100" : ""
                    }`}
                    onMouseDown={beginDrag}
                    onDoubleClick={resetSplit}
                    title="Drag to resize • Double-click to reset"
                />
            )}

            {/* Chat panel */}
            <div
                className={`h-full flex flex-col transition-[width] duration-150 ease-out ${
                    mode === "logs" ? "pointer-events-none" : ""
                } ${chatWidthPct === 0 ? "overflow-hidden" : ""}`}
                style={{width: `${chatWidthPct}%`}}
            >
                <div
                    className="border-b border-sky-500/50 dark:border-white/10 px-2 py-1 flex items-center justify-between">
                    <h3 className="text-sky-500 dark:text-white/80 text-sm">Chat</h3>
                    <div className="flex items-center gap-1">
                        {mode !== "chat" && (
                            <button
                                className="text-xs px-2 py-1 rounded border border-sky-500/40 text-sky-600 dark:text-sky-300 hover:bg-sky-500/10"
                                onClick={() => setMode("chat")}
                                title="Expand chat (C)"
                            >
                                <ChevronLeftIcon className={'w-4 h-4'} />
                            </button>
                        )}
                        {mode !== "split" && (
                            <button
                                className="text-xs px-2 py-1 rounded border border-slate-400/40 text-slate-600 dark:text-slate-200 hover:bg-white/5"
                                onClick={() => setMode("split")}
                                title="Split (S)"
                            >
                                <ChevronRightIcon className={'w-4 h-4'} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto text-sm text-white/80">
                    <Chat/>
                </div>
            </div>
        </div>
    );
};

export default Output;