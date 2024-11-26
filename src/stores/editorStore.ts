import { create } from 'zustand';
import { FormType } from "@/types/types";

export enum BottomBarView {
    Output = 'Output',
    Debug = 'Debug'
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
    activeProjectId: string;
    setActiveProjectId: (projectId: string) => void;
    activeRouteId: string;
    setActiveRouteId: (routeId: string) => void;
    openForm: (type: FormType, formEditRecordId?: null | string) => void;
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
    openGroup: string | null;
    setOpenGroup: (groupId: string | null) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
    zoomFactor: 1,
    setZoomFactor: (factor) => set({ zoomFactor: factor }),
    panPosition: { x: 0, y: 0 },
    setPanPosition: (position) => set({ panPosition: position }),
    isDragging: false,
    setIsDragging: (dragging) => set({ isDragging: dragging }),
    showForm: false,
    formType: null,
    formEditRecordId: null,
    activeProjectId: '',
    setActiveProjectId: (projectId: string) => set({ activeProjectId: projectId }),
    activeRouteId: '',
    setActiveRouteId: (routeId: string) => set({ activeRouteId: routeId }),
    openForm: (type: FormType, formEditRecordId: null | string = null) => set({
        showForm: true,
        formType: type,
        formEditRecordId: formEditRecordId
    }),
    closeForm: (closeFormMessage?: string | null) => {
        set({ showForm: false, formType: null, closeFormMessage: closeFormMessage });

        if (closeFormMessage) {
            setTimeout(() => {
                set({ closeFormMessage: null });
            }, 5000);
        }
    },
    closeFormMessage: null,
    isDrawingConnection: '',
    setIsDrawingConnection: (drawing: string) => set({ isDrawingConnection: drawing }),
    editorPosition: { x: 0, y: 0 },
    setEditorPosition: (position) => set({ editorPosition: position }),
    mousePosition: { x: 0, y: 0 },
    setMousePosition: (position) => set({ mousePosition: position }),
    selectedNodes: [],
    setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
    clickSelect: true,
    setClickSelect: (clickSelect) => set({ clickSelect: clickSelect }),
    shiftSelectMore: false,
    setShiftSelectMore: (shiftSelectMore) => set({ shiftSelectMore: shiftSelectMore }),
    controlDeselectOne: false,
    setControlDeselectOne: (controlDeselectOne) => set({ controlDeselectOne: controlDeselectOne }),
    boxSelect: false,
    setBoxSelect: (boxSelect) => set({ boxSelect: boxSelect }),
    bottomBarView: BottomBarView.Debug,
    setBottomBarView: (view) => set({ bottomBarView: view }),
    contextMenu: { visible: false, x: 0, y: 0, items: [] },
    openContextMenu: (x, y, items) =>
        set({ contextMenu: { visible: true, x, y, items } }),
    closeContextMenu: () =>
        set({ contextMenu: { visible: false, x: 0, y: 0, items: [] } }),
    openGroup: null,
    setOpenGroup: (groupId) => set({ openGroup: groupId }),
}));
