import React, {useState} from "react";
import {PlusIcon, TrashIcon, CheckIcon, XMarkIcon, PencilIcon, ChatBubbleLeftEllipsisIcon} from "@heroicons/react/24/outline";
import useNodesStore from "@/stores/nodesStore";
import useEditorStore from "@/stores/editorStore";
import {Input} from "@/components/input";
import {NodeVariable, NodeVariableType} from "@/types/types";

interface SessionUserManagerProps {
    promptNodeId: string;
    hasStorage: boolean;
    hideUserSelector?: boolean;
    onEnterChatMode?: () => void;
    onExitChatMode?: () => void;
}

const SessionUserManager: React.FC<SessionUserManagerProps> = ({
    promptNodeId,
    hasStorage,
    hideUserSelector = false,
    onEnterChatMode,
    onExitChatMode
}) => {
    const updateNodeVariable = useNodesStore(s => s.updateNodeVariable);
    const getNode = useNodesStore(s => s.getNode);
    const chatMode = useEditorStore(s => s.chatMode);

    const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
    const [showNewUserDialog, setShowNewUserDialog] = useState(false);
    const [newSessionName, setNewSessionName] = useState("");
    const [newUserId, setNewUserId] = useState("");
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<string | null>(null);
    const [editSessionName, setEditSessionName] = useState("");
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editUserId, setEditUserId] = useState("");

    // Get current prompt node data
    const promptNode = getNode(promptNodeId);
    const sessionVar = promptNode?.variables?.find(v => v.handle === 'session');
    const userVar = promptNode?.variables?.find(v => v.handle === 'user');
    const activeSessionVar = promptNode?.variables?.find(v => v.handle === 'active_session');
    const activeUserVar = promptNode?.variables?.find(v => v.handle === 'active_user');

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
    
    
    // Parse user data - handle both string and array cases
    let users: string[] = [];
    if (userVar?.value) {
        if (typeof userVar.value === 'string') {
            try {
                users = JSON.parse(userVar.value);
            } catch {
                users = [];
            }
        } else if (Array.isArray(userVar.value)) {
            users = userVar.value as string[];
        }
    }
    
    const activeSession = activeSessionVar?.value as string || '';
    const activeUser = activeUserVar?.value as string || '';

    const sessionEntries = Object.entries(sessions);
    const hasNoSessions = sessionEntries.length === 0;
    const hasNoUsers = users.length === 0;

    // Helper functions
    const generateSessionId = () => {
        return 'session-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
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
            published: false
        };
        
        // Add to existing session variables array
        const updatedSessionVariables = [...sessionVariables, newSessionVariable];
        
        
        updateNodeVariable(promptNodeId, 'session', updatedSessionVariables);
        updateNodeVariable(promptNodeId, 'active_session', sessionId);
        
        setNewSessionName("");
        setShowNewSessionDialog(false);
    };

    const confirmDeleteSession = (sessionId: string) => {
        setSessionToDelete(sessionId);
    };

    const removeSession = (sessionId: string) => {
        // Remove session from NodeVariable array
        const updatedSessionVariables = sessionVariables.filter(
            variable => variable.handle !== sessionId
        );
        
        updateNodeVariable(promptNodeId, 'session', updatedSessionVariables);
        
        // If removing active session, set to first remaining or empty
        if (activeSession === sessionId) {
            const remainingSessionId = updatedSessionVariables.length > 0 
                ? updatedSessionVariables[0].handle 
                : '';
            updateNodeVariable(promptNodeId, 'active_session', remainingSessionId);
        }
        
        setSessionToDelete(null);
    };

    const cancelDeleteSession = () => {
        setSessionToDelete(null);
    };

    const startEditSession = (sessionId: string) => {
        setEditingSession(sessionId);
        setEditSessionName(sessions[sessionId] || '');
    };

    const saveEditSession = () => {
        if (!editingSession || !editSessionName.trim()) return;
        
        // Update the session name in the NodeVariable array
        const updatedSessionVariables = sessionVariables.map(variable =>
            variable.handle === editingSession
                ? { ...variable, value: editSessionName.trim() }
                : variable
        );
        
        updateNodeVariable(promptNodeId, 'session', updatedSessionVariables);
        setEditingSession(null);
        setEditSessionName('');
    };

    const cancelEditSession = () => {
        setEditingSession(null);
        setEditSessionName('');
    };

    const selectSession = (sessionId: string) => {
        updateNodeVariable(promptNodeId, 'active_session', sessionId);
    };

    const addNewUser = () => {
        if (!newUserId.trim()) return;
        const trimmedUserId = newUserId.trim();
        
        // Don't add duplicate users
        if (users.includes(trimmedUserId)) return;
        
        const newUsers = [...users, trimmedUserId];
        updateNodeVariable(promptNodeId, 'user', newUsers);
        updateNodeVariable(promptNodeId, 'active_user', trimmedUserId);
        
        setNewUserId("");
        setShowNewUserDialog(false);
    };

    const confirmDeleteUser = (userId: string) => {
        setUserToDelete(userId);
    };

    const removeUser = (userId: string) => {
        const newUsers = users.filter(id => id !== userId);
        updateNodeVariable(promptNodeId, 'user', newUsers);
        
        // If removing active user, set to first remaining or empty
        if (activeUser === userId) {
            updateNodeVariable(promptNodeId, 'active_user', newUsers[0] || '');
        }
        
        setUserToDelete(null);
    };

    const cancelDeleteUser = () => {
        setUserToDelete(null);
    };

    const selectUser = (userId: string) => {
        updateNodeVariable(promptNodeId, 'active_user', userId);
    };

    const startEditUser = (userId: string) => {
        setEditingUser(userId);
        setEditUserId(userId);
    };

    const saveEditUser = () => {
        if (!editingUser || !editUserId.trim()) return;
        
        const trimmedNewUserId = editUserId.trim();
        
        // Don't allow duplicate user IDs (except if it's the same as current)
        if (trimmedNewUserId !== editingUser && users.includes(trimmedNewUserId)) return;
        
        // Update the user list
        const updatedUsers = users.map(userId => 
            userId === editingUser ? trimmedNewUserId : userId
        );
        
        updateNodeVariable(promptNodeId, 'user', updatedUsers);
        
        // Update active user if it was the edited one
        if (activeUser === editingUser) {
            updateNodeVariable(promptNodeId, 'active_user', trimmedNewUserId);
        }
        
        setEditingUser(null);
        setEditUserId('');
    };

    const cancelEditUser = () => {
        setEditingUser(null);
        setEditUserId('');
    };

    // Don't show anything if no storage (warning will be shown elsewhere)
    if (!hasStorage) return null;

    return (
        <div className="border-b border-gray-200 dark:border-white/10 px-3 py-2">
            <div className="flex flex-wrap items-center gap-4">
                {/* User Management */}
                {!hideUserSelector && (
                <>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User:</span>
                    {hasNoUsers ? (
                        <span className="text-sm text-gray-500">No users</span>
                    ) : (
                        <select
                            value={activeUser}
                            onChange={(e) => selectUser(e.target.value)}
                            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        >
                            <option value="">Select user...</option>
                            {users.map(userId => (
                                <option key={userId} value={userId}>{userId}</option>
                            ))}
                        </select>
                    )}
                    
                    <button
                        onClick={() => setShowNewUserDialog(true)}
                        title="Add new user"
                        className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    
                    {activeUser && (
                        <>
                            <button
                                onClick={() => startEditUser(activeUser)}
                                title="Edit current user"
                                className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => confirmDeleteUser(activeUser)}
                                title="Remove current user"
                                className="p-1.5 rounded text-red-500 hover:text-white dark:text-red-400 dark:hover:text-white hover:bg-red-400 dark:hover:bg-red-600 bg-transparent transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                </>
                )}

                {/* Session Management */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Session:</span>
                    {hasNoSessions ? (
                        <span className="text-sm text-gray-500">No sessions</span>
                    ) : (
                        <select
                            value={activeSession}
                            onChange={(e) => selectSession(e.target.value)}
                            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        >
                            <option value="">Select session...</option>
                            {sessionEntries.map(([sessionId, sessionName]) => (
                                <option key={sessionId} value={sessionId}>{sessionName}</option>
                            ))}
                        </select>
                    )}
                    
                    <button
                        onClick={() => setShowNewSessionDialog(true)}
                        title="Add new session"
                        className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    
                    {activeSession && (
                        <>
                            <button
                                onClick={() => startEditSession(activeSession)}
                                title="Edit current session"
                                className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => confirmDeleteSession(activeSession)}
                                title="Remove current session"
                                className="p-1.5 rounded text-red-500 hover:text-white dark:text-red-400 dark:hover:text-white hover:bg-red-400 dark:hover:bg-red-600 bg-transparent transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Chat Mode Toggle */}
                {(onEnterChatMode || onExitChatMode) && (
                    <>
                        {/* Vertical Divider */}
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                        
                        <div className="flex items-center gap-2">
                        <button
                            onClick={chatMode ? onExitChatMode : onEnterChatMode}
                            title={chatMode ? "Exit Chat Mode" : "Enter Chat Mode"}
                            className={`p-1.5 rounded transition-colors ${
                                chatMode 
                                    ? 'bg-sky-500 text-white' 
                                    : 'text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent'
                            }`}
                        >
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        </button>
                    </div>
                    </>
                )}
            </div>

            {/* New User Dialog */}
            {showNewUserDialog && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); addNewUser(); }}>
                        <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            placeholder="Enter identifier..."
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addNewUser();
                                if (e.key === 'Escape') setShowNewUserDialog(false);
                            }}
                            autoFocus
                            autoComplete="new-password"
                            data-form-type="other"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            name="node-identifier"
                            role="textbox"
                        />
                        <button
                            onClick={addNewUser}
                            disabled={!newUserId.trim()}
                            title="Add user"
                            className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowNewUserDialog(false)}
                            title="Cancel"
                            className="p-1.5 rounded text-gray-500 hover:text-white dark:text-gray-400 dark:hover:text-white hover:bg-gray-400 dark:hover:bg-gray-600 bg-transparent transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                        </div>
                    </form>
                </div>
            )}

            {/* New Session Dialog */}
            {showNewSessionDialog && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); addNewSession(); }}>
                        <div className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                placeholder="Session name (e.g., Technical Support)..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addNewSession();
                                    if (e.key === 'Escape') {
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
                            <button
                                onClick={addNewSession}
                                disabled={!newSessionName.trim()}
                                title="Add session"
                                className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewSessionDialog(false);
                                    setNewSessionName("");
                                }}
                                title="Cancel"
                                className="p-1.5 rounded text-gray-500 hover:text-white dark:text-gray-400 dark:hover:text-white hover:bg-gray-400 dark:hover:bg-gray-600 bg-transparent transition-colors"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit User Dialog */}
            {editingUser && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); saveEditUser(); }}>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Edit User ID:</span>
                            <Input
                                type="text"
                                value={editUserId}
                                onChange={(e) => setEditUserId(e.target.value)}
                                placeholder="User ID..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditUser();
                                    if (e.key === 'Escape') cancelEditUser();
                                }}
                                autoFocus
                                autoComplete="new-password"
                                data-form-type="other"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                name="edit-user-id"
                                role="textbox"
                            />
                            <button
                                onClick={saveEditUser}
                                disabled={!editUserId.trim()}
                                title="Save changes"
                                className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={cancelEditUser}
                                title="Cancel"
                                className="p-1.5 rounded text-gray-500 hover:text-white dark:text-gray-400 dark:hover:text-white hover:bg-gray-400 dark:hover:bg-gray-600 bg-transparent transition-colors"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Edit Session Dialog */}
            {editingSession && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); saveEditSession(); }}>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Edit Session Name:</span>
                            <Input
                                type="text"
                                value={editSessionName}
                                onChange={(e) => setEditSessionName(e.target.value)}
                                placeholder="Session name..."
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditSession();
                                    if (e.key === 'Escape') cancelEditSession();
                                }}
                                autoFocus
                                autoComplete="new-password"
                                data-form-type="other"
                                data-lpignore="true"
                                data-1p-ignore="true"
                                name="edit-session-name"
                                role="textbox"
                            />
                            <button
                                onClick={saveEditSession}
                                disabled={!editSessionName.trim()}
                                title="Save changes"
                                className="p-1.5 rounded text-sky-500 hover:text-white dark:text-white hover:bg-sky-300 dark:hover:bg-zinc-600 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={cancelEditSession}
                                title="Cancel"
                                className="p-1.5 rounded text-gray-500 hover:text-white dark:text-gray-400 dark:hover:text-white hover:bg-gray-400 dark:hover:bg-gray-600 bg-transparent transition-colors"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete User Confirmation */}
            {userToDelete && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Delete User
                            </h3>
                            <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                Are you sure you want to delete the user &quot;{userToDelete}&quot;? This action cannot be undone and all data associated with this user will be permanently lost.
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => removeUser(userToDelete)}
                                    className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Delete User
                                </button>
                                <button
                                    onClick={cancelDeleteUser}
                                    className="px-3 py-1.5 text-xs rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Session Confirmation */}
            {sessionToDelete && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                Delete Session
                            </h3>
                            <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                Are you sure you want to delete the session &quot;{sessions[sessionToDelete]}&quot;? This action cannot be undone and all chat history for this session will be permanently lost.
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => removeSession(sessionToDelete)}
                                    className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Delete Session
                                </button>
                                <button
                                    onClick={cancelDeleteSession}
                                    className="px-3 py-1.5 text-xs rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionUserManager;