import React, { useState } from "react";
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChatBubbleLeftIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import useNodesStore from "@/stores/nodesStore";
import useEditorStore from "@/stores/editorStore";
import { Input } from "@/components/input";
import { NodeVariable, NodeVariableType } from "@/types/types";

interface SessionsSidebarProps {
    promptNodeId: string;
    showBackButton?: boolean;
    onBackClick?: () => void;
}

const SessionsSidebar: React.FC<SessionsSidebarProps> = ({ promptNodeId, showBackButton = false, onBackClick }) => {
    const updateNodeVariable = useNodesStore((s) => s.updateNodeVariable);
    const getNode = useNodesStore((s) => s.getNode);
    const chatSessionsSidebarCollapsed = useEditorStore((s) => s.chatSessionsSidebarCollapsed);
    const setChatSessionsSidebarCollapsed = useEditorStore((s) => s.setChatSessionsSidebarCollapsed);

    const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
    const [newSessionName, setNewSessionName] = useState("");
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<string | null>(null);
    const [editSessionName, setEditSessionName] = useState("");
    const [hoveredSession, setHoveredSession] = useState<string | null>(null);

    // Get current prompt node data
    const promptNode = getNode(promptNodeId);
    const sessionVar = promptNode?.variables?.find((v) => v.handle === "session");
    const activeSessionVar = promptNode?.variables?.find((v) => v.handle === "active_session");

    // Parse session data - Dict variables are stored as NodeVariable arrays
    let sessions: Record<string, string> = {};
    let sessionVariables: NodeVariable[] = [];

    if (sessionVar?.value && Array.isArray(sessionVar.value)) {
        sessionVariables = sessionVar.value as NodeVariable[];
        // Convert NodeVariable array to key-value pairs for UI
        sessions = sessionVariables.reduce((acc, variable) => {
            if (variable.handle && variable.value !== null && variable.value !== undefined) {
                acc[variable.handle] = String(variable.value);
            }
            return acc;
        }, {} as Record<string, string>);
    }

    const activeSession = (activeSessionVar?.value as string) || "";
    const sessionEntries = Object.entries(sessions);

    // Helper functions
    const generateSessionId = () => {
        return "session-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now().toString(36);
    };

    const addNewSession = () => {
        if (!newSessionName.trim()) return;
        const sessionId = generateSessionId();
        const sessionName = newSessionName.trim();

        // Create new NodeVariable for the session
        const newSessionVariable: NodeVariable = {
            handle: sessionId,
            type: NodeVariableType.String,
            value: sessionName,
            has_in: false,
            has_out: false,
            published: false,
        };

        // Add to existing session variables array
        const updatedSessionVariables = [...sessionVariables, newSessionVariable];

        updateNodeVariable(promptNodeId, "session", updatedSessionVariables);
        updateNodeVariable(promptNodeId, "active_session", sessionId);

        setNewSessionName("");
        setShowNewSessionDialog(false);
    };

    const confirmDeleteSession = (sessionId: string) => {
        setSessionToDelete(sessionId);
    };

    const removeSession = (sessionId: string) => {
        // Remove session from NodeVariable array
        const updatedSessionVariables = sessionVariables.filter((variable) => variable.handle !== sessionId);

        updateNodeVariable(promptNodeId, "session", updatedSessionVariables);

        // If removing active session, set to first remaining or empty
        if (activeSession === sessionId) {
            const remainingSessionId = updatedSessionVariables.length > 0 ? updatedSessionVariables[0].handle : "";
            updateNodeVariable(promptNodeId, "active_session", remainingSessionId);
        }

        setSessionToDelete(null);
    };

    const cancelDeleteSession = () => {
        setSessionToDelete(null);
    };

    const startEditSession = (sessionId: string) => {
        setEditingSession(sessionId);
        setEditSessionName(sessions[sessionId] || "");
    };

    const saveEditSession = () => {
        if (!editingSession || !editSessionName.trim()) return;

        // Update the session name in the NodeVariable array
        const updatedSessionVariables = sessionVariables.map((variable) =>
            variable.handle === editingSession ? { ...variable, value: editSessionName.trim() } : variable
        );

        updateNodeVariable(promptNodeId, "session", updatedSessionVariables);
        setEditingSession(null);
        setEditSessionName("");
    };

    const cancelEditSession = () => {
        setEditingSession(null);
        setEditSessionName("");
    };

    const selectSession = (sessionId: string) => {
        updateNodeVariable(promptNodeId, "active_session", sessionId);
    };

    return (
        <div
            className={`flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ${
                chatSessionsSidebarCollapsed ? "w-[60px]" : "w-[250px]"
            }`}
        >
            {/* Header with Toggle */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                {!chatSessionsSidebarCollapsed && (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Chat History</h3>
                )}
                <button
                    onClick={() => setChatSessionsSidebarCollapsed(!chatSessionsSidebarCollapsed)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                    title={chatSessionsSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {chatSessionsSidebarCollapsed ? (
                        <ChevronRightIcon className="w-4 h-4" />
                    ) : (
                        <ChevronLeftIcon className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setShowNewSessionDialog(true)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors ${
                        chatSessionsSidebarCollapsed ? "justify-center" : ""
                    }`}
                    title="New Chat"
                >
                    <PlusIcon className="w-4 h-4" />
                    {!chatSessionsSidebarCollapsed && <span className="text-sm font-medium">New Chat</span>}
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {sessionEntries.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {chatSessionsSidebarCollapsed ? (
                            <ChatBubbleLeftIcon className="w-6 h-6 mx-auto opacity-50" />
                        ) : (
                            "No sessions yet"
                        )}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {sessionEntries.map(([sessionId, sessionName]) => (
                            <div
                                key={sessionId}
                                onMouseEnter={() => setHoveredSession(sessionId)}
                                onMouseLeave={() => setHoveredSession(null)}
                                className="relative group"
                            >
                                <button
                                    onClick={() => selectSession(sessionId)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                                        activeSession === sessionId
                                            ? "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    } ${chatSessionsSidebarCollapsed ? "justify-center" : ""}`}
                                    title={chatSessionsSidebarCollapsed ? sessionName : undefined}
                                >
                                    <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0" />
                                    {!chatSessionsSidebarCollapsed && (
                                        <span className="text-sm truncate flex-1">{sessionName}</span>
                                    )}
                                </button>

                                {/* Action buttons on hover (only when expanded) */}
                                {!chatSessionsSidebarCollapsed && hoveredSession === sessionId && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditSession(sessionId);
                                            }}
                                            className="p-1 rounded hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-600 dark:text-sky-400"
                                            title="Edit session"
                                        >
                                            <PencilIcon className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                confirmDeleteSession(sessionId);
                                            }}
                                            className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
                                            title="Delete session"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Back to Chat Windows Button */}
            {showBackButton && onBackClick && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onBackClick}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            chatSessionsSidebarCollapsed ? "justify-center" : ""
                        }`}
                        title={chatSessionsSidebarCollapsed ? "Back to Chat Windows" : undefined}
                    >
                        <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
                        {!chatSessionsSidebarCollapsed && <span className="text-sm">Back to Chat Windows</span>}
                    </button>
                </div>
            )}

            {/* New Session Dialog */}
            {showNewSessionDialog && !chatSessionsSidebarCollapsed && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 mx-4 w-full max-w-sm">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Chat Session</h4>
                        <form
                            autoComplete="off"
                            onSubmit={(e) => {
                                e.preventDefault();
                                addNewSession();
                            }}
                        >
                            <Input
                                type="text"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                placeholder="Session name (e.g., Technical Support)..."
                                className="w-full mb-3"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") addNewSession();
                                    if (e.key === "Escape") {
                                        setShowNewSessionDialog(false);
                                        setNewSessionName("");
                                    }
                                }}
                                autoFocus
                                autoComplete="new-password"
                                data-form-type="other"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                name="session-name"
                                role="textbox"
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewSessionDialog(false);
                                        setNewSessionName("");
                                    }}
                                    className="px-3 py-1.5 text-sm rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newSessionName.trim()}
                                    className="px-3 py-1.5 text-sm rounded bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Session Dialog */}
            {editingSession && !chatSessionsSidebarCollapsed && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 mx-4 w-full max-w-sm">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Edit Session</h4>
                        <form
                            autoComplete="off"
                            onSubmit={(e) => {
                                e.preventDefault();
                                saveEditSession();
                            }}
                        >
                            <Input
                                type="text"
                                value={editSessionName}
                                onChange={(e) => setEditSessionName(e.target.value)}
                                placeholder="Session name..."
                                className="w-full mb-3"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEditSession();
                                    if (e.key === "Escape") cancelEditSession();
                                }}
                                autoFocus
                                autoComplete="new-password"
                                data-form-type="other"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                name="edit-session-name"
                                role="textbox"
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={cancelEditSession}
                                    className="px-3 py-1.5 text-sm rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editSessionName.trim()}
                                    className="px-3 py-1.5 text-sm rounded bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Session Confirmation */}
            {sessionToDelete && !chatSessionsSidebarCollapsed && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 mx-4 w-full max-w-sm">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Delete Session</h4>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Are you sure you want to delete &quot;{sessions[sessionToDelete]}&quot;? This action cannot be
                                    undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={cancelDeleteSession}
                                className="px-3 py-1.5 text-sm rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => removeSession(sessionToDelete)}
                                className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionsSidebar;
