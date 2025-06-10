import {create} from 'zustand'
import useNodesStore from './nodesStore'
import useConnectionsStore from './connectionsStore'
import {Connection, Node} from "@/types/types";

type HistoryEntry = {
    nodes: Node[]
    connections: Connection[]
    groupStack: string[]
    openedGroup: string | null
}

type HistoryStore = {
    history: HistoryEntry[]
    future: HistoryEntry[]
    save: () => void
    undo: () => void
    redo: () => void
    reset: () => void
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
    history: [],
    future: [],

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

    reset: () => set({history: [], future: []})
}))