import { create } from 'zustand';
import { FormType } from "@/types/types";

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
    activeProjectId: string | null;
    setActiveProjectId: (projectId: string) => void;
    activeRouteId: string | null;
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
    boxSelectPosition: { lx: number; ly: number; rx: number; ry: number };
    setBoxSelectPosition: (position: { lx: number; ly: number; rx: number; ry: number }) => void;
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
    activeProjectId: null,
    setActiveProjectId: (projectId: string) => set({ activeProjectId: projectId }),
    activeRouteId: null,
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
    boxSelectPosition: { lx: 0, ly: 0, rx: 0, ry: 0 },
    setBoxSelectPosition: (position) => set({ boxSelectPosition: position }),
}));
