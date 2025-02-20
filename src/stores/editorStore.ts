import {create} from 'zustand';
import {FormType, NodeVariable} from "@/types/types";

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

    editingRouteVersions: { [routeId: string]: string };
    setEditingRouteVersion: (routeId: string, versionId: string) => void;

    editingScheduleVersions: { [scheduleId: string]: string };
    setEditingScheduleVersion: (scheduleId: string, versionId: string) => void;
};

const useEditorStore = create<EditorState>((set, get) => ({
    zoomFactor: 1,
    setZoomFactor: (factor) => set({zoomFactor: factor}),
    panPosition: {x: 200, y: 200},
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

    openForm: (type: FormType, formEditRecordId: null | string = null, variable?: NodeVariable | null) => set({
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
}));

export default useEditorStore;