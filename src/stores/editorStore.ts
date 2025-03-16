import {create} from 'zustand';
import {Connection, FormType, Node, NodeVariable, Package} from "@/types/types";
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
    debugBarAvailable: boolean;
    zoomFactor: number;
    setZoomFactor: (factor: number) => void;
    panPosition: { x: number; y: number };
    setPanPosition: (position: { x: number; y: number }) => void;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    isDrawingConnection: string;
    setIsDrawingConnection: (drawing: string) => void;
    showForm: boolean;
    formType: FormType | null;
    formEditRecordId: string | null;
    formEditVariable?: NodeVariable | null;
    openForm: (type: FormType, formEditRecordId?: null | string, variable?: NodeVariable) => void;
    closeForm: (closeFormMessage?: string | null) => void;
    closeFormMessage?: string | null;
    editorPosition: { x: number; y: number };
    setEditorPosition: (position: { x: number; y: number }) => void;
    mousePosition: { x: number; y: number };
    setMousePosition: (position: { x: number; y: number }) => void;
    selectedNodes: string[];
    setSelectedNodes: (nodes: string[]) => void;
    clickSelect: boolean;
    setClickSelect: (clickSelect: boolean) => void;
    shiftSelectMore: boolean;
    setShiftSelectMore: (shiftSelectMore: boolean) => void;
    controlDeselectOne: boolean;
    setControlDeselectOne: (controlDeselectOne: boolean) => void;
    boxSelect: boolean;
    setBoxSelect: (boxSelect: boolean) => void;
    bottomBarView: BottomBarView;
    setBottomBarView: (view: BottomBarView) => void;
    contextMenu: ContextMenu;
    openContextMenu: (x: number, y: number, items: Array<{ label: string; action: () => void }>) => void;
    closeContextMenu: () => void;
    groupStack: string[];
    openGroup: string | null;
    setOpenGroup: (groupId: string | null) => void;
    closeGroup: () => void;
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
    activeBlueprintId: string;
    setActiveBlueprintId: (blueprintId: string) => void;
    activeVersionId?: string;
    setActiveVersionId: (versionId: string) => void;
    activeProjectVariableId?: string;
    setActiveProjectVariableId: (projectVariableId: string) => void;

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
};

const useEditorStore = create<EditorState>((set, get) => ({
    debugBarAvailable: true,

    zoomFactor: .75,
    setZoomFactor: (factor) => set({zoomFactor: factor}),
    panPosition: {x: 0, y: 100},
    setPanPosition: (position) => set({panPosition: position}),
    isDragging: false,
    setIsDragging: (dragging) => set({isDragging: dragging}),
    showForm: false,
    formType: null,
    formEditVariable: null,
    formEditRecordId: null,

    activeProjectId: '',
    setActiveProjectId: (projectId: string) => set({activeProjectId: projectId}),
    activeRouteId: '',
    setActiveRouteId: (routeId: string) => set({activeRouteId: routeId}),
    activeScheduleId: '',
    setActiveScheduleId: (scheduleId: string) => set({activeScheduleId: scheduleId}),
    activeServiceId: '',
    setActiveServiceId: (serviceId: string) => set({activeServiceId: serviceId}),
    activeBlueprintId: '',
    setActiveBlueprintId: (blueprintId: string) => set({activeBlueprintId: blueprintId}),
    activeVersionId: '',
    setActiveVersionId: (versionId: string) => set({activeVersionId: versionId}),
    activeProjectVariableId: '',
    setActiveProjectVariableId: (projectVariableId: string) => set({activeProjectVariableId: projectVariableId}),

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
    clickSelect: true,
    setClickSelect: (clickSelect) => set({clickSelect: clickSelect}),
    shiftSelectMore: false,
    setShiftSelectMore: (shiftSelectMore) => set({shiftSelectMore: shiftSelectMore}),
    controlDeselectOne: false,
    setControlDeselectOne: (controlDeselectOne) => set({controlDeselectOne: controlDeselectOne}),
    boxSelect: false,
    setBoxSelect: (boxSelect) => set({boxSelect: boxSelect}),
    bottomBarView: BottomBarView.Output,
    setBottomBarView: (view) => set({bottomBarView: view}),
    contextMenu: {visible: false, x: 0, y: 0, items: []},
    openContextMenu: (x, y, items) =>
        set({contextMenu: {visible: true, x, y, items}}),
    closeContextMenu: () =>
        set({contextMenu: {visible: false, x: 0, y: 0, items: []}}),
    groupStack: [],
    openGroup: null,
    setOpenGroup: (groupId: string | null) => {
        const {groupStack} = get();
        if (groupId) {
            if (groupStack[groupStack.length - 1] !== groupId) {
                set((state) => ({
                    groupStack: [...state.groupStack, groupId],
                    openGroup: groupId,
                }));
            }
        } else {
            set({
                groupStack: [],
                openGroup: null,
            });
        }
    },
    closeGroup: () => {
        const {groupStack} = get();
        if (groupStack.length > 0) {
            const newStack = [...groupStack];
            newStack.pop();
            set({
                groupStack: newStack,
                openGroup: newStack.length > 0 ? newStack[newStack.length - 1] : null,
            });
        }
    },
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
            const inConnections = useConnectionsStore.getState().findInConnectionsByNodeId(node.id);
            const outConnections = useConnectionsStore.getState().findOutConnectionsByNodeId(node.id);

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

    isPasting: false,
    setIsPasting: (isPasting) => set({isPasting: isPasting}),

    pastedNodeIds: [],
    setPastedNodeIds: (nodeIds) => set({ pastedNodeIds: nodeIds }),

    pasteNodes: (): string[] => {
        let copiedPackage = get().copiedPackage;
        if (!copiedPackage) return [];

        copiedPackage = unpackNode(copiedPackage);

        copiedPackage.nodes.forEach((node: Node) => {
            useNodesStore.getState().addNode(node);
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

        return pastedNodeIds;
    },
}));

export default useEditorStore;