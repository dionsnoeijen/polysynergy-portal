import React, {useState, useMemo} from "react";
import {PlusIcon, TrashIcon, PencilIcon} from "@heroicons/react/24/outline";
import useNodesStore from "@/stores/nodesStore";

interface SessionUserManagerProps {
    promptNodeId: string;
    hasStorage: boolean;
}

const SessionUserManager: React.FC<SessionUserManagerProps> = ({
    promptNodeId,
    hasStorage
}) => {
    const updateNodeVariable = useNodesStore(s => s.updateNodeVariable);
    const getNode = useNodesStore(s => s.getNode);

    const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
    const [showNewUserDialog, setShowNewUserDialog] = useState(false);
    const [newSessionName, setNewSessionName] = useState("");
    const [newUserId, setNewUserId] = useState("");

    // Get current prompt node data
    const promptNode = getNode(promptNodeId);
    const sessionVar = promptNode?.variables?.find(v => v.handle === 'session');
    const userVar = promptNode?.variables?.find(v => v.handle === 'user');
    const activeSessionVar = promptNode?.variables?.find(v => v.handle === 'active_session');
    const activeUserVar = promptNode?.variables?.find(v => v.handle === 'active_user');

    const sessions = (sessionVar?.value as Record<string, string>) || {};
    const users = (userVar?.value as string[]) || [];
    const activeSession = activeSessionVar?.value as string || '';
    const activeUser = activeUserVar?.value as string || '';

    const sessionEntries = Object.entries(sessions);
    const hasNoSessions = sessionEntries.length === 0;
    const hasNoUsers = users.length === 0;

    // Helper functions
    const createSessionId = () => `session-${Date.now()}`;

    const addNewSession = () => {
        if (!newSessionName.trim()) return;
        const sessionId = createSessionId();
        const newSessions = {...sessions, [sessionId]: newSessionName.trim()};
        
        updateNodeVariable(promptNodeId, 'session', newSessions);
        updateNodeVariable(promptNodeId, 'active_session', sessionId);
        
        setNewSessionName("");
        setShowNewSessionDialog(false);
    };

    const removeSession = (sessionId: string) => {
        const {[sessionId]: _, ...remainingSessions} = sessions;
        updateNodeVariable(promptNodeId, 'session', remainingSessions);
        
        // If removing active session, set to first remaining or empty
        if (activeSession === sessionId) {
            const remainingKeys = Object.keys(remainingSessions);
            updateNodeVariable(promptNodeId, 'active_session', remainingKeys[0] || '');
        }
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

    const removeUser = (userId: string) => {
        const newUsers = users.filter(id => id !== userId);
        updateNodeVariable(promptNodeId, 'user', newUsers);
        
        // If removing active user, set to first remaining or empty
        if (activeUser === userId) {
            updateNodeVariable(promptNodeId, 'active_user', newUsers[0] || '');
        }
    };

    const selectUser = (userId: string) => {
        updateNodeVariable(promptNodeId, 'active_user', userId);
    };

    // Don't show anything if no storage (warning will be shown elsewhere)
    if (!hasStorage) return null;

    return (
        <div className="border-b border-gray-200 dark:border-white/10 px-3 py-2">
            <div className="flex flex-wrap items-center gap-4">
                {/* User Management */}
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
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Add new user"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    
                    {activeUser && (
                        <button
                            onClick={() => removeUser(activeUser)}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            title="Remove current user"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

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
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title="Add new session"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    
                    {activeSession && (
                        <button
                            onClick={() => removeSession(activeSession)}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            title="Remove current session"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* New User Dialog */}
            {showNewUserDialog && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            placeholder="Enter user ID..."
                            className="flex-1 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addNewUser();
                                if (e.key === 'Escape') setShowNewUserDialog(false);
                            }}
                            autoFocus
                        />
                        <button
                            onClick={addNewUser}
                            disabled={!newUserId.trim()}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowNewUserDialog(false)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* New Session Dialog */}
            {showNewSessionDialog && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="Enter session name..."
                            className="flex-1 text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addNewSession();
                                if (e.key === 'Escape') setShowNewSessionDialog(false);
                            }}
                            autoFocus
                        />
                        <button
                            onClick={addNewSession}
                            disabled={!newSessionName.trim()}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowNewSessionDialog(false)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionUserManager;