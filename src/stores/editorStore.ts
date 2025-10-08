import {create} from 'zustand';
import {Connection, EditorMode, FormType, Fundamental, Node, NodeVariable, Package} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {gatherAllIds, replaceIdsInJsonString, unpackNode} from "@/utils/packageGroupNode";
import { getConnectionExecutionDetails } from "@/api/executionApi";
import useMockStore from "@/stores/mockStore";
// import usePendingChangesStore from "@/stores/pendingChangesStore";

export enum BottomBarView {
    Output = 'Output',
    Debug = 'Debug',
    Info = 'Info',
    Files = 'Files',
}

export type ContextMenu = {
    visible: boolean;
    x: number;
    y: number;
    items: Array<{ label: string; action: () => void }>;
};

// Background execution moved to runsStore.ts

export type EditorState = {
    zoomFactor: number;
    setZoomFactor: (factor: number) => void;
    panPosition: { x: number; y: number };
    setPanPosition: (position: { x: number; y: number }) => void;

    zoomFactorByVersion: Record<string, number>;
    panPositionsByVersion: Record<string, { x: number; y: number }>;

    setZoomFactorForVersion: (zoom: number) => void;
    getZoomFactorForVersion: () => number;
    setPanPositionForVersion: (position: { x: number; y: number }) => void;
    getPanPositionForVersion: () => { x: number; y: number };

    isPanning: boolean;
    isZooming: boolean;
    setIsPanning: (isPanning: boolean) => void;
    setIsZooming: (isZooming: boolean) => void;

    // Editor store native
    debugBarAvailable: boolean;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    isDrawingConnection: string;
    setIsDrawingConnection: (drawing: string) => void;
    showForm: boolean;
    formType: FormType | null;
    formEditRecordId: string | null | undefined | object;
    formEditVariable?: NodeVariable | null;
    isFormOpen: () => boolean;
    openForm: (type: FormType, formEditRecordId?: null | string | object, variable?: NodeVariable) => void;
    closeForm: (closeFormMessage?: string | null) => void;
    closeFormMessage?: string | null;
    editorPosition: { x: number; y: number };
    setEditorPosition: (position: { x: number; y: number }) => void;
    mousePosition: { x: number; y: number };
    setMousePosition: (position: { x: number; y: number }) => void;
    selectedNodes: string[];
    setSelectedNodes: (nodes: string[]) => void;
    shiftSelectMore: boolean;
    setShiftSelectMore: (shiftSelectMore: boolean) => void;
    controlDeselectOne: boolean;
    setControlDeselectOne: (controlDeselectOne: boolean) => void;
    bottomBarView: BottomBarView;
    setBottomBarView: (view: BottomBarView) => void;
    contextMenu: ContextMenu;
    openContextMenu: (x: number, y: number, items: Array<{ label: string; action: () => void }>) => void;
    closeContextMenu: () => void;

    // Editor mode
    editorMode: EditorMode;
    previousEditorMode: EditorMode;
    setEditorMode: (mode: EditorMode) => void;
    setEditorModeWithMemory: (mode: EditorMode) => void;

    deleteNodesDialogOpen: boolean;
    setDeleteNodesDialogOpen: (isOpen: boolean) => void;
    
    deleteConnectionDialogOpen: boolean;
    selectedConnectionId: string | null;
    setDeleteConnectionDialogOpen: (isOpen: boolean, connectionId?: string) => void;
    addingNode: string | null;
    setAddingNode: (nodeId: string | null) => void;
    showAddingNode: boolean;
    setShowAddingNode: (show: boolean) => void;
    activeProjectId: string;
    setActiveProjectId: (projectId: string) => void;
    activeRouteId?: string;
    setActiveRouteId: (routeId: string) => void;
    activeScheduleId?: string;
    setActiveScheduleId: (scheduleId: string) => void;
    activeChatWindowId?: string;
    setActiveChatWindowId: (chatWindowId: string) => void;
    chatWindowPermissions?: {
        can_view_flow: boolean;
        can_view_output: boolean;
        show_response_transparency: boolean;
    } | null;
    setChatWindowPermissions: (permissions: {
        can_view_flow: boolean;
        can_view_output: boolean;
        show_response_transparency: boolean;
    } | null) => void;
    isReadOnly: boolean;
    setIsReadOnly: (isReadOnly: boolean) => void;
    // /chat route specific UI state (NOT for Chat mode)
    chatSessionsSidebarCollapsed: boolean;
    setChatSessionsSidebarCollapsed: (collapsed: boolean) => void;
    chatEditorCollapsed: boolean;
    setChatEditorCollapsed: (collapsed: boolean) => void;
    chatOutputCollapsed: boolean;
    setChatOutputCollapsed: (collapsed: boolean) => void;
    activeServiceId: string;
    setActiveServiceId: (serviceId: string) => void;
    activeConfigId: string;
    setActiveConfigId: (configId: string) => void;
    activeBlueprintId: string;
    setActiveBlueprintId: (blueprintId: string) => void;
    activeVersionId?: string;
    setActiveVersionId: (versionId: string) => void;
    
    // Historical run navigation
    selectedRunId?: string;
    isViewingHistoricalRun: boolean;
    setSelectedRunId: (runId: string) => void;
    clearSelectedRunId: () => void;
    loadHistoricalRunData: (runId: string) => Promise<void>;
    
    // Simple accordion clear for 'c' key
    clearAccordionAndMockData: () => void;
    
    activeProjectVariableId?: string;
    setActiveProjectVariableId: (projectVariableId: string) => void;

    treeOpen: Fundamental[];
    openTree: (tree: Fundamental) => void;
    closeTree: (tree: Fundamental) => void;
    isTreeOpen: (tree: Fundamental) => boolean;

    isSaving: boolean;
    setIsSaving: (isSaving: boolean) => void;
    forceSave: (() => Promise<void>) | null;
    setForceSave: (forceSave: (() => Promise<void>) | null) => void;

    // CRITICAL: Autosave control flags for safe node setup switching
    autosaveEnabled: boolean;
    setAutosaveEnabled: (enabled: boolean) => void;
    hasLoadedOnce: boolean;
    setHasLoadedOnce: (loaded: boolean) => void;

    isDraft: boolean;
    setIsDraft: (isDraft: boolean) => void;

    isPublished: boolean;
    setIsPublished: (isPublished: boolean) => void;

    showDocs: boolean;
    docsMarkdown: string,
    openDocs: (markdown: string) => void;
    closeDocs: () => void;

    editingRouteVersions: { [routeId: string]: string };
    setEditingRouteVersion: (routeId: string, versionId: string) => void;

    editingScheduleVersions: { [scheduleId: string]: string };
    setEditingScheduleVersion: (scheduleId: string, versionId: string) => void;

    copiedPackage: Package | null;
    setCopiedPackage: (pkg: Package | null) => void;
    copySelectedNodes: () => void;
    isPasting: boolean;
    setIsPasting: (isPasting: boolean) => void;
    pastedNodeIds: string[];
    setPastedNodeIds: (nodeIds: string[]) => void;
    pasteNodes: () => string[];

    nodeToMoveToGroupId: string | null,
    setNodeToMoveToGroupId: (id: string | null) => void;

    isExecuting: string | null;
    setIsExecuting: (isExecuting: string | null) => void;
    
    // Note: activeRunId moved to runsStore.ts for better separation of concerns

    chatMode: boolean;
    setChatMode: (chatMode: boolean) => void;

    isLoadingFlow: boolean;
    setIsLoadingFlow: (isLoading: boolean) => void;

    hasAutoFitted: Record<string, boolean>;

    setHasAutoFitted(setupId: string, value: boolean): void;
    getHasAutoFitted(setupId: string): boolean;

    visibleNodeCount: number;
    setVisibleNodeCount: (count: number) => void;
};

