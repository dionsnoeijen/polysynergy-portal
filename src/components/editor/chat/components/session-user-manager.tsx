import React, {useState, useMemo} from "react";
import {PlusIcon, TrashIcon, CheckIcon, XMarkIcon} from "@heroicons/react/24/outline";
import useNodesStore from "@/stores/nodesStore";
import {Input} from "@/components/input";
import {Button} from "@/components/button";

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
                    
                    <Button
                        onClick={() => setShowNewUserDialog(true)}
                        color="outline"
                        title="Add new user"
                        className="!px-1.5 !py-1.5 !text-xs"
                    >
                        <PlusIcon data-slot="icon" className="w-4 h-4" />
                    </Button>
                    
                    {activeUser && (
                        <Button
                            onClick={() => removeUser(activeUser)}
                            color="outline"  
                            title="Remove current user"
                            className="!px-1.5 !py-1.5 !text-xs !text-red-600 dark:!text-red-400 hover:!text-red-700 dark:hover:!text-red-300 hover:!border-red-300 dark:hover:!border-red-600"
                        >
                            <TrashIcon data-slot="icon" className="w-4 h-4" />
                        </Button>
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
                    
                    <Button
                        onClick={() => setShowNewSessionDialog(true)}
                        color="outline"
                        title="Add new session"
                        className="!px-1.5 !py-1.5 !text-xs"
                    >
                        <PlusIcon data-slot="icon" className="w-4 h-4" />
                    </Button>
                    
                    {activeSession && (
                        <Button
                            onClick={() => removeSession(activeSession)}
                            color="outline"
                            title="Remove current session"
                            className="!px-1.5 !py-1.5 !text-xs !text-red-600 dark:!text-red-400 hover:!text-red-700 dark:hover:!text-red-300 hover:!border-red-300 dark:hover:!border-red-600"
                        >
                            <TrashIcon data-slot="icon" className="w-4 h-4" />
                        </Button>
                    )}
                </div>
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
                        <Button
                            onClick={addNewUser}
                            disabled={!newUserId.trim()}
                            title="Add user"
                            className="!px-2 !py-1"
                        >
                            <CheckIcon data-slot="icon" className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => setShowNewUserDialog(false)}
                            color="outline"
                            title="Cancel"
                            className="!px-2 !py-1"
                        >
                            <XMarkIcon data-slot="icon" className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* New Session Dialog */}
            {showNewSessionDialog && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            placeholder="Enter session name..."
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addNewSession();
                                if (e.key === 'Escape') setShowNewSessionDialog(false);
                            }}
                            autoFocus
                            autoComplete="new-password"
                            data-form-type="other"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            name="session-label"
                            role="textbox"
                        />
                        <Button
                            onClick={addNewSession}
                            disabled={!newSessionName.trim()}
                            title="Add session"
                            className="!px-2 !py-1"
                        >
                            <CheckIcon data-slot="icon" className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => setShowNewSessionDialog(false)}
                            color="outline"
                            title="Cancel"
                            className="!px-2 !py-1"
                        >
                            <XMarkIcon data-slot="icon" className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionUserManager;