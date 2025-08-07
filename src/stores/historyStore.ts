import {create} from 'zustand'
import useNodesStore from './nodesStore'
import useConnectionsStore from './connectionsStore'
import {Connection, Node} from "@/types/types";

// Legacy snapshot-based entry (keep for compatibility)
type HistoryEntry = {
    nodes: Node[]
    connections: Connection[]
    groupStack: string[]
    openedGroup: string | null
}

// New command interface for granular operations
export interface Command {
    execute(): void;
    undo(): void;
    getDescription(): string;
}

// Enhanced history action that supports both snapshots and commands
export interface HistoryAction {
    id: string;
    timestamp: number;
    type: 'snapshot' | 'command';
    description: string;
    data: HistoryEntry | Command;
}

type HistoryStore = {
    // Legacy state (keep for compatibility)
    history: HistoryEntry[]
    future: HistoryEntry[]
    
    // Enhanced state
    undoStack: HistoryAction[]
    redoStack: HistoryAction[]
    maxHistorySize: number
    isEnabled: boolean
    isBatching: boolean
    currentBatch: Command[]
    batchDescription: string
    
    // Legacy methods (keep for compatibility)
    save: () => void
    undo: () => void
    redo: () => void
    reset: () => void
    
    // Enhanced methods
    canUndo: () => boolean
    canRedo: () => boolean
    pushCommand: (command: Command) => void
    pushSnapshot: (description: string) => void
    
    // Batching operations
    startBatch: (description: string) => void
    endBatch: () => void
    cancelBatch: () => void
    
    // Control
    setEnabled: (enabled: boolean) => void
    getHistorySize: () => number
    getLastAction: () => HistoryAction | null
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
    // Legacy state
    history: [],
    future: [],
    
    // Enhanced state
    undoStack: [],
    redoStack: [],
    maxHistorySize: 50,
    isEnabled: true,
    isBatching: false,
    currentBatch: [],
    batchDescription: '',

    // Legacy methods (keep existing behavior intact)
    save: () => {
        const {nodes, groupStack, openedGroup} = useNodesStore.getState()
        const {connections} = useConnectionsStore.getState()
        const snapshot: HistoryEntry = {
            nodes: [...nodes],
            connections: [...connections],
            groupStack: [...groupStack],
            openedGroup
        }
        set(store => ({
            history: [...store.history, snapshot],
            future: []
        }))
    },

    undo: () => {
        const store = get()
        
        // Try enhanced undo first
        if (store.undoStack.length > 0 && store.isEnabled) {
            const action = store.undoStack[store.undoStack.length - 1];
            
            try {
                if (action.type === 'command') {
                    (action.data as Command).undo();
                } else {
                    // Handle snapshot
                    const snapshot = action.data as HistoryEntry;
                    useNodesStore.getState().initNodes(snapshot.nodes);
                    useNodesStore.getState().initGroups(snapshot.groupStack, snapshot.openedGroup);
                    useConnectionsStore.getState().initConnections(snapshot.connections);
                }
                
                // Force re-render by triggering store updates
                useNodesStore.setState({});
                useConnectionsStore.setState({});
                
                set({
                    undoStack: store.undoStack.slice(0, -1),
                    redoStack: [...store.redoStack, action]
                });
                return;
            } catch (error) {
                console.error('Enhanced undo failed:', error);
            }
        }

        // Fallback to legacy undo
        console.log("Undoing action", store.history.length, store.future.length)

        if (store.history.length === 0) return

        const previous = store.history[store.history.length - 1]

        useNodesStore.getState().initNodes(previous.nodes)
        useNodesStore.getState().initGroups(previous.groupStack, previous.openedGroup)
        useConnectionsStore.getState().initConnections(previous.connections)

        set({
            history: store.history.slice(0, -1),
            future: [previous, ...store.future]
        })
    },

    redo: () => {
        const store = get()
        
        // Try enhanced redo first
        if (store.redoStack.length > 0 && store.isEnabled) {
            const action = store.redoStack[store.redoStack.length - 1];
            
            try {
                if (action.type === 'command') {
                    (action.data as Command).execute();
                } else {
                    // Handle snapshot
                    const snapshot = action.data as HistoryEntry;
                    useNodesStore.getState().initNodes(snapshot.nodes);
                    useNodesStore.getState().initGroups(snapshot.groupStack, snapshot.openedGroup);
                    useConnectionsStore.getState().initConnections(snapshot.connections);
                }
                
                // Force re-render by triggering store updates
                useNodesStore.setState({});
                useConnectionsStore.setState({});
                
                set({
                    redoStack: store.redoStack.slice(0, -1),
                    undoStack: [...store.undoStack, action]
                });
                return;
            } catch (error) {
                console.error('Enhanced redo failed:', error);
            }
        }
        
        // Fallback to legacy redo
        if (store.future.length === 0) return

        const next = store.future[0]
        useNodesStore.getState().initNodes(next.nodes)
        useNodesStore.getState().initGroups(next.groupStack, next.openedGroup)
        useConnectionsStore.getState().initConnections(next.connections)

        set({
            history: [...store.history, next],
            future: store.future.slice(1)
        })
    },

    reset: () => set({
        history: [], 
        future: [],
        undoStack: [],
        redoStack: []
    }),

    // Enhanced methods
    canUndo: () => {
        const state = get();
        return (state.undoStack.length > 0 || state.history.length > 0) && 
               state.isEnabled && !state.isBatching;
    },

    canRedo: () => {
        const state = get();
        return (state.redoStack.length > 0 || state.future.length > 0) && 
               state.isEnabled && !state.isBatching;
    },

    pushCommand: (command: Command) => {
        const state = get();
        if (!state.isEnabled) return;

        if (state.isBatching) {
            set({
                currentBatch: [...state.currentBatch, command]
            });
            return;
        }

        const action: HistoryAction = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'command',
            description: command.getDescription(),
            data: command
        };

        const newUndoStack = [...state.undoStack, action];
        const trimmedUndoStack = newUndoStack.length > state.maxHistorySize 
            ? newUndoStack.slice(-state.maxHistorySize)
            : newUndoStack;

        set({
            undoStack: trimmedUndoStack,
            redoStack: [] // Clear redo stack
        });
    },

    pushSnapshot: (description: string) => {
        const state = get();
        if (!state.isEnabled) return;

        const {nodes, groupStack, openedGroup} = useNodesStore.getState();
        const {connections} = useConnectionsStore.getState();
        
        const snapshot: HistoryEntry = {
            nodes: [...nodes],
            connections: [...connections],
            groupStack: [...groupStack],
            openedGroup
        };

        const action: HistoryAction = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'snapshot',
            description,
            data: snapshot
        };

        const newUndoStack = [...state.undoStack, action];
        const trimmedUndoStack = newUndoStack.length > state.maxHistorySize 
            ? newUndoStack.slice(-state.maxHistorySize)
            : newUndoStack;

        set({
            undoStack: trimmedUndoStack,
            redoStack: [] // Clear redo stack
        });
    },

    // Batching operations
    startBatch: (description: string) => {
        set({
            isBatching: true,
            currentBatch: [],
            batchDescription: description
        });
    },

    endBatch: () => {
        const state = get();
        if (!state.isBatching) return;

        if (state.currentBatch.length > 0) {
            // Create a batch command
            const batchCommand: Command = {
                execute: () => {
                    state.currentBatch.forEach(cmd => cmd.execute());
                },
                undo: () => {
                    state.currentBatch.slice().reverse().forEach(cmd => cmd.undo());
                },
                getDescription: () => state.batchDescription
            };

            const action: HistoryAction = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'command',
                description: state.batchDescription,
                data: batchCommand
            };

            const newUndoStack = [...state.undoStack, action];
            const trimmedUndoStack = newUndoStack.length > state.maxHistorySize 
                ? newUndoStack.slice(-state.maxHistorySize)
                : newUndoStack;

            set({
                undoStack: trimmedUndoStack,
                redoStack: [],
                isBatching: false,
                currentBatch: [],
                batchDescription: ''
            });
        } else {
            set({
                isBatching: false,
                currentBatch: [],
                batchDescription: ''
            });
        }
    },

    cancelBatch: () => {
        set({
            isBatching: false,
            currentBatch: [],
            batchDescription: ''
        });
    },

    // Control
    setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled });
    },

    getHistorySize: () => {
        const state = get();
        return state.undoStack.length + state.history.length;
    },

    getLastAction: () => {
        const state = get();
        return state.undoStack[state.undoStack.length - 1] || null;
    }
}))