const useEditorStore = create<EditorState>((set, get) => ({
    debugBarAvailable: true,

    isExecuting: null,
    setIsExecuting: (isExecuting) => set({isExecuting: isExecuting}),
    
    chatMode: false,
    setChatMode: (chatMode) => set({chatMode: chatMode}),
    
    isLoadingFlow: false,
    setIsLoadingFlow: (isLoading) => set({isLoadingFlow: isLoading}),

    zoomFactor: .75,
    setZoomFactor: (factor) => set({zoomFactor: factor}),
    panPosition: {x: 100, y: 100},
    setPanPosition: (position) => set({panPosition: position}),

    zoomFactorByVersion: {},
    panPositionsByVersion: {},

    setZoomFactorForVersion: (zoom: number) => {
        const versionId = get().activeVersionId;
        if (!versionId) return;
        set((state) => ({
            zoomFactorByVersion: {
                ...state.zoomFactorByVersion,
                [versionId]: zoom,
            },
        }));
    },

    getZoomFactorForVersion: () => {
        const {zoomFactorByVersion, zoomFactor, activeVersionId} = get();
        return activeVersionId ? zoomFactorByVersion[activeVersionId] ?? zoomFactor : zoomFactor;
    },

    setPanPositionForVersion: (position: { x: number; y: number }) => {
        const versionId = get().activeVersionId;
        if (!versionId) return;
        set((state) => ({
            panPositionsByVersion: {
                ...state.panPositionsByVersion,
                [versionId]: position,
            },
        }));
    },

    getPanPositionForVersion: () => {
        const {panPositionsByVersion, panPosition, activeVersionId} = get();
        return activeVersionId ? panPositionsByVersion[activeVersionId] ?? panPosition : panPosition;
    },

    isDragging: false,
    setIsDragging: (dragging) => set({isDragging: dragging}),
    isZooming: false,
    setIsZooming: (zooming) => set({isZooming: zooming}),
    isPanning: false,
    setIsPanning: (isPanning) => set({isPanning: isPanning}),
    showForm: false,
    formType: null,
    formEditVariable: null,
    formEditRecordId: null,

    nodeToMoveToGroupId: null,
    setNodeToMoveToGroupId: (id) => set({nodeToMoveToGroupId: id}),

    activeProjectId: '',
    setActiveProjectId: (projectId: string) => set({activeProjectId: projectId}),
    activeRouteId: '',
    setActiveRouteId: (routeId: string) => set({activeRouteId: routeId}),
    activeScheduleId: '',
    setActiveScheduleId: (scheduleId: string) => set({activeScheduleId: scheduleId}),
    activeChatWindowId: '',
    setActiveChatWindowId: (chatWindowId: string) => set({activeChatWindowId: chatWindowId}),
    chatWindowPermissions: null,
    setChatWindowPermissions: (permissions) => set({chatWindowPermissions: permissions}),
    isReadOnly: false,
    setIsReadOnly: (isReadOnly: boolean) => set({isReadOnly}),
    // /chat route specific UI state
    chatSessionsSidebarCollapsed: false,
    setChatSessionsSidebarCollapsed: (collapsed: boolean) => set({chatSessionsSidebarCollapsed: collapsed}),
    chatEditorCollapsed: false,
    setChatEditorCollapsed: (collapsed: boolean) => set({chatEditorCollapsed: collapsed}),
    chatOutputCollapsed: false,
    setChatOutputCollapsed: (collapsed: boolean) => set({chatOutputCollapsed: collapsed}),
    activeServiceId: '',
    setActiveServiceId: (serviceId: string) => set({activeServiceId: serviceId}),
    activeConfigId: '',
    setActiveConfigId: (configId: string) => set({activeConfigId: configId}),
    activeBlueprintId: '',
    setActiveBlueprintId: (blueprintId: string) => set({activeBlueprintId: blueprintId}),

    activeVersionId: '',
    setActiveVersionId: (versionId: string) => set({activeVersionId: versionId}),
    
    // Historical run navigation
    selectedRunId: undefined,
    isViewingHistoricalRun: false,
    setSelectedRunId: (runId: string) => set({selectedRunId: runId, isViewingHistoricalRun: true}),
    clearSelectedRunId: () => {
        // Clear historical run state
        set({selectedRunId: undefined, isViewingHistoricalRun: false});
        
        // Clear mock data when returning to live mode
        useMockStore.getState().setHasMockData(false);
        useMockStore.getState().setMockConnections([]);
        
        // Clear execution state from nodes
        const elements = document.querySelectorAll('[data-node-id]');
        elements.forEach((el) => {
            el.classList.remove('executing', 'executed-success', 'executed-killed', 'executed-error');
        });
    },
    loadHistoricalRunData: async (runId: string) => {
        const { activeVersionId } = get();
        if (!activeVersionId) return;

        try {
            // Load connection data for the historical run
            const connectionData = await getConnectionExecutionDetails(activeVersionId, runId);
            
            // Update mock store with historical connection data
            useMockStore.getState().setMockConnections(connectionData);
            useMockStore.getState().setHasMockData(true);
            
            // Clear any execution CSS classes - historical runs rely only on React component visual states
            const elements = document.querySelectorAll('[data-node-id]');
            elements.forEach((el) => {
                el.classList.remove('executing', 'executed-success', 'executed-killed', 'executed-error');
            });
            // All visual feedback for historical runs comes from useNodeColor hook via React components

        } catch (error) {
            console.error('Failed to load historical run data:', error);
        }
    },
    
    // Simple clear function for 'c' key
    clearAccordionAndMockData: () => {
        // Clear selection state so accordion closes
        set({selectedRunId: undefined, isViewingHistoricalRun: false});
        
        // Clear mock data and visual states
        useMockStore.getState().clearMockStore();
        
        // Clear visual states from nodes
        const elements = document.querySelectorAll('[data-node-id]');
        elements.forEach((el) => {
            el.classList.remove('executing', 'executed-success', 'executed-killed', 'executed-error');
        });
        
        // Close accordion and reset execution state
        window.dispatchEvent(new CustomEvent('close-accordion-and-reset'));
    },
    
    activeProjectVariableId: '',
    setActiveProjectVariableId: (projectVariableId: string) => set({activeProjectVariableId: projectVariableId}),

    treeOpen: [Fundamental.Route, Fundamental.Schedule, Fundamental.Blueprint],
    openTree: (tree) => set((state) => {
        if (state.treeOpen.includes(tree)) {
            return state;
        }
        return {treeOpen: [...state.treeOpen, tree]};
    }),
    closeTree: (tree) => set((state) => {
        if (!state.treeOpen.includes(tree)) {
            return state;
        }
        return {treeOpen: state.treeOpen.filter((t) => t !== tree)};
    }),
    isTreeOpen: (tree) => get().treeOpen.includes(tree),

    isSaving: false,
    setIsSaving: (isSaving) => set({isSaving: isSaving}),
    forceSave: null,
    setForceSave: (forceSave) => set({forceSave}),

    // CRITICAL: Default autosave OFF to prevent saves during initial load
    autosaveEnabled: false,
    setAutosaveEnabled: (enabled) => {
        console.log(`${enabled ? '✅ AUTOSAVE ENABLED' : '🔒 AUTOSAVE DISABLED'}`);
        set({autosaveEnabled: enabled});
    },
    hasLoadedOnce: false,
    setHasLoadedOnce: (loaded) => set({hasLoadedOnce: loaded}),

    isDraft: false,
    setIsDraft: (isDraft) => set({isDraft: isDraft}),

    isPublished: false,
    setIsPublished: (isPublished) => set({isPublished: isPublished}),

    showDocs: false,
    docsMarkdown: '',

    openDocs: (markdown: string) => set({
        showDocs: true,
        docsMarkdown: markdown,
    }),

    closeDocs: () => set({
        showDocs: false,
        docsMarkdown: '',
    }),

    isFormOpen: () => get().showForm,

    openForm: (
        type: FormType,
        formEditRecordId: null | string | object = null,
        variable?: NodeVariable | null
    ) => set({
        showForm: true,
        formType: type,
        formEditRecordId: formEditRecordId,
        formEditVariable: variable ?? null
    }),

    closeForm: (closeFormMessage?: string | null) => {
        set({
            showForm: false,
            formType: null,
            formEditRecordId: null,
            formEditVariable: null,
            closeFormMessage: closeFormMessage
        });

        if (closeFormMessage) {
            setTimeout(() => {
                set({closeFormMessage: null});
            }, 5000);
        }
    },
    closeFormMessage: null,
    isDrawingConnection: '',
    setIsDrawingConnection: (drawing: string) => set({isDrawingConnection: drawing}),
    editorPosition: {x: 0, y: 0},
    setEditorPosition: (position) => set({editorPosition: position}),
    mousePosition: {x: 0, y: 0},
    setMousePosition: (position) => set({mousePosition: position}),
    selectedNodes: [],
    setSelectedNodes: (nodes) => set({selectedNodes: nodes}),
    shiftSelectMore: false,
    setShiftSelectMore: (shiftSelectMore) => set({shiftSelectMore: shiftSelectMore}),
    controlDeselectOne: false,
    setControlDeselectOne: (controlDeselectOne) => set({controlDeselectOne: controlDeselectOne}),
    bottomBarView: BottomBarView.Output,
    setBottomBarView: (view) => set({bottomBarView: view}),
    contextMenu: {visible: false, x: 0, y: 0, items: []},
    openContextMenu: (x, y, items) =>
        set({contextMenu: {visible: true, x, y, items}}),
    closeContextMenu: () =>
        set({contextMenu: {visible: false, x: 0, y: 0, items: []}}),
    deleteNodesDialogOpen: false,
    setDeleteNodesDialogOpen: (isOpen) => set({deleteNodesDialogOpen: isOpen}),
    
    deleteConnectionDialogOpen: false,
    selectedConnectionId: null,
    setDeleteConnectionDialogOpen: (isOpen, connectionId) => set({
        deleteConnectionDialogOpen: isOpen,
        selectedConnectionId: connectionId || null
    }),
    addingNode: null,
    setAddingNode: (nodeId: string | null) => set({addingNode: nodeId}),
    showAddingNode: false,
    setShowAddingNode: (show: boolean) => set({showAddingNode: show}),

    editingRouteVersions: {},
    setEditingRouteVersion: (routeId, versionId) =>
        set((state) => ({
            editingRouteVersions: {
                ...state.editingRouteVersions,
                [routeId]: versionId,
            },
        })),

    editingScheduleVersions: {},
    setEditingScheduleVersion: (scheduleId, versionId) =>
        set((state) => ({
            editingScheduleVersions: {
                ...state.editingScheduleVersions,
                [scheduleId]: versionId,
            },
        })),

    copiedPackage: null,
    setCopiedPackage: (pkg) => set({copiedPackage: pkg}),

    copySelectedNodes: () => {
        const selectedNodeIds = get().selectedNodes;
        if (selectedNodeIds.length === 0) return;

        const nestedNodes = useNodesStore
            .getState()
            .getAllNestedNodesByIds(selectedNodeIds);

        const nestedNodeIds = new Set(nestedNodes.map(node => node.id));

        const uniqueConnectionsMap = new Map<string, Connection>();
        nestedNodes.forEach((node) => {
            const inConnections = useConnectionsStore
                .getState()
                .findInConnectionsByNodeId(node.id);
            const outConnections = useConnectionsStore
                .getState()
                .findOutConnectionsByNodeId(node.id);

            [...inConnections, ...outConnections].forEach((connection) => {
                const hasValidSource = nestedNodeIds.has(connection.sourceNodeId);
                const hasValidTarget = connection.targetNodeId ? nestedNodeIds.has(connection.targetNodeId) : true;

                if (hasValidSource && hasValidTarget) {
                    uniqueConnectionsMap.set(connection.id, connection);
                }
            });
        });

        const connections = Array.from(uniqueConnectionsMap.values());

        const packageData = {
            nodes: nestedNodes,
            connections
        };

        const ids = gatherAllIds(packageData);
        const idMap: { [id: string]: string } = {};
        let count = 1;
        ids.forEach((id) => {
            idMap[id] = `{uuid-${count++}}`;
        });

        const packagedData = replaceIdsInJsonString(packageData, idMap);

        set({copiedPackage: packagedData});
    },

    editorMode: EditorMode.Select,
    previousEditorMode: EditorMode.Select,
    setEditorMode: (mode: EditorMode) => set({editorMode: mode}),
    setEditorModeWithMemory: (mode: EditorMode) => set((state) => {
        if (state.editorMode === EditorMode.Pan) {
            return {}; // blijf in pan, niet opnieuw switchen
        }

        return {
            previousEditorMode: state.editorMode,
            editorMode: mode,
        };
    }),

    isPasting: false,
    setIsPasting: (isPasting) => set({isPasting: isPasting}),

    pastedNodeIds: [],
    setPastedNodeIds: (nodeIds) => set({pastedNodeIds: nodeIds}),

    pasteNodes: (): string[] => {
        let copiedPackage = get().copiedPackage;
        if (!copiedPackage) return [];

        copiedPackage = unpackNode(copiedPackage);

        copiedPackage.nodes.forEach((node: Node) => {
            useNodesStore.getState().addNode(node, false);
        });

        if (copiedPackage.connections) {
            copiedPackage.connections.forEach((connection: Connection) => {
                useConnectionsStore.getState().addConnection(connection);
            });
        }

        const pastedNodeIds = copiedPackage.nodes.map((node) => node.id);
        set({
            selectedNodes: pastedNodeIds,
            pastedNodeIds,
            isPasting: true
        });

        const openGroup = useNodesStore.getState().openedGroup;

        if (openGroup) {
            pastedNodeIds.map((nodeId) => {
                useNodesStore.getState().addNodeToGroup(openGroup, nodeId);
            });
        }

        return pastedNodeIds;
    },

    hasAutoFitted: {},
    setHasAutoFitted: (setupId: string, value: boolean) => set((state) => ({
        hasAutoFitted: {
            ...state.hasAutoFitted,
            [setupId]: value,
        },
    })),
    getHasAutoFitted: (setupId: string) => get().hasAutoFitted[setupId] || false,

    visibleNodeCount: 0,
    setVisibleNodeCount: (count) => set({visibleNodeCount: count})
}));


export default useEditorStore;