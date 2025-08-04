import { create } from 'zustand';

export interface DrawingNote {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number; // in degrees
    text: string;
    color: string;
    fontSize: number;
    versionId: string;
}

export interface DrawingShape {
    id: string;
    type: 'rectangle' | 'circle' | 'line';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    strokeWidth: number;
    versionId: string;
}

export interface DrawingPath {
    id: string;
    points: number[];
    color: string;
    strokeWidth: number;
    versionId: string;
}

export interface DrawingImage {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number; // in degrees
    src: string; // base64 encoded
    originalWidth: number;
    originalHeight: number;
    versionId: string;
}

interface DrawingState {
    notes: DrawingNote[];
    shapes: DrawingShape[];
    paths: DrawingPath[];
    images: DrawingImage[];
    selectedObjectId: string | null;
    currentColor: string;
    currentTool: 'select' | 'note' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'image';
    strokeWidth: number;
    isDrawing: boolean;
    
    // Note actions
    addNote: (note: Omit<DrawingNote, 'id'>) => void;
    updateNote: (id: string, updates: Partial<DrawingNote>) => void;
    deleteNote: (id: string) => void;
    
    // Shape actions
    addShape: (shape: Omit<DrawingShape, 'id'>) => void;
    updateShape: (id: string, updates: Partial<DrawingShape>) => void;
    deleteShape: (id: string) => void;
    
    // Path actions
    addPath: (path: Omit<DrawingPath, 'id'>) => void;
    updatePath: (id: string, updates: Partial<DrawingPath>) => void;
    deletePath: (id: string) => void;
    
    // Image actions
    addImage: (image: Omit<DrawingImage, 'id'>) => void;
    updateImage: (id: string, updates: Partial<DrawingImage>) => void;
    deleteImage: (id: string) => void;
    
    // Selection
    setSelectedObject: (id: string | null) => void;
    
    // Tool and settings
    setCurrentTool: (tool: 'select' | 'note' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'image') => void;
    setCurrentColor: (color: string) => void;
    setStrokeWidth: (width: number) => void;
    
    // Drawing state
    setIsDrawing: (isDrawing: boolean) => void;
    
}

const useDrawingStore = create<DrawingState>((set, get) => ({
    notes: [],
    shapes: [],
    paths: [],
    images: [],
    selectedObjectId: null,
    currentColor: '#38bdf8',
    currentTool: 'select',
    strokeWidth: 2,
    isDrawing: false,
    
    addNote: (noteData) => {
        const note: DrawingNote = {
            ...noteData,
            id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        set((state) => ({
            notes: [...state.notes, note]
        }));
    },
    
    updateNote: (id, updates) => {
        set((state) => ({
            notes: state.notes.map(note => 
                note.id === id ? { ...note, ...updates } : note
            )
        }));
    },
    
    deleteNote: (id) => {
        set((state) => ({
            notes: state.notes.filter(note => note.id !== id),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }));
    },
    
    addShape: (shapeData) => {
        const shape: DrawingShape = {
            ...shapeData,
            id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        set((state) => ({
            shapes: [...state.shapes, shape]
        }));
    },
    
    updateShape: (id, updates) => {
        set((state) => ({
            shapes: state.shapes.map(shape => 
                shape.id === id ? { ...shape, ...updates } : shape
            )
        }));
    },
    
    deleteShape: (id) => {
        set((state) => ({
            shapes: state.shapes.filter(shape => shape.id !== id),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }));
    },
    
    setSelectedObject: (id) => {
        set({ selectedObjectId: id });
    },
    
    addPath: (pathData) => {
        const path: DrawingPath = {
            ...pathData,
            id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        set((state) => ({
            paths: [...state.paths, path]
        }));
    },
    
    updatePath: (id, updates) => {
        set((state) => ({
            paths: state.paths.map(path => 
                path.id === id ? { ...path, ...updates } : path
            )
        }));
    },
    
    deletePath: (id) => {
        set((state) => ({
            paths: state.paths.filter(path => path.id !== id),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }));
    },
    
    addImage: (imageData) => {
        const image: DrawingImage = {
            ...imageData,
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        set((state) => ({
            images: [...state.images, image]
        }));
    },
    
    updateImage: (id, updates) => {
        set((state) => ({
            images: state.images.map(image => 
                image.id === id ? { ...image, ...updates } : image
            )
        }));
    },
    
    deleteImage: (id) => {
        set((state) => ({
            images: state.images.filter(image => image.id !== id),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }));
    },
    
    setCurrentTool: (tool) => {
        set({ currentTool: tool });
    },
    
    setCurrentColor: (color) => {
        set({ currentColor: color });
    },
    
    setStrokeWidth: (width) => {
        set({ strokeWidth: width });
    },
    
    setIsDrawing: (isDrawing) => {
        set({ isDrawing });
    }
}));

export default useDrawingStore;