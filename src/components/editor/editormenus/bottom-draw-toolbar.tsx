import React, { useState } from "react";
import { PencilIcon, PhotoIcon, RectangleGroupIcon, ChatBubbleLeftIcon, CursorArrowRaysIcon } from "@heroicons/react/24/outline";
import { BackspaceIcon } from "@heroicons/react/24/solid";
import useEditorStore from "@/stores/editorStore";
import useDrawingStore from "@/stores/drawingStore";
import { EditorMode } from "@/types/types";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

const BottomDrawToolbar: React.FC = () => {
  const editorMode = useEditorStore((state) => state.editorMode);
  const previousEditorMode = useEditorStore((state) => state.previousEditorMode);
  const activeVersionId = useEditorStore((state) => state.activeVersionId);
  const [showShapes, setShowShapes] = useState(false);
  
  // Drawing store
  const currentColor = useDrawingStore((state) => state.currentColor);
  const currentTool = useDrawingStore((state) => state.currentTool);
  const strokeWidth = useDrawingStore((state) => state.strokeWidth);
  const setCurrentColor = useDrawingStore((state) => state.setCurrentColor);
  const setCurrentTool = useDrawingStore((state) => state.setCurrentTool);
  const setStrokeWidth = useDrawingStore((state) => state.setStrokeWidth);
  const addNote = useDrawingStore((state) => state.addNote);

  const colors = [
    "#000000",
    "#ffffff",
    "#38bdf8",
    "#22c55e",
    "#facc15",
    "#f97316",
    "#ef4444",
    "#8b5cf6",
  ];

  const showToolbar =
    editorMode === EditorMode.Draw ||
    (editorMode === EditorMode.Pan && previousEditorMode === EditorMode.Draw);

  const handleAddNote = () => {
    setCurrentTool('note');
    if (activeVersionId) {
      addNote({
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
        text: 'Double click to edit...',
        color: currentColor,
        fontSize: 14,
        versionId: activeVersionId
      });
    }
  };

  const handleSelectTool = (tool: 'select' | 'note' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'image') => {
    setCurrentTool(tool);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && activeVersionId) {
        try {
          const { createImageFromFile } = await import('@/utils/imageUtils');
          const imageData = await createImageFromFile(file, 100, 100, activeVersionId);
          const { addImage } = useDrawingStore.getState();
          addImage(imageData);
        } catch (error) {
          console.error('Failed to upload image:', error);
          alert(error instanceof Error ? error.message : 'Failed to upload image');
        }
      }
    };
    input.click();
  };

  return (
    <AnimatePresence>
      {showToolbar && (
        <motion.div
          key="draw-toolbar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="absolute bottom-4 left-1/2 z-40 px-4 py-2 bg-zinc-800/90 border border-white/25 rounded-xl shadow-lg flex items-center space-x-4"
          style={{ translateX: "-50%" }}
        >
          <button
            className={`p-2 rounded hover:bg-zinc-700 ${currentTool === 'select' ? 'bg-sky-500' : ''}`}
            onClick={() => handleSelectTool('select')}
            title="Select Tool"
          >
            <CursorArrowRaysIcon className="w-5 h-5 text-white" />
          </button>

          <button
            className={`p-2 rounded hover:bg-zinc-700 ${currentTool === 'note' ? 'bg-sky-500' : ''}`}
            onClick={handleAddNote}
            title="Add Note"
          >
            <ChatBubbleLeftIcon className="w-5 h-5 text-white" />
          </button>

          <button
            className="p-2 rounded hover:bg-zinc-700"
            onClick={() => setShowShapes(!showShapes)}
            title="Shapes"
          >
            <RectangleGroupIcon className="w-5 h-5 text-white" />
          </button>

          {showShapes && (
            <div className="flex space-x-2">
              <button className="p-2 rounded hover:bg-zinc-700">
                <div className="w-4 h-4 bg-white border border-zinc-300" />
              </button>
              <button className="p-2 rounded hover:bg-zinc-700">
                <div className="w-4 h-4 bg-white border border-zinc-300 rounded-full" />
              </button>
              <button className="p-2 rounded hover:bg-zinc-700">
                <div className="w-4 h-2 bg-white border border-zinc-300 rotate-45" />
              </button>
            </div>
          )}

          <div className="flex items-center space-x-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={clsx(
                  "w-5 h-5 rounded-full border border-white",
                  currentColor === color ? "ring-2 ring-white" : ""
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <button 
            className={`p-2 rounded hover:bg-zinc-700 ${currentTool === 'pen' ? 'bg-sky-500' : ''}`}
            onClick={() => handleSelectTool('pen')}
            title="Free Drawing (P)"
          >
            <PencilIcon className="w-5 h-5 text-white" />
          </button>

          <button 
            className={`p-2 rounded hover:bg-zinc-700 ${currentTool === 'eraser' ? 'bg-sky-500' : ''}`}
            onClick={() => handleSelectTool('eraser')}
            title="Eraser (E)"
          >
            <BackspaceIcon className="w-5 h-5 text-white" />
          </button>

          {/* Stroke Width Control */}
          {(currentTool === 'pen' || currentTool === 'eraser') && (
            <div className="flex items-center space-x-1 px-2">
              {[1, 2, 4, 6, 8].map((width) => (
                <button
                  key={width}
                  onClick={() => setStrokeWidth(width)}
                  className={`p-1 rounded hover:bg-zinc-700 ${strokeWidth === width ? 'bg-sky-500' : ''}`}
                  title={`${width}px thickness`}
                >
                  <div 
                    className="bg-white rounded-full"
                    style={{ 
                      width: `${Math.max(4, width)}px`, 
                      height: `${Math.max(4, width)}px` 
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <button 
            className={`p-2 rounded hover:bg-zinc-700 ${currentTool === 'image' ? 'bg-sky-500' : ''}`}
            onClick={handleImageUpload}
            title="Upload Image/GIF"
          >
            <PhotoIcon className="w-5 h-5 text-white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomDrawToolbar;