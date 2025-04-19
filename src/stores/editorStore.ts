import {create} from 'zustand';
import {Connection, EditorMode, FormType, Fundamental, Node, NodeVariable, Package} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import useConnectionsStore from "@/stores/connectionsStore";
import {gatherAllIds, replaceIdsInJsonString, unpackNode} from "@/utils/packageGroupNode";

export enum BottomBarView {
    Output = 'Output',
    Debug = 'Debug',
    Logs = 'Logs',
}

export type ContextMenu = {
    visible: boolean;
    x: number;
    y: number;
    items: Array<{ label: string; action: () => void }>;
};

type EditorState = {
    // Nominee for a "per node setup" basis
    zoomFactor: number;
    setZoomFactor: (factor: number) => void;
    panPosition: { x: number; y: number };
    setPanPosition: (position: { x: number; y: number }) => void;
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
    formEditRecordId: string | null | undefined;
    formEditVariable?: NodeVariable | null;
    isFormOpen: () => boolean;
    openForm: (type: FormType, formEditRecordId?: null | string, variable?: NodeVariable) => void;
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
    activeServiceId: string;
    setActiveServiceId: (serviceId: string) => void;
    activeConfigId: string;
    setActiveConfigId: (configId: string) => void;
    activeBlueprintId: string;
    setActiveBlueprintId: (blueprintId: string) => void;
    activeVersionId?: string;
    setActiveVersionId: (versionId: string) => void;
    activeProjectVariableId?: string;
    setActiveProjectVariableId: (projectVariableId: string) => void;

    treeOpen: Fundamental[];
    openTree: (tree: Fundamental) => void;
    closeTree: (tree: Fundamental) => void;
    isTreeOpen: (tree: Fundamental) => boolean;

    isSaving: boolean;
    setIsSaving: (isSaving: boolean) => void;

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
};

const useEditorStore = create<EditorState>((set, get) => ({
    debugBarAvailable: true,

    zoomFactor: .75,
    setZoomFactor: (factor) => set({zoomFactor: factor}),
    panPosition: {x: 100, y: 100},
    setPanPosition: (position) => set({panPosition: position}),
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
    activeServiceId: '',
    setActiveServiceId: (serviceId: string) => set({activeServiceId: serviceId}),
    activeConfigId: '',
    setActiveConfigId: (configId: string) => set({activeConfigId: configId}),
    activeBlueprintId: '',
    setActiveBlueprintId: (blueprintId: string) => set({activeBlueprintId: blueprintId}),

    activeVersionId: '',
    setActiveVersionId: (versionId: string) => set({activeVersionId: versionId}),
    activeProjectVariableId: '',
    setActiveProjectVariableId: (projectVariableId: string) => set({activeProjectVariableId: projectVariableId}),

    treeOpen: [Fundamental.Route, Fundamental.Schedule],
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
        formEditRecordId: null | string = null,
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
    setEditorMode: (mode: EditorMode) => set({ editorMode: mode }),
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
            useNodesStore.getState().addNode(node, true);
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
}));

export default useEditorStore